'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { FontPicker } from '@/components/ui/font-picker'
import { ColorPicker } from '@/components/ui/color-picker'
import { uploadFiles } from '@/lib/uploadthing'
import { DATABASE_FIELD_MAP, type SourceType } from '@/lib/pdf-field-mapping'
import type { PdfFontInfo } from '@/lib/pdf-fonts'
import { testFontCompatibility } from '@/lib/font-compat'
import { getPreviewDate, getPreviewLevel } from '@/lib/pdf-formatting'
import type { GoogleFont } from '@/lib/fonts'
import { fetchGoogleFonts } from '@/lib/fonts'
import { groupVariants, groupUploadedFonts, parseFontFilename } from '@/lib/font-variants'
import QrCodeWithLogo from 'qrcode-with-logos'

const QR_DOT_TYPES = ['square', 'dot', 'dot-small', 'tile', 'rounded', 'diamond', 'star', 'fluid', 'fluid-line', 'stripe', 'stripe-row', 'stripe-column'] as const
const QR_CORNER_TYPES = ['square', 'rounded', 'circle', 'rounded-circle', 'circle-rounded', 'circle-star', 'circle-diamond'] as const

type FieldMapping = {
  id: string
  pdf_field_name: string
  source_type: SourceType
  source_key: string | null
  display_label: string
  is_enabled: boolean
  font_family: string
  font_size: number
  font_source: string
  font_variant: string
  uploaded_font_key: string | null
  custom_default_value: string | null
  custom_overridable: boolean
  date_format: string | null
  level_format: string | null
  text_color: string | null
  qr_dots_color: string
  qr_bg_color: string
  qr_dots_type: string
  qr_corners_type: string
  qr_corners_color: string
  sort_order: number
}

interface UploadedFont {
  key: string
  name: string
}

interface TemplateData {
  id: string
  name: string
  description: string | null
  file_url: string
  pdf_template_fields: FieldMapping[]
}

function getContrastBg(hex: string | null): string {
  if (!hex || hex === '#000000') return ''
  const clean = hex.replace('#', '')
  if (clean.length !== 6 && clean.length !== 3) return ''
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const r = parseInt(full.substring(0, 2), 16) / 255
  const g = parseInt(full.substring(2, 4), 16) / 255
  const b = parseInt(full.substring(4, 6), 16) / 255
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.5 ? '#1a1a2e' : '#f8f9fa'
}

function QrCodeLivePreview({ content, dotsColor, bgColor, dotsType, cornersType, cornersColor }: {
  content: string
  dotsColor: string
  bgColor: string
  dotsType: string
  cornersType: string
  cornersColor: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false
    const qr = new QrCodeWithLogo({
      content,
      width: 300,
      nodeQrCodeOptions: { color: { dark: dotsColor, light: bgColor === 'transparent' ? 'rgba(255,255,255,0)' : bgColor }, margin: 2 },
      dotsOptions: { color: dotsColor, type: dotsType as any },
      cornersOptions: { color: cornersColor, type: cornersType as any },
    })

    qr.getCanvas().then((c: HTMLCanvasElement) => {
      if (cancelled) return
      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx) return
      const canvas = canvasRef.current!
      canvas.width = c.width
      canvas.height = c.height
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(c, 0, 0)
    }).catch(() => {
      if (cancelled) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = 140
      canvas.height = 140
      ctx.clearRect(0, 0, 140, 140)
    })

    return () => { cancelled = true }
  }, [content, dotsColor, bgColor, dotsType, cornersType, cornersColor])

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg border"
      style={{ width: 140, height: 140 }}
    />
  )
}

