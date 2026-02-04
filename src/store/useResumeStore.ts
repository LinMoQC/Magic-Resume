import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import i18next from 'i18next';
import sidebarMenu from '@/lib/constants/sidebarMenu';
import { dbClient, RESUMES_KEY } from '@/lib/api/IndexDBClient';
import { MagicDebugger } from '@/lib/utils/debuggger';
import { toast } from "sonner";
import { useSettingStore } from './useSettingStore';
import { resumeApi } from '@/lib/api/resume';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import { 
  Resume, 
  InfoType, 
  Section, 
  SectionItem, 
  SectionOrder, 
  CustomTemplateConfig,
  CloudResume,
  CloudVersion
} from '@/types/frontend/resume';

type ResumeState = {
  resumes: Resume[];
  activeResume: Resume | null;
  isStoreLoading: boolean;
  rightCollapsed: boolean;
  activeSection: string;
  syncStatus: 'saved' | 'syncing' | 'modified' | 'local' | 'error';
  isSyncing: boolean;
  loadResumes: (token?: string) => Promise<void>;
  createResume: (name: string, token?: string) => Promise<string>;
  importResume: (resume: Resume, token?: string) => Promise<string>;
  addResume: (resume: Resume) => void;
  updateResume: (id: string, updates: Partial<Resume>) => void;
  duplicateResume: (id: string, token?: string) => Promise<void>;
  renameResume: (id: string, newName: string, token?: string) => Promise<void>;
  deleteResume: (id: string, token?: string) => Promise<void>;
  deleteVersion: (resumeId: string, versionId: string, token?: string) => Promise<void>;
  loadResumeForEdit: (id: string, token?: string) => void;
  saveResume: (token?: string, type?: 'auto' | 'manual', resumeData?: Resume) => Promise<void>;
  createVersion: (type: 'auto' | 'manual', name?: string, token?: string, resumeData?: Resume) => Promise<void>;
  restoreVersion: (versionId: string) => void;
  syncToCloud: (token: string, options?: { skipVersioning?: boolean }) => Promise<void>;
  fetchCloudResume: (id: string, token: string) => Promise<void>;
  updateInfo: (info: Partial<InfoType>) => void;
  setSectionOrder: (sectionOrder: SectionOrder[]) => void;
  updateSectionItems: (key: string, items: SectionItem[]) => void;
  updateSections: (sections: Section) => void;
  updateTemplate: (template: string) => void;
  updateCustomTemplate: (customTemplate: CustomTemplateConfig) => void;
  updateThemeColor: (themeColor: string) => void;
  updateTypography: (typography: string) => void;
  setRightCollapsed: (collapsed: boolean) => void;
  setActiveSection: (section: string) => void;
  updateSharing: (isPublic: boolean, shareRole: 'VIEWER' | 'COMMENTER' | 'EDITOR' | undefined, token: string) => Promise<void>;
  
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
  const sanitized: Omit<Resume, 'id' | 'updatedAt' | 'versions'> = {
    info: r.info || initialResume.info,
    sections: r.sections || initialResume.sections,
    sectionOrder: r.sectionOrder || initialResume.sectionOrder,
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

const useResumeStore = create<ResumeState>()(
  immer((set, get) => ({
    resumes: [],
    activeResume: null,
    isStoreLoading: true,
    rightCollapsed: false,
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

  loadResumes: async (token) => {
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
      if (isCloudSyncOn && token) {
        try {
          const cloudResult = await resumeApi.fetchCloudResumes(token);
          if (cloudResult && cloudResult.data) {
            // The response is wrapped by TransformInterceptor: { code: 200, data: { data: [...] }, ... }
            // So cloudResult.data is the { data: [...], total } object
            // We need to access cloudResult.data.data for the actual array
            const cloudResumes = (Array.isArray(cloudResult.data) 
                ? cloudResult.data 
                : (cloudResult.data?.data || [])) as CloudResume[];
            
            if (Array.isArray(cloudResumes)) {
                // Set of valid Cloud IDs
                const cloudIds = new Set(cloudResumes.map(cr => cr.id));

                cloudResumes.forEach(cr => {
                  const local = mergedMap.get(cr.id);
                  if (!local || new Date(cr.updatedAt).getTime() > local.updatedAt) {
                    // Convert cloud structure back to local if necessary
                    const rawParsed = typeof cr.content === 'string' ? JSON.parse(cr.content) : cr.content;
                    
                    // Strict whitelist sanitization using helper
                    const sanitizedContent = getSanitizedResume({
                      ...(rawParsed || {}),
                      name: cr.title,
                      isPublic: cr.isPublic,
                      shareId: cr.shareId,
                      shareRole: cr.shareRole
                    });
                    
                    const mergedResume: Resume = {
                      id: cr.id,
                      updatedAt: new Date(cr.updatedAt).getTime(),
                      ...sanitizedContent,
                      versions: ((cr.versions || local?.versions || []) as CloudVersion[]).map(v => ({
                        id: v.id,
                        updatedAt: v.createdAt ? new Date(v.createdAt).getTime() : (v.timestamp || Date.now()),
                        type: (v.changelog === 'Manual Save' ? 'manual' : (v.changelog === 'Auto Save' || v.changelog === 'Initial version' ? 'auto' : (v.type || 'auto'))) as 'manual' | 'auto',
                        name: v.changelog !== 'Manual Save' && v.changelog !== 'Auto Save' && v.changelog !== 'Initial version' ? v.changelog : '',
                        data: (() => {
                            const vRaw = typeof v.content === 'string' ? JSON.parse(v.content) : v.content;
                            return {
                                ...getSanitizedResume(vRaw || {}),
                                id: cr.id,
                                updatedAt: v.createdAt ? new Date(v.createdAt).getTime() : (v.timestamp || Date.now()),
                            } as Omit<Resume, 'versions'>;
                        })()
                      }))
                    };
                    mergedMap.set(cr.id, mergedResume);
                  }
                });

                // Filter out resumes that are NOT in the cloud list
                // This ensures we don't show local-only resumes or deleted cloud resumes
                // Source of truth for existence is Cloud, but content can be Local (if newer)
                for (const id of mergedMap.keys()) {
                    if (!cloudIds.has(id)) {
                        mergedMap.delete(id);
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
  
  createResume: async (name, token) => {
    const isCloudSyncOn = useSettingStore.getState().cloudSync;
    const { addResume } = get();
    
    const newId = Date.now().toString();
    const newResume: Resume = {
      ...initialResume,
      id: newId,
      name,
      updatedAt: Date.now(),
    };

    if (isCloudSyncOn && token) {
      try {
        const result = await resumeApi.syncResume(newResume, token);
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

  importResume: async (resume, token) => {
    const isCloudSyncOn = useSettingStore.getState().cloudSync;
    const { addResume } = get();

    if (isCloudSyncOn && token) {
      try {
        const result = await resumeApi.syncResume(resume, token);
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

  duplicateResume: async (id, token) => {
    const isCloudSyncOn = useSettingStore.getState().cloudSync;
    const resumeToDuplicate = get().resumes.find(r => r.id === id);
    if (!resumeToDuplicate) {
      toast.error(i18next.t('store.notifications.resumeNotFound'));
      return;
    }

    // Cloud Duplicate
    const isLocalId = !isNaN(Number(id)) && id.length > 10;
    if (isCloudSyncOn && !isLocalId && token) {
      try {
        toast.promise(
          async () => {
             const newResume = await resumeApi.duplicateResume(id, token);
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

  renameResume: async (id, newName, token) => {
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
    if (isCloudSyncOn && !isLocalId && token) {
        try {
            await resumeApi.syncResume(updatedResume, token);
            toast.success(i18next.t('store.notifications.renameSuccess'));
        } catch (error) {
            console.error("Failed to rename in cloud", error);
            toast.error(i18next.t('store.notifications.renameCloudFailed'));
        }
    }
  },

  deleteResume: async (id, token) => {
    const isCloudSyncOn = useSettingStore.getState().cloudSync;
    const resumeToDelete = get().resumes.find(r => r.id === id);

    // If cloud sync is on, it's not a local ID, and we have a token, delete from cloud
    const isLocalId = !isNaN(Number(id)) && id.length > 10;
    if (isCloudSyncOn && !isLocalId && token) {
      try {
        await resumeApi.deleteResume(id, token);
      } catch (error) {
        console.error('Failed to delete cloud resume:', error);
        toast.error(i18next.t('store.notifications.deleteCloudFailed'));
      }
    }

    const newResumes = get().resumes.filter(r => r.id !== id);
    set({ resumes: newResumes });
    dbClient.setItem(RESUMES_KEY, newResumes.map(r => getSanitizedResumeForLocal(r)));
    toast.success(i18next.t('store.notifications.resumeDeleted', { name: resumeToDelete?.name || '' }));
  },

  deleteVersion: async (resumeId, versionId, token) => {
    if (token) {
      try {
        await resumeApi.deleteVersion(resumeId, versionId, token);
        
        // Update local state by removing the version
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
        
        dbClient.setItem(RESUMES_KEY, updatedResumes.map(r => getSanitizedResumeForLocal(r)));
        toast.success(i18next.t('store.notifications.versionDeleted'));
      } catch (error) {
        console.error('Failed to delete version:', error);
        toast.error(i18next.t('store.notifications.versionDeleteFailed'));
      }
    }
  },

  loadResumeForEdit: (id, token) => {
    const { resumes, isStoreLoading, loadResumes, fetchCloudResume } = get();
    const isCloudSyncOn = useSettingStore.getState().cloudSync;
    
    // 如果开启了云端同步且有 Token，主动拉取一次云端数据以保证最新
    // 增加：如果当前 activeResume 已经是这个 id 且刚刚同步过，或者正在通过 fetchCloudResume 同步，则跳过
    const { isSyncing, activeResume: currentActive } = get();
    if (isCloudSyncOn && token && !isSyncing) {
        // 如果本地还没有或者 id 不匹配，或者明确需要更新
        if (!currentActive || currentActive.id !== id) {
            console.log('[Store] Cloud sync is ON, fetching latest resume data for edit:', id);
            fetchCloudResume(id, token);
        }
    }

    // 如果还在加载中，等待加载完成后再尝试
    if (isStoreLoading) {
      loadResumes(token).then(() => {
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

  saveResume: async (token, type = 'auto', resumeData) => {
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
    if (isCloudSyncOn && token) {
      if (type === 'manual') {
        // Create manual version using the EXPLICIT targetResume to ensure consistency
        await get().createVersion('manual', undefined, token, targetResume);
        // Manual save implies immediate cloud sync, skip the auto-versioning check
        await get().syncToCloud(token, { skipVersioning: true });
        toast.success(i18next.t('store.notifications.resumeSavedCloud'));
      } else {
        // Auto-save: just trigger syncToCloud
        get().syncToCloud(token);
      }
    } else {
        set({ syncStatus: 'local' });
        if (type === 'manual') toast.success(i18next.t('store.notifications.resumeSavedLocally'));
    }
  },

  createVersion: async (type, name, token, resumeData) => {
    const isCloudSyncOn = useSettingStore.getState().cloudSync;
    const targetResume = resumeData || get().activeResume;
    
    if (!targetResume) return;
    
    const isLocalId = !isNaN(Number(targetResume.id));
    if (isCloudSyncOn && token && !isLocalId) {
      try {
        const changelog = name || (type === 'manual' ? 'Manual Save' : 'Auto Save');
        // Push the version to cloud using the targetResume (latest data)
        await resumeApi.createCloudVersion(targetResume.id, targetResume, token, changelog);
        // Refresh cloud versions after creation to stay in sync
        get().fetchCloudResume(targetResume.id, token);
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

    if (isEqual(activeResume.sectionOrder, sectionOrder)) {
      return;
    }

    set(state => {
      if (!state.activeResume) return;
      state.activeResume.sectionOrder = sectionOrder;
      state.activeResume.updatedAt = Date.now();

      const resumeIndex = state.resumes.findIndex(r => r.id === state.activeResume?.id);
      if (resumeIndex !== -1) {
        state.resumes[resumeIndex].sectionOrder = sectionOrder;
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
  
  setActiveSection: (section) => set({ activeSection: section }),

  updateSharing: async (isPublic, shareRole, token) => {
    const { activeResume } = get();
    
    if (!activeResume || !token) {
      toast.error(i18next.t('store.notifications.loginToShare'));
      return;
    }

    try {
        const result = await resumeApi.updateSharing(activeResume.id, { isPublic, shareRole }, token);
        
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

  syncToCloud: async (token: string, options?: { skipVersioning?: boolean }) => {
    const { activeResume, isSyncing } = get();
    if (!activeResume || !useSettingStore.getState().cloudSync || !token) return;
    
    // Prevent concurrent syncs (LOCK)
    if (isSyncing) {
        console.log('[Sync] Sync is already in progress, skipping...');
        return;
    }

    try {
      set({ isSyncing: true, syncStatus: 'syncing' });
      
      console.log('[Sync] Starting sync for resume:', activeResume.id, 'Is Local:', !isNaN(Number(activeResume.id)));
      const result = await resumeApi.syncResume(activeResume, token);
      console.log('[Sync] Cloud returned:', result?.id, result?.updatedAt);
      
      // Update local resume ID if backend returned a different one (e.g. converting temp ID to CUID)
      // This is crucial for fixing the "duplicate resume on creation" issue
      const currentActive = get().activeResume; // Re-get latest state
      
      if (!currentActive) {
          console.warn('[Sync] Active resume lost during sync!');
          return;
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
          const lastVersionTime = versions.length > 0 
            ? Math.max(...versions.map(v => v.updatedAt)) 
            : 0;
          const cooldownMs = 5 * 60 * 1000;
          
          if (now - lastVersionTime > cooldownMs) {
            console.log('[Sync] Cooldown expired, creating auto-version...');
            get().createVersion('auto', undefined, token);
          } else {
            console.log('[Sync] Skipping auto-version (cooldown active). Last version at:', new Date(lastVersionTime).toLocaleTimeString());
          }
      } else {
          console.log('[Sync] Skipping auto-version as requested (skipVersioning=true).');
      }
      
      set({ syncStatus: 'saved' });
    } catch (error) {
      console.error('[Sync] Cloud sync failed:', error);
      set({ syncStatus: 'error' });
      toast.error(i18next.t('store.notifications.cloudSyncFailed'));
    } finally {
      // Release LOCK
      set({ isSyncing: false });
      console.log('[Sync] Lock released.');
    }
  },

  fetchCloudResume: async (id: string, token: string) => {
    if (get().isSyncing) return;
    
    try {
      set({ isSyncing: true, syncStatus: 'syncing' });
      const cloudResume = (await resumeApi.fetchCloudResumeById(id, token)) as CloudResume;
      if (cloudResume) {
          const { content: rawContent } = cloudResume;
          
          const rawParsed = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
          
          // Strict whitelist sanitization using helper
          const sanitizedContent = getSanitizedResume({
            ...(rawParsed || {}),
            name: cloudResume.title,
            isPublic: cloudResume.isPublic,
            shareId: cloudResume.shareId,
            shareRole: cloudResume.shareRole,
          });
          
          const mergedResume: Resume = {
            id: cloudResume.id,
            updatedAt: new Date(cloudResume.updatedAt).getTime(),
            ...sanitizedContent,
            versions: (cloudResume.versions || []).map(v => ({
              id: v.id,
              updatedAt: v.createdAt ? new Date(v.createdAt).getTime() : (v.timestamp || Date.now()),
              type: (v.changelog === 'Manual Save' ? 'manual' : (v.changelog === 'Auto Save' || v.changelog === 'Initial version' ? 'auto' : (v.type || 'auto'))) as 'manual' | 'auto',
              name: v.changelog !== 'Manual Save' && v.changelog !== 'Auto Save' && v.changelog !== 'Initial version' ? v.changelog : '',
              data: (() => {
                  const vRaw = typeof v.content === 'string' ? JSON.parse(v.content) : v.content;
                  return {
                      ...getSanitizedResume(vRaw || {}),
                      id: cloudResume.id,
                      updatedAt: v.createdAt ? new Date(v.createdAt).getTime() : (v.timestamp || Date.now()),
                  } as Omit<Resume, 'versions'>;
              })()
            }))
          };

          const newResumes = get().resumes.map(r => r.id === id ? mergedResume : r);
          set({ 
            resumes: newResumes,
            activeResume: get().activeResume?.id === id ? mergedResume : get().activeResume,
            syncStatus: 'saved'
          });
          
          // Persist to local DB (Sanitized)
          dbClient.setItem(RESUMES_KEY, newResumes.map(r => getSanitizedResumeForLocal(r)));
      }
    } catch (error) {
      console.error('Failed to fetch individual cloud resume:', error);
      set({ syncStatus: 'error' });
    } finally {
      set({ isSyncing: false });
    }
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

// 移除立即加载，改为按需加载
// useResumeStore.getState().loadResumes();

export { useResumeStore };