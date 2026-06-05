import { NextRequest, NextResponse } from 'next/server'

interface GoogleFontItem {
  family: string
  files: Record<string, string>
}

let fontsCache: GoogleFontItem[] | null = null
let fontsCacheTime = 0
const CACHE_TTL = 60 * 60 * 1000

async function findFontFile(family: string, weight: string): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY
  if (!apiKey) return null

  if (!fontsCache || Date.now() - fontsCacheTime > CACHE_TTL) {
    const res = await fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`,
    )
    if (!res.ok) return null
    const data = await res.json()
    fontsCache = data.items
    fontsCacheTime = Date.now()
  }

  const match = fontsCache?.find(
    (f) => f.family.toLowerCase() === family.toLowerCase(),
  )
  if (!match) return null

  return match.files[weight] || match.files['regular'] || null
}

function checkFontFormat(bytes: Uint8Array): { valid: boolean; format: string } {
  if (bytes.length < 4) {
    return { valid: false, format: 'too-small' }
  }

  const magic = new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0, false)

  switch (magic) {
    case 0x00010000:
    case 0x74727565:
      return { valid: true, format: 'TrueType' }
    case 0x4F54544F:
      return { valid: true, format: 'OpenType/CFF' }
    case 0x74746366:
      return { valid: true, format: 'TrueType Collection' }
    case 0x774F4646:
      return { valid: false, format: 'WOFF' }
    case 0x774F4632:
      return { valid: false, format: 'WOFF2' }
    default:
      return { valid: false, format: `unknown (0x${magic.toString(16).padStart(8, '0')})` }
  }
}

async function downloadFont(url: string): Promise<Uint8Array | null> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 5.1; rv:11.0) Gecko/20100101 Firefox/11.0' },
  })
  if (!res.ok) return null
  return new Uint8Array(await res.arrayBuffer())
}

export async function GET(request: NextRequest) {
  const family = request.nextUrl.searchParams.get('family')

  if (!family) {
    return NextResponse.json({ error: 'Missing family parameter' }, { status: 400 })
  }

  try {
    const fileUrl = await findFontFile(family, '400')
    let bytes: Uint8Array | null = null

    if (fileUrl) {
      console.log('[Fonts API] trying Developer API URL:', fileUrl)
      bytes = await downloadFont(fileUrl)
      if (bytes) {
        const { valid, format } = checkFontFormat(bytes)
        console.log(`[Fonts API] Developer API: ${bytes.length} bytes, format: ${format}`)
        if (valid) {
          return new NextResponse(bytes as BodyInit, {
            headers: {
              'Content-Type': 'font/ttf',
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          })
        }
        console.log('[Fonts API] Developer API returned non-TTF, trying CSS fallback')
      }
    }

    const familyParam = family.replace(/\s+/g, '+')
    const cssUrl = `https://fonts.googleapis.com/css?family=${familyParam}`
    console.log('[Fonts API] trying CSS v1 API:', cssUrl)
    const cssRes = await fetch(cssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 5.1; rv:11.0) Gecko/20100101 Firefox/11.0' },
    })
    if (!cssRes.ok) {
      console.log('[Fonts API] CSS API returned', cssRes.status)
      return NextResponse.json({ error: `Failed to fetch font "${family}"` }, { status: 502 })
    }
    const css = await cssRes.text()

    const urlMatch = css.match(/url\(([^)]+)\)/)
    if (!urlMatch) {
      console.log('[Fonts API] no URL found in CSS response')
      return NextResponse.json({ error: `No font URL found for "${family}" in CSS` }, { status: 404 })
    }

    console.log('[Fonts API] CSS fallback URL:', urlMatch[1])
    bytes = await downloadFont(urlMatch[1])
    if (!bytes) {
      return NextResponse.json({ error: `Failed to download font from CSS URL` }, { status: 502 })
    }

    const { valid, format } = checkFontFormat(bytes)
    console.log(`[Fonts API] CSS fallback: ${bytes.length} bytes, format: ${format}`)

    if (!valid) {
      const hex4 = Array.from(bytes.slice(0, 4))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ')
      console.log('[Fonts API] CSS fallback also invalid, hex:', hex4)
      return NextResponse.json({
        error: `Font "${family}" returned as ${format}. Try uploading the TTF manually.`,
      }, { status: 400 })
    }

    return new NextResponse(bytes as BodyInit, {
      headers: {
        'Content-Type': 'font/ttf',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err) {
    console.log('[Fonts API] error:', err)
    return NextResponse.json({ error: `Failed to fetch font "${family}"` }, { status: 502 })
  }
}
