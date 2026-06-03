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
  const { slug: newSlug, status, admin_feedback, english_level, speaking_clubs_count, hours_participated, background_template, pdf_template_id, custom_values } = body

  if (newSlug !== undefined) {
    const upperSlug = newSlug.toUpperCase()
    if (typeof newSlug !== 'string' || !/^[A-Z0-9]+$/.test(upperSlug)) {
      return NextResponse.json({ error: 'Slug must contain only uppercase letters and digits' }, { status: 400 })
    }
    if (upperSlug.length < 1 || upperSlug.length > 20) {
      return NextResponse.json({ error: 'Slug must be 1–20 characters' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('certificate_claims')
      .select('id')
      .eq('slug', upperSlug)
      .neq('id', id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'This slug is already in use' }, { status: 409 })
    }

    if (!status) {
      const { data: claim, error } = await supabase
        .from('certificate_claims')
        .update({ slug: upperSlug })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ claim })
    }
  }

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
    slug?: string
    pdf_template_id?: string
    english_level?: string
    speaking_clubs_count?: number
    hours_participated?: number
    background_template?: string
  } = {
    status,
    admin_feedback: admin_feedback.trim(),
  }

  if (newSlug !== undefined) {
    updateData.slug = newSlug.toUpperCase()
  }

  if (pdf_template_id) {
    const { data: pdfTemplate } = await supabase
      .from('pdf_templates')
      .select('id')
      .eq('id', pdf_template_id)
      .single()

    if (!pdfTemplate) {
      return NextResponse.json({ error: 'PDF template not found' }, { status: 404 })
    }

    updateData.pdf_template_id = pdf_template_id
    updateData.english_level = english_level.trim()
    updateData.speaking_clubs_count = speaking_clubs_count
    if (hours_participated != null) {
      updateData.hours_participated = hours_participated
    }
    if (background_template) {
      updateData.background_template = background_template
    }

    if (custom_values && Array.isArray(custom_values)) {
      const { data: validFields } = await supabase
        .from('pdf_template_fields')
        .select('id, custom_overridable')
        .eq('template_id', pdf_template_id)
        .eq('custom_overridable', true)

      const validFieldIds = new Set(validFields?.map((f) => f.id) ?? [])

      const valuesToUpsert = custom_values
        .filter((cv: { field_id: string }) => validFieldIds.has(cv.field_id))
        .map((cv: { field_id: string; value: string }) => ({
          claim_id: id,
          field_id: cv.field_id,
          value: cv.value,
        }))

      if (valuesToUpsert.length > 0) {
        const { error: cvError } = await supabase
          .from('pdf_custom_values')
          .upsert(valuesToUpsert, { onConflict: 'claim_id,field_id' })

        if (cvError) {
          return NextResponse.json({ error: cvError.message }, { status: 500 })
        }
      }
    }
  } else if (status === 'approved') {
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
