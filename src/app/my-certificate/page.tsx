import Link from "next/link"
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { HugeiconsIcon } from "@hugeicons/react"
import { Certificate02Icon, Clock01Icon, CheckmarkCircle02Icon, Cancel01Icon, ArrowLeft02Icon, Settings02Icon, Share01Icon } from "@hugeicons/core-free-icons"

export default async function MyCertificatePage() {
  const { userId } = await auth()
  if (!userId) redirect('/')

  const supabase = createAdminClient()

  const { data: claim } = await supabase
    .from('certificate_claims')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-bright-sky/10 via-white to-white p-4 dark:from-bright-sky/5 dark:via-graphite dark:to-graphite">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
          Back to home
        </Link>

        <div className="rounded-2xl border bg-white p-8 shadow-lg dark:bg-graphite/80">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-bright-sky/15">
              <HugeiconsIcon icon={Certificate02Icon} className="size-7 text-bright-sky" />
            </div>

            {!claim && (
              <>
                <h1 className="text-2xl font-bold text-graphite dark:text-snow">No Certificate Claim Yet</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  You haven&apos;t requested a certificate claim. Go back to the home page to get started.
                </p>
              </>
            )}

            {claim?.status === 'pending' && (
              <>
                <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
                  <HugeiconsIcon icon={Clock01Icon} className="size-7 text-amber-600 dark:text-amber-400" />
                </div>
                <h1 className="text-2xl font-bold text-graphite dark:text-snow">Claim Pending</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your certificate claim has been submitted and is awaiting review by an admin. You&apos;ll be notified once a decision is made.
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  Submitted on {new Date(claim.created_at).toLocaleDateString()}
                </p>
              </>
            )}

            {claim?.status === 'approved' && (
              <>
                <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/30">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-7 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-graphite dark:text-snow">Claim Approved!</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your certificate is live and ready to share.
                </p>
                {claim.admin_feedback && (
                  <div className="mt-4 w-full rounded-xl bg-muted p-4 text-left">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Admin Feedback</p>
                    <p className="text-sm text-foreground">{claim.admin_feedback}</p>
                  </div>
                )}
                <div className="mt-6 flex w-full flex-col gap-3">
                  <Link
                    href={`/certificate/${claim.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-bright-sky px-4 py-2.5 text-sm font-medium text-white hover:bg-bright-sky/90 transition-colors"
                  >
                    <HugeiconsIcon icon={Share01Icon} className="size-4" />
                    View Public Certificate
                  </Link>
                  <Link
                    href="/my-certificate/control"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <HugeiconsIcon icon={Settings02Icon} className="size-4" />
                    Control Panel & Feedback
                  </Link>
                </div>
              </>
            )}

            {claim?.status === 'rejected' && (
              <>
                <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
                  <HugeiconsIcon icon={Cancel01Icon} className="size-7 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-graphite dark:text-snow">Claim Not Approved</h1>
                {claim.admin_feedback && (
                  <div className="mt-6 w-full rounded-xl bg-muted p-4 text-left">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Reason</p>
                    <p className="text-sm text-foreground">{claim.admin_feedback}</p>
                  </div>
                )}
                <p className="mt-4 text-xs text-muted-foreground">
                  If you have questions, please reach out to support.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
