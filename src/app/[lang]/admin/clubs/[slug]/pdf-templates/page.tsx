import { getTranslations } from 'next-intl/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { isClubAdmin, isMasterAdmin } from '@/lib/clubs'
import { ClubPdfTemplateList } from './club-pdf-template-list'

export default async function AdminClubPdfTemplatesPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const [{ lang, slug }, { userId }] = await Promise.all([params, auth()])
  if (!userId) redirect(`/${lang}`)

  const supabase = createAdminClient()
  const [t, { data: club }] = await Promise.all([
    getTranslations('adminPdfTemplates'),
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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{club.name}</h1>
      <p className="text-muted-foreground mb-8">{t('title')}</p>

      <ClubPdfTemplateList />
    </div>
  )
}
