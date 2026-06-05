"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import posthog from "posthog-js"

export function ClubClaimButton({ clubId, lang }: { clubId: string; lang: string }) {
  const t = useTranslations("clubs")
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState("")

  if (!isSignedIn) return null

  async function handleClaim() {
    setClaiming(true)
    setError("")

    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ club_id: clubId }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.error === 'Already have a pending claim for this club') {
          setError(t('alreadyPendingClaim'))
        } else {
          setError(data.error || t('claimError'))
        }
        setClaiming(false)
        return
      }

      posthog.capture('club_certificate_claim_submitted', { club_id: clubId })
      router.push(`/${lang}/my-certificate`)
    } catch (err) {
      posthog.captureException(err)
      setError(t('claimError'))
    }
    setClaiming(false)
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
        <Button onClick={handleClaim} disabled={claiming} className="bg-bright-sky text-white">
          {claiming ? "..." : t("claimCertificate")}
        </Button>
        <Link href={`/my-certificate`} className="text-sm text-bright-sky hover:underline">
          {t("viewMyCertificate")}
        </Link>
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  )
}
