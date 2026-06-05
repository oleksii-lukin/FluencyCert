import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'
import { getPostHogClient } from '@/lib/posthog-server'

const postAj = aj.withRule(
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

  const decision = await postAj.protect(request, { userId })
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { slug } = await params

  const { data: targetClaim } = await supabase
    .from('certificate_claims')
    .select('id')
    .eq('slug', slug.toUpperCase())
    .eq('status', 'approved')
    .single()

  if (!targetClaim) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  const id = targetClaim.id

  const { data: ownClaim } = await supabase
    .from('certificate_claims')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .maybeSingle()

  if (!ownClaim) {
    return NextResponse.json({ error: 'You need an approved certificate to leave feedback' }, { status: 403 })
  }

  if (ownClaim.id === id) {
    return NextResponse.json({ error: 'Cannot leave feedback on your own certificate' }, { status: 403 })
  }

  const { data: existing } = await supabase
    .from('certificate_feedback')
    .select('id')
    .eq('certificate_id', id)
    .eq('reviewer_id', userId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'You already left feedback on this certificate' }, { status: 409 })
  }

  const body = await request.json()
  const { feedback_text, display_name_preference, linkedin_url } = body

  if (!feedback_text || typeof feedback_text !== 'string' || feedback_text.trim().length === 0) {
    return NextResponse.json({ error: 'feedback_text is required' }, { status: 400 })
  }

  if (feedback_text.trim().length > 500) {
    return NextResponse.json({ error: 'feedback_text must be 500 characters or less' }, { status: 400 })
  }

  const pref = display_name_preference === 'full_name' ? 'full_name' : 'nickname'

  const { data: maxOrder } = await supabase
    .from('certificate_feedback')
    .select('sort_order')
    .eq('certificate_id', id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder = (maxOrder?.sort_order ?? -1) + 1

  const { data: feedback, error } = await supabase
    .from('certificate_feedback')
    .insert({
      certificate_id: id,
      reviewer_id: userId,
      feedback_text: feedback_text.trim(),
      display_name_preference: pref,
      linkedin_url: linkedin_url || null,
      sort_order: nextOrder,
      status: 'pending',
      is_visible: false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const posthog = getPostHogClient()
  posthog.capture({
    distinctId: userId,
    event: 'certificate_feedback_submitted',
    properties: {
      certificate_slug: slug,
      display_name_preference: pref,
    },
  })

  return NextResponse.json({ feedback }, { status: 201 })
}
