import { useCallback, useSyncExternalStore } from 'react';

export default function useMobile(breakpoint = 768) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [breakpoint]
  );

  // useSyncExternalStore reconciles the server snapshot (false) with the real
  // client value without a hydration mismatch, so mobile viewports no longer get a
  // one-frame desktop layout on first paint.
  const isMobile = useSyncExternalStore(
    subscribe,
    () => window.innerWidth < breakpoint,
    () => false
  );

  return { isMobile };
}
