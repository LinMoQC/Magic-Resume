import { auth } from '@clerk/nextjs/server';
import { APP_MODE } from '@/lib/config/app';

/**
 * Server-side auth check for API routes.
 * Cloud mode: verifies Clerk session and returns userId (null if unauthenticated).
 * Self-hosted mode: always returns 'local' (no auth required).
 */
export async function getServerUserId(): Promise<string | null> {
  if (APP_MODE !== 'cloud') return 'local';
  const { userId } = await auth();
  return userId ?? null;
}
