"use client"

import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import { Link } from "@/i18n/routing"

export function AdminHeader({
  lang,
  isMasterAdmin,
  adminClubs,
}: {
  lang: string
  isMasterAdmin: boolean
  adminClubs: { id: string; name: string; slug: string }[]
}) {
  const t = useTranslations("sidebar")
  const pathname = usePathname()

  const currentClubSlug = pathname.match(/\/admin\/clubs\/([^/]+)/)?.[1]
  const currentClub = adminClubs.find((c) => c.slug === currentClubSlug || c.id === currentClubSlug)

  return (
    <header className="flex items-center justify-between border-b bg-background px-6 py-3">
      <div className="flex items-center gap-4">
        {!isMasterAdmin && adminClubs.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("myClubs")}:</span>
            <select
              className="rounded-lg border bg-background px-3 py-1.5 text-sm font-medium"
              value={currentClub?.slug ?? ""}
              onChange={(e) => {
                const val = e.target.value
                if (val) {
                  window.location.href = `/${lang}/admin/clubs/${val}`
                }
              }}
            >
              {adminClubs.map((club) => (
                <option key={club.id} value={club.slug}>
                  {club.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {currentClub && (
          <a
            href={`/${lang}/clubs/${currentClub.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-bright-sky transition-colors"
          >
            {t("viewPublic")}
          </a>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("backToSite")}
        </Link>
        <UserButton />
      </div>
    </header>
  )
}
