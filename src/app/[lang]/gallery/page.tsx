import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import { listTemplates } from "@/components/certificate/template-registry"
import { CertificateRenderer } from "@/components/certificate/certificate-renderer"

const baseUrl = 'https://fluencycert.com'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const t = await getTranslations({ locale: lang, namespace: 'meta' })

  return {
    title: t('galleryTitle'),
    description: t('galleryDescription'),
    alternates: {
      canonical: `/${lang}/gallery`,
      languages: {
        en: `${baseUrl}/en/gallery`,
        uk: `${baseUrl}/uk/gallery`,
      },
    },
    openGraph: {
      title: t('galleryTitle'),
      description: t('galleryDescription'),
      url: `${baseUrl}/${lang}/gallery`,
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}

const fakeUsers: Record<string, {
  fullName: string
  englishLevel: string
  speakingClubsCount: number
  hoursParticipated: number | null
  adminFeedback: string
  createdAt: string
  slug: string
}> = {
  "guilloche-security": {
    fullName: "Sarah Chen",
    englishLevel: "C1",
    speakingClubsCount: 3,
    hoursParticipated: 120,
    adminFeedback: "Excellent speaking skills demonstrated through consistent club participation across multiple venues.",
    createdAt: "2025-12-15T10:00:00Z",
    slug: "DEMOGUI",
  },
  "modern-glass": {
    fullName: "Marcus Johnson",
    englishLevel: "B2",
    speakingClubsCount: 2,
    hoursParticipated: 85,
    adminFeedback: "Great improvement shown over the past quarter. Confident and articulate speaker.",
    createdAt: "2026-02-20T14:30:00Z",
    slug: "DEMOMOD",
  },
  "neubrutal": {
    fullName: "Elena Rodriguez",
    englishLevel: "C1",
    speakingClubsCount: 4,
    hoursParticipated: 200,
    adminFeedback: "Outstanding dedication to public speaking. Regularly leads club discussion sessions.",
    createdAt: "2025-11-08T09:15:00Z",
    slug: "DEMONEU",
  },
  "memphis-retro": {
    fullName: "Aisha Patel",
    englishLevel: "C2",
    speakingClubsCount: 5,
    hoursParticipated: 250,
    adminFeedback: "Exceptional fluency and command of the language. A true inspiration to other members.",
    createdAt: "2026-01-10T16:45:00Z",
    slug: "DEMOMEM",
  },
  "cyber-neon": {
    fullName: "David Kim",
    englishLevel: "Native",
    speakingClubsCount: 6,
    hoursParticipated: null,
    adminFeedback: "Demonstrates native-level proficiency. Leads advanced conversation circles with ease.",
    createdAt: "2026-03-05T11:20:00Z",
    slug: "DEMOCYB",
  },
  "natural-green": {
    fullName: "Priya Sharma",
    englishLevel: "A2",
    speakingClubsCount: 8,
    hoursParticipated: 24,
    adminFeedback: "Remarkable progress for a beginner. Shows great enthusiasm and willingness to learn.",
    createdAt: "2026-04-01T08:00:00Z",
    slug: "DEMOGRE",
  },
}

export default async function GalleryPage({ params }: { params: Promise<{ lang: string }> }) {
  const t = await getTranslations('gallery')
  const td = await getTranslations('templateDescriptions')
  const tn = await getTranslations('templateNames')
  const templates = listTemplates()

  return (
    <div className="min-h-screen bg-gradient-to-b from-bright-sky/5 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
          {t('backToHome')}
        </Link>

        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-graphite dark:text-snow md:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-2xl">
            {t('subtitle')}
          </p>
        </div>

        <div className="space-y-16">
          {templates.map((template) => {
            const user = fakeUsers[template.id] ?? fakeUsers["guilloche-security"]

            return (
              <section key={template.id}>
                <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-graphite dark:text-snow">
                    {tn(template.name)}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {template.id === "guilloche-security" && td('guillocheSecurity')}
                    {template.id === "modern-glass" && td('modernGlass')}
                    {template.id === "neubrutal" && td('neubrutal')}
                    {template.id === "memphis-retro" && td('memphisRetro')}
                    {template.id === "cyber-neon" && td('cyberNeon')}
                    {template.id === "natural-green" && td('naturalGreen')}
                  </p>
                </div>
                <CertificateRenderer
                  templateId={template.id}
                  fullName={user.fullName}
                  englishLevel={user.englishLevel}
                  speakingClubsCount={user.speakingClubsCount}
                  hoursParticipated={user.hoursParticipated}
                  adminFeedback={user.adminFeedback}
                  createdAt={user.createdAt}
                  slug={user.slug}
                />
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
