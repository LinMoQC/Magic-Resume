'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, BookOpenText, CalendarClock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TABS = [
  { href: '/knowledge/timelines', key: 'knowledge.tabs.timelines', icon: CalendarClock },
  { href: '/knowledge/qa', key: 'knowledge.tabs.qa', icon: BookOpenText },
] as const;

/**
 * 内容中心壳：公开可匿名访问（middleware 只保护 /dashboard），顶栏 + Tab 切换。
 * 筛选状态都在各页的 URL search params 里，链接可直接分享。
 */
export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[var(--surface-desk)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[var(--surface-desk)]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">{t('knowledge.back')}</span>
          </Link>
          <h1 className="text-sm font-semibold tracking-wide">
            {t('knowledge.title')}
          </h1>
          <nav className="ml-auto flex items-center gap-1">
            {TABS.map(({ href, key, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={
                    active
                      ? 'flex items-center gap-1.5 rounded-md bg-sky-400/10 px-3 py-1.5 text-sm text-sky-400'
                      : 'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]'
                  }
                >
                  <Icon size={15} />
                  {t(key)}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
