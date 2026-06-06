import { getTranslations } from 'next-intl/server'
import { PublicPageLayout } from "@/components/layout/public-page-layout"
import { HeroSection } from "@/components/landing/hero-section"
import { HowItWorks } from "@/components/landing/how-it-works"
import { ShowcaseSection } from "@/components/landing/showcase-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { StatsSection } from "@/components/landing/stats-section"
import { CTASection } from "@/components/landing/cta-section"
import { siteConfig } from '@/lib/site'

const baseUrl = siteConfig.baseUrl

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const t = await getTranslations({ locale: lang, namespace: 'meta' })

  return {
    title: t('landingTitle'),
    description: t('description'),
    alternates: {
      canonical: `/${lang}`,
      languages: {
        en: `${baseUrl}/en`,
        uk: `${baseUrl}/uk`,
      },
    },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: `${baseUrl}/${lang}`,
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}

export default async function HomePage() {
  return (
    <PublicPageLayout>
      <HeroSection />
      <HowItWorks />
      <ShowcaseSection />
      <FeaturesSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
    </PublicPageLayout>
  )
}
