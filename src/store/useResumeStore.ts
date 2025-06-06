import { create } from 'zustand';
import sidebarMenu from '@/constant/sidebarMenu';

export type InfoType = {
  avatar: string;
  fullName: string;
  headline: string;
  email: string;
  website: string;
  phone: string;
  location: string;
  summary: string;
  customFields: { icon: string; name: string; value: string }[];
};

export type SectionItem = {
  id: string;
  [key: string]: string | number | boolean | undefined;
};

export type Section = {
  [key: string]: SectionItem[];
}

export type SectionOrder = {
  key: string;
  title: string;
  visible: boolean;
};

export type ActiveResume = {
  info: InfoType;
  sections: Section;
  sectionOrder: SectionOrder[];
};

export interface Resume {
  id: string;
  name: string;
  data: Partial<ActiveResume>;
  updatedAt: number;
}

interface ResumeStore {
  resumes: Resume[];
  activeResume: ActiveResume | null;
  activeResumeId: string | null;
  isStoreLoading: boolean;
  activeSection: string | null;
  rightCollapsed: boolean;
  addResume: (name: string) => string;
  deleteResume: (id: string) => void;
  updateResume: (id: string, data: Partial<ActiveResume>) => void;
  getResume: (id: string) => Resume | undefined;
  loadResumeForEdit: (id: string) => void;
  saveResume: () => Promise<void>;
  setSectionOrder: (order: SectionOrder[]) => void;
  setRightCollapsed: (collapsed: boolean) => void;
  setActiveSection: (section: string) => void;
  updateSectionItems: (key: string, items: SectionItem[]) => void;
  updateInfo: (key: keyof InfoType, value: string | { icon: string; name: string; value: string }[]) => void;
  addCustomField: (field: { icon: string; name: string; value: string }) => void;
  removeCustomField: (index: number) => void;
}

const LOCAL_KEY = 'resumes';

function loadResumes(): Resume[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveResumes(resumes: Resume[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(resumes));
}

const initialActiveResume: ActiveResume = {
  info: {
    avatar: '',
    fullName: '',
    headline: '',
    email: '',
    website: '',
    phone: '',
    location: '',
    summary: '',
    customFields: [],
  },
  sections: {},
  sectionOrder: [
    { key: 'basics', title: 'Basics', visible: true },
    ...sidebarMenu.map(s => ({ key: s.key, title: s.label, visible: true }))
  ],
};
sidebarMenu.forEach(s => {
  initialActiveResume.sections[s.key] = [];
});

export const useResumeStore = create<ResumeStore>((set, get) => ({
  resumes: [],
  activeResume: null,
  activeResumeId: null,
  isStoreLoading: true,
  activeSection: 'basics',
  rightCollapsed: false,
  addResume: (name) => {
    const id = Date.now().toString();
    const newResume: Resume = { id, name, data: initialActiveResume, updatedAt: Date.now() };
    const resumes = [...get().resumes, newResume];
    set({ resumes });
    saveResumes(resumes);
    return id;
  },
  deleteResume: (id) => {
    const resumes = get().resumes.filter(r => r.id !== id);
    set({ resumes });
    saveResumes(resumes);
  },
  updateResume: (id, data) => {
    const resumes = get().resumes.map(r => r.id === id ? { ...r, data: {...r.data, ...data}, updatedAt: Date.now() } : r);
    set({ resumes });
    saveResumes(resumes);
  },
  getResume: (id) => {
    return get().resumes.find(r => r.id === id);
  },
  loadResumeForEdit: (id: string) => {
    set({ isStoreLoading: true });
    const resume = get().resumes.find(r => r.id === id);
    if (resume) {
      const activeData = { ...initialActiveResume, ...resume.data };
      const sections = { ...initialActiveResume.sections, ...(resume.data.sections || {}) };
      sidebarMenu.forEach(s => {
        if (!sections[s.key]) {
          sections[s.key] = [];
        }
      });
      activeData.sections = sections;
      
      if (!activeData.sectionOrder || activeData.sectionOrder.length === 0) {
        activeData.sectionOrder = initialActiveResume.sectionOrder;
      }
      set({ activeResume: activeData as ActiveResume, activeResumeId: id, isStoreLoading: false });
    } else {
       set({ isStoreLoading: false });
    }
  },
  saveResume: async () => {
    const { activeResume, activeResumeId } = get();
    if (activeResume && activeResumeId) {
      get().updateResume(activeResumeId, activeResume);
    }
  },
  setSectionOrder: (order: SectionOrder[]) => {
    set(state => ({
      activeResume: state.activeResume ? { ...state.activeResume, sectionOrder: order } : null
    }));
  },
  setRightCollapsed: (collapsed: boolean) => {
    set({ rightCollapsed: collapsed });
  },
  setActiveSection: (section: string) => set({ activeSection: section }),
  updateSectionItems: (key: string, items: SectionItem[]) => {
    set(state => ({
      activeResume: state.activeResume ? { ...state.activeResume, sections: { ...state.activeResume.sections, [key]: items } } : null
    }));
  },
  updateInfo: (key: keyof InfoType, value: string | { icon: string; name: string; value: string }[]) => {
    set(state => ({
      activeResume: state.activeResume ? { ...state.activeResume, info: { ...state.activeResume.info, [key]: value } } : null
    }));
  },
  addCustomField: (field) => {
    set(state => {
      if (!state.activeResume) return {};
      const customFields = [...state.activeResume.info.customFields, field];
      return {
        activeResume: {
          ...state.activeResume,
          info: { ...state.activeResume.info, customFields }
        }
      };
    });
  },
  removeCustomField: (index: number) => {
    set(state => {
      if (!state.activeResume) return {};
      const customFields = state.activeResume.info.customFields.filter((_, i) => i !== index);
      return {
        activeResume: {
          ...state.activeResume,
          info: { ...state.activeResume.info, customFields }
        }
      };
    });
  }
}));

if (typeof window !== 'undefined') {
  useResumeStore.setState({ resumes: loadResumes() });
}