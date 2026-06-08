"use client"

import { useReducer } from "react"
import { useTranslations } from 'next-intl'
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

async function fetchPdfTemplatesList() {
  const res = await fetch('/api/admin/pdf-templates')
  if (!res.ok) return []
  const data = await res.json()
  return data.templates ?? []
}

async function fetchTemplateFields(templateId: string) {
  const res = await fetch(`/api/admin/pdf-templates/${templateId}`)
  if (!res.ok) return { overridable: [], defaults: {}, dbKeys: [] }
  const data = await res.json()
  const fields = data.template?.pdf_template_fields ?? []
  const overridable = fields.filter((f: OverridableField) => f.custom_overridable === true)
  const defaults: Record<string, string> = {}
  for (const f of overridable) {
    defaults[f.id] = f.custom_default_value ?? ''
  }
  const dbKeys = fields.reduce((keys: string[], f: OverridableField) => {
    if (f.source_type === 'database' && f.source_key) keys.push(f.source_key)
    return keys
  }, [])
  return { overridable, defaults, dbKeys }
}

async function fetchOverridableFieldsData(
  templateId: string,
  dispatchData: React.Dispatch<DataAction>,
) {
  if (!templateId) return
  dispatchData({ type: 'SET_OVERRIDABLE_FIELDS', fields: [] })
  dispatchData({ type: 'SET_CUSTOM_FIELD_VALUES', values: {} })
  dispatchData({ type: 'SET_TEMPLATE_DB_KEYS', keys: [] })
  try {
    const result = await fetchTemplateFields(templateId)
    dispatchData({ type: 'SET_OVERRIDABLE_FIELDS', fields: result.overridable })
    dispatchData({ type: 'SET_CUSTOM_FIELD_VALUES', values: result.defaults })
    dispatchData({ type: 'SET_TEMPLATE_DB_KEYS', keys: result.dbKeys })
  } catch {}
}

interface PdfTemplate {
  id: string
  name: string
}

interface OverridableField {
  id: string
  display_label: string
  custom_default_value: string | null
  pdf_field_name: string
  custom_overridable: boolean
  source_type?: string
  source_key?: string | null
}

interface InitialClaimData {
  english_level: string | null
  speaking_clubs_count: number | null
  hours_participated: number | null
  background_template: string | null
  slug: string
  admin_feedback: string | null
  pdf_template_id: string | null
  status: string
}

interface FormState {
  feedback: string
  englishLevel: string
  speakingClubsCount: string
  hoursParticipated: string
  backgroundTemplate: string
  slug: string
  certType: 'react' | 'pdf'
  selectedPdfTemplate: string
  pdfTemplates: PdfTemplate[]
}

interface UiState {
  open: 'approve' | 'reject' | null
  submitting: boolean
  error: string
}

interface DataState {
  overridableFields: OverridableField[]
  customFieldValues: Record<string, string>
  templateDbKeys: string[]
}

type FormAction =
  | { type: 'SET_FEEDBACK'; value: string }
  | { type: 'SET_ENGLISH_LEVEL'; value: string }
  | { type: 'SET_SPEAKING_CLUBS_COUNT'; value: string }
  | { type: 'SET_HOURS_PARTICIPATED'; value: string }
  | { type: 'SET_BACKGROUND_TEMPLATE'; value: string }
  | { type: 'SET_SLUG'; value: string }
  | { type: 'SET_CERT_TYPE'; value: 'react' | 'pdf' }
  | { type: 'SET_SELECTED_PDF_TEMPLATE'; value: string }
  | { type: 'SET_PDF_TEMPLATES'; templates: PdfTemplate[] }
  | { type: 'LOAD_INITIAL_DATA'; data: InitialClaimData }
  | { type: 'RESET_FORM' }

type UiAction =
  | { type: 'OPEN_APPROVE' }
  | { type: 'OPEN_REJECT' }
  | { type: 'CLOSE' }
  | { type: 'START_SUBMITTING' }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'SUBMIT_SUCCESS' }

