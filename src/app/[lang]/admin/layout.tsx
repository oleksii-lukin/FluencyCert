import { auth } from '@clerk/nextjs/server'
import { redirect } from '@/i18n/routing'
import { Sidebar } from '@/components/admin/sidebar'
import { createAdminClient } from '@/lib/supabase/admin'

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
    redirect({ href: '/', locale: lang })
  }

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId!)
    .single()

  if (!profile?.is_admin) {
    redirect({ href: '/', locale: lang })
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar lang={lang} />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
