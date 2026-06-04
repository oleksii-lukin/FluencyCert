import { getTranslations } from 'next-intl/server'
import { FontList } from './font-list'

export default async function AdminFontsPage() {
  const t = await getTranslations('adminFonts')

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
      <FontList />
    </div>
  )
}
