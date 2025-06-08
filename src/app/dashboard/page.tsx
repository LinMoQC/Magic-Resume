'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useResumeStore } from '@/store/useResumeStore';
import NewResumeDialog from './_components/NewResumeDialog';
import ImportResumeDialog from './_components/ImportResumeDialog';
import ResumeList from './_components/ResumeList';

export default function Dashboard() {
  const router = useRouter();
  const { resumes, addResume, deleteResume } = useResumeStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    setNewName('');
    setDialogOpen(true);
  };

  const handleImport = () => {
    setImportDialogOpen(true);
  };

  const handleCreate = () => {
    if (newName.trim()) {
      const newResumeId = addResume(newName);
      setDialogOpen(false);
      router.push(`/dashboard/edit/${newResumeId}`);
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
      <ResumeList
        resumes={resumes}
        onAdd={handleAdd}
        onImport={handleImport}
        onDelete={deleteResume}
      />
    </main>
  );
} 