"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"

interface Club {
  id: string
  name: string
  slug: string
  description: string | null
  translations: Record<string, unknown>
}

export function ClubDashboard({
  club,
  lang,
  memberCount,
  adminCount,
  pendingClaims,
  approvedCerts,
}: {
  club: Club
  lang: string
  memberCount: number
  adminCount: number
  pendingClaims: number
  approvedCerts: number
}) {
  const t = useTranslations("admin")

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{club.name}</h1>
          {club.description && (
            <p className="text-muted-foreground mt-1">{club.description}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Link
            href={`/admin/clubs/${club.slug}/settings`}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-muted transition-colors"
          >
            {t("settings")}
          </Link>
          <a
            href={`/${lang}/clubs/${club.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border px-4 py-2 text-sm hover:bg-muted transition-colors"
          >
            {t("viewPublic")}
          </a>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-10">
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">{t("members")}</p>
          <p className="text-3xl font-bold mt-1">{memberCount}</p>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">{t("administrators")}</p>
          <p className="text-3xl font-bold mt-1">{adminCount}</p>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">{t("pendingClaims")}</p>
          <p className="text-3xl font-bold mt-1 text-amber-600">{pendingClaims}</p>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">{t("certificates")}</p>
          <p className="text-3xl font-bold mt-1 text-green-600">{approvedCerts}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href={`/admin/clubs/${club.slug}/members`}
          className="rounded-xl border p-6 hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold mb-1">{t("members")}</h3>
          <p className="text-sm text-muted-foreground">{t("manageMembers")}</p>
        </Link>
        <Link
          href={`/admin/clubs/${club.slug}/claims`}
          className="rounded-xl border p-6 hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold mb-1">{t("claims")}</h3>
          <p className="text-sm text-muted-foreground">{t("manageClaims")}</p>
        </Link>
        <Link
          href={`/admin/clubs/${club.slug}/pdf-templates`}
          className="rounded-xl border p-6 hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold mb-1">{t("pdfTemplates")}</h3>
          <p className="text-sm text-muted-foreground">{t("managePdfTemplates")}</p>
        </Link>
      </div>
    </div>
  )
}
