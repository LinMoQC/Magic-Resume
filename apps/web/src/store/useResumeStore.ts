import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import i18next from 'i18next';
import sidebarMenu from '@/lib/constants/sidebarMenu';
import { dbClient, RESUMES_KEY } from '@/lib/api/IndexDBClient';
import { MagicDebugger } from '@/lib/utils/debuggger';
import { toast } from "sonner";
import { useSettingStore } from './useSettingStore';
import { resumeApi, isLocalResumeId, buildSyncDoc } from '@/lib/api/resume';
import { getAuthToken, getCachedAuthToken } from '@/lib/api/httpClient';
import { compare as compareJsonDocs } from 'fast-json-patch';
import { isAxiosError } from 'axios';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import { normalizeResumeSectionOrder } from '@/lib/utils/resumeSectionOrder';
import {
  Resume,
  InfoType,
  Section,
  SectionItem,
  SectionOrder,
  CustomTemplateConfig,
  CloudResume,
  CloudVersion,
  ResumeVersion
} from '@/types/frontend/resume';
import type { CloudResumeResponse } from '@/types/backend/resume';

const MAX_RESUME_VERSION_HISTORY = 10;

// 云同步失败提示的节流:离线编辑时防抖每 10~45s 到点一次、次次失败,不能每次都弹 toast
// 轰炸(HeaderTab 的 syncStatus pill 已持续传达 error 态)。60s 内只提醒一次。
const SYNC_ERROR_TOAST_COOLDOWN_MS = 60_000;
let lastSyncErrorToastAt = 0;

// ---------------------------------------------------------------------------
// Cloud Sync v2 客户端基线(docs/specs/cloud-sync-v2/design.md)
// ---------------------------------------------------------------------------
// 每份简历一条:最后已知的云端 revision(乐观锁基线)与"已知和云端一致"的推送文档
// (增量 diff 的基与脏检查的参照)。内存态即可 —— 跨会话由 loadResumes 重新播种,
// 未播种时同步退化为旧行为(无条件全量推)。
type SyncBaseline = {
  revision?: number;
  doc?: Record<string, unknown>;
};
const syncBaselines = new Map<string, SyncBaseline>();

const setSyncBaseline = (id: string, patch: SyncBaseline) => {
  syncBaselines.set(id, { ...syncBaselines.get(id), ...patch });
};

// 脏检查比较键:白名单字段、构造顺序稳定、不含 updatedAt(手动保存会 bump updatedAt,
// 含入的话重复 Ctrl+S 永远"脏"、永远堆冗余版本)。方向安全:构造差异只会"假脏"(多同步
// 一次),不可能"假净"。
const syncCompareKey = (doc: Record<string, unknown> | Resume): string =>
  JSON.stringify(getSanitizedResume(doc as Resume));

// 自动建版本冷却的会话内记录:本地 versions 未从云端加载时(每个会话开头),仅靠
// versions 列表判定冷却必然失效(lastVersionTime=0 → 首次同步必建版本)。任何一次
// 成功建版本(手动/自动/冲突备份)都刷新这里。
const lastVersionSnapshotAt = new Map<string, number>();

/** 同步结果:调用方(手动保存)据此区分"真同步了"与"本就没得同步"。 */
export type SyncOutcome = 'synced' | 'noop' | 'skipped' | 'failed';

type ResumeState = {
  resumes: Resume[];
  activeResume: Resume | null;
  isStoreLoading: boolean;
  rightCollapsed: boolean;
  leftCollapsed: boolean;
  activeSection: string;
  syncStatus: 'saved' | 'syncing' | 'modified' | 'local' | 'error';
  isSyncing: boolean;
  loadResumes: () => Promise<void>;
  createResume: (name: string) => Promise<string>;
  importResume: (resume: Resume) => Promise<string>;
  addResume: (resume: Resume) => void;
  updateResume: (id: string, updates: Partial<Resume>) => void;
  duplicateResume: (id: string) => Promise<void>;
  renameResume: (id: string, newName: string) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  deleteVersion: (resumeId: string, versionId: string) => Promise<void>;
  loadResumeForEdit: (id: string) => void;
  saveResume: (type?: 'auto' | 'manual', resumeData?: Resume) => Promise<void>;
  createVersion: (type: 'auto' | 'manual', name?: string, resumeData?: Resume) => Promise<void>;
  restoreVersion: (versionId: string) => void;
  syncToCloud: (options?: { skipVersioning?: boolean }) => Promise<SyncOutcome>;
  fetchCloudResume: (id: string) => Promise<void>;
  /** 只刷新版本列表,不触内容字段 —— 避免云端副本覆盖正在编辑的内容。 */
  refreshCloudVersions: (id: string) => Promise<void>;
  /** pagehide 退出送达:若有未落云修改,用 keepalive 请求尽力推送。 */
  flushSyncOnExit: () => void;
  updateInfo: (info: Partial<InfoType>) => void;
  setSectionOrder: (sectionOrder: SectionOrder[]) => void;
  updateSectionItems: (key: string, items: SectionItem[]) => void;
  updateSections: (sections: Section) => void;
  updateTemplate: (template: string) => void;
  updateCustomTemplate: (customTemplate: CustomTemplateConfig) => void;
  updateThemeColor: (themeColor: string) => void;
  updateTypography: (typography: string) => void;
  setRightCollapsed: (collapsed: boolean) => void;
  setLeftCollapsed: (collapsed: boolean) => void;
  setActiveSection: (section: string) => void;
  updateSharing: (isPublic: boolean, shareRole: 'VIEWER' | 'COMMENTER' | 'EDITOR' | undefined) => Promise<void>;
  
  // AI State
  isAiGenerating: boolean;
  setIsAiGenerating: (isGenerating: boolean) => void;
  applyFullResume: (resume: Resume) => void;
};

export const initialResume: Omit<Resume, 'id' | 'updatedAt' | 'name'> = {
  info: {
    fullName: '',
    headline: '',
    email: '',
    phoneNumber: '',
    address: '',
    website: '',
    avatar: '',
    customFields: [],
  },
  sections: Object.fromEntries(sidebarMenu.map(item => [item.key, []])),
  sectionOrder: [
    { key: 'basics', label: 'Basics' },
    ...sidebarMenu.map(item => ({ key: item.key, label: item.label }))
  ],
  template: 'classic',
  themeColor: '#f97316',
  typography: 'inter',
  customTemplate: {},
};

