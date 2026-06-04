import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { redirect } from '@/i18n/routing'
import { isClubAdmin, isMasterAdmin } from '@/lib/clubs'
import { ClubDashboard } from './club-dashboard'

export default async function AdminClubDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang, slug } = await params
  const { userId } = await auth()
  const supabase = createAdminClient()

  const { data: club } = await supabase
    .from('speaking_clubs')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!club) notFound()

  const isMaster = await isMasterAdmin(userId!)
  const isAdmin = await isClubAdmin(userId!, club.id)
  if (!isMaster && !isAdmin) redirect({ href: '/', locale: lang })

  const { count: memberCount } = await supabase
    .from('club_memberships')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', club.id)

  const { count: adminCount } = await supabase
    .from('club_memberships')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', club.id)
    .eq('role', 'admin')

  const { count: pendingClaims } = await supabase
    .from('certificate_claims')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', club.id)
    .eq('status', 'pending')

  const { count: approvedCerts } = await supabase
    .from('certificate_claims')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', club.id)
    .eq('status', 'approved')

  return (
    <div>
      <ClubDashboard
        club={club}
        lang={lang}
        memberCount={memberCount ?? 0}
        adminCount={adminCount ?? 0}
        pendingClaims={pendingClaims ?? 0}
        approvedCerts={approvedCerts ?? 0}
      />
    </div>
  )
}
