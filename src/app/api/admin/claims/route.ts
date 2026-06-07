import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'
import { getAdminClubIds, isMasterAdmin } from '@/lib/clubs'

const listAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 60, characteristics: ["userId"] }),
)

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const decision = await listAj.protect(request, { userId })
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()

  const [isMaster, adminClubIds] = await Promise.all([isMasterAdmin(userId), getAdminClubIds(userId)])

  if (!isMaster && adminClubIds.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const statusFilter = url.searchParams.get('status')
  const clubFilter = url.searchParams.get('club_id')

  let query = supabase
    .from('certificate_claims')
    .select('*, profiles!inner(id, email, first_name, last_name, avatar_url), speaking_clubs!left(id, name, slug)')
    .order('created_at', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  if (clubFilter && isMaster) {
    query = query.eq('club_id', clubFilter)
  } else if (!isMaster) {
    query = query.in('club_id', adminClubIds)
  }

  const { data: claims, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ claims })
}
