'use client'

import { useState, useEffect, useRef } from 'react'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QrCodeWithLogo from 'qrcode-with-logos'
import { testFontCompatibility, clearFontCompatibilityCache } from '@/lib/font-compat'
import { formatDate, formatEnglishLevel } from '@/lib/pdf-formatting'

export interface FieldMapping {
  id: string
  pdf_field_name: string
  source_type: string
  source_key: string | null
  display_label: string
  is_enabled: boolean
  font_family: string
  font_size: number
  font_source: string
  font_variant: string
  uploaded_font_key: string | null
  font_id: string | null
  custom_default_value: string | null
  date_format: string | null
  level_format: string | null
  multiline: boolean
  text_color: string | null
  qr_dots_color: string
  qr_bg_color: string
  qr_dots_type: string
  qr_corners_type: string
  qr_corners_color: string
  sort_order: number
}

interface PdfCertificateRendererProps {
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
  viewerLocale?: string
}

const CACHE_NAME = 'pdf-fonts'

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

interface GeneratePdfInput {
  templateFileUrl: string
  fields: FieldMapping[]
  certificateData: PdfCertificateRendererProps['certificateData']
  customValues: Record<string, string>
  certificateUrl: string
  viewerLocale?: string
  cancelled: () => boolean
}

export async function generatePdf(input: GeneratePdfInput) {
  const perfKey = `[perf] generatePdf:${input.certificateData.slug}`
  console.time(perfKey)
  const { templateFileUrl, fields, certificateData, customValues, certificateUrl, viewerLocale } = input
  const cancelled = input.cancelled

  const pdfRes = await fetch(templateFileUrl)
  if (!pdfRes.ok) throw new Error('Failed to download template PDF')
  if (cancelled()) throw new Error('Cancelled')
  const pdfBytes = await pdfRes.arrayBuffer()

  const pdfDoc = await PDFDocument.load(pdfBytes)
  pdfDoc.registerFontkit(fontkit)
  const form = pdfDoc.getForm()

  const fieldFontCache: Record<string, Uint8Array> = {}
  const dataMap = certificateData as Record<string, unknown>
  for (const field of fields) {
    if (!field.is_enabled) continue
    if (field.source_type === 'qr_code') continue

    try {
      const pdfField = form.getTextField(field.pdf_field_name)
      if (cancelled()) throw new Error('Cancelled')

      let value = ''
      if (field.source_type === 'database' && field.source_key) {
        value = String(dataMap[field.source_key] ?? '')
        if (field.source_key === 'createdAt') {
          value = formatDate(value, field.date_format as any, viewerLocale)
        } else if (field.source_key === 'englishLevel') {
          value = formatEnglishLevel(value, field.level_format as any)
        }
      } else if (field.source_type === 'custom') {
        value = customValues[field.id] ?? field.custom_default_value ?? ''
      }

      pdfField.setText(value)

      if (field.multiline) {
        pdfField.enableMultiline()
      }

      if (field.text_color) {
        const parsed = hexToRgb(field.text_color)
        if (parsed) {
          const colorStr = `${(parsed.r / 255).toFixed(3)} ${(parsed.g / 255).toFixed(3)} ${(parsed.b / 255).toFixed(3)} rg`
          const existingDa = pdfField.acroField.getDefaultAppearance() ?? ''
          const cleanedDa = existingDa.replace(/\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+rg\s*/g, '')
          pdfField.acroField.setDefaultAppearance(cleanedDa.trim() ? `${colorStr} ${cleanedDa.trim()}` : colorStr)
          for (const fw of pdfField.acroField.getWidgets()) {
            const widgetDa = fw.getDefaultAppearance()
            if (widgetDa !== undefined) {
              const cleanedWDa = widgetDa.replace(/\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+rg\s*/g, '')
              fw.setDefaultAppearance(cleanedWDa.trim() ? `${colorStr} ${cleanedWDa.trim()}` : colorStr)
            }
          }
        }
      }

      const fontKey = `${field.font_family}-${field.font_variant || 'regular'}-${field.font_source}-${field.font_id || field.uploaded_font_key || ''}`
      if (!fieldFontCache[fontKey]) {
        let fontBytes: ArrayBuffer
        if (field.font_source === 'google') {
          fontBytes = await getGoogleFontBytes(field.font_family, field.font_variant)
        } else if (field.uploaded_font_key) {
          const fontRes = await fetch(`/api/fonts/uploaded?key=${field.uploaded_font_key}`)
          if (!fontRes.ok) throw new Error(`Font fetch returned ${fontRes.status}`)
          fontBytes = await fontRes.arrayBuffer()
        } else if (field.font_id) {
          const fontRes = await fetch(`/api/fonts/uploaded?id=${field.font_id}`)
          if (!fontRes.ok) throw new Error(`Font fetch returned ${fontRes.status}`)
          fontBytes = await fontRes.arrayBuffer()
        } else {
          fontBytes = await getGoogleFontBytes(field.font_family, field.font_variant)
        }
        fieldFontCache[fontKey] = new Uint8Array(fontBytes)
      }

      const fontBytes = fieldFontCache[fontKey]
      let font

      const compatible = await testFontCompatibility(fontBytes, fontKey)
      if (compatible) {
        font = await pdfDoc.embedFont(fontBytes)
      } else {
        font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      }

      pdfField.setFontSize(field.font_size)
      pdfField.defaultUpdateAppearances(font)

      const widgets = pdfField.acroField.getWidgets()
      for (const widget of widgets) {
        const ap = widget.getAppearanceCharacteristics()
        if (ap) {
          ap.setBackgroundColor([])
        }
      }
    } catch (err) {
      console.log('[PDF]   field error:', err)
    }
  }

  const qrFields = fields.filter((f) => f.is_enabled && f.source_type === 'qr_code')
  await Promise.all(qrFields.map(async (field) => {
    try {
      const qrField = form.getTextField(field.pdf_field_name)
      qrField.setText('')
      const qrWidgets = qrField.acroField.getWidgets()
      if (qrWidgets.length === 0) return

      const ap = qrWidgets[0].getAppearanceCharacteristics()
      if (ap) ap.setBackgroundColor([])

      const rect = qrWidgets[0].getRectangle()

      const qr = new QrCodeWithLogo({
        content: certificateUrl,
        width: 300,
        logo: {
          src: '/icon.png',
          logoRadius: 6,
        },
        dotsOptions: {
          color: field.qr_dots_color,
          type: field.qr_dots_type as any,
        },
        cornersOptions: {
          color: field.qr_corners_color,
          type: field.qr_corners_type as any,
        },
        nodeQrCodeOptions: {
          color: {
            dark: field.qr_dots_color,
            light: field.qr_bg_color === 'transparent' ? 'rgba(255,255,255,0)' : field.qr_bg_color,
          },
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
    } catch (err) {
      console.log('[PDF]   QR field error:', err)
    }
  }))

  form.flatten()
  const filledBytes = await pdfDoc.save()
  console.timeEnd(perfKey)

  const blob = new Blob([filledBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  const blobUrl = URL.createObjectURL(blob)
  return { blobUrl, filledBytes }
}

async function prepareCertificate(
  templateFileUrl: string,
  fields: FieldMapping[],
  certificateData: PdfCertificateRendererProps['certificateData'],
  customValues: Record<string, string>,
  certificateUrl: string,
  viewerLocale: string | undefined,
  pdfjsLib: any,
  cancelled: () => boolean,
): Promise<{ success: true; blobUrl: string; filledBytes: Uint8Array } | { success: false; error?: string }> {
  try {
    const result = await generatePdf({
      templateFileUrl, fields, certificateData, customValues, certificateUrl, viewerLocale,
      cancelled,
    })
    if (cancelled()) return { success: false as const }
    return { success: true as const, blobUrl: result.blobUrl, filledBytes: result.filledBytes }
  } catch (err) {
    console.error('[PDF] ERROR:', err instanceof Error ? err.message : String(err))
    if (!(err instanceof RangeError)) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to generate PDF' }
    }
    console.log('[PDF] save failed, retrying with Helvetica fallback')
    clearFontCompatibilityCache()
  }

  try {
    const result = await generatePdf({
      templateFileUrl, fields, certificateData, customValues, certificateUrl, viewerLocale,
      cancelled,
    })
    if (cancelled()) return { success: false as const }
    return { success: true as const, blobUrl: result.blobUrl, filledBytes: result.filledBytes }
  } catch (err) {
    console.error('[PDF] ERROR:', err instanceof Error ? err.message : String(err))
    return { success: false, error: err instanceof Error ? err.message : 'Failed to generate PDF' }
  }
}

export function PdfCertificateRenderer({
  templateFileUrl,
  fields,
  certificateData,
  customValues,
  certificateUrl,
  viewerLocale,
}: PdfCertificateRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const pdfjsRef = useRef<any>(null)

  useEffect(() => {
    const perfKey = `[perf] PdfCertificateRenderer:${certificateData.slug}`
    console.time(perfKey)
    let cancelled = false

    async function run() {
      const mod = await ensurePdfjs()
      if (cancelled) return
      pdfjsRef.current = mod

      setLoading(true)
      setError(null)

      const result = await prepareCertificate(
        templateFileUrl, fields, certificateData, customValues, certificateUrl, viewerLocale,
        pdfjsRef.current!, () => cancelled,
      )
      if (cancelled) return
      if (!result.success) {
        if (result.error) setError(result.error)
        setLoading(false)
        console.timeEnd(perfKey)
        return
      }

      setDownloadUrl(result.blobUrl)

      const canvas = canvasRef.current
      const container = containerRef.current
      if (canvas && container) {
        const pdfjsLib = pdfjsRef.current!
        const pdf = await pdfjsLib.getDocument({ data: result.filledBytes }).promise
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
          await page.render({ canvasContext: ctx, viewport, canvas }).promise
        }
      }
      setLoading(false)
      console.timeEnd(perfKey)
    }

    run()

    return () => { cancelled = true }
  }, [templateFileUrl, fields, certificateData, customValues, certificateUrl, viewerLocale])

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
            type="button"
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

async function getGoogleFontBytes(fontName: string, variant = 'regular'): Promise<ArrayBuffer> {
  const apiUrl = `/api/fonts?family=${encodeURIComponent(fontName)}&variant=${variant}`

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

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 6 && clean.length !== 3) return null
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const num = parseInt(full, 16)
  if (isNaN(num)) return null
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}
