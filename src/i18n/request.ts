import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

const messagesImport: Record<string, () => Promise<{ default: any }>> = {
  en: () => import('../../messages/en.json'),
  uk: () => import('../../messages/uk.json'),
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as 'en' | 'uk')) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await (messagesImport[locale]?.() ?? messagesImport.en())).default,
  }
})
