"use client";

import { SettingsModal } from "@/components/settings/SettingsModal";
import { AccountModal } from "@/lib/auth";

/**
 * Mounts the global settings + account overlays once, high in the dashboard tree
 * so they render over both the dashboard and the editor. Driven by useAccountUiStore.
 * AccountModal is a no-op in self-hosted mode.
 */
export default function AccountUiHost() {
  return (
    <>
      <SettingsModal />
      <AccountModal />
    </>
  );
}
