"use client"

import { useState } from "react"
import { useTranslations } from 'next-intl'
import { HugeiconsIcon } from "@hugeicons/react"
import { ThumbsUpIcon } from "@hugeicons/core-free-icons"

interface UpvoteRosetteProps {
  slug: string
  initialCount: number
  initialHasUpvoted: boolean
  canUpvote: boolean
}

export function UpvoteRosette({
  slug,
  initialCount,
  initialHasUpvoted,
  canUpvote,
}: UpvoteRosetteProps) {
  const t = useTranslations('upvote')
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted)
  const [count, setCount] = useState(initialCount)
  const [animating, setAnimating] = useState(false)

  async function handleToggle() {
    if (!canUpvote) return

    const prevUpvoted = hasUpvoted
    const prevCount = count

    setHasUpvoted(!hasUpvoted)
    setCount((c) => (prevUpvoted ? c - 1 : c + 1))
    setAnimating(true)
    setTimeout(() => setAnimating(false), 300)

    const res = await fetch(`/api/certificates/${slug}/upvote`, {
      method: "POST",
    })

    if (!res.ok) {
      setHasUpvoted(prevUpvoted)
      setCount(prevCount)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleToggle}
        disabled={!canUpvote}
        className={`relative flex size-24 items-center justify-center transition-transform duration-300 ${
          canUpvote ? "cursor-pointer hover:scale-105" : "cursor-default"
        } ${animating ? "scale-110" : ""}`}
      >
        <svg viewBox="0 0 120 120" className="absolute inset-0 size-full">
          <defs>
            <clipPath id="rosette-clip">
              <circle cx="60" cy="60" r="58" />
            </clipPath>
          </defs>
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 360) / 24
            const isAccent = i % 2 === 0
            return (
              <polygon
                key={i}
                points={`60,4 64,58 60,116 56,58`}
                fill={isAccent ? "rgba(61, 183, 230, 0.12)" : "rgba(61, 183, 230, 0.06)"}
                transform={`rotate(${angle} 60 60)`}
                clipPath="url(#rosette-clip)"
              />
            )
          })}
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="rgba(61, 183, 230, 0.2)"
            strokeWidth="1.5"
          />
          <circle
            cx="60"
            cy="60"
            r="44"
            fill="none"
            stroke="rgba(61, 183, 230, 0.15)"
            strokeWidth="1"
          />
          <circle cx="60" cy="60" r="36" fill="white" className="dark:fill-gray-900" />
        </svg>
        <div className="relative z-10 flex flex-col items-center">
          <HugeiconsIcon
            icon={ThumbsUpIcon}
            className={`size-7 ${
              hasUpvoted
                ? "text-bright-sky"
                : "text-gray-400 dark:text-gray-500"
            }`}
          />
          <span className="mt-0.5 text-lg font-bold text-graphite dark:text-snow">
            {count}
          </span>
        </div>
      </button>
      <p className="text-xs text-muted-foreground text-center max-w-24 leading-tight">
        {canUpvote
          ? hasUpvoted
            ? t('youUpvoted')
            : t('showSupport')
          : t('communityUpvotes')}
      </p>
    </div>
  )
}
