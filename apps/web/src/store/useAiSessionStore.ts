import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { nanoid } from 'nanoid';
import { dbClient } from '../lib/api/IndexDBClient';
import type {
  CanvasState,
  ChatMessage,
  SkillId,
} from '../app/dashboard/edit/_components/ai/types';
import type { MultiPersonaResumeAnalysis } from '../types/agent/multi-persona';
import type { FitReport } from '../types/agent/fit-report';

export const AI_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const AI_SESSION_STORAGE_PREFIX = 'ai-session:';

const CLOSED_CANVAS: CanvasState = { open: false, skillId: null, view: 'preview', status: 'idle' };

export type AiSessionChatMode = 'idle' | 'create';

export interface AiSessionSnapshot {
  sessionId: string;
  sessionUsed: boolean;
  started: boolean;
  messages: ChatMessage[];
  chatMode: AiSessionChatMode;
  canvas: CanvasState;
  livingOpen: boolean;
  livingSkillId: SkillId | null;
  analysis: MultiPersonaResumeAnalysis | null;
  fitReport: FitReport | null;
  updatedAt: number;
}

type AiSessionPatch = Partial<Omit<AiSessionSnapshot, 'updatedAt'>>;

interface AiSessionDb {
  setItem<T>(key: string, value: T): Promise<void>;
  getItem<T>(key: string): Promise<T | null>;
  removeItem(key: string): Promise<void>;
  getAllKeys?(): Promise<string[]>;
}

interface CreateAiSessionStoreOptions {
  db?: AiSessionDb;
  now?: () => number;
  idFactory?: () => string;
  persistDelayMs?: number;
}

export interface AiSessionState {
  sessions: Record<string, AiSessionSnapshot>;
  ensureSession: (resumeId: string) => AiSessionSnapshot;
  loadSession: (resumeId: string) => Promise<AiSessionSnapshot>;
  patchSession: (resumeId: string, patch: AiSessionPatch) => AiSessionSnapshot;
  resetSession: (resumeId: string) => AiSessionSnapshot;
  deleteExpiredSessions: () => Promise<void>;
  flushSession: (resumeId: string) => Promise<void>;
}

export function getAiSessionStorageKey(resumeId: string): string {
  return `${AI_SESSION_STORAGE_PREFIX}${resumeId}`;
}

function normalizeSession(
  saved: Partial<AiSessionSnapshot> | null | undefined,
  fallback: AiSessionSnapshot
): AiSessionSnapshot {
  return {
    ...fallback,
    ...saved,
    messages: Array.isArray(saved?.messages) ? saved.messages : fallback.messages,
    canvas: saved?.canvas ? { ...fallback.canvas, ...saved.canvas } : fallback.canvas,
  };
}

export function createAiSessionStore(
  options: CreateAiSessionStoreOptions = {}
): UseBoundStore<StoreApi<AiSessionState>> {
  const db: AiSessionDb = options.db ?? dbClient;
  const now = options.now ?? Date.now;
  const idFactory = options.idFactory ?? nanoid;
  const persistDelayMs = options.persistDelayMs ?? 350;
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  const createEmptySession = (): AiSessionSnapshot => ({
    sessionId: idFactory(),
    sessionUsed: false,
    started: false,
    messages: [],
    chatMode: 'idle',
    canvas: CLOSED_CANVAS,
    livingOpen: false,
    livingSkillId: null,
    analysis: null,
    fitReport: null,
    updatedAt: now(),
  });

  const isExpired = (session: AiSessionSnapshot): boolean =>
    now() - session.updatedAt > AI_SESSION_TTL_MS;

  return create<AiSessionState>((set, get) => {
    const writeSession = async (resumeId: string): Promise<void> => {
      const session = get().sessions[resumeId];
      if (!session) return;
      await db.setItem(getAiSessionStorageKey(resumeId), session);
    };

    const scheduleWrite = (resumeId: string) => {
      const existing = timers.get(resumeId);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        timers.delete(resumeId);
        void writeSession(resumeId);
      }, persistDelayMs);
      timers.set(resumeId, timer);
    };

    return {
      sessions: {},

      ensureSession: (resumeId) => {
        const existing = get().sessions[resumeId];
        if (existing && !isExpired(existing)) return existing;
        const session = createEmptySession();
        set((state) => ({
          sessions: { ...state.sessions, [resumeId]: session },
        }));
        return session;
      },

      loadSession: async (resumeId) => {
        const cached = get().sessions[resumeId];
        if (cached && !isExpired(cached)) return cached;

        const fallback = createEmptySession();
        const saved = await db.getItem<Partial<AiSessionSnapshot>>(getAiSessionStorageKey(resumeId));
        const current = get().sessions[resumeId];
        if (current && !isExpired(current)) return current;
        const session = normalizeSession(saved, fallback);

        if (saved && isExpired(session)) {
          await db.removeItem(getAiSessionStorageKey(resumeId));
          set((state) => ({
            sessions: { ...state.sessions, [resumeId]: fallback },
          }));
          return fallback;
        }

        set((state) => ({
          sessions: { ...state.sessions, [resumeId]: session },
        }));
        return session;
      },

      patchSession: (resumeId, patch) => {
        const session = {
          ...(get().sessions[resumeId] ?? createEmptySession()),
          ...patch,
          updatedAt: now(),
        };
        set((state) => ({
          sessions: { ...state.sessions, [resumeId]: session },
        }));
        scheduleWrite(resumeId);
        return session;
      },

      resetSession: (resumeId) => {
        const session = createEmptySession();
        set((state) => ({
          sessions: { ...state.sessions, [resumeId]: session },
        }));
        scheduleWrite(resumeId);
        return session;
      },

      deleteExpiredSessions: async () => {
        const keys = db.getAllKeys ? await db.getAllKeys() : [];
        for (const key of keys) {
          if (!key.startsWith(AI_SESSION_STORAGE_PREFIX)) continue;
          const saved = await db.getItem<Partial<AiSessionSnapshot>>(key);
          const session = normalizeSession(saved, createEmptySession());
          if (saved && isExpired(session)) await db.removeItem(key);
        }

        const expiredIds = Object.entries(get().sessions)
          .filter(([, session]) => isExpired(session))
          .map(([resumeId]) => resumeId);

        if (expiredIds.length > 0) {
          set((state) => {
            const sessions = { ...state.sessions };
            for (const resumeId of expiredIds) delete sessions[resumeId];
            return { sessions };
          });
          // Clear any pending debounced write for a pruned session so a stale timer
          // can't fire (and leak) after the session is gone.
          for (const resumeId of expiredIds) {
            const timer = timers.get(resumeId);
            if (timer) {
              clearTimeout(timer);
              timers.delete(resumeId);
            }
          }
        }
      },

      flushSession: async (resumeId) => {
        const existing = timers.get(resumeId);
        if (existing) {
          clearTimeout(existing);
          timers.delete(resumeId);
        }
        await writeSession(resumeId);
      },
    };
  });
}

export const useAiSessionStore = createAiSessionStore();
