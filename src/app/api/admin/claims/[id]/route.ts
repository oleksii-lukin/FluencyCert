import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'
import { isClubAdmin, isMasterAdmin } from '@/lib/clubs'
import { getPostHogClient } from '@/lib/posthog-server'
import { UTApi } from 'uploadthing/server'

const updateAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 30, characteristics: ["userId"] }),
)

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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

    const isMaster = await isMasterAdmin(userId)

    if (!isMaster) {
      const { data: claim } = await supabase
        .from('certificate_claims')
        .select('club_id')
        .eq('id', (await params).id)
        .single()

      if (!claim?.club_id || !(await isClubAdmin(userId, claim.club_id))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const [{ id }, body] = await Promise.all([params, request.json()])
    const { slug: newSlug, status, admin_feedback, english_level, speaking_clubs_count, hours_participated, background_template, pdf_template_id, pdf_template_variant_id, custom_values, pdf_file_url, pdf_file_key } = body

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

      // Slug-only update shortcut (only non-status fields)
      const hasOnlySlug = status === undefined &&
        admin_feedback === undefined &&
        english_level === undefined &&
        speaking_clubs_count === undefined &&
        hours_participated === undefined &&
        background_template === undefined &&
        pdf_template_id === undefined &&
        pdf_template_variant_id === undefined &&
        custom_values === undefined &&
        pdf_file_url === undefined &&
        pdf_file_key === undefined

      if (hasOnlySlug) {
        const { data: claim, error } = await supabase
          .from('certificate_claims')
          .update({ slug: upperSlug })
          .eq('id', id)
          .select()
          .single()

        if (error) {
          console.error('[admin/claims/[id]] Slug update error', { userId, id, slug: upperSlug, error: error.message })
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ claim })
      }
    }

    const { data: existing } = await supabase
      .from('certificate_claims')
      .select('id, status, pdf_file_key')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    const isUpdate = status === undefined
    const effectiveStatus = isUpdate ? existing.status : status

    if (!isUpdate && (!status || !['approved', 'rejected'].includes(status))) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    if (typeof admin_feedback !== 'string' || admin_feedback.trim().length === 0) {
      return NextResponse.json({ error: 'admin_feedback is required' }, { status: 400 })
    }

    const updateData: {
      status?: string
      admin_feedback?: string
      slug?: string
      pdf_template_id?: string
      pdf_template_variant_id?: string
      english_level?: string
      speaking_clubs_count?: number
      hours_participated?: number
      background_template?: string
      approved_at?: string
      pdf_file_url?: string
      pdf_file_key?: string
    } = {
      status: effectiveStatus,
      admin_feedback: admin_feedback.trim(),
    }

    if (!isUpdate && effectiveStatus === 'approved') {
      updateData.approved_at = new Date().toISOString()
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

      if (pdf_template_variant_id) {
        const { data: variant } = await supabase
          .from('pdf_template_variants')
          .select('id')
          .eq('id', pdf_template_variant_id)
          .eq('template_id', pdf_template_id)
          .single()

        if (!variant) {
          return NextResponse.json({ error: 'PDF template variant not found for this template' }, { status: 404 })
        }

        updateData.pdf_template_variant_id = pdf_template_variant_id
      }

      const { data: templateDbFields } = await supabase
        .from('pdf_template_fields')
        .select('source_key')
        .eq('template_id', pdf_template_id)
        .eq('source_type', 'database')

      const dbKeys = new Set(templateDbFields?.flatMap((f) => f.source_key ? [f.source_key] : []) ?? [])

      if (dbKeys.has('englishLevel')) {
        if (!english_level || typeof english_level !== 'string') {
          return NextResponse.json({ error: 'english_level is required when approving' }, { status: 400 })
        }
        updateData.english_level = english_level.trim()
      }

      if (dbKeys.has('speakingClubsCount')) {
        if (speaking_clubs_count == null || typeof speaking_clubs_count !== 'number') {
          return NextResponse.json({ error: 'speaking_clubs_count is required when approving' }, { status: 400 })
        }
        updateData.speaking_clubs_count = speaking_clubs_count
      }

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

        const valuesToUpsert: { claim_id: string; field_id: string; value: string }[] = []
        for (const cv of custom_values) {
          if (validFieldIds.has(cv.field_id)) {
            valuesToUpsert.push({
              claim_id: id,
              field_id: cv.field_id,
              value: cv.value,
            })
          }
        }

        if (valuesToUpsert.length > 0) {
          const { error: cvError } = await supabase
            .from('pdf_custom_values')
            .upsert(valuesToUpsert, { onConflict: 'claim_id,field_id' })

          if (cvError) {
            console.error('[admin/claims/[id]] Custom values upsert error', { userId, id, error: cvError.message })
            return NextResponse.json({ error: cvError.message }, { status: 500 })
          }
        }
      }
    } else if (effectiveStatus === 'approved') {
      if (!isUpdate) {
        if (!english_level || typeof english_level !== 'string') {
          return NextResponse.json({ error: 'english_level is required when approving' }, { status: 400 })
        }
        if (speaking_clubs_count == null || typeof speaking_clubs_count !== 'number') {
          return NextResponse.json({ error: 'speaking_clubs_count is required when approving' }, { status: 400 })
        }
      }
      if (english_level) {
        updateData.english_level = english_level.trim()
      }
      if (speaking_clubs_count != null) {
        updateData.speaking_clubs_count = speaking_clubs_count
      }
      if (hours_participated != null) {
        updateData.hours_participated = hours_participated
      }
      if (background_template) {
        updateData.background_template = background_template
      }
    }

    if (pdf_file_url !== undefined) {
      updateData.pdf_file_url = pdf_file_url
    }
    if (pdf_file_key !== undefined) {
      updateData.pdf_file_key = pdf_file_key

      // Clean up old file from UploadThing before overwriting
      if (existing.pdf_file_key && existing.pdf_file_key !== pdf_file_key) {
        const utapi = new UTApi()
        await utapi.deleteFiles(existing.pdf_file_key).catch((e) => {
          console.error('[admin/claims/[id]] Failed to delete old PDF file', { key: existing.pdf_file_key, error: e })
        })
      }
    }

    const { data: claim, error } = await supabase
      .from('certificate_claims')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[admin/claims/[id]] Update error', { userId, id, error: error.message })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!isUpdate && claim.user_id && (status === 'approved' || status === 'rejected')) {
      const posthog = getPostHogClient()
      posthog.capture({
        distinctId: claim.user_id,
        event: status === 'approved' ? 'certificate_claim_approved' : 'certificate_claim_rejected',
        properties: {
          claim_id: id,
          english_level: claim.english_level ?? null,
        },
      })
    }

    return NextResponse.json({ claim })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[admin/claims/[id]] Unexpected error', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
