import { createAdminClient } from '@/lib/supabase/admin'

const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token'
const ZOOM_API_BASE = 'https://api.zoom.us/v2'

function getClientCredentials() {
  const clientId = process.env.ZOOM_CLIENT_ID
  const clientSecret = process.env.ZOOM_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('Zoom credentials not configured')
  }
  return { clientId, clientSecret }
}

async function refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
  const { clientId, clientSecret } = getClientCredentials()
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const res = await fetch(ZOOM_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    throw new Error('Failed to refresh Zoom token')
  }

  const data = await res.json()
  const supabase = createAdminClient()

  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()

  await supabase
    .from('profiles')
    .update({
      zoom_access_token: data.access_token,
      zoom_refresh_token: data.refresh_token ?? refreshToken,
      zoom_token_expires_at: expiresAt,
    })
    .eq('id', userId)

  return data.access_token
}

async function getValidAccessToken(userId: string): Promise<string> {
  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('zoom_access_token, zoom_refresh_token, zoom_token_expires_at')
    .eq('id', userId)
    .single()

  if (!profile?.zoom_access_token) {
    throw new Error('Zoom not connected')
  }

  if (profile.zoom_token_expires_at && new Date(profile.zoom_token_expires_at) <= new Date()) {
    if (!profile.zoom_refresh_token) {
      throw new Error('Zoom token expired and no refresh token available')
    }
    return refreshAccessToken(userId, profile.zoom_refresh_token)
  }

  return profile.zoom_access_token
}

async function zoomFetch(
  userId: string,
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<Response> {
  const token = await getValidAccessToken(userId)
  const url = `${ZOOM_API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (res.status === 401 && !retried) {
    const supabase = createAdminClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('zoom_refresh_token')
      .eq('id', userId)
      .single()

    if (profile?.zoom_refresh_token) {
      await refreshAccessToken(userId, profile.zoom_refresh_token)
      return zoomFetch(userId, path, options, true)
    }
  }

  return res
}

export interface ZoomMeeting {
  id: number
  uuid: string
  topic: string
  start_time: string
  duration: number
  timezone: string
  type: number
  total_minutes?: number
  participant_count?: number
}

export interface PastMeetingInstance {
  uuid: string
  id: number
  topic: string
  start_time: string
  duration: number
}

export interface PastMeetingInstancesResponse {
  meetings: PastMeetingInstance[]
}

export interface ZoomParticipant {
  id: string
  name: string
  user_email: string
  duration: number
  join_time: string
  leave_time: string
  attentiveness_score?: number
}

export interface ZoomParticipantsResponse {
  page_size: number
  total_records: number
  next_page_token: string
  participants: ZoomParticipant[]
}

export interface ZoomMeetingsResponse {
  next_page_token: string
  page_size: number
  total_records: number
  meetings: ZoomMeeting[]
}

async function paginateZoom<T>(
  userId: string,
  buildPath: (params: URLSearchParams) => string,
  extract: (data: any) => { items: T[]; nextToken: string },
): Promise<T[]> {
  const items: T[] = []
  let nextPageToken = ''

  do {
    const params = new URLSearchParams({ page_size: '300' })
    if (nextPageToken) params.set('next_page_token', nextPageToken)

    const res = await zoomFetch(userId, buildPath(params))
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Zoom API error ${res.status}: ${body}`)
    }

    const data = await res.json()
    const result = extract(data)
    items.push(...result.items)
    nextPageToken = result.nextToken
  } while (nextPageToken)

  return items
}

export function createZoomClient(userId: string) {
  return {
    async getUser(): Promise<{ id: string; email: string; display_name: string; type: number }> {
      const res = await zoomFetch(userId, '/users/me')
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Zoom API error ${res.status}: ${body}`)
      }
      const data = await res.json()
      return {
        id: data.id,
        email: data.email,
        display_name: data.display_name,
        type: data.type,
      }
    },

    async listMeetings(opts: { pageSize?: number; type?: string } = {}): Promise<ZoomMeetingsResponse> {
      const params = new URLSearchParams()
      if (opts.pageSize) params.set('page_size', String(opts.pageSize))
      if (opts.type) params.set('type', opts.type)

      const res = await zoomFetch(userId, `/users/me/meetings?${params.toString()}`)
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Zoom API error ${res.status}: ${body}`)
      }
      return res.json()
    },

    async getPastMeetingInstances(meetingId: number): Promise<PastMeetingInstancesResponse> {
      const res = await zoomFetch(userId, `/past_meetings/${meetingId}`)
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Zoom API error ${res.status}: ${body}`)
      }
      return res.json()
    },

    async getPastMeetingParticipants(
      meetingUuid: string,
      opts: { pageSize?: number; nextPageToken?: string } = {},
    ): Promise<ZoomParticipantsResponse> {
      const params = new URLSearchParams()
      if (opts.pageSize) params.set('page_size', String(opts.pageSize))
      if (opts.nextPageToken) params.set('next_page_token', opts.nextPageToken)

      const encodedUuid = encodeURIComponent(meetingUuid)
      const res = await zoomFetch(userId, `/past_meetings/${encodedUuid}/participants?${params.toString()}`)
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Zoom API error ${res.status}: ${body}`)
      }
      return res.json()
    },

    async listAllScheduledMeetings(): Promise<ZoomMeeting[]> {
      return paginateZoom<ZoomMeeting>(
        userId,
        (params) => `/users/me/meetings?${params.toString()}`,
        (data: ZoomMeetingsResponse) => ({ items: data.meetings, nextToken: data.next_page_token }),
      )
    },

    async getAllPastMeetingParticipants(meetingUuid: string): Promise<ZoomParticipant[]> {
      const encodedUuid = encodeURIComponent(meetingUuid)
      return paginateZoom<ZoomParticipant>(
        userId,
        (params) => `/past_meetings/${encodedUuid}/participants?${params.toString()}`,
        (data: ZoomParticipantsResponse) => ({ items: data.participants, nextToken: data.next_page_token }),
      )
    },
  }
}
