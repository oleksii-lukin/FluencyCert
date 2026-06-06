import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createZoomClient } from '@/lib/zoom/api'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'

const getAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 10, characteristics: ["userId"] }),
)

export async function GET(request: Request) {
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

    // Step 1: List all scheduled/upcoming meetings (NOT past/ended — that filter is invalid here)
    const listResult = await zoom.listMeetings({ pageSize: 10 })
    const scheduledMeetings = listResult.meetings

    // Step 2: For each scheduled meeting, fetch past instances + their participants
    const meetingsWithInstances = await Promise.all(
      scheduledMeetings.map(async (meeting) => {
        try {
          const instances = await zoom.getPastMeetingInstances(meeting.id)

          const instancesWithParticipants = await Promise.all(
            instances.meetings.map(async (instance) => {
              try {
                const participants = await zoom.getPastMeetingParticipants(instance.uuid)
                return { ...instance, participants }
              } catch {
                return { ...instance, participants: null, participantsError: 'Failed to fetch' }
              }
            }),
          )

          return { ...meeting, instances: instancesWithParticipants }
        } catch {
          return { ...meeting, instances: null, instancesError: 'Failed to fetch instances' }
        }
      }),
    )

    return NextResponse.json({
      // The raw list result (to see what the endpoint actually returns)
      rawListResult: {
        total_records: listResult.total_records,
        page_size: listResult.page_size,
        next_page_token: listResult.next_page_token,
        meetings: listResult.meetings,
      },
      // Meetings with nested instances and participants
      meetingsWithData: meetingsWithInstances,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
