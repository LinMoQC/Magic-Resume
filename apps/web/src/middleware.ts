import { NextRequest, NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const APP_MODE = process.env.NEXT_PUBLIC_APP_MODE || 'self-hosted';
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

// cloud: Clerk protects /dashboard routes
const cloudHandler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

// self-hosted: all routes open, no auth required
function selfHostedHandler(_req: NextRequest) { // eslint-disable-line @typescript-eslint/no-unused-vars
  return NextResponse.next();
}

export default APP_MODE === 'cloud' ? cloudHandler : selfHostedHandler;

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
