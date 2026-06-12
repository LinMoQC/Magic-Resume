'use client';
import { useRouter } from 'next/navigation';
import { FeedbackModal } from '@/app/dashboard/edit/_components/modals/FeedbackModal';

export default function FeedbackModalPage() {
  const router = useRouter();
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.back();
    }
  };

  return (
    <FeedbackModal
      open={true}
      onOpenChange={handleOpenChange}
    />
  );
}