type DataAction =
  | { type: 'SET_OVERRIDABLE_FIELDS'; fields: OverridableField[] }
  | { type: 'SET_CUSTOM_FIELD_VALUES'; values: Record<string, string> }
  | { type: 'SET_TEMPLATE_DB_KEYS'; keys: string[] }
  | { type: 'SET_CUSTOM_FIELD_VALUE'; fieldId: string; value: string }
  | { type: 'RESET' }

function createInitialFormState(): FormState {
  return {
    feedback: "",
    englishLevel: "",
    speakingClubsCount: "",
    hoursParticipated: "",
    backgroundTemplate: "modern-glass",
    slug: "",
    certType: 'react',
    selectedPdfTemplate: "",
    pdfTemplates: [],
  }
}

const initialUiState: UiState = {
  open: null,
  submitting: false,
  error: "",
}

const initialDataState: DataState = {
  overridableFields: [],
  customFieldValues: {},
  templateDbKeys: [],
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FEEDBACK':
      return { ...state, feedback: action.value }
    case 'SET_ENGLISH_LEVEL':
      return { ...state, englishLevel: action.value }
    case 'SET_SPEAKING_CLUBS_COUNT':
      return { ...state, speakingClubsCount: action.value }
    case 'SET_HOURS_PARTICIPATED':
      return { ...state, hoursParticipated: action.value }
    case 'SET_BACKGROUND_TEMPLATE':
      return { ...state, backgroundTemplate: action.value }
    case 'SET_SLUG':
      return { ...state, slug: action.value }
    case 'SET_CERT_TYPE':
      return { ...state, certType: action.value }
    case 'SET_SELECTED_PDF_TEMPLATE':
      return { ...state, selectedPdfTemplate: action.value }
    case 'SET_PDF_TEMPLATES':
      return { ...state, pdfTemplates: action.templates }
    case 'LOAD_INITIAL_DATA':
      return {
        ...state,
        feedback: action.data.admin_feedback ?? "",
        englishLevel: action.data.english_level ?? "",
        speakingClubsCount: String(action.data.speaking_clubs_count ?? ""),
        hoursParticipated: String(action.data.hours_participated ?? ""),
        backgroundTemplate: action.data.background_template || "modern-glass",
        slug: action.data.slug ?? "",
      }
    case 'RESET_FORM':
      return createInitialFormState()
    default:
      return state
  }
}

function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'OPEN_APPROVE':
      return { ...state, open: 'approve' }
    case 'OPEN_REJECT':
      return { ...state, open: 'reject' }
    case 'CLOSE':
      return { ...state, open: null, error: "" }
    case 'START_SUBMITTING':
      return { ...state, submitting: true, error: "" }
    case 'SUBMIT_ERROR':
      return { ...state, submitting: false, error: action.error }
    case 'SUBMIT_SUCCESS':
      return { ...state, open: null, submitting: false }
    default:
      return state
  }
}

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_OVERRIDABLE_FIELDS':
      return { ...state, overridableFields: action.fields }
    case 'SET_CUSTOM_FIELD_VALUES':
      return { ...state, customFieldValues: action.values }
    case 'SET_TEMPLATE_DB_KEYS':
      return { ...state, templateDbKeys: action.keys }
    case 'SET_CUSTOM_FIELD_VALUE':
      return { ...state, customFieldValues: { ...state.customFieldValues, [action.fieldId]: action.value } }
    case 'RESET':
      return initialDataState
    default:
      return state
  }
}

