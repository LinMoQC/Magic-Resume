import { redirect } from 'next/navigation';
import { isCloudMode } from '@/lib/config/app';
import { SignIn } from '@clerk/nextjs';

export default function Page() {
  if (!isCloudMode) redirect('/dashboard');
  return (
    <div className="flex justify-center items-center h-screen">
      <SignIn />
    </div>
  );
}
