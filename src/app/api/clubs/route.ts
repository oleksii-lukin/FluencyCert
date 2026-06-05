import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'
import { requireMasterAdmin } from '@/lib/clubs'

const listAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 30, characteristics: ["ip"] }),
)

const createAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 10, characteristics: ["userId"] }),
)

export async function GET(request: Request) {
  const decision = await listAj.protect(request, { ip: request.headers.get('x-forwarded-for') ?? '' })
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { data: clubs } = await supabase
    .from('speaking_clubs')
    .select('id, name, slug, description, translations')
    .order('name', { ascending: true })

  const clubsWithCounts = await Promise.all(
    (clubs ?? []).map(async (club) => {
      const { count: memberCount } = await supabase
        .from('club_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', club.id)

      const { count: certCount } = await supabase
        .from('certificate_claims')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', club.id)
        .eq('status', 'approved')

      return { ...club, member_count: memberCount ?? 0, certificate_count: certCount ?? 0 }
    }),
  )

  return NextResponse.json({ clubs: clubsWithCounts })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const decision = await createAj.protect(request, { userId })
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const forbidden = await requireMasterAdmin(userId)
  if (forbidden) return forbidden

  const supabase = createAdminClient()
  const body = await request.json()
  const { name, slug, description } = body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  if (!slug || typeof slug !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length < 3 || slug.length > 50) {
    return NextResponse.json({ error: 'Slug must be 3-50 characters, lowercase letters, digits, and hyphens' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('speaking_clubs')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'This slug is already in use' }, { status: 409 })
  }

  const { data: club, error } = await supabase
    .from('speaking_clubs')
    .insert({ name: name.trim(), slug, description: description?.trim() || null })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ club }, { status: 201 })
}
