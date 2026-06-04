import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';

const baseUrl = 'https://fluencycert.com'

const localeToOgLocale: Record<string, string> = {
  en: 'en_US',
  uk: 'uk_UA',
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'meta' });

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `/${lang}`,
      languages: {
        en: `${baseUrl}/en`,
        uk: `${baseUrl}/uk`,
      },
    },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      locale: localeToOgLocale[lang] ?? 'en_US',
      url: `${baseUrl}/${lang}`,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'FluencyCert — Verified English Speaking Certificates',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
      images: ['/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

async function loadMessages(locale: string) {
  return (await import(`../../../messages/${locale}.json`)).default;
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  const messages = await loadMessages(lang);

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
