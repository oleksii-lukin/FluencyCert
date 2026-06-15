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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
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

    const { key } = await params
    const utapi = new UTApi()
    await utapi.deleteFiles(key)

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[admin/fonts/uploaded/[key]] Unexpected error', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
