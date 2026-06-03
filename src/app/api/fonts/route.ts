import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const family = request.nextUrl.searchParams.get('family')
  if (!family) {
    return NextResponse.json({ error: 'Missing family parameter' }, { status: 400 })
  }

  const cssUrl = `https://fonts.googleapis.com/css?family=${encodeURIComponent(family)}`
  const css = await fetch(cssUrl).then((r) => r.text())

  const match = css.match(/src:\s*url\(([^)]+\.ttf)\)/)
  if (!match) {
    return NextResponse.json({ error: `No TTF URL found for "${family}"` }, { status: 404 })
  }

  return NextResponse.redirect(match[1], 302)
}
