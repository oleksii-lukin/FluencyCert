import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link, redirect } from '@/i18n/routing'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { HugeiconsIcon } from "@hugeicons/react"
import { Certificate02Icon, Settings02Icon, Share01Icon, Clock01Icon, CheckmarkCircle02Icon, Cancel01Icon, ClubIcon } from "@hugeicons/core-free-icons"
import { PublicPageLayout } from "@/components/layout/public-page-layout"
import { TelegramConnect } from "@/components/telegram/telegram-connect"
import { LinkedInConnect } from "@/components/linkedin/linkedin-connect"

const FLAG_LINKEDIN_CONNECT = process.env.FLAG_LINKEDIN_CONNECT === 'true'

export const metadata: Metadata = {
  title: 'Profile | FluencyCert',
  description: 'Manage your profile and view your certificates',
}

export default async function ProfilePage({ params }: { params: Promise<{ lang: string }> }) {
  const [{ lang }, { userId }, t] = await Promise.all([params, auth(), getTranslations('profile')])
  if (!userId) redirect({ href: '/', locale: lang })

  const supabase = createAdminClient()

  const [{ data: profile }, { data: claims }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId!)
      .single(),
    supabase
      .from('certificate_claims')
      .select('*, speaking_clubs(name)')
      .eq('user_id', userId!)
      .order('created_at', { ascending: false }),
  ])

  return (
    <PublicPageLayout>
      <div className="mx-auto max-w-2xl px-4 pt-28 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-graphite dark:text-snow">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="mb-8 rounded-xl border bg-white/50 p-6 shadow-lg dark:bg-graphite/50">
          <h2 className="text-lg font-semibold text-graphite dark:text-snow mb-4">
            {t('profileInfo')}
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">{t('name')}</p>
              <p className="text-sm text-graphite dark:text-snow">
                {[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('email')}</p>
              <p className="text-sm text-graphite dark:text-snow">
                {profile?.email || '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-xl border bg-white/50 p-6 shadow-lg dark:bg-graphite/50">
          <h2 className="text-lg font-semibold text-graphite dark:text-snow mb-4">
            {t('connectedAccounts')}
          </h2>
          <TelegramConnect
            initialTelegramId={profile?.telegram_id ?? null}
            initialTelegramUsername={profile?.telegram_username ?? null}
          />
          <div className="mt-3">
            <LinkedInConnect
              initialLinkedInUrl={profile?.linkedin_url ?? null}
              initialLinkedInProfileData={profile?.linkedin_profile_data as { name?: string; email?: string; picture?: string; profileUrl?: string } | null ?? null}
              oauthEnabled={FLAG_LINKEDIN_CONNECT}
            />
          </div>
        </div>

        <div className="rounded-xl border bg-white/50 p-6 shadow-lg dark:bg-graphite/50">
          <h2 className="text-lg font-semibold text-graphite dark:text-snow mb-4">
            {t('myCertificates')}
          </h2>
          {!claims || claims.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noCertificates')}</p>
          ) : (
            <div className="space-y-3">
              {claims.map((claim) => {
                const clubName = claim.speaking_clubs?.name || null
                return (
                  <div key={claim.id} className="flex items-center justify-between rounded-lg border bg-white/50 p-4 dark:bg-graphite/50">
                    <div className="flex items-center gap-3">
                      <StatusDot status={claim.status} />
                      <div>
                        <p className="text-sm font-medium text-graphite dark:text-snow">
                          {clubName || t('certificate')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(claim.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {claim.status === 'approved' && claim.slug && (
                        <>
                          <Link
                            href={`/certificate/${claim.slug}`}
                            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                          >
                            <HugeiconsIcon icon={Share01Icon} className="size-3.5" />
                            {t('view')}
                          </Link>
                          <Link
                            href="/my-certificate/control"
                            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                          >
                            <HugeiconsIcon icon={Settings02Icon} className="size-3.5" />
                            {t('control')}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PublicPageLayout>
  )
}

function StatusDot({ status }: { status: string }) {
  if (status === 'pending') {
    return (
      <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
        <HugeiconsIcon icon={Clock01Icon} className="size-4 text-amber-600 dark:text-amber-400" />
      </div>
    )
  }
  if (status === 'approved') {
    return (
      <div className="flex size-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-green-600 dark:text-green-400" />
      </div>
    )
  }
  return (
    <div className="flex size-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
      <HugeiconsIcon icon={Cancel01Icon} className="size-4 text-red-600 dark:text-red-400" />
    </div>
  )
}
