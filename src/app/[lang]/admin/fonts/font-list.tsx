'use client'

import { useEffect, useReducer } from 'react'
import { useTranslations } from 'next-intl'
import { uploadFiles } from '@/lib/uploadthing'
import { testFontCompatibility } from '@/lib/font-compat'
import { FontPicker } from '@/components/ui/font-picker'
import { loadFont, fetchGoogleFonts, createFontRecord } from '@/lib/fonts'
import type { GoogleFont } from '@/lib/fonts'
import { FontPreview } from './font-preview'
import { HugeiconsIcon } from "@hugeicons/react"
import { InformationCircleIcon } from "@hugeicons/core-free-icons"
import { findDuplicateFont, groupUploadedFonts, groupVariants, parseFontFilename, type FontFamilyGroup } from '@/lib/font-variants'
import JSZip from 'jszip'

interface UploadedFont {
  id: string
  key: string
  name: string
  family: string
  variant: string
  size: number
  uploadedAt: number
}

interface UploadedFontsState {
  fonts: UploadedFont[]
  incompatibleKeys: Set<string>
  previewVariants: Record<string, string>
}

interface GoogleFontsState {
  googleFonts: GoogleFont[]
  selectedGoogleFont: string
  selectedVariant: string
  savingFromGoogle: boolean
}

interface UiState {
  loading: boolean
  uploading: boolean
  error: string
  deleting: string | null
  downloading: string | null
  successMessage: string
}

type UploadedFontsAction =
  | { type: 'SET_FONTS'; fonts: UploadedFont[] }
  | { type: 'SET_INCOMPATIBLE_KEYS'; keys: Set<string> }
  | { type: 'SET_PREVIEW_VARIANT'; family: string; key: string }
  | { type: 'REMOVE_FONTS'; keys: string[] }

type GoogleFontsAction =
  | { type: 'SET_GOOGLE_FONTS'; googleFonts: GoogleFont[] }
  | { type: 'SET_SELECTED_FONT'; family: string }
  | { type: 'SET_SELECTED_VARIANT'; variant: string }
  | { type: 'START_SAVING' }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'SAVE_ERROR' }

type UiAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'START_UPLOADING' }
  | { type: 'STOP_UPLOADING' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'START_DELETING'; family: string }
  | { type: 'STOP_DELETING' }
  | { type: 'START_DOWNLOADING'; family: string }
  | { type: 'STOP_DOWNLOADING' }
  | { type: 'SET_SUCCESS'; message: string }
  | { type: 'CLEAR_SUCCESS' }

