"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useResumeStore, initialResume, Resume } from '@/store/useResumeStore';
import { useSettingStore } from '@/store/useSettingStore';
import NewResumeDialog from './_components/NewResumeDialog';
import ImportResumeDialog from './_components/ImportResumeDialog';
import ResumeList from './_components/ResumeList';
import RenameResumeDialog from './_components/RenameResumeDialog';
import { useTrace } from '@/app/hooks/useTrace';

export default function Dashboard() {
  const router = useRouter();
  const { resumes, addResume, deleteResume, duplicateResume, updateResume, loadResumes } = useResumeStore();
  const { loadSettings } = useSettingStore();
  const { traceDashboardViewed, traceCreateResume, traceResumeCreated, traceImportResume } = useTrace();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [resumeToRename, setResumeToRename] = useState<Resume | null>(null);
  const [newName, setNewName] = useState('');

  // 初始化dashboard数据
  useEffect(() => {

    const initializeDashboard = async () => {
      try {
        await Promise.all([
          loadResumes(),
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
  }, [loadResumes, loadSettings, traceDashboardViewed]);

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

  const handleCreate = () => {
    if (newName.trim()) {
      const newId = Date.now().toString();
      const newResume = {
        ...initialResume,
        id: newId,
        name: newName,
        updatedAt: Date.now(),
      };
      addResume(newResume);
      traceResumeCreated(newId);
      setDialogOpen(false);
      router.push(`/dashboard/edit/${newId}`);
    }
  };

  return (
    <main className="flex flex-col h-full">
      <NewResumeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        newName={newName}
        setNewName={setNewName}
        handleCreate={handleCreate}
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
        onDelete={deleteResume}
        onDuplicate={duplicateResume}
        onRename={handleOpenRenameDialog}
      />
    </main>
  );
} 