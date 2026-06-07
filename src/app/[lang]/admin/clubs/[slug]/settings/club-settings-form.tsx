"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const LOCALES = ["en", "uk"] as const

type Translations = Record<string, { name?: string; description?: string }>

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
  const [name, setName] = useState(club.name)
  const [description, setDescription] = useState(club.description ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [showTranslations, setShowTranslations] = useState(false)
  const [translations, setTranslations] = useState<Translations>(club.translations ?? {})

  function updateTranslation(locale: string, field: "name" | "description", value: string) {
    setTranslations((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], [field]: value || undefined },
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess(false)

    const res = await fetch(`/api/clubs/${club.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        translations,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Failed to save")
      setSaving(false)
      return
    }

    setSuccess(true)
    setSaving(false)
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
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("clubSlug")}</label>
          <input
            type="text"
            aria-label="Club slug"
            className="w-full rounded-lg border bg-background p-2.5 text-sm font-mono text-muted-foreground"
            value={club.slug}
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowTranslations(!showTranslations)}
          >
            {t("manageTranslations")}
          </Button>
        </div>

        {showTranslations && (
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
                  value={translations[locale]?.name ?? ""}
                  onChange={(e) => updateTranslation(locale, "name", e.target.value)}
                />
                <textarea
                  aria-label="Translated club description"
                  className="w-full rounded-lg border bg-background p-2 text-sm"
                  rows={2}
                  placeholder={t("clubDescription")}
                  value={translations[locale]?.description ?? ""}
                  onChange={(e) => updateTranslation(locale, "description", e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600">{t("saved")}</p>}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="bg-bright-sky text-white">
            {saving ? "..." : t("save")}
          </Button>
        </div>
      </form>
    </div>
  )
}
