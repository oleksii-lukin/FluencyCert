import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Image from 'next/image'
import { ClaimActions } from './claim-actions'

export default async function AdminClaimsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const t = await getTranslations('admin')
  const supabase = createAdminClient()

  const { data: claims } = await supabase
    .from('certificate_claims')
    .select('*, profiles!inner(id, email, first_name, last_name, avatar_url)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t('certificateClaims')}</h1>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('user')}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('status')}</th>
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
                      <Image
                        src={claim.profiles.avatar_url}
                        alt=""
                        width={32}
                        height={32}
                        className="rounded-full size-8"
                      />
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
                <td className="px-4 py-3">
                  <StatusBadge status={claim.status} claimId={claim.id} t={t} lang={lang} />
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
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('processed')}</span>
                  )}
                </td>
              </tr>
            ))}
            {(!claims || claims.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
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

function StatusBadge({ status, claimId, t, lang }: { status: string; claimId: string; t: (key: string) => string; lang: string }) {
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
        href={`/${lang}/certificate/${claimId}`}
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
