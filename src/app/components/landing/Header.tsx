"use client";

import Link from 'next/link';
import Image from 'next/image';
import StarOnGitHub from './StarOnGitHub';
export function Header() {

  return (
    <header className="fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-lg border-b border-neutral-800 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/magic-resume-logo.png" alt="magic-resume-logo" width={160} height={0} />
        </Link>
        <nav className="flex items-center md:gap-4">
          <StarOnGitHub />
          <Link href="/dashboard">
            <p className="bg-white hidden md:flex  text-black px-5 py-2 rounded-lg font-semibold hover:bg-neutral-200 transition-colors">
              Get Started
            </p>
          </Link>
        </nav>
      </div>
    </header>
  );
}
