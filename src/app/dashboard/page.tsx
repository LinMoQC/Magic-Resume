"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useResumeStore, Resume } from '@/store/useResumeStore';
import { useSettingStore } from '@/store/useSettingStore';
import { useAuth } from '@clerk/nextjs';
import NewResumeDialog from './_components/NewResumeDialog';
import ImportResumeDialog from './_components/ImportResumeDialog';
import ResumeList from './_components/ResumeList';
import RenameResumeDialog from './_components/RenameResumeDialog';
import { useTrace } from '@/app/hooks/useTrace';

export default function Dashboard() {
  const router = useRouter();
  const { resumes, createResume, deleteResume, duplicateResume, updateResume, loadResumes } = useResumeStore();
  const { loadSettings } = useSettingStore();
  const { getToken } = useAuth();
  const { traceDashboardViewed, traceCreateResume, traceResumeCreated, traceImportResume } = useTrace();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [resumeToRename, setResumeToRename] = useState<Resume | null>(null);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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

  const handleRename = () => {
    if (resumeToRename && newName.trim()) {
      updateResume(resumeToRename.id, { name: newName });
      setRenameDialogOpen(false);
      setResumeToRename(null);
    }
  };

  const handleAdd = () => {
    traceCreateResume();
    setNewName('');
    setDialogOpen(true);
  };

  const handleImport = () => {
    traceImportResume();
    setImportDialogOpen(true);
  };

  const handleCreate = async () => {
    if (newName.trim()) {
      setIsCreating(true);
      try {
        const token = await getToken();
        const newId = await createResume(newName, token || undefined);
        setDialogOpen(false);
        router.push(`/dashboard/edit/${newId}`);
        traceResumeCreated(newId);
      } finally {
        setIsCreating(false);
      }
    }
  };

  const handleResumeDelete = async (id: string) => {
    const token = await getToken();
    await deleteResume(id, token || undefined);
  };

  return (
    <main className="flex flex-col h-full">
      <NewResumeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        newName={newName}
        setNewName={setNewName}
        handleCreate={handleCreate}
        isLoading={isCreating}
      />
      <ImportResumeDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
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
        onDuplicate={duplicateResume}
        onRename={handleOpenRenameDialog}
      />
    </main>
  );
} 