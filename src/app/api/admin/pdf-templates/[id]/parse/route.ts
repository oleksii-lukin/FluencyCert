import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'
import { UTApi } from 'uploadthing/server'
import { PDFDocument } from 'pdf-lib'

const parseAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 10, characteristics: ["userId"] }),
)

const DATABASE_FIELDS: Record<string, string> = {
  recipientName: 'fullName',
  fullName: 'fullName',
  name: 'fullName',
  englishLevel: 'englishLevel',
  level: 'englishLevel',
  speakingClubs: 'speakingClubsCount',
  clubs: 'speakingClubsCount',
  speakingClubsCount: 'speakingClubsCount',
  hours: 'hoursParticipated',
  hoursParticipated: 'hoursParticipated',
  adminFeedback: 'adminFeedback',
  feedback: 'adminFeedback',
  createdAt: 'createdAt',
  date: 'createdAt',
  issuedOn: 'createdAt',
  slug: 'slug',
  certificateId: 'slug',
  id: 'slug',
  qrCode: 'qr_code',
  qr: 'qr_code',
}

function inferMapping(pdfFieldName: string): { source_type: string; source_key: string | null } {
  const lower = pdfFieldName.replace(/[\s_-]/g, '')
  for (const [pattern, mapping] of Object.entries(DATABASE_FIELDS)) {
    if (lower === pattern.toLowerCase()) {
      if (mapping === 'qr_code') {
        return { source_type: 'qr_code', source_key: null }
      }
      return { source_type: 'database', source_key: mapping }
    }
  }
  return { source_type: 'custom', source_key: pdfFieldName }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

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
    return NextResponse.json({ error: 'Failed to fetch PDF from storage' }, { status: 500 })
  }

  const pdfBytes = await response.arrayBuffer()
  const pdfDoc = await PDFDocument.load(pdfBytes)
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

  const newFieldsData = detectedFields
    .filter((f) => !existingNames.has(f.pdf_field_name))
    .map((detected, index) => {
      const mapping = inferMapping(detected.pdf_field_name)
      return {
        template_id: id,
        pdf_field_name: detected.pdf_field_name,
        source_type: mapping.source_type,
        source_key: mapping.source_key,
        display_label: detected.pdf_field_name,
        is_enabled: true,
        font_family: 'Inter',
        font_size: 12,
        font_source: 'google',
        uploaded_font_key: null,
        custom_default_value: null,
        custom_overridable: false,
        sort_order: (existingFields?.length ?? 0) + index,
      }
    })

  if (newFieldsData.length > 0) {
    const { error: insertError } = await supabase
      .from('pdf_template_fields')
      .insert(newFieldsData)

    if (insertError) {
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
  })
}
