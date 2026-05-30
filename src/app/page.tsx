import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { HowItWorks } from "@/components/landing/how-it-works"
import { ShowcaseSection } from "@/components/landing/showcase-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { StatsSection } from "@/components/landing/stats-section"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"

export default async function HomePage() {
  const supabase = await createClient()
  const { data } = await supabase.from("test").select("*").maybeSingle()

  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        <ShowcaseSection />
        <FeaturesSection />
        <StatsSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <section className="py-8 text-center text-sm text-muted-foreground">
        {data ? (
          <p>Test record: id={data.id}, created_at={data.created_at}</p>
        ) : (
          <p>No test data</p>
        )}
      </section>
      <Footer />
    </>
  )
}