export const getSanitizedResume = (resume: Resume): Omit<Resume, 'id' | 'updatedAt' | 'versions'> => {
  const r = resume || {};
  const sections = r.sections || initialResume.sections;
  const sanitized: Omit<Resume, 'id' | 'updatedAt' | 'versions'> = {
    info: r.info || initialResume.info,
    sections,
    sectionOrder: normalizeResumeSectionOrder(r.sectionOrder, sections),
    template: r.template || initialResume.template,
    themeColor: r.themeColor || initialResume.themeColor,
    typography: r.typography || initialResume.typography,
    customTemplate: (r.customTemplate || initialResume.customTemplate) as CustomTemplateConfig,
    name: (r.name as string) || '',
  };

  // Only include sharing fields if they are explicitly present (usually from cloud sync)
  if (r.isPublic !== undefined) sanitized.isPublic = r.isPublic;
  if (r.shareId !== undefined) sanitized.shareId = r.shareId;
  if (r.shareRole !== undefined) sanitized.shareRole = r.shareRole;

  return sanitized;
};

// Helper for local persistence: include identity but strip version history and snapshots
export const getSanitizedResumeForLocal = (resume: Resume) => {
  if (!resume) return null;
  return {
    id: resume.id,
    updatedAt: resume.updatedAt,
    ...getSanitizedResume(resume)
  };
};

const getCloudVersionTimestamp = (version: CloudVersion) => (
  version.createdAt ? new Date(version.createdAt).getTime() : (version.timestamp || Date.now())
);

const normalizeResumeVersions = (versions: ResumeVersion[] = []) => (
  [...versions]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_RESUME_VERSION_HISTORY)
);

const normalizeCloudVersions = (versions: CloudVersion[] = [], resumeId: string): ResumeVersion[] => (
  versions
    .map((version) => {
      const updatedAt = getCloudVersionTimestamp(version);
      return {
        id: version.id,
        updatedAt,
        type: (version.changelog === 'Manual Save' ? 'manual' : (version.changelog === 'Auto Save' || version.changelog === 'Initial version' ? 'auto' : (version.type || 'auto'))) as 'manual' | 'auto',
        name: version.changelog !== 'Manual Save' && version.changelog !== 'Auto Save' && version.changelog !== 'Initial version' ? version.changelog : '',
        data: (() => {
          const rawVersion = typeof version.content === 'string' ? JSON.parse(version.content) : version.content;
          return {
            ...getSanitizedResume((rawVersion || {}) as Resume),
            id: resumeId,
            updatedAt,
          } as Omit<Resume, 'versions'>;
        })()
      };
    })
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_RESUME_VERSION_HISTORY)
);

const buildResumeFromCloud = (cloudResume: CloudResume, fallbackVersions?: ResumeVersion[]): Resume => {
  const rawParsed = typeof cloudResume.content === 'string' ? JSON.parse(cloudResume.content) : cloudResume.content;
  const sanitizedContent = getSanitizedResume({
    ...((rawParsed || {}) as Resume),
    name: cloudResume.title,
    isPublic: cloudResume.isPublic,
    shareId: cloudResume.shareId,
    shareRole: cloudResume.shareRole
  });

  return {
    id: cloudResume.id,
    updatedAt: new Date(cloudResume.updatedAt).getTime(),
    ...sanitizedContent,
    versions: cloudResume.versions
      ? normalizeCloudVersions(cloudResume.versions, cloudResume.id)
      : normalizeResumeVersions(fallbackVersions)
  };
};

/** axios 错误且带指定 HTTP 状态码。 */
const isHttpStatus = (error: unknown, status: number): boolean =>
  isAxiosError(error) && error.response?.status === status;

/**
 * 执行一次云端推送,内建两级降级(docs/specs/cloud-sync-v2/design.md §4/§5):
 *   1. 有基线 → 增量(patch + baseRevision);服务端 400(补丁不可应用)→ 条件全量重试;
 *   2. 条件推送 409(其它端已写入)→ 恢复:备份远端为历史版本 → 以最新本地内容无条件
 *      强推(远端已备份,眼前的编辑器是用户认知里的事实)→ toast 告知;
 *   3. 无基线 → 无条件全量(旧行为)。
 * 返回实际生效的响应与"实际推送的文档"(强推时可能比入参更新,基线播种要用它)。
 */
const syncWithConflictRecovery = async (
  resume: Resume,
  sentDoc: Record<string, unknown>,
  baseline: SyncBaseline | undefined,
  getLatestResume: () => Resume | null,
): Promise<{ result: CloudResumeResponse; sentDoc: Record<string, unknown> }> => {
  const isLocal = isLocalResumeId(resume.id);
  const baseRevision = baseline?.revision;

  const pushConditional = async (): Promise<CloudResumeResponse> => {
    if (!isLocal && baseline?.doc && baseRevision !== undefined) {
      const patchOps = compareJsonDocs(baseline.doc, sentDoc);
      try {
        return await resumeApi.syncResume(resume, { baseRevision, patchOps });
      } catch (error) {
        // 400 = 补丁在服务端不可应用(基线内容意外分叉/存量非 JSON 等) → 条件全量兜底。
        if (!isHttpStatus(error, 400)) throw error;
        console.warn('[Sync] contentPatch rejected (400), falling back to conditional full push.');
        return await resumeApi.syncResume(resume, { baseRevision });
      }
    }
    return await resumeApi.syncResume(
      resume,
      !isLocal && baseRevision !== undefined ? { baseRevision } : undefined,
    );
  };

  try {
    return { result: await pushConditional(), sentDoc };
  } catch (error) {
    if (!isHttpStatus(error, 409)) throw error;

    // --- 409 冲突恢复:先保住远端,再让眼前的编辑胜出 ---
    console.warn('[Sync] Revision conflict detected, backing up remote then force-pushing local.');
    const remote = (await resumeApi.fetchCloudResumeById(resume.id)) as {
      content?: string | object;
    } | null;
    const remoteContent =
      typeof remote?.content === 'string'
        ? remote.content
        : remote?.content
          ? JSON.stringify(remote.content)
          : null;
    if (remoteContent) {
      await resumeApi.createCloudVersionRaw(
        resume.id,
        remoteContent,
        i18next.t('store.sync.conflictBackupChangelog'),
      );
      lastVersionSnapshotAt.set(resume.id, Date.now());
    }

    // 强推用 store 里最新的内容(恢复期间用户可能又打了字),不带 base —— 蓄意 LWW。
    const latest = getLatestResume();
    const forceResume = latest && latest.id === resume.id ? latest : resume;
    const forceDoc = buildSyncDoc(forceResume);
    const result = await resumeApi.syncResume(forceResume);
    toast.info(i18next.t('store.notifications.syncConflictResolved'));
    return { result, sentDoc: forceDoc };
  }
};

