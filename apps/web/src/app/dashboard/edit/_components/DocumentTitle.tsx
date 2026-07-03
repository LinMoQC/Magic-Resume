'use client';

import { useEffect } from 'react';
import { useResumeStore } from '@/store/useResumeStore';

// Static SSR fallback (mirrors metaConfig.Edit) — used before a resume loads
// and restored when leaving the editor.
const DEFAULT_TITLE = '编辑简历 - 在线简历编辑器 | Magic Resume';

/**
 * Syncs the browser tab title with the active resume's name.
 * Resume data lives client-side (IndexedDB / Zustand), so this can't be done
 * in server-side `generateMetadata` — we update `document.title` at runtime.
 */
export default function DocumentTitle() {
  const name = useResumeStore((s) => s.activeResume?.name);

  useEffect(() => {
    document.title = name ? `${name} | Magic Resume` : DEFAULT_TITLE;
  }, [name]);

  useEffect(
    () => () => {
      document.title = DEFAULT_TITLE;
    },
    [],
  );

  return null;
}
