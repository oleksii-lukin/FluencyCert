import { getTranslations } from 'next-intl/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { PublicPageLayout } from "@/components/layout/public-page-layout"
import { ClubJoinButton } from './club-join-button'
import { ClubClaimButton } from './club-claim-button'
import { CertificateHolders } from './certificate-holders'

const baseUrl = 'https://fluencycert.com'

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params
  const supabase = createAdminClient()
  const { data: club } = await supabase
    .from('speaking_clubs')
    .select('name')
    .eq('slug', slug)
    .single()

  const clubName = club?.name ?? slug
  const t = await getTranslations({ locale: lang, namespace: 'meta' })

  return {
    title: t('clubTitle', { name: clubName }),
    description: t('clubDescription', { name: clubName }),
    alternates: {
      canonical: `/${lang}/clubs/${slug}`,
      languages: {
        en: `${baseUrl}/en/clubs/${slug}`,
        uk: `${baseUrl}/uk/clubs/${slug}`,
      },
    },
    openGraph: {
      title: t('clubTitle', { name: clubName }),
      description: t('clubDescription', { name: clubName }),
      url: `${baseUrl}/${lang}/clubs/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}

export default async function ClubDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { lang, slug } = await params
  const sp = await searchParams
  const page = parseInt(sp.page ?? '1', 10)
  const perPage = 20

  const t = await getTranslations('clubs')
  const supabase = createAdminClient()

  const { data: club } = await supabase
    .from('speaking_clubs')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!club) notFound()

  const { count: memberCount } = await supabase
    .from('club_memberships')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', club.id)

  const { count: totalCerts } = await supabase
    .from('certificate_claims')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', club.id)
    .eq('status', 'approved')

  const from = (page - 1) * perPage
  const to = from + perPage - 1
  const totalPages = Math.ceil((totalCerts ?? 0) / perPage)

  const { data: certificateHolders } = await supabase
    .from('certificate_claims')
    .select('slug, english_level, profiles!inner(id, first_name, last_name, avatar_url)')
    .eq('club_id', club.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(from, to)

  const { userId } = await auth()
  let isMember = false
  let isClubAdmin = false

  if (userId) {
    const { data: membership } = await supabase
      .from('club_memberships')
      .select('role')
      .eq('club_id', club.id)
      .eq('user_id', userId)
      .maybeSingle()

    if (membership) {
      isMember = true
      isClubAdmin = membership.role === 'admin'
    }
  }

  return (
    <PublicPageLayout>
      <div className="mx-auto max-w-4xl px-4 pt-28 pb-16">
        <div className="rounded-xl border border-banana-cream/20 bg-white/35 p-8 shadow-md shadow-banana-cream/10 backdrop-blur-xl mb-10 dark:bg-graphite/35">
          <h1 className="text-4xl font-bold mb-3">{club.name}</h1>
          {club.description && (
            <p className="text-lg text-muted-foreground mb-6">{club.description}</p>
          )}
          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
            <span>{memberCount ?? 0} {t('members')}</span>
            <span>{totalCerts ?? 0} {t('certificates')}</span>
          </div>

          <ClubJoinButton
            slug={slug}
            isMember={isMember}
            isAdmin={isClubAdmin}
            lang={lang}
          />

          {isMember && (
            <ClubClaimButton clubId={club.id} lang={lang} />
          )}
        </div>

        <h2 className="text-2xl font-semibold mb-6">{t('certificateHolders')}</h2>
        <CertificateHolders
          holders={certificateHolders ?? []}
          lang={lang}
          page={page}
          totalPages={totalPages}
          slug={slug}
        />
      </div>
    </PublicPageLayout>
  )
}
