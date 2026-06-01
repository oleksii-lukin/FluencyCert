import { HugeiconsIcon } from "@hugeicons/react"
import { StarIcon } from "@hugeicons/core-free-icons"

const testimonials = [
  {
    name: "David Kim",
    role: "Speaking Club Member",
    text: "The verification process was smooth. I submitted my club info and had my certificate approved within a day. Now I share it on my LinkedIn and job applications.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Club Coordinator",
    text: "We recommend FluencyCert to all our members. The certificates look professional with the template options, and members love the upvote and feedback system.",
    rating: 5,
  },
  {
    name: "Carlos Mendez",
    role: "English Learner",
    text: "Getting my speaking hours recognized with a verified certificate pushed me to attend more clubs. The feedback from other approved members keeps me motivated.",
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-gradient-to-b from-white via-bright-sky/[0.03] to-bright-sky/10 px-4 py-20 md:py-28 dark:from-graphite dark:via-graphite/95 dark:to-graphite/90">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-graphite dark:text-snow md:text-4xl">
            Loved by the Community
          </h2>
          <p className="mt-4 text-lg text-graphite/60 dark:text-snow/60">
            Hear from members who earned their verified certificates.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-bright-sky/10 bg-white p-6 shadow-sm shadow-bright-sky/5 transition-all duration-300 hover:border-bright-sky/25 hover:shadow-lg hover:shadow-bright-sky/15 dark:border-snow/10 dark:bg-graphite/80 dark:shadow-black/10 dark:hover:border-bright-sky/30 dark:hover:shadow-bright-sky/10"
            >
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <HugeiconsIcon key={i} icon={StarIcon} className="size-4 text-banana-cream" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-graphite/65 dark:text-snow/65">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-snow/10">
                <div className="flex size-9 items-center justify-center rounded-full bg-bright-sky/20 text-sm font-semibold text-bright-sky dark:bg-bright-sky/25">
                  {t.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-graphite dark:text-snow">{t.name}</p>
                  <p className="text-xs text-graphite/45 dark:text-snow/45">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
