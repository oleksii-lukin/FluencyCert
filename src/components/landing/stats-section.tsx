import { getTranslations } from 'next-intl/server'
import { HugeiconsIcon } from "@hugeicons/react"
import { Globe02Icon, Award01Icon, MessageMultiple01Icon, StarIcon } from "@hugeicons/core-free-icons"

export async function StatsSection() {
  const t = await getTranslations('stats')

  const stats = [
    { value: "50+", label: t('speakingClubs'), icon: Globe02Icon },
    { value: "12.4K", label: t('certificatesIssued'), icon: Award01Icon },
    { value: "56K+", label: t('reactionsSent'), icon: MessageMultiple01Icon },
    { value: "4.8", label: t('averageRating'), icon: StarIcon },
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-graphite to-graphite/95 px-4 py-16 md:py-20 dark:from-black dark:to-graphite/80">
      <div className="absolute inset-0" />
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
