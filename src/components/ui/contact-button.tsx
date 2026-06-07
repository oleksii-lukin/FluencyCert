"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Mail01Icon,
  Linkedin01Icon,
  Copy01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ContactButtonProps {
  type: "email" | "telegram" | "linkedin"
  value: string | null
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-3", className)}
      fill="currentColor"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248c-.18 1.158-.96 6.593-1.356 8.75-.166 1.004-.488 1.342-.803 1.374-.684.07-1.203-.453-1.866-.888-1.09-.714-1.705-1.159-2.764-1.856-1.222-.805-.43-1.247.268-1.97.183-.19 3.36-3.083 3.422-3.345.007-.033.014-.158-.06-.224-.073-.066-.182-.043-.26-.026-.112.026-1.892 1.203-5.34 3.535-.505.347-.963.516-1.373.507-.452-.01-1.323-.256-1.97-.467-.793-.259-1.424-.396-1.369-.837.028-.23.345-.466.95-.707 3.744-1.632 6.243-2.708 7.496-3.229 3.57-1.49 4.312-1.748 4.796-1.756.107-.002.346.025.5.15.13.107.166.25.183.354.017.104.038.342.02.528z" />
    </svg>
  )
}

export function ContactButton({ type, value }: ContactButtonProps) {
  const [copied, setCopied] = React.useState(false)

  if (!value) return null

  const icon = (() => {
    switch (type) {
      case "email":
        return <HugeiconsIcon icon={Mail01Icon} />
      case "telegram":
        return <TelegramIcon />
      case "linkedin":
        return <HugeiconsIcon icon={Linkedin01Icon} />
    }
  })()

  const displayValue = (() => {
    switch (type) {
      case "email":
        return value
      case "telegram":
        return `@${value}`
      case "linkedin":
        return value
    }
  })()

  const handleClick = () => {
    switch (type) {
      case "email":
        window.location.href = `mailto:${value}`
        break
      case "telegram":
        window.open(`https://t.me/${value}`, "_blank", "noopener,noreferrer")
        break
      case "linkedin":
        window.open(value, "_blank", "noopener,noreferrer")
        break
    }
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleClick}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className="flex items-center gap-2 px-2 py-1"
        >
          <span className="text-xs max-w-40 truncate">{displayValue}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 transition-all"
            aria-label={copied ? "Copied" : "Copy"}
          >
            <span className={cn(
              "inline-flex transition-all duration-200",
              copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
            )}>
              <HugeiconsIcon icon={Copy01Icon} className="size-3 text-muted-foreground" />
            </span>
            <span className={cn(
              "inline-flex transition-all duration-200",
              copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
            )}>
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3 text-green-500" />
            </span>
          </button>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
