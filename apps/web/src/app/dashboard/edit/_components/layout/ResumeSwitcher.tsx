"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useResumeStore } from '@/store/useResumeStore';

/**
 * 顶栏标题即入口:点名称就地重命名,点箭头下拉切换简历。
 * chrome 退入背景,标题仍是主角——切换与命名都在原地发生,不另开弹窗(就地而非另开)。
 */
export default function ResumeSwitcher() {
    const { t } = useTranslation();
    const router = useRouter();
    const resumes = useResumeStore((s) => s.resumes);
    const activeResume = useResumeStore((s) => s.activeResume);
    const renameResume = useResumeStore((s) => s.renameResume);

    const activeId = activeResume?.id;
    const activeName = activeResume?.name ?? '';

    const [menuOpen, setMenuOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // 关闭下拉:点击外部 / Esc
    useEffect(() => {
        if (!menuOpen) return;
        const onPointerDown = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [menuOpen]);

    // 进入编辑态:聚焦并全选
    useEffect(() => {
        if (editing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [editing]);

    const startEditing = useCallback(() => {
        setMenuOpen(false);
        setDraft(activeName);
        setEditing(true);
    }, [activeName]);

    const commit = useCallback(() => {
        const next = draft.trim();
        setEditing(false);
        if (activeId && next && next !== activeName) {
            renameResume(activeId, next);
        }
    }, [draft, activeId, activeName, renameResume]);

    const cancel = useCallback(() => {
        setEditing(false);
        setDraft(activeName);
    }, [activeName]);

    const switchTo = useCallback(
        (id: string) => {
            setMenuOpen(false);
            if (id !== activeId) {
                router.push(`/dashboard/edit/${id}`);
            }
        },
        [activeId, router],
    );

    if (!activeResume) {
        return (
            <span className="truncate text-[15px] font-semibold tracking-tight text-neutral-100">
                {t('header.untitled')}
            </span>
        );
    }

    if (editing) {
        return (
            <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={cancel}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        commit();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        cancel();
                    }
                }}
                placeholder={t('renameDialog.placeholder')}
                aria-label={t('renameDialog.title')}
                maxLength={60}
                className="w-48 min-w-0 rounded-md border border-sky-400/40 bg-white/[0.04] px-2 py-0.5 text-[15px] font-semibold tracking-tight text-neutral-100 outline-none transition-colors focus:border-sky-400/70"
            />
        );
    }

    return (
        <div ref={containerRef} className="relative flex min-w-0 items-center gap-0.5">
            {/* 点名称 → 就地重命名 */}
            <button
                type="button"
                onClick={startEditing}
                title={t('dashboard.resumeCard.rename')}
                className="min-w-0 truncate rounded-md px-1.5 py-0.5 text-[15px] font-semibold tracking-tight text-neutral-100 transition-colors hover:bg-white/[0.06]"
            >
                {activeName || t('header.untitled')}
            </button>

            {/* 下拉箭头 → 切换简历 */}
            <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={menuOpen}
                aria-label={t('header.switchResume')}
                title={t('header.switchResume')}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-white/[0.06] hover:text-neutral-200"
            >
                <ChevronDown
                    size={15}
                    className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* 下拉列表 */}
            {menuOpen && (
                <div
                    role="listbox"
                    aria-label={t('header.switchResume')}
                    className="absolute left-0 top-full z-[60] mt-2 max-h-[60vh] w-64 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900/95 p-1.5 shadow-xl shadow-black/50 backdrop-blur-sm"
                >
                    {resumes.map((r) => {
                        const isActive = r.id === activeId;
                        return (
                            <button
                                key={r.id}
                                type="button"
                                role="option"
                                aria-selected={isActive}
                                onClick={() => switchTo(r.id)}
                                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                                    isActive
                                        ? 'bg-white/[0.06] text-neutral-100'
                                        : 'text-neutral-300 hover:bg-white/[0.04] hover:text-neutral-100'
                                }`}
                            >
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                                    {isActive && <Check size={14} className="text-sky-400" />}
                                </span>
                                <span className="truncate">{r.name || t('header.untitled')}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
