'use client'

import { useState, useEffect, useRef } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLoading: Promise<any> | null = null
async function ensurePdfjs() {
  if (!pdfjsLoading) {
    pdfjsLoading = import('pdfjs-dist').then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.0.227/build/pdf.worker.min.mjs'
      return mod
    })
  }
  return pdfjsLoading
}

interface PdfCertificateDisplayProps {
  pdfFileUrl: string
  slug: string
}

export function PdfCertificateDisplay({ pdfFileUrl, slug }: PdfCertificateDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const perfKey = `[perf] PdfCertificateDisplay:${slug}`
      console.time(perfKey)
      try {
        const mod = await ensurePdfjs()
        if (cancelled) return

        setLoading(true)
        setError(null)

        const res = await fetch(pdfFileUrl)
        if (!res.ok) throw new Error('Failed to load PDF')
        const pdfBytes = new Uint8Array(await res.arrayBuffer())

        const pdf = await mod.getDocument({ data: pdfBytes }).promise
        const page = await pdf.getPage(1)

        const canvas = canvasRef.current
        const container = containerRef.current
        if (cancelled || !canvas || !container) return

        const containerWidth = container.clientWidth
        const originalViewport = page.getViewport({ scale: 1 })
        const dpr = window.devicePixelRatio || 1
        const scale = (containerWidth / originalViewport.width) * dpr
        const viewport = page.getViewport({ scale })

        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.style.width = `${containerWidth}px`
        canvas.style.height = `${(containerWidth * viewport.height) / viewport.width}px`

        const ctx = canvas.getContext('2d')
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport, canvas }).promise
        }

        setLoading(false)
        console.timeEnd(perfKey)
      } catch (err) {
        if (!cancelled) {
          console.timeEnd(perfKey)
          setError(err instanceof Error ? err.message : 'Failed to load PDF')
          setLoading(false)
        }
      }
    }

    load()

    return () => { cancelled = true }
  }, [pdfFileUrl, slug])

  function handleDownload() {
    const a = document.createElement('a')
    a.href = pdfFileUrl
    a.download = `certificate-${slug}.pdf`
    a.click()
  }

  if (error) {
    return (
      <div className="rounded-xl border border-dashed border-red-300 bg-red-50 p-8 text-center text-sm text-red-600">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-lg bg-bright-sky px-4 py-2 text-white hover:opacity-90 text-sm"
        >
          Download PDF
        </button>
      </div>

      <div ref={containerRef} className="w-full relative">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="size-8 animate-spin rounded-full border-4 border-bright-sky border-t-transparent" />
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={`block w-full ${loading ? 'invisible h-0' : ''}`}
        />
      </div>
    </div>
  )
}
