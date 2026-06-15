import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'
import { jwtVerify, createRemoteJWKSet } from 'jose'

const JWKS_URL = new URL('https://oauth.telegram.org/.well-known/jwks.json')
const jwks = createRemoteJWKSet(JWKS_URL)

const postAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 10, characteristics: ["userId"] }),
)

const deleteAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 10, characteristics: ["userId"] }),
)

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

  let id_token: string
  try {
    const body = await request.json()
    id_token = body.id_token
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!id_token) {
    return NextResponse.json({ error: 'id_token is required' }, { status: 400 })
  }

  let payload: { sub?: string; preferred_username?: string }
  try {
    const result = await jwtVerify(id_token, jwks, {
      issuer: 'https://oauth.telegram.org',
      audience: process.env.TELEGRAM_CLIENT_ID,
    })
    payload = result.payload as typeof payload
  } catch {
    return NextResponse.json({ error: 'Invalid id_token' }, { status: 401 })
  }

  if (!payload.sub) {
    return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { error: existingError } = await supabase
    .from('profiles')
    .select('id')
    .eq('telegram_id', payload.sub)
    .neq('id', userId)
    .maybeSingle()

  if (existingError) {
    console.error('[telegram/connect] Database error checking existing telegram_id', { userId, sub: payload.sub, error: existingError.message })
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      telegram_id: payload.sub,
      telegram_username: payload.preferred_username ?? null,
    })
    .eq('id', userId)

  if (updateError) {
    console.error('[telegram/connect] Failed to update profile with telegram_id', { userId, sub: payload.sub, error: updateError.message })
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    telegram_username: payload.preferred_username ?? null,
  })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[telegram/connect] Unexpected error in POST', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
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
  const { error } = await supabase
    .from('profiles')
    .update({
      telegram_id: null,
      telegram_username: null,
    })
    .eq('id', userId)

  if (error) {
    console.error('[telegram/connect] Failed to disconnect Telegram', { userId, error: error.message })
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[telegram/connect] Unexpected error in DELETE', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
