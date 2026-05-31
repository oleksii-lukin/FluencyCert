"use client"

import { useRef, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Linkedin01Icon } from "@hugeicons/core-free-icons"

interface FeedbackWithReviewer {
  id: string
  feedback_text: string
  display_name_preference: string
  status: string
  sort_order: number
  is_visible: boolean
  created_at: string
  certificate_id: string
  linkedin_url: string | null
  reviewer_certificate_id: string | null
  profiles: {
    id: string
    first_name: string | null
    last_name: string | null
    username: string | null
    avatar_url: string | null
  }
}

interface TestimonialsMarqueeProps {
  feedbacks: FeedbackWithReviewer[]
}

function getDisplayName(
  profile: FeedbackWithReviewer["profiles"],
  preference: string,
): string {
  if (preference === "full_name") {
    return [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Anonymous"
  }
  return profile.username || profile.first_name || "Anonymous"
}

function FeedbackCard({ feedback }: { feedback: FeedbackWithReviewer }) {
  return (
    <div className="mx-3 inline-flex shrink-0 items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800" style={{ width: "280px" }}>
      <Link href={`/certificate/${feedback.reviewer_certificate_id || feedback.profiles.id}`} className="shrink-0">
        {feedback.profiles.avatar_url ? (
          <Image
            src={feedback.profiles.avatar_url}
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-full"
          />
        ) : (
          <div className="flex size-9 items-center justify-center rounded-full bg-bright-sky/15 text-xs font-bold text-bright-sky">
            {getDisplayName(feedback.profiles, feedback.display_name_preference)[0].toUpperCase()}
          </div>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/certificate/${feedback.reviewer_certificate_id || feedback.profiles.id}`}
            className="text-sm font-semibold text-graphite hover:text-bright-sky dark:text-snow dark:hover:text-bright-sky truncate"
          >
            {getDisplayName(feedback.profiles, feedback.display_name_preference)}
          </Link>
          {feedback.linkedin_url && (
            <a
              href={feedback.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-gray-400 hover:text-bright-sky"
            >
              <HugeiconsIcon icon={Linkedin01Icon} className="size-3.5" />
            </a>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-3 whitespace-normal">
          {feedback.feedback_text}
        </p>
      </div>
    </div>
  )
}

function MarqueeRow({ items, speed }: { items: FeedbackWithReviewer[]; speed: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [overflows, setOverflows] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    const track = contentRef.current
    if (!el || !track) return

    function check() {
      setOverflows(track!.scrollWidth > el!.clientWidth)
    }

    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    ro.observe(track)
    return () => ro.disconnect()
  }, [items])

  return (
    <div ref={containerRef} className="overflow-hidden">
      <div
        ref={contentRef}
        className={`flex ${overflows ? "marquee-track" : ""}`}
        style={{ "--marquee-speed": `${speed}s` } as React.CSSProperties}
      >
        {items.map((item) => (
          <FeedbackCard key={item.id} feedback={item} />
        ))}
        {overflows && items.map((item) => (
          <FeedbackCard key={`dup-${item.id}`} feedback={item} />
        ))}
      </div>
    </div>
  )
}

export function TestimonialsMarquee({ feedbacks }: TestimonialsMarqueeProps) {
  const visible = feedbacks.filter((f) => f.is_visible && f.status === "approved")

  if (visible.length === 0) return null

  let rowCount: number
  if (visible.length <= 10) {
    rowCount = 1
  } else if (visible.length <= 20) {
    rowCount = 2
  } else {
    rowCount = 3
  }

  const rows: FeedbackWithReviewer[][] = []
  const chunkSize = Math.ceil(visible.length / rowCount)
  for (let r = 0; r < rowCount; r++) {
    const start = r * chunkSize
    const end = Math.min(start + chunkSize, visible.length)
    if (start < visible.length) {
      rows.push(visible.slice(start, end))
    }
  }

  const speeds = [30, 15, 20]

  return (
    <div className="w-full overflow-hidden py-4">
      <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        Testimonials
      </p>
      <div className="flex flex-col gap-3">
        {rows.map((row, i) => (
          <MarqueeRow key={i} items={row} speed={speeds[i % speeds.length]} />
        ))}
      </div>
    </div>
  )
}
