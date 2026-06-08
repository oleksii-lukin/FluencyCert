import { getTranslations } from 'next-intl/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from '@/i18n/routing'
import { isMasterAdmin } from '@/lib/clubs'
import Image from 'next/image'
import { ContactButton } from '@/components/ui/contact-button'

export default async function AdminUsersPage({ params }: { params: Promise<{ lang: string }> }) {
  const [{ lang }, { userId }] = await Promise.all([params, auth()])

  const [isMaster, t] = await Promise.all([isMasterAdmin(userId!), getTranslations('admin')])
  if (!isMaster) redirect({ href: '/', locale: lang })
  const supabase = createAdminClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const userIds = profiles?.map(p => p.id) || []
  const { data: claims } = userIds.length > 0 ? await supabase
    .from('certificate_claims')
      .select('id, slug, user_id, status')
    .in('user_id', userIds)
    .order('created_at', { ascending: false }) : { data: [] }

  const latestClaimByUserId = new Map<string, { slug: string; status: string }>()
  claims?.forEach(claim => {
    if (!latestClaimByUserId.has(claim.user_id)) {
      latestClaimByUserId.set(claim.user_id, claim)
    }
  })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t('users')}</h1>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('user')}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('username')}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('phone')}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('role')}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('status')}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('joined')}</th>
            </tr>
          </thead>
          <tbody>
            {profiles?.map((profile) => {
              const claim = latestClaimByUserId.get(profile.id) || null
              return (
                <tr key={profile.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="px-4 py-3 min-w-[180px]">
                    <div className="flex items-center gap-3">
                      {profile.avatar_url ? (
                        <Image
                          src={profile.avatar_url}
                          alt=""
                          width={32}
                          height={32}
                          className="rounded-full size-8"
                        />
                      ) : (
                        <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {(profile.first_name?.[0] ?? profile.email[0]).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">
                          {[profile.first_name, profile.last_name].filter(Boolean).join(' ') || '—'}
                        </span>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <ContactButton type="email" value={profile.email} />
                          <ContactButton type="telegram" value={profile.telegram_username} />
                          <ContactButton type="linkedin" value={profile.linkedin_url} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{profile.username || '—'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{profile.phone_number || '—'}</td>
                  <td className="px-4 py-3">
                    {profile.is_admin ? (
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                        {t('adminBadge')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                        {t('userBadge')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <UserStatusBadge claim={claim} t={t} lang={lang} />
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
            {(!profiles || profiles.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  {t('noUsersFound')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function UserStatusBadge({
  claim,
  t,
  lang,
}: {
  claim: { slug: string; status: string } | null
  t: (key: string) => string
  lang: string
}) {
  if (!claim) {
    return (
      <span className="text-sm text-muted-foreground">—</span>
    )
  }

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

  const className = `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[claim.status] || ''}`

  if (claim.status === 'approved') {
    return (
      <a
        href={`/${lang}/certificate/${claim.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} hover:underline`}
      >
        {labels[claim.status] || claim.status}
      </a>
    )
  }

  return (
    <span className={className}>
      {labels[claim.status] || claim.status}
    </span>
  )
}
