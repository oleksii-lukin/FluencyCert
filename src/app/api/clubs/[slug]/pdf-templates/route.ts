import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'
import { requireClubAdminOrMaster, isClubAdmin, isMasterAdmin } from '@/lib/clubs'

const listAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 30, characteristics: ["userId"] }),
)

const createAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 10, characteristics: ["userId"] }),
)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const decision = await listAj.protect(request, { userId })
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { slug } = await params
  const supabase = createAdminClient()

  const { data: club } = await supabase
    .from('speaking_clubs')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!club) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 })
  }

  const [hasAdmin, hasMaster] = await Promise.all([isClubAdmin(userId, club.id), isMasterAdmin(userId)])
  if (!hasAdmin && !hasMaster) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: templates } = await supabase
    .from('pdf_templates')
    .select('*, pdf_template_fields(count), pdf_template_variants(count)')
    .eq('club_id', club.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ templates: templates ?? [] })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
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

  const { slug } = await params
  const supabase = createAdminClient()

  const { data: club } = await supabase
    .from('speaking_clubs')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!club) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 })
  }

  const forbidden = await requireClubAdminOrMaster(userId, club.id)
  if (forbidden) return forbidden

  const body = await request.json()
  const { name, description, file_url, file_key } = body

  if (!name || !file_url || !file_key) {
    return NextResponse.json({ error: 'name, file_url, and file_key are required' }, { status: 400 })
  }

  const { data: template, error } = await supabase
    .from('pdf_templates')
    .insert({ name, description, file_url, file_key, club_id: club.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ template })
}
