"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { SignInButton, useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export function ClubJoinButton({
  slug,
  isMember,
  isAdmin,
  lang,
}: {
  slug: string
  isMember: boolean
  isAdmin: boolean
  lang: string
}) {
  const t = useTranslations("clubs")
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [joining, setJoining] = useState(false)

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button>{t("signInToJoin")}</Button>
      </SignInButton>
    )
  }

  if (isMember) {
    return (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-primary/10 text-primary border-primary/20">
          {t("joined")}
        </span>
        {isAdmin && (
          <a
            href={`/${lang}/admin/clubs/${slug}`}
            className="text-sm text-bright-sky hover:underline"
          >
            {t("manageClub")}
          </a>
        )}
      </div>
    )
  }

  async function handleJoin() {
    setJoining(true)
    try {
      await fetch(`/api/clubs/${slug}/join`, { method: "POST" })
      router.refresh()
    } catch {
      // ignore
    }
    setJoining(false)
  }

  return (
    <Button onClick={handleJoin} disabled={joining}>
      {joining ? "..." : t("join")}
    </Button>
  )
}
