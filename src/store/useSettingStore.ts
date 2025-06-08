import { create } from 'zustand';
import { dbClient } from '@/lib/IndexDBClient';

if (typeof window !== 'undefined') {
  dbClient.init().catch(err => console.error('Failed to init db for settings', err));
}

interface SettingsData {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
}

interface SettingsState extends SettingsData {
  initialSettings: SettingsData;
  isDirty: boolean;
  setApiKey: (apiKey: string) => void;
  setBaseUrl: (baseUrl: string) => void;
  setModel: (model: string) => void;
  setMaxTokens: (maxTokens: number) => void;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
  loadSettings: () => Promise<void>;
}

const defaultSettings: SettingsData = {
  apiKey: '',
  baseUrl: 'http://localhost:11434/v1',
  model: 'gpt-3.5-turbo',
  maxTokens: 1024,
};

export const useSettingStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,
  initialSettings: { ...defaultSettings },
  isDirty: false,
  setApiKey: (apiKey) => set(state => ({ ...state, apiKey, isDirty: apiKey !== state.initialSettings.apiKey })),
  setBaseUrl: (baseUrl) => set(state => ({ ...state, baseUrl, isDirty: baseUrl !== state.initialSettings.baseUrl })),
  setModel: (model) => set(state => ({ ...state, model, isDirty: model !== state.initialSettings.model })),
  setMaxTokens: (maxTokens) => set(state => ({ ...state, maxTokens, isDirty: maxTokens !== state.initialSettings.maxTokens })),
  
  saveSettings: async () => {
    const { apiKey, baseUrl, model, maxTokens } = get();
    const newSettings = { apiKey, baseUrl, model, maxTokens };
    await dbClient.setItem('settings', 'Magic-Settings', newSettings);
    set({ initialSettings: newSettings, isDirty: false });
  },

  resetSettings: () => {
    set(state => ({
      ...state.initialSettings,
      isDirty: false,
    }));
  },

  loadSettings: async () => {
    const savedSettings = await dbClient.getItem('settings', 'Magic-Settings') as SettingsData | null;
    if (savedSettings) {
      set({ ...savedSettings, initialSettings: { ...savedSettings }, isDirty: false });
    }
  },
}));

if (typeof window !== 'undefined') {
  useSettingStore.getState().loadSettings();
} 