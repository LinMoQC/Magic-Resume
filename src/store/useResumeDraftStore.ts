import { create } from 'zustand';
import { Resume, initialResume } from './useResumeStore';
import { nanoid } from 'nanoid';

interface ResumeDraftState {
  resumeDraft: Resume;
  setResumeDraft: (resume: Resume) => void;
}

export const useResumeDraftStore = create<ResumeDraftState>((set) => ({
  resumeDraft: {
    ...initialResume,
    id: nanoid(),
    name: 'AI Draft',
    updatedAt: Date.now(),
  },
  setResumeDraft: (resume) => set({ resumeDraft: resume }),
})); 