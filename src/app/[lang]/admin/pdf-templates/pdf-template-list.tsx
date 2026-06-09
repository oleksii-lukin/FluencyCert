'use client'

import { useEffect, useReducer } from 'react'
import { useTranslations } from 'next-intl'
import { uploadFiles } from '@/lib/uploadthing'
import { Link, useRouter } from '@/i18n/routing'

async function createPdfTemplate(name: string, description: string, file: File) {
  const result = await uploadFiles('pdfTemplateUpload', { files: [file] })
  const uploaded = result[0]

  const res = await fetch('/api/admin/pdf-templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      description: description || null,
      file_url: uploaded.url,
      file_key: uploaded.key,
    }),
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to create template')
  }

  const { template } = await res.json()

  const parseRes = await fetch(`/api/admin/pdf-templates/${template.id}/parse`, { method: 'POST' })
  if (!parseRes.ok) {
    const data = await parseRes.json()
    console.warn('Field parsing warning:', data.error)
  }

  return template
}

async function deletePdfTemplate(templateId: string) {
  const res = await fetch(`/api/admin/pdf-templates/${templateId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Delete failed')
}

async function uploadPdfTemplate(name: string, description: string, file: File) {
  try {
    const template = await createPdfTemplate(name, description, file)
    return { success: true as const, template }
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'Upload failed' }
  }
}

async function loadPdfTemplatesList(dispatchData: React.Dispatch<DataAction>) {
  try {
    const res = await fetch('/api/admin/pdf-templates')
    const data = await res.json()
    dispatchData({ type: 'SET_TEMPLATES', templates: data.templates ?? [] })
  } catch {} finally {
    dispatchData({ type: 'SET_LOADING', loading: false })
  }
}

async function deletePdfTemplateById(templateId: string) {
  try {
    await deletePdfTemplate(templateId)
    return { success: true as const }
  } catch {
    return { success: false as const }
  }
}

interface PdfTemplate {
  id: string
  name: string
  description: string | null
  file_url: string
  created_at: string
  pdf_template_fields: { count: number }[]
}

interface UploadFormState {
  newName: string
  newDescription: string
  uploadOpen: boolean
  uploading: boolean
  uploadError: string
}

interface DataState {
  templates: PdfTemplate[]
  loading: boolean
  deleting: string | null
}

type UploadFormAction =
  | { type: 'SET_NAME'; value: string }
  | { type: 'SET_DESCRIPTION'; value: string }
  | { type: 'OPEN_UPLOAD' }
  | { type: 'CLOSE_UPLOAD' }
  | { type: 'START_UPLOADING' }
  | { type: 'UPLOAD_ERROR'; error: string }
  | { type: 'UPLOAD_SUCCESS' }

type DataAction =
  | { type: 'SET_TEMPLATES'; templates: PdfTemplate[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'START_DELETING'; templateId: string }
  | { type: 'DELETE_SUCCESS'; templateId: string }
  | { type: 'STOP_DELETING' }

const initialUploadFormState: UploadFormState = {
  newName: '',
  newDescription: '',
  uploadOpen: false,
  uploading: false,
  uploadError: '',
}

const initialDataState: DataState = {
  templates: [],
  loading: true,
  deleting: null,
}

function uploadFormReducer(state: UploadFormState, action: UploadFormAction): UploadFormState {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, newName: action.value }
    case 'SET_DESCRIPTION':
      return { ...state, newDescription: action.value }
    case 'OPEN_UPLOAD':
      return { ...state, uploadOpen: true }
    case 'CLOSE_UPLOAD':
      return { ...state, uploadOpen: false }
    case 'START_UPLOADING':
      return { ...state, uploading: true, uploadError: '' }
    case 'UPLOAD_ERROR':
      return { ...state, uploading: false, uploadError: action.error }
    case 'UPLOAD_SUCCESS':
      return { ...state, newName: '', newDescription: '', uploadOpen: false, uploading: false }
    default:
      return state
  }
}

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_TEMPLATES':
      return { ...state, templates: action.templates }
    case 'SET_LOADING':
      return { ...state, loading: action.loading }
    case 'START_DELETING':
      return { ...state, deleting: action.templateId }
    case 'DELETE_SUCCESS':
      return { ...state, templates: state.templates.filter((t) => t.id !== action.templateId), deleting: null }
    case 'STOP_DELETING':
      return { ...state, deleting: null }
    default:
      return state
  }
}

export function PdfTemplateList() {
  const t = useTranslations('adminPdfTemplates')
  const router = useRouter()
  const [uploadForm, dispatchUploadForm] = useReducer(uploadFormReducer, initialUploadFormState)
  const [data, dispatchData] = useReducer(dataReducer, initialDataState)

  useEffect(() => {
    loadPdfTemplatesList(dispatchData)
  }, [])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!uploadForm.newName.trim()) return

    const fileInput = document.getElementById('pdf-upload') as HTMLInputElement
    const file = fileInput?.files?.[0]
    if (!file) {
      dispatchUploadForm({ type: 'UPLOAD_ERROR', error: t('selectFileFirst') })
      return
    }

    dispatchUploadForm({ type: 'START_UPLOADING' })

    const result = await uploadPdfTemplate(uploadForm.newName.trim(), uploadForm.newDescription.trim(), file)
    if (result.success) {
      dispatchUploadForm({ type: 'UPLOAD_SUCCESS' })
      router.push(`/admin/pdf-templates/${result.template.id}`)
    } else {
      dispatchUploadForm({ type: 'UPLOAD_ERROR', error: result.error })
    }
  }

  async function handleDelete(templateId: string) {
    if (!confirm(t('deleteConfirm'))) return
    dispatchData({ type: 'START_DELETING', templateId })

    const result = await deletePdfTemplateById(templateId)
    if (result.success) {
      dispatchData({ type: 'DELETE_SUCCESS', templateId })
    } else {
      dispatchData({ type: 'STOP_DELETING' })
    }
  }

  if (data.loading) {
    return <div className="text-muted-foreground">{t('loading')}</div>
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => dispatchUploadForm({ type: 'OPEN_UPLOAD' })}
        className="mb-6 rounded-lg bg-bright-sky px-4 py-2 text-white hover:opacity-90"
      >
        {t('uploadNew')}
      </button>

      {uploadForm.uploadOpen && (
        <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => dispatchUploadForm({ type: 'CLOSE_UPLOAD' })}>
          <div
            className="w-full max-w-lg rounded-xl border bg-white p-6 shadow-xl dark:bg-graphite"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">{t('uploadTitle')}</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('templateName')}</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                  value={uploadForm.newName}
                  onChange={(e) => dispatchUploadForm({ type: 'SET_NAME', value: e.target.value })}
                  aria-label="Template name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('description')}</label>
                <textarea
                  className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                  value={uploadForm.newDescription}
                  onChange={(e) => dispatchUploadForm({ type: 'SET_DESCRIPTION', value: e.target.value })}
                  rows={2}
                  aria-label="Description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('pdfFile')}</label>
                <input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  required
                  className="w-full text-sm"
                  aria-label="Upload PDF file"
                />
              </div>
              {uploadForm.uploadError && (
                <p className="text-sm text-red-500">{uploadForm.uploadError}</p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => dispatchUploadForm({ type: 'CLOSE_UPLOAD' })}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={uploadForm.uploading}
                  className="rounded-lg bg-bright-sky px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
                >
                  {uploadForm.uploading ? t('uploading') : t('upload')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('name')}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('fields')}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('created')}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data.templates.map((template) => (
              <tr key={template.id} className="border-b last:border-b-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/pdf-templates/${template.id}`}
                    className="font-medium text-bright-sky hover:underline"
                  >
                    {template.name}
                  </Link>
                  {template.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {template.pdf_template_fields?.[0]?.count ?? 0}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(template.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/pdf-templates/${template.id}`}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      {t('edit')}
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(template.id)}
                      disabled={data.deleting === template.id}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {data.deleting === template.id ? t('deleting') : t('delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data.templates.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  {t('noTemplates')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
