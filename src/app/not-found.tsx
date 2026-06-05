import { headers } from 'next/headers'
import Link from 'next/link'

async function loadMessages(locale: string) {
  return (await import(`../../messages/${locale}.json`)).default
}

export default async function NotFound() {
  const h = await headers()
  const locale = h.get('x-next-intl-locale') || 'en'
  const messages = await loadMessages(locale)
  const t = (key: string) => messages.notFound?.[key] ?? key

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-bright-sky/20 via-bright-sky/5 to-white px-4 dark:from-bright-sky/10 dark:via-graphite dark:to-graphite">
      <h1 className="text-6xl font-bold text-bright-sky">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-graphite dark:text-snow">{t('title')}</h2>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">{t('description')}</p>
      <Link
        href={`/${locale}`}
        className="mt-8 inline-flex items-center rounded-lg bg-bright-sky px-6 py-2.5 text-sm font-medium text-white hover:bg-bright-sky/90 transition-colors"
      >
        {t('backHome')}
      </Link>
    </div>
  )
}
