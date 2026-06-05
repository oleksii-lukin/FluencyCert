'use client'

import { useEffect, useState, useId } from 'react'

interface FontPreviewProps {
  fontKey: string
}

export function FontPreview({ fontKey }: FontPreviewProps) {
  const id = useId()
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

  return (
    <span
      className={`block text-lg leading-relaxed transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      style={{ fontFamily: loaded ? family : undefined }}
    >
      The quick brown fox jumps over the lazy dog
    </span>
  )
}
