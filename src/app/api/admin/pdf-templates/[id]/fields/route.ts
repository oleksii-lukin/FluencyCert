import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'
import { isClubAdmin, isMasterAdmin } from '@/lib/clubs'

const fieldsAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 30, characteristics: ["userId"] }),
)

async function checkTemplateAccess(userId: string, templateId: string, supabase: ReturnType<typeof createAdminClient>) {
  const isMaster = await isMasterAdmin(userId)
  if (isMaster) return null

  const { data: tpl } = await supabase
    .from('pdf_templates')
    .select('club_id')
    .eq('id', templateId)
    .single()

  if (!tpl) return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  if (tpl.club_id) {
    const isAdmin = await isClubAdmin(userId, tpl.club_id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return null
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const decision = await fieldsAj.protect(request, { userId })
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()

  const accessError = await checkTemplateAccess(userId, (await params).id, supabase)
  if (accessError) return accessError

  const [{ id: templateId }, body] = await Promise.all([params, request.json()])
  const { fields } = body

  if (!Array.isArray(fields)) {
    return NextResponse.json({ error: 'fields must be an array' }, { status: 400 })
  }

  const fieldIds = fields
    .filter((f: { id: string }) => f.id)
    .map((f: { id: string }) => f.id)

  if (fieldIds.length > 0) {
    const { data: existing } = await supabase
      .from('pdf_template_fields')
      .select('id')
      .eq('template_id', templateId)

    const existingIds = existing?.map((e) => e.id) ?? []
    const invalidIds = fieldIds.filter((id) => !existingIds.includes(id))
    if (invalidIds.length > 0) {
      return NextResponse.json({ error: 'Some field IDs do not belong to this template' }, { status: 400 })
    }
  }

  const updates = fields.map((field: {
    id?: string
    pdf_field_name: string
    source_type: string
    source_key?: string | null
    display_label: string
    is_enabled: boolean
    font_family: string
    font_size: number
    font_source: string
    font_variant?: string
    uploaded_font_key?: string | null
    custom_default_value?: string | null
    custom_overridable: boolean
    date_format?: string | null
    level_format?: string | null
    text_color?: string | null
    qr_dots_color?: string
    qr_bg_color?: string
    qr_dots_type?: string
    qr_corners_type?: string
    qr_corners_color?: string
    sort_order: number
  }, index: number) => ({
    id: field.id,
    pdf_field_name: field.pdf_field_name,
    source_type: field.source_type,
    source_key: field.source_key ?? null,
    display_label: field.display_label,
    is_enabled: field.is_enabled,
    font_family: field.font_family,
    font_size: field.font_size,
    font_source: field.font_source,
    font_variant: field.font_variant ?? 'regular',
    uploaded_font_key: field.uploaded_font_key ?? null,
    custom_default_value: field.custom_default_value ?? null,
    custom_overridable: field.custom_overridable,
    date_format: field.date_format ?? null,
    level_format: field.level_format ?? null,
    text_color: field.text_color ?? null,
    qr_dots_color: field.qr_dots_color ?? '#1a1a2e',
    qr_bg_color: field.qr_bg_color ?? '#FFFFFF',
    qr_dots_type: field.qr_dots_type ?? 'rounded',
    qr_corners_type: field.qr_corners_type ?? 'square',
    qr_corners_color: field.qr_corners_color ?? '#1a1a2e',
    sort_order: field.sort_order ?? index,
    template_id: templateId,
  }))

  const { data: saved, error } = await supabase
    .from('pdf_template_fields')
    .upsert(updates, { onConflict: 'id' })
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ fields: saved })
}
