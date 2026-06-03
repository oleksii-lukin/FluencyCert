import { getTranslations } from 'next-intl/server'
import { TemplateFieldEditor } from './template-field-editor'

export default async function TemplateFieldsPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params
  const t = await getTranslations('adminPdfTemplates')

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t('fieldMappingTitle')}</h1>
      <TemplateFieldEditor templateId={id} lang={lang} />
    </div>
  )
}
