import { auth } from '@clerk/nextjs/server';
import { API_ORIGIN } from '@/lib/api/routes';

/**
 * Server-side fetch to the backend (single origin) that forwards the caller's
 * Clerk token. The v2 agent-service is guarded (global `ClerkAuthGuard`); proxy
 * routes that call it without a token get 401. Every Next.js route handler that
 * proxies to the backend should go through here.
 *
 * Streams (SSE) and multipart pass through untouched — the helper only sets
 * `Authorization` and a default JSON `Content-Type` (skipped for `FormData`).
 */
export async function serverFetchBackend(path: string, init: RequestInit = {}): Promise<Response> {
  let token: string | null = null;
  try {
    const { getToken } = await auth();
    token = await getToken();
  } catch {
    // self-hosted / no Clerk session → no token
  }

  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  return fetch(`${API_ORIGIN}${path}`, { ...init, headers });
}
