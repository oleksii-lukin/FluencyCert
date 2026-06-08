"use client"

import { useReducer } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const LOCALES = ["en", "uk"] as const

type Translations = Record<string, { name?: string; description?: string }>

interface FormState {
  name: string
  description: string
  translations: Translations
}

interface UiState {
  saving: boolean
  error: string
  success: boolean
  showTranslations: boolean
}

type FormAction =
  | { type: "SET_NAME"; value: string }
  | { type: "SET_DESCRIPTION"; value: string }
  | { type: "SET_TRANSLATIONS"; value: Translations }

type UiAction =
  | { type: "START_SAVING" }
  | { type: "SAVE_ERROR"; error: string }
  | { type: "SAVE_SUCCESS" }
  | { type: "TOGGLE_TRANSLATIONS" }

function createFormState(name: string, description: string, translations: Translations): FormState {
  return { name, description, translations }
}

const initialUiState: UiState = {
  saving: false,
  error: "",
  success: false,
  showTranslations: false,
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, name: action.value }
    case "SET_DESCRIPTION":
      return { ...state, description: action.value }
    case "SET_TRANSLATIONS":
      return { ...state, translations: action.value }
    default:
      return state
  }
}

function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case "START_SAVING":
      return { ...state, saving: true, error: "", success: false }
    case "SAVE_ERROR":
      return { ...state, saving: false, error: action.error }
    case "SAVE_SUCCESS":
      return { ...state, saving: false, success: true }
    case "TOGGLE_TRANSLATIONS":
      return { ...state, showTranslations: !state.showTranslations }
    default:
      return state
  }
}

export function ClubSettingsForm({
  club,
}: {
  club: {
    id: string
    name: string
    slug: string
    description: string | null
    translations: Translations | null
  }
}) {
  const t = useTranslations("admin")
  const router = useRouter()
  const slug = club.slug
  const [form, dispatchForm] = useReducer(formReducer, club.name, (name) =>
    createFormState(name, club.description ?? "", club.translations ?? {})
  )
  const [ui, dispatchUi] = useReducer(uiReducer, initialUiState)

  function updateTranslation(locale: string, field: "name" | "description", value: string) {
    dispatchForm({
      type: "SET_TRANSLATIONS",
      value: {
        ...form.translations,
        [locale]: { ...form.translations[locale], [field]: value || undefined },
      },
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    dispatchUi({ type: "START_SAVING" })

    const res = await fetch(`/api/clubs/${club.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description.trim() || null,
        translations: form.translations,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      dispatchUi({ type: "SAVE_ERROR", error: data.error || "Failed to save" })
      return
    }

    dispatchUi({ type: "SAVE_SUCCESS" })
    router.refresh()
  }

  return (
    <div className="rounded-xl border p-6">
      <h3 className="text-lg font-semibold mb-4">{t("clubDetails")}</h3>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("clubName")}</label>
          <input
            type="text"
            required
            aria-label="Club name"
            className="w-full rounded-lg border bg-background p-2.5 text-sm"
            value={form.name}
            onChange={(e) => dispatchForm({ type: "SET_NAME", value: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("clubSlug")}</label>
          <input
            type="text"
            aria-label="Club slug"
            className="w-full rounded-lg border bg-background p-2.5 text-sm font-mono text-muted-foreground"
            value={slug}
            disabled
          />
          <p className="text-xs text-muted-foreground mt-1">{t("slugCannotChange")}</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("clubDescription")}</label>
          <textarea
            aria-label="Club description"
            className="w-full rounded-lg border bg-background p-2.5 text-sm"
            rows={3}
            value={form.description}
            onChange={(e) => dispatchForm({ type: "SET_DESCRIPTION", value: e.target.value })}
          />
        </div>

        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => dispatchUi({ type: "TOGGLE_TRANSLATIONS" })}
          >
            {t("manageTranslations")}
          </Button>
        </div>

        {ui.showTranslations && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <p className="text-sm font-medium">{t("translations")}</p>
            {LOCALES.map((locale) => (
              <div key={locale} className="space-y-2 pb-3 border-b last:border-b-0">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{locale}</p>
                <input
                  type="text"
                  aria-label="Translated club name"
                  className="w-full rounded-lg border bg-background p-2 text-sm"
                  placeholder={t("clubName")}
                  value={form.translations[locale]?.name ?? ""}
                  onChange={(e) => updateTranslation(locale, "name", e.target.value)}
                />
                <textarea
                  aria-label="Translated club description"
                  className="w-full rounded-lg border bg-background p-2 text-sm"
                  rows={2}
                  placeholder={t("clubDescription")}
                  value={form.translations[locale]?.description ?? ""}
                  onChange={(e) => updateTranslation(locale, "description", e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        {ui.error && <p className="text-sm text-red-500">{ui.error}</p>}
        {ui.success && <p className="text-sm text-green-600">{t("saved")}</p>}

        <div className="flex justify-end">
          <Button type="submit" disabled={ui.saving} className="bg-bright-sky text-white">
            {ui.saving ? "..." : t("save")}
          </Button>
        </div>
      </form>
    </div>
  )
}
