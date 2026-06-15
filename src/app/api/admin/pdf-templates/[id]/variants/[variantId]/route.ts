import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'
import { UTApi } from 'uploadthing/server'
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  try {
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

  const body = await request.json()
  const { name } = body

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const { data: variant, error } = await supabase
    .from('pdf_template_variants')
    .update({ name })
    .eq('id', variantId)
    .eq('template_id', id)
    .select()
    .single()

  if (error) {
    console.error('[admin/pdf-templates/[id]/variants/[variantId]] PATCH variant error', { error: error.message, userId, templateId: id, variantId })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!variant) {
    return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
  }

  return NextResponse.json({ variant })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[admin/pdf-templates/[id]/variants/[variantId]] Unexpected error in PATCH', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  try {
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
    .select('file_key')
    .eq('id', variantId)
    .eq('template_id', id)
    .single()

  if (!variant) {
    return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('pdf_template_variants')
    .delete()
    .eq('id', variantId)
    .eq('template_id', id)

  if (error) {
    console.error('[admin/pdf-templates/[id]/variants/[variantId]] DELETE variant error', { error: error.message, userId, templateId: id, variantId })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const utapi = new UTApi()
  await utapi.deleteFiles(variant.file_key).catch(() => {})

  return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[admin/pdf-templates/[id]/variants/[variantId]] Unexpected error in DELETE', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
