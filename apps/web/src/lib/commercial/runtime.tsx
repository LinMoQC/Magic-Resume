import type { ReactNode } from 'react';

/**
 * Commercial runtime slot. In the open-source build this is a no-op passthrough.
 * The commercial build overlays this module (Magic-Resume-Commercial
 * `next-config-overlay.mjs` aliases `@/lib/commercial/runtime` → the analytics
 * runtime provider), so the alias target owns analytics init + SPA page-view
 * tracking.
 *
 * NOTE: the `window.__ENV` runtime-env injection deliberately lives in the
 * sibling `./runtime-env` module (NOT here) because the overlay replaces this
 * one — see runtime-env.tsx for the full rationale.
 */
export function CommercialRuntimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
