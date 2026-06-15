import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'
import { requireClubAdminOrMaster, isClubMember, isClubAdmin } from '@/lib/clubs'

const getAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 30, characteristics: ["ip"] }),
)

const updateAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 20, characteristics: ["userId"] }),
)

const deleteAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 5, characteristics: ["userId"] }),
)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const decision = await getAj.protect(request, { ip: request.headers.get('x-forwarded-for') ?? '' })
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
    .select('*')
    .eq('slug', slug)
    .single()

  if (!club) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 })
  }

  const [{ count: memberCount }, { userId }] = await Promise.all([
    supabase.from('club_memberships').select('*', { count: 'exact', head: true }).eq('club_id', club.id),
    auth(),
  ])
  let is_member = false
  let is_club_admin = false

  if (userId) {
    [is_member, is_club_admin] = await Promise.all([isClubMember(userId, club.id), isClubAdmin(userId, club.id)])
  }

  return NextResponse.json({
    club: {
      ...club,
      member_count: memberCount ?? 0,
      is_member,
      is_admin: is_club_admin,
    },
  })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[clubs/[slug]] Unexpected error in GET', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const decision = await updateAj.protect(request, { userId })
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
  const updateData = {
    ...(body.name !== undefined ? { name: body.name.trim() } : {}),
    ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
    ...(body.translations !== undefined ? { translations: body.translations } : {}),
  }

  const { data: updated, error } = await supabase
    .from('speaking_clubs')
    .update(updateData)
    .eq('id', club.id)
    .select()
    .single()

  if (error) {
    console.error('[clubs/[slug]] Failed to update club', { slug, userId, error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ club: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[clubs/[slug]] Unexpected error in PATCH', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const decision = await deleteAj.protect(request, { userId })
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

  const masterAdmin = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (!masterAdmin.data?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('speaking_clubs')
    .delete()
    .eq('id', club.id)

  if (error) {
    console.error('[clubs/[slug]] Failed to delete club', { slug, userId, error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[clubs/[slug]] Unexpected error in DELETE', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
