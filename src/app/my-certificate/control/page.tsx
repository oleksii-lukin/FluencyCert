import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { FeedbackManager } from '@/components/certificate/feedback-manager'
import { CopyShareLink } from '@/components/certificate/copy-share-link'
import { TemplateSelector } from '@/components/certificate/template-selector'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft02Icon, Share01Icon, Certificate02Icon, LayoutGridIcon } from '@hugeicons/core-free-icons'

export default async function CertificateControlPage() {
  const { userId } = await auth()
  if (!userId) redirect('/')

  const supabase = createAdminClient()

  const { data: claim } = await supabase
    .from('certificate_claims')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!claim) {
    redirect('/my-certificate')
  }

  const { data: feedbacks } = await supabase
    .from('certificate_feedback')
    .select('*, profiles!inner(id, first_name, last_name, username, avatar_url)')
    .eq('certificate_id', claim.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-b from-bright-sky/5 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/my-certificate"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
          Back to My Certificate
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-graphite dark:text-snow">Certificate Control Panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your certificate settings and community feedback.
          </p>
        </div>

        <div className="mb-8 rounded-xl border bg-white p-6 dark:bg-gray-800">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-graphite dark:text-snow mb-2">
            <HugeiconsIcon icon={Certificate02Icon} className="size-5 text-bright-sky" />
            Your Certificate
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Level: {claim.english_level || 'N/A'} · Clubs: {claim.speaking_clubs_count ?? 0}
            {claim.hours_participated != null && ` · Hours: ${claim.hours_participated}`}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/certificate/${claim.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-bright-sky px-4 py-2 text-sm font-medium text-white hover:bg-bright-sky/90 transition-colors"
            >
              <HugeiconsIcon icon={Share01Icon} className="size-4" />
              View Public Page
            </Link>
            <CopyShareLink certificateId={claim.id} />
          </div>
        </div>

        <div className="mb-8 rounded-xl border bg-white p-6 dark:bg-gray-800">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-graphite dark:text-snow mb-2">
            <HugeiconsIcon icon={LayoutGridIcon} className="size-5 text-bright-sky" />
            Certificate Template
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Choose how your certificate looks. Changes are instantly reflected on your public page.
          </p>
          <TemplateSelector
            currentTemplateId={claim.background_template || 'guilloche-security'}
            claimId={claim.id}
          />
        </div>

        <div className="rounded-xl border bg-white p-6 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-graphite dark:text-snow mb-4">
            Feedback Management
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Review feedback from other users. Accept feedback to show it on your public certificate page, or decline it.
            Drag the ▲▼ buttons to reorder how they appear.
          </p>
          <FeedbackManager
            certificateId={claim.id}
            initialFeedbacks={feedbacks ?? []}
          />
        </div>
      </div>
    </div>
  )
}
