import { create } from 'zustand';
import { persist, PersistStorage } from 'zustand/middleware';
import { MagicDebugger } from '@/lib/debuggger';
import { dbClient } from '@/lib/IndexDBClient';

if (typeof window !== 'undefined') {
  dbClient.init().catch(err => MagicDebugger.error('Failed to init db for settings', err));
}

interface SettingsState {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  setApiKey: (apiKey: string) => void;
  setBaseUrl: (baseUrl: string) => void;
  setModel: (model: string) => void;
  setMaxTokens: (maxTokens: number) => void;
}

const indexDBStorage: PersistStorage<SettingsState> = {
  getItem: async (name) => {
    MagicDebugger.log('Getting item from IndexedDB', name);
    const value = await dbClient.getItem('settings', name);
    return value ? (value as any) : null;
  },
  setItem: async (name, value) => {
    MagicDebugger.log('Setting item to IndexedDB', name, value);
    await dbClient.setItem('settings', name, value);
  },
  removeItem: async (name) => {
    MagicDebugger.log('Removing item from IndexedDB', name);
    await dbClient.deleteItem('settings', name);
  },
};

export const useSettingStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      baseUrl: 'http://localhost:11434/v1',
      model: 'gpt-3.5-turbo',
      maxTokens: 1024,
      setApiKey: (apiKey) => set({ apiKey }),
      setBaseUrl: (baseUrl) => set({ baseUrl }),
      setModel: (model) => set({ model }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
    }),
    {
      name: 'Magic-Settings',
      storage: indexDBStorage,
      onRehydrateStorage: (state) => {
        MagicDebugger.log('Rehydrating settings store from IndexedDB', state);
      },
    }
  )
); 