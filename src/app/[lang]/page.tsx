import { getTranslations } from 'next-intl/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { HowItWorks } from "@/components/landing/how-it-works"
import { ShowcaseSection } from "@/components/landing/showcase-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { StatsSection } from "@/components/landing/stats-section"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"

const baseUrl = 'https://fluencycert.com'

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

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
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
      <main>
        <HeroSection />
        <HowItWorks />
        <ShowcaseSection />
        <FeaturesSection />
        <StatsSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
