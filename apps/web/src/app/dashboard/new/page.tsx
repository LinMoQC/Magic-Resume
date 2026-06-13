'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { useTrace } from '@/hooks/useTrace';
import NewResumeDialog from '../_components/NewResumeDialog';

export default function NewResumePage() {
  const router = useRouter();
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { createResume } = useResumeStore();
  const { traceResumeCreated } = useTrace();

  // On hard navigation, "closing" the dialog should typically go back to dashboard
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.push('/dashboard');
    }
  };

  const handleCreate = async () => {
    if (newName.trim()) {
      setIsCreating(true);
      try {
        const newId = await createResume(newName);
        router.push(`/dashboard/edit/${newId}`);
        traceResumeCreated(newId);
      } catch (error) {
        console.error('Failed to create resume:', error);
      } finally {
        setIsCreating(false);
      }
    }
  };

  return (
    <NewResumeDialog
      open={true}
      onOpenChange={handleOpenChange}
      newName={newName}
      setNewName={setNewName}
      handleCreate={handleCreate}
      isLoading={isCreating}
    />
  );
}
