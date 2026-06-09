import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'
import { UTApi } from 'uploadthing/server'
import { PDFDocument } from 'pdf-lib'
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
  { params }: { params: Promise<{ id: string }> },
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
  const { id } = await params

  const accessError = await checkTemplateAccess(userId, id, supabase)
  if (accessError) return accessError

  const { data: variants, error } = await supabase
    .from('pdf_template_variants')
    .select('*')
    .eq('template_id', id)
    .order('sort_order')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ variants })
}

async function detectAcroFormFieldNames(pdfUrl: string): Promise<string[]> {
  const response = await fetch(pdfUrl)
  if (!response.ok) throw new Error('Failed to fetch PDF')
  const pdfBytes = await response.arrayBuffer()
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const form = pdfDoc.getForm()
  const fields = form.getFields()
  return fields.map((f: { getName: () => string }) => f.getName())
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
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
  const { id } = await params

  const accessError = await checkTemplateAccess(userId, id, supabase)
  if (accessError) return accessError

  const body = await request.json()
  const { name, file_url, file_key } = body

  if (!name || !file_url || !file_key) {
    return NextResponse.json({ error: 'name, file_url, and file_key are required' }, { status: 400 })
  }

  const { data: template } = await supabase
    .from('pdf_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const [variantFields, mainFields] = await Promise.all([
    detectAcroFormFieldNames(file_url),
    detectAcroFormFieldNames(template.file_url),
  ])

  const variantSet = new Set(variantFields)
  const mainSet = new Set(mainFields)

  const missingFromVariant = mainFields.filter((name) => !variantSet.has(name))
  const extraInVariant = variantFields.filter((name) => !mainSet.has(name))

  if (missingFromVariant.length > 0 || extraInVariant.length > 0) {
    const utapi = new UTApi()
    await utapi.deleteFiles(file_key).catch(() => {})

    return NextResponse.json({
      error: 'AcroForm field names do not match the main template',
      missingFromVariant,
      extraInVariant,
    }, { status: 422 })
  }

  const { data: nextSort } = await supabase
    .from('pdf_template_variants')
    .select('sort_order')
    .eq('template_id', id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const sortOrder = (nextSort?.sort_order ?? -1) + 1

  const { data: variant, error: createError } = await supabase
    .from('pdf_template_variants')
    .insert({
      template_id: id,
      name,
      file_url,
      file_key,
      sort_order: sortOrder,
    })
    .select()
    .single()

  if (createError) {
    const utapi = new UTApi()
    await utapi.deleteFiles(file_key).catch(() => {})
    return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  const { data: existingFields } = await supabase
    .from('pdf_template_fields')
    .select('id')
    .eq('template_id', id)

  if (existingFields && existingFields.length > 0) {
    const overrides = existingFields.map((f) => ({
      variant_id: variant.id,
      field_id: f.id,
    }))

    const { error: overrideError } = await supabase
      .from('pdf_template_field_overrides')
      .insert(overrides)

    if (overrideError) {
      return NextResponse.json({ error: overrideError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ variant })
}
