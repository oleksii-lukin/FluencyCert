import { getTranslations } from 'next-intl/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { isClubAdmin, isMasterAdmin } from '@/lib/clubs'
import { ClubSettingsForm } from './club-settings-form'
import { AdminManagement } from './admin-management'
import { DeleteClubButton } from './delete-club-button'

export default async function AdminClubSettingsPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const [{ lang, slug }, { userId }] = await Promise.all([params, auth()])
  if (!userId) redirect(`/${lang}`)

  const supabase = createAdminClient()
  const [t, { data: club }] = await Promise.all([
    getTranslations('admin'),
    supabase
      .from('speaking_clubs')
      .select('*')
      .eq('slug', slug)
      .single(),
  ])

  if (!club) notFound()

  const [isMaster, isClubAdm] = await Promise.all([
    isMasterAdmin(userId),
    isClubAdmin(userId, club.id),
  ])
  if (!isMaster && !isClubAdm) redirect(`/${lang}/admin`)

  const [{ data: admins }, { data: allMembers }] = await Promise.all([
    supabase
      .from('club_memberships')
      .select('user_id, created_at, profiles!inner(id, email, first_name, last_name, avatar_url)')
      .eq('club_id', club.id)
      .eq('role', 'admin')
      .order('created_at', { ascending: true }),
    supabase
      .from('club_memberships')
      .select('user_id, profiles!inner(id, email, first_name, last_name)')
      .eq('club_id', club.id)
      .eq('role', 'member'),
  ])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{club.name}</h1>
      <p className="text-muted-foreground mb-8">{t('settings')}</p>

      <div className="grid gap-8 max-w-2xl">
        <ClubSettingsForm club={club as Parameters<typeof ClubSettingsForm>[0]['club']} />

        <AdminManagement
          clubSlug={slug}
          admins={(admins ?? []).map((a) => ({
            user_id: a.user_id,
            email: a.profiles.email,
            first_name: a.profiles.first_name,
            last_name: a.profiles.last_name,
            avatar_url: a.profiles.avatar_url,
            created_at: a.created_at,
          }))}
          members={(allMembers ?? []).map((m) => ({
            user_id: m.user_id,
            email: m.profiles.email,
            first_name: m.profiles.first_name,
            last_name: m.profiles.last_name,
          }))}
        />

        {isMaster && (
          <div className="rounded-xl border border-red-200 p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-2">{t('dangerZone')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('deleteClubWarning')}</p>
            <DeleteClubButton clubSlug={slug} label={t('deleteClub')} />
          </div>
        )}
      </div>
    </div>
  )
}


