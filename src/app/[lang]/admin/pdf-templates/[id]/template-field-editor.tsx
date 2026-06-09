'use client'

import { useEffect, useRef, useReducer, useState } from 'react'
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
import { fetchGoogleFonts, createFontRecord } from '@/lib/fonts'
import { groupVariants, groupUploadedFonts, parseFontFilename, type FontFamilyGroup } from '@/lib/font-variants'
import { VariantTabs } from './template-variant-tabs'
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
  font_id: string | null
  custom_default_value: string | null
  custom_overridable: boolean
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

interface UploadedFont {
  id: string
  key: string
  name: string
  family: string
  variant: string
}

interface TemplateData {
  id: string
  name: string
  description: string | null
  file_url: string
  preview_url: string | null
  preview_key: string | null
  pdf_template_fields: FieldMapping[]
}

interface VariantData {
  id: string
  name: string
  file_url: string
  file_key: string
  sort_order: number
  pdf_template_field_overrides: VariantOverride[]
}

interface VariantOverride {
  id: string
  variant_id: string
  field_id: string
  font_family: string | null
  font_size: number | null
  font_source: string | null
  font_variant: string | null
  uploaded_font_key: string | null
  font_id: string | null
  text_color: string | null
  display_label: string | null
  is_enabled: boolean | null
  multiline: boolean | null
  date_format: string | null
  level_format: string | null
  custom_default_value: string | null
  custom_overridable: boolean | null
  qr_dots_color: string | null
  qr_bg_color: string | null
  qr_dots_type: string | null
  qr_corners_type: string | null
  qr_corners_color: string | null
}

interface VariantUIState {
  variants: VariantData[]
  activeTab: string
  savingOverrides: boolean
}

type VariantUIAction =
  | { type: 'SET_VARIANTS'; variants: VariantData[] }
  | { type: 'SET_ACTIVE_TAB'; tab: string }
  | { type: 'ADD_VARIANT'; variant: VariantData }
  | { type: 'UPDATE_VARIANT'; id: string; name: string }
  | { type: 'REMOVE_VARIANT'; id: string }
  | { type: 'SET_SAVING_OVERRIDES'; value: boolean }

const initialVariantUIState: VariantUIState = {
  variants: [],
  activeTab: 'main',
  savingOverrides: false,
}

function variantUIReducer(state: VariantUIState, action: VariantUIAction): VariantUIState {
  switch (action.type) {
    case 'SET_VARIANTS':
      return { ...state, variants: action.variants }
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.tab }
    case 'ADD_VARIANT':
      return { ...state, variants: [...state.variants, action.variant], activeTab: action.variant.id }
    case 'UPDATE_VARIANT':
      return { ...state, variants: state.variants.map((v) => v.id === action.id ? { ...v, name: action.name } : v) }
    case 'REMOVE_VARIANT':
      return {
        ...state,
        variants: state.variants.filter((v) => v.id !== action.id),
        activeTab: state.activeTab === action.id ? 'main' : state.activeTab,
      }
    case 'SET_SAVING_OVERRIDES':
      return { ...state, savingOverrides: action.value }
    default:
      return state
  }
}

interface LoadingState {
  loading: boolean
  saving: boolean
  uploadingFont: boolean
  savingFont: boolean
}

interface FormState {
  fields: FieldMapping[]
  selectedFieldIndex: number
  error: string
  success: boolean
  showPdfPreview: boolean
  showPdfFonts: boolean
}

interface DataState {
  template: TemplateData | null
  uploadedFonts: UploadedFont[]
  pdfFonts: PdfFontInfo[]
  googleFonts: GoogleFont[]
  incompatibleFontKeys: Set<string>
  incompatibleGoogleFonts: Set<string>
}

type LoadingAction =
  | { type: 'SET_LOADING'; value: boolean }
  | { type: 'START_SAVING' }
  | { type: 'STOP_SAVING' }
  | { type: 'SET_UPLOADING_FONT'; value: boolean }
  | { type: 'SET_SAVING_FONT'; value: boolean }

type FormAction =
  | { type: 'SET_FIELDS'; fields: FieldMapping[] }
  | { type: 'UPDATE_FIELD'; index: number; updates: Partial<FieldMapping> }
  | { type: 'ADD_FIELD' }
  | { type: 'SET_SELECTED_INDEX'; index: number }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_SUCCESS'; value: boolean }
  | { type: 'TOGGLE_PDF_PREVIEW' }
  | { type: 'TOGGLE_PDF_FONTS' }

type DataAction =
  | { type: 'SET_TEMPLATE'; template: TemplateData }
  | { type: 'SET_UPLOADED_FONTS'; fonts: UploadedFont[] }
  | { type: 'ADD_UPLOADED_FONT'; font: UploadedFont }
  | { type: 'SET_PDF_FONTS'; fonts: PdfFontInfo[] }
  | { type: 'SET_GOOGLE_FONTS'; googleFonts: GoogleFont[] }
  | { type: 'ADD_INCOMPATIBLE_FONT_KEY'; key: string }
  | { type: 'ADD_INCOMPATIBLE_GOOGLE_FONT'; family: string }

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

