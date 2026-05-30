import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
  const body = await request.json()
  const { status, admin_feedback } = body

  if (!status || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  if (typeof admin_feedback !== 'string' || admin_feedback.trim().length === 0) {
    return NextResponse.json({ error: 'admin_feedback is required' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('certificate_claims')
    .select('id, status')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
  }

  if (existing.status !== 'pending') {
    return NextResponse.json({ error: 'Claim is not pending' }, { status: 400 })
  }

  const { data: claim, error } = await supabase
    .from('certificate_claims')
    .update({ status, admin_feedback: admin_feedback.trim() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ claim })
}
