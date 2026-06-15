import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createAdminClient()
  const { slug } = await params

  const { data: claim } = await supabase
    .from('certificate_claims')
    .select('id, user_id')
    .eq('slug', slug.toUpperCase())
    .single()

  if (!claim) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  if (claim.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const id = claim.id

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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[certificates/[slug]/feedback/sort] Unexpected error', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
