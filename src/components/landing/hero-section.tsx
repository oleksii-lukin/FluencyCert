import Image from "next/image"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { SparklesIcon, UserGroupIcon, MedalFirstPlaceIcon } from "@hugeicons/core-free-icons"
import { ClaimCertificateButton } from "@/components/landing/claim-certificate-button"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-bright-sky/20 via-bright-sky/5 to-white px-4 pt-32 pb-20 md:pb-28 dark:from-bright-sky/10 dark:via-graphite dark:to-graphite">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 size-[30rem] rounded-full bg-bright-sky/25 blur-3xl dark:bg-bright-sky/10" />
        <div className="absolute -bottom-40 -left-40 size-[30rem] rounded-full bg-bright-sky/15 blur-3xl dark:bg-bright-sky/5" />
        <div className="absolute top-1/2 right-1/4 size-72 rounded-full bg-banana-cream/15 blur-3xl dark:bg-banana-cream/5" />
        <div className="absolute top-1/3 left-1/3 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bright-sky/10 blur-3xl dark:bg-bright-sky/5" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-10 md:grid-cols-3">
          <div className="flex justify-center md:justify-start">
            <Image src="/logo.png" alt="FluencyCert" width={320} height={320} className="w-full max-w-[260px] md:max-w-full dark:brightness-90" />
          </div>

          <div className="flex flex-col md:col-span-2 md:text-left">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-graphite dark:text-snow md:text-6xl md:leading-[1.1]">
              Prove Your{" "}
              <span className="text-bright-sky">
                English Fluency
              </span>{" "}
              with a Verified Speaking Certificate
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-graphite/60 dark:text-snow/70">
              Showcase your speaking club participation, upload your certificate, and let the community celebrate your progress with reactions and feedback.
            </p>

            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row">
              <ClaimCertificateButton
                label="Claim Your Certificate"
                className="h-12 bg-bright-sky px-8 text-base text-white shadow-lg shadow-bright-sky/30 hover:bg-bright-sky/90 dark:shadow-bright-sky/20"
              />
              <Button className="h-12 bg-banana-cream px-8 text-base text-graphite shadow-lg shadow-banana-cream/25 hover:bg-banana-cream/90 dark:shadow-banana-cream/15">
                Explore Gallery
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-bright-sky/15 dark:bg-bright-sky/20">
                  <HugeiconsIcon icon={MedalFirstPlaceIcon} className="size-5 text-bright-sky" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-graphite dark:text-snow">12.4K+</p>
                  <p className="text-xs text-graphite/50 dark:text-snow/50">Certificates Issued</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-bright-sky/15 dark:bg-bright-sky/20">
                  <HugeiconsIcon icon={UserGroupIcon} className="size-5 text-bright-sky" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-graphite dark:text-snow">8.2K+</p>
                  <p className="text-xs text-graphite/50 dark:text-snow/50">Active Members</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-bright-sky/15 dark:bg-bright-sky/20">
                  <HugeiconsIcon icon={SparklesIcon} className="size-5 text-bright-sky" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-graphite dark:text-snow">56K+</p>
                  <p className="text-xs text-graphite/50 dark:text-snow/50">Reactions Sent</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
