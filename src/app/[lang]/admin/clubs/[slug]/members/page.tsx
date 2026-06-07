import { getTranslations } from 'next-intl/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { isClubAdmin, isMasterAdmin } from '@/lib/clubs'
import { ClubMembersList } from './club-members-list'

export default async function AdminClubMembersPage({
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

  const { data: members } = await supabase
    .from('club_memberships')
    .select('user_id, role, created_at, profiles!inner(id, email, first_name, last_name, avatar_url, telegram_id, telegram_username, linkedin_url)')
    .eq('club_id', club.id)
    .order('created_at', { ascending: false })

  const userIds = (members ?? []).map((m) => m.user_id) as string[]
  const { data: claims } = userIds.length > 0
    ? await supabase
        .from('certificate_claims')
        .select('user_id, status, slug')
        .in('user_id', userIds)
        .eq('club_id', club.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  const latestClaimByUserId = new Map<string, { slug: string; status: string }>()
  claims?.forEach((c) => {
    if (!latestClaimByUserId.has(c.user_id)) {
      latestClaimByUserId.set(c.user_id, c)
    }
  })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{club.name}</h1>
      <p className="text-muted-foreground mb-8">{t('members')}</p>

      <ClubMembersList
        members={(members ?? []).map((m) => ({
          user_id: m.user_id,
          email: m.profiles.email,
          first_name: m.profiles.first_name,
          last_name: m.profiles.last_name,
          avatar_url: m.profiles.avatar_url,
          telegram_id: m.profiles.telegram_id,
          telegram_username: m.profiles.telegram_username,
          linkedin_url: m.profiles.linkedin_url,
          role: m.role,
          joined_at: m.created_at,
          claim: latestClaimByUserId.get(m.user_id) ?? null,
        }))}
        clubSlug={slug}
        lang={lang}
      />
    </div>
  )
}
