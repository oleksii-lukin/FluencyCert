import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import fs from 'fs';
import path from 'path';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

function copyPdfWorker() {
  try {
    const src = path.resolve('node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
    const dest = path.resolve('public/pdf.worker.min.mjs');
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log('✅ Copied pdf.worker.min.mjs to public/');
    } else {
      console.warn('⚠️ pdf.worker.min.mjs not found in node_modules');
    }
  } catch (e) {
    console.error('❌ Failed to copy pdf.worker.min.mjs:', e);
  }
}

copyPdfWorker();

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com'
      }
    ],
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default withNextIntl(nextConfig);
