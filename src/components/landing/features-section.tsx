import { HugeiconsIcon } from "@hugeicons/react"
import {
  Certificate02Icon,
  Image01Icon,
  HeartIcon,
  Message01Icon,
  UserGroupIcon,
  Share01Icon,
} from "@hugeicons/core-free-icons"

const features = [
  {
    icon: Certificate02Icon,
    title: "Certificate Display",
    description: "Upload your main certificate image as the centerpiece of your profile.",
    bg: "bg-bright-sky/15 dark:bg-bright-sky/20",
  },
  {
    icon: Image01Icon,
    title: "Multiple Photos",
    description: "Add pictures from your speaking club sessions to tell your full story.",
    bg: "bg-bright-sky/20 dark:bg-bright-sky/25",
  },
  {
    icon: HeartIcon,
    title: "Reactions",
    description: "Send reactions to celebrate fellow members&apos; achievements and milestones.",
    bg: "bg-bright-sky/12 dark:bg-bright-sky/15",
  },
  {
    icon: Message01Icon,
    title: "Feedback & Comments",
    description: "Leave encouraging feedback and tips for other speakers in the community.",
    bg: "bg-harvest-orange/12 dark:bg-harvest-orange/15",
  },
  {
    icon: UserGroupIcon,
    title: "Community Network",
    description: "Connect with other speaking club members and follow their progress.",
    bg: "bg-harvest-orange/10 dark:bg-harvest-orange/15",
  },
  {
    icon: Share01Icon,
    title: "Share Anywhere",
    description: "Share your certificate profile on social media, CV, or LinkedIn.",
    bg: "bg-banana-cream/15 dark:bg-banana-cream/10",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="bg-gradient-to-b from-bright-sky/5 via-white to-bright-sky/5 px-4 py-20 md:py-28 dark:from-graphite/90 dark:via-graphite dark:to-graphite/90">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-graphite dark:text-snow md:text-4xl">
            Everything You Need
          </h2>
          <p className="mt-4 text-lg text-graphite/60 dark:text-snow/60">
            Built for speaking club members who want to showcase their English proficiency.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group cursor-pointer rounded-2xl border border-bright-sky/10 bg-white p-6 shadow-sm shadow-bright-sky/5 transition-all duration-300 hover:border-bright-sky/25 hover:shadow-lg hover:shadow-bright-sky/15 dark:border-snow/10 dark:bg-graphite/80 dark:shadow-black/10 dark:hover:border-bright-sky/30 dark:hover:shadow-bright-sky/10"
            >
              <div className={`mb-4 flex size-12 items-center justify-center rounded-xl ${feature.bg} transition-transform duration-300 group-hover:scale-110`}>
                <HugeiconsIcon icon={feature.icon} className="size-5 text-bright-sky" />
              </div>
              <h3 className="text-base font-semibold text-graphite dark:text-snow">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-graphite/55 dark:text-snow/60">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
