import { getTranslations } from 'next-intl/server'
import { listTemplates } from "@/components/certificate/template-registry"
import { CertificateRenderer } from "@/components/certificate/certificate-renderer"
import { PublicPageLayout } from "@/components/layout/public-page-layout"
import { GalleryTabs } from "@/components/gallery-tabs"
import Image from 'next/image'
import { siteConfig } from '@/lib/site'

const baseUrl = siteConfig.baseUrl

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

interface MockPdfPreview {
  imagePath: string
  pdfTemplateId: string
  fullName: string
  englishLevel: string
  speakingClubsCount: number
  hoursParticipated: number | null
  adminFeedback: string
  createdAt: string
  slug: string
  customVariables?: Record<string, string>
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

const mockPdfPreviews: MockPdfPreview[] = [
  {
    imagePath: "/37PWXC.webp",
    pdfTemplateId: "navy-gold",
    fullName: "Arlo Frost",
    englishLevel: "A2",
    speakingClubsCount: 19,
    hoursParticipated: 183,
    adminFeedback: "Meets all requirements. Great speaking ability demonstrated.",
    createdAt: "2026-05-16T08:21:11.089008Z",
    slug: "37PWXC",
    customVariables: {
      masterclassName: "Business English Masterclass",
      masterclassDescription: "Advanced business communication, negotiation tactics, and cross-cultural management.",
    },
  },
  {
    imagePath: "/4T75DP.webp",
    pdfTemplateId: "navy-gold",
    fullName: "Fern Lutz",
    englishLevel: "A1",
    speakingClubsCount: 8,
    hoursParticipated: 54,
    adminFeedback: "Good progress. English level meets the threshold for certification.",
    createdAt: "2026-05-12T08:21:11.089008Z",
    slug: "4T75DP",
    customVariables: {
      masterclassName: "Presentation Skills Workshop",
      masterclassDescription: "Structuring and delivering impactful presentations with confidence.",
    },
  },
  {
    imagePath: "/J737C4.webp",
    pdfTemplateId: "elegant-gold",
    fullName: "Elowen Pierce",
    englishLevel: "B2",
    speakingClubsCount: 3,
    hoursParticipated: 38,
    adminFeedback: "hgivig",
    createdAt: "2026-06-10T08:21:10.167354Z",
    slug: "J737C4",
  },
  {
    imagePath: "/QQPG5W.webp",
    pdfTemplateId: "elegant-gold",
    fullName: "Phineas Vance",
    englishLevel: "C1",
    speakingClubsCount: 12,
    hoursParticipated: 55,
    adminFeedback: "Solid performance. Approved with distinction.",
    createdAt: "2026-05-15T08:21:11.089008Z",
    slug: "QQPG5W",
  },
  {
    imagePath: "/6OXI5J.webp",
    pdfTemplateId: "leadership",
    fullName: "Wilder Dalton",
    englishLevel: "C1",
    speakingClubsCount: 17,
    hoursParticipated: 44,
    adminFeedback: "Strong performance across all criteria. Certificate approved.",
    createdAt: "2026-05-20T08:21:11.089008Z",
    slug: "6OXI5J",
    customVariables: {
      facilitatorName: "Dr. Sarah Mitchell",
      coordinatorName: "Prof. James Anderson",
    },
  },
  {
    imagePath: "/XVMWDS.webp",
    pdfTemplateId: "leadership",
    fullName: "Aurora Hughes",
    englishLevel: "B1",
    speakingClubsCount: 9,
    hoursParticipated: 168,
    adminFeedback: "Good progress. English level meets the threshold for certification.",
    createdAt: "2026-05-21T08:21:11.089008Z",
    slug: "XVMWDS",
    customVariables: {
      facilitatorName: "Dr. Sarah Mitchell",
      coordinatorName: "Prof. Michael Torres",
    },
  },
]

const pdfTemplateMeta: Record<string, {
  nameKey: string
  descKey: string
  featureKeys: string[]
}> = {
  "navy-gold": {
    nameKey: "navyGold",
    descKey: "navyGold",
    featureKeys: ["qrCode", "customVariables", "multipleLayouts", "customFonts"],
  },
  "elegant-gold": {
    nameKey: "elegantGold",
    descKey: "elegantGold",
    featureKeys: ["qrCode", "multipleLayouts", "customFonts"],
  },
  "leadership": {
    nameKey: "leadership",
    descKey: "leadership",
    featureKeys: ["qrCode", "customVariables", "dualSignatures", "multipleLayouts", "customFonts"],
  },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function GalleryPage() {
  const [t, td, tn, pf] = await Promise.all([
    getTranslations('gallery'),
    getTranslations('templateDescriptions'),
    getTranslations('templateNames'),
    getTranslations('pdfFeatures'),
  ])
  const templates = listTemplates()
  const pdfTemplateIds = Object.keys(pdfTemplateMeta)

  function renderFeatureBadge(key: string) {
    return (
      <span
        key={key}
        className="inline-flex items-center rounded-full bg-bright-sky/10 px-2.5 py-0.5 text-xs font-medium text-bright-sky"
      >
        {pf(key)}
      </span>
    )
  }

  function renderPdfPreview(preview: MockPdfPreview) {
    return (
      <div key={preview.slug} className="rounded-xl border bg-white dark:bg-graphite overflow-hidden">
        <div className="aspect-[1.414/1] relative bg-muted">
          <Image
            src={preview.imagePath}
            alt={`${preview.fullName} certificate`}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-contain"
          />
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-graphite dark:text-snow">
                {preview.fullName}
              </h4>
              <p className="text-xs text-muted-foreground">
                {preview.englishLevel} · {preview.speakingClubsCount} clubs
                {preview.hoursParticipated != null && ` · ${preview.hoursParticipated}h`}
              </p>
            </div>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {preview.slug}
            </span>
          </div>
          {preview.customVariables && Object.keys(preview.customVariables).length > 0 && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-2.5 space-y-1">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                {t('customValues')}
              </p>
              {Object.entries(preview.customVariables).map(([key, value]) => (
                <p key={key} className="text-xs text-amber-600 dark:text-amber-300">
                  <span className="font-mono text-[10px] opacity-60">{key}:</span> {value}
                </p>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground line-clamp-2">
            {preview.adminFeedback}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {t('issuedOn')} {formatDate(preview.createdAt)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <PublicPageLayout>
      <div className="mx-auto max-w-6xl px-4 pt-28 pb-16">
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-graphite dark:text-snow md:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-2xl">
            {t('subtitle')}
          </p>
        </div>

        <GalleryTabs
          webLabel={t('tabs.web')}
          pdfLabel={t('tabs.pdf')}
          webContent={
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
          }
          pdfContent={
            <div className="space-y-16">
              {pdfTemplateIds.map((templateId) => {
                const meta = pdfTemplateMeta[templateId]
                const previews = mockPdfPreviews.filter((p) => p.pdfTemplateId === templateId)

                return (
                  <section key={templateId}>
                    <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-semibold text-graphite dark:text-snow">
                            {tn(meta.nameKey)}
                          </h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            {td(meta.descKey)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 shrink-0">
                          {meta.featureKeys.map(renderFeatureBadge)}
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                      {previews.map(renderPdfPreview)}
                    </div>
                  </section>
                )
              })}
            </div>
          }
        />
      </div>
    </PublicPageLayout>
  )
}
