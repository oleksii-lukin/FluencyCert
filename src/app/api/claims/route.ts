import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: claim } = await supabase
    .from('certificate_claims')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({ claim: claim ?? null })
}

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('certificate_claims')
    .select('id, status')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Already have a pending claim', claim: existing }, { status: 409 })
  }

  const { data: claim, error } = await supabase
    .from('certificate_claims')
    .insert({ user_id: userId, status: 'pending' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ claim }, { status: 201 })
}
