import { getTranslations } from 'next-intl/server'
import { PdfTemplateList } from './pdf-template-list'

export default async function AdminPdfTemplatesPage() {
  const t = await getTranslations('adminPdfTemplates')

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
      <PdfTemplateList />
    </div>
  )
}