async function loadUploadedFonts(dispatchUf: React.Dispatch<UploadedFontsAction>, dispatchUi: React.Dispatch<UiAction>) {
  try {
    const res = await fetch('/api/admin/fonts')
    if (!res.ok) throw new Error('Failed to fetch fonts')
    const data = await res.json()
    const fonts: UploadedFont[] = (data.fonts ?? []).map((f: { id: string; file_key: string; name: string; family: string; variant: string; file_size: number | null; created_at: string }) => ({
      id: f.id,
      key: f.file_key,
      name: f.name,
      family: f.family,
      variant: f.variant,
      size: f.file_size ?? 0,
      uploadedAt: new Date(f.created_at).getTime(),
    }))
    dispatchUf({ type: 'SET_FONTS', fonts })
    return fonts
  } catch (err) {
    dispatchUi({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Failed to load fonts' })
    return []
  } finally {
    dispatchUi({ type: 'SET_LOADING', loading: false })
  }
}

async function loadGoogleFonts(dispatchGf: React.Dispatch<GoogleFontsAction>) {
  try {
    const fonts = await fetchGoogleFonts()
    dispatchGf({ type: 'SET_GOOGLE_FONTS', googleFonts: fonts })
  } catch {}
}

async function checkFontsCompatibility(fonts: UploadedFont[], dispatchUf: React.Dispatch<UploadedFontsAction>) {
  if (fonts.length === 0) return
  const newIncKeys = new Set<string>()
  await Promise.all(
    fonts.map(async (font) => {
      try {
        const res = await fetch(`/api/fonts/uploaded?key=${font.key}`)
        if (!res.ok) {
          console.warn('[FontCheck] fetch failed for font', font.key, res.status)
          return
        }
        const buf = await res.arrayBuffer()
        const compatible = await testFontCompatibility(new Uint8Array(buf), `uploaded:${font.key}`)
        if (!compatible) newIncKeys.add(font.key)
      } catch (err) {
        console.warn('[FontCheck] error checking font', font.key, err)
      }
    }),
  )
  dispatchUf({ type: 'SET_INCOMPATIBLE_KEYS', keys: newIncKeys })
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const initialUploadedFontsState: UploadedFontsState = {
  fonts: [],
  incompatibleKeys: new Set(),
  previewVariants: {},
}

const initialGoogleFontsState: GoogleFontsState = {
  googleFonts: [],
  selectedGoogleFont: '',
  selectedVariant: '',
  savingFromGoogle: false,
}

const initialUiState: UiState = {
  loading: true,
  uploading: false,
  error: '',
  deleting: null,
  downloading: null,
  successMessage: '',
}

function uploadedFontsReducer(state: UploadedFontsState, action: UploadedFontsAction): UploadedFontsState {
  switch (action.type) {
    case 'SET_FONTS':
      return { ...state, fonts: action.fonts }
    case 'SET_INCOMPATIBLE_KEYS':
      return { ...state, incompatibleKeys: action.keys }
    case 'SET_PREVIEW_VARIANT':
      return { ...state, previewVariants: { ...state.previewVariants, [action.family]: action.key } }
    case 'REMOVE_FONTS':
      return { ...state, fonts: state.fonts.filter((f) => !action.keys.includes(f.key)) }
    default:
      return state
  }
}

function googleFontsReducer(state: GoogleFontsState, action: GoogleFontsAction): GoogleFontsState {
  switch (action.type) {
    case 'SET_GOOGLE_FONTS':
      return { ...state, googleFonts: action.googleFonts }
    case 'SET_SELECTED_FONT':
      return { ...state, selectedGoogleFont: action.family, selectedVariant: action.family ? 'regular' : '' }
    case 'SET_SELECTED_VARIANT':
      return { ...state, selectedVariant: action.variant }
    case 'START_SAVING':
      return { ...state, savingFromGoogle: true }
    case 'SAVE_SUCCESS':
      return { ...state, savingFromGoogle: false, selectedGoogleFont: '', selectedVariant: '' }
    case 'SAVE_ERROR':
      return { ...state, savingFromGoogle: false }
    default:
      return state
  }
}

function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading }
    case 'START_UPLOADING':
      return { ...state, uploading: true, error: '' }
    case 'STOP_UPLOADING':
      return { ...state, uploading: false }
    case 'SET_ERROR':
      return { ...state, error: action.error }
    case 'CLEAR_ERROR':
      return { ...state, error: '' }
    case 'START_DELETING':
      return { ...state, deleting: action.family }
    case 'STOP_DELETING':
      return { ...state, deleting: null }
    case 'START_DOWNLOADING':
      return { ...state, downloading: action.family }
    case 'STOP_DOWNLOADING':
      return { ...state, downloading: null }
    case 'SET_SUCCESS':
      return { ...state, successMessage: action.message }
    case 'CLEAR_SUCCESS':
      return { ...state, successMessage: '' }
    default:
      return state
  }
}

