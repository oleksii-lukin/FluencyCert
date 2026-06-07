"use client"

import { useState } from "react"
import { useTranslations } from 'next-intl'
import { HugeiconsIcon } from "@hugeicons/react"
import { CopyLinkIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import posthog from "posthog-js"

export function CopyShareLink({ slug, className }: { slug: string; className?: string }) {
  const t = useTranslations('copyShareLink')
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const url = `${window.location.origin}/certificate/${slug}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    posthog.capture('certificate_share_link_copied', { certificate_slug: slug })
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors",
        className,
      )}
    >
      <HugeiconsIcon icon={CopyLinkIcon} className="size-4" />
      {copied ? t('copied') : t('copy')}
    </button>
  )
}
