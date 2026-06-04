"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

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
        setError(data.error || "Something went wrong")
        setClaiming(false)
        return
      }

      router.push(`/${lang}/my-certificate`)
    } catch {
      setError("Something went wrong")
    }
    setClaiming(false)
  }

  return (
    <div className="mt-4">
      <Button onClick={handleClaim} disabled={claiming} className="bg-bright-sky text-white">
        {claiming ? "..." : t("claimCertificate")}
      </Button>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  )
}
