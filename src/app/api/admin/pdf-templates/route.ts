import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'
import { isClubAdmin, isMasterAdmin, getAdminClubIds } from '@/lib/clubs'

const listAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 30, characteristics: ["userId"] }),
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
  const isMaster = await isMasterAdmin(userId)

  if (isMaster) {
    const { data: templates, error } = await supabase
      .from('pdf_templates')
      .select('*, pdf_template_fields(count), pdf_template_variants(count)')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ templates })
  }

  const adminClubIds = await getAdminClubIds(userId)
  if (adminClubIds.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: templates, error } = await supabase
    .from('pdf_templates')
    .select('*, pdf_template_fields(count), pdf_template_variants(count)')
    .or(`club_id.is.null,club_id.in.(${adminClubIds.join(',')})`)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ templates })
}

const createAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 20, characteristics: ["userId"] }),
)

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const decision = await createAj.protect(request, { userId })
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const body = await request.json()
  const { name, description, file_url, file_key, club_id } = body

  if (!name || !file_url || !file_key) {
    return NextResponse.json({ error: 'name, file_url, and file_key are required' }, { status: 400 })
  }

  const isMaster = await isMasterAdmin(userId)

  if (club_id) {
    if (isMaster) {
      const { data: club } = await supabase
        .from('speaking_clubs')
        .select('id')
        .eq('id', club_id)
        .single()
      if (!club) {
        return NextResponse.json({ error: 'Club not found' }, { status: 404 })
      }
    } else {
      const isAdmin = await isClubAdmin(userId, club_id)
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
  } else if (!isMaster) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: template, error } = await supabase
    .from('pdf_templates')
    .insert({ name, description, file_url, file_key, club_id: club_id || null })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ template })
}
