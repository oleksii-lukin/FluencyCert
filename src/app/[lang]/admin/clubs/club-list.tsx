"use client"

import { useReducer } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"

interface FormState {
  name: string
  slug: string
  description: string
}

interface UiState {
  showCreate: boolean
  creating: boolean
  createError: string
}

type FormAction =
  | { type: "SET_NAME"; value: string }
  | { type: "SET_SLUG"; value: string }
  | { type: "SET_DESCRIPTION"; value: string }
  | { type: "RESET" }

type UiAction =
  | { type: "SHOW_CREATE" }
  | { type: "HIDE_CREATE" }
  | { type: "START_CREATING" }
  | { type: "CREATE_ERROR"; error: string }
  | { type: "CREATE_SUCCESS" }

const initialFormState: FormState = {
  name: "",
  slug: "",
  description: "",
}

const initialUiState: UiState = {
  showCreate: false,
  creating: false,
  createError: "",
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, name: action.value }
    case "SET_SLUG":
      return { ...state, slug: action.value }
    case "SET_DESCRIPTION":
      return { ...state, description: action.value }
    case "RESET":
      return initialFormState
    default:
      return state
  }
}

function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case "SHOW_CREATE":
      return { ...state, showCreate: true }
    case "HIDE_CREATE":
      return { ...state, showCreate: false }
    case "START_CREATING":
      return { ...state, creating: true, createError: "" }
    case "CREATE_ERROR":
      return { ...state, creating: false, createError: action.error }
    case "CREATE_SUCCESS":
      return { ...state, showCreate: false, creating: false }
    default:
      return state
  }
}

export function ClubList({
  clubs,
}: {
  clubs: {
    id: string
    name: string
    slug: string
    description: string | null
    member_count: number
    admin_count: number
    created_at: string
  }[]
}) {
  const t = useTranslations("admin")
  const ca = useTranslations("clubs")
  const router = useRouter()
  const [form, dispatchForm] = useReducer(formReducer, initialFormState)
  const [ui, dispatchUi] = useReducer(uiReducer, initialUiState)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.slug.trim()) return

    dispatchUi({ type: "START_CREATING" })

    const res = await fetch("/api/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name.trim(), slug: form.slug.trim(), description: form.description.trim() || null }),
    })

    if (!res.ok) {
      const data = await res.json()
      dispatchUi({ type: "CREATE_ERROR", error: data.error || "Failed to create club" })
      return
    }

    dispatchForm({ type: "RESET" })
    dispatchUi({ type: "CREATE_SUCCESS" })
    router.refresh()
  }

  return (
    <div>
      <Button onClick={() => dispatchUi({ type: "SHOW_CREATE" })} className="mb-6 bg-bright-sky text-white">
        {t("createClub")}
      </Button>

      {ui.showCreate && (
        <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => dispatchUi({ type: "HIDE_CREATE" })}>
          <div
            className="w-full max-w-lg rounded-xl border bg-white p-6 shadow-xl dark:bg-graphite"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">{t("createClub")}</h3>
            <form onSubmit={handleCreate} className="space-y-4">
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
                  required
                  aria-label="Club slug"
                  className="w-full rounded-lg border bg-background p-2.5 text-sm font-mono"
                  placeholder="my-speaking-club"
                  value={form.slug}
                  onChange={(e) => dispatchForm({ type: "SET_SLUG", value: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                />
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
              {ui.createError && <p className="text-sm text-red-500">{ui.createError}</p>}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => dispatchUi({ type: "HIDE_CREATE" })}>
                  {ca("cancel") || "Cancel"}
                </Button>
                <Button type="submit" disabled={ui.creating} className="bg-bright-sky text-white">
                  {ui.creating ? "..." : t("createClub")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t("clubName")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t("clubSlug")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t("members")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t("administrators")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t("created")}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map((club) => (
              <tr key={club.id} className="border-b last:border-b-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{club.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{club.slug}</td>
                <td className="px-4 py-3 text-sm">{club.member_count}</td>
                <td className="px-4 py-3 text-sm">{club.admin_count}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(club.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/clubs/${club.slug}`}
                    className="text-sm text-bright-sky hover:underline"
                  >
                    {ca("manage") || "Manage"}
                  </Link>
                </td>
              </tr>
            ))}
            {clubs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  {ca("noClubs")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
