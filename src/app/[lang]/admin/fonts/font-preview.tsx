'use client'

import { useEffect, useState, useId } from 'react'
import { useLocale } from 'next-intl'

const previewEn = 'The quick brown fox jumps over the lazy dog'
const previewUk = 'Чуєш їх, доцю, га? Кумедна ж ти, прощайся без ґольфів!'

interface FontPreviewProps {
  fontKey: string
}

export function FontPreview({ fontKey }: FontPreviewProps) {
  const id = useId()
  const locale = useLocale()
  const family = `font-${fontKey.replace(/[^a-zA-Z0-9-]/g, '-')}`
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const styleId = `fp-${id}`
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      @font-face {
        font-family: "${family}";
        src: url("/api/fonts/uploaded?key=${encodeURIComponent(fontKey)}") format("truetype");
        font-weight: 400;
        font-style: normal;
      }
    `
    document.head.appendChild(style)

    const timeout = setTimeout(() => setLoaded(true), 2000)

    document.fonts.load(`16px "${family}"`).then(() => {
      clearTimeout(timeout)
      setLoaded(true)
    }).catch(() => {})

    return () => {
      clearTimeout(timeout)
      const el = document.getElementById(styleId)
      if (el) el.remove()
    }
  }, [fontKey, family, id])

  if (locale === 'en') {
    return (
      <span
        className={`block text-lg leading-relaxed transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ fontFamily: loaded ? family : undefined }}
      >
        {previewEn}
      </span>
    )
  }

  return (
    <div className={`flex flex-col gap-0.5 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
      <span className="block text-lg leading-relaxed" style={{ fontFamily: loaded ? family : undefined }}>
        {previewUk}
      </span>
      <span className="block text-sm leading-relaxed text-muted-foreground/60" style={{ fontFamily: loaded ? family : undefined }}>
        {previewEn}
      </span>
    </div>
  )
}
