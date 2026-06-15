import { NextRequest, NextResponse } from 'next/server'
import { UTApi } from 'uploadthing/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    let key = request.nextUrl.searchParams.get('key')
  const id = request.nextUrl.searchParams.get('id')

  if (!key && !id) {
    return NextResponse.json({ error: 'Missing key or id parameter' }, { status: 400 })
  }

  if (!key && id) {
    const supabase = createAdminClient()
    const { data: font } = await supabase
      .from('pdf_fonts')
      .select('file_key')
      .eq('id', id)
      .single()
    if (!font) {
      return NextResponse.json({ error: 'Font not found' }, { status: 404 })
    }
    key = font.file_key
  }

  const utapi = new UTApi()
  const signedUrl = await utapi.generateSignedURL(key!)

  const response = await fetch(signedUrl.ufsUrl)
  if (!response.ok) {
    return NextResponse.json({ error: 'Font not found' }, { status: 404 })
  }

  const blob = await response.blob()
  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'font/ttf',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[fonts/uploaded] Unexpected error', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
