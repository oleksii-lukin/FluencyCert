import { getTranslations } from 'next-intl/server'
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Certificate02Icon,
  LayoutGridIcon,
  HeartIcon,
  Message01Icon,
  Share01Icon,
  IdVerifiedIcon,
} from "@hugeicons/core-free-icons"

export async function FeaturesSection() {
  const t = await getTranslations('features')

  const features = [
    {
      icon: Certificate02Icon,
      title: t('certificateDisplay'),
      description: t('certificateDisplayDesc'),
      bg: "bg-bright-sky/15 dark:bg-bright-sky/20",
    },
    {
      icon: LayoutGridIcon,
      title: t('certificateTemplates'),
      description: t('certificateTemplatesDesc'),
      bg: "bg-bright-sky/20 dark:bg-bright-sky/25",
    },
    {
      icon: HeartIcon,
      title: t('upvoteRosette'),
      description: t('upvoteRosetteDesc'),
      bg: "bg-bright-sky/12 dark:bg-bright-sky/15",
    },
    {
      icon: Message01Icon,
      title: t('moderatedFeedback'),
      description: t('moderatedFeedbackDesc'),
      bg: "bg-harvest-orange/12 dark:bg-harvest-orange/15",
    },
    {
      icon: Share01Icon,
      title: t('shareAnywhere'),
      description: t('shareAnywhereDesc'),
      bg: "bg-banana-cream/15 dark:bg-banana-cream/10",
    },
    {
      icon: IdVerifiedIcon,
      title: t('adminVerification'),
      description: t('adminVerificationDesc'),
      bg: "bg-harvest-orange/10 dark:bg-harvest-orange/15",
    },
  ]

  return (
    <section id="features" className="bg-gradient-to-b from-bright-sky/5 via-white to-bright-sky/5 px-4 py-20 md:py-28 dark:from-graphite/90 dark:via-graphite dark:to-graphite/90">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-graphite dark:text-snow md:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-lg text-graphite/60 dark:text-snow/60">
            {t('subtitle')}
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