async function apiSaveFields(templateId: string, fields: FieldMapping[]) {
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
  return savedFields ?? []
}

async function apiParsePdfTemplate(templateId: string) {
  const res = await fetch(`/api/admin/pdf-templates/${templateId}/parse`, { method: 'POST' })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to parse PDF')
  }
  return await res.json()
}

async function apiDeletePdfTemplate(templateId: string) {
  const res = await fetch(`/api/admin/pdf-templates/${templateId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Delete failed')
}

async function loadTemplateData(
  templateId: string,
  dispatchData: React.Dispatch<DataAction>,
  dispatchForm: React.Dispatch<FormAction>,
  dispatchLoading: React.Dispatch<LoadingAction>,
  dispatchVariantUI: React.Dispatch<VariantUIAction>
) {
  try {
    const res = await fetch(`/api/admin/pdf-templates/${templateId}`)
    const data = await res.json()
    dispatchData({ type: 'SET_TEMPLATE', template: data.template })
    dispatchVariantUI({ type: 'SET_VARIANTS', variants: data.variants ?? [] })
    const fields: FieldMapping[] = (data.template?.pdf_template_fields ?? []).map((f: any) => ({ ...f, multiline: f.multiline ?? false }))
    dispatchForm({ type: 'SET_FIELDS', fields })
  } catch {} finally {
    dispatchLoading({ type: 'SET_LOADING', value: false })
  }
}

async function loadEditorFontsData(dispatchData: React.Dispatch<DataAction>) {
  try {
    const res = await fetch('/api/admin/fonts')
    const data = await res.json()
    const fonts: UploadedFont[] = (data.fonts ?? []).map((f: { id: string; file_key: string; name: string; family: string; variant: string }) => ({
      id: f.id,
      key: f.file_key,
      name: f.name,
      family: f.family,
      variant: f.variant,
    }))
    dispatchData({ type: 'SET_UPLOADED_FONTS', fonts })
  } catch {}
  try {
    const fonts = await fetchGoogleFonts()
    dispatchData({ type: 'SET_GOOGLE_FONTS', googleFonts: fonts })
  } catch {}
}

async function checkUploadedFontsCompatibility(fields: FieldMapping[], dispatchData: React.Dispatch<DataAction>) {
  const uploadedKeys = fields.flatMap((f) =>
    f.font_source === 'uploaded' && f.uploaded_font_key ? [f.uploaded_font_key!] : []
  )
  if (uploadedKeys.length === 0) return
  const results = await Promise.all(
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
  )
  const incompatible = results.filter(Boolean) as string[]
  for (const key of incompatible) {
    dispatchData({ type: 'ADD_INCOMPATIBLE_FONT_KEY', key })
  }
}

async function checkGoogleFontsCompatibility(fields: FieldMapping[], dispatchData: React.Dispatch<DataAction>) {
  const families = fields.flatMap((f) =>
    f.font_source === 'google' && f.font_family ? [f.font_family] : []
  )
  if (families.length === 0) return
  const results = await Promise.all(
    families.map(async (family) => {
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
  )
  const incompatible = results.filter(Boolean) as string[]
  for (const family of incompatible) {
    dispatchData({ type: 'ADD_INCOMPATIBLE_GOOGLE_FONT', family })
  }
}

function syncUploadedFontStyles(fields: FieldMapping[]) {
  const uploadedKeys = fields.flatMap((f) =>
    f.font_source === 'uploaded' && f.uploaded_font_key ? [f.uploaded_font_key!] : []
  )
  const existing = document.getElementById('uploaded-font-styles')
  if (existing) existing.remove()
  if (uploadedKeys.length === 0) return
  const styleEl = document.createElement('style')
  styleEl.id = 'uploaded-font-styles'
  styleEl.textContent = uploadedKeys
    .map((key) => `@font-face{font-family:UPLOADED_FONT_${key};src:url("/api/fonts/uploaded?key=${key}") format("truetype");}`)
    .join('')
  document.head.appendChild(styleEl)
}

function syncGoogleFontVariant(
  field: FieldMapping | undefined,
  googleFonts: GoogleFont[],
  fontVariantStyleId: React.MutableRefObject<string | null>
) {
  const prev = fontVariantStyleId.current
  if (prev) {
    const el = document.getElementById(prev)
    if (el) el.remove()
    fontVariantStyleId.current = null
  }
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
  if (existing) existing.remove()
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
}

async function apiDownloadFont(family: string, variant: string): Promise<{ blob: Blob; fileName: string }> {
  const res = await fetch(`/api/fonts?family=${encodeURIComponent(family)}&variant=${variant}`)
  if (!res.ok) throw new Error('Failed to download font')
  const blob = await res.blob()
  const variantSuffix = variant !== 'regular' ? `-${variant}` : ''
  const fileName = `${family}${variantSuffix}.ttf`
  return { blob, fileName }
}

const initialLoadingState: LoadingState = {
  loading: true,
  saving: false,
  uploadingFont: false,
  savingFont: false,
}

const initialFormState: FormState = {
  fields: [],
  selectedFieldIndex: 0,
  error: '',
  success: false,
  showPdfPreview: false,
  showPdfFonts: false,
}

const initialDataState: DataState = {
  template: null,
  uploadedFonts: [],
  pdfFonts: [],
  googleFonts: [],
  incompatibleFontKeys: new Set(),
  incompatibleGoogleFonts: new Set(),
}

function loadingReducer(state: LoadingState, action: LoadingAction): LoadingState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.value }
    case 'START_SAVING':
      return { ...state, saving: true }
    case 'STOP_SAVING':
      return { ...state, saving: false }
    case 'SET_UPLOADING_FONT':
      return { ...state, uploadingFont: action.value }
    case 'SET_SAVING_FONT':
      return { ...state, savingFont: action.value }
    default:
      return state
  }
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELDS':
      return { ...state, fields: action.fields }
    case 'UPDATE_FIELD':
      return {
        ...state,
        fields: state.fields.map((f, i) => (i === action.index ? { ...f, ...action.updates } : f)),
      }
    case 'ADD_FIELD':
      return {
        ...state,
        fields: [
          ...state.fields,
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
            font_id: null,
            custom_default_value: '',
            custom_overridable: true,
            date_format: null,
            level_format: null,
            multiline: false,
            text_color: null,
            qr_dots_color: '#1a1a2e',
            qr_bg_color: '#FFFFFF',
            qr_dots_type: 'rounded',
            qr_corners_type: 'square',
            qr_corners_color: '#1a1a2e',
            sort_order: state.fields.length,
          },
        ],
      }
    case 'SET_SELECTED_INDEX':
      return { ...state, selectedFieldIndex: action.index }
    case 'SET_ERROR':
      return { ...state, error: action.error }
    case 'CLEAR_ERROR':
      return { ...state, error: '' }
    case 'SET_SUCCESS':
      return { ...state, success: action.value }
    case 'TOGGLE_PDF_PREVIEW':
      return { ...state, showPdfPreview: !state.showPdfPreview }
    case 'TOGGLE_PDF_FONTS':
      return { ...state, showPdfFonts: !state.showPdfFonts }
    default:
      return state
  }
}

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_TEMPLATE':
      return { ...state, template: action.template }
    case 'SET_UPLOADED_FONTS':
      return { ...state, uploadedFonts: action.fonts }
    case 'ADD_UPLOADED_FONT':
      return { ...state, uploadedFonts: [...state.uploadedFonts, action.font] }
    case 'SET_PDF_FONTS':
      return { ...state, pdfFonts: action.fonts }
    case 'SET_GOOGLE_FONTS':
      return { ...state, googleFonts: action.googleFonts }
    case 'ADD_INCOMPATIBLE_FONT_KEY':
      return { ...state, incompatibleFontKeys: new Set(state.incompatibleFontKeys).add(action.key) }
    case 'ADD_INCOMPATIBLE_GOOGLE_FONT':
      return { ...state, incompatibleGoogleFonts: new Set(state.incompatibleGoogleFonts).add(action.family) }
    default:
      return state
  }
}

function FieldSidebar({
  sortedFields,
  fields,
  selectedFieldIndex,
  onSelectField,
  onToggleField,
  onAddField,
  t,
}: {
  sortedFields: FieldMapping[]
  fields: FieldMapping[]
  selectedFieldIndex: number
  onSelectField: (index: number) => void
  onToggleField: (index: number, checked: boolean) => void
  onAddField: () => void
  t: (key: string) => string
}) {
  return (
    <div className="w-56 shrink-0 space-y-1">
      {sortedFields.map((field, sortedIndex) => {
        const originalIndex = fields.indexOf(field)
        return (
          <button
            type="button"
            key={field.pdf_field_name + sortedIndex}
            onClick={() => onSelectField(originalIndex)}
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
                onToggleField(originalIndex, e.target.checked)
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
        onClick={onAddField}
        className="w-full rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
      >
        + {t('addCustomField')}
      </button>
    </div>
  )
}

function FieldEditorPanel({
  field,
  index,
  selectedFont,
  currentUploadedParsed,
  uploadedFontGroups,
  localePangram,
  locale,
  data,
  loadingState,
  onUpdateField,
  onSaveFont,
  onUploadFont,
  t,
}: {
  field: FieldMapping
  index: number
  selectedFont: GoogleFont | null
  currentUploadedParsed: { family: string; variant: string } | null
  uploadedFontGroups: FontFamilyGroup[]
  localePangram: string | undefined
  locale: string
  data: DataState
  loadingState: LoadingState
  onUpdateField: (index: number, updates: Partial<FieldMapping>) => void
  onSaveFont: (index: number) => void
  onUploadFont: (file: File, index: number) => Promise<{ key: string; id: string } | null>
  t: (key: string) => string
}) {
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
              onChange={(e) => onUpdateField(index, { is_enabled: e.target.checked })}
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
              onUpdateField(index, updates)
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
              onChange={(e) => onUpdateField(index, { source_key: e.target.value })}
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
                onChange={(e) => onUpdateField(index, { display_label: e.target.value })}
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
                onChange={(e) => onUpdateField(index, { custom_default_value: e.target.value })}
                aria-label="Default value for custom field"
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.custom_overridable}
                  onChange={(e) => onUpdateField(index, { custom_overridable: e.target.checked })}
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
                    onChange={(color) => onUpdateField(index, { qr_dots_color: color, qr_corners_color: color })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2 text-muted-foreground">{t('qrBgColor')}</label>
                  <div className="flex gap-2 items-center">
                    <ColorPicker
                      value={field.qr_bg_color === 'transparent' ? '#FFFFFF' : field.qr_bg_color}
                      onChange={(color) => onUpdateField(index, { qr_bg_color: color })}
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateField(index, { qr_bg_color: field.qr_bg_color === 'transparent' ? '#FFFFFF' : 'transparent' })}
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
                    onChange={(e) => onUpdateField(index, { qr_dots_type: e.target.value })}
                  >
                    {QR_DOT_TYPES.map((qt) => <option key={qt} value={qt}>{qt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">{t('qrCornersType')}</label>
                  <select
                    className="w-full rounded-lg border bg-background p-2 text-sm"
                    value={field.qr_corners_type}
                    onChange={(e) => onUpdateField(index, { qr_corners_type: e.target.value })}
                  >
                    {QR_CORNER_TYPES.map((qt) => <option key={qt} value={qt}>{qt}</option>)}
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
              onClick={() => onUpdateField(index, { font_source: 'google', uploaded_font_key: null })}
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
              onClick={() => onUpdateField(index, { font_source: 'uploaded', font_family: '' })}
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
                      onUpdateField(index, {
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
                            onUpdateField(index, {
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
                    const result = await onUploadFont(file, index)
                    if (result) {
                      onUpdateField(index, { font_source: 'uploaded', uploaded_font_key: result.key, font_id: result.id, font_family: `UPLOADED_FONT_${result.key}` })
                    }
                  }}
                />
                {loadingState.uploadingFont && <span className="text-xs text-muted-foreground">{t('uploading')}</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('uploadNamingHint')}
              </p>
            </div>
            {field.uploaded_font_key && data.incompatibleFontKeys.has(field.uploaded_font_key) && (
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
                onChange={(family) => onUpdateField(index, { font_family: family, font_variant: 'regular' })}
              />
              <button
                type="button"
                disabled={!field.font_family || loadingState.savingFont}
                onClick={() => onSaveFont(index)}
                className="rounded-lg bg-bright-sky px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
              >
                {loadingState.savingFont ? t('savingFont') : t('saveFont')}
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
                  onChange={(e) => onUpdateField(index, { font_variant: e.target.value })}
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
            {field.font_family && data.incompatibleGoogleFonts.has(field.font_family) && (
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
            onChange={(e) => onUpdateField(index, { font_size: parseInt(e.target.value, 10) || 12 })}
            aria-label="Font size"
          />
        </div>
        <div className="col-span-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={field.multiline}
              onChange={(e) => onUpdateField(index, { multiline: e.target.checked })}
              className="rounded"
            />
            <span>{t('multiline')}</span>
          </label>
          <p className="text-xs text-muted-foreground mt-1 ml-6">
            {t('multilineHint')}
          </p>
        </div>
      </div>

      <div className="border-t pt-4 space-y-4" style={{ display: field.source_type === 'qr_code' ? 'none' : 'block' }}>
        <div>
          <label className="block text-xs font-medium mb-2 text-muted-foreground">
            {t('textColor')}
          </label>
          <ColorPicker
            value={field.text_color || '#000000'}
            onChange={(color) => onUpdateField(index, { text_color: color === '#000000' ? null : color })}
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
                  onClick={() => onUpdateField(index, { date_format: fmt === 'usa' ? null : fmt })}
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
                  onClick={() => onUpdateField(index, { level_format: fmt === 'short' ? null : fmt })}
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
}

export function TemplateFieldEditor({ templateId, lang }: { templateId: string; lang: string }) {
  const t = useTranslations('adminPdfTemplates')
  const langPicker = useTranslations('adminFonts')
  const locale = useLocale()
  const localePangram = locale !== 'en' ? langPicker('pangram') : undefined
  const router = useRouter()
  const [loadingState, dispatchLoading] = useReducer(loadingReducer, initialLoadingState)
  const [form, dispatchForm] = useReducer(formReducer, initialFormState)
  const [data, dispatchData] = useReducer(dataReducer, initialDataState)
  const [variantUI, dispatchVariantUI] = useReducer(variantUIReducer, initialVariantUIState)
  const [dirtyOverrides, setDirtyOverrides] = useState<Record<string, Record<string, unknown>>>({})
  const [uploadingPreview, setUploadingPreview] = useState(false)
  const fontVariantStyleId = useRef<string | null>(null)
  const previewInputRef = useRef<HTMLInputElement>(null)

  const isVariantTab = variantUI.activeTab !== 'main'
  const activeVariant = isVariantTab
    ? variantUI.variants.find((v) => v.id === variantUI.activeTab)
    : null

  const activeOverrides = (() => {
    if (!isVariantTab || !activeVariant) return null
    const map: Record<string, Partial<VariantOverride>> = {}
    for (const o of activeVariant.pdf_template_field_overrides ?? []) {
      const dirty = dirtyOverrides[o.field_id]
      if (dirty) {
        map[o.field_id] = { ...o, ...dirty } as Partial<VariantOverride>
      } else {
        map[o.field_id] = o
      }
    }
    for (const [fieldId, dirty] of Object.entries(dirtyOverrides)) {
      if (!map[fieldId]) {
        map[fieldId] = dirty as Partial<VariantOverride>
      }
    }
    return map
  })()

  const effectiveFields: FieldMapping[] = (() => {
    if (!isVariantTab || !activeOverrides) return form.fields
    return form.fields.map((f) => {
      const override = activeOverrides[f.id]
      if (!override) return f
      const o = override as Record<string, unknown>
      return {
        ...f,
        ...(o.font_family != null ? { font_family: o.font_family as string } : {}),
        ...(o.font_size != null ? { font_size: o.font_size as number } : {}),
        ...(o.font_source != null ? { font_source: o.font_source as string } : {}),
        ...(o.font_variant != null ? { font_variant: o.font_variant as string } : {}),
        ...(o.uploaded_font_key != null ? { uploaded_font_key: o.uploaded_font_key as string } : {}),
        ...(o.font_id != null ? { font_id: o.font_id as string } : {}),
        ...(o.text_color != null ? { text_color: o.text_color as string } : {}),
        ...(o.display_label != null ? { display_label: o.display_label as string } : {}),
        ...(o.is_enabled != null ? { is_enabled: o.is_enabled as boolean } : {}),
        ...(o.multiline != null ? { multiline: o.multiline as boolean } : {}),
        ...(o.date_format != null ? { date_format: o.date_format as string } : {}),
        ...(o.level_format != null ? { level_format: o.level_format as string } : {}),
        ...(o.custom_default_value != null ? { custom_default_value: o.custom_default_value as string } : {}),
        ...(o.custom_overridable != null ? { custom_overridable: o.custom_overridable as boolean } : {}),
        ...(o.qr_dots_color != null ? { qr_dots_color: o.qr_dots_color as string } : {}),
        ...(o.qr_bg_color != null ? { qr_bg_color: o.qr_bg_color as string } : {}),
        ...(o.qr_dots_type != null ? { qr_dots_type: o.qr_dots_type as string } : {}),
        ...(o.qr_corners_type != null ? { qr_corners_type: o.qr_corners_type as string } : {}),
        ...(o.qr_corners_color != null ? { qr_corners_color: o.qr_corners_color as string } : {}),
      }
    })
  })()

  const sortedFields = (() => {
    const dbOrder = new Map(DATABASE_FIELD_MAP.map((e, i) => [e.key, i]))
    return effectiveFields.toSorted((a, b) => {
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
  })()

  const savedOverrides = useRef<Record<string, Record<string, unknown>>>({})

  const selectedFont = (() => {
    const field = effectiveFields[form.selectedFieldIndex]
    if (!field || field.font_source !== 'google' || !field.font_family) return null
    return data.googleFonts.find((f) => f.family === field.font_family) ?? null
  })()

  const uploadedFontGroups = groupUploadedFonts(data.uploadedFonts)

  const currentUploadedFont = (() => {
    const field = effectiveFields[form.selectedFieldIndex]
    if (field?.font_source !== 'uploaded' || !field.uploaded_font_key) return null
    return data.uploadedFonts.find((uf) => uf.key === field.uploaded_font_key) ?? null
  })()

  const currentUploadedParsed = !currentUploadedFont
    ? null
    : parseFontFilename(currentUploadedFont.name)

  useEffect(() => {
    loadTemplateData(templateId, dispatchData, dispatchForm, dispatchLoading, dispatchVariantUI)
  }, [templateId])

  useEffect(() => {
    loadEditorFontsData(dispatchData)
  }, [])

  useEffect(() => {
    syncUploadedFontStyles(effectiveFields)
  }, [effectiveFields])

  useEffect(() => {
    checkUploadedFontsCompatibility(effectiveFields, dispatchData)
  }, [effectiveFields])

  useEffect(() => {
    checkGoogleFontsCompatibility(effectiveFields, dispatchData)
  }, [effectiveFields])

  useEffect(() => {
    syncGoogleFontVariant(effectiveFields[form.selectedFieldIndex], data.googleFonts, fontVariantStyleId)
  }, [effectiveFields, form.selectedFieldIndex, data.googleFonts])

  useEffect(() => {
    savedOverrides.current = {}
  }, [variantUI.activeTab])

  const updateField = (index: number, updates: Partial<FieldMapping>) => {
    if (isVariantTab) {
      const field = form.fields[index]
      if (!field) return
      const dirty: Record<string, unknown> = { ...(dirtyOverrides[field.id] || {}) }
      for (const [key, value] of Object.entries(updates)) {
        const saved = savedOverrides.current[field.id]?.[key]
        const base = (field as Record<string, unknown>)[key]
        const override = activeOverrides?.[field.id]?.[key as keyof VariantOverride]
        const currentVal = saved !== undefined ? saved : (override !== undefined ? override : base)
        if (value !== currentVal) {
          dirty[key] = value
        } else {
          delete dirty[key]
        }
      }
      setDirtyOverrides((prev) => {
        if (Object.keys(dirty).length === 0) {
          const next = { ...prev }
          delete next[field.id]
          return next
        }
        return { ...prev, [field.id]: dirty }
      })
    } else {
      dispatchForm({ type: 'UPDATE_FIELD', index, updates })
    }
  }

  function addCustomField() {
    dispatchForm({ type: 'ADD_FIELD' })
  }

  async function handleSave() {
    if (isVariantTab && activeVariant) {
      dispatchVariantUI({ type: 'SET_SAVING_OVERRIDES', value: true })
      dispatchForm({ type: 'CLEAR_ERROR' })
      dispatchForm({ type: 'SET_SUCCESS', value: false })
      try {
        const mergedOverrides: Record<string, Record<string, unknown>> = {}
        for (const [fieldId, dirty] of Object.entries(dirtyOverrides)) {
          const saved = savedOverrides.current[fieldId] || {}
          mergedOverrides[fieldId] = { ...saved, ...dirty }
        }
        const overridesPayload: Array<Record<string, unknown>> = Object.entries(mergedOverrides).map(([fieldId, values]) => ({
          field_id: fieldId,
          ...values,
        }))
        const res = await fetch(`/api/admin/pdf-templates/${templateId}/variants/${activeVariant.id}/overrides`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ overrides: overridesPayload }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to save overrides')
        }
        setDirtyOverrides({})
        savedOverrides.current = {}
        const reloadRes = await fetch(`/api/admin/pdf-templates/${templateId}`)
        const reloadData = await reloadRes.json()
        dispatchVariantUI({ type: 'SET_VARIANTS', variants: reloadData.variants ?? [] })
        dispatchForm({ type: 'SET_SUCCESS', value: true })
        router.refresh()
      } catch (err) {
        dispatchForm({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Save failed' })
      }
      dispatchVariantUI({ type: 'SET_SAVING_OVERRIDES', value: false })
    } else {
      dispatchLoading({ type: 'START_SAVING' })
      dispatchForm({ type: 'CLEAR_ERROR' })
      dispatchForm({ type: 'SET_SUCCESS', value: false })

      try {
        const savedFields = await apiSaveFields(templateId, form.fields)
        dispatchForm({ type: 'SET_FIELDS', fields: savedFields.map((f: any) => ({ ...f, multiline: f.multiline ?? false })) })
        dispatchForm({ type: 'SET_SUCCESS', value: true })
        router.refresh()
      } catch (err) {
        dispatchForm({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Save failed' })
      }
      dispatchLoading({ type: 'STOP_SAVING' })
    }
  }

  async function handleRefreshFields() {
    dispatchLoading({ type: 'SET_LOADING', value: true })
    try {
      const result = await apiParsePdfTemplate(templateId)
      dispatchForm({ type: 'SET_FIELDS', fields: result.fields })
      dispatchData({ type: 'SET_PDF_FONTS', fonts: result.pdfFonts ?? [] })
      router.refresh()
    } catch (err) {
      dispatchForm({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Parse failed' })
    }
    dispatchLoading({ type: 'SET_LOADING', value: false })
  }

  async function handleDeleteTemplate() {
    if (!confirm(t('deleteTemplateConfirm'))) return
    try {
      await apiDeletePdfTemplate(templateId)
      router.push(`/${lang}/admin/pdf-templates`)
    } catch (err) {
      dispatchForm({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Delete failed' })
    }
  }

  async function handleSaveFont(index: number) {
    const field = form.fields[index]
    if (!field.font_family) return

    dispatchLoading({ type: 'SET_SAVING_FONT', value: true })
    dispatchForm({ type: 'CLEAR_ERROR' })
    try {
      const { blob, fileName } = await apiDownloadFont(field.font_family, field.font_variant || 'regular')
      const file = new File([blob], fileName, { type: 'font/ttf' })

      const [res] = await uploadFiles('fontFileUpload', { files: [file] })
      const { family, variant } = parseFontFilename(fileName)
      const createData = await createFontRecord({ key: res.key, name: fileName, family, variant, file_url: res.ufsUrl, file_size: blob.size })

      const fontsRes = await fetch('/api/admin/fonts')
      const fontsData = await fontsRes.json()
      const updatedFonts: UploadedFont[] = (fontsData.fonts ?? []).map((f: { id: string; file_key: string; name: string; family: string; variant: string }) => ({
        id: f.id,
        key: f.file_key,
        name: f.name,
        family: f.family,
        variant: f.variant,
      }))
      dispatchData({ type: 'SET_UPLOADED_FONTS', fonts: updatedFonts })

      if (createData.font) {
        updateField(index, {
          font_source: 'uploaded',
          uploaded_font_key: res.key,
          font_id: createData.font.id,
          font_family: `UPLOADED_FONT_${res.key}`,
          font_variant: variant,
        })
      }
    } catch (err) {
      dispatchForm({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Failed to save font' })
    }
    dispatchLoading({ type: 'SET_SAVING_FONT', value: false })
  }

  async function handleUploadFont(file: File): Promise<{ key: string; id: string } | null> {
    const { family, variant } = parseFontFilename(file.name)
    const existing = data.uploadedFonts.find((f) => f.family === family && f.variant === variant)
    if (existing) {
      return { key: existing.key, id: existing.id }
    }

    dispatchLoading({ type: 'SET_UPLOADING_FONT', value: true })
    try {
      const [res] = await uploadFiles('fontFileUpload', { files: [file] })
      const createData = await createFontRecord({ key: res.key, name: file.name, family, variant, file_url: res.ufsUrl, file_size: file.size })
      dispatchData({ type: 'ADD_UPLOADED_FONT', font: { id: createData.font.id, key: res.key, name: file.name, family, variant } })
      dispatchLoading({ type: 'SET_UPLOADING_FONT', value: false })
      return { key: res.key, id: createData.font.id }
    } catch {
      dispatchLoading({ type: 'SET_UPLOADING_FONT', value: false })
      return null
    }
  }

  async function handleUploadPreview(file: File) {
    setUploadingPreview(true)
    try {
      const [res] = await uploadFiles('templatePreviewUpload', { files: [file] })
      await fetch(`/api/admin/pdf-templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preview_url: res.url, preview_key: res.key }),
      })
      dispatchData({
        type: 'SET_TEMPLATE',
        template: { ...data.template!, preview_url: res.url, preview_key: res.key, pdf_template_fields: data.template!.pdf_template_fields },
      })
    } catch {
      dispatchForm({ type: 'SET_ERROR', error: 'Failed to upload preview' })
    }
    setUploadingPreview(false)
  }

  async function handleRemovePreview() {
    try {
      await fetch(`/api/admin/pdf-templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preview_url: null, preview_key: null }),
      })
      dispatchData({
        type: 'SET_TEMPLATE',
        template: { ...data.template!, preview_url: null, preview_key: null, pdf_template_fields: data.template!.pdf_template_fields },
      })
    } catch {
      dispatchForm({ type: 'SET_ERROR', error: 'Failed to remove preview' })
    }
  }

  async function handleAddVariant(name: string, file: File): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await uploadFiles('pdfTemplateUpload', { files: [file] })
      const uploaded = result[0]
      const res = await fetch(`/api/admin/pdf-templates/${templateId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, file_url: uploaded.url, file_key: uploaded.key }),
      })
      if (!res.ok) {
        const data = await res.json()
        if (data.missingFromVariant || data.extraInVariant) {
          const details = [
            data.missingFromVariant?.length ? `Missing from variant: ${data.missingFromVariant.join(', ')}` : '',
            data.extraInVariant?.length ? `Extra in variant: ${data.extraInVariant.join(', ')}` : '',
          ].filter(Boolean).join('. ')
          return { success: false, error: `${data.error}. ${details}` }
        }
        return { success: false, error: data.error || 'Failed to add variant' }
      }
      const { variant } = await res.json()
      dispatchVariantUI({ type: 'ADD_VARIANT', variant })
      dispatchForm({ type: 'SET_SUCCESS', value: true })
      router.refresh()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to add variant' }
    }
  }

  async function handleRenameVariant(variantId: string, name: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/admin/pdf-templates/${templateId}/variants/${variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) return false
      dispatchVariantUI({ type: 'UPDATE_VARIANT', id: variantId, name })
      return true
    } catch {
      return false
    }
  }

  async function handleDeleteVariant(variantId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/admin/pdf-templates/${templateId}/variants/${variantId}`, { method: 'DELETE' })
      if (!res.ok) return false
      dispatchVariantUI({ type: 'REMOVE_VARIANT', id: variantId })
      setDirtyOverrides({})
      router.refresh()
      return true
    } catch {
      return false
    }
  }

  if (loadingState.loading) {
    return <div className="text-muted-foreground">{t('loading')}</div>
  }

  if (!data.template) {
    return <div className="text-red-500">{t('templateNotFound')}</div>
  }

  const hasUnsavedIds = form.fields.some((f) => !f.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{data.template.name}</h2>
          {data.template.description && (
            <p className="text-sm text-muted-foreground">{data.template.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => previewInputRef.current?.click()}
            disabled={uploadingPreview}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
          >
            {uploadingPreview ? t('uploadingPreview') : t('uploadPreview')}
          </button>
          <input
            ref={previewInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) await handleUploadPreview(file)
            }}
          />
          <button
            type="button"
            onClick={() => dispatchForm({ type: 'TOGGLE_PDF_PREVIEW' })}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
          >
            {form.showPdfPreview ? t('hidePreview') : t('previewPdf')}
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

      {data.template.preview_url && (
        <div className="relative inline-block">
          <img
            src={data.template.preview_url}
            alt={`${data.template.name} preview`}
            className="w-60 h-60 object-contain rounded-lg border"
          />
          <button
            type="button"
            onClick={handleRemovePreview}
            className="absolute top-1 right-1 rounded-md bg-red-500 px-2 py-0.5 text-xs text-white hover:bg-red-600"
          >
            {t('removePreview')}
          </button>
        </div>
      )}

      <VariantTabs
        variants={variantUI.variants}
        activeTab={variantUI.activeTab}
        onSelectTab={(tab) => dispatchVariantUI({ type: 'SET_ACTIVE_TAB', tab })}
        onAddVariant={handleAddVariant}
        onRenameVariant={handleRenameVariant}
        onDeleteVariant={handleDeleteVariant}
        t={t}
      />

      {activeVariant && form.success && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-600">
          {t('savedSuccess')}
        </div>
      )}

      {activeVariant && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Editing variant: <strong>{activeVariant.name}</strong>. Changes affect only this variant. Field mappings are shared with the main template.
        </div>
      )}

      {form.showPdfPreview && (isVariantTab ? activeVariant?.file_url : data.template.file_url) && (
        <div className="rounded-xl border overflow-hidden">
          <iframe
            src={isVariantTab ? activeVariant!.file_url : data.template.file_url}
            className="h-[500px] w-full"
            title="PDF Preview"
            sandbox="allow-scripts"
          />
        </div>
      )}

      {form.error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-600">
          {form.error}
        </div>
      )}

      {form.success && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-600">
          {t('savedSuccess')}
        </div>
      )}

      {data.pdfFonts.length > 0 && (
        <div className="rounded-xl border p-4 space-y-3">
          <button
            type="button"
            onClick={() => dispatchForm({ type: 'TOGGLE_PDF_FONTS' })}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-sm font-semibold">{t('pdfFontsUsed')} ({data.pdfFonts.length})</h3>
            <span className="text-xs text-muted-foreground">{form.showPdfFonts ? '▲' : '▼'}</span>
          </button>
          {form.showPdfFonts && (
            <div className="space-y-1.5">
              {data.pdfFonts.map((font) => (
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
        <FieldSidebar
          sortedFields={sortedFields}
          fields={effectiveFields}
          selectedFieldIndex={form.selectedFieldIndex}
          onSelectField={(index) => dispatchForm({ type: 'SET_SELECTED_INDEX', index })}
          onToggleField={(index, checked) => updateField(index, { is_enabled: checked })}
          onAddField={isVariantTab ? () => {} : addCustomField}
          t={t}
        />

        {effectiveFields.length > 0 && form.selectedFieldIndex < effectiveFields.length && (
          <FieldEditorPanel
            field={effectiveFields[form.selectedFieldIndex]}
            index={form.selectedFieldIndex}
            selectedFont={selectedFont}
            currentUploadedParsed={currentUploadedParsed}
            uploadedFontGroups={uploadedFontGroups}
            localePangram={localePangram}
            locale={locale}
            data={data}
            loadingState={loadingState}
            onUpdateField={updateField}
            onSaveFont={handleSaveFont}
            onUploadFont={handleUploadFont}
            t={t}
          />
        )}
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
          disabled={loadingState.saving || variantUI.savingOverrides || hasUnsavedIds}
          className="rounded-lg bg-bright-sky px-6 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
        >
          {loadingState.saving || variantUI.savingOverrides ? t('saving') : isVariantTab ? t('saveOverrides') : t('saveMappings')}
        </button>
      </div>
    </div>
  )
}
