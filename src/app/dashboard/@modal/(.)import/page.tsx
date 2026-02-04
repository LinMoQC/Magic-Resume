'use client';

import { useRouter } from 'next/navigation';
import ImportResumeDialog from '../../_components/ImportResumeDialog';

export default function ImportResumePage() {
  const router = useRouter();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.back();
    }
  };

  return (
    <ImportResumeDialog
      open={true}
      onOpenChange={handleOpenChange}
    />
  );
}
