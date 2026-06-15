import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'

const checkAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 20, characteristics: ["userId"] }),
)

export async function GET(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }

    const decision = await checkAj.protect(request, { userId })
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      }
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()

    return NextResponse.json({ isAdmin: profile?.is_admin ?? false })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[admin/me] Unexpected error', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
