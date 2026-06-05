'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { FontPicker } from '@/components/ui/font-picker'
import { uploadFiles } from '@/lib/uploadthing'
import { DATABASE_FIELD_MAP, type SourceType } from '@/lib/pdf-field-mapping'
import type { PdfFontInfo } from '@/lib/pdf-fonts'
import { testFontCompatibility } from '@/lib/font-compat'

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
  uploaded_font_key: string | null
  custom_default_value: string | null
  custom_overridable: boolean
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

export function TemplateFieldEditor({ templateId, lang }: { templateId: string; lang: string }) {
  const t = useTranslations('adminPdfTemplates')
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
        uploaded_font_key: null,
        custom_default_value: '',
        custom_overridable: false,
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
      const res = await fetch(`/api/fonts?family=${encodeURIComponent(field.font_family)}`)
      if (!res.ok) throw new Error('Failed to download font')
      const blob = await res.blob()

      const fileName = `${field.font_family}.ttf`
      const file = new File([blob], fileName, { type: 'font/ttf' })

      await uploadFiles('fontFileUpload', { files: [file] })

      const fontsRes = await fetch('/api/admin/fonts/uploaded')
      const data = await fontsRes.json()
      const updatedFonts = data.fonts ?? []
      setUploadedFonts(updatedFonts)

      const uploaded = updatedFonts.find((uf: UploadedFont) => uf.name === fileName)
      if (uploaded) {
        updateField(index, {
          font_source: 'uploaded',
          uploaded_font_key: uploaded.key,
          font_family: uploaded.name,
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
            onClick={() => setShowPdfPreview(!showPdfPreview)}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
          >
            {showPdfPreview ? t('hidePreview') : t('previewPdf')}
          </button>
          <button
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

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.pdf_field_name + index}
            className="rounded-xl border p-4 space-y-4"
          >
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
                <div className="col-span-1">
                  <p className="text-xs text-muted-foreground pt-6">
                    {t('qrCodeDescription')}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
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

              {field.font_source === 'google' ? (
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">
                    {t('fontFamily')}
                  </label>
                  <div className="flex items-start gap-2">
                    <FontPicker
                      value={field.font_family}
                      onChange={(family) => updateField(index, { font_family: family })}
                      width={300}
                      height={250}
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
                  {field.font_family && incompatibleGoogleFonts.has(field.font_family) && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                      {t('fontIncompatibleWarning')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="col-span-2 space-y-2">
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">
                    {t('uploadedFont')}
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 rounded-lg border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                      value={field.uploaded_font_key ?? ''}
                      onChange={(e) => {
                        const selected = uploadedFonts.find((uf) => uf.key === e.target.value)
                        updateField(index, {
                          uploaded_font_key: e.target.value || null,
                          font_family: selected?.name ?? '',
                        })
                      }}
                    >
                      <option value="">{t('selectUploadedFont')}</option>
                      {uploadedFonts.map((uf) => (
                        <option key={uf.key} value={uf.key}>{uf.name}</option>
                      ))}
                    </select>
                    <label className="cursor-pointer rounded-lg border px-3 py-2 text-sm hover:bg-muted">
                      {uploadingFont ? t('uploading') : t('upload')}
                      <input
                        type="file"
                        accept=".ttf"
                        className="hidden"
                        disabled={uploadingFont}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          if (!file.name.endsWith('.ttf')) return
                          setUploadingFont(true)
                          try {
                            await uploadFiles('fontFileUpload', { files: [file] })
                            const res = await fetch('/api/admin/fonts/uploaded')
                            const data = await res.json()
                            setUploadedFonts(data.fonts ?? [])
                          } catch {
                            /* ignore */
                          } finally {
                            setUploadingFont(false)
                          }
                        }}
                      />
                    </label>
                  </div>
                  {field.uploaded_font_key && incompatibleFontKeys.has(field.uploaded_font_key) && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
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
                />
              </div>
              <div className="col-span-2">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground mb-1">{t('preview')}</p>
                  <p
                    style={{
                      fontFamily: field.font_source === 'uploaded' && field.uploaded_font_key ? `UPLOADED_FONT_${field.uploaded_font_key}` : field.font_family,
                      fontSize: `${Math.min(field.font_size, 48)}px`,
                      lineHeight: 1.2,
                    }}
                  >
                    {field.display_label || field.pdf_field_name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          onClick={addCustomField}
          className="rounded-lg border border-dashed px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
        >
          + {t('addCustomField')}
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleDeleteTemplate}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            {t('deleteTemplate')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || hasUnsavedIds}
            className="rounded-lg bg-bright-sky px-6 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? t('saving') : t('saveMappings')}
          </button>
        </div>
      </div>
    </div>
  )
}
