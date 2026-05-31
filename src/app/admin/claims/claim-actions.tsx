"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function ClaimActions({ claimId }: { claimId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState<'approve' | 'reject' | null>(null)
  const [feedback, setFeedback] = useState("")
  const [englishLevel, setEnglishLevel] = useState("")
  const [speakingClubsCount, setSpeakingClubsCount] = useState("")
  const [hoursParticipated, setHoursParticipated] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(status: 'approved' | 'rejected') {
    setSubmitting(true)
    setError("")

    const body: Record<string, unknown> = { status, admin_feedback: feedback }

    if (status === 'approved') {
      body.english_level = englishLevel.trim()
      body.speaking_clubs_count = parseInt(speakingClubsCount, 10)
      if (hoursParticipated) {
        body.hours_participated = parseInt(hoursParticipated, 10)
      }
    }

    const res = await fetch(`/api/admin/claims/${claimId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Something went wrong')
      setSubmitting(false)
      return
    }

    setOpen(null)
    setFeedback("")
    setEnglishLevel("")
    setSpeakingClubsCount("")
    setHoursParticipated("")
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950"
        onClick={() => setOpen('approve')}
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
        onClick={() => setOpen('reject')}
      >
        Reject
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(null)}>
          <div
            className="w-full max-w-lg rounded-xl border bg-white p-6 shadow-xl dark:bg-graphite"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">
              {open === 'approve' ? 'Approve Claim' : 'Reject Claim'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {open === 'approve'
                ? 'Provide feedback and certificate details.'
                : 'Provide a reason for rejection to the user.'}
            </p>

            <div className="space-y-4">
              {open === 'approve' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">English Level</label>
                    <select
                      className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                      value={englishLevel}
                      onChange={(e) => setEnglishLevel(e.target.value)}
                    >
                      <option value="">Select level...</option>
                      <option value="A1 (Beginner)">A1 (Beginner)</option>
                      <option value="A2 (Elementary)">A2 (Elementary)</option>
                      <option value="B1 (Intermediate)">B1 (Intermediate)</option>
                      <option value="B2 (Upper-Intermediate)">B2 (Upper-Intermediate)</option>
                      <option value="C1 (Advanced)">C1 (Advanced)</option>
                      <option value="C2 (Proficient)">C2 (Proficient)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Speaking Clubs Visited</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                      placeholder="e.g. 12"
                      value={speakingClubsCount}
                      onChange={(e) => setSpeakingClubsCount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Hours Participated (optional)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bright-sky"
                      placeholder="e.g. 48"
                      value={hoursParticipated}
                      onChange={(e) => setHoursParticipated(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Admin Feedback</label>
                <textarea
                  className="w-full rounded-lg border bg-background p-3 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-bright-sky"
                  placeholder={open === 'approve' ? 'e.g. Congratulations on completing your speaking certificate!' : 'e.g. Additional verification required...'}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}

            <div className="mt-4 flex justify-end gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setOpen(null); setError("") }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={
                  !feedback.trim() ||
                  submitting ||
                  (open === 'approve' && (!englishLevel || !speakingClubsCount))
                }
                onClick={() => handleSubmit(open === 'approve' ? 'approved' : 'rejected')}
                className={open === 'approve'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
                }
              >
                {submitting ? 'Processing...' : open === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
