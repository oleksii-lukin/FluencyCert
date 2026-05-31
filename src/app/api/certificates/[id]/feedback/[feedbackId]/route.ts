import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'

const patchAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 30, characteristics: ["userId"] }),
)

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; feedbackId: string }> },
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const decision = await patchAj.protect(request, { userId })
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { id, feedbackId } = await params

  const { data: claim } = await supabase
    .from('certificate_claims')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!claim) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  const { data: feedback } = await supabase
    .from('certificate_feedback')
    .select('*')
    .eq('id', feedbackId)
    .eq('certificate_id', id)
    .single()

  if (!feedback) {
    return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
  }

  const body = await request.json()
  const isOwner = claim.user_id === userId
  const isAuthor = feedback.reviewer_id === userId

  if (!isOwner && !isAuthor) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updateData: {
    status?: string
    is_visible?: boolean
    sort_order?: number
    feedback_text?: string
    display_name_preference?: string
    linkedin_url?: string | null
  } = {}

  if (isOwner) {
    if ('status' in body) {
      if (!['pending', 'approved', 'rejected'].includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updateData.status = body.status
    }
    if ('is_visible' in body) {
      updateData.is_visible = body.is_visible
    }
    if ('sort_order' in body) {
      updateData.sort_order = body.sort_order
    }
  }

  if (isAuthor) {
    if ('feedback_text' in body) {
      if (typeof body.feedback_text !== 'string' || body.feedback_text.trim().length === 0) {
        return NextResponse.json({ error: 'feedback_text is required' }, { status: 400 })
      }
      updateData.feedback_text = body.feedback_text.trim()
    }
    if ('display_name_preference' in body) {
      updateData.display_name_preference = body.display_name_preference
    }
    if ('linkedin_url' in body) {
      updateData.linkedin_url = body.linkedin_url
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('certificate_feedback')
    .update(updateData)
    .eq('id', feedbackId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ feedback: updated })
}
