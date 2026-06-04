import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'

export async function Sidebar({
  lang,
  isMasterAdmin,
  adminClubs,
}: {
  lang: string
  isMasterAdmin: boolean
  adminClubs: { id: string; name: string; slug: string }[]
}) {
  const t = await getTranslations({ locale: lang, namespace: 'sidebar' })

  return (
    <aside className="w-64 border-r bg-muted/30 p-6 flex flex-col gap-6">
      <Link href="/admin" className="text-lg font-bold">
        {t('adminPanel')}
      </Link>

      <nav className="flex flex-col gap-1">
        {isMasterAdmin && (
          <>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pb-1">
              {t('global')}
            </p>
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
              href="/admin/clubs"
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              {t('clubs')}
            </Link>
            <Link
              href="/admin/claims"
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              {t('claims')}
            </Link>
            <Link
              href="/admin/pdf-templates"
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              {t('pdfTemplates')}
            </Link>
          </>
        )}

        {adminClubs.length > 0 && (
          <>
            <div className="mt-4" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pb-1">
              {t('myClubs')}
            </p>
            {adminClubs.map((club) => (
              <div key={club.id} className="flex flex-col gap-0.5">
                <p className="px-3 py-1.5 text-sm font-medium text-foreground">
                  {club.name}
                </p>
                <Link
                  href={`/admin/clubs/${club.slug}`}
                  className="rounded-lg px-6 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  {t('dashboard')}
                </Link>
                <Link
                  href={`/admin/clubs/${club.slug}/members`}
                  className="rounded-lg px-6 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  {t('members')}
                </Link>
                <Link
                  href={`/admin/clubs/${club.slug}/claims`}
                  className="rounded-lg px-6 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  {t('claims')}
                </Link>
                <Link
                  href={`/admin/clubs/${club.slug}/pdf-templates`}
                  className="rounded-lg px-6 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  {t('pdfTemplates')}
                </Link>
                <Link
                  href={`/admin/clubs/${club.slug}/settings`}
                  className="rounded-lg px-6 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  {t('settings')}
                </Link>
              </div>
            ))}
          </>
        )}
      </nav>
    </aside>
  )
}
