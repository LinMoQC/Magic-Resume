import { auth, clerkClient } from '@clerk/nextjs/server';
import { isCloudMode } from '@/lib/config/app';
import { getRolloutConfig } from '@/lib/config/rollout';

function metaGrantsAccess(meta: unknown): boolean {
  const m = (meta ?? {}) as { betaAccess?: boolean; role?: string };
  return m.betaAccess === true || m.role === 'admin';
}

/**
 * Single entry point for the beta gate.
 *
 * - self-hosted: no gate, always true.
 * - cloud, gate disabled (backend `gateEnabled=false`): full launch, always true.
 * - cloud, gate enabled: signed-in users whose Clerk `publicMetadata` grants
 *   `betaAccess` (or `role: 'admin'`) pass; everyone else is gated.
 *
 * The per-user check reads Clerk session claims first (zero API call); only if
 * the JWT template doesn't expose `public_metadata` does it fall back to one
 * Clerk API call. Whitelist storage stays in Clerk — the admin tab writes it.
 */
export async function hasBetaAccess(): Promise<boolean> {
  if (!isCloudMode) return true;

  const { gateEnabled } = await getRolloutConfig();
  if (!gateEnabled) return true;

  const { userId, sessionClaims } = await auth();
  if (!userId) return false;

  const claimMeta =
    (sessionClaims as Record<string, unknown> | null)?.public_metadata ??
    (sessionClaims as Record<string, unknown> | null)?.publicMetadata;
  if (claimMeta) return metaGrantsAccess(claimMeta);

  // Claim not exposed in the session token → fall back to a single lookup.
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return metaGrantsAccess(user.publicMetadata);
  } catch {
    return false; // fail-closed for the per-user check
  }
}
