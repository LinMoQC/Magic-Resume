import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { isCloudMode } from '@/lib/config/app';
import { hasBetaAccess } from '@/lib/auth/betaAccess';

// The public marketing site lives in the standalone Astro app (apps/landing).
// The Next.js app is app-only and requires sign-in, so route the root to:
//   self-hosted                → /dashboard (open)
//   cloud, signed out          → /sign-in
//   cloud, whitelisted / admin → /dashboard
//   cloud, signed-in others    → /coming-soon (countdown + reserve)
export default async function Home() {
  if (isCloudMode) {
    const { userId } = await auth();
    if (!userId) redirect('/sign-in');
    if (await hasBetaAccess()) redirect('/dashboard');
    redirect('/coming-soon');
  }
  redirect('/dashboard');
}
