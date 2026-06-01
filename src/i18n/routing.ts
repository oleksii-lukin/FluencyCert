import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  locales: ['en', 'uk'],
  defaultLocale: 'en',
  localePrefix: 'always',
  localeDetection: true,
})

export const { Link, useRouter, usePathname, redirect, getPathname } = createNavigation(routing)
