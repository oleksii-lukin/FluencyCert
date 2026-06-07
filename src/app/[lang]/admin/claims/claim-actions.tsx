"use client"

import { useState, useEffect } from "react"
import { useTranslations } from 'next-intl'
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

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
  const [open, setOpen] = useState<'approve' | 'reject' | null>(null)
  const [feedback, setFeedback] = useState("")
  const [englishLevel, setEnglishLevel] = useState("")
  const [speakingClubsCount, setSpeakingClubsCount] = useState("")
  const [hoursParticipated, setHoursParticipated] = useState("")
  const [backgroundTemplate, setBackgroundTemplate] = useState("modern-glass")
  const [slug, setSlug] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [certType, setCertType] = useState<'react' | 'pdf'>('react')
  const [pdfTemplates, setPdfTemplates] = useState<PdfTemplate[]>([])
  const [selectedPdfTemplate, setSelectedPdfTemplate] = useState("")
  const [overridableFields, setOverridableFields] = useState<OverridableField[]>([])
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({})

  useEffect(() => {
    if (certType === 'pdf') {
      fetch('/api/admin/pdf-templates')
        .then((r) => r.json())
        .then((data) => setPdfTemplates(data.templates ?? []))
        .catch(() => {})
    }
  }, [certType])

  function handleOpenApprove() {
    resetForm()
    setCertType('react')
    setSelectedPdfTemplate("")
    setOverridableFields([])
    setCustomFieldValues({})
    setOpen('approve')
  }

  function handleOpenUpdate() {
    if (initialData) {
      setFeedback(initialData.admin_feedback ?? "")
      setEnglishLevel(initialData.english_level ?? "")
      setSpeakingClubsCount(String(initialData.speaking_clubs_count ?? ""))
      setHoursParticipated(String(initialData.hours_participated ?? ""))
      setBackgroundTemplate(initialData.background_template || "modern-glass")
      setSlug(initialData.slug ?? "")
      setError("")
      if (initialData.pdf_template_id) {
        setCertType('pdf')
        setSelectedPdfTemplate(initialData.pdf_template_id)
        fetchOverridableFields(initialData.pdf_template_id)
      } else {
        setCertType('react')
        setSelectedPdfTemplate("")
        setOverridableFields([])
        setCustomFieldValues({})
      }
    }
    setOpen('approve')
  }

  function handleOpenReject() {
    resetForm()
    setOpen('reject')
  }

  function resetForm() {
    setFeedback("")
    setEnglishLevel("")
    setSpeakingClubsCount("")
    setHoursParticipated("")
    setSlug("")
    setError("")
  }

  function fetchOverridableFields(templateId: string) {
    if (!templateId) return
    setOverridableFields([])
    setCustomFieldValues({})
    fetch(`/api/admin/pdf-templates/${templateId}`)
      .then((r) => r.json())
      .then((data) => {
        const fields = data.template?.pdf_template_fields ?? []
        const overridable = fields.filter((f: OverridableField) => f.custom_overridable === true)
        setOverridableFields(overridable)
        const defaults: Record<string, string> = {}
        for (const f of overridable) {
          defaults[f.id] = f.custom_default_value ?? ''
        }
        setCustomFieldValues(defaults)
      })
      .catch(() => {})
  }

  function handleTemplateChange(templateId: string) {
    setSelectedPdfTemplate(templateId)
    fetchOverridableFields(templateId)
  }

  async function handleSubmit(status: 'approved' | 'rejected') {
    setSubmitting(true)
    setError("")

    const body: Record<string, unknown> = { admin_feedback: feedback }

    if (slug.trim()) {
      body.slug = slug.trim()
    }

    if (mode === 'update') {
      body.english_level = englishLevel.trim()
      body.speaking_clubs_count = parseInt(speakingClubsCount, 10)
      if (certType === 'react') {
        body.background_template = backgroundTemplate
      }
      if (hoursParticipated) {
        body.hours_participated = parseInt(hoursParticipated, 10)
      }
      if (certType === 'pdf') {
        body.pdf_template_id = selectedPdfTemplate
        body.custom_values = Object.entries(customFieldValues).map(([field_id, value]) => ({
          field_id,
          value,
        }))
      }
    } else if (status === 'approved') {
      body.status = status
      body.english_level = englishLevel.trim()
      body.speaking_clubs_count = parseInt(speakingClubsCount, 10)
      if (certType === 'react') {
        body.background_template = backgroundTemplate
      }
      if (hoursParticipated) {
        body.hours_participated = parseInt(hoursParticipated, 10)
      }
      if (certType === 'pdf') {
        body.pdf_template_id = selectedPdfTemplate
        body.custom_values = Object.entries(customFieldValues).map(([field_id, value]) => ({
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
      const data = await res.json()
      setError(data.error || ca('somethingWentWrong'))
      setSubmitting(false)
      return
    }

    setOpen(null)
    setFeedback("")
    setEnglishLevel("")
    setSpeakingClubsCount("")
    setHoursParticipated("")
    setSlug("")
    setSelectedPdfTemplate("")
    setCertType('react')
    setOverridableFields([])
    setCustomFieldValues({})
    setSubmitting(false)
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

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl border bg-white p-6 shadow-xl dark:bg-graphite max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">
              {isUpdate ? ca('updateTitle') : open === 'approve' ? ca('approveTitle') : ca('rejectTitle')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isUpdate ? ca('provideUpdateDetails') : open === 'approve' ? ca('provideFeedbackDetails') : ca('provideRejectionReason')}
            </p>

            <div className="space-y-4">
              {(open === 'approve') && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">{pt('certificateType')}</label>
                    <select
                      className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                      value={certType}
                      onChange={(e) => setCertType(e.target.value as 'react' | 'pdf')}
                    >
                      <option value="react">{pt('typeReact')}</option>
                      <option value="pdf">{pt('typePdf')}</option>
                    </select>
                  </div>

                  {certType === 'pdf' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">{pt('pdfTemplate')}</label>
                        <select
                          className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                          value={selectedPdfTemplate}
                          onChange={(e) => handleTemplateChange(e.target.value)}
                        >
                          <option value="">{pt('selectTemplate')}</option>
                          {pdfTemplates.map((ptpl) => (
                            <option key={ptpl.id} value={ptpl.id}>{ptpl.name}</option>
                          ))}
                        </select>
                      </div>

                      {overridableFields.map((field) => (
                        <div key={field.id}>
                          <label className="block text-sm font-medium mb-1">{field.display_label}</label>
                          <input
                            type="text"
                            aria-label={field.display_label}
                            className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                            placeholder={field.display_label}
                            value={customFieldValues[field.id] ?? ''}
                            onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                          />
                        </div>
                      ))}
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">{ca('englishLevel')}</label>
                    <select
                      className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                      value={englishLevel}
                      onChange={(e) => setEnglishLevel(e.target.value)}
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
                  <div>
                    <label className="block text-sm font-medium mb-1">{ca('speakingClubsVisited')}</label>
                    <input
                      type="number"
                      min="0"
                      aria-label={ca('speakingClubsVisited')}
                      className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                      placeholder={ca('clubsPlaceholder')}
                      value={speakingClubsCount}
                      onChange={(e) => setSpeakingClubsCount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{ca('hoursParticipatedOptional')}</label>
                    <input
                      type="number"
                      min="0"
                      aria-label={ca('hoursParticipatedOptional')}
                      className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                      placeholder={ca('hoursPlaceholder')}
                      value={hoursParticipated}
                      onChange={(e) => setHoursParticipated(e.target.value)}
                    />
                  </div>
                  {certType !== 'pdf' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">{ca('backgroundTemplate')}</label>
                      <select
                        className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                        value={backgroundTemplate}
                        onChange={(e) => setBackgroundTemplate(e.target.value)}
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
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
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
                  placeholder={open === 'approve' ? ca('feedbackPlaceholderApprove') : ca('feedbackPlaceholderReject')}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}

            <div className="mt-4 flex justify-end gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setOpen(null); setError("") }}
              >
                {ca('cancel')}
              </Button>
              <Button
                size="sm"
                disabled={
                  !feedback.trim() ||
                  submitting ||
                  (open === 'approve' && (!englishLevel || !speakingClubsCount)) ||
                  (open === 'approve' && certType === 'pdf' && !selectedPdfTemplate)
                }
                onClick={() => handleSubmit(isUpdate ? 'approved' : (open === 'approve' ? 'approved' : 'rejected'))}
                className={isUpdate
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : open === 'approve'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }
              >
                {submitting ? ca('processing') : isUpdate ? ca('update') : open === 'approve' ? ca('approve') : ca('reject')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
