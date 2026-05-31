"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CopyLinkIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

export function CopyShareLink({ certificateId, className }: { certificateId: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const url = `${window.location.origin}/certificate/${certificateId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors",
        className,
      )}
    >
      <HugeiconsIcon icon={CopyLinkIcon} className="size-4" />
      {copied ? "Copied!" : "Copy Share Link"}
    </button>
  )
}
