import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'

const postAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 20, characteristics: ["userId"] }),
)

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const decision = await postAj.protect(request, { userId })
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { id } = await params

  const { data: targetClaim } = await supabase
    .from('certificate_claims')
    .select('id')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (!targetClaim) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  const { data: ownClaim } = await supabase
    .from('certificate_claims')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .maybeSingle()

  if (!ownClaim) {
    return NextResponse.json({ error: 'You need an approved certificate to upvote' }, { status: 403 })
  }

  if (ownClaim.id === id) {
    return NextResponse.json({ error: 'Cannot upvote your own certificate' }, { status: 403 })
  }

  const { data: existing } = await supabase
    .from('certificate_upvotes')
    .select('id')
    .eq('certificate_id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('certificate_upvotes')
      .delete()
      .eq('id', existing.id)
  } else {
    await supabase
      .from('certificate_upvotes')
      .insert({ certificate_id: id, user_id: userId })
  }

  const { count: upvoteCount } = await supabase
    .from('certificate_upvotes')
    .select('id', { count: 'exact', head: true })
    .eq('certificate_id', id)

  return NextResponse.json({
    hasUpvoted: !existing,
    upvoteCount: upvoteCount ?? 0,
  })
}
