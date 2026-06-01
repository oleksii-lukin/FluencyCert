"use client"

import { useState } from "react"
import { useTranslations } from 'next-intl'
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface FeedbackFormProps {
  slug: string
  onSuccess?: () => void
}

export function FeedbackForm({ slug, onSuccess }: FeedbackFormProps) {
  const t = useTranslations('feedback')
  const router = useRouter()
  const [feedbackText, setFeedbackText] = useState("")
  const [namePref, setNamePref] = useState<"nickname" | "full_name">("nickname")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    const res = await fetch(`/api/certificates/${slug}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feedback_text: feedbackText,
        display_name_preference: namePref,
        linkedin_url: linkedinUrl || undefined,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || t('somethingWentWrong'))
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
    router.refresh()
    onSuccess?.()
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
        {t('submittedSuccess')}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 dark:bg-gray-800">
      <h3 className="text-sm font-semibold text-graphite dark:text-snow mb-3">
        {t('leaveFeedback')}
      </h3>

      <textarea
        className="w-full rounded-lg border bg-background p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-bright-sky"
        placeholder={t('placeholder')}
        value={feedbackText}
        onChange={(e) => setFeedbackText(e.target.value)}
        maxLength={500}
      />
      <p className="mt-1 text-right text-xs text-muted-foreground">
        {feedbackText.length}/500
      </p>

      <div className="mt-3 space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {t('nameAppearance')}
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="radio"
                name="namePref"
                value="nickname"
                checked={namePref === "nickname"}
                onChange={() => setNamePref("nickname")}
                className="accent-bright-sky"
              />
              {t('username')}
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="radio"
                name="namePref"
                value="full_name"
                checked={namePref === "full_name"}
                onChange={() => setNamePref("full_name")}
                className="accent-bright-sky"
              />
              {t('fullName')}
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            {t('linkedinUrl')}
          </label>
          <input
            type="url"
            className="w-full rounded-lg border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
            placeholder={t('linkedinPlaceholder')}
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      <div className="mt-4 flex justify-end">
        <Button
          type="submit"
          size="sm"
          disabled={!feedbackText.trim() || submitting}
        >
          {submitting ? t('submitting') : t('submitFeedback')}
        </Button>
      </div>
    </form>
  )
}
