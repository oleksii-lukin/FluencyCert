import { getTranslations } from 'next-intl/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from '@/i18n/routing'
import { getAdminClubIds, isMasterAdmin } from '@/lib/clubs'
import { ClaimsTable } from '@/components/admin/claims-table'

export default async function AdminClaimsPage({ params }: { params: Promise<{ lang: string }> }) {
  const [{ lang }, { userId }, t] = await Promise.all([params, auth(), getTranslations('admin')])
  if (!userId) return redirect({ href: '/', locale: lang })

  const supabase = createAdminClient()

  const [isMaster, adminClubIds] = await Promise.all([isMasterAdmin(userId), getAdminClubIds(userId)])

  if (!isMaster && adminClubIds.length === 0) {
    redirect({ href: '/', locale: lang })
  }

  let query = supabase
    .from('certificate_claims')
    .select('*, profiles!inner(id, email, first_name, last_name, avatar_url, telegram_id, telegram_username, linkedin_url), pdf_templates!left(name), pdf_template_variants!left(name)')
    .order('created_at', { ascending: false })

  if (!isMaster && adminClubIds.length > 0) {
    query = query.in('club_id', adminClubIds)
  }

  if (!isMaster && adminClubIds.length === 0) {
    redirect({ href: '/', locale: lang })
  }

  const { data: claims } = await query

  const clubIds = [...new Set((claims ?? []).map((c) => c.club_id).filter((id): id is string => id !== null))]
  const { data: clubs } = clubIds.length > 0
    ? await supabase.from('speaking_clubs').select('id, name').in('id', clubIds)
    : { data: [] }
  const clubMap = new Map((clubs ?? []).map((c) => [c.id, c.name]))

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t('certificateClaims')}</h1>

      <ClaimsTable claims={claims ?? []} clubMap={clubMap} isMaster={isMaster} lang={lang} />
    </div>
  )
}
