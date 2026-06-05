import { auth } from '@clerk/nextjs/server'
import { redirect } from '@/i18n/routing'
import { Sidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/header'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminClubIds, isMasterAdmin } from '@/lib/clubs'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const { userId } = await auth()

  if (!userId) {
    return redirect({ href: '/', locale: lang })
  }

  const supabase = createAdminClient()
  const isMaster = await isMasterAdmin(userId)
  const adminClubIds = await getAdminClubIds(userId)

  if (!isMaster && adminClubIds.length === 0) {
    redirect({ href: '/', locale: lang })
  }

  let adminClubs: { id: string; name: string; slug: string }[] = []
  if (adminClubIds.length > 0) {
    const { data: clubs } = await supabase
      .from('speaking_clubs')
      .select('id, name, slug')
      .in('id', adminClubIds)

    adminClubs = clubs ?? []
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar lang={lang} isMasterAdmin={isMaster} adminClubs={adminClubs} />
      <div className="flex-1 flex flex-col">
        <AdminHeader lang={lang} isMasterAdmin={isMaster} adminClubs={adminClubs} />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
