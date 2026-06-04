import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'
import { isClubAdmin, isMasterAdmin } from '@/lib/clubs'

const apiAj = aj.withRule(
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
  if (!tpl.club_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const isAdmin = await isClubAdmin(userId, tpl.club_id)
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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

  const decision = await apiAj.protect(request, { userId })
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

  const { data: template, error } = await supabase
    .from('pdf_templates')
    .select('*, pdf_template_fields(*)')
    .eq('id', id)
    .order('sort_order', { foreignTable: 'pdf_template_fields', ascending: true })
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  return NextResponse.json({ template })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const decision = await apiAj.protect(request, { userId })
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
  const { name, description } = body

  const { data: template, error } = await supabase
    .from('pdf_templates')
    .update({ name, description })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ template })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const decision = await apiAj.protect(request, { userId })
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

  const { error } = await supabase
    .from('pdf_templates')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
