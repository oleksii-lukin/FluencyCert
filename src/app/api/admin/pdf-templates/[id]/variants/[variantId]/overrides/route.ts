import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'
import { isClubAdmin, isMasterAdmin } from '@/lib/clubs'

const ajInstance = aj.withRule(
  slidingWindow({ mode: 'LIVE', interval: 60, max: 20, characteristics: ['userId'] }),
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const decision = await ajInstance.protect(request, { userId })
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { id, variantId } = await params

  const accessError = await checkTemplateAccess(userId, id, supabase)
  if (accessError) return accessError

  const { data: overrides, error } = await supabase
    .from('pdf_template_field_overrides')
    .select('*')
    .eq('variant_id', variantId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ overrides })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const decision = await ajInstance.protect(request, { userId })
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { id, variantId } = await params

  const accessError = await checkTemplateAccess(userId, id, supabase)
  if (accessError) return accessError

  const { data: variant } = await supabase
    .from('pdf_template_variants')
    .select('id')
    .eq('id', variantId)
    .eq('template_id', id)
    .single()

  if (!variant) {
    return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
  }

  const body = await request.json()
  const { overrides } = body

  if (!Array.isArray(overrides)) {
    return NextResponse.json({ error: 'overrides must be an array' }, { status: 400 })
  }

  const upsertData = overrides.map((o: Record<string, unknown>) => ({
    variant_id: variantId,
    field_id: o.field_id as string,
    font_family: (o.font_family as string) ?? null,
    font_size: (o.font_size as number) ?? null,
    font_source: (o.font_source as string) ?? null,
    font_variant: (o.font_variant as string) ?? null,
    uploaded_font_key: (o.uploaded_font_key as string) ?? null,
    font_id: (o.font_id as string) ?? null,
    text_color: (o.text_color as string) ?? null,
    display_label: (o.display_label as string) ?? null,
    is_enabled: (o.is_enabled as boolean) ?? null,
    multiline: (o.multiline as boolean) ?? null,
    date_format: (o.date_format as string) ?? null,
    level_format: (o.level_format as string) ?? null,
    custom_default_value: (o.custom_default_value as string) ?? null,
    custom_overridable: (o.custom_overridable as boolean) ?? null,
    qr_dots_color: (o.qr_dots_color as string) ?? null,
    qr_bg_color: (o.qr_bg_color as string) ?? null,
    qr_dots_type: (o.qr_dots_type as string) ?? null,
    qr_corners_type: (o.qr_corners_type as string) ?? null,
    qr_corners_color: (o.qr_corners_color as string) ?? null,
  }))

  const { data: saved, error } = await supabase
    .from('pdf_template_field_overrides')
    .upsert(upsertData, { onConflict: 'variant_id,field_id' })
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ overrides: saved })
}
