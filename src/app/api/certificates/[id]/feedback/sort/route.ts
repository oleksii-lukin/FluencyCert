import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { id } = await params

  const { data: claim } = await supabase
    .from('certificate_claims')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!claim) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  if (claim.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { order } = body

  if (!Array.isArray(order)) {
    return NextResponse.json({ error: 'order must be an array of feedback IDs' }, { status: 400 })
  }

  const updates = order.map((feedbackId: string, index: number) =>
    supabase
      .from('certificate_feedback')
      .update({ sort_order: index })
      .eq('id', feedbackId)
      .eq('certificate_id', id)
  )

  await Promise.all(updates)

  return NextResponse.json({ success: true })
}
