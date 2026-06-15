import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aj } from '@/lib/arcjet'
import { slidingWindow } from '@arcjet/next'

const cvAj = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 60, characteristics: ["ip"] }),
)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || ''
    const decision = await cvAj.protect(request, { ip })
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { slug } = await params
  const supabase = createAdminClient()

  const { data: claim } = await supabase
    .from('certificate_claims')
    .select('id')
    .eq('slug', slug.toUpperCase())
    .single()

  if (!claim) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  const { data: customValues } = await supabase
    .from('pdf_custom_values')
    .select('field_id, value')
    .eq('claim_id', claim.id)

  const valuesByFieldId: Record<string, string> = {}
  for (const cv of customValues ?? []) {
    valuesByFieldId[cv.field_id] = cv.value
  }

  return NextResponse.json({ customValues: valuesByFieldId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[certificates/[slug]/pdf-custom-values] Unexpected error', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
