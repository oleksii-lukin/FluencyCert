import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'
import { UTApi } from 'uploadthing/server'
import { PDFDocument } from 'pdf-lib'
import { isClubAdmin, isMasterAdmin } from '@/lib/clubs'
import { inferFieldMapping } from '@/lib/pdf-field-mapping'
import { extractPdfFonts } from '@/lib/pdf-fonts'

const parseAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 10, characteristics: ["userId"] }),
)

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const decision = await parseAj.protect(request, { userId })
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const [isMaster, { id }] = await Promise.all([isMasterAdmin(userId), params])
  if (!isMaster) {
    const { data: tpl } = await supabase
      .from('pdf_templates')
      .select('club_id')
      .eq('id', id)
      .single()

    if (!tpl) return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    if (tpl.club_id) {
      const isAdmin = await isClubAdmin(userId, tpl.club_id)
      if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { data: template } = await supabase
    .from('pdf_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const utapi = new UTApi()
  const signedUrl = await utapi.generateSignedURL(template.file_key)

  const response = await fetch(signedUrl.ufsUrl)
  if (!response.ok) {
    console.error('[admin/pdf-templates/[id]/parse] Failed to fetch PDF from storage', { userId, templateId: id })
    return NextResponse.json({ error: 'Failed to fetch PDF from storage' }, { status: 500 })
  }

  const pdfBytes = await response.arrayBuffer()
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const pdfFonts = extractPdfFonts(pdfDoc)
  const form = pdfDoc.getForm()
  const fields = form.getFields()

  const detectedFields = fields.map((field: { getName: () => string }) => ({
    pdf_field_name: field.getName(),
  }))

  const { data: existingFields } = await supabase
    .from('pdf_template_fields')
    .select('pdf_field_name')
    .eq('template_id', id)

  const existingNames = new Set(existingFields?.map((f) => f.pdf_field_name) ?? [])

  const newFieldsData: {
    template_id: string
    pdf_field_name: string
    source_type: string
    source_key: string | null
    display_label: string
    is_enabled: boolean
    font_family: string
    font_size: number
    font_source: string
    font_variant: string
    uploaded_font_key: null
    custom_default_value: null
    custom_overridable: boolean
    sort_order: number
  }[] = []
  for (let i = 0; i < detectedFields.length; i++) {
    const detected = detectedFields[i]
    if (existingNames.has(detected.pdf_field_name)) continue
    const mapping = inferFieldMapping(detected.pdf_field_name)
    newFieldsData.push({
      template_id: id,
      pdf_field_name: detected.pdf_field_name,
      source_type: mapping.source_type,
      source_key: mapping.source_key,
      display_label: detected.pdf_field_name,
      is_enabled: true,
      font_family: 'Inter',
      font_size: 12,
      font_source: 'google',
      font_variant: 'regular',
      uploaded_font_key: null,
      custom_default_value: null,
      custom_overridable: mapping.source_type === 'custom',
      sort_order: (existingFields?.length ?? 0) + i,
    })
  }

  if (newFieldsData.length > 0) {
    const { error: insertError } = await supabase
      .from('pdf_template_fields')
      .insert(newFieldsData)

    if (insertError) {
      console.error('[admin/pdf-templates/[id]/parse] Insert fields error', { error: insertError.message, userId, templateId: id })
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  const { data: allFields } = await supabase
    .from('pdf_template_fields')
    .select('*')
    .eq('template_id', id)
    .order('sort_order')

  return NextResponse.json({
    fields: allFields ?? [],
    newFieldsAdded: newFieldsData.length,
    pdfFonts,
  })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[admin/pdf-templates/[id]/parse] Unexpected error', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
