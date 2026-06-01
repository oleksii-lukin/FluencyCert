import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'

export async function Sidebar({ lang }: { lang: string }) {
  const t = await getTranslations({ locale: lang, namespace: 'sidebar' })

  return (
    <aside className="w-64 border-r bg-muted/30 p-6 flex flex-col gap-6">
      <Link href="/admin" className="text-lg font-bold">
        {t('adminPanel')}
      </Link>
      <nav className="flex flex-col gap-2">
        <Link
          href="/admin"
          className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          {t('dashboard')}
        </Link>
        <Link
          href="/admin/users"
          className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          {t('users')}
        </Link>
        <Link
          href="/admin/claims"
          className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          {t('claims')}
        </Link>
      </nav>
      <div className="mt-auto">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {t('backToSite')}
        </Link>
      </div>
    </aside>
  )
}
