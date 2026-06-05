import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'
import { getPostHogClient } from '@/lib/posthog-server'

const joinAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 10, characteristics: ["userId"] }),
)

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const decision = await joinAj.protect(request, { userId })
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

  const { data: existing } = await supabase
    .from('club_memberships')
    .select('id')
    .eq('club_id', club.id)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ membership: { club_id: club.id, user_id: userId, role: 'member' } })
  }

  const { data: membership, error } = await supabase
    .from('club_memberships')
    .insert({ club_id: club.id, user_id: userId, role: 'member' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const posthog = getPostHogClient()
  posthog.capture({
    distinctId: userId,
    event: 'club_member_joined',
    properties: { club_slug: slug, club_id: club.id },
  })

  return NextResponse.json({ membership }, { status: 201 })
}
