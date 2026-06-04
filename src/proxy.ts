import { clerkMiddleware } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export default clerkMiddleware((auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/') || pathname.startsWith('/__clerk/') || pathname.startsWith('/_next/') || pathname.startsWith('/trpc/')) {
    return NextResponse.next();
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|mjs|js(?!on)|jpe?g|json|webp|png|gif|svg|pdf|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for Clerk's auto-proxy path
    '/__clerk/(.*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};