'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/routing'

export function LanguageToggle() {
  const pathname = usePathname()
  const router = useRouter()
  const currentLocale = useLocale()

  const isEn = currentLocale === 'en'

  function switchLocale(locale: string) {
    router.replace(pathname, { locale: locale as 'en' | 'uk' })
  }

  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-bright-sky/40 shadow-sm shadow-bright-sky/10">
      <button
        type="button"
        onClick={() => switchLocale('en')}
        className={`border-r border-bright-sky/40 px-2.5 py-1 text-xs font-semibold transition-colors ${
          isEn
            ? 'bg-bright-sky text-white shadow-sm'
            : 'text-muted-foreground hover:bg-bright-sky/10 hover:text-foreground'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchLocale('uk')}
        className={`px-2.5 py-1 text-xs font-semibold transition-colors ${
          !isEn
            ? 'bg-bright-sky text-white shadow-sm'
            : 'text-muted-foreground hover:bg-bright-sky/10 hover:text-foreground'
        }`}
      >
        UA
      </button>
    </div>
  )
}
