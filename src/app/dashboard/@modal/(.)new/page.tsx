'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { useAuth } from '@clerk/nextjs';
import { useTrace } from '@/hooks/useTrace';
import NewResumeDialog from '../../_components/NewResumeDialog';

export default function NewResumePage() {
  const router = useRouter();
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { createResume } = useResumeStore();
  const { getToken } = useAuth();
  const { traceResumeCreated } = useTrace();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.back();
    }
  };

  const handleCreate = async () => {
    if (newName.trim()) {
      setIsCreating(true);
      try {
        const token = await getToken();
        // Use router.replace to avoid stale history stack issues when redirecting from a modal
        const newId = await createResume(newName, token || undefined);
        router.back(); // Close modal first
        setTimeout(() => {
           router.push(`/dashboard/edit/${newId}`);
        }, 100);
        
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
