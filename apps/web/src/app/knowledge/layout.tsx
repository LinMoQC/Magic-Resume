'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * 校招时间线壳：公开可匿名访问（middleware 只保护 /dashboard），顶栏 = 返回 + 标题。
 * 筛选状态都在页面的 URL search params 里，链接可直接分享。
 */
export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
