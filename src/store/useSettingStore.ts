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
  
  saveSettings: async () => {
    const { apiKey, baseUrl, model, maxTokens } = get();
    const newSettings = { apiKey, baseUrl, model, maxTokens };
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
    const savedSettings = await dbClient.getItem('settings') as SettingsData | null;
    if (savedSettings) {
      set({ ...savedSettings, initialSettings: { ...savedSettings }, isDirty: false });
    }
  },
}));

if (typeof window !== 'undefined') {
  useSettingStore.getState().loadSettings();
} 