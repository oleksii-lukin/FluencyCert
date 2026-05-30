import { HugeiconsIcon } from "@hugeicons/react"
import { GlobeIcon, Award01Icon, MessageMultiple01Icon, StarIcon } from "@hugeicons/core-free-icons"

const stats = [
  { value: "50+", label: "Speaking Clubs", icon: GlobeIcon },
  { value: "12.4K", label: "Certificates Issued", icon: Award01Icon },
  { value: "56K+", label: "Reactions Sent", icon: MessageMultiple01Icon },
  { value: "4.8", label: "Average Rating", icon: StarIcon },
]

export function StatsSection() {
  return (
    <section className="relative overflow-hidden bg-graphite px-4 py-16 md:py-20">
      <div className="absolute inset-0 bg-gradient-to-r from-graphite via-graphite to-graphite/95" />
      <div className="absolute -top-20 -right-20 size-96 rounded-full bg-bright-sky/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 size-96 rounded-full bg-bright-sky/8 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bright-sky/5 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-bright-sky/10">
                <HugeiconsIcon icon={stat.icon} className="size-5 text-bright-sky" />
              </div>
              <p className="text-3xl font-bold text-snow">{stat.value}</p>
              <p className="mt-1 text-sm text-snow/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
