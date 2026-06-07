import { getTranslations } from 'next-intl/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from '@/i18n/routing'
import { getAdminClubIds, isMasterAdmin } from '@/lib/clubs'
import { Link } from '@/i18n/routing'
import { ZoomAdmin } from "@/components/zoom/zoom-admin"

export default async function AdminDashboard({ params }: { params: Promise<{ lang: string }> }) {
  const [{ lang }, { userId }, t] = await Promise.all([params, auth(), getTranslations('admin')])
  const supabase = createAdminClient()

  const [isMaster, adminClubIds] = await Promise.all([isMasterAdmin(userId!), getAdminClubIds(userId!)])

  if (!isMaster) {
    if (adminClubIds.length === 1) {
      const { data: club } = await supabase
        .from('speaking_clubs')
        .select('slug')
        .eq('id', adminClubIds[0])
        .single()

      if (club) {
        redirect({ href: `/admin/clubs/${club.slug}`, locale: lang })
      }
    }

    const { data: clubs } = await supabase
      .from('speaking_clubs')
      .select('id, name, slug')
      .in('id', adminClubIds)

    const { count: clubCount } = await supabase
      .from('speaking_clubs')
      .select('*', { count: 'exact', head: true })
      .in('id', adminClubIds)

    const { count: pendingClaims } = await supabase
      .from('certificate_claims')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .in('club_id', adminClubIds)

    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">{t('dashboard')}</h1>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border p-6">
            <p className="text-sm text-muted-foreground">{t('myClubs')}</p>
            <p className="text-3xl font-bold mt-1">{clubCount ?? 0}</p>
          </div>
          <div className="rounded-xl border p-6">
            <p className="text-sm text-muted-foreground">{t('pendingClaims')}</p>
            <p className="text-3xl font-bold mt-1 text-amber-600">{pendingClaims ?? 0}</p>
          </div>
          <div className="rounded-xl border p-6">
            <p className="text-sm text-muted-foreground">{t('signedInAs')}</p>
            <p className="text-sm font-mono mt-1 truncate">{userId}</p>
          </div>
        </div>

        {clubs && clubs.length > 1 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">{t('myClubs')}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {clubs.map((club) => (
                <Link
                  key={club.id}
                  href={`/admin/clubs/${club.slug}`}
                  className="rounded-xl border p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold">{club.name}</h3>
                  <p className="text-sm text-muted-foreground">{t('manage')}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const [{ count: totalUsers }, { count: adminUsers }, { count: pendingClaims }, { count: clubsCount }, { data: profile }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', true),
    supabase.from('certificate_claims').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('speaking_clubs').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('zoom_user_info').eq('id', userId!).single(),
  ])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t('dashboard')}</h1>
      <div className="grid gap-6 md:grid-cols-5">
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">{t('totalUsers')}</p>
          <p className="text-3xl font-bold mt-1">{totalUsers ?? 0}</p>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">{t('admins')}</p>
          <p className="text-3xl font-bold mt-1">{adminUsers ?? 0}</p>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">{t('clubs')}</p>
          <p className="text-3xl font-bold mt-1">{clubsCount ?? 0}</p>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">{t('pendingClaims')}</p>
          <p className="text-3xl font-bold mt-1 text-amber-600">{pendingClaims ?? 0}</p>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">{t('signedInAs')}</p>
          <p className="text-sm font-mono mt-1 truncate">{userId}</p>
        </div>
      </div>
      <div className="mt-8">
        <ZoomAdmin initialZoomUserInfo={profile?.zoom_user_info as { id: string; email: string; display_name: string } | null} />
      </div>
    </div>
  )
}
