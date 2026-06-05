"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from 'next-intl'
import { Link } from "@/i18n/routing"
import { useUser } from "@clerk/nextjs"
import { SignInButton } from "@clerk/nextjs"
import type { CertificateClaim } from "@/types/certificate-claim"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight02Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import posthog from "posthog-js"

type ClaimButtonProps = {
  label: string
  icon?: React.ReactNode
  className?: string
}

export function ClaimCertificateButton({ label, icon, className }: ClaimButtonProps) {
  const t = useTranslations('claimButton')
  const { isSignedIn, isLoaded } = useUser()
  const [claim, setClaim] = useState<CertificateClaim | null | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    fetch("/api/claims")
      .then((res) => res.json())
      .then((data) => data.claim ? setClaim(data.claim) : setClaim(null))
      .catch(() => setClaim(null))
  }, [isLoaded, isSignedIn])

  const handleClaim = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/claims", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setClaim(data.claim)
        posthog.capture('certificate_claim_submitted', { source: 'landing_page' })
      }
    } catch (err) {
      posthog.captureException(err)
    } finally {
      setLoading(false)
    }
  }, [])

  if (!isLoaded) {
    return (
      <Button disabled className={className}>
        {icon}{label}
      </Button>
    )
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button className={className}>
          {icon}{label}
          <HugeiconsIcon icon={ArrowRight02Icon} className="ml-1.5 size-4" />
        </Button>
      </SignInButton>
    )
  }

  const pendingClaim = claim?.status === "pending"
  const resolvedClaim = claim && (claim.status === "approved" || claim.status === "rejected")

  if (pendingClaim || resolvedClaim) {
    return (
      <Link href="/my-certificate">
        <Button className={className}>
          <HugeiconsIcon icon={Clock01Icon} className="mr-1.5 size-4" />
          {t('reviewStatus')}
        </Button>
      </Link>
    )
  }

  return (
    <Button onClick={handleClaim} disabled={loading} className={className}>
      {icon}{label}
      <HugeiconsIcon icon={ArrowRight02Icon} className="ml-1.5 size-4" />
    </Button>
  )
}
