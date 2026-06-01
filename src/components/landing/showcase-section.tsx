import { HugeiconsIcon } from "@hugeicons/react"
import { HeartIcon, Message01Icon, Certificate02Icon, Clock01Icon } from "@hugeicons/core-free-icons"

const certificates = [
  {
    name: "Sarah Chen",
    level: "Advanced (C1)",
    club: "Global Speakers NYC",
    clubs: 3,
    hours: 120,
    upvotes: 234,
    feedback: 18,
    gradient: "from-bright-sky/25 to-bright-sky/5 dark:from-bright-sky/20 dark:to-graphite",
    badge: "bg-bright-sky text-white",
  },
  {
    name: "Marcus Johnson",
    level: "Upper-Intermediate (B2)",
    club: "London Speaking Circle",
    clubs: 2,
    hours: 85,
    upvotes: 189,
    feedback: 14,
    gradient: "from-bright-sky/20 to-snow/50 dark:from-bright-sky/15 dark:to-graphite",
    badge: "bg-bright-sky/90 text-white",
  },
  {
    name: "Elena Rodriguez",
    level: "Advanced (C1)",
    club: "Madrid English Hub",
    clubs: 4,
    hours: 200,
    upvotes: 312,
    feedback: 24,
    gradient: "from-banana-cream/25 to-snow/50 dark:from-banana-cream/15 dark:to-graphite",
    badge: "bg-harvest-orange text-white",
  },
  {
    name: "Aisha Patel",
    level: "Proficient (C2)",
    club: "Dubai Speakers Forum",
    clubs: 5,
    hours: 250,
    upvotes: 278,
    feedback: 21,
    gradient: "from-bright-sky/20 to-harvest-orange/10 dark:from-bright-sky/15 dark:to-harvest-orange/10",
    badge: "bg-bright-sky text-white",
  },
]

function ClubBadge({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] text-graphite/50 backdrop-blur-sm dark:bg-graphite/80 dark:text-snow/50">
      <HugeiconsIcon icon={Clock01Icon} className="size-3" />
      <span>{count}h</span>
    </div>
  )
}

export function ShowcaseSection() {
  return (
    <section id="showcase" className="bg-gradient-to-b from-bright-sky/15 via-bright-sky/5 to-white px-4 py-20 md:py-28 dark:from-bright-sky/8 dark:via-graphite/90 dark:to-graphite">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-graphite dark:text-snow md:text-4xl">
            Member Certificates
          </h2>
          <p className="mt-4 text-lg text-graphite/60 dark:text-snow/60">
            See how members proudly display their verified speaking certificates.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {certificates.map((cert) => (
            <div
              key={cert.name}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm shadow-bright-sky/5 transition-all duration-300 hover:border-bright-sky/30 hover:shadow-xl hover:shadow-bright-sky/15 dark:border-snow/10 dark:bg-graphite/80 dark:shadow-black/10 dark:hover:border-bright-sky/30 dark:hover:shadow-bright-sky/10"
            >
                <div className={`aspect-[4/3] bg-gradient-to-br ${cert.gradient} relative flex items-center justify-center p-6`}>
                <div className="flex h-full w-full items-center justify-center rounded-xl border-2 border-white/60 bg-white/40 backdrop-blur-sm dark:border-snow/20 dark:bg-graphite/60">
                  <div className="text-center">
                    <HugeiconsIcon icon={Certificate02Icon} className="mx-auto size-10 text-graphite/20 dark:text-snow/20" />
                    <p className="mt-2 text-[10px] font-medium text-graphite/30 dark:text-snow/30">Certificate</p>
                  </div>
                </div>
                <span className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cert.badge}`}>
                  {cert.level}
                </span>
                <ClubBadge count={cert.hours} />
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-graphite dark:text-snow">{cert.name}</h3>
                </div>
                <p className="text-xs text-graphite/50 dark:text-snow/50">{cert.club} · {cert.clubs} clubs</p>

                <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3 text-xs text-graphite/50 dark:border-snow/10 dark:text-snow/50">
                  <span className="flex items-center gap-1">
                    <HugeiconsIcon icon={HeartIcon} className="size-3.5" />
                    {cert.upvotes}
                  </span>
                  <span className="flex items-center gap-1">
                    <HugeiconsIcon icon={Message01Icon} className="size-3.5" />
                    {cert.feedback}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
