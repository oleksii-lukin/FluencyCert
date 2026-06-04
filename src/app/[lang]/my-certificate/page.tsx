import { getTranslations } from 'next-intl/server'
import { Link, redirect } from '@/i18n/routing'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { HugeiconsIcon } from "@hugeicons/react"
import { Certificate02Icon, Clock01Icon, CheckmarkCircle02Icon, Cancel01Icon, ArrowLeft02Icon, Settings02Icon, Share01Icon, ClubIcon } from "@hugeicons/core-free-icons"

export default async function MyCertificatePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const { userId } = await auth()
  if (!userId) redirect({ href: '/', locale: lang })

  const supabase = createAdminClient()
  const t = await getTranslations('myCertificate')

  const { data: claims } = await supabase
    .from('certificate_claims')
    .select('*, speaking_clubs(name)')
    .eq('user_id', userId!)
    .order('created_at', { ascending: false })

  if (!claims || claims.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-bright-sky/10 via-white to-white p-4 dark:from-bright-sky/5 dark:via-graphite dark:to-graphite">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
            {t('backToHome')}
          </Link>
          <div className="rounded-2xl border bg-white p-8 shadow-lg dark:bg-graphite/80">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-bright-sky/15">
                <HugeiconsIcon icon={Certificate02Icon} className="size-7 text-bright-sky" />
              </div>
              <h1 className="text-2xl font-bold text-graphite dark:text-snow">{t('title')}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t('noClaimDesc')}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bright-sky/10 via-white to-white p-4 dark:from-bright-sky/5 dark:via-graphite dark:to-graphite">
      <div className="mx-auto max-w-2xl py-8">
        <Link href="/" className="mb-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
          {t('backToHome')}
        </Link>

        <div className="space-y-6">
          {claims.map((claim) => {
            const clubName = claim.speaking_clubs?.name || null
            return (
              <div key={claim.id} className="rounded-2xl border bg-white p-8 shadow-lg dark:bg-graphite/80">
                <div className="flex flex-col items-center text-center">
                  <StatusIcon status={claim.status} />

                  {clubName && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <HugeiconsIcon icon={ClubIcon} className="size-4" />
                      {clubName}
                    </div>
                  )}

                  <StatusContent claim={claim} t={t} lang={lang} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'pending') {
    return (
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
        <HugeiconsIcon icon={Clock01Icon} className="size-7 text-amber-600 dark:text-amber-400" />
      </div>
    )
  }
  if (status === 'approved') {
    return (
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/30">
        <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-7 text-green-600 dark:text-green-400" />
      </div>
    )
  }
  return (
    <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
      <HugeiconsIcon icon={Cancel01Icon} className="size-7 text-red-600 dark:text-red-400" />
    </div>
  )
}

type ClaimData = {
  status: string
  slug?: string | null
  admin_feedback?: string | null
  created_at: string
}

function StatusContent({ claim, t }: { claim: ClaimData; t: (key: string, opts?: Record<string, unknown>) => string }) {
  if (claim.status === 'pending') {
    return (
      <>
        <h2 className="text-2xl font-bold text-graphite dark:text-snow">{t('pendingTitle')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t('pendingDesc')}</p>
        <p className="mt-4 text-xs text-muted-foreground">
          {t('submittedOn', { date: new Date(claim.created_at).toLocaleDateString() })}
        </p>
      </>
    )
  }

  if (claim.status === 'approved') {
    return (
      <>
        <h2 className="text-2xl font-bold text-graphite dark:text-snow">{t('approvedTitle')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t('approvedDesc')}</p>
        {claim.admin_feedback && (
          <div className="mt-4 w-full rounded-xl bg-muted p-4 text-left">
            <p className="text-xs font-medium text-muted-foreground mb-1">{t('adminFeedback')}</p>
            <p className="text-sm text-foreground">{claim.admin_feedback}</p>
          </div>
        )}
        <div className="mt-6 flex w-full flex-col gap-3">
          <Link
            href={`/certificate/${claim.slug}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-bright-sky px-4 py-2.5 text-sm font-medium text-white hover:bg-bright-sky/90 transition-colors"
          >
            <HugeiconsIcon icon={Share01Icon} className="size-4" />
            {t('viewCertificate')}
          </Link>
          <Link
            href="/my-certificate/control"
            className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            <HugeiconsIcon icon={Settings02Icon} className="size-4" />
            {t('controlPanel')}
          </Link>
        </div>
      </>
    )
  }

  if (claim.status === 'rejected') {
    return (
      <>
        <h2 className="text-2xl font-bold text-graphite dark:text-snow">{t('rejectedTitle')}</h2>
        {claim.admin_feedback && (
          <div className="mt-6 w-full rounded-xl bg-muted p-4 text-left">
            <p className="text-xs font-medium text-muted-foreground mb-1">{t('reason')}</p>
            <p className="text-sm text-foreground">{claim.admin_feedback}</p>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">{t('contactSupport')}</p>
      </>
    )
  }

  return null
}
