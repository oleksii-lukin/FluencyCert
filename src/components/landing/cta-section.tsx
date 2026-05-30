import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Certificate02Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons"

export function CTASection() {
  return (
    <section className="bg-gradient-to-b from-bright-sky/5 via-white to-white px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-graphite to-graphite/90 px-6 py-16 text-center shadow-2xl shadow-graphite/20 md:px-16 md:py-20">
          <div className="absolute -top-20 -right-20 size-64 rounded-full bg-bright-sky/15 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-bright-sky/10 blur-3xl" />
          <div className="absolute top-1/3 right-1/4 size-48 rounded-full bg-banana-cream/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 size-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bright-sky/8 blur-3xl" />

          <div className="relative">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-bright-sky/15">
              <HugeiconsIcon icon={Certificate02Icon} className="size-7 text-bright-sky" />
            </div>

            <h2 className="text-3xl font-bold text-snow md:text-4xl">
              Ready to Showcase Your Fluency?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-snow/65">
              Join thousands of speaking club members. Upload your certificate, share your journey, and get celebrated by the community.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button className="h-12 bg-bright-sky px-8 text-base text-white shadow-lg shadow-bright-sky/30 hover:bg-bright-sky/90">
                Claim Your Free Certificate
                <HugeiconsIcon icon={ArrowRight02Icon} className="ml-1.5 size-4" />
              </Button>
              <Button className="h-12 bg-banana-cream px-8 text-base text-graphite shadow-lg shadow-banana-cream/25 hover:bg-banana-cream/90">
                Browse Examples
              </Button>
            </div>

            <p className="mt-6 text-xs text-snow/40">Free for speaking club members. No credit card required.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
