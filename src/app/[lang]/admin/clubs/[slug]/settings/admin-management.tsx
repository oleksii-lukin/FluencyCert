"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function AdminManagement({
  clubSlug,
  admins,
  members,
}: {
  clubSlug: string
  admins: {
    user_id: string
    email: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
    created_at: string
  }[]
  members: {
    user_id: string
    email: string
    first_name: string | null
    last_name: string | null
  }[]
}) {
  const t = useTranslations("admin")
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [adding, setAdding] = useState(false)

  const memberOptions = members.filter(
    (m) => !admins.some((a) => a.user_id === m.user_id)
  )

  async function handleAdd() {
    if (!selectedUserId) return
    setAdding(true)
    await fetch(`/api/clubs/${clubSlug}/members/${selectedUserId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "admin" }),
    })
    setAdding(false)
    setShowAdd(false)
    setSelectedUserId("")
    router.refresh()
  }

  async function handleRemove(userId: string) {
    if (!confirm("Remove this administrator?")) return
    await fetch(`/api/clubs/${clubSlug}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "member" }),
    })
    router.refresh()
  }

  return (
    <div className="rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{t("administrators")}</h3>
        {memberOptions.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
            {t("addAdmin")}
          </Button>
        )}
      </div>

      {showAdd && (
        <div className="mb-4 flex gap-2">
          <select
            className="flex-1 rounded-lg border bg-background p-2 text-sm"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">{t("selectMember")}</option>
            {memberOptions.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {[m.first_name, m.last_name].filter(Boolean).join(" ") || m.email} ({m.email})
              </option>
            ))}
          </select>
          <Button size="sm" disabled={!selectedUserId || adding} onClick={handleAdd}>
            {adding ? "..." : t("add")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>
            {t("cancel")}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {admins.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("noAdmins")}</p>
        )}
        {admins.map((admin) => (
          <div
            key={admin.user_id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex items-center gap-3">
              {admin.avatar_url ? (
                <Image src={admin.avatar_url} alt="" width={32} height={32} className="rounded-full size-8" />
              ) : (
                <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  {(admin.first_name?.[0] ?? admin.email[0]).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium">
                  {[admin.first_name, admin.last_name].filter(Boolean).join(" ") || "—"}
                </p>
                <p className="text-xs text-muted-foreground">{admin.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRemove(admin.user_id)}
              className="text-xs text-red-600 hover:text-red-700"
            >
              {t("remove")}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
