import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createAdminClient()
  const { slug } = await params

  const { data: claim } = await supabase
    .from('certificate_claims')
    .select('id, user_id')
    .eq('slug', slug.toUpperCase())
    .single()

  if (!claim) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  if (claim.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const id = claim.id

  const { data: feedbacks, error } = await supabase
    .from('certificate_feedback')
    .select('*, profiles!inner(id, first_name, last_name, username, avatar_url)')
    .eq('certificate_id', id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[certificates/[slug]/owner/feedback] Failed to fetch feedbacks', { slug, userId, error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let feedbacksWithCertIds = feedbacks
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

  return NextResponse.json({ feedbacks: feedbacksWithCertIds })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[certificates/[slug]/owner/feedback] Unexpected error', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
