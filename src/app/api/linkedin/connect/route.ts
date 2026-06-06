import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'

const FLAG_ENABLED = process.env.FLAG_LINKEDIN_CONNECT === 'true'
const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET

const LINKEDIN_ACCESS_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
const LINKEDIN_IDENTITY_ME_URL = 'https://api.linkedin.com/v2/user/identityMe'

const postAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 10, characteristics: ["userId"] }),
)

const deleteAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 10, characteristics: ["userId"] }),
)

async function exchangeCodeForToken(authorizationCode: string, redirectUri: string): Promise<string | null> {
  if (!CLIENT_ID || !CLIENT_SECRET) return null

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: redirectUri,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  })

  try {
    const res = await fetch(LINKEDIN_ACCESS_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.access_token ?? null
  } catch {
    return null
  }
}

async function fetchIdentityMe(accessToken: string): Promise<{
  name: string
  email: string
  picture: string
  profileUrl: string
} | null> {
  try {
    const res = await fetch(LINKEDIN_IDENTITY_ME_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'LinkedIn-Version': '202510.03',
      },
    })
    if (!res.ok) return null

    const data = await res.json()

    const firstName = data.basicInfo?.firstName?.localized?.en_US ?? ''
    const lastName = data.basicInfo?.lastName?.localized?.en_US ?? ''
    const name = [firstName, lastName].filter(Boolean).join(' ') || ''
    const email = data.basicInfo?.primaryEmailAddress ?? ''
    const picture = data.basicInfo?.profilePicture?.croppedImage?.downloadUrl ?? ''
    const profileUrl = data.basicInfo?.profileUrl ?? ''

    return { name, email, picture, profileUrl }
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

  const supabase = createAdminClient()
  let body: { authorizationCode?: string; redirectUri?: string; linkedinUrl?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (body.linkedinUrl) {
    const url = body.linkedinUrl.trim()
    const validPrefixes = ['https://www.linkedin.com/in/', 'https://linkedin.com/in/']
    if (!validPrefixes.some(p => url.startsWith(p))) {
      return NextResponse.json({ error: 'Invalid LinkedIn URL' }, { status: 400 })
    }
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ linkedin_url: url })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
    return NextResponse.json({ success: true, linkedinUrl: url })
  }

  if (!body.linkedinUrl && !body.authorizationCode) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  if (body.authorizationCode) {
    if (!FLAG_ENABLED) {
      return NextResponse.json({ error: 'Not available' }, { status: 404 })
    }

    const { authorizationCode, redirectUri } = body
    if (!redirectUri) {
      return NextResponse.json({ error: 'redirectUri is required' }, { status: 400 })
    }

    const accessToken = await exchangeCodeForToken(authorizationCode, redirectUri)
    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to exchange authorization code' }, { status: 401 })
    }

    const profileInfo = await fetchIdentityMe(accessToken)
    if (!profileInfo) {
      return NextResponse.json({ error: 'Failed to fetch LinkedIn profile' }, { status: 502 })
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        linkedin_url: profileInfo.profileUrl || null,
        linkedin_profile_data: {
          name: profileInfo.name,
          email: profileInfo.email,
          picture: profileInfo.picture,
          profileUrl: profileInfo.profileUrl,
        },
      })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      linkedinUrl: profileInfo.profileUrl || null,
      profileData: {
        name: profileInfo.name,
        email: profileInfo.email,
        picture: profileInfo.picture,
        profileUrl: profileInfo.profileUrl,
      },
    })
  }

  return NextResponse.json({ error: 'Unknown request' }, { status: 400 })
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
  const { error } = await supabase
    .from('profiles')
    .update({
      linkedin_url: null,
      linkedin_profile_data: null,
    })
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
