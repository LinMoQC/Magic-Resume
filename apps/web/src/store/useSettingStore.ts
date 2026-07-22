import { create } from 'zustand';
import { dbClient } from '@/lib/api/IndexDBClient';
import { isCloudMode } from '@/lib/config/app';
import {
  CUSTOM_PROVIDER_ID,
  DEFAULT_MAX_TOKENS,
  deriveProviderId,
  getProvider,
} from '@/lib/constants/modals';

// 移除立即初始化，改为懒加载
let dbInitialized = false;
const ensureDbInitialized = async () => {
  if (!dbInitialized && typeof window !== 'undefined') {
    try {
      await dbClient.init();
      dbInitialized = true;
    } catch (err) {
      console.error('Failed to init db for settings', err);
    }
  }
};

/** Reasoning strength ("强度") picked in the AI Lab composer. */
export type Strength = 'low' | 'medium' | 'high';

/**
 * Which model source the user wants for the next run.
 * - `auto`: let the system decide (internal when entitled, else the user's key).
 * - `internal`: force internal credits (falls back to auto if not entitled).
 * - `byok`: force the user's own configured model (falls back to auto if unset).
 */
export type PreferredSource = 'auto' | 'internal' | 'byok';

interface SettingsData {
  /** selected provider id (see MODEL_PROVIDERS); '' until the user picks one. */
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  cloudSync: boolean;
  syncDisclaimerAgreed: boolean;
  /** Composer-picked model for internal (subscription) runs; '' = server default. */
  selectedModel: string;
  /** Composer-picked reasoning strength → reasoning_effort. */
  strength: Strength;
  /** Which model source the user explicitly picked in the composer. */
  preferredSource: PreferredSource;
}

interface SettingsState extends SettingsData {
  initialSettings: SettingsData;
  isDirty: boolean;
  /** Pick a provider; preset providers auto-fill baseUrl/model/maxTokens. */
  setProvider: (provider: string) => void;
  setApiKey: (apiKey: string) => void;
  setBaseUrl: (baseUrl: string) => void;
  setModel: (model: string) => void;
  setMaxTokens: (maxTokens: number) => void;
  setCloudSync: (cloudSync: boolean) => void;
  setSyncDisclaimerAgreed: (agreed: boolean) => void;
  /** Composer prefs — persisted immediately (not part of the Save-form dirty flow). */
  setSelectedModel: (model: string) => void;
  setStrength: (strength: Strength) => void;
  setPreferredSource: (source: PreferredSource) => void;
  /** True when provider + key + baseUrl + model + maxTokens are all set — AI is usable. */
  hasLlmConfig: () => boolean;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
  loadSettings: () => Promise<void>;
}

const defaultSettings: SettingsData = {
  // No preset provider/url/model: the user picks a provider first, which fills the rest.
  provider: '',
  apiKey: '',
  baseUrl: '',
  model: '',
  // 8192 (was 1024): long resume optimize / translate / create outputs were being
  // silently truncated at 1024 tokens (CC7).
  maxTokens: DEFAULT_MAX_TOKENS,
  // Cloud-sync-first: default on in cloud mode (opt-out — users can disable it in
  // settings). Self-hosted has no backend, so it must stay off. Existing users keep
  // their saved preference (loadSettings merges saved values over this default).
  cloudSync: isCloudMode,
  syncDisclaimerAgreed: false,
  selectedModel: '',
  strength: 'medium',
  preferredSource: 'auto',
};

const isNonEmpty = (value: unknown) => String(value ?? '').trim().length > 0;

/**
 * Immediately persist just the composer prefs, merged onto the last-saved
 * settings so a mid-edit form (unsaved apiKey etc.) is never clobbered.
 */
const persistPreference = async (
  patch: Partial<Pick<SettingsData, 'selectedModel' | 'strength' | 'preferredSource'>>,
) => {
  await ensureDbInitialized();
  const saved = (await dbClient.getItem('settings')) as Partial<SettingsData> | null;
  await dbClient.setItem('settings', { ...(saved ?? {}), ...patch });
};

