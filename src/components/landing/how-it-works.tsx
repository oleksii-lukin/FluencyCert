import { HugeiconsIcon } from "@hugeicons/react"
import { Upload01Icon, Certificate02Icon, MessageFavourite01Icon } from "@hugeicons/core-free-icons"

const steps = [
  {
    icon: Upload01Icon,
    title: "Upload Your Certificate",
    description: "Upload your main speaking certificate image along with photos from your club sessions to showcase your journey.",
    color: "bg-bright-sky/15 text-bright-sky dark:bg-bright-sky/20",
  },
  {
    icon: Certificate02Icon,
    title: "Showcase Your Fluency",
    description: "Build your profile with proof of English proficiency. Highlight your level, achievements, and club participation.",
    color: "bg-bright-sky/20 text-bright-sky dark:bg-bright-sky/25",
  },
  {
    icon: MessageFavourite01Icon,
    title: "Get Feedback & Reactions",
    description: "Receive reactions and encouraging feedback from the community. Celebrate milestones together.",
    color: "bg-bright-sky/15 text-bright-sky dark:bg-bright-sky/20",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-gradient-to-b from-white via-bright-sky/[0.02] to-white px-4 py-20 md:py-28 dark:from-graphite dark:via-graphite/95 dark:to-graphite">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-graphite dark:text-snow md:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-graphite/60 dark:text-snow/60">
            Three simple steps to show the world what you&apos;ve accomplished in your speaking club.
          </p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="group relative">
              <div className="flex flex-col items-center rounded-2xl border border-bright-sky/15 bg-gradient-to-b from-white to-bright-sky/[0.03] p-8 text-center shadow-sm shadow-bright-sky/5 transition-all duration-300 hover:border-bright-sky/30 hover:shadow-lg hover:shadow-bright-sky/15 dark:border-snow/10 dark:from-graphite/80 dark:to-graphite/90 dark:shadow-black/10 dark:hover:border-bright-sky/30 dark:hover:shadow-bright-sky/10">
                <div className={`mb-5 flex size-14 items-center justify-center rounded-2xl ${step.color} transition-transform duration-300 group-hover:scale-110`}>
                  <HugeiconsIcon icon={step.icon} className="size-6" />
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-bright-sky/15 text-xs font-bold text-bright-sky dark:bg-bright-sky/20">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-graphite dark:text-snow">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-graphite/55 dark:text-snow/60">{step.description}</p>
              </div>

              {i < steps.length - 1 && (
                <div className="absolute top-1/3 -right-4 hidden text-bright-sky/30 md:block dark:text-bright-sky/20">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
