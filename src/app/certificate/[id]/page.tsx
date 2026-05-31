import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CertificateRenderer } from '@/components/certificate/certificate-renderer'
import { UpvoteRosette } from '@/components/certificate/upvote-rosette'
import { TestimonialsMarquee } from '@/components/certificate/testimonials-marquee'
import { FeedbackForm } from '@/components/certificate/feedback-form'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import '@/components/certificate/guilloche-pattern.css'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data: claim } = await supabase
    .from('certificate_claims')
    .select('*, profiles!inner(first_name, last_name)')
    .eq('id', id)
    .single()

  if (!claim || claim.status !== 'approved') {
    return { title: 'Certificate Not Found - FluencyCert' }
  }

  const name = [claim.profiles.first_name, claim.profiles.last_name].filter(Boolean).join(' ') || 'Certificate'
  return {
    title: `${name} - FluencyCert Certificate`,
    description: `View ${name}'s English proficiency certificate on FluencyCert.`,
  }
}

export default async function CertificatePage({ params }: PageProps) {
  const { id } = await params
  const { userId } = await auth()
  const supabase = createAdminClient()

  const { data: claim } = await supabase
    .from('certificate_claims')
    .select('*, profiles!inner(id, email, first_name, last_name, username, avatar_url)')
    .eq('id', id)
    .single()

  if (!claim || claim.status !== 'approved') {
    notFound()
  }

  const profile = claim.profiles

  const { count: dbCount } = await supabase
    .from('certificate_upvotes')
    .select('id', { count: 'exact', head: true })
    .eq('certificate_id', id)

  const upvoteCount = dbCount ?? 0

  const { data: feedbacks } = await supabase
    .from('certificate_feedback')
    .select('*, profiles!inner(id, first_name, last_name, username, avatar_url)')
    .eq('certificate_id', id)
    .eq('is_visible', true)
    .eq('status', 'approved')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  let feedbacksWithCertIds: Array<Record<string, unknown>> | null = null
  if (feedbacks && feedbacks.length > 0) {
    const reviewerIds = [...new Set(feedbacks.map((f) => f.reviewer_id))]
    const { data: reviewerClaims } = await supabase
      .from('certificate_claims')
      .select('user_id, id')
      .eq('status', 'approved')
      .in('user_id', reviewerIds)

    const certByUserId = new Map((reviewerClaims ?? []).map((c) => [c.user_id, c.id]))
    feedbacksWithCertIds = feedbacks.map((f) => ({
      ...f,
      reviewer_certificate_id: certByUserId.get(f.reviewer_id) || null,
    }))
  }

  let hasUpvoted = false
  let canUpvote = false
  let canLeaveFeedback = false

  if (userId) {
    const { data: ownClaim } = await supabase
      .from('certificate_claims')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .maybeSingle()

    if (ownClaim && ownClaim.id !== id) {
      canUpvote = true
      canLeaveFeedback = true

      const { data: existingFeedback } = await supabase
        .from('certificate_feedback')
        .select('id')
        .eq('certificate_id', id)
        .eq('reviewer_id', userId)
        .maybeSingle()

      if (existingFeedback) {
        canLeaveFeedback = false
      }
    }

    const { data: existingUpvote } = await supabase
      .from('certificate_upvotes')
      .select('id')
      .eq('certificate_id', id)
      .eq('user_id', userId)
      .maybeSingle()

    hasUpvoted = !!existingUpvote
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Certificate Holder'

  return (
    <div className="min-h-screen bg-gradient-to-b from-bright-sky/5 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
          Back to FluencyCert
        </Link>

        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-start">
          <div className="flex-1">
            <CertificateRenderer
              templateId={claim.background_template || 'guilloche-security'}
              fullName={fullName}
              englishLevel={claim.english_level || 'Not specified'}
              speakingClubsCount={claim.speaking_clubs_count ?? 0}
              hoursParticipated={claim.hours_participated}
              adminFeedback={claim.admin_feedback}
              createdAt={claim.created_at}
              claimId={claim.id}
            />
          </div>

          <div className="flex shrink-0 justify-center lg:pt-12 lg:self-start">
            <UpvoteRosette
              certificateId={claim.id}
              initialCount={upvoteCount}
              initialHasUpvoted={hasUpvoted}
              canUpvote={canUpvote}
            />
          </div>
        </div>

        <TestimonialsMarquee feedbacks={(feedbacksWithCertIds ?? feedbacks ?? []) as any} />

        {canLeaveFeedback && (
          <div className="mx-auto mt-6 max-w-xl">
            <FeedbackForm certificateId={claim.id} />
          </div>
        )}

        <div className="mt-12 border-t border-gray-100 py-6 text-center text-xs text-muted-foreground dark:border-gray-800">
          <p>FluencyCert — Verified English Speaking Certificates</p>
        </div>
      </div>
    </div>
  )
}
