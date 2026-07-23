import { headers } from 'next/headers';

/**
 * Runtime env → browser. Reads the API origin from the container env at REQUEST
 * time and hands it to the client via `window.__ENV` (consumed lazily by
 * lib/api/routes.ts). The var is deliberately WITHOUT the `NEXT_PUBLIC_` prefix:
 * Next inlines `NEXT_PUBLIC_*` at build time into both client AND server bundles,
 * which would freeze the address into the image; a prefix-less var is read from
 * the container env at runtime, so one image targets any backend via docker
 * compose `environment:`.
 *
 * `headers()` opts this subtree into dynamic rendering so the injected value
 * reflects the runtime env, not a build-time snapshot. (This app is auth-heavy /
 * already dynamic; if a page needs static generation, inject via a route handler
 * fetched on the client instead.)
 *
 * WHY THIS LIVES IN ITS OWN MODULE (not in ./runtime): the commercial build
 * overlays `@/lib/commercial/runtime` with an analytics-only provider
 * (Magic-Resume-Commercial `next-config-overlay.mjs` webpack alias). If the
 * `window.__ENV` injection lived there, the overlay would strip it and the
 * commercial image would fall back to the localhost default. This module is NOT
 * in the overlay's alias list, so the injection survives in both builds. Keep it
 * that way — do not fold it back into ./runtime, and do not add it to the
 * overlay alias.
 */
export async function RuntimeEnvScript() {
  await headers();
  const apiOrigin =
    process.env.APP_API_ORIGIN || process.env.NEXT_PUBLIC_API_URL || '';
  const runtime = { apiOrigin };
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.__ENV = ${JSON.stringify(runtime).replace(/</g, '\\u003c')};`,
      }}
    />
  );
}
