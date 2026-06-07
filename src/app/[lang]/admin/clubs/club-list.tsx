"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"

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
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) return

    setCreating(true)
    setCreateError("")

    const res = await fetch("/api/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), slug: slug.trim(), description: description.trim() || null }),
    })

    if (!res.ok) {
      const data = await res.json()
      setCreateError(data.error || "Failed to create club")
      setCreating(false)
      return
    }

    setShowCreate(false)
    setName("")
    setSlug("")
    setDescription("")
    router.refresh()
  }

  return (
    <div>
      <Button onClick={() => setShowCreate(true)} className="mb-6 bg-bright-sky text-white">
        {t("createClub")}
      </Button>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                />
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
              {createError && <p className="text-sm text-red-500">{createError}</p>}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  {ca("cancel") || "Cancel"}
                </Button>
                <Button type="submit" disabled={creating} className="bg-bright-sky text-white">
                  {creating ? "..." : t("createClub")}
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
