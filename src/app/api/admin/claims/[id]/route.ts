import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'

const updateAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 30, characteristics: ["userId"] }),
)

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { status, admin_feedback, english_level, speaking_clubs_count, hours_participated, background_template } = body

  if (!status || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  if (typeof admin_feedback !== 'string' || admin_feedback.trim().length === 0) {
    return NextResponse.json({ error: 'admin_feedback is required' }, { status: 400 })
  }

  if (status === 'approved') {
    if (!english_level || typeof english_level !== 'string') {
      return NextResponse.json({ error: 'english_level is required when approving' }, { status: 400 })
    }
    if (speaking_clubs_count == null || typeof speaking_clubs_count !== 'number') {
      return NextResponse.json({ error: 'speaking_clubs_count is required when approving' }, { status: 400 })
    }
  }

  const { data: existing } = await supabase
    .from('certificate_claims')
    .select('id, status')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
  }

  if (existing.status !== 'pending') {
    return NextResponse.json({ error: 'Claim is not pending' }, { status: 400 })
  }

  const updateData: {
    status: string
    admin_feedback: string
    english_level?: string
    speaking_clubs_count?: number
    hours_participated?: number
    background_template?: string
  } = {
    status,
    admin_feedback: admin_feedback.trim(),
  }

  if (status === 'approved') {
    updateData.english_level = english_level.trim()
    updateData.speaking_clubs_count = speaking_clubs_count
    if (hours_participated != null) {
      updateData.hours_participated = hours_participated
    }
    if (background_template) {
      updateData.background_template = background_template
    }
  }

  const { data: claim, error } = await supabase
    .from('certificate_claims')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ claim })
}
