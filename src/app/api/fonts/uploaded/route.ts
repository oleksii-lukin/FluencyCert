import { NextRequest, NextResponse } from 'next/server'
import { UTApi } from 'uploadthing/server'

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')
  if (!key) {
    return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 })
  }

  const utapi = new UTApi()
  const signedUrl = await utapi.generateSignedURL(key)

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
}