function ClaimActionModal({
  ui,
  form,
  data,
  isUpdate,
  onCertTypeChange,
  onTemplateChange,
  onSubmit,
  dispatchForm,
  dispatchData,
  dispatchUi,
  ca,
  pt,
  tn,
  t,
}: {
  ui: UiState
  form: FormState
  data: DataState
  isUpdate: boolean
  onCertTypeChange: (value: 'react' | 'pdf') => void
  onTemplateChange: (templateId: string) => void
  onSubmit: (status: 'approved' | 'rejected') => void
  dispatchForm: React.Dispatch<FormAction>
  dispatchData: React.Dispatch<DataAction>
  dispatchUi: React.Dispatch<UiAction>
  ca: (key: string) => string
  pt: (key: string) => string
  tn: (key: string) => string
  t: (key: string) => string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl border bg-white p-6 shadow-xl dark:bg-graphite max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-2">
          {isUpdate ? ca('updateTitle') : ui.open === 'approve' ? ca('approveTitle') : ca('rejectTitle')}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isUpdate ? ca('provideUpdateDetails') : ui.open === 'approve' ? ca('provideFeedbackDetails') : ca('provideRejectionReason')}
        </p>

        <div className="space-y-4">
          {(ui.open === 'approve') && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">{pt('certificateType')}</label>
                <select
                  className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                  value={form.certType}
                  onChange={(e) => onCertTypeChange(e.target.value as 'react' | 'pdf')}
                >
                  <option value="react">{pt('typeReact')}</option>
                  <option value="pdf">{pt('typePdf')}</option>
                </select>
              </div>

              {form.certType === 'pdf' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">{pt('pdfTemplate')}</label>
                    <select
                      className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                      value={form.selectedPdfTemplate}
                      onChange={(e) => onTemplateChange(e.target.value)}
                    >
                      <option value="">{pt('selectTemplate')}</option>
                      {form.pdfTemplates.map((ptpl) => (
                        <option key={ptpl.id} value={ptpl.id}>{ptpl.name}</option>
                      ))}
                    </select>
                  </div>

                  {data.overridableFields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium mb-1">{field.display_label}</label>
                      <input
                        type="text"
                        aria-label={field.display_label}
                        className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                        placeholder={field.display_label}
                        value={data.customFieldValues[field.id] ?? ''}
                        onChange={(e) => dispatchData({ type: 'SET_CUSTOM_FIELD_VALUE', fieldId: field.id, value: e.target.value })}
                      />
                    </div>
                  ))}
                </>
              )}

              {(form.certType !== 'pdf' || data.templateDbKeys.includes('englishLevel')) && (
                <div>
                  <label className="block text-sm font-medium mb-1">{ca('englishLevel')}</label>
                  <select
                    className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                    value={form.englishLevel}
                    onChange={(e) => dispatchForm({ type: 'SET_ENGLISH_LEVEL', value: e.target.value })}
                  >
                    <option value="">{ca('selectLevel')}</option>
                    <option value="A1 (Beginner)">{ca('levelA1')}</option>
                    <option value="A2 (Elementary)">{ca('levelA2')}</option>
                    <option value="B1 (Intermediate)">{ca('levelB1')}</option>
                    <option value="B2 (Upper-Intermediate)">{ca('levelB2')}</option>
                    <option value="C1 (Advanced)">{ca('levelC1')}</option>
                    <option value="C2 (Proficient)">{ca('levelC2')}</option>
                  </select>
                </div>
              )}
              {(form.certType !== 'pdf' || data.templateDbKeys.includes('speakingClubsCount')) && (
                <div>
                  <label className="block text-sm font-medium mb-1">{ca('speakingClubsVisited')}</label>
                  <input
                    type="number"
                    min="0"
                    aria-label={ca('speakingClubsVisited')}
                    className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                    placeholder={ca('clubsPlaceholder')}
                    value={form.speakingClubsCount}
                    onChange={(e) => dispatchForm({ type: 'SET_SPEAKING_CLUBS_COUNT', value: e.target.value })}
                  />
                </div>
              )}
              {(form.certType !== 'pdf' || data.templateDbKeys.includes('hoursParticipated')) && (
                <div>
                  <label className="block text-sm font-medium mb-1">{ca('hoursParticipatedOptional')}</label>
                  <input
                    type="number"
                    min="0"
                    aria-label={ca('hoursParticipatedOptional')}
                    className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                    placeholder={ca('hoursPlaceholder')}
                    value={form.hoursParticipated}
                    onChange={(e) => dispatchForm({ type: 'SET_HOURS_PARTICIPATED', value: e.target.value })}
                  />
                </div>
              )}
              {form.certType !== 'pdf' && (
                <div>
                  <label className="block text-sm font-medium mb-1">{ca('backgroundTemplate')}</label>
                  <select
                    className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                    value={form.backgroundTemplate}
                    onChange={(e) => dispatchForm({ type: 'SET_BACKGROUND_TEMPLATE', value: e.target.value })}
                  >
                    <option value="modern-glass">{tn('modernGlass')}</option>
                    <option value="guilloche-security">{tn('guillocheSecurity')}</option>
                    <option value="neubrutal">{tn('neubrutal')}</option>
                    <option value="memphis-retro">{tn('memphisRetro')}</option>
                    <option value="cyber-neon">{tn('cyberNeon')}</option>
                    <option value="natural-green">{tn('naturalGreen')}</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {ca('customSlug')}{' '}
                  <span className="text-xs text-muted-foreground font-normal">{ca('customSlugHint')}</span>
                </label>
                <input
                  type="text"
                  aria-label={ca('customSlug')}
                  className="w-full rounded-lg border bg-background p-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-bright-sky"
                  placeholder={ca('slugPlaceholder')}
                  value={form.slug}
                  onChange={(e) => dispatchForm({ type: 'SET_SLUG', value: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                  maxLength={20}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">{t('feedback')}</label>
            <textarea
              aria-label={t('feedback')}
              className="w-full rounded-lg border bg-background p-3 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-bright-sky"
              placeholder={ui.open === 'approve' ? ca('feedbackPlaceholderApprove') : ca('feedbackPlaceholderReject')}
              value={form.feedback}
              onChange={(e) => dispatchForm({ type: 'SET_FEEDBACK', value: e.target.value })}
            />
          </div>
        </div>

        {ui.error && (
          <p className="mt-2 text-sm text-red-500">{ui.error}</p>
        )}

        <div className="mt-4 flex justify-end gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => dispatchUi({ type: 'CLOSE' })}
          >
            {ca('cancel')}
          </Button>
          <Button
            size="sm"
            disabled={
              !form.feedback.trim() ||
              ui.submitting ||
              (ui.open === 'approve' && (
                (form.certType !== 'pdf' || data.templateDbKeys.includes('englishLevel')) && !form.englishLevel ||
                (form.certType !== 'pdf' || data.templateDbKeys.includes('speakingClubsCount')) && !form.speakingClubsCount
              )) ||
              (ui.open === 'approve' && form.certType === 'pdf' && !form.selectedPdfTemplate)
            }
            onClick={() => onSubmit(isUpdate ? 'approved' : (ui.open === 'approve' ? 'approved' : 'rejected'))}
            className={isUpdate
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : ui.open === 'approve'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }
          >
            {ui.submitting ? ca('processing') : isUpdate ? ca('update') : ui.open === 'approve' ? ca('approve') : ca('reject')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ClaimActions({
  claimId,
  mode = 'approve',
  initialData,
}: {
  claimId: string
  mode?: 'approve' | 'update'
  initialData?: InitialClaimData
}) {
  const t = useTranslations('admin')
  const ca = useTranslations('claimActions')
  const tn = useTranslations('templateNames')
  const pt = useTranslations('adminPdfTemplates')
  const router = useRouter()
  const [form, dispatchForm] = useReducer(formReducer, undefined, createInitialFormState)
  const [ui, dispatchUi] = useReducer(uiReducer, initialUiState)
  const [data, dispatchData] = useReducer(dataReducer, initialDataState)

  function handleCertTypeChange(value: 'react' | 'pdf') {
    dispatchForm({ type: 'SET_CERT_TYPE', value })
    if (value === 'pdf') {
      fetchPdfTemplatesList().then((templates) => dispatchForm({ type: 'SET_PDF_TEMPLATES', templates })).catch(() => {})
    }
  }

  function handleOpenApprove() {
    dispatchForm({ type: 'RESET_FORM' })
    dispatchData({ type: 'RESET' })
    dispatchUi({ type: 'OPEN_APPROVE' })
  }

  function handleOpenUpdate() {
    if (initialData) {
      dispatchForm({ type: 'LOAD_INITIAL_DATA', data: initialData })
      if (initialData.pdf_template_id) {
        handleCertTypeChange('pdf')
        dispatchForm({ type: 'SET_SELECTED_PDF_TEMPLATE', value: initialData.pdf_template_id })
        fetchOverridableFieldsData(initialData.pdf_template_id, dispatchData)
      } else {
        handleCertTypeChange('react')
        dispatchForm({ type: 'SET_SELECTED_PDF_TEMPLATE', value: "" })
        dispatchData({ type: 'RESET' })
      }
    }
    dispatchUi({ type: 'OPEN_APPROVE' })
  }

  function handleOpenReject() {
    dispatchForm({ type: 'RESET_FORM' })
    dispatchData({ type: 'RESET' })
    dispatchUi({ type: 'OPEN_REJECT' })
  }

  function handleTemplateChange(templateId: string) {
    dispatchForm({ type: 'SET_SELECTED_PDF_TEMPLATE', value: templateId })
    fetchOverridableFieldsData(templateId, dispatchData)
  }

  async function handleSubmit(status: 'approved' | 'rejected') {
    dispatchUi({ type: 'START_SUBMITTING' })

    const body: Record<string, unknown> = { admin_feedback: form.feedback }

    if (form.slug.trim()) {
      body.slug = form.slug.trim()
    }

    if (mode === 'update') {
      if (form.certType !== 'pdf' || data.templateDbKeys.includes('englishLevel')) {
        body.english_level = form.englishLevel.trim()
      }
      if (form.certType !== 'pdf' || data.templateDbKeys.includes('speakingClubsCount')) {
        body.speaking_clubs_count = parseInt(form.speakingClubsCount, 10)
      }
      if (form.certType === 'react') {
        body.background_template = form.backgroundTemplate
      }
      if (form.hoursParticipated && (form.certType !== 'pdf' || data.templateDbKeys.includes('hoursParticipated'))) {
        body.hours_participated = parseInt(form.hoursParticipated, 10)
      }
      if (form.certType === 'pdf') {
        body.pdf_template_id = form.selectedPdfTemplate
        body.custom_values = Object.entries(data.customFieldValues).map(([field_id, value]) => ({
          field_id,
          value,
        }))
      }
    } else if (status === 'approved') {
      body.status = status
      if (form.certType !== 'pdf' || data.templateDbKeys.includes('englishLevel')) {
        body.english_level = form.englishLevel.trim()
      }
      if (form.certType !== 'pdf' || data.templateDbKeys.includes('speakingClubsCount')) {
        body.speaking_clubs_count = parseInt(form.speakingClubsCount, 10)
      }
      if (form.certType === 'react') {
        body.background_template = form.backgroundTemplate
      }
      if (form.hoursParticipated && (form.certType !== 'pdf' || data.templateDbKeys.includes('hoursParticipated'))) {
        body.hours_participated = parseInt(form.hoursParticipated, 10)
      }
      if (form.certType === 'pdf') {
        body.pdf_template_id = form.selectedPdfTemplate
        body.custom_values = Object.entries(data.customFieldValues).map(([field_id, value]) => ({
          field_id,
          value,
        }))
      }
    } else {
      body.status = status
    }

    const res = await fetch(`/api/admin/claims/${claimId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const resData = await res.json()
      dispatchUi({ type: 'SUBMIT_ERROR', error: resData.error || ca('somethingWentWrong') })
      return
    }

    dispatchForm({ type: 'RESET_FORM' })
    dispatchData({ type: 'RESET' })
    dispatchUi({ type: 'SUBMIT_SUCCESS' })
    router.refresh()
  }

  const isUpdate = mode === 'update'

  return (
    <div className="flex gap-2">
      {isUpdate ? (
        <Button
          size="sm"
          variant="outline"
          className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950"
          onClick={handleOpenUpdate}
        >
          {ca('update')}
        </Button>
      ) : (
        <>
          <Button
            size="sm"
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950"
            onClick={handleOpenApprove}
          >
            {ca('approve')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            onClick={handleOpenReject}
          >
            {ca('reject')}
          </Button>
        </>
      )}

      {ui.open && (
        <ClaimActionModal
          ui={ui}
          form={form}
          data={data}
          isUpdate={isUpdate}
          onCertTypeChange={handleCertTypeChange}
          onTemplateChange={handleTemplateChange}
          onSubmit={handleSubmit}
          dispatchForm={dispatchForm}
          dispatchData={dispatchData}
          dispatchUi={dispatchUi}
          ca={ca}
          pt={pt}
          tn={tn}
          t={t}
        />
      )}
    </div>
  )
}
