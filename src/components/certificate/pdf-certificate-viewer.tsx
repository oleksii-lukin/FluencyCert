'use client'

import { useState, useEffect, useRef } from 'react'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QrCodeWithLogo from 'qrcode-with-logos'
import { testFontCompatibility, clearFontCompatibilityCache } from '@/lib/font-compat'

interface FieldMapping {
  id: string
  pdf_field_name: string
  source_type: string
  source_key: string | null
  display_label: string
  is_enabled: boolean
  font_family: string
  font_size: number
  font_source: string
  uploaded_font_key: string | null
  custom_default_value: string | null
  sort_order: number
}

interface PdfCertificateViewerProps {
  templateFileUrl: string
  fields: FieldMapping[]
  certificateData: {
    fullName: string
    englishLevel: string
    speakingClubsCount: number
    hoursParticipated: number | null
    adminFeedback: string | null
    createdAt: string
    slug: string
  }
  customValues: Record<string, string>
  certificateUrl: string
}

const CACHE_NAME = 'pdf-fonts'

export function PdfCertificateViewer({
  templateFileUrl,
  fields,
  certificateData,
  customValues,
  certificateUrl,
}: PdfCertificateViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const pdfjsRef = useRef<any>(null)
  const [pdfjsReady, setPdfjsReady] = useState(false)

  useEffect(() => {
    import('pdfjs-dist').then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      pdfjsRef.current = mod
      setPdfjsReady(true)
    })
  }, [])

  useEffect(() => {
    if (!pdfjsReady) return
    let cancelled = false

    async function generate() {
      const pdfjsLib = pdfjsRef.current!

      // TODO: remove verbose [PDF] debug logs once font handling is stable
      console.log('[PDF] Step 1: downloading template')
      const pdfRes = await fetch(templateFileUrl)
      if (!pdfRes.ok) throw new Error('Failed to download template PDF')
      if (cancelled) return
      const pdfBytes = await pdfRes.arrayBuffer()
      console.log('[PDF] Step 1 done: got', pdfBytes.byteLength, 'bytes')

      console.log('[PDF] Step 2: loading PDF with pdf-lib')
      const pdfDoc = await PDFDocument.load(pdfBytes)
      pdfDoc.registerFontkit(fontkit)
      const form = pdfDoc.getForm()
      console.log('[PDF] Step 2 done: form loaded')

      const fieldFontCache: Record<string, Uint8Array> = {}
      const dataMap = certificateData as Record<string, unknown>

      console.log('[PDF] Step 3: processing', fields.length, 'fields')
      for (const field of fields) {
        if (!field.is_enabled) {
          console.log('[PDF]   skipping disabled field', field.pdf_field_name)
          continue
        }
        if (field.source_type === 'qr_code') {
          console.log('[PDF]   deferring QR field', field.pdf_field_name)
          continue
        }

        try {
          console.log('[PDF]   processing field', field.pdf_field_name)
          const pdfField = form.getTextField(field.pdf_field_name)
          if (cancelled) return

          let value = ''
          if (field.source_type === 'database' && field.source_key) {
            value = String(dataMap[field.source_key] ?? '')
          } else if (field.source_type === 'custom') {
            value = customValues[field.id] ?? field.custom_default_value ?? ''
          }

          pdfField.setText(value)

          const fontKey = `${field.font_family}-${field.font_source}-${field.uploaded_font_key}`
          if (!fieldFontCache[fontKey]) {
            let fontBytes: ArrayBuffer
            if (field.font_source === 'google') {
              console.log('[PDF]   loading google font:', field.font_family)
              fontBytes = await getGoogleFontBytes(field.font_family)
            } else if (field.uploaded_font_key) {
              console.log('[PDF]   loading uploaded font')
              const fontRes = await fetch(`/api/fonts/uploaded?key=${field.uploaded_font_key}`)
              if (!fontRes.ok) throw new Error(`Font fetch returned ${fontRes.status}`)
              fontBytes = await fontRes.arrayBuffer()
            } else {
              console.log('[PDF]   fallback to google font:', field.font_family)
              fontBytes = await getGoogleFontBytes(field.font_family)
            }
            console.log('[PDF]   font bytes:', fontBytes.byteLength)
            fieldFontCache[fontKey] = new Uint8Array(fontBytes)
          }

          console.log('[PDF]   embedding font')
          const fontBytes = fieldFontCache[fontKey]
          let font

          const compatible = await testFontCompatibility(fontBytes, fontKey)
          if (compatible) {
            font = await pdfDoc.embedFont(fontBytes)
          } else {
            console.log('[PDF]   font incompatible, using Helvetica fallback')
            font = await pdfDoc.embedFont(StandardFonts.Helvetica)
          }

          pdfField.setFontSize(field.font_size)
          pdfField.defaultUpdateAppearances(font)
          console.log('[PDF]   field done')

          const widgets = pdfField.acroField.getWidgets()
          for (const widget of widgets) {
            const ap = widget.getAppearanceCharacteristics()
            if (ap) {
              ap.setBackgroundColor([])
            }
          }
        } catch (err) {
          console.log('[PDF]   field error:', field.pdf_field_name, err)
        }
      }

      console.log('[PDF] Step 4: processing QR fields')
      for (const field of fields) {
        if (!field.is_enabled || field.source_type !== 'qr_code') continue

        try {
          console.log('[PDF]   QR field', field.pdf_field_name)
          const qrField = form.getTextField(field.pdf_field_name)
          const qrWidgets = qrField.acroField.getWidgets()
          if (qrWidgets.length === 0) {
            console.log('[PDF]   no widgets, skipping')
            continue
          }

          const ap = qrWidgets[0].getAppearanceCharacteristics()
          if (ap) ap.setBackgroundColor([])

          const rect = qrWidgets[0].getRectangle()
          console.log('[PDF]   QR rect:', rect)

          console.log('[PDF]   generating QR code')
          const qr = new QrCodeWithLogo({
            content: certificateUrl,
            width: 300,
            logo: {
              src: '/icon.png',
              logoRadius: 6,
            },
            dotsOptions: {
              color: '#1a1a2e',
              type: 'rounded',
            },
          })

          const canvas = await qr.getCanvas()
          const dataUrl = canvas.toDataURL('image/png')
          const base64 = dataUrl.split(',')[1]
          const qrBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
          const qrImage = await pdfDoc.embedPng(qrBytes)

          const pages = pdfDoc.getPages()
          pages[0].drawImage(qrImage, {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          })
          console.log('[PDF]   QR done')
        } catch (err) {
          console.log('[PDF]   QR field error:', field.pdf_field_name, err)
        }
      }

      console.log('[PDF] Step 5: flattening and saving')
      form.flatten()
      const filledBytes = await pdfDoc.save()
      console.log('[PDF] Step 5 done:', filledBytes.length, 'bytes')

      if (cancelled) return

      const blob = new Blob([filledBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      setDownloadUrl(blobUrl)

      console.log('[PDF] Step 6: rendering first page with pdfjs')
      const canvas = canvasRef.current
      const container = containerRef.current
      if (canvas && container) {
        const pdf = await pdfjsLib.getDocument({ data: filledBytes }).promise
        console.log('[PDF]   pdfjs doc loaded, pages:', pdf.numPages)
        const page = await pdf.getPage(1)

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
          console.log('[PDF]   rendering page to canvas')
          await page.render({ canvasContext: ctx, viewport, canvas }).promise
          console.log('[PDF]   canvas render complete')
        }
      }
      console.log('[PDF] All done successfully')
    }

    async function run() {
      setLoading(true)
      setError(null)

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await generate()
          return
        } catch (err) {
          console.error('[PDF] ERROR:', err instanceof Error ? err.message : String(err))
          if (attempt === 0 && err instanceof RangeError) {
            console.log('[PDF] save failed, retrying with Helvetica fallback')
            clearFontCompatibilityCache()
            continue
          }
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Failed to generate PDF')
          }
          return
        } finally {
          if (!cancelled) {
            setLoading(false)
          }
        }
      }
    }

    run()

    return () => { cancelled = true }
  }, [templateFileUrl, fields, certificateData, customValues, certificateUrl, pdfjsReady])

  function handleDownload() {
    if (!downloadUrl) return
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `certificate-${certificateData.slug}.pdf`
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
      {downloadUrl && (
        <div className="flex justify-end">
          <button
            onClick={handleDownload}
            className="rounded-lg bg-bright-sky px-4 py-2 text-white hover:opacity-90 text-sm"
          >
            Download PDF
          </button>
        </div>
      )}

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

async function getGoogleFontBytes(fontName: string): Promise<ArrayBuffer> {
  const apiUrl = `/api/fonts?family=${encodeURIComponent(fontName)}`

  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(apiUrl)
  if (cached) {
    return cached.arrayBuffer()
  }

  const response = await fetch(apiUrl)
  if (!response.ok) {
    throw new Error(`Failed to load font "${fontName}"`)
  }

  const fontBytes = await response.arrayBuffer()
  await cache.put(apiUrl, new Response(fontBytes))
  return fontBytes
}
