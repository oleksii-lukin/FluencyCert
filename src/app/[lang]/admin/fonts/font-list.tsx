'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { uploadFiles } from '@/lib/uploadthing'
import { testFontCompatibility } from '@/lib/font-compat'
import { FontPicker } from '@/components/ui/font-picker'
import { loadFont, fetchGoogleFonts } from '@/lib/fonts'
import type { GoogleFont } from '@/lib/fonts'
import { FontPreview } from './font-preview'
import { HugeiconsIcon } from "@hugeicons/react"
import { InformationCircleIcon } from "@hugeicons/core-free-icons"
import { groupUploadedFonts, groupVariants } from '@/lib/font-variants'
import JSZip from 'jszip'

interface UploadedFont {
  key: string
  name: string
  size: number
  uploadedAt: number
  status: string
}

export function FontList() {
  const t = useTranslations('adminFonts')
  const [fonts, setFonts] = useState<UploadedFont[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [incompatibleKeys, setIncompatibleKeys] = useState<Set<string>>(new Set())
  const [selectedGoogleFont, setSelectedGoogleFont] = useState<string>('')
  const [selectedVariant, setSelectedVariant] = useState<string>('')
  const [savingFromGoogle, setSavingFromGoogle] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [googleFonts, setGoogleFonts] = useState<GoogleFont[]>([])
  const [previewVariants, setPreviewVariants] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchFonts()
    fetchGoogleFonts().then(setGoogleFonts).catch(() => {})
  }, [])

  useEffect(() => {
    if (fonts.length === 0) return
    let cancelled = false
    const newIncKeys = new Set<string>()

    Promise.all(
      fonts.map(async (font) => {
        try {
          const res = await fetch(`/api/fonts/uploaded?key=${font.key}`)
          if (!res.ok) {
            console.warn('[FontCheck] fetch failed for font', font.key, res.status)
            return
          }
          const buf = await res.arrayBuffer()
          const compatible = await testFontCompatibility(new Uint8Array(buf), `uploaded:${font.key}`)
          if (!compatible) {
            newIncKeys.add(font.key)
          }
        } catch (err) {
          console.warn('[FontCheck] error checking font', font.key, err)
        }
      }),
    ).then(() => {
      if (!cancelled) setIncompatibleKeys(newIncKeys)
    })

    return () => { cancelled = true }
  }, [fonts])

  async function fetchFonts() {
    try {
      const res = await fetch('/api/admin/fonts/uploaded')
      if (!res.ok) throw new Error('Failed to fetch fonts')
      const data = await res.json()
      setFonts(data.fonts ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fonts')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.ttf')) {
      setError(t('ttfOnly'))
      return
    }

    if (file.size > 4 * 1024 * 1024) {
      setError(t('maxSize'))
      return
    }

    setUploading(true)
    setError('')

    try {
      await uploadFiles('fontFileUpload', { files: [file] })
      await fetchFonts()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('uploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  const fontGroups = useMemo(() => groupUploadedFonts(fonts), [fonts])

  async function handleDeleteGroup(family: string) {
    const group = fontGroups.find((g) => g.family === family)
    if (!group) return
    if (!confirm(t('deleteAllConfirm', { family }))) return

    setDeleting(family)

    await Promise.allSettled(
      group.variants.map((variant) =>
        fetch(`/api/admin/fonts/uploaded/${encodeURIComponent(variant.key)}`, {
          method: 'DELETE',
        })
      )
    )

    setFonts((prev) => prev.filter((f) => !group.variants.some((v) => v.key === f.key)))
    setDeleting(null)
  }

  async function handleDownloadGroup(family: string) {
    const group = fontGroups.find((g) => g.family === family)
    if (!group) return

    setDownloading(family)

    try {
      const zip = new JSZip()

      const responses = await Promise.allSettled(
        group.variants.map(async (variant) => {
          const res = await fetch(`/api/fonts/uploaded?key=${variant.key}`)
          if (!res.ok) throw new Error(`Failed to fetch ${variant.name}`)
          const blob = await res.blob()
          zip.file(variant.name, blob)
        }),
      )

      const failed = responses.filter((r) => r.status === 'rejected')
      if (failed.length > 0) {
        console.warn(`[DownloadGroup] ${failed.length} variant(s) failed to fetch`)
      }

      if (group.variants.length === failed.length) {
        throw new Error('Failed to fetch any variants')
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${family}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[DownloadGroup] error:', err)
    } finally {
      setDownloading(null)
    }
  }

  const selectedFontData = useMemo(() => {
    if (!selectedGoogleFont) return null
    return googleFonts.find((f) => f.family === selectedGoogleFont) ?? null
  }, [selectedGoogleFont, googleFonts])

  function handleFontPickerChange(family: string) {
    setSelectedGoogleFont(family)
    setSelectedVariant(family ? 'regular' : '')
    if (family) {
      loadFont(family).catch(() => {})
    }
  }

  useEffect(() => {
    if (!selectedGoogleFont || !selectedVariant || !selectedFontData?.files) return

    const fileUrl = selectedFontData.files[selectedVariant]
    if (!fileUrl) return

    const prevId = 'gfont-variant-preview'
    const prev = document.getElementById(prevId)
    if (prev) prev.remove()

    const numericWeight = selectedVariant === 'regular' ? '400' : selectedVariant === 'italic' ? '400' : selectedVariant.replace('italic', '')
    const fontStyle = selectedVariant === 'italic' || selectedVariant.endsWith('italic') ? 'italic' : 'normal'
    const fontFamilyKey = `${selectedGoogleFont}-preview`

    const style = document.createElement('style')
    style.id = prevId
    style.textContent = `
      @font-face {
        font-family: "${fontFamilyKey}";
        src: url("${fileUrl}") format("truetype");
        font-weight: ${numericWeight};
        font-style: ${fontStyle};
      }
    `
    document.head.appendChild(style)
  }, [selectedGoogleFont, selectedVariant, selectedFontData])

  async function handleSaveFromGoogle() {
    if (!selectedGoogleFont) return

    const variant = selectedVariant || 'regular'

    setSavingFromGoogle(true)
    setError('')
    setSuccessMessage('')

    try {
      const res = await fetch(`/api/fonts?family=${encodeURIComponent(selectedGoogleFont)}&variant=${variant}`)
      if (!res.ok) throw new Error(t('downloadFailed'))
      const blob = await res.blob()

      const variantSuffix = variant !== 'regular' ? `-${variant}` : ''
      const fileName = `${selectedGoogleFont}${variantSuffix}.ttf`
      const file = new File([blob], fileName, { type: 'font/ttf' })

      await uploadFiles('fontFileUpload', { files: [file] })

      await fetchFonts()
      setSelectedGoogleFont('')
      setSelectedVariant('')
      setSuccessMessage(t('googleFontSaved'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('downloadFailed'))
    } finally {
      setSavingFromGoogle(false)
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return <div className="text-muted-foreground">{t('loading')}</div>
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border p-5 space-y-4">
        <h2 className="text-lg font-semibold">{t('browseGoogleFonts')}</h2>
        <p className="text-sm text-muted-foreground">{t('selectGoogleFont')}</p>
        <div className="flex flex-wrap items-end gap-4">
          <FontPicker
            onChange={handleFontPickerChange}
            value={selectedGoogleFont}
            width={320}
            height={350}
            localePangram={t('pangram')}
          />
          <button
            type="button"
            onClick={handleSaveFromGoogle}
            disabled={!selectedGoogleFont || !selectedVariant || savingFromGoogle}
            className="inline-flex items-center gap-2 rounded-lg bg-bright-sky px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            {savingFromGoogle ? t('saving') : t('downloadAndSave')}
          </button>
        </div>
        {selectedGoogleFont && selectedFontData && selectedFontData.variants.length > 0 && (
          <div className="mt-2">
            <label className="block text-xs font-medium mb-1 text-muted-foreground">
              {t('variants')}
            </label>
            <select
              className="w-full rounded-lg border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(e.target.value)}
            >
              {(() => {
                const { normal, italic } = groupVariants(selectedFontData.variants)
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
        {selectedGoogleFont && (
          <div className="mt-2">
            <span
              className="block text-lg leading-relaxed"
              style={{
                fontFamily: selectedVariant && selectedVariant !== 'regular'
                  ? `"${selectedGoogleFont}-preview", ${selectedGoogleFont}`
                  : selectedGoogleFont,
              }}
            >
              {t('pangram')}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-bright-sky px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50">
            {uploading ? t('uploading') : t('uploadFont')}
            <input
              type="file"
              accept=".ttf"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 flex items-start gap-2">
        <HugeiconsIcon icon={InformationCircleIcon} className="mt-0.5 shrink-0" size={16} />
        <span>{t('uploadNamingHint')}</span>
      </div>

      {successMessage && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-600">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {fontGroups.length === 0 ? (
        <p className="text-muted-foreground">{t('noFonts')}</p>
      ) : (
        <div className="rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t('name')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t('variants')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t('size')}
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {fontGroups.map((group) => {
                const { normal, italic } = groupVariants(group.variants.map((v) => v.variant))
                const activeVariantKey = previewVariants[group.family]
                const activeEntry = activeVariantKey ? group.variants.find((v) => v.key === activeVariantKey) : null
                const previewKey = activeEntry?.key ?? group.variants.find((v) => v.variant === 'regular')?.key ?? group.variants[0]?.key
                const anyIncompatible = group.variants.some((v) => incompatibleKeys.has(v.key))
                return (
                  <tr key={group.family} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-2">
                          {group.family}
                          {anyIncompatible && (
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600 ring-1 ring-inset ring-amber-200">
                              {t('fontIncompatibleWarning')}
                            </span>
                          )}
                        </span>
                        {previewKey && <FontPreview fontKey={previewKey} />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {normal.map((v) => {
                          const entry = group.variants.find((e) => e.variant === v.key)
                          const isActive = entry?.key === previewKey
                          return (
                            <button
                              type="button"
                              key={v.key}
                              onClick={() => {
                                if (entry) setPreviewVariants((prev) => ({ ...prev, [group.family]: entry.key }))
                              }}
                              className={`inline-flex cursor-pointer items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors ${
                                isActive
                                  ? 'bg-bright-sky text-white ring-bright-sky'
                                  : entry && incompatibleKeys.has(entry.key)
                                    ? 'bg-amber-50 text-amber-600 ring-amber-200 hover:bg-amber-100'
                                    : 'bg-gray-50 text-gray-600 ring-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {v.label}
                            </button>
                          )
                        })}
                        {normal.length > 0 && italic.length > 0 && (
                          <div className="w-px h-5 bg-border mx-0.5" />
                        )}
                        {italic.map((v) => {
                          const entry = group.variants.find((e) => e.variant === v.key)
                          const isActive = entry?.key === previewKey
                          return (
                            <button
                              type="button"
                              key={v.key}
                              onClick={() => {
                                if (entry) setPreviewVariants((prev) => ({ ...prev, [group.family]: entry.key }))
                              }}
                              className={`inline-flex cursor-pointer items-center rounded-md px-2 py-0.5 text-xs font-medium italic ring-1 ring-inset transition-colors ${
                                isActive
                                  ? 'bg-bright-sky text-white ring-bright-sky'
                                  : entry && incompatibleKeys.has(entry.key)
                                    ? 'bg-amber-50 text-amber-600 ring-amber-200 hover:bg-amber-100'
                                    : 'bg-gray-50 text-gray-600 ring-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {v.label}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatSize(group.totalSize)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadGroup(group.family)}
                          disabled={downloading === group.family}
                          className="rounded-lg border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
                        >
                          {downloading === group.family ? t('downloading') : t('downloadAll')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(group.family)}
                          disabled={deleting === group.family}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deleting === group.family ? t('deleting') : t('deleteAll')}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
