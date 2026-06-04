import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const family = request.nextUrl.searchParams.get('family')
  const weight = request.nextUrl.searchParams.get('weight') || '400'
  const italic = request.nextUrl.searchParams.get('italic') === 'true'

  if (!family) {
    return NextResponse.json({ error: 'Missing family parameter' }, { status: 400 })
  }

  const familyEncoded = encodeURIComponent(family.replace(/\s+/g, '+'))
  const css2Url = `https://fonts.googleapis.com/css2?family=${familyEncoded}:wght@${weight}${italic ? ';ital,wdth,wght@1,100,400' : ''}&display=swap`

  try {
    const css2 = await fetch(css2Url).then((r) => r.text())

    const formats = [
      { pattern: /src:\s*url\(([^)]+\.ttf)\)/, type: 'font/ttf' },
      { pattern: /src:\s*url\(([^)]+\.woff2)\)/, type: 'font/woff2' },
      { pattern: /src:\s*url\(([^)]+\.woff)\)/, type: 'font/woff' },
    ]

    for (const { pattern, type } of formats) {
      const match = css2.match(pattern)
      if (match) {
        const response = await fetch(match[1])
        if (!response.ok) continue
        const blob = await response.blob()
        return new NextResponse(blob, {
          headers: {
            'Content-Type': type,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
      }
    }

    const css1Url = `https://fonts.googleapis.com/css?family=${familyEncoded}`
    const css1 = await fetch(css1Url).then((r) => r.text())
    const ttfMatch = css1.match(/src:\s*url\(([^)]+\.ttf)\)/)

    if (ttfMatch) {
      return NextResponse.redirect(ttfMatch[1], 302)
    }

    return NextResponse.json({ error: `No font URL found for "${family}"` }, { status: 404 })
  } catch {
    return NextResponse.json({ error: `Failed to fetch font "${family}"` }, { status: 502 })
  }
}
