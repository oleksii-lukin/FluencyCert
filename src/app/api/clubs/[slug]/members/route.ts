import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'
import { requireClubAdminOrMaster } from '@/lib/clubs'

const listAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 30, characteristics: ["userId"] }),
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

  const forbidden = await requireClubAdminOrMaster(userId, club.id)
  if (forbidden) return forbidden

  const { data: members } = await supabase
    .from('club_memberships')
    .select('user_id, role, created_at, profiles!inner(id, email, first_name, last_name, avatar_url)')
    .eq('club_id', club.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({
    members: (members ?? []).map((m) => ({
      user_id: m.user_id,
      email: m.profiles.email,
      first_name: m.profiles.first_name,
      last_name: m.profiles.last_name,
      avatar_url: m.profiles.avatar_url,
      role: m.role,
      joined_at: m.created_at,
    })),
  })
}
