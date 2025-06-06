import { SignIn } from '@clerk/nextjs';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignIn afterSignInUrl="/" />
    </main>
  );
} 