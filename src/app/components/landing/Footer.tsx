"use client";

import Link from 'next/link';
import Image from 'next/image';
import { FaGithub } from 'react-icons/fa';
import StarOnGitHub from './StarOnGitHub';
import { useState, useEffect } from 'react';

export function Footer() {
  const [currentYear, setCurrentYear] = useState(2025); // 默认年份

  useEffect(() => {
    // 只在客户端设置实际年份，避免hydration错误
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t border-neutral-800">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/magic-resume-logo.png" alt="magic-resume-logo" width={140} height={0} />
            </Link>
            <p className="text-sm text-neutral-500 mt-2 md:mt-0 md:ml-4 md:border-l md:pl-4 border-neutral-700">
            {`© ${currentYear} Magic Resume. All rights reserved.`}
            </p>
          </div>
          <div className="flex items-center gap-6 text-neutral-400">
            <StarOnGitHub />
            <a href="https://github.com/LinMoQC/Magic-Resume" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <FaGithub className="w-10 h-10 md:w-6 md:h-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
