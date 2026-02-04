"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Resume } from '@/types/frontend/resume';
import { useResumeStore } from '@/store/useResumeStore';
import { useSettingStore } from '@/store/useSettingStore';
import { useAuth } from '@clerk/nextjs';
import ResumeList from './_components/ResumeList';
import RenameResumeDialog from './_components/RenameResumeDialog';
import { useTrace } from '@/hooks/useTrace';

export default function Dashboard() {
  const router = useRouter();
  const { resumes, deleteResume, duplicateResume, loadResumes, renameResume } = useResumeStore();
  const { loadSettings } = useSettingStore();
  const { getToken } = useAuth();
  const { traceDashboardViewed, traceCreateResume, traceImportResume } = useTrace();

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [resumeToRename, setResumeToRename] = useState<Resume | null>(null);
  const [newName, setNewName] = useState('');

  // Dashboard initialization
  const initialized = React.useRef(false);

  useEffect(() => {
    // Prevent double invocation in React Strict Mode
    if (initialized.current) return;
    initialized.current = true;

    const initializeDashboard = async () => {
      try {
        const token = await getToken();
        await Promise.all([
          loadResumes(token || undefined),
          loadSettings()
        ]);
        // 追踪 Dashboard 查看，使用 store 中的最新状态
        const currentResumes = useResumeStore.getState().resumes;
        traceDashboardViewed(currentResumes.length);
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
      }
    };

    initializeDashboard();
  }, [loadResumes, loadSettings, traceDashboardViewed, getToken]);

  const handleOpenRenameDialog = (resume: Resume) => {
    setResumeToRename(resume);
    setNewName(resume.name);
    setRenameDialogOpen(true);
  };

  const handleRename = async () => {
    if (resumeToRename && newName.trim()) {
      const token = await getToken();
      await renameResume(resumeToRename.id, newName, token || undefined);
      setRenameDialogOpen(false);
      setResumeToRename(null);
    }
  };

  const handleAdd = () => {
    traceCreateResume();
    router.push('/dashboard/new');
  };

  const handleImport = () => {
    traceImportResume();
    router.push('/dashboard/import');
  };

  const handleResumeDelete = async (id: string) => {
    const token = await getToken();
    await deleteResume(id, token || undefined);
  };

  const handleDuplicate = async (id: string) => {
    const token = await getToken();
    duplicateResume(id, token || undefined);
  };

  return (
    <main className="flex flex-col h-full">
      <RenameResumeDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        newName={newName}
        setNewName={setNewName}
        handleRename={handleRename}
      />
      <ResumeList
        resumes={resumes}
        onAdd={handleAdd}
        onImport={handleImport}
        onDelete={handleResumeDelete}
        onDuplicate={handleDuplicate}
        onRename={handleOpenRenameDialog}
      />
    </main>
  );
} 