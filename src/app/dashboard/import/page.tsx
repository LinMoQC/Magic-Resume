'use client';

import { useRouter } from 'next/navigation';
import ImportResumeDialog from '../_components/ImportResumeDialog';

export default function ImportResumePage() {
  const router = useRouter();

  // On hard navigation, close goes to dashboard
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.push('/dashboard');
    }
  };

  return (
    <ImportResumeDialog
      open={true}
      onOpenChange={handleOpenChange}
    />
  );
}
