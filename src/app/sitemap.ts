import { createAdminClient } from '@/lib/supabase/admin'

const baseUrl = 'https://fluencycert.com'
const locales = ['en', 'uk'] as const

export default async function sitemap() {
  const supabase = createAdminClient()

  const [certificates, clubs] = await Promise.all([
    supabase.from('certificate_claims').select('slug, created_at').eq('status', 'approved'),
    supabase.from('speaking_clubs').select('slug, created_at'),
  ])

  const entries: Array<{
    url: string
    lastModified?: Date | string
    changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
    priority?: number
    alternates?: { languages?: Record<string, string> }
  }> = []

  const makeAlternates = (path: string) => ({
    languages: Object.fromEntries(locales.map((l) => [l, `${baseUrl}/${l}${path}`])),
  })

  const addLocalized = (path: string, priority: number, changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never', lastModified?: Date | string) => {
    for (const lang of locales) {
      entries.push({
        url: `${baseUrl}/${lang}${path}`,
        lastModified: lastModified ?? new Date(),
        changeFrequency,
        priority,
        alternates: makeAlternates(path),
      })
    }
  }

  addLocalized('', 1.0, 'weekly')
  addLocalized('/clubs', 0.8, 'weekly')
  addLocalized('/gallery', 0.7, 'monthly')
  addLocalized('/terms', 0.3, 'monthly')
  addLocalized('/privacy', 0.3, 'monthly')

  for (const club of clubs.data ?? []) {
    addLocalized(`/clubs/${club.slug}`, 0.6, 'weekly', club.created_at ? new Date(club.created_at) : undefined)
  }

  for (const cert of certificates.data ?? []) {
    addLocalized(`/certificate/${cert.slug}`, 0.9, 'monthly', cert.created_at ? new Date(cert.created_at) : undefined)
  }

  return entries
}
