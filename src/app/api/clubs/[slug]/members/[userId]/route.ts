import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'
import { requireClubAdminOrMaster } from '@/lib/clubs'

const manageAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 20, characteristics: ["userId"] }),
)

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; userId: string }> },
) {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const decision = await manageAj.protect(request, { userId: currentUserId })
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { slug, userId: targetUserId } = await params
  const supabase = createAdminClient()

  const { data: club } = await supabase
    .from('speaking_clubs')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!club) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 })
  }

  const forbidden = await requireClubAdminOrMaster(currentUserId, club.id)
  if (forbidden) return forbidden

  if (currentUserId === targetUserId) {
    return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
  }

  const body = await request.json()
  const { role } = body

  if (!role || !['member', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Role must be member or admin' }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from('club_memberships')
    .select('id')
    .eq('club_id', club.id)
    .eq('user_id', targetUserId)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'User is not a member of this club' }, { status: 404 })
  }

  const { error } = await supabase
    .from('club_memberships')
    .update({ role })
    .eq('id', membership.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string; userId: string }> },
) {
  const { userId: currentUserId } = await auth()
  if (!currentUserId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const decision = await manageAj.protect(request, { userId: currentUserId })
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { slug, userId: targetUserId } = await params
  const supabase = createAdminClient()

  const { data: club } = await supabase
    .from('speaking_clubs')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!club) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 })
  }

  const forbidden = await requireClubAdminOrMaster(currentUserId, club.id)
  if (forbidden) return forbidden

  if (currentUserId === targetUserId) {
    return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
  }

  const { error } = await supabase
    .from('club_memberships')
    .delete()
    .eq('club_id', club.id)
    .eq('user_id', targetUserId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
