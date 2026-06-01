import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Image from 'next/image'

export default async function AdminUsersPage({ params }: { params: Promise<{ lang: string }> }) {
  const t = await getTranslations('admin')
  const supabase = createAdminClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t('users')}</h1>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('user')}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('email')}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('username')}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('phone')}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('role')}</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t('joined')}</th>
            </tr>
          </thead>
          <tbody>
            {profiles?.map((profile) => (
              <tr key={profile.id} className="border-b last:border-b-0 hover:bg-muted/30">
                <td className="px-4 py-3">
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
                    <span className="font-medium">
                      {[profile.first_name, profile.last_name].filter(Boolean).join(' ') || '—'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{profile.email}</td>
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
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(profile.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
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
