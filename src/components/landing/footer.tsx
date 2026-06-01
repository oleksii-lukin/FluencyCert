import { getTranslations } from 'next-intl/server'
import { Link } from "@/i18n/routing"
import { HugeiconsIcon } from "@hugeicons/react"
import { Certificate02Icon } from "@hugeicons/core-free-icons"

export async function Footer() {
  const t = await getTranslations('footer')
  const year = new Date().getFullYear()

  const links = [
    { label: t('howItWorks'), href: "/#how-it-works" },
    { label: t('features'), href: "/#features" },
    { label: t('showcase'), href: "/#showcase" },
  ]

  const communityLinks = [
    { label: t('testimonials'), href: "/#testimonials" },
  ]

  return (
    <footer className="border-t border-bright-sky/10 bg-gradient-to-b from-white to-bright-sky/[0.03] px-4 py-12 md:py-16 dark:border-snow/5 dark:from-graphite dark:to-graphite/95" suppressHydrationWarning>
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-bright-sky">
                <HugeiconsIcon icon={Certificate02Icon} className="size-4 text-white" />
              </div>
              <span className="text-base font-bold tracking-tight text-graphite dark:text-snow">
                Fluency<span className="text-bright-sky">Cert</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-graphite/50 dark:text-snow/40">
              {t('description')}
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-graphite dark:text-snow">{t('platform')}</h4>
            <ul className="space-y-2.5">
              {links.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-graphite/50 transition-colors hover:text-bright-sky dark:text-snow/40 dark:hover:text-bright-sky">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-graphite dark:text-snow">{t('community')}</h4>
            <ul className="space-y-2.5">
              {communityLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-graphite/50 transition-colors hover:text-bright-sky dark:text-snow/40 dark:hover:text-bright-sky">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 text-xs text-graphite/40 md:flex-row dark:border-snow/10 dark:text-snow/40">
          <p>&copy; {year} FluencyCert. {t('allRightsReserved')}</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition-colors hover:text-bright-sky dark:text-snow/40 dark:hover:text-bright-sky">{t('privacyPolicy')}</Link>
            <Link href="/terms" className="transition-colors hover:text-bright-sky dark:text-snow/40 dark:hover:text-bright-sky">{t('termsOfService')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
