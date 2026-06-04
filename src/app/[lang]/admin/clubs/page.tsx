import { getTranslations } from 'next-intl/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from '@/i18n/routing'
import { isMasterAdmin } from '@/lib/clubs'
import { ClubList } from './club-list'

export default async function AdminClubsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const { userId } = await auth()

  const isMaster = await isMasterAdmin(userId!)
  if (!isMaster) redirect({ href: '/', locale: lang })

  const t = await getTranslations('admin')
  const supabase = createAdminClient()

  const { data: clubs } = await supabase
    .from('speaking_clubs')
    .select('id, name, slug, description, created_at')
    .order('name', { ascending: true })

  const clubsWithCounts = await Promise.all(
    (clubs ?? []).map(async (club) => {
      const { count: memberCount } = await supabase
        .from('club_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', club.id)

      const { count: adminCount } = await supabase
        .from('club_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', club.id)
        .eq('role', 'admin')

      return { ...club, member_count: memberCount ?? 0, admin_count: adminCount ?? 0 }
    }),
  )

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t('clubs')}</h1>
      <ClubList clubs={clubsWithCounts} />
    </div>
  )
}
