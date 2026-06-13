'use client';

import { isCloudMode } from '@/lib/config/app';
import { UserButton } from '@clerk/nextjs';

// Renders Clerk's UserButton in cloud mode, nothing in self-hosted mode.
export function AppUserButton({ afterSignOutUrl }: { afterSignOutUrl?: string }) {
  if (!isCloudMode) return null;
  return <UserButton afterSignOutUrl={afterSignOutUrl ?? '/'} />;
}
