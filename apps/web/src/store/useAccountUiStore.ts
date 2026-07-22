import { create } from 'zustand';

/** Categories in the GPT-style settings modal. Cloud-only ones are filtered at render. */
export type SettingsSection = 'general' | 'model' | 'cloudSync' | 'mcp';

interface AccountUiState {
  settingsOpen: boolean;
  settingsSection: SettingsSection;
  accountOpen: boolean;
  pricingOpen: boolean;
  /** Open the settings modal, optionally jumping to a section. */
  openSettings: (section?: SettingsSection) => void;
  closeSettings: () => void;
  /** Open the account modal (cloud only — hosts the themed Clerk UserProfile). */
  openAccount: () => void;
  closeAccount: () => void;
  /** Open the upgrade / pricing modal (cloud only). */
  openPricing: () => void;
  closePricing: () => void;
}

/**
 * Drives the two global overlays (settings + account) from anywhere — the avatar
 * menu, the sidebar, the editor rail — without prop-drilling. The modals are
 * mounted once in `AccountUiHost` and read this store.
 */
export const useAccountUiStore = create<AccountUiState>((set) => ({
  settingsOpen: false,
  settingsSection: 'general',
  accountOpen: false,
  pricingOpen: false,
  openSettings: (section) =>
    set((state) => ({ settingsOpen: true, settingsSection: section ?? state.settingsSection })),
  closeSettings: () => set({ settingsOpen: false }),
  openAccount: () => set({ accountOpen: true }),
  closeAccount: () => set({ accountOpen: false }),
  openPricing: () => set({ pricingOpen: true }),
  closePricing: () => set({ pricingOpen: false }),
}));
