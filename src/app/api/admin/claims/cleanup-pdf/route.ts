import { NextRequest, NextResponse } from 'next/server'
import { UTApi } from 'uploadthing/server'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.CLEANUP_PDF_SECRET

    if (expectedSecret) {
      if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== expectedSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { fileKey } = await request.json()

    if (!fileKey || typeof fileKey !== 'string') {
      return NextResponse.json({ error: 'fileKey is required' }, { status: 400 })
    }

    const utapi = new UTApi()
    await utapi.deleteFiles(fileKey)

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[admin/claims/cleanup-pdf] Error', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
