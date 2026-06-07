import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createZoomClient } from '@/lib/zoom/api'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'

const getAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 10, characteristics: ["userId"] }),
)

export async function POST(request: Request) {
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
  const { data: profile } = await supabase
    .from('profiles')
    .select('zoom_access_token, is_admin')
    .eq('id', userId)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  if (!profile?.zoom_access_token) {
    return NextResponse.json({ error: 'Zoom not connected' }, { status: 400 })
  }

  try {
    const zoom = createZoomClient(userId)

    const userInfo = await zoom.getUser()
    const supabase2 = createAdminClient()
    await supabase2
      .from('profiles')
      .update({ zoom_user_info: userInfo })
      .eq('id', userId)

    const listResult = await zoom.listMeetings({ pageSize: 10 })
    const scheduledMeetings = listResult.meetings

    const meetingsWithData = await Promise.all(
      scheduledMeetings.map(async (meeting) => {
        let pastInstances: unknown = null
        let pastInstancesError: string | null = null
        let directParticipants: unknown = null
        let directParticipantsError: string | null = null

        // Attempt 1: get past instances and their participants
        try {
          const result = await zoom.getPastMeetingInstances(meeting.id)
          if (result.meetings.length > 0) {
            const withParticipants = await Promise.all(
              result.meetings.map(async (instance) => {
                try {
                  const p = await zoom.getPastMeetingParticipants(instance.uuid)
                  return { ...instance, participants: p }
                } catch (e) {
                  return { ...instance, participants: null, participantsError: String(e) }
                }
              }),
            )
            pastInstances = withParticipants
          } else {
            pastInstances = []
          }
        } catch (e) {
          pastInstancesError = String(e)
        }

        // Attempt 2: try direct participant lookup by meeting UUID (fallback)
        if (!pastInstances || (Array.isArray(pastInstances) && pastInstances.length === 0)) {
          try {
            const result = await zoom.getPastMeetingParticipants(meeting.uuid)
            directParticipants = result
          } catch (e) {
            directParticipantsError = String(e)
          }
        }

        return {
          id: meeting.id,
          uuid: meeting.uuid,
          topic: meeting.topic,
          type: meeting.type,
          start_time: meeting.start_time,
          duration: meeting.duration,
          pastInstances,
          pastInstancesError,
          directParticipants,
          directParticipantsError,
        }
      }),
    )

    return NextResponse.json({
      zoomUserInfo: userInfo,
      rawListResult: listResult,
      meetingsWithData,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
