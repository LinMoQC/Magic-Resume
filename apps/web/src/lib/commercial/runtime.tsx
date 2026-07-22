import type { ReactNode } from 'react';
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
 */
export async function CommercialRuntimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  await headers();
  const apiOrigin =
    process.env.APP_API_ORIGIN || process.env.NEXT_PUBLIC_API_URL || '';
  const runtime = { apiOrigin };
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__ENV = ${JSON.stringify(runtime).replace(/</g, '\\u003c')};`,
        }}
      />
      {children}
    </>
  );
}
