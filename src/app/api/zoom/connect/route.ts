import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'

const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token'
const ZOOM_API_BASE = 'https://api.zoom.us/v2'

const postAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 10, characteristics: ["userId"] }),
)

const deleteAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 10, characteristics: ["userId"] }),
)

async function exchangeCodeForToken(
  authorizationCode: string,
  redirectUri: string,
): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  const clientId = process.env.ZOOM_CLIENT_ID
  const clientSecret = process.env.ZOOM_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: redirectUri,
  })

  try {
    const res = await fetch(ZOOM_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function fetchZoomUserInfo(accessToken: string): Promise<{
  id: string
  email: string
  display_name: string
  type: number
} | null> {
  try {
    const res = await fetch(`${ZOOM_API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      id: data.id,
      email: data.email,
      display_name: data.display_name,
      type: data.type,
    }
  } catch {
    return null
  }
}

export async function POST(request: Request) {
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

  let body: { authorizationCode?: string; redirectUri?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.authorizationCode || !body.redirectUri) {
    return NextResponse.json({ error: 'authorizationCode and redirectUri are required' }, { status: 400 })
  }

  const tokens = await exchangeCodeForToken(body.authorizationCode, body.redirectUri)
  if (!tokens) {
    return NextResponse.json({ error: 'Failed to exchange authorization code' }, { status: 401 })
  }

  const userInfo = await fetchZoomUserInfo(tokens.access_token)
  if (!userInfo) {
    return NextResponse.json({ error: 'Failed to fetch Zoom user info' }, { status: 502 })
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  const supabase = createAdminClient()

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      zoom_access_token: tokens.access_token,
      zoom_refresh_token: tokens.refresh_token,
      zoom_token_expires_at: expiresAt,
      zoom_user_info: userInfo,
    })
    .eq('id', userId)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    zoomUserInfo: userInfo,
  })
}

async function revokeZoomToken(token: string): Promise<boolean> {
  const clientId = process.env.ZOOM_CLIENT_ID
  const clientSecret = process.env.ZOOM_CLIENT_SECRET
  if (!clientId || !clientSecret) return false

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  try {
    const res = await fetch(`https://zoom.us/oauth/revoke?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return res.ok
  } catch {
    return false
  }
}

export async function DELETE(request: Request) {
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
    .select('zoom_access_token')
    .eq('id', userId)
    .single()

  if (profile?.zoom_access_token) {
    await revokeZoomToken(profile.zoom_access_token)
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      zoom_access_token: null,
      zoom_refresh_token: null,
      zoom_token_expires_at: null,
      zoom_user_info: null,
    })
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
