import { HugeiconsIcon } from "@hugeicons/react"
import { HeartIcon, Message01Icon, StarIcon, Certificate02Icon, Image01Icon } from "@hugeicons/core-free-icons"

const certificates = [
  {
    name: "Sarah Chen",
    level: "Advanced (C1)",
    club: "Global Speakers NYC",
    reactions: 234,
    feedback: 18,
    rating: 4.9,
    gradient: "from-bright-sky/25 to-bright-sky/5",
    badge: "bg-bright-sky text-white",
  },
  {
    name: "Marcus Johnson",
    level: "Upper-Intermediate (B2)",
    club: "London Speaking Circle",
    reactions: 189,
    feedback: 14,
    rating: 4.8,
    gradient: "from-bright-sky/20 to-snow/50",
    badge: "bg-bright-sky/90 text-white",
  },
  {
    name: "Elena Rodriguez",
    level: "Advanced (C1)",
    club: "Madrid English Hub",
    reactions: 312,
    feedback: 24,
    rating: 5.0,
    gradient: "from-banana-cream/25 to-snow/50",
    badge: "bg-harvest-orange text-white",
  },
  {
    name: "Aisha Patel",
    level: "Proficient (C2)",
    club: "Dubai Speakers Forum",
    reactions: 278,
    feedback: 21,
    rating: 4.9,
    gradient: "from-bright-sky/20 to-harvest-orange/10",
    badge: "bg-bright-sky text-white",
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <HugeiconsIcon
          key={i}
          icon={StarIcon}
          className={`size-3.5 ${i < Math.floor(rating) ? "text-banana-cream" : "text-gray-200"}`}
        />
      ))}
      <span className="ml-1 text-xs font-medium text-graphite/50">{rating}</span>
    </div>
  )
}

export function ShowcaseSection() {
  return (
    <section id="showcase" className="bg-gradient-to-b from-bright-sky/15 via-bright-sky/5 to-white px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-graphite md:text-4xl">
            Member Certificates
          </h2>
          <p className="mt-4 text-lg text-graphite/60">
            See how members proudly display their speaking achievements.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {certificates.map((cert) => (
            <div
              key={cert.name}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm shadow-bright-sky/5 transition-all duration-300 hover:border-bright-sky/30 hover:shadow-xl hover:shadow-bright-sky/15"
            >
              <div className={`aspect-[4/3] bg-gradient-to-br ${cert.gradient} relative flex items-center justify-center p-6`}>
                <div className="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-white/60 bg-white/40 backdrop-blur-sm">
                  <div className="text-center">
                    <HugeiconsIcon icon={Certificate02Icon} className="mx-auto size-10 text-graphite/20" />
                    <p className="mt-2 text-[10px] font-medium text-graphite/30">Certificate Preview</p>
                  </div>
                </div>
                <span className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cert.badge}`}>
                  {cert.level}
                </span>
                <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] text-graphite/50 backdrop-blur-sm">
                  <HugeiconsIcon icon={Image01Icon} className="size-3" />
                  <span>+3</span>
                </div>
              </div>

              <div className="p-4">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-graphite">{cert.name}</h3>
                  <StarRating rating={cert.rating} />
                </div>
                <p className="text-xs text-graphite/50">{cert.club}</p>

                <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3 text-xs text-graphite/50">
                  <span className="flex items-center gap-1">
                    <HugeiconsIcon icon={HeartIcon} className="size-3.5" />
                    {cert.reactions}
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
