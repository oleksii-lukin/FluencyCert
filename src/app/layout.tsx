import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

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

export const metadata: Metadata = {
  title: "FluencyCert - Prove Your English Fluency with a Verified Speaking Certificate",
  description:
    "Showcase your speaking club certificate, prove your English proficiency, and get feedback & reactions from the community.",
  openGraph: {
    title: "FluencyCert - Speaking Club Certificate Platform",
    description:
      "Upload your speaking certificate, share your journey, and let the community celebrate your progress.",
  },
};

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
      <head>
        <meta name="apple-mobile-web-app-title" content="FluencyCert" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
