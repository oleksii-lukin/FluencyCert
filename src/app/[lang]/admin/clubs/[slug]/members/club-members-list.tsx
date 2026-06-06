"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ContactButton } from "@/components/ui/contact-button"

export function ClubMembersList({
  members,
  clubSlug,
  lang,
}: {
  members: {
    user_id: string
    email: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
    telegram_id: string | null
    telegram_username: string | null
    linkedin_url: string | null
    role: string
    joined_at: string
    claim: { slug: string; status: string } | null
  }[]
  clubSlug: string
  lang: string
}) {
  const t = useTranslations("admin")
  const router = useRouter()
  const [changing, setChanging] = useState<string | null>(null)

  async function changeRole(userId: string, role: string) {
    setChanging(userId)
    await fetch(`/api/clubs/${clubSlug}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    setChanging(null)
    router.refresh()
  }

  async function removeMember(userId: string) {
    if (!confirm(t("confirmRemoveMember") || "Remove this member?")) return
    setChanging(userId)
    await fetch(`/api/clubs/${clubSlug}/members/${userId}`, { method: "DELETE" })
    setChanging(null)
    router.refresh()
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t("user")}</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t("role")}</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t("status")}</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t("joined")}</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.user_id} className="border-b last:border-b-0 hover:bg-muted/30">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {member.avatar_url ? (
                    <Image src={member.avatar_url} alt="" width={32} height={32} className="rounded-full size-8" />
                  ) : (
                    <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {(member.first_name?.[0] ?? member.email[0]).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">
                      {[member.first_name, member.last_name].filter(Boolean).join(" ") || "—"}
                    </span>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <ContactButton type="email" value={member.email} />
                      <ContactButton type="telegram" value={member.telegram_username} />
                      <ContactButton type="linkedin" value={member.linkedin_url} />
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <select
                  className="rounded border bg-background px-2 py-1 text-xs"
                  value={member.role}
                  onChange={(e) => changeRole(member.user_id, e.target.value)}
                  disabled={changing === member.user_id}
                >
                  <option value="member">{t("member")}</option>
                  <option value="admin">{t("admin")}</option>
                </select>
              </td>
              <td className="px-4 py-3">
                {member.claim ? (
                  <MemberStatusBadge claim={member.claim} t={t} lang={lang} />
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {new Date(member.joined_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => removeMember(member.user_id)}
                  disabled={changing === member.user_id}
                  className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {t("remove")}
                </button>
              </td>
            </tr>
          ))}
          {members.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                {t("noMembersFound")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function MemberStatusBadge({
  claim,
  t,
  lang,
}: {
  claim: { slug: string; status: string }
  t: (key: string) => string
  lang: string
}) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    approved: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    rejected: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  }

  const labels: Record<string, string> = {
    pending: t("pending"),
    approved: t("approved"),
    rejected: t("rejected"),
  }

  const className = `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[claim.status] || ""}`

  if (claim.status === "approved") {
    return (
      <a
        href={`/${lang}/certificate/${claim.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} hover:underline`}
      >
        {labels[claim.status] || claim.status}
      </a>
    )
  }

  return <span className={className}>{labels[claim.status] || claim.status}</span>
}
