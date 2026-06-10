import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CertificateRenderer } from '@/components/certificate/certificate-renderer'
import { PdfCertificateViewer } from '@/components/certificate/pdf-certificate-viewer'
import { UpvoteRosette } from '@/components/certificate/upvote-rosette'
import { TestimonialsMarquee } from '@/components/certificate/testimonials-marquee'
import { FeedbackForm } from '@/components/certificate/feedback-form'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import '@/components/certificate/guilloche-pattern.css'
import { siteConfig } from '@/lib/site'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ lang: string; slug: string }>
}

const baseUrl = siteConfig.baseUrl

export async function generateMetadata({ params }: PageProps) {
  const { lang, slug } = await params
  const supabase = createAdminClient()
  const { data: claim } = await supabase
    .from('certificate_claims')
    .select('*, profiles!inner(first_name, last_name)')
    .eq('slug', slug.toUpperCase())
    .single()

  if (!claim || claim.status !== 'approved') {
    return { title: 'Certificate Not Found - FluencyCert' }
  }

  const meta = await getTranslations('meta')
  const name = [claim.profiles.first_name, claim.profiles.last_name].filter(Boolean).join(' ') || 'Certificate'

  return {
    title: meta('certificateTitle', { name }),
    description: meta('certificateDescription', { name }),
    alternates: {
      canonical: `/${lang}/certificate/${slug}`,
      languages: {
        en: `${baseUrl}/en/certificate/${slug}`,
        uk: `${baseUrl}/uk/certificate/${slug}`,
      },
    },
    openGraph: {
      title: meta('certificateTitle', { name }),
      description: meta('certificateDescription', { name }),
      url: `${baseUrl}/${lang}/certificate/${slug}`,
      type: 'profile',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${name} — FluencyCert Certificate`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta('certificateTitle', { name }),
      description: meta('certificateDescription', { name }),
      images: ['/og-image.png'],
    },
  }
}

export default async function CertificatePage({ params }: PageProps) {
  const { lang, slug } = await params
  const supabase = createAdminClient()

  const [{ userId }, t, { data: claim }] = await Promise.all([
    auth(),
    getTranslations('certificatePage'),
    supabase
      .from('certificate_claims')
      .select('*, profiles!inner(id, email, first_name, last_name, username, avatar_url)')
      .eq('slug', slug.toUpperCase())
      .single(),
  ])

  if (!claim || claim.status !== 'approved') {
    notFound()
  }

  const profile = claim.profiles
  const id = claim.id

  const { count: dbCount } = await supabase
    .from('certificate_upvotes')
    .select('id', { count: 'exact', head: true })
    .eq('certificate_id', id)

  const upvoteCount = dbCount ?? 0

  const { data: feedbacks } = await supabase
    .from('certificate_feedback')
    .select('*, profiles!inner(id, first_name, last_name, username, avatar_url)')
    .eq('certificate_id', id)
    .eq('is_visible', true)
    .eq('status', 'approved')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  let feedbacksWithCertIds: Array<Record<string, unknown>> | null = null
  if (feedbacks && feedbacks.length > 0) {
    const reviewerIds = [...new Set(feedbacks.map((f) => f.reviewer_id))]
    const { data: reviewerClaims } = await supabase
      .from('certificate_claims')
      .select('user_id, slug')
      .eq('status', 'approved')
      .in('user_id', reviewerIds)

    const certByUserId = new Map((reviewerClaims ?? []).map((c) => [c.user_id, c.slug]))
    feedbacksWithCertIds = feedbacks.map((f) => ({
      ...f,
      reviewer_certificate_id: certByUserId.get(f.reviewer_id) || null,
    }))
  }

  let hasUpvoted = false
  let canUpvote = false
  let canLeaveFeedback = false

  if (userId) {
    const { data: ownClaim } = await supabase
      .from('certificate_claims')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .maybeSingle()

    if (ownClaim && ownClaim.id !== id) {
      canUpvote = true
      canLeaveFeedback = true

      const { data: existingFeedback } = await supabase
        .from('certificate_feedback')
        .select('id')
        .eq('certificate_id', id)
        .eq('reviewer_id', userId)
        .maybeSingle()

      if (existingFeedback) {
        canLeaveFeedback = false
      }
    }

    const { data: existingUpvote } = await supabase
      .from('certificate_upvotes')
      .select('id')
      .eq('certificate_id', id)
      .eq('user_id', userId)
      .maybeSingle()

    hasUpvoted = !!existingUpvote
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || t('certificateHolder')

  interface PdfTemplateField {
    id: string
    pdf_field_name: string
    source_type: string
    source_key: string | null
    display_label: string
    is_enabled: boolean
    font_family: string
    font_size: number
    font_source: string
    font_variant: string
    uploaded_font_key: string | null
    font_id: string | null
    custom_default_value: string | null
    date_format: string | null
    level_format: string | null
    multiline: boolean
    text_color: string | null
    qr_dots_color: string
    qr_bg_color: string
    qr_dots_type: string
    qr_corners_type: string
    qr_corners_color: string
    sort_order: number
  }

  let pdfTemplateData: {
    fileUrl: string
    fields: PdfTemplateField[]
    customValues: Record<string, string>
  } | null = null

  if (claim.pdf_template_id) {
    const { data: template } = await supabase
      .from('pdf_templates')
      .select('*, pdf_template_fields(*)')
      .eq('id', claim.pdf_template_id)
      .order('sort_order', { foreignTable: 'pdf_template_fields', ascending: true })
      .single()

    if (template) {
      const fields = (template.pdf_template_fields ?? []) as PdfTemplateField[]

      let fileUrl = template.file_url as string
      let effectiveFields = fields

      if (claim.pdf_template_variant_id) {
        const { data: variant } = await supabase
          .from('pdf_template_variants')
          .select('*, pdf_template_field_overrides(*)')
          .eq('id', claim.pdf_template_variant_id)
          .single()

        if (variant) {
          fileUrl = variant.file_url
          const overrides = (variant.pdf_template_field_overrides ?? []) as Array<Record<string, unknown>>
          const overrideMap: Record<string, Record<string, unknown>> = {}
          for (const o of overrides) {
            overrideMap[o.field_id as string] = o
          }
          effectiveFields = fields.map((f) => {
            const ov = overrideMap[f.id]
            if (!ov) return f
            return {
              ...f,
              ...(ov.font_family != null ? { font_family: ov.font_family as string } : {}),
              ...(ov.font_size != null ? { font_size: ov.font_size as number } : {}),
              ...(ov.font_source != null ? { font_source: ov.font_source as string } : {}),
              ...(ov.font_variant != null ? { font_variant: ov.font_variant as string } : {}),
              ...(ov.uploaded_font_key != null ? { uploaded_font_key: ov.uploaded_font_key as string } : {}),
              ...(ov.font_id != null ? { font_id: ov.font_id as string } : {}),
              ...(ov.text_color != null ? { text_color: ov.text_color as string } : {}),
              ...(ov.display_label != null ? { display_label: ov.display_label as string } : {}),
              ...(ov.is_enabled != null ? { is_enabled: ov.is_enabled as boolean } : {}),
              ...(ov.multiline != null ? { multiline: ov.multiline as boolean } : {}),
              ...(ov.date_format != null ? { date_format: ov.date_format as string } : {}),
              ...(ov.level_format != null ? { level_format: ov.level_format as string } : {}),
              ...(ov.custom_default_value != null ? { custom_default_value: ov.custom_default_value as string } : {}),
              ...(ov.custom_overridable != null ? { custom_overridable: ov.custom_overridable as boolean } : {}),
              ...(ov.qr_dots_color != null ? { qr_dots_color: ov.qr_dots_color as string } : {}),
              ...(ov.qr_bg_color != null ? { qr_bg_color: ov.qr_bg_color as string } : {}),
              ...(ov.qr_dots_type != null ? { qr_dots_type: ov.qr_dots_type as string } : {}),
              ...(ov.corners_type != null ? { qr_corners_type: ov.qr_corners_type as string } : {}),
              ...(ov.qr_corners_color != null ? { qr_corners_color: ov.qr_corners_color as string } : {}),
            }
          })
        }
      }

      const { data: customVals } = await supabase
        .from('pdf_custom_values')
        .select('field_id, value')
        .eq('claim_id', claim.id)

      const vals: Record<string, string> = {}
      for (const cv of customVals ?? []) {
        vals[cv.field_id] = cv.value
      }

      pdfTemplateData = {
        fileUrl,
        fields: effectiveFields,
        customValues: vals,
      }
    }
  }

  const certJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Certification',
    name: 'English Proficiency Certificate',
    url: `${baseUrl}/${lang}/certificate/${claim.slug}`,
    certificationStatus: 'CertificationActive',
    issuedBy: {
      '@type': 'Organization',
      name: 'FluencyCert',
      url: baseUrl,
    },
    credentialSubject: {
      '@type': 'Person',
      name: fullName,
    },
    validFrom: claim.created_at,
    description: `${claim.english_level || 'English'} proficiency verified through speaking club participation.`,
  }

  return (
    <>
      <script
        type="application/ld+json"
      >
        {JSON.stringify(certJsonLd)}
      </script>
      <div className="min-h-screen bg-gradient-to-b from-bright-sky/5 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
          {t('backToHome')}
        </Link>

        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-start">
          <div className="flex-1">
            {pdfTemplateData ? (
              <div className="w-full">
                <PdfCertificateViewer
                  templateFileUrl={pdfTemplateData.fileUrl}
                  fields={pdfTemplateData.fields}
                  certificateData={{
                    fullName,
                    englishLevel: claim.english_level || 'Not specified',
                    speakingClubsCount: claim.speaking_clubs_count ?? 0,
                    hoursParticipated: claim.hours_participated,
                    adminFeedback: claim.admin_feedback,
                    createdAt: claim.approved_at ?? claim.created_at,
                    slug: claim.slug,
                  }}
                  customValues={pdfTemplateData.customValues}
                  certificateUrl={`${baseUrl}/${lang}/certificate/${claim.slug}`}
                  viewerLocale={lang}
                />
              </div>
            ) : (
              <CertificateRenderer
                templateId={claim.background_template || 'guilloche-security'}
                fullName={fullName}
                englishLevel={claim.english_level || 'Not specified'}
                speakingClubsCount={claim.speaking_clubs_count ?? 0}
                hoursParticipated={claim.hours_participated}
                adminFeedback={claim.admin_feedback}
                createdAt={claim.approved_at ?? claim.created_at}
                slug={claim.slug}
              />
            )}
          </div>

          <div className="flex shrink-0 justify-center lg:pt-12 lg:self-start">
            <UpvoteRosette
              slug={claim.slug}
              initialCount={upvoteCount}
              initialHasUpvoted={hasUpvoted}
              canUpvote={canUpvote}
            />
          </div>
        </div>

        <TestimonialsMarquee feedbacks={(feedbacksWithCertIds ?? feedbacks ?? []) as any} />

        {canLeaveFeedback && (
          <div className="mx-auto mt-6 max-w-xl">
            <FeedbackForm slug={claim.slug} />
          </div>
        )}

        <div className="mt-12 border-t border-gray-100 py-6 text-center text-xs text-muted-foreground dark:border-gray-800">
          <p>{t('footer')}</p>
        </div>
      </div>
    </div>
    </>
  )
}
