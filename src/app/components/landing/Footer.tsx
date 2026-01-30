"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiGithub } from 'react-icons/fi';
import { useTrace } from '@/app/hooks/useTrace';

export function Footer() {
  const { t } = useTranslation();
  const [currentYear, setCurrentYear] = useState(2025);
  const [stars, setStars] = useState<number | null>(null);
  const { traceGithubStar } = useTrace();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    
    // Fetch GitHub stars
    fetch('/api/github-stars')
      .then(res => res.json())
      .then(data => {
        if (data.stars) setStars(data.stars);
      })
      .catch(console.error);
  }, []);

  return (
    <footer className="border-t border-white/5 bg-[#0a0a0a] pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-4 max-w-sm">
            <Link 
              href="/" 
              className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 tracking-tight"
            >
              Magic Resume
            </Link>
            <p className="text-neutral-400 text-sm leading-relaxed">
              {t("landing.footer.brandSubtitle")}
            </p>
          </div>

          {/* Links */}
          <div className="hidden md:grid grid-cols-2 gap-12 sm:gap-16">
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-semibold text-white tracking-wide">{t("landing.footer.product")}</h4>
              <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-white transition-colors">
                {t("landing.footer.builder")}
              </Link>
            </div>
            
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-semibold text-white tracking-wide">{t("landing.footer.project")}</h4>
              <a 
                href="https://github.com/LinMoQC/Magic-Resume" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-neutral-500 hover:text-white transition-colors"
              >
                {t("landing.footer.github")}
              </a>
              <a 
                 href="https://github.com/LinMoQC/Magic-Resume/issues"
                 target="_blank"
                 rel="noopener noreferrer" 
                 className="text-sm text-neutral-500 hover:text-white transition-colors"
              >
                {t("landing.footer.issues")}
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 gap-8">
          <p className="text-xs text-neutral-600 font-medium">
            {t("landing.footer.copyright", { year: currentYear })}
          </p>
          
          <div className="flex flex-row items-center gap-4 sm:gap-6">
            {/* Mobile GitHub Star Button */}
            <a 
              href="https://github.com/LinMoQC/Magic-Resume" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex md:hidden"
              onClick={() => traceGithubStar('footer_mobile')}
            >
              <div className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-500/5">
                <FiGithub className="text-neutral-300 w-4 h-4" />
                <span className="text-neutral-200 text-xs font-medium">{t("landing.buttons.starOnGithub")}</span>
                {stars !== null && (
                    <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] text-neutral-400 font-mono">
                        {stars}
                    </span>
                )}
              </div>
            </a>

            {/* Contributors */}
            <a 
              href="https://github.com/LinMoQC/Magic-Resume/graphs/contributors" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <Image 
                src="https://contrib.rocks/image?repo=LinMoQC/Magic-Resume" 
                alt="contributors" 
                width={200}
                height={36}
                unoptimized
                className="h-8 md:h-9 w-auto"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
