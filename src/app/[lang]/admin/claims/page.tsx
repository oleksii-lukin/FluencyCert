import { getTranslations } from 'next-intl/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from '@/i18n/routing'
import { getAdminClubIds, isMasterAdmin } from '@/lib/clubs'
import Image from 'next/image'
import { ClaimActions } from './claim-actions'
import { SlugDisplay } from './slug-display'

export default async function AdminClaimsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const { userId } = await auth()
  if (!userId) redirect({ href: '/', locale: lang })

  const t = await getTranslations('admin')
  const supabase = createAdminClient()

  const isMaster = await isMasterAdmin(userId)
  const adminClubIds = await getAdminClubIds(userId)

  if (!isMaster && adminClubIds.length === 0) {
    redirect({ href: '/', locale: lang })
  }

  let query = supabase
    .from('certificate_claims')
    .select('*, profiles!inner(id, email, first_name, last_name, avatar_url)')
    .order('created_at', { ascending: false })

  if (!isMaster && adminClubIds.length > 0) {
    query = query.in('club_id', adminClubIds)
  }

  if (!isMaster && adminClubIds.length === 0) {
    redirect({ href: '/', locale: lang })
  }

  const { data: claims } = await query

  const clubIds = [...new Set((claims ?? []).map((c) => c.club_id).filter(Boolean))]
  const { data: clubs } = clubIds.length > 0
    ? await supabase.from('speaking_clubs').select('id, name').in('id', clubIds)
    : { data: [] }
  const clubMap = new Map((clubs ?? []).map((c) => [c.id, c.name]))

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t('certificateClaims')}</h1>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('user')}</th>
              {isMaster && <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('club')}</th>}
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('status')}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('slugLabel')}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('submitted')}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('feedback')}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {claims?.map((claim) => (
              <tr key={claim.id} className="border-b last:border-b-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {claim.profiles.avatar_url ? (
                      <Image src={claim.profiles.avatar_url} alt="" width={32} height={32} className="rounded-full size-8" />
                    ) : (
                      <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {(claim.profiles.first_name?.[0] ?? claim.profiles.email[0]).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">
                        {[claim.profiles.first_name, claim.profiles.last_name].filter(Boolean).join(' ') || '—'}
                      </span>
                      <p className="text-xs text-muted-foreground">{claim.profiles.email}</p>
                    </div>
                  </div>
                </td>
                {isMaster && (
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {claim.club_id ? clubMap.get(claim.club_id) || '—' : '—'}
                  </td>
                )}
                <td className="px-4 py-3">
                  <StatusBadge status={claim.status} slug={claim.slug} t={t} lang={lang} />
                </td>
                <td className="px-4 py-3">
                  <SlugDisplay slug={claim.slug} claimId={claim.id} />
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(claim.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                  {claim.admin_feedback || '—'}
                </td>
                <td className="px-4 py-3">
                  {claim.status === 'pending' ? (
                    <ClaimActions claimId={claim.id} />
                  ) : claim.status === 'approved' ? (
                    <ClaimActions
                      claimId={claim.id}
                      mode="update"
                      initialData={{
                        english_level: claim.english_level,
                        speaking_clubs_count: claim.speaking_clubs_count,
                        hours_participated: claim.hours_participated,
                        background_template: claim.background_template,
                        slug: claim.slug,
                        admin_feedback: claim.admin_feedback,
                        pdf_template_id: claim.pdf_template_id,
                        status: claim.status,
                      }}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('processed')}</span>
                  )}
                </td>
              </tr>
            ))}
            {(!claims || claims.length === 0) && (
              <tr>
                <td colSpan={isMaster ? 7 : 6} className="px-4 py-8 text-center text-muted-foreground">
                  {t('noClaimsFound')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status, slug, t, lang }: { status: string; slug: string; t: (key: string) => string; lang: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    approved: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    rejected: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  }

  const labels: Record<string, string> = {
    pending: t('pending'),
    approved: t('approved'),
    rejected: t('rejected'),
  }

  const className = `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status] || ''}`

  if (status === 'approved') {
    return (
      <a
        href={`/${lang}/certificate/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} hover:underline`}
      >
        {labels[status] || status}
      </a>
    )
  }

  return (
    <span className={className}>
      {labels[status] || status}
    </span>
  )
}
