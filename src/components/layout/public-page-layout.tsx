import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export async function PublicPageLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  let isAdmin = false

  if (userId) {
    const supabase = createAdminClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()
    isAdmin = profile?.is_admin ?? false
  }

  return (
    <>
      <Navbar isAdmin={isAdmin} />
      <main className="relative flex-1 overflow-hidden bg-gradient-to-b from-bright-sky/20 via-bright-sky/5 to-white dark:from-bright-sky/10 dark:via-graphite dark:to-graphite">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 size-[30rem] rounded-full bg-bright-sky/25 blur-3xl dark:bg-bright-sky/10" />
          <div className="absolute -bottom-40 -left-40 size-[30rem] rounded-full bg-bright-sky/15 blur-3xl dark:bg-bright-sky/5" />
          <div className="absolute right-1/4 top-1/2 size-72 rounded-full bg-banana-cream/15 blur-3xl dark:bg-banana-cream/5" />
          <div className="absolute left-1/3 top-1/3 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bright-sky/10 blur-3xl dark:bg-bright-sky/5" />
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </main>
      <Footer />
    </>
  )
}