const useResumeStore = create<ResumeState>()(
  immer((set, get) => ({
    resumes: [],
    activeResume: null,
    isStoreLoading: true,
    rightCollapsed: false,
    leftCollapsed: false,
    activeSection: 'basics',
    syncStatus: 'saved',
    isSyncing: false,
    isAiGenerating: false,

  setIsAiGenerating: (isGenerating) => set({ isAiGenerating: isGenerating }),

  applyFullResume: (newResume) => {
    const { updateInfo, updateSections, setSectionOrder } = get();
    updateInfo(newResume.info);
    updateSections(newResume.sections);
    if (newResume.sectionOrder) {
      setSectionOrder(newResume.sectionOrder);
    }
  },

  loadResumes: async () => {
    if (!get().isStoreLoading) {
      set({ isStoreLoading: true });
    }
    try {
      let localResumes = await dbClient.getItem<Resume[]>(RESUMES_KEY) || [];
      
      // Cleanup: Remove legacy redundant 'content' field from local storage if present
      localResumes = localResumes.map(r => {
        if ('content' in (r as object)) {
            const rest = { ...r };
            delete (rest as Record<string, unknown>).content;
            return rest as Resume;
        }
        return r;
      });

      // Early deduplication for local resumes to fix potential dirty data
      const mergedMap = new Map<string, Resume>();
      localResumes.forEach(r => mergedMap.set(r.id, r));

      const isCloudSyncOn = useSettingStore.getState().cloudSync;
      if (isCloudSyncOn && await getAuthToken()) {
        try {
          const cloudResult = await resumeApi.fetchCloudResumes();
          if (cloudResult && cloudResult.data) {
            // fetchCloudResumes 返回分页信封 { data, total, page, limit },data 即列表。
            const cloudResumes = cloudResult.data as CloudResume[];

            if (Array.isArray(cloudResumes)) {
                // Set of valid Cloud IDs
                const cloudIds = new Set(cloudResumes.map(cr => cr.id));

                cloudResumes.forEach(cr => {
                  const local = mergedMap.get(cr.id);
                  const cloudWins = !local || new Date(cr.updatedAt).getTime() > local.updatedAt;
                  if (cloudWins) {
                    const mergedResume = buildResumeFromCloud(cr, local?.versions);
                    mergedMap.set(cr.id, mergedResume);
                    // 本地被云端副本替换 → 本地 === 云端,revision 与 doc 都是权威基线。
                    setSyncBaseline(cr.id, { revision: cr.revision, doc: buildSyncDoc(mergedResume) });
                  } else {
                    // 本地更新(离线编辑过):doc 不播种(内容与云端已分叉,首推走全量),
                    // 但 revision 必须记 —— 这正是冲突检测要保护的场景。
                    setSyncBaseline(cr.id, { revision: cr.revision });
                  }
                });

                // Prune resumes that live in the cloud (cloud-style id) but are no
                // longer in the cloud list — i.e. deleted on another device. Guard
                // against data loss: only treat the cloud list as authoritative when it
                // is non-empty (an empty/partial 200 response must not wipe everything),
                // and NEVER delete local-only resumes (numeric id) created offline or
                // not yet synced.
                if (cloudResumes.length > 0) {
                    for (const id of mergedMap.keys()) {
                        if (!cloudIds.has(id) && !isLocalResumeId(id)) {
                            mergedMap.delete(id);
                        }
                    }
                }
            }
            
            // Update local DB with merged data immediately after sync
            const uniqueResumes = Array.from(mergedMap.values());
            await dbClient.setItem(RESUMES_KEY, uniqueResumes.map(r => getSanitizedResumeForLocal(r))); // Persist cleaned data
          }
        } catch (cloudError) {
          console.error('Failed to fetch cloud resumes during load:', cloudError);
          // Continue with local resumes (already deduplicated in map)
        }
      }
      
      const finalResumes = Array.from(mergedMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);
      set({ resumes: finalResumes, isStoreLoading: false });
    } catch (error) {
      MagicDebugger.error("Failed to load resumes:", error);
      set({ isStoreLoading: false });
    }
  },
  
  createResume: async (name) => {
    const isCloudSyncOn = useSettingStore.getState().cloudSync;
    const { addResume } = get();
    
    const newId = Date.now().toString();
    const newResume: Resume = {
      ...initialResume,
      id: newId,
      name,
      updatedAt: Date.now(),
    };

    if (isCloudSyncOn) {
      try {
        const result = await resumeApi.syncResume(newResume);
        if (result && result.id) {
          const cloudResume: Resume = {
            ...newResume,
            id: result.id,
            updatedAt: new Date(result.updatedAt).getTime(),
          };
          addResume(cloudResume);
          return result.id;
        }
      } catch (error) {
        console.error('Failed to create resume in cloud:', error);
        toast.error(i18next.t('store.notifications.createCloudFailed'));
      }
    }

    addResume(newResume);
    return newId;
  },

  importResume: async (resume) => {
    const isCloudSyncOn = useSettingStore.getState().cloudSync;
    const { addResume } = get();

    if (isCloudSyncOn) {
      try {
        const result = await resumeApi.syncResume(resume);
        if (result && result.id) {
          const cloudResume: Resume = {
            ...resume,
            id: result.id,
            updatedAt: new Date(result.updatedAt).getTime(),
          };
          addResume(cloudResume);
          return result.id;
        }
      } catch (error) {
        console.error('Failed to import resume to cloud:', error);
        toast.error(i18next.t('store.notifications.importCloudFailed'));
      }
    }

    addResume(resume);
    return resume.id;
  },

  addResume: (resume) => {
    const { resumes } = get();
    if (resumes.some(r => r.id === resume.id)) {
        return; // Already exists
    }
    const newResumes = [resume, ...resumes]; // Add to beginning
    set({ resumes: newResumes });
    dbClient.setItem(RESUMES_KEY, newResumes.map(r => getSanitizedResumeForLocal(r)));
  },

  updateResume: (id, updates) => {
    const isCloudSyncOn = useSettingStore.getState().cloudSync;
    const now = Date.now();

    set(state => {
      const newResumes = state.resumes.map(r =>
        r.id === id ? { ...r, ...updates, updatedAt: now } : r
      );

      const isUpdatingActive = state.activeResume && state.activeResume.id === id;
      
      return { 
        resumes: newResumes,
        ...(isUpdatingActive && {
          activeResume: { ...state.activeResume!, ...updates, updatedAt: now },
          syncStatus: isCloudSyncOn ? 'modified' : 'local'
        })
      };
    });
    
    // We can't easily wait for DB here in a sync function, but subscribe handles it now
  },

  duplicateResume: async (id) => {
    const isCloudSyncOn = useSettingStore.getState().cloudSync;
    const resumeToDuplicate = get().resumes.find(r => r.id === id);
    if (!resumeToDuplicate) {
      toast.error(i18next.t('store.notifications.resumeNotFound'));
      return;
    }

    // Cloud Duplicate
    const isLocalId = !isNaN(Number(id)) && id.length > 10;
    if (isCloudSyncOn && !isLocalId) {
      try {
        toast.promise(
          async () => {
             const newResume = await resumeApi.duplicateResume(id);
             if (newResume) {
               // Add directly to store
               // Backend returns decrypted object similar to fetchOne
               // We must parse the content string to get the resume data (info, sections, etc)
               const parsedContent = typeof newResume.content === 'string' 
                  ? JSON.parse(newResume.content) 
                  : newResume.content;

               const cloudResume: Resume = {
                 ...parsedContent,
                 id: newResume.id,
                 name: newResume.title, // Backend uses 'title', Frontend uses 'name'
                 updatedAt: new Date(newResume.updatedAt).getTime(),
                 isPublic: false,
                 shareId: undefined,
                 shareRole: undefined,
                 versions: undefined,
                 // Ensure customTemplate is handled if backend returns string
                 customTemplate: typeof newResume.customTemplate === 'string' 
                   ? JSON.parse(newResume.customTemplate) 
                   : newResume.customTemplate
               };
               get().addResume(cloudResume);
             }
          },
          {
            loading: i18next.t('store.notifications.duplicatingInCloud'),
            success: i18next.t('store.notifications.duplicateCloudSuccess'),
            error: i18next.t('store.notifications.duplicateCloudError')
          }
        );
        return;
      } catch (error) {
        // Fallback or just error
        console.error("Cloud duplication failed", error);
        return;
      }
    }

    // Local Duplicate
    const newResume: Resume = {
      ...resumeToDuplicate,
      id: Date.now().toString(),
      name: `${resumeToDuplicate.name} (Copy)`,
      updatedAt: Date.now(),
      // Reset share fields
      isPublic: false,
      shareId: undefined,
      shareRole: undefined,
      // Strip history/versions/comments
      versions: undefined,
    };
    get().addResume(newResume);
    toast.success(i18next.t('store.notifications.resumeDuplicatedLocally', { name: resumeToDuplicate.name }));
  },

  renameResume: async (id, newName) => {
    const isCloudSyncOn = useSettingStore.getState().cloudSync;
    const now = Date.now();
    const { resumes } = get();
    const targetResume = resumes.find(r => r.id === id);

    if (!targetResume) return;

    // 1. Update local state immediately
    const updatedResume = { ...targetResume, name: newName, updatedAt: now };
    
    set(state => {
      const newResumes = state.resumes.map(r =>
        r.id === id ? updatedResume : r
      );
      const isUpdatingActive = state.activeResume && state.activeResume.id === id;
      
      return {
        resumes: newResumes,
        ...(isUpdatingActive && {
          activeResume: updatedResume
        })
      };
    });

    // 2. Persist local
    const currentResumes = get().resumes; // Retrieve updated list
    dbClient.setItem(RESUMES_KEY, currentResumes.map(r => getSanitizedResumeForLocal(r)));

    // 3. Sync to Cloud
    const isLocalId = !isNaN(Number(id)) && id.length > 10;
    if (isCloudSyncOn && !isLocalId) {
        try {
            await resumeApi.syncResume(updatedResume);
            toast.success(i18next.t('store.notifications.renameSuccess'));
        } catch (error) {
            console.error("Failed to rename in cloud", error);
            toast.error(i18next.t('store.notifications.renameCloudFailed'));
        }
    }
  },

  deleteResume: async (id) => {
    const isCloudSyncOn = useSettingStore.getState().cloudSync;
    const resumeToDelete = get().resumes.find(r => r.id === id);

    // If cloud sync is on and it's not a local ID, delete from cloud
    const isLocalId = !isNaN(Number(id)) && id.length > 10;
    if (isCloudSyncOn && !isLocalId) {
      try {
        await resumeApi.deleteResume(id);
      } catch (error) {
        console.error('Failed to delete cloud resume:', error);
        toast.error(i18next.t('store.notifications.deleteCloudFailed'));
      }
    }

    const newResumes = get().resumes.filter(r => r.id !== id);
    set({ resumes: newResumes });
    syncBaselines.delete(id);
    lastVersionSnapshotAt.delete(id);
    dbClient.setItem(RESUMES_KEY, newResumes.map(r => getSanitizedResumeForLocal(r)));
    toast.success(i18next.t('store.notifications.resumeDeleted', { name: resumeToDelete?.name || '' }));
  },

  deleteVersion: async (resumeId, versionId) => {
    // 1. If cloud sync enabled, try cloud delete first
    const isCloudSyncOn = useSettingStore.getState().cloudSync;
    const isLocalId = !isNaN(Number(resumeId)) && resumeId.length > 10;
    
    console.log('[deleteVersion] Debug:', {
      resumeId,
      versionId,
      isCloudSyncOn,
      isLocalId,
      willCallAPI: isCloudSyncOn && !isLocalId
    });
    
    if (isCloudSyncOn && !isLocalId) {
      try {
        console.log('[deleteVersion] Calling API to delete version...');
        await resumeApi.deleteVersion(resumeId, versionId);
        console.log('[deleteVersion] API call successful');
      } catch (error) {
        console.error('Failed to delete version from cloud:', error);
        toast.error(i18next.t('store.notifications.versionDeleteFailed'));
        return; // Don't delete locally if cloud failed (to keep sync)
      }
    } else {
      console.log('[deleteVersion] Skipping API call, proceeding with local deletion only');
    }

    // 2. Update local state (for both local and cloud resumes)
    const { resumes, activeResume } = get();
    const updatedResumes = resumes.map(r => {
      if (r.id === resumeId && r.versions) {
        return {
          ...r,
          versions: r.versions.filter(v => v.id !== versionId)
        };
      }
      return r;
    });

    const updatedActiveResume = activeResume?.id === resumeId && activeResume.versions
      ? {
          ...activeResume,
          versions: activeResume.versions.filter(v => v.id !== versionId)
        }
      : activeResume;

    set({ 
      resumes: updatedResumes,
      activeResume: updatedActiveResume
    });
    
    await dbClient.setItem(RESUMES_KEY, updatedResumes.map(r => getSanitizedResumeForLocal(r)));
    toast.success(i18next.t('store.notifications.versionDeleted'));
  },

  loadResumeForEdit: (id) => {
    const { resumes, isStoreLoading, loadResumes, fetchCloudResume } = get();
    const isCloudSyncOn = useSettingStore.getState().cloudSync;
    
    // 如果开启了云端同步且有 Token，主动拉取一次云端数据以保证最新
    // 增加：如果当前 activeResume 已经是这个 id 且刚刚同步过，或者正在通过 fetchCloudResume 同步，则跳过
    const { isSyncing, activeResume: currentActive } = get();
    if (isCloudSyncOn && !isSyncing) {
        if (!currentActive || currentActive.id !== id) {
            console.log('[Store] Cloud sync is ON, fetching latest resume data for edit:', id);
            fetchCloudResume(id);
        }
    }

    if (isStoreLoading) {
      loadResumes().then(() => {
        const updatedResumes = get().resumes;
        const resume = updatedResumes.find(r => r.id === id);
        if (resume) {
          // Data migration on the fly: Ensure 'basics' section exists
          const hasBasics = resume.sectionOrder.some(s => s.key === 'basics');
          
          set(state => {
            if (!state.activeResume || state.activeResume.id !== id) {
                if (!hasBasics) {
                    state.activeResume = {
                        ...resume,
                        sectionOrder: [
                          { key: 'basics', label: 'Basics' },
                          ...resume.sectionOrder,
                        ],
                    };
                } else {
                    state.activeResume = { ...resume };
                }
            }
          });
        }
      });
      return;
    }

    // 如果数据已经加载完成，从当前列表查找
    const resume = resumes.find(r => r.id === id);
    if (resume) {
      const hasBasics = resume.sectionOrder.some(s => s.key === 'basics');
      
      set(state => {
        // Only set if not already matched to avoid unnecessary re-renders
        if (state.activeResume?.id !== id) {
            if (!hasBasics) {
                state.activeResume = {
                    ...resume,
                    sectionOrder: [
                      { key: 'basics', label: 'Basics' },
                      ...resume.sectionOrder,
                    ],
                };
            } else {
                state.activeResume = { ...resume };
            }
        }
      });
    } else {
      MagicDebugger.warn(`Resume with id ${id} not found in local list.`);
    }
  },

  saveResume: async (type = 'auto', resumeData) => {
    const isCloudSyncOn = useSettingStore.getState().cloudSync;
    const now = Date.now();

    // Use provided resumeData or fallback to current state
    const targetResume = resumeData || get().activeResume;
    if (!targetResume) return;

    // 1. Update the resumes list (with snapshot and updatedAt)
    set(state => {
      const newResumes = state.resumes.map(r =>
        r.id === targetResume.id ? { ...r, updatedAt: now } : r
      );
      
      // Atomic comparison to avoid unnecessary reference changes if nothing changed
      const isUpdatingActive = state.activeResume && state.activeResume.id === targetResume.id;
      
      return {
        resumes: newResumes,
        ...(isUpdatingActive && {
          activeResume: { ...state.activeResume!, updatedAt: now }, // Trigger small update for timestamp
        }),
        syncStatus: 'syncing'
      };
    });

    // 2. If manual, trigger cloud sync and versioning immediately
    if (isCloudSyncOn) {
      if (type === 'manual') {
        // Sync the main record FIRST so the freshest activeResume is persisted to the
        // cloud, THEN snapshot a version. createVersion refreshes state from the cloud
        // and grabs the isSyncing lock; running it before the sync makes syncToCloud
        // silently skip the main-record PATCH and reverts activeResume to stale content.
        const outcome = await get().syncToCloud({ skipVersioning: true });
        if (outcome === 'noop') {
          // 内容自上次同步没变:不建冗余版本快照,也不假装"保存"了什么。
          toast.success(i18next.t('store.notifications.resumeUpToDate'));
          return;
        }
        if (outcome === 'failed') {
          // 同步失败(已 toast/置 error 态):跳过建版本,避免"失败提示后紧跟成功提示"。
          return;
        }
        await get().createVersion('manual', undefined, targetResume);
        toast.success(i18next.t('store.notifications.resumeSavedCloud'));
      } else {
        void get().syncToCloud();
      }
    } else {
        set({ syncStatus: 'local' });
        if (type === 'manual') toast.success(i18next.t('store.notifications.resumeSavedLocally'));
    }
  },

  createVersion: async (type, name, resumeData) => {
    const isCloudSyncOn = useSettingStore.getState().cloudSync;
    const targetResume = resumeData || get().activeResume;
    
    if (!targetResume) return;

    const isLocalId = isLocalResumeId(targetResume.id);
    if (isCloudSyncOn && !isLocalId) {
      try {
        const changelog = name || (type === 'manual' ? 'Manual Save' : 'Auto Save');
        // Push the version to cloud using the targetResume (latest data)
        const created = await resumeApi.createCloudVersion(targetResume.id, targetResume, changelog);
        lastVersionSnapshotAt.set(targetResume.id, Date.now());
        // 建版本服务端会 bump revision 并把 content 置为本版本内容;回写基线,
        // 否则下一次自动同步会吃一记无谓 409。doc 同步更新为本版本推送的文档。
        setSyncBaseline(targetResume.id, {
          ...(created?.resumeRevision !== undefined ? { revision: created.resumeRevision } : {}),
          doc: buildSyncDoc(targetResume),
        });
        // 只刷新版本列表:旧版在此 fetchCloudResume 整体拉回云端副本,请求往返窗口内
        // 用户刚打的字会被静默回滚(手动保存丢字的根因)。
        void get().refreshCloudVersions(targetResume.id);
      } catch (error) {
        console.error('Failed to create cloud version:', error);
      }
    }
  },

  restoreVersion: (versionId) => {
    const { activeResume, updateResume } = get();
    if (!activeResume || !activeResume.versions) return;

    const version = activeResume.versions.find(v => v.id === versionId);
    if (!version) {
      toast.error(i18next.t('store.notifications.versionNotFound'));
      return;
    }

    // Restore the data from the version
    const restoredData = JSON.parse(JSON.stringify(version.data));
    
    // updateResume will handle the IndexedDB persistence and updating activeResume
    updateResume(activeResume.id, {
      ...restoredData,
      updatedAt: Date.now()
    });
    
    toast.success(i18next.t('store.notifications.versionRestored'));
  },
  
  updateInfo: (info) => {
    const { activeResume } = get();
    if (!activeResume) return;
    
    const currentInfo = activeResume.info;
    const newInfo = { ...currentInfo, ...info };
    
    if (isEqual(currentInfo, newInfo)) {
      return;
    }

    set(state => {
      if (!state.activeResume) return;
      state.activeResume.info = newInfo;
      state.activeResume.updatedAt = Date.now();
      const resumeIndex = state.resumes.findIndex(r => r.id === state.activeResume?.id);
      if (resumeIndex !== -1) {
        state.resumes[resumeIndex].info = newInfo;
        state.resumes[resumeIndex].updatedAt = state.activeResume.updatedAt;
      }
      
      const isCloudSyncOn = useSettingStore.getState().cloudSync;
      state.syncStatus = isCloudSyncOn ? 'modified' : 'local';
    });
  },
  
  setSectionOrder: (sectionOrder) => {
    const { activeResume } = get();
    if (!activeResume) return;

    const normalizedSectionOrder = normalizeResumeSectionOrder(sectionOrder, activeResume.sections);

    if (isEqual(activeResume.sectionOrder, normalizedSectionOrder)) {
      return;
    }

    set(state => {
      if (!state.activeResume) return;
      state.activeResume.sectionOrder = normalizedSectionOrder;
      state.activeResume.updatedAt = Date.now();

      const resumeIndex = state.resumes.findIndex(r => r.id === state.activeResume?.id);
      if (resumeIndex !== -1) {
        state.resumes[resumeIndex].sectionOrder = normalizedSectionOrder;
        state.resumes[resumeIndex].updatedAt = state.activeResume.updatedAt;
      }

      const isCloudSyncOn = useSettingStore.getState().cloudSync;
      state.syncStatus = isCloudSyncOn ? 'modified' : 'local';
    });
  },

  updateSectionItems: (key, items) => {
    const { activeResume } = get();
    if (!activeResume) return;
    
    if (isEqual(activeResume.sections[key], items)) {
      return;
    }

    set(state => {
      if (!state.activeResume) return;
      state.activeResume.sections[key] = items;
      state.activeResume.updatedAt = Date.now();

      const resumeIndex = state.resumes.findIndex(r => r.id === state.activeResume?.id);
      if (resumeIndex !== -1) {
        state.resumes[resumeIndex].sections[key] = items;
        state.resumes[resumeIndex].updatedAt = state.activeResume.updatedAt;
      }

      const isCloudSyncOn = useSettingStore.getState().cloudSync;
      state.syncStatus = isCloudSyncOn ? 'modified' : 'local';
    });
  },

  updateSections: (sections) => {
    const { activeResume } = get();
    if (!activeResume) return;

    if (isEqual(activeResume.sections, sections)) {
      return;
    }

    set(state => {
      if (!state.activeResume) return;
      state.activeResume.sections = sections;
      state.activeResume.updatedAt = Date.now();

      const resumeIndex = state.resumes.findIndex(r => r.id === state.activeResume?.id);
      if (resumeIndex !== -1) {
        state.resumes[resumeIndex].sections = sections;
        state.resumes[resumeIndex].updatedAt = state.activeResume.updatedAt;
      }

      const isCloudSyncOn = useSettingStore.getState().cloudSync;
      state.syncStatus = isCloudSyncOn ? 'modified' : 'local';
    });
  },

  updateTemplate: (template) => {
    const { activeResume } = get();
    if (!activeResume || activeResume.template === template) return;

    set(state => {
      if (!state.activeResume) return;
      state.activeResume.template = template;
      state.activeResume.updatedAt = Date.now();

      const resumeIndex = state.resumes.findIndex(r => r.id === state.activeResume?.id);
      if (resumeIndex !== -1) {
        state.resumes[resumeIndex].template = template;
        state.resumes[resumeIndex].updatedAt = state.activeResume.updatedAt;
      }

      const isCloudSyncOn = useSettingStore.getState().cloudSync;
      state.syncStatus = isCloudSyncOn ? 'modified' : 'local';
    });
  },

  updateCustomTemplate: (customTemplate) => {
    const { activeResume } = get();
    if (!activeResume) return;
    if (isEqual(activeResume.customTemplate, customTemplate)) return;

    set(state => {
      if (!state.activeResume) return;
      state.activeResume.customTemplate = customTemplate;
      state.activeResume.updatedAt = Date.now();

      const resumeIndex = state.resumes.findIndex(r => r.id === state.activeResume?.id);
      if (resumeIndex !== -1) {
        state.resumes[resumeIndex].customTemplate = customTemplate;
        state.resumes[resumeIndex].updatedAt = state.activeResume.updatedAt;
      }

      const isCloudSyncOn = useSettingStore.getState().cloudSync;
      state.syncStatus = isCloudSyncOn ? 'modified' : 'local';
    });
  },

  updateThemeColor: (themeColor) => {
    const { activeResume } = get();
    if (!activeResume || activeResume.themeColor === themeColor) return;

    set(state => {
      if (!state.activeResume) return;
      state.activeResume.themeColor = themeColor;
      state.activeResume.updatedAt = Date.now();

      const resumeIndex = state.resumes.findIndex(r => r.id === state.activeResume?.id);
      if (resumeIndex !== -1) {
        state.resumes[resumeIndex].themeColor = themeColor;
        state.resumes[resumeIndex].updatedAt = state.activeResume.updatedAt;
      }

      const isCloudSyncOn = useSettingStore.getState().cloudSync;
      state.syncStatus = isCloudSyncOn ? 'modified' : 'local';
    });
  },

  updateTypography: (typography) => {
    const { activeResume } = get();
    if (!activeResume || activeResume.typography === typography) return;

    set(state => {
      if (!state.activeResume) return;
      state.activeResume.typography = typography;
      state.activeResume.updatedAt = Date.now();

      const resumeIndex = state.resumes.findIndex(r => r.id === state.activeResume?.id);
      if (resumeIndex !== -1) {
        state.resumes[resumeIndex].typography = typography;
        state.resumes[resumeIndex].updatedAt = state.activeResume.updatedAt;
      }

      const isCloudSyncOn = useSettingStore.getState().cloudSync;
      state.syncStatus = isCloudSyncOn ? 'modified' : 'local';
    });
  },

  setRightCollapsed: (collapsed) => set({ rightCollapsed: collapsed }),

  setLeftCollapsed: (collapsed) => set({ leftCollapsed: collapsed }),

  setActiveSection: (section) => set({ activeSection: section }),

  updateSharing: async (isPublic, shareRole) => {
    const { activeResume } = get();
    
    if (!activeResume) {
      toast.error(i18next.t('store.notifications.loginToShare'));
      return;
    }

    try {
        const result = await resumeApi.updateSharing(activeResume.id, { isPublic, shareRole });

        // 服务端任何 update 都会 bump revision(含分享设置):回写基线,否则下一次内容
        // 同步的条件写会撞一记良性 409。content 未变,doc 基线保留。
        const resultRevision = (result as { revision?: number } | null)?.revision;
        if (resultRevision !== undefined) {
          setSyncBaseline(activeResume.id, { revision: resultRevision });
        }

        // Update local state
        set(state => {
            if (!state.activeResume) return state;
            const updatedResume = { 
                ...state.activeResume, 
                isPublic: result.isPublic,
                shareId: result.shareId,
                shareRole: result.shareRole
            };
            
             const newResumes = state.resumes.map(r => 
                r.id === updatedResume.id ? updatedResume : r
            );
            
            return {
                activeResume: updatedResume,
                resumes: newResumes
            };
        });
        
        // Persist local
        const { resumes } = get();
        dbClient.setItem(RESUMES_KEY, resumes.map(r => getSanitizedResumeForLocal(r)));
        
        toast.success(isPublic 
          ? i18next.t('store.notifications.resumePublished') 
          : i18next.t('store.notifications.resumeUnpublished'));
    } catch (error) {
        console.error('Failed to update sharing:', error);
        toast.error(i18next.t('store.notifications.sharingUpdateFailed'));
    }
  },

  syncToCloud: async (options?: { skipVersioning?: boolean }): Promise<SyncOutcome> => {
    const { activeResume, isSyncing } = get();
    if (!activeResume || !useSettingStore.getState().cloudSync) return 'skipped';
    if (!await getAuthToken()) return 'skipped';

    // Prevent concurrent syncs (LOCK)
    // 注:被锁挡掉的触发不会丢 —— 正在跑的那次同步结束时会检测"飞行中是否有新编辑",
    // 有则自动续链一轮(见 finally),兜住这里 early-return 丢触发的场景。
    if (isSyncing) {
        console.log('[Sync] Sync is already in progress, skipping...');
        return 'skipped';
    }

    // 脏检查:与基线(最后已知与云端一致的文档)逐字段比较,内容没变就不打扰服务端。
    // 手动保存的调用方据 'noop' 提示"已是最新"并跳过建版本。
    const baseline = syncBaselines.get(activeResume.id);
    if (baseline?.doc && syncCompareKey(baseline.doc) === syncCompareKey(activeResume)) {
      console.log('[Sync] Content unchanged since last sync, skipping request.');
      set({ syncStatus: 'saved' });
      return 'noop';
    }

    // 飞行期间是否有新编辑落地;true 时在锁释放后自动补一轮同步。
    let hadNewerEdits = false;

    try {
      set({ isSyncing: true, syncStatus: 'syncing' });

      console.log('[Sync] Starting sync for resume:', activeResume.id, 'Is Local:', !isNaN(Number(activeResume.id)));
      const { result, sentDoc } = await syncWithConflictRecovery(
        activeResume,
        buildSyncDoc(activeResume),
        baseline,
        () => get().activeResume,
      );
      console.log('[Sync] Cloud returned:', result?.id, result?.updatedAt, 'rev:', result?.revision);
      // 播种基线:下次同步以本次实际推送的文档为基做增量 diff 与脏检查(冲突强推时
      // 它比入参更新)。ID rebind(本地临时 id → CUID)时迁移键。
      if (result?.id) {
        setSyncBaseline(result.id, { revision: result.revision, doc: sentDoc });
        if (result.id !== activeResume.id) syncBaselines.delete(activeResume.id);
      }
      
      // Update local resume ID if backend returned a different one (e.g. converting temp ID to CUID)
      // This is crucial for fixing the "duplicate resume on creation" issue
      const currentActive = get().activeResume; // Re-get latest state

      if (!currentActive) {
          console.warn('[Sync] Active resume lost during sync!');
          return 'synced'; // 推送本身已成功,只是本地态在飞行中被清了
      }

      if (result && result.id && result.id !== currentActive.id) {
          console.log('[Sync] ID Mismatch detected. Updating local ID from', currentActive.id, 'to', result.id);
          
          const oldId = currentActive.id;
          const newId = result.id;
          
          // Update in resumes list
          const newResumes = get().resumes.map(r => 
              r.id === oldId ? { ...r, id: newId, updatedAt: new Date(result.updatedAt).getTime() } : r
          );
          
          // Check if map actually worked
          const exists = newResumes.find(r => r.id === newId);
          if (!exists) {
             console.error('[Sync] Failed to update resume in list! Old ID not found?', oldId);
          } else {
             console.log('[Sync] Resume list updated successfully.');
          }
          
          // Update IndexedDB
          dbClient.setItem(RESUMES_KEY, newResumes.map(r => getSanitizedResumeForLocal(r)));
          
          // Update active resume state
          set({ 
              resumes: newResumes,
              activeResume: { ...currentActive, id: newId, updatedAt: new Date(result.updatedAt).getTime() }
          });
          console.log('[Sync] Active resume state updated to:', newId);
          
          // Update URL
          window.history.replaceState(null, '', `/dashboard/edit/${newId}`);
      } else {
          console.log('[Sync] No ID update needed or result invalid.', { resultId: result?.id, activeId: currentActive.id });
      }
      
      // Auto-versioning logic: Create a version if 5 minutes have passed since last version
      // This prevents spamming versions on every 10s sync
      if (!options?.skipVersioning) {
          const versions = currentActive.versions || [];
          const now = Date.now();
          // 冷却基准取"本地版本列表最新时间"与"会话内快照记录"的较大者:会话开头
          // versions 往往还没从云端加载(=0),仅靠它判定会导致每个会话的首次自动同步
          // 都建一个多余版本。
          const lastVersionTime = Math.max(
            versions.length > 0 ? Math.max(...versions.map(v => v.updatedAt)) : 0,
            lastVersionSnapshotAt.get(currentActive.id) ?? 0,
          );
          const cooldownMs = 5 * 60 * 1000;

          if (now - lastVersionTime > cooldownMs) {
            console.log('[Sync] Cooldown expired, creating auto-version...');
            get().createVersion('auto', undefined);
          } else {
            console.log('[Sync] Skipping auto-version (cooldown active). Last version at:', new Date(lastVersionTime).toLocaleTimeString());
          }
      } else {
          console.log('[Sync] Skipping auto-version as requested (skipVersioning=true).');
      }

      // Only claim 'saved' if no newer edit (or id rebind) landed while the request
      // was in flight; otherwise keep 'modified' so the follow-up sync flushes the
      // latest state instead of the UI lying that everything is persisted.
      const latest = get().activeResume;
      if (latest && latest.updatedAt !== activeResume.updatedAt) {
        set({ syncStatus: 'modified' });
        hadNewerEdits = true;
      } else {
        set({ syncStatus: 'saved' });
      }
      return 'synced';
    } catch (error) {
      console.error('[Sync] Cloud sync failed:', error);
      set({ syncStatus: 'error' });
      // 离线时静默(必然失败,状态 pill 在传达;网络恢复由编辑器的 online 监听补同步),
      // 在线失败按冷却窗节流,持续故障不随防抖节拍反复弹。
      const offline = typeof navigator !== 'undefined' && !navigator.onLine;
      if (!offline && Date.now() - lastSyncErrorToastAt > SYNC_ERROR_TOAST_COOLDOWN_MS) {
        lastSyncErrorToastAt = Date.now();
        toast.error(i18next.t('store.notifications.cloudSyncFailed'));
      }
      return 'failed';
    } finally {
      // Release LOCK
      set({ isSyncing: false });
      console.log('[Sync] Lock released.');
      // 飞行期间落地的新编辑不能干等下一次击键才同步:锁释放后自动续链一轮,1s 缓冲
      // 聚合紧随其后的连续输入。syncToCloud 自带锁与前置检查,链式调用安全;仅当飞行中
      // 确有新编辑才续,收敛不成环。
      if (hadNewerEdits) {
        setTimeout(() => {
          void get().syncToCloud();
        }, 1000);
      }
    }
  },

  fetchCloudResume: async (id: string) => {
    if (get().isSyncing) return;

    try {
      set({ isSyncing: true, syncStatus: 'syncing' });
      const cloudResume = (await resumeApi.fetchCloudResumeById(id)) as CloudResume;
      if (cloudResume) {
          const mergedResume = buildResumeFromCloud(cloudResume);

          const newResumes = get().resumes.map(r => r.id === id ? mergedResume : r);
          set({
            resumes: newResumes,
            activeResume: get().activeResume?.id === id ? mergedResume : get().activeResume,
            syncStatus: 'saved'
          });

          // Persist to local DB (Sanitized)
          dbClient.setItem(RESUMES_KEY, newResumes.map(r => getSanitizedResumeForLocal(r)));

          // 本地内容刚被云端副本整体替换 → 此刻本地 === 云端,是权威基线。
          setSyncBaseline(id, {
            revision: cloudResume.revision,
            doc: buildSyncDoc(mergedResume),
          });
      }
    } catch (error) {
      console.error('Failed to fetch individual cloud resume:', error);
      set({ syncStatus: 'error' });
    } finally {
      set({ isSyncing: false });
    }
  },

  // 只刷新版本列表(历史页 / 建版本后),不触内容字段。旧实现用 fetchCloudResume 整体
  // 拉回云端副本,会把"请求往返窗口内用户刚打的字"静默回滚 —— 打开历史弹窗都会丢字。
  refreshCloudVersions: async (id: string) => {
    if (isLocalResumeId(id) || !useSettingStore.getState().cloudSync) return;
    try {
      const versions = (await resumeApi.fetchVersions(id)) as CloudVersion[] | null;
      if (!Array.isArray(versions)) return;
      const normalized = normalizeCloudVersions(versions, id);
      set(state => {
        const applyVersions = (r: Resume) => (r.id === id ? { ...r, versions: normalized } : r);
        return {
          resumes: state.resumes.map(applyVersions),
          activeResume: state.activeResume ? applyVersions(state.activeResume) : state.activeResume,
        };
      });
    } catch (error) {
      console.error('Failed to refresh cloud versions:', error);
    }
  },

  // pagehide 退出送达:axios 在页面卸载后不保送达,keepalive fetch 会被浏览器托管送完。
  // 无条件全量(退出后无人处理 409;远端若有并发写,下次会话由 409 恢复流程收敛),
  // token 用最近一次请求的缓存(同步可得)。一切失败静默 —— 本地 IndexedDB 始终有底。
  flushSyncOnExit: () => {
    const { activeResume, syncStatus } = get();
    if (!activeResume || !useSettingStore.getState().cloudSync) return;
    if (syncStatus !== 'modified' && syncStatus !== 'error') return;
    const token = getCachedAuthToken();
    if (!token) return;
    resumeApi.syncResumeKeepalive(activeResume, token);
    // keepalive 送达与否此刻不可知,但它一旦落地服务端 revision 就会 ++;把基线清掉,
    // 万一页面从 bfcache 复活继续编辑,下次同步走无条件全量(LWW),而不是拿着过期
    // revision 吃一记无谓 409、平白多出一个"冲突备份"版本。
    syncBaselines.delete(activeResume.id);
  },
})));

// Debounced IndexedDB persistence to prevent data loss on page refresh
const debouncedLocalPersist = debounce((resumes: Resume[]) => {
  const sanitized = resumes.map(r => getSanitizedResumeForLocal(r));
  dbClient.setItem(RESUMES_KEY, sanitized);
  console.log('[Store] Persisted resumes to IndexedDB (Sanitized)');
}, 2000);

// Subscribe to store changes to trigger local persistence
useResumeStore.subscribe((state, prevState) => {
  if (state.resumes !== prevState.resumes) {
    debouncedLocalPersist(state.resumes);
  }
});

// Flush the debounced persist on tab hide / unload so an edit made within the 2s
// debounce window isn't lost on refresh or close.
if (typeof window !== 'undefined') {
  const flushLocalPersist = () => debouncedLocalPersist.flush();
  window.addEventListener('pagehide', flushLocalPersist);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushLocalPersist();
  });
}

// 移除立即加载，改为按需加载
// useResumeStore.getState().loadResumes();

export { useResumeStore };
