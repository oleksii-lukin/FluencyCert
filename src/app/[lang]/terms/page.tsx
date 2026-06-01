import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'

export default async function TermsPage({ params }: { params: Promise<{ lang: string }> }) {
  const t = await getTranslations('terms')

  return (
    <div className="min-h-screen bg-gradient-to-b from-bright-sky/5 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
          {t('backHome')}
        </Link>

        <h1 className="text-3xl font-bold tracking-tight text-graphite dark:text-snow md:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('lastUpdated')}</p>

        <div className="mt-8 space-y-8">
          <Section title={t('section1Title')} text={t('section1Text')} />
          <Section title={t('section2Title')} text={t('section2Text')} />
          <Section title={t('section3Title')} text={t('section3Text')} />
          <Section title={t('section4Title')} text={t('section4Text')} />
          <Section title={t('section5Title')} text={t('section5Text')} />
          <Section title={t('section6Title')} text={t('section6Text')} />
        </div>
      </div>
    </div>
  )
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-graphite dark:text-snow">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{text}</p>
    </section>
  )
}
