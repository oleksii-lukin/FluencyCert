import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { PostHogIdentify } from "@/components/posthog-identify";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = 'https://fluencycert.com'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "FluencyCert - Prove Your English Fluency with a Verified Speaking Certificate",
  description:
    "Showcase your speaking club certificate, prove your English proficiency, and get feedback & reactions from the community.",
  openGraph: {
    type: 'website',
    siteName: 'FluencyCert',
    url: baseUrl,
    title: "FluencyCert - Speaking Club Certificate Platform",
    description:
      "Upload your speaking certificate, share your journey, and let the community celebrate your progress.",
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
    title: "FluencyCert - Speaking Club Certificate Platform",
    description:
      "Upload your speaking certificate, share your journey, and let the community celebrate your progress.",
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'apple-mobile-web-app-title': 'FluencyCert',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        outfit.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <Analytics />
        <SpeedInsights />
        <ClerkProvider>
          <PostHogIdentify />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}