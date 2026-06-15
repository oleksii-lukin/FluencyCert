import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { UTApi } from 'uploadthing/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isMasterAdmin } from '@/lib/clubs'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'

const deleteAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 20, characteristics: ["userId"] }),
)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
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

    const { data, error } = await supabase
      .from('pdf_fonts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ font: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[admin/fonts/[id]] Unexpected error', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const decision = await deleteAj.protect(request, { userId })
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

    const isMaster = await isMasterAdmin(userId)
    if (!isMaster) {
      return NextResponse.json({ error: 'Only master admin can delete fonts' }, { status: 403 })
    }

    const { id } = await params

    const { data: font, error: fetchError } = await supabase
      .from('pdf_fonts')
      .select('file_key')
      .eq('id', id)
      .single()

    if (fetchError || !font) {
      return NextResponse.json({ error: 'Font not found' }, { status: 404 })
    }

    const utapi = new UTApi()
    await utapi.deleteFiles(font.file_key)

    const { error: deleteError } = await supabase
      .from('pdf_fonts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('[admin/fonts/[id]] Delete error', { userId, id, error: deleteError.message })
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[admin/fonts/[id]] Unexpected error', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