function GoogleFontsSection({
  gfState,
  selectedFontData,
  onFontPickerChange,
  onSaveFromGoogle,
  onVariantChange,
  t,
}: {
  gfState: GoogleFontsState
  selectedFontData: GoogleFont | null
  onFontPickerChange: (family: string) => void
  onSaveFromGoogle: () => void
  onVariantChange: (variant: string) => void
  t: (key: string) => string
}) {
  return (
    <div className="rounded-xl border p-5 space-y-4">
      <h2 className="text-lg font-semibold">{t('browseGoogleFonts')}</h2>
      <p className="text-sm text-muted-foreground">{t('selectGoogleFont')}</p>
      <div className="flex flex-wrap items-end gap-4">
        <FontPicker
          onChange={onFontPickerChange}
          value={gfState.selectedGoogleFont}
          width={320}
          height={350}
          localePangram={t('pangram')}
        />
        <button
          type="button"
          onClick={onSaveFromGoogle}
          disabled={!gfState.selectedGoogleFont || !gfState.selectedVariant || gfState.savingFromGoogle}
          className="inline-flex items-center gap-2 rounded-lg bg-bright-sky px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
        >
          {gfState.savingFromGoogle ? t('saving') : t('downloadAndSave')}
        </button>
      </div>
      {gfState.selectedGoogleFont && selectedFontData && selectedFontData.variants.length > 0 && (
        <div className="mt-2">
          <label className="block text-xs font-medium mb-1 text-muted-foreground">
            {t('variants')}
          </label>
          <select
            className="w-full rounded-lg border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
            value={gfState.selectedVariant}
            onChange={(e) => onVariantChange(e.target.value)}
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
      {gfState.selectedGoogleFont && (
        <div className="mt-2">
          <span
            className="block text-lg leading-relaxed"
            style={{
              fontFamily: gfState.selectedVariant && gfState.selectedVariant !== 'regular'
                ? `"${gfState.selectedGoogleFont}-preview", ${gfState.selectedGoogleFont}`
                : gfState.selectedGoogleFont,
            }}
          >
            {t('pangram')}
          </span>
        </div>
      )}
    </div>
  )
}

function UploadedFontTable({
  fontGroups,
  ufState,
  downloading,
  deleting,
  onVariantClick,
  onDownloadGroup,
  onDeleteGroup,
  t,
}: {
  fontGroups: FontFamilyGroup[]
  ufState: UploadedFontsState
  downloading: string | null
  deleting: string | null
  onVariantClick: (family: string, key: string) => void
  onDownloadGroup: (family: string) => void
  onDeleteGroup: (family: string) => void
  t: (key: string) => string
}) {
  return fontGroups.length === 0 ? (
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
            const activeVariantKey = ufState.previewVariants[group.family]
            const activeEntry = activeVariantKey ? group.variants.find((v) => v.key === activeVariantKey) : null
            const previewKey = activeEntry?.key ?? group.variants.find((v) => v.variant === 'regular')?.key ?? group.variants[0]?.key
            const anyIncompatible = group.variants.some((v) => ufState.incompatibleKeys.has(v.key))
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
                            if (entry) onVariantClick(group.family, entry.key)
                          }}
                          className={`inline-flex cursor-pointer items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors ${
                            isActive
                              ? 'bg-bright-sky text-white ring-bright-sky'
                              : entry && ufState.incompatibleKeys.has(entry.key)
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
                            if (entry) onVariantClick(group.family, entry.key)
                          }}
                          className={`inline-flex cursor-pointer items-center rounded-md px-2 py-0.5 text-xs font-medium italic ring-1 ring-inset transition-colors ${
                            isActive
                              ? 'bg-bright-sky text-white ring-bright-sky'
                              : entry && ufState.incompatibleKeys.has(entry.key)
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
                      onClick={() => onDownloadGroup(group.family)}
                      disabled={downloading === group.family}
                      className="rounded-lg border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
                    >
                      {downloading === group.family ? t('downloading') : t('downloadAll')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteGroup(group.family)}
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
  )
}

export function FontList() {
  const t = useTranslations('adminFonts')
  const [ufState, dispatchUf] = useReducer(uploadedFontsReducer, initialUploadedFontsState)
  const [gfState, dispatchGf] = useReducer(googleFontsReducer, initialGoogleFontsState)
  const [ui, dispatchUi] = useReducer(uiReducer, initialUiState)

  useEffect(() => {
    loadUploadedFonts(dispatchUf, dispatchUi).then((fonts) => {
      checkFontsCompatibility(fonts, dispatchUf)
    })
    loadGoogleFonts(dispatchGf)
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.ttf')) {
      dispatchUi({ type: 'SET_ERROR', error: t('ttfOnly') })
      return
    }

    if (file.size > 4 * 1024 * 1024) {
      dispatchUi({ type: 'SET_ERROR', error: t('maxSize') })
      return
    }

    const { family, variant } = parseFontFilename(file.name)
    if (findDuplicateFont(ufState.fonts, family, variant)) {
      dispatchUi({ type: 'SET_ERROR', error: t('fontAlreadyExists', { name: file.name, variant }) })
      return
    }

    dispatchUi({ type: 'START_UPLOADING' })

    try {
      const [res] = await uploadFiles('fontFileUpload', { files: [file] })
      await fetch('/api/admin/fonts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: res.key, name: file.name, family, variant, file_url: res.ufsUrl, file_size: file.size }),
      })
      await loadUploadedFonts(dispatchUf, dispatchUi)
    } catch (err) {
      dispatchUi({ type: 'SET_ERROR', error: err instanceof Error ? err.message : t('uploadFailed') })
    }
    dispatchUi({ type: 'STOP_UPLOADING' })
  }

  const fontGroups = groupUploadedFonts(ufState.fonts)

  async function handleDeleteGroup(family: string) {
    const group = fontGroups.find((g) => g.family === family)
    if (!group) return
    if (!confirm(t('deleteAllConfirm', { family }))) return

    dispatchUi({ type: 'START_DELETING', family })

    await Promise.allSettled(
      group.variants.map((variant) => {
        if (variant.id) {
          return fetch(`/api/admin/fonts/${variant.id}`, { method: 'DELETE' })
        }
        return fetch(`/api/admin/fonts/uploaded/${encodeURIComponent(variant.key)}`, { method: 'DELETE' })
      })
    )

    dispatchUf({ type: 'REMOVE_FONTS', keys: group.variants.map((v) => v.key) })
    dispatchUi({ type: 'STOP_DELETING' })
  }

  async function handleDownloadGroup(family: string) {
    const group = fontGroups.find((g) => g.family === family)
    if (!group) return

    dispatchUi({ type: 'START_DOWNLOADING', family })

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

      if (group.variants.length !== failed.length) {
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        const url = URL.createObjectURL(zipBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${family}.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('[DownloadGroup] error:', err)
    }
    dispatchUi({ type: 'STOP_DOWNLOADING' })
  }

  const selectedFontData = !gfState.selectedGoogleFont
    ? null
    : gfState.googleFonts.find((f) => f.family === gfState.selectedGoogleFont) ?? null

  function handleFontPickerChange(family: string) {
    dispatchGf({ type: 'SET_SELECTED_FONT', family })
    if (family) {
      loadFont(family).catch(() => {})
    }
  }

  useEffect(() => {
    if (!gfState.selectedGoogleFont || !gfState.selectedVariant || !selectedFontData?.files) return

    const fileUrl = selectedFontData.files[gfState.selectedVariant]
    if (!fileUrl) return

    const prevId = 'gfont-variant-preview'
    const prev = document.getElementById(prevId)
    if (prev) prev.remove()

    const numericWeight = gfState.selectedVariant === 'regular' ? '400' : gfState.selectedVariant === 'italic' ? '400' : gfState.selectedVariant.replace('italic', '')
    const fontStyle = gfState.selectedVariant === 'italic' || gfState.selectedVariant.endsWith('italic') ? 'italic' : 'normal'
    const fontFamilyKey = `${gfState.selectedGoogleFont}-preview`

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
  }, [gfState.selectedGoogleFont, gfState.selectedVariant, selectedFontData])

  async function handleSaveFromGoogle() {
    if (!gfState.selectedGoogleFont) return

    const variant = gfState.selectedVariant || 'regular'

    dispatchGf({ type: 'START_SAVING' })
    dispatchUi({ type: 'CLEAR_ERROR' })
    dispatchUi({ type: 'CLEAR_SUCCESS' })

    const res = await fetch(`/api/fonts?family=${encodeURIComponent(gfState.selectedGoogleFont)}&variant=${variant}`)
    if (!res.ok) {
      dispatchUi({ type: 'SET_ERROR', error: t('downloadFailed') })
      dispatchGf({ type: 'SAVE_ERROR' })
      return
    }
    const blob = await res.blob()

    const variantSuffix = variant !== 'regular' ? `-${variant}` : ''
    const fileName = `${gfState.selectedGoogleFont}${variantSuffix}.ttf`
    const file = new File([blob], fileName, { type: 'font/ttf' })

    const { family } = parseFontFilename(fileName)
    if (findDuplicateFont(ufState.fonts, family, variant)) {
      dispatchUi({ type: 'SET_ERROR', error: t('fontAlreadyExists', { name: fileName, variant }) })
      dispatchGf({ type: 'SAVE_ERROR' })
      return
    }

    try {
      const [uploadRes] = await uploadFiles('fontFileUpload', { files: [file] })
      await createFontRecord({ key: uploadRes.key, name: fileName, family, variant, file_url: uploadRes.ufsUrl, file_size: file.size })
      await loadUploadedFonts(dispatchUf, dispatchUi)
      dispatchGf({ type: 'SAVE_SUCCESS' })
      dispatchUi({ type: 'SET_SUCCESS', message: t('googleFontSaved') })
    } catch (err) {
      dispatchUi({ type: 'SET_ERROR', error: err instanceof Error ? err.message : t('downloadFailed') })
      dispatchGf({ type: 'SAVE_ERROR' })
    }
  }

  if (ui.loading) {
    return <div className="text-muted-foreground">{t('loading')}</div>
  }

  return (
    <div className="space-y-8">
      <GoogleFontsSection
        gfState={gfState}
        selectedFontData={selectedFontData}
        onFontPickerChange={handleFontPickerChange}
        onSaveFromGoogle={handleSaveFromGoogle}
        onVariantChange={(variant) => dispatchGf({ type: 'SET_SELECTED_VARIANT', variant })}
        t={t}
      />

      <div className="flex items-center gap-4">
        <div className="relative">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-bright-sky px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50">
            {ui.uploading ? t('uploading') : t('uploadFont')}
            <input
              type="file"
              accept=".ttf"
              className="hidden"
              onChange={handleUpload}
              disabled={ui.uploading}
            />
          </label>
        </div>
      </div>
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 flex items-start gap-2">
        <HugeiconsIcon icon={InformationCircleIcon} className="mt-0.5 shrink-0" size={16} />
        <span>{t('uploadNamingHint')}</span>
      </div>

      {ui.successMessage && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-600">
          {ui.successMessage}
        </div>
      )}

      {ui.error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-600">
          {ui.error}
        </div>
      )}

      <UploadedFontTable
        fontGroups={fontGroups}
        ufState={ufState}
        downloading={ui.downloading}
        deleting={ui.deleting}
        onVariantClick={(family, key) => dispatchUf({ type: 'SET_PREVIEW_VARIANT', family, key })}
        onDownloadGroup={handleDownloadGroup}
        onDeleteGroup={handleDeleteGroup}
        t={t}
      />
    </div>
  )
}
