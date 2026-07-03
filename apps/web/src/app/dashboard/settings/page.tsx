"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccountUiStore } from "@/store/useAccountUiStore";

/**
 * Settings now live in the global {@link SettingsModal} (mounted in the dashboard
 * layout). This route is kept only for URL / bookmark compatibility: it opens the
 * modal and hands the user back to the dashboard, so there is a single source of
 * truth instead of a duplicated full-page settings screen.
 */
export default function SettingsRedirect() {
  const router = useRouter();
  const openSettings = useAccountUiStore((s) => s.openSettings);

  useEffect(() => {
    openSettings();
    router.replace("/dashboard");
  }, [openSettings, router]);

  return null;
}
