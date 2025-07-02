import { create } from 'zustand';
import sidebarMenu from '@/constant/sidebarMenu';
import { dbClient, RESUMES_KEY } from '@/lib/IndexDBClient';
import { MagicDebugger } from '@/lib/debuggger';
import { toast } from "sonner";

// 自定义模板配置类型 - 只保存用户修改的部分
export type CustomTemplateConfig = {
  // 设计令牌的部分自定义
  designTokens?: {
    colors?: Partial<{
      primary: string;
      secondary: string;
      text: string;
      textSecondary: string;
      background: string;
      border: string;
      accent?: string;
      sidebar?: string;
    }>;
    typography?: {
      fontFamily?: {
        primary?: string;
        secondary?: string;
        mono?: string;
      };
      fontSize?: Partial<{
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        xxl: string;
      }>;
      fontWeight?: Partial<{
        normal: number;
        medium: number;
        bold: number;
      }>;
    };
    spacing?: Partial<{
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    }>;
    borderRadius?: Partial<{
      none: string;
      sm: string;
      md: string;
      lg: string;
    }>;
  };
  
  // 布局的部分自定义
  layout?: {
    type?: 'single-column' | 'two-column' | 'sidebar' | 'grid';
    containerWidth?: string;
    containerHeight?: string;
    padding?: string;
    gap?: string;
    twoColumn?: {
      leftWidth?: string;
      rightWidth?: string;
      gap?: string;
    };
    sidebar?: {
      position?: 'left' | 'right';
      width?: string;
      gap?: string;
    };
  };
};

export type InfoType = {
  fullName: string;
  headline: string;
  email: string;
  phoneNumber: string;
  address: string;
  website: string;
  avatar: string;
};

export type SectionItem = {
  id: string;
  visible: boolean;
  [key: string]: string | boolean;
};

export type Section = {
  [key: string]: SectionItem[];
};

export type SectionOrder = {
  key: string;
  label: string;
};

export type Resume = {
  id: string;
  name: string;
  updatedAt: number;
  info: InfoType;
  sections: Section;
  sectionOrder: SectionOrder[];
  template: string; // 基础模板ID
  customTemplate?: CustomTemplateConfig; // 用户自定义的配置差异
  themeColor: string;
  typography: string;
  snapshot?: Blob;
};

type ResumeState = {
  resumes: Resume[];
  activeResume: Resume | null;
  isStoreLoading: boolean;
  rightCollapsed: boolean;
  activeSection: string;
  loadResumes: () => Promise<void>;
  addResume: (resume: Resume) => void;
  updateResume: (id: string, updates: Partial<Resume>) => void;
  duplicateResume: (id: string) => void;
  deleteResume: (id: string) => void;
  loadResumeForEdit: (id: string) => void;
  saveResume: (snapshot?: Blob) => void;
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
};

