"use client"

import { useReducer } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface FeedbackFormProps {
  slug: string
  onSuccess?: () => void
}

interface State {
  feedbackText: string
  namePref: "nickname" | "full_name"
  linkedinUrl: string
  submitting: boolean
  error: string
  submitted: boolean
}

type Action =
  | { type: "SET_FEEDBACK_TEXT"; value: string }
  | { type: "SET_NAME_PREF"; value: "nickname" | "full_name" }
  | { type: "SET_LINKEDIN_URL"; value: string }
  | { type: "START_SUBMIT" }
  | { type: "SUBMIT_ERROR"; error: string }
  | { type: "SUBMIT_SUCCESS" }

const initialState: State = {
  feedbackText: "",
  namePref: "nickname",
  linkedinUrl: "",
  submitting: false,
  error: "",
  submitted: false,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_FEEDBACK_TEXT":
      return { ...state, feedbackText: action.value }
    case "SET_NAME_PREF":
      return { ...state, namePref: action.value }
    case "SET_LINKEDIN_URL":
      return { ...state, linkedinUrl: action.value }
    case "START_SUBMIT":
      return { ...state, submitting: true, error: "" }
    case "SUBMIT_ERROR":
      return { ...state, submitting: false, error: action.error }
    case "SUBMIT_SUCCESS":
      return { ...state, submitted: true, submitting: false }
    default:
      return state
  }
}

export function FeedbackForm({ slug, onSuccess }: FeedbackFormProps) {
  const t = useTranslations("feedback")
  const router = useRouter()
  const [state, dispatch] = useReducer(reducer, initialState)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    dispatch({ type: "START_SUBMIT" })

    const res = await fetch(`/api/certificates/${slug}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feedback_text: state.feedbackText,
        display_name_preference: state.namePref,
        linkedin_url: state.linkedinUrl || undefined,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      dispatch({ type: "SUBMIT_ERROR", error: data.error || t("somethingWentWrong") })
      return
    }

    dispatch({ type: "SUBMIT_SUCCESS" })
    router.refresh()
    onSuccess?.()
  }

  if (state.submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
        {t("submittedSuccess")}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 dark:bg-gray-800">
      <h3 className="text-sm font-semibold text-graphite dark:text-snow mb-3">
        {t("leaveFeedback")}
      </h3>

      <textarea
        aria-label="Feedback"
        className="w-full rounded-lg border bg-background p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-bright-sky"
        placeholder={t("placeholder")}
        value={state.feedbackText}
        onChange={(e) => dispatch({ type: "SET_FEEDBACK_TEXT", value: e.target.value })}
        maxLength={500}
      />
      <p className="mt-1 text-right text-xs text-muted-foreground">
        {state.feedbackText.length}/500
      </p>

      <div className="mt-3 space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {t("nameAppearance")}
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="radio"
                name="namePref"
                value="nickname"
                checked={state.namePref === "nickname"}
                onChange={() => dispatch({ type: "SET_NAME_PREF", value: "nickname" })}
                className="accent-bright-sky"
              />
              {t("username")}
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="radio"
                name="namePref"
                value="full_name"
                checked={state.namePref === "full_name"}
                onChange={() => dispatch({ type: "SET_NAME_PREF", value: "full_name" })}
                className="accent-bright-sky"
              />
              {t("fullName")}
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            {t("linkedinUrl")}
          </label>
          <input
            type="url"
            aria-label="LinkedIn URL"
            className="w-full rounded-lg border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
            placeholder={t("linkedinPlaceholder")}
            value={state.linkedinUrl}
            onChange={(e) => dispatch({ type: "SET_LINKEDIN_URL", value: e.target.value })}
          />
        </div>
      </div>

      {state.error && (
        <p className="mt-2 text-sm text-red-500">{state.error}</p>
      )}

      <div className="mt-4 flex justify-end">
        <Button
          type="submit"
          size="sm"
          disabled={!state.feedbackText.trim() || state.submitting}
        >
          {state.submitting ? t("submitting") : t("submitFeedback")}
        </Button>
      </div>
    </form>
  )
}