export const useSettingStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,
  initialSettings: { ...defaultSettings },
  isDirty: false,

  setProvider: (provider) => {
    const meta = getProvider(provider);
    // Preset providers fill in base URL / model / max tokens so the user only
    // needs a key. Custom keeps the user's existing fields (don't wipe them).
    const patch: Partial<SettingsData> = { provider };
    if (meta && provider !== CUSTOM_PROVIDER_ID) {
      patch.baseUrl = meta.baseUrl;
      patch.model = meta.defaultModel;
      patch.maxTokens = meta.defaultMaxTokens;
    }
    const currentState = { ...get(), ...patch };
    const { initialSettings, ...currentSettings } = currentState;
    set({ ...patch, isDirty: JSON.stringify(currentSettings) !== JSON.stringify(initialSettings) });
  },
  setApiKey: (apiKey) => {
    const currentState = { ...get(), apiKey };
    const { initialSettings, ...currentSettings } = currentState;
    set({ apiKey, isDirty: JSON.stringify(currentSettings) !== JSON.stringify(initialSettings) });
  },
  setBaseUrl: (baseUrl) => {
    const currentState = { ...get(), baseUrl };
    const { initialSettings, ...currentSettings } = currentState;
    set({ baseUrl, isDirty: JSON.stringify(currentSettings) !== JSON.stringify(initialSettings) });
  },
  setModel: (model) => {
    const currentState = { ...get(), model };
    const { initialSettings, ...currentSettings } = currentState;
    set({ model, isDirty: JSON.stringify(currentSettings) !== JSON.stringify(initialSettings) });
  },
  setMaxTokens: (maxTokens) => {
    const currentState = { ...get(), maxTokens };
    const { initialSettings, ...currentSettings } = currentState;
    set({ maxTokens, isDirty: JSON.stringify(currentSettings) !== JSON.stringify(initialSettings) });
  },
  setCloudSync: (cloudSync) => {
    const currentState = { ...get(), cloudSync };
    const { initialSettings, ...currentSettings } = currentState;
    set({ cloudSync, isDirty: JSON.stringify(currentSettings) !== JSON.stringify(initialSettings) });
  },
  setSyncDisclaimerAgreed: (syncDisclaimerAgreed) => {
    const currentState = { ...get(), syncDisclaimerAgreed };
    const { initialSettings, ...currentSettings } = currentState;
    set({ syncDisclaimerAgreed, isDirty: JSON.stringify(currentSettings) !== JSON.stringify(initialSettings) });
  },

  setSelectedModel: (selectedModel) => {
    set({ selectedModel });
    void persistPreference({ selectedModel });
  },
  setStrength: (strength) => {
    set({ strength });
    void persistPreference({ strength });
  },
  setPreferredSource: (preferredSource) => {
    set({ preferredSource });
    void persistPreference({ preferredSource });
  },

  hasLlmConfig: () => {
    const { provider, apiKey, baseUrl, model, maxTokens } = get();
    const tokens = Number(maxTokens);
    return isNonEmpty(provider)
      && isNonEmpty(apiKey)
      && isNonEmpty(baseUrl)
      && isNonEmpty(model)
      && Number.isFinite(tokens)
      && tokens > 0;
  },

  saveSettings: async () => {
    await ensureDbInitialized();
    const { provider, apiKey, baseUrl, model, maxTokens, cloudSync, syncDisclaimerAgreed, selectedModel, strength, preferredSource } = get();
    const newSettings = { provider, apiKey, baseUrl, model, maxTokens, cloudSync, syncDisclaimerAgreed, selectedModel, strength, preferredSource };
    await dbClient.setItem('settings', newSettings);
    set({ initialSettings: newSettings, isDirty: false });
  },

  resetSettings: () => {
    set(state => ({
      ...state.initialSettings,
      isDirty: false,
    }));
  },

  loadSettings: async () => {
    await ensureDbInitialized();
    const savedSettings = await dbClient.getItem('settings') as Partial<SettingsData> | null;
    if (savedSettings) {
      // Migrate legacy settings (pre-`provider`): reverse-derive the provider from
      // the saved base URL so old users keep working without re-configuring.
      const provider = isNonEmpty(savedSettings.provider)
        ? (savedSettings.provider as string)
        : (savedSettings.baseUrl ? deriveProviderId(savedSettings.baseUrl) : '');
      const merged: SettingsData = { ...defaultSettings, ...savedSettings, provider };
      set({ ...merged, initialSettings: { ...merged }, isDirty: false });
    }
  },
}));

// 恢复为了确保全局可用性的自动加载，但仅在客户端执行
if (typeof window !== 'undefined') {
  useSettingStore.getState().loadSettings();
}