const useResumeStore = create<ResumeState>((set, get) => ({
  resumes: [],
  activeResume: null,
  isStoreLoading: true,
  rightCollapsed: false,
  activeSection: 'basics',

  loadResumes: async () => {
    if (!get().isStoreLoading) {
        set({ isStoreLoading: true });
    }
    try {
        const resumes = await dbClient.getItem<Resume[]>(RESUMES_KEY);
        set({ resumes: resumes || [], isStoreLoading: false });
    } catch (error) {
        MagicDebugger.error("Failed to load resumes:", error);
        set({ isStoreLoading: false });
    }
  },
  
  addResume: (resume) => {
    const newResumes = [...get().resumes, resume];
    set({ resumes: newResumes });
    dbClient.setItem(RESUMES_KEY, newResumes);
    toast.success(`Resume "${resume.name}" created.`);
  },

  updateResume: (id, updates) => {
    const newResumes = get().resumes.map(r =>
      r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r
    );
    set({ resumes: newResumes });
    dbClient.setItem(RESUMES_KEY, newResumes);
    
    const activeResume = get().activeResume;
    if (activeResume && activeResume.id === id) {
      set({ activeResume: { ...activeResume, ...updates } });
    }
  },

  duplicateResume: (id) => {
    const resumeToDuplicate = get().resumes.find(r => r.id === id);
    if (!resumeToDuplicate) {
      toast.error(`Resume not found.`);
      return;
    }
    const newResume: Resume = {
      ...resumeToDuplicate,
      id: Date.now().toString(),
      name: `${resumeToDuplicate.name} (Copy)`,
      updatedAt: Date.now(),
      snapshot: undefined, // Do not copy the snapshot
    };
    get().addResume(newResume);
    toast.success(`Resume "${resumeToDuplicate.name}" duplicated.`);
  },

  deleteResume: (id) => {
    const resumeToDelete = get().resumes.find(r => r.id === id);
    const newResumes = get().resumes.filter(r => r.id !== id);
    set({ resumes: newResumes });
    dbClient.setItem(RESUMES_KEY, newResumes);
    toast.success(`Resume "${resumeToDelete?.name || ''}" deleted.`);
  },

  loadResumeForEdit: (id) => {
    const { resumes, isStoreLoading, loadResumes } = get();
    
    // 如果还在加载中，等待加载完成后再尝试
    if (isStoreLoading) {
      loadResumes().then(() => {
        const updatedResumes = get().resumes;
        const resume = updatedResumes.find(r => r.id === id);
        if (resume) {
          // Data migration on the fly: Ensure 'basics' section exists
          if (!resume.sectionOrder.find(s => s.key === 'basics')) {
            const migratedResume = {
              ...resume,
              sectionOrder: [
                { key: 'basics', label: 'Basics' },
                ...resume.sectionOrder,
              ],
            };
            set({ activeResume: migratedResume });
          } else {
            set({ activeResume: { ...resume } });
          }
        } else {
          MagicDebugger.warn(`Resume with id ${id} not found.`);
        }
      });
      return;
    }

    // 如果数据已经加载完成，直接查找
    const resume = resumes.find(r => r.id === id);
    if (resume) {
      // Data migration on the fly: Ensure 'basics' section exists
      if (!resume.sectionOrder.find(s => s.key === 'basics')) {
        const migratedResume = {
          ...resume,
          sectionOrder: [
            { key: 'basics', label: 'Basics' },
            ...resume.sectionOrder,
          ],
        };
        set({ activeResume: migratedResume });
      } else {
        set({ activeResume: { ...resume } });
      }
    } else {
      MagicDebugger.warn(`Resume with id ${id} not found.`);
    }
  },

  saveResume: (snapshot) => {
    const { activeResume, updateResume } = get();
    if (activeResume) {
      const updates: Partial<Resume> = {
        updatedAt: Date.now(),
      };
      if (snapshot) {
        updates.snapshot = snapshot;
      }
      updateResume(activeResume.id, { ...activeResume, ...updates });
      toast.success('Resume saved!');
    }
  },
  
  updateInfo: (info) => {
    set(state => {
      if (!state.activeResume) return state;
      return {
        activeResume: {
          ...state.activeResume,
          info: { ...state.activeResume.info, ...info }
        }
      };
    });
  },
  
  setSectionOrder: (sectionOrder) => {
    set(state => {
      if (!state.activeResume) return state;
      return {
        activeResume: { ...state.activeResume, sectionOrder }
      };
    });
  },

  updateSectionItems: (key, items) => {
    set(state => {
      if (!state.activeResume) return state;
      return {
        activeResume: {
          ...state.activeResume,
          sections: { ...state.activeResume.sections, [key]: items }
        }
      };
    });
  },

  updateSections: (sections) => {
    set(state => {
      if (!state.activeResume) return state;
      return {
        activeResume: { ...state.activeResume, sections }
      };
    });
  },

  updateTemplate: (template) => {
    set(state => {
      if (!state.activeResume) return state;
      return {
        activeResume: { ...state.activeResume, template }
      };
    });
  },

  updateCustomTemplate: (customTemplate) => {
    set(state => {
      if (!state.activeResume) return state;
      return {
        activeResume: { ...state.activeResume, customTemplate }
      };
    });
  },

  updateThemeColor: (themeColor) => {
    set(state => {
      if (!state.activeResume) return state;
      return {
        activeResume: { ...state.activeResume, themeColor }
      };
    });
  },

  updateTypography: (typography) => {
    set(state => {
      if (!state.activeResume) return state;
      return {
        activeResume: { ...state.activeResume, typography }
      };
    });
  },

  setRightCollapsed: (collapsed) => set({ rightCollapsed: collapsed }),
  
  setActiveSection: (section) => set({ activeSection: section }),
}));

// 移除立即加载，改为按需加载
// useResumeStore.getState().loadResumes();

export { useResumeStore };