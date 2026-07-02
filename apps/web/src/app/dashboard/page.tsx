"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Resume } from '@/types/frontend/resume';
import { useResumeStore } from '@/store/useResumeStore';
import { useSettingStore } from '@/store/useSettingStore';
import ResumeList from './_components/ResumeList';
import RenameResumeDialog from './_components/RenameResumeDialog';
import { appLifecycle } from '@/lib/extensions/app-lifecycle';

export default function Dashboard() {
  const router = useRouter();
  const { resumes, deleteResume, duplicateResume, loadResumes, renameResume } = useResumeStore();
  const { loadSettings } = useSettingStore();

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [resumeToRename, setResumeToRename] = useState<Resume | null>(null);
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const initialized = React.useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initializeDashboard = async () => {
      try {
        setIsLoading(true);
        await Promise.all([loadResumes(), loadSettings()]);
        const currentResumes = useResumeStore.getState().resumes;
        appLifecycle.dashboardViewed({ resumeCount: currentResumes.length });
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, [loadResumes, loadSettings]);

  const handleOpenRenameDialog = useCallback((resume: Resume) => {
    setResumeToRename(resume);
    setNewName(resume.name);
    setRenameDialogOpen(true);
  }, []);

  const handleRename = useCallback(async () => {
    if (resumeToRename && newName.trim()) {
      await renameResume(resumeToRename.id, newName);
      setRenameDialogOpen(false);
      setResumeToRename(null);
    }
  }, [resumeToRename, newName, renameResume]);

  const handleAdd = useCallback(() => {
    appLifecycle.resumeCreateRequested();
    router.push('/dashboard/new');
  }, [router]);

  const handleImport = useCallback(() => {
    appLifecycle.resumeImportRequested();
    router.push('/dashboard/import');
  }, [router]);

  const handleResumeDelete = useCallback(async (id: string) => {
    await deleteResume(id);
  }, [deleteResume]);

  const handleDuplicate = useCallback(async (id: string) => {
    duplicateResume(id);
  }, [duplicateResume]);

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
        isLoading={isLoading}
      />
    </main>
  );
}
