import { getTranslations } from 'next-intl/server'
import { PublicPageLayout } from "@/components/layout/public-page-layout"
import { siteConfig } from '@/lib/site'

const baseUrl = siteConfig.baseUrl

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const t = await getTranslations({ locale: lang, namespace: 'meta' })

  return {
    title: t('termsTitle'),
    description: t('termsDescription'),
    alternates: {
      canonical: `/${lang}/terms`,
      languages: {
        en: `${baseUrl}/en/terms`,
        uk: `${baseUrl}/uk/terms`,
      },
    },
    openGraph: {
      title: t('termsTitle'),
      description: t('termsDescription'),
      url: `${baseUrl}/${lang}/terms`,
    },
    twitter: {
      card: 'summary_large_image',
    },
    robots: {
      index: false,
      follow: true,
    },
  }
}

export default async function TermsPage({ params }: { params: Promise<{ lang: string }> }) {
  const t = await getTranslations('terms')

  return (
    <PublicPageLayout>
      <div className="mx-auto max-w-3xl px-4 pt-28 pb-16">
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
    </PublicPageLayout>
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