export function TemplateFieldEditor({ templateId, lang }: { templateId: string; lang: string }) {
  const t = useTranslations('adminPdfTemplates')
  const langPicker = useTranslations('adminFonts')
  const locale = useLocale()
  const localePangram = locale !== 'en' ? langPicker('pangram') : undefined
  const router = useRouter()
  const [template, setTemplate] = useState<TemplateData | null>(null)
  const [fields, setFields] = useState<FieldMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPdfPreview, setShowPdfPreview] = useState(false)
  const [uploadedFonts, setUploadedFonts] = useState<UploadedFont[]>([])
  const [uploadingFont, setUploadingFont] = useState(false)
  const [savingFont, setSavingFont] = useState(false)
  const [pdfFonts, setPdfFonts] = useState<PdfFontInfo[]>([])
  const [showPdfFonts, setShowPdfFonts] = useState(false)
  const [incompatibleFontKeys, setIncompatibleFontKeys] = useState<Set<string>>(new Set())
  const [incompatibleGoogleFonts, setIncompatibleGoogleFonts] = useState<Set<string>>(new Set())
  const fontVariantStyleId = useRef<string | null>(null)

  const [googleFonts, setGoogleFonts] = useState<GoogleFont[]>([])
  const [selectedFieldIndex, setSelectedFieldIndex] = useState(0)

  const sortedFields = useMemo(() => {
    const dbOrder = new Map(DATABASE_FIELD_MAP.map((e, i) => [e.key, i]))
    return fields.toSorted((a, b) => {
      const aKey = a.source_key
      const bKey = b.source_key
      const aIsDb = a.source_type === 'database' && aKey != null && dbOrder.has(aKey)
      const bIsDb = b.source_type === 'database' && bKey != null && dbOrder.has(bKey)

      if (aIsDb && bIsDb) return dbOrder.get(aKey)! - dbOrder.get(bKey)!
      if (aIsDb) return -1
      if (bIsDb) return 1

      if (a.source_type === 'qr_code' && b.source_type !== 'qr_code') return -1
      if (a.source_type !== 'qr_code' && b.source_type === 'qr_code') return 1
      return 0
    })
  }, [fields])

  const selectedFont = useMemo(() => {
    const field = fields[selectedFieldIndex]
    if (!field || field.font_source !== 'google' || !field.font_family) return null
    return googleFonts.find((f) => f.family === field.font_family) ?? null
  }, [fields, selectedFieldIndex, googleFonts])

  const uploadedFontGroups = useMemo(() => groupUploadedFonts(uploadedFonts), [uploadedFonts])

  const currentUploadedFont = useMemo(() => {
    const field = fields[selectedFieldIndex]
    if (field?.font_source !== 'uploaded' || !field.uploaded_font_key) return null
    return uploadedFonts.find((uf) => uf.key === field.uploaded_font_key) ?? null
  }, [fields, selectedFieldIndex, uploadedFonts])

  const currentUploadedParsed = useMemo(() => {
    if (!currentUploadedFont) return null
    return parseFontFilename(currentUploadedFont.name)
  }, [currentUploadedFont])

  useEffect(() => {
    fetch(`/api/admin/pdf-templates/${templateId}`)
      .then((r) => r.json())
      .then((data) => {
        setTemplate(data.template)
        setFields(data.template?.pdf_template_fields ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [templateId])

  useEffect(() => {
    fetch('/api/admin/fonts/uploaded')
      .then((r) => r.json())
      .then((data) => setUploadedFonts(data.fonts ?? []))
      .catch(() => {})
    fetchGoogleFonts()
      .then(setGoogleFonts)
      .catch(() => {})
  }, [])

  useEffect(() => {
    const uploadedKeys = fields
      .filter((f) => f.font_source === 'uploaded' && f.uploaded_font_key)
      .map((f) => f.uploaded_font_key!)

    const existing = document.getElementById('uploaded-font-styles')
    if (existing) existing.remove()

    if (uploadedKeys.length === 0) return

    const styleEl = document.createElement('style')
    styleEl.id = 'uploaded-font-styles'
    styleEl.textContent = uploadedKeys
      .map(
        (key) =>
          `@font-face{font-family:UPLOADED_FONT_${key};src:url("/api/fonts/uploaded?key=${key}") format("truetype");}`,
      )
      .join('')
    document.head.appendChild(styleEl)

    return () => {
      const el = document.getElementById('uploaded-font-styles')
      if (el) el.remove()
    }
  }, [fields])

  useEffect(() => {
    const uploadedKeys = fields
      .filter((f) => f.font_source === 'uploaded' && f.uploaded_font_key)
      .map((f) => f.uploaded_font_key!)

    if (uploadedKeys.length === 0) return

    let cancelled = false

    Promise.all(
      uploadedKeys.map(async (key) => {
        try {
          const res = await fetch(`/api/fonts/uploaded?key=${key}`)
          if (!res.ok) {
            console.warn('[FontCheck] fetch failed for uploaded font', key, res.status)
            return null
          }
          const buf = await res.arrayBuffer()
          const compatible = await testFontCompatibility(new Uint8Array(buf), `uploaded:${key}`)
          return compatible ? null : key
        } catch (err) {
          console.warn('[FontCheck] error checking uploaded font', key, err)
          return null
        }
      }),
    ).then((results) => {
      if (cancelled) return
      const incompatible = results.filter(Boolean) as string[]
      if (incompatible.length === 0) return
      setIncompatibleFontKeys((prev) => {
        const next = new Set(prev)
        for (const key of incompatible) next.add(key)
        return next
      })
    })

    return () => { cancelled = true }
  }, [fields])

  useEffect(() => {
    const googleFonts = fields
      .filter((f) => f.font_source === 'google' && f.font_family)
      .map((f) => f.font_family)

    if (googleFonts.length === 0) return

    let cancelled = false

    Promise.all(
      googleFonts.map(async (family) => {
        try {
          const res = await fetch(`/api/fonts?family=${encodeURIComponent(family)}`)
          if (!res.ok) {
            console.warn('[FontCheck] fetch failed for Google font', family, res.status)
            return null
          }
          const buf = await res.arrayBuffer()
          const compatible = await testFontCompatibility(new Uint8Array(buf), `google:${family}`)
          return compatible ? null : family
        } catch (err) {
          console.warn('[FontCheck] error checking Google font', family, err)
          return null
        }
      }),
    ).then((results) => {
      if (cancelled) return
      const incompatible = results.filter(Boolean) as string[]
      if (incompatible.length === 0) return
      setIncompatibleGoogleFonts((prev) => {
        const next = new Set(prev)
        for (const family of incompatible) next.add(family)
        return next
      })
    })

    return () => { cancelled = true }
  }, [fields])

  useEffect(() => {
    const prev = fontVariantStyleId.current
    if (prev) {
      const el = document.getElementById(prev)
      if (el) el.remove()
      fontVariantStyleId.current = null
    }

    const field = fields[selectedFieldIndex]
    if (!field || field.font_source !== 'google' || !field.font_family) return

    const font = googleFonts.find((f) => f.family === field.font_family)
    if (!font?.files) return

    const variant = field.font_variant || 'regular'
    const fileUrl = font.files[variant]
    if (!fileUrl) return

    const numericWeight = variant === 'regular' ? '400' : variant === 'italic' ? '400' : variant.replace('italic', '')
    const fontStyle = variant === 'italic' || variant.endsWith('italic') ? 'italic' : 'normal'
    const fontFamilyKey = `${font.family}-${variant}`

    const id = `gfont-variant-${fontFamilyKey.replace(/[^a-zA-Z0-9-]/g, '')}`
    const existing = document.getElementById(id)
    if (existing) {
      existing.remove()
    }

    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      @font-face {
        font-family: "${fontFamilyKey}";
        src: url("${fileUrl}") format("truetype");
        font-weight: ${numericWeight};
        font-style: ${fontStyle};
      }
    `
    document.head.appendChild(style)
    fontVariantStyleId.current = id
  }, [fields, selectedFieldIndex, googleFonts])

  const updateField = useCallback((index: number, updates: Partial<FieldMapping>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)))
  }, [])

  function addCustomField() {
    setFields((prev) => [
      ...prev,
      {
        id: '',
        pdf_field_name: `custom_${Date.now()}`,
        source_type: 'custom',
        source_key: null,
        display_label: 'New Field',
        is_enabled: true,
        font_family: 'Inter',
        font_size: 12,
        font_source: 'google',
        font_variant: 'regular',
        uploaded_font_key: null,
        custom_default_value: '',
        custom_overridable: false,
        date_format: null,
        level_format: null,
        text_color: null,
        qr_dots_color: '#1a1a2e',
        qr_bg_color: '#FFFFFF',
        qr_dots_type: 'rounded',
        qr_corners_type: 'square',
        qr_corners_color: '#1a1a2e',
        sort_order: prev.length,
      },
    ])
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch(`/api/admin/pdf-templates/${templateId}/fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: fields.map((f, i) => ({ ...f, sort_order: i })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save fields')
      }

      const { fields: savedFields } = await res.json()
      setFields(savedFields)
      setSuccess(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleRefreshFields() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/pdf-templates/${templateId}/parse`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to parse PDF')
      }
      const data = await res.json()
      setFields(data.fields)
      setPdfFonts(data.pdfFonts ?? [])
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteTemplate() {
    if (!confirm(t('deleteTemplateConfirm'))) return
    try {
      const res = await fetch(`/api/admin/pdf-templates/${templateId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.push(`/${lang}/admin/pdf-templates`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  async function handleSaveFont(index: number) {
    const field = fields[index]
    if (!field.font_family) return

    setSavingFont(true)
    setError('')
    try {
      const variant = field.font_variant || 'regular'
      const res = await fetch(`/api/fonts?family=${encodeURIComponent(field.font_family)}&variant=${variant}`)
      if (!res.ok) throw new Error('Failed to download font')
      const blob = await res.blob()

      const variantSuffix = variant !== 'regular' ? `-${variant}` : ''
      const fileName = `${field.font_family}${variantSuffix}.ttf`
      const file = new File([blob], fileName, { type: 'font/ttf' })

      await uploadFiles('fontFileUpload', { files: [file] })

      const fontsRes = await fetch('/api/admin/fonts/uploaded')
      const data = await fontsRes.json()
      const updatedFonts = data.fonts ?? []
      setUploadedFonts(updatedFonts)

      const uploaded = updatedFonts.find((uf: UploadedFont) => uf.name === fileName)
      if (uploaded) {
        const { variant } = parseFontFilename(uploaded.name)
        updateField(index, {
          font_source: 'uploaded',
          uploaded_font_key: uploaded.key,
          font_family: `UPLOADED_FONT_${uploaded.key}`,
          font_variant: variant,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save font')
    } finally {
      setSavingFont(false)
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">{t('loading')}</div>
  }

  if (!template) {
    return <div className="text-red-500">{t('templateNotFound')}</div>
  }

  const hasUnsavedIds = fields.some((f) => !f.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{template.name}</h2>
          {template.description && (
            <p className="text-sm text-muted-foreground">{template.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPdfPreview(!showPdfPreview)}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
          >
            {showPdfPreview ? t('hidePreview') : t('previewPdf')}
          </button>
          <button
            type="button"
            onClick={handleRefreshFields}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
          >
            {t('refreshFields')}
          </button>
        </div>
      </div>

      {showPdfPreview && template.file_url && (
        <div className="rounded-xl border overflow-hidden">
          <iframe
            src={template.file_url}
            className="h-[500px] w-full"
            title="PDF Preview"
            sandbox="allow-scripts"
          />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-600">
          {t('savedSuccess')}
        </div>
      )}

      {pdfFonts.length > 0 && (
        <div className="rounded-xl border p-4 space-y-3">
          <button
            type="button"
            onClick={() => setShowPdfFonts(!showPdfFonts)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-sm font-semibold">{t('pdfFontsUsed')} ({pdfFonts.length})</h3>
            <span className="text-xs text-muted-foreground">{showPdfFonts ? '▲' : '▼'}</span>
          </button>
          {showPdfFonts && (
            <div className="space-y-1.5">
              {pdfFonts.map((font) => (
                <div key={font.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{font.name}</span>
                    <span className="text-xs text-muted-foreground">{font.subtype}</span>
                  </div>
                  <span className={`text-xs ${font.embedded ? 'text-green-600' : 'text-amber-600'}`}>
                    {font.embedded ? t('fontEmbedded') : t('fontStandard')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-6">
        <div className="w-56 shrink-0 space-y-1">
          {sortedFields.map((field, sortedIndex) => {
            const originalIndex = fields.indexOf(field)
            return (
              <button
                type="button"
                key={field.pdf_field_name + sortedIndex}
                onClick={() => setSelectedFieldIndex(originalIndex)}
                className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  originalIndex === selectedFieldIndex
                    ? 'bg-bright-sky/10 text-bright-sky font-medium'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <input
                  type="checkbox"
                  checked={field.is_enabled}
                  onChange={(e) => {
                    e.stopPropagation()
                    updateField(originalIndex, { is_enabled: e.target.checked })
                  }}
                  className="rounded shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={field.pdf_field_name ? `Toggle field "${field.pdf_field_name}"` : 'Toggle field enabled'}
                />
                <span className="truncate">{field.pdf_field_name}</span>
              </button>
            )
          })}
          <button
            type="button"
            onClick={addCustomField}
            className="w-full rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            + {t('addCustomField')}
          </button>
        </div>

        <div className="flex-1 min-w-0">
          {fields.length > 0 && selectedFieldIndex < fields.length && (() => {
            const field = fields[selectedFieldIndex]
            const index = selectedFieldIndex
            return (
              <div className="rounded-xl border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {field.pdf_field_name}
                    </span>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={field.is_enabled}
                        onChange={(e) => updateField(index, { is_enabled: e.target.checked })}
                        className="rounded"
                      />
                      {t('enabled')}
                    </label>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    #{index + 1}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-muted-foreground">
                      {t('sourceType')}
                    </label>
                    <select
                      className="w-full rounded-lg border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                      value={field.source_type}
                      onChange={(e) => {
                        const st = e.target.value as SourceType
                        const updates: Partial<FieldMapping> = { source_type: st, source_key: null }
                        if (st === 'custom') {
                          updates.display_label = field.pdf_field_name
                          updates.custom_default_value = ''
                          updates.custom_overridable = false
                        }
                        updateField(index, updates)
                      }}
                    >
                      <option value="database">{t('sourceDatabase')}</option>
                      <option value="custom">{t('sourceCustom')}</option>
                      <option value="qr_code">{t('sourceQrCode')}</option>
                    </select>
                  </div>

                  {field.source_type === 'database' && (
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">
                        {t('databaseField')}
                      </label>
                      <select
                        className="w-full rounded-lg border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                        value={field.source_key ?? ''}
                        onChange={(e) => updateField(index, { source_key: e.target.value })}
                      >
                        <option value="">{t('selectField')}</option>
                        {DATABASE_FIELD_MAP.map((dk) => (
                          <option key={dk.key} value={dk.key}>{dk.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {field.source_type === 'custom' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">
                          {t('displayLabel')}
                        </label>
                        <input
                          type="text"
                          className="w-full rounded-lg border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                          value={field.display_label}
                          onChange={(e) => updateField(index, { display_label: e.target.value })}
                          aria-label="Display label for custom field"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">
                          {t('defaultValue')}
                        </label>
                        <input
                          type="text"
                          className="w-full rounded-lg border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                          value={field.custom_default_value ?? ''}
                          onChange={(e) => updateField(index, { custom_default_value: e.target.value })}
                          aria-label="Default value for custom field"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.custom_overridable}
                            onChange={(e) => updateField(index, { custom_overridable: e.target.checked })}
                            className="rounded"
                          />
                          <span>{t('overridableOnApproval')}</span>
                        </label>
                      </div>
                    </>
                  )}

                  {field.source_type === 'qr_code' && (
                    <div className="col-span-2 space-y-4">
                      <p className="text-xs text-muted-foreground">{t('qrCodeDescription')}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-medium mb-2 text-muted-foreground">{t('qrDotsColor')}</label>
                            <ColorPicker
                              value={field.qr_dots_color}
                              onChange={(color) => updateField(index, { qr_dots_color: color, qr_corners_color: color })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-2 text-muted-foreground">{t('qrBgColor')}</label>
                            <div className="flex gap-2 items-center">
                              <ColorPicker
                                value={field.qr_bg_color === 'transparent' ? '#FFFFFF' : field.qr_bg_color}
                                onChange={(color) => updateField(index, { qr_bg_color: color })}
                              />
                              <button
                                type="button"
                                onClick={() => updateField(index, { qr_bg_color: field.qr_bg_color === 'transparent' ? '#FFFFFF' : 'transparent' })}
                                className={`rounded-lg px-3 py-1.5 text-xs border transition-colors ${
                                  field.qr_bg_color === 'transparent'
                                    ? 'bg-bright-sky text-white border-bright-sky'
                                    : 'bg-background text-muted-foreground border hover:bg-muted'
                                }`}
                              >
                                {t('transparent')}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1 text-muted-foreground">{t('qrDotsType')}</label>
                            <select
                              className="w-full rounded-lg border bg-background p-2 text-sm"
                              value={field.qr_dots_type}
                              onChange={(e) => updateField(index, { qr_dots_type: e.target.value })}
                            >
                              {QR_DOT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1 text-muted-foreground">{t('qrCornersType')}</label>
                            <select
                              className="w-full rounded-lg border bg-background p-2 text-sm"
                              value={field.qr_corners_type}
                              onChange={(e) => updateField(index, { qr_corners_type: e.target.value })}
                            >
                              {QR_CORNER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex items-start justify-center pt-6">
                          <QrCodeLivePreview
                            content="https://example.com/certificate/TEST123"
                            dotsColor={field.qr_dots_color}
                            bgColor={field.qr_bg_color}
                            dotsType={field.qr_dots_type}
                            cornersType={field.qr_corners_type}
                            cornersColor={field.qr_corners_color}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4" style={{ display: field.source_type === 'qr_code' ? 'none' : 'grid' }}>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-2 text-muted-foreground">
                      {t('fontSource')}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateField(index, { font_source: 'google', uploaded_font_key: null })}
                        className={`rounded-lg px-3 py-1.5 text-sm border transition-colors ${
                          field.font_source === 'google'
                            ? 'bg-bright-sky text-white border-bright-sky'
                            : 'bg-background text-muted-foreground border hover:bg-muted'
                        }`}
                      >
                        {t('fontSourceGoogle')}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField(index, { font_source: 'uploaded', font_family: '' })}
                        className={`rounded-lg px-3 py-1.5 text-sm border transition-colors ${
                          field.font_source === 'uploaded'
                            ? 'bg-bright-sky text-white border-bright-sky'
                            : 'bg-background text-muted-foreground border hover:bg-muted'
                        }`}
                      >
                        {t('fontSourceUploaded')}
                      </button>
                    </div>
                  </div>

                  {field.font_source === 'uploaded' ? (
                    <div className="col-span-2 space-y-3">
                      {uploadedFontGroups.length === 0 ? (
                        <p className="text-xs text-muted-foreground">{t('noUploadedFonts')}</p>
                      ) : (
                        <>
                          <div>
                            <label className="block text-xs font-medium mb-1 text-muted-foreground">
                              {t('uploadedFont')}
                            </label>
                            <select
                              className="w-full rounded-lg border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                              value={currentUploadedParsed?.family ?? ''}
                              onChange={(e) => {
                                const family = e.target.value
                                if (!family) return
                                const group = uploadedFontGroups.find((g) => g.family === family)
                                if (!group) return
                                const entry = group.variants.find((v) => v.variant === 'regular') ?? group.variants[0]
                                updateField(index, {
                                  uploaded_font_key: entry.key,
                                  font_family: `UPLOADED_FONT_${entry.key}`,
                                  font_variant: entry.variant,
                                })
                              }}
                            >
                              <option value="">{t('selectUploadedFont')}</option>
                              {uploadedFontGroups.map((g) => (
                                <option key={g.family} value={g.family}>{g.family}</option>
                              ))}
                            </select>
                          </div>
                          {currentUploadedParsed && (() => {
                            const group = uploadedFontGroups.find((g) => g.family === currentUploadedParsed!.family)
                            if (!group || group.variants.length === 0) return null
                            if (group.variants.length === 1) return null
                            const { normal, italic } = groupVariants(group.variants.map((v) => v.variant))
                            return (
                              <div>
                                <label className="block text-xs font-medium mb-1 text-muted-foreground">
                                  {t('fontVariant')}
                                </label>
                                <select
                                  className="w-full rounded-lg border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                                  value={currentUploadedParsed!.variant}
                                  onChange={(e) => {
                                    const entry = group.variants.find((v) => v.variant === e.target.value)
                                    if (entry) {
                                      updateField(index, {
                                        uploaded_font_key: entry.key,
                                        font_family: `UPLOADED_FONT_${entry.key}`,
                                        font_variant: entry.variant,
                                      })
                                    }
                                  }}
                                >
                                  {normal.length > 0 && (
                                    <optgroup label="Normal">
                                      {normal.map((v) => (
                                        <option key={v.key} value={v.key}>{v.label}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {italic.length > 0 && (
                                    <optgroup label="Italic">
                                      {italic.map((v) => (
                                        <option key={v.key} value={v.key}>{v.label}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                              </div>
                            )
                          })()}
                        </>
                      )}
                      <div>
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">
                          {t('uploadLabel')}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept=".ttf,.otf,.woff,.woff2"
                            className="text-xs"
                            aria-label="Upload font file"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              setUploadingFont(true)
                              try {
                                const [res] = await uploadFiles('fontFileUpload', { files: [file] })
                                setUploadedFonts((prev) => [...prev, { key: res.key, name: file.name }])
                                updateField(index, { font_source: 'uploaded', uploaded_font_key: res.key, font_family: `UPLOADED_FONT_${res.key}` })
                              } catch { /* noop */ }
                              setUploadingFont(false)
                            }}
                          />
                          {uploadingFont && <span className="text-xs text-muted-foreground">{t('uploading')}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('uploadNamingHint')}
                        </p>
                      </div>
                      {field.uploaded_font_key && incompatibleFontKeys.has(field.uploaded_font_key) && (
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                          {t('fontIncompatibleWarning')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="col-span-2">
                      <div className="flex items-start gap-2">
                        <FontPicker
                          value={field.font_family || ''}
                          localePangram={localePangram}
                          onChange={(family) => updateField(index, { font_family: family, font_variant: 'regular' })}
                        />
                        <button
                          type="button"
                          disabled={!field.font_family || savingFont}
                          onClick={() => handleSaveFont(index)}
                          className="rounded-lg bg-bright-sky px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                        >
                          {savingFont ? t('savingFont') : t('saveFont')}
                        </button>
                      </div>
                      {field.font_family && selectedFont && selectedFont.variants.length > 0 && (
                        <div className="mt-2">
                          <label className="block text-xs font-medium mb-1 text-muted-foreground">
                            {t('fontVariant')}
                          </label>
                          <select
                            className="w-full rounded-lg border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                            value={field.font_variant}
                            onChange={(e) => updateField(index, { font_variant: e.target.value })}
                          >
                            {(() => {
                              const { normal, italic } = groupVariants(selectedFont.variants)
                              return (
                                <>
                                  {normal.length > 0 && (
                                    <optgroup label="Normal">
                                      {normal.map((v) => (
                                        <option key={v.key} value={v.key}>{v.label}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {italic.length > 0 && (
                                    <optgroup label="Italic">
                                      {italic.map((v) => (
                                        <option key={v.key} value={v.key}>{v.label}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                </>
                              )
                            })()}
                          </select>
                        </div>
                      )}
                      {field.font_family && incompatibleGoogleFonts.has(field.font_family) && (
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                          {t('fontIncompatibleWarning')}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium mb-1 text-muted-foreground">
                      {t('fontSize')}
                    </label>
                    <input
                      type="number"
                      min={4}
                      max={200}
                      className="w-full rounded-lg border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                      value={field.font_size}
                      onChange={(e) => updateField(index, { font_size: parseInt(e.target.value, 10) || 12 })}
                      aria-label="Font size"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4" style={{ display: field.source_type === 'qr_code' ? 'none' : 'block' }}>
                  <div>
                    <label className="block text-xs font-medium mb-2 text-muted-foreground">
                      {t('textColor')}
                    </label>
                    <ColorPicker
                      value={field.text_color || '#000000'}
                      onChange={(color) => updateField(index, { text_color: color === '#000000' ? null : color })}
                    />
                  </div>

                  {field.source_type === 'database' && field.source_key === 'createdAt' && (
                    <div>
                      <label className="block text-xs font-medium mb-2 text-muted-foreground">
                        {t('dateFormat')}
                      </label>
                      <div className="flex gap-2">
                        {(['usa', 'gb', 'locale'] as const).map((fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => updateField(index, { date_format: fmt === 'usa' ? null : fmt })}
                            className={`rounded-lg px-3 py-1.5 text-sm border transition-colors ${
                              (field.date_format || 'usa') === fmt
                                ? 'bg-bright-sky text-white border-bright-sky'
                                : 'bg-background text-muted-foreground border hover:bg-muted'
                            }`}
                          >
                            {t(`dateFormat${fmt.charAt(0).toUpperCase()}${fmt.slice(1)}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {field.source_type === 'database' && field.source_key === 'englishLevel' && (
                    <div>
                      <label className="block text-xs font-medium mb-2 text-muted-foreground">
                        {t('levelFormat')}
                      </label>
                      <div className="flex gap-2">
                        {(['short', 'text', 'long'] as const).map((fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => updateField(index, { level_format: fmt === 'short' ? null : fmt })}
                            className={`rounded-lg px-3 py-1.5 text-sm border transition-colors ${
                              (field.level_format || 'short') === fmt
                                ? 'bg-bright-sky text-white border-bright-sky'
                                : 'bg-background text-muted-foreground border hover:bg-muted'
                            }`}
                          >
                            {t(`levelFormat${fmt.charAt(0).toUpperCase()}${fmt.slice(1)}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="col-span-2">
                    <div
                      className="rounded-lg border p-3"
                      style={{ backgroundColor: getContrastBg(field.text_color) || 'rgb(0 0 0 / 0.03)' }}
                    >
                      <p className="text-xs text-muted-foreground mb-1">{t('preview')}</p>
                      <p
                        style={{
                          fontFamily: field.font_source === 'uploaded' && field.uploaded_font_key
                            ? `UPLOADED_FONT_${field.uploaded_font_key}`
                            : field.font_source === 'google' && field.font_variant && field.font_variant !== 'regular' && selectedFont?.files?.[field.font_variant]
                              ? `${field.font_family}-${field.font_variant}`
                              : field.font_family,
                          fontSize: `${Math.min(field.font_size, 48)}px`,
                          lineHeight: 1.2,
                          color: field.text_color || undefined,
                        }}
                      >
                        {field.source_type === 'database' && field.source_key === 'createdAt'
                          ? getPreviewDate(field.date_format as any, locale)
                          : field.source_type === 'database' && field.source_key === 'englishLevel'
                            ? getPreviewLevel(field.level_format as any)
                            : field.display_label || field.pdf_field_name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-4 border-t">
        <button
          type="button"
          onClick={handleDeleteTemplate}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          {t('deleteTemplate')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || hasUnsavedIds}
          className="rounded-lg bg-bright-sky px-6 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? t('saving') : t('saveMappings')}
        </button>
      </div>
    </div>
  )
}
