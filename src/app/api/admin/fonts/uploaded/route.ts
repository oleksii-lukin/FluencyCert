import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { UTApi } from 'uploadthing/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'

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
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const utapi = new UTApi()
  const result = await utapi.listFiles()

  const ttfFonts: {
    key: string
    name: string
    size: number
    uploadedAt: number
    status: string
  }[] = []
  for (const f of result.files) {
    if (f.name.endsWith('.ttf') || f.name.endsWith('.woff') || f.name.endsWith('.woff2')) {
      ttfFonts.push({
        key: f.key,
        name: f.name,
        size: f.size,
        uploadedAt: f.uploadedAt,
        status: f.status,
      })
    }
  }
  ttfFonts.sort((a, b) => b.uploadedAt - a.uploadedAt)

  return NextResponse.json({ fonts: ttfFonts })
}
