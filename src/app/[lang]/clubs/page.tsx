import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { createAdminClient } from '@/lib/supabase/admin'
import { PublicPageLayout } from "@/components/layout/public-page-layout"

const baseUrl = 'https://fluencycert.com'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const t = await getTranslations({ locale: lang, namespace: 'meta' })

  return {
    title: t('clubsTitle'),
    description: t('clubsDescription'),
    alternates: {
      canonical: `/${lang}/clubs`,
      languages: {
        en: `${baseUrl}/en/clubs`,
        uk: `${baseUrl}/uk/clubs`,
      },
    },
    openGraph: {
      title: t('clubsTitle'),
      description: t('clubsDescription'),
      url: `${baseUrl}/${lang}/clubs`,
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}

export default async function ClubsPage() {
  const t = await getTranslations('clubs')
  const supabase = createAdminClient()

  const { data: clubs } = await supabase
    .from('speaking_clubs')
    .select('id, name, slug, description, translations')
    .order('name', { ascending: true })

  const clubsWithCounts = await Promise.all(
    (clubs ?? []).map(async (club) => {
      const { count: memberCount } = await supabase
        .from('club_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', club.id)

      const { count: certCount } = await supabase
        .from('certificate_claims')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', club.id)
        .eq('status', 'approved')

      return { ...club, member_count: memberCount ?? 0, certificate_count: certCount ?? 0 }
    }),
  )

  return (
    <PublicPageLayout>
      <div className="mx-auto max-w-6xl px-4 pt-28 pb-16">
        <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
        <p className="text-lg text-muted-foreground mb-10">{t('subtitle')}</p>

        {clubsWithCounts.length === 0 && (
          <p className="text-muted-foreground">{t('noClubs')}</p>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clubsWithCounts.map((club) => (
            <Link
              key={club.id}
              href={`/clubs/${club.slug}`}
              className="rounded-xl border border-banana-cream/20 bg-white/35 p-6 shadow-md shadow-banana-cream/10 backdrop-blur-xl transition-shadow hover:shadow-xl hover:shadow-banana-cream/20 dark:bg-graphite/35"
            >
              <h3 className="text-xl font-semibold mb-2">{club.name}</h3>
              {club.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{club.description}</p>
              )}
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{club.member_count} {t('members')}</span>
                <span>{club.certificate_count} {t('certificates')}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PublicPageLayout>
  )
}
