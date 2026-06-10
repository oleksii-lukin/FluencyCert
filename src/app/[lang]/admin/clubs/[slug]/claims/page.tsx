import { getTranslations } from 'next-intl/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { isClubAdmin, isMasterAdmin } from '@/lib/clubs'
import { ClaimsTable } from '@/components/admin/claims-table'

export default async function AdminClubClaimsPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const [{ lang, slug }, { userId }] = await Promise.all([params, auth()])
  if (!userId) redirect(`/${lang}`)

  const supabase = createAdminClient()
  const [t, { data: club }] = await Promise.all([
    getTranslations('admin'),
    supabase
      .from('speaking_clubs')
      .select('id, name')
      .eq('slug', slug)
      .single(),
  ])

  if (!club) notFound()

  const [isMaster, isClubAdm] = await Promise.all([
    isMasterAdmin(userId),
    isClubAdmin(userId, club.id),
  ])
  if (!isMaster && !isClubAdm) redirect(`/${lang}/admin`)

  const { data: claims } = await supabase
    .from('certificate_claims')
    .select('*, profiles!inner(id, email, first_name, last_name, avatar_url, telegram_id, telegram_username, linkedin_url), pdf_templates!left(name), pdf_template_variants!left(name)')
    .eq('club_id', club.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{club.name}</h1>
      <p className="text-muted-foreground mb-8">{t('certificateClaims')}</p>

      <ClaimsTable claims={claims ?? []} clubMap={new Map()} isMaster={false} lang={lang} />
    </div>
  )
}
