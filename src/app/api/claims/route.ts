import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'
import { generateSlug } from '@/lib/slug'
import { getPostHogClient } from '@/lib/posthog-server'

const getAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 20, characteristics: ["userId"] }),
)

const postAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 5, characteristics: ["userId"] }),
)

const patchAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 10, characteristics: ["userId"] }),
)

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const decision = await getAj.protect(request, { userId })
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[claims] Unexpected error in GET', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const decision = await postAj.protect(request, { userId })
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()

  const body = await request.json()
  const clubId = body?.club_id

  if (clubId) {
    const { data: membership } = await supabase
      .from('club_memberships')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this club' }, { status: 403 })
    }
  }

  if (clubId) {
    const { data: existing } = await supabase
      .from('certificate_claims')
      .select('id')
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already have a pending claim for this club' }, { status: 409 })
    }
  } else {
    const { data: existing } = await supabase
      .from('certificate_claims')
      .select('id')
      .eq('user_id', userId)
      .is('club_id', null)
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already have a pending claim' }, { status: 409 })
    }
  }

  const slugs = Array.from({ length: 5 }, () => generateSlug())
  const results = await Promise.all(
    slugs.map((slug) => {
      const insertData = { user_id: userId, status: 'pending' as const, slug, ...(clubId ? { club_id: clubId } : {}) }
      return supabase.from('certificate_claims').insert(insertData).select().maybeSingle()
    })
  )
  const success = results.find((r) => !r.error)
  const claim = success?.data ?? null
  const error = success ? null : results[results.length - 1].error

  if (error) {
    console.error('[claims] Failed to create claim', { userId, clubId, error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const posthog = getPostHogClient()
  posthog.capture({
    distinctId: userId,
    event: 'certificate_claim_created',
    properties: { club_id: clubId ?? null },
  })

  return NextResponse.json({ claim }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[claims] Unexpected error in POST', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const decision = await patchAj.protect(request, { userId })
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { background_template } = body

  if (!background_template || typeof background_template !== 'string') {
    return NextResponse.json({ error: 'background_template is required' }, { status: 400 })
  }

  const { listTemplates } = await import('@/components/certificate/template-registry')
  const templates = listTemplates()
  const templateExists = templates.some((t) => t.id === background_template)
  if (!templateExists) {
    return NextResponse.json({ error: 'Invalid template' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: claim } = await supabase
    .from('certificate_claims')
    .select('id, user_id, status')
    .eq('id', body.claimId)
    .single()

  if (!claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
  }

  if (claim.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (claim.status !== 'approved') {
    return NextResponse.json({ error: 'Claim is not approved' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('certificate_claims')
    .update({ background_template })
    .eq('id', claim.id)
    .select()
    .single()

  if (error) {
    console.error('[claims] Failed to update claim background_template', { claimId: body.claimId, userId, error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ claim: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[claims] Unexpected error in PATCH', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
