import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'

const getAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 60, characteristics: ["ip"] }),
)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const decision = await getAj.protect(request, {
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '',
    })
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await auth()
  const supabase = createAdminClient()
  const { slug } = await params

  const { data: claim } = await supabase
    .from('certificate_claims')
    .select('*, profiles!inner(id, email, first_name, last_name, username, avatar_url)')
    .eq('slug', slug.toUpperCase())
    .single()

  if (!claim || claim.status !== 'approved') {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  const id = claim.id

  const [{ count: upvoteCount }, { data: feedbacks }] = await Promise.all([
    supabase.from('certificate_upvotes').select('id', { count: 'exact', head: true }).eq('certificate_id', id),
    supabase.from('certificate_feedback').select('*, profiles!inner(id, email, first_name, last_name, username, avatar_url)').eq('certificate_id', id).eq('is_visible', true).order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
  ])

  let feedbacksWithCertIds: Array<Record<string, unknown>> | null = null
  if (feedbacks && feedbacks.length > 0) {
    const reviewerIds = [...new Set(feedbacks.map((f) => f.reviewer_id))]
    const { data: reviewerClaims } = await supabase
      .from('certificate_claims')
      .select('user_id, id')
      .eq('status', 'approved')
      .in('user_id', reviewerIds)

    const certByUserId = new Map((reviewerClaims ?? []).map((c) => [c.user_id, c.id]))
    feedbacksWithCertIds = feedbacks.map((f) => ({
      ...f,
      reviewer_certificate_id: certByUserId.get(f.reviewer_id) || null,
    }))
  }

  let hasUpvoted = false
  let canLeaveFeedback = false

  if (userId) {
    const { data: existingUpvote } = await supabase
      .from('certificate_upvotes')
      .select('id')
      .eq('certificate_id', id)
      .eq('user_id', userId)
      .maybeSingle()

    hasUpvoted = !!existingUpvote

    const { data: ownClaim } = await supabase
      .from('certificate_claims')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .maybeSingle()

    if (ownClaim && ownClaim.id !== id) {
      const { data: existingFeedback } = await supabase
        .from('certificate_feedback')
        .select('id')
        .eq('certificate_id', id)
        .eq('reviewer_id', userId)
        .maybeSingle()

      canLeaveFeedback = !existingFeedback
    }
  }

  return NextResponse.json({
    certificate: claim,
    upvoteCount: upvoteCount ?? 0,
    feedbacks: feedbacksWithCertIds ?? feedbacks,
    hasUpvoted,
    canLeaveFeedback,
  })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[certificates/[slug]] Unexpected error', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
