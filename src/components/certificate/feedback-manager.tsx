"use client"

import { useState } from "react"
import { useTranslations } from 'next-intl'
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface FeedbackItem {
  id: string
  feedback_text: string
  display_name_preference: string
  linkedin_url: string | null
  status: string
  sort_order: number
  is_visible: boolean
  created_at: string
  profiles: {
    id: string
    first_name: string | null
    last_name: string | null
    username: string | null
    avatar_url: string | null
  }
}

interface FeedbackManagerProps {
  certificateId: string
  initialFeedbacks: FeedbackItem[]
}

function getDisplayName(profile: FeedbackItem["profiles"], preference: string, anonymousLabel: string): string {
  if (preference === "full_name") {
    return [profile.first_name, profile.last_name].filter(Boolean).join(" ") || anonymousLabel
  }
  return profile.username || profile.first_name || anonymousLabel
}

export function FeedbackManager({ certificateId, initialFeedbacks }: FeedbackManagerProps) {
  const t = useTranslations('feedback')
  const anonymousLabel = t('anonymous')
  const router = useRouter()
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks)
  const [loading, setLoading] = useState<string | null>(null)

  async function updateFeedback(feedbackId: string, updates: Record<string, unknown>) {
    setLoading(feedbackId)
    const res = await fetch(
      `/api/certificates/${certificateId}/feedback/${feedbackId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      },
    )

    if (res.ok) {
      setFeedbacks((prev) =>
        prev.map((f) =>
          f.id === feedbackId ? { ...f, ...updates } as FeedbackItem : f,
        ),
      )
      router.refresh()
    }
    setLoading(null)
  }

  async function moveFeedback(feedbackId: string, direction: "up" | "down") {
    const idx = feedbacks.findIndex((f) => f.id === feedbackId)
    if (idx === -1) return
    const newIdx = direction === "up" ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= feedbacks.length) return

    const newOrder = [...feedbacks]
    ;[newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]]

    setFeedbacks(newOrder)

    await fetch(`/api/certificates/${certificateId}/feedback/sort`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: newOrder.map((f) => f.id) }),
    })

    router.refresh()
  }

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }

  return (
    <div>
      {feedbacks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {t('noFeedback')}
        </p>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((feedback, idx) => (
            <div
              key={feedback.id}
              className="flex items-start gap-4 rounded-lg border bg-white p-4 dark:bg-gray-800"
            >
              <div className="flex flex-col gap-1 pt-1">
                <button
                  onClick={() => moveFeedback(feedback.id, "up")}
                  disabled={idx === 0}
                  className="text-xs text-muted-foreground disabled:opacity-30 hover:text-bright-sky"
                >
                  ▲
                </button>
                <span className="text-center text-xs text-muted-foreground">{idx + 1}</span>
                <button
                  onClick={() => moveFeedback(feedback.id, "down")}
                  disabled={idx === feedbacks.length - 1}
                  className="text-xs text-muted-foreground disabled:opacity-30 hover:text-bright-sky"
                >
                  ▼
                </button>
              </div>

              {feedback.profiles.avatar_url ? (
                <Image
                  src={feedback.profiles.avatar_url}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 shrink-0 rounded-full"
                />
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bright-sky/15 text-xs font-bold text-bright-sky">
                  {getDisplayName(feedback.profiles, feedback.display_name_preference, anonymousLabel)[0].toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-graphite dark:text-snow">
                    {getDisplayName(feedback.profiles, feedback.display_name_preference, anonymousLabel)}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[feedback.status] || ""}`}>
                    {t(feedback.status)}
                  </span>
                  {feedback.is_visible && (
                    <span className="inline-flex items-center rounded-full bg-bright-sky/10 px-2 py-0.5 text-[10px] font-semibold text-bright-sky">
                      {t('visible')}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {feedback.feedback_text}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(feedback.created_at).toLocaleDateString()}
                  {feedback.linkedin_url && ` · ${t('linkedinAttached')}`}
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-1">
                {feedback.status !== "approved" && (
                  <Button
                    size="xs"
                    variant="outline"
                    className="border-green-300 text-green-700 text-xs hover:bg-green-50 dark:border-green-800 dark:text-green-400"
                    disabled={loading === feedback.id}
                    onClick={() =>
                      updateFeedback(feedback.id, {
                        status: "approved",
                        is_visible: true,
                      })
                    }
                  >
                    {t('accept')}
                  </Button>
                )}
                {feedback.status !== "rejected" && (
                  <Button
                    size="xs"
                    variant="outline"
                    className="border-red-300 text-red-700 text-xs hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                    disabled={loading === feedback.id}
                    onClick={() =>
                      updateFeedback(feedback.id, {
                        status: "rejected",
                        is_visible: false,
                      })
                    }
                  >
                    {t('decline')}
                  </Button>
                )}
                {feedback.status === "approved" && (
                  <Button
                    size="xs"
                    variant="outline"
                    className="text-xs"
                    disabled={loading === feedback.id}
                    onClick={() =>
                      updateFeedback(feedback.id, {
                        is_visible: !feedback.is_visible,
                      })
                    }
                  >
                    {feedback.is_visible ? t('hide') : t('show')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
