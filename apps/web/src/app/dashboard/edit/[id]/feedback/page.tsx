'use client';

import { FeedbackModal } from '@/app/dashboard/edit/_components/modals/FeedbackModal';
import { useRouter, useParams } from 'next/navigation';

export default function FeedbackPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.push(`/dashboard/edit/${id}`);
    }
  };

  return (
    <FeedbackModal
      open={true}
      onOpenChange={handleOpenChange}
    />
  );
}
