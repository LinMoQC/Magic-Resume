import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import {
    History,
    Clock,
    Bookmark,
    RotateCcw,
    Loader2,
    Trash2,
    Code2,
    Eye,
    X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { EditorComponents } from "@/lib/utils/componentOptimization";
import { Resume, ResumeVersion } from '@/types/frontend/resume';
import { getSanitizedResume } from '@/store/useResumeStore';
import { useSettingStore } from '@/store/useSettingStore';
import { formatCompactDateTime } from '@/lib/utils/dateTime';
import { generateShortHash } from '@/lib/utils/hash';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import ResumePreview from '../preview/ResumePreview';
import { workbenchJsonTheme } from './jsonTheme';

const ReactJsonView = EditorComponents.JsonViewer;

// Natural width every template renders at (A4 @ 96dpi); the render preview
// scales down to fit the column so the resume is never clipped horizontally.
const PAPER_WIDTH = 794;

type VersionHistoryDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onRestore: (versionId: string) => void;
    onDelete: (versionId: string) => void;
    versions: ResumeVersion[];
    isLoading?: boolean;
};

export default function VersionHistoryDialog({ isOpen, onClose, onRestore, onDelete, versions, isLoading }: VersionHistoryDialogProps) {
    const { t } = useTranslation();
    const [selectedVersionId, setSelectedVersionId] = useState<string>('');
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'render' | 'json'>('render');

    // Sync selectedVersionId with the latest version when opening or when versions change
    useEffect(() => {
        if (isOpen && versions.length > 0) {
            if (!selectedVersionId || !versions.find(v => v.id === selectedVersionId)) {
                setSelectedVersionId(versions[0]?.id || '');
            }
        }
    }, [isOpen, versions, selectedVersionId]);

    const selectedVersion = useMemo(() =>
        versions.find(v => v.id === selectedVersionId),
    [versions, selectedVersionId]);

    // Resolve the version payload into a clean Resume (tolerating legacy rows
    // that stored a double-encoded `content` string). Shared by both view modes.
    const resolvedResume = useMemo<Resume | null>(() => {
        const data = selectedVersion?.data as unknown as (Resume & { content?: unknown }) | undefined;
        if (!data) return null;
        if (data.content && typeof data.content === 'string') {
            try {
                const parsed = JSON.parse(data.content);
                return (typeof parsed === 'object' ? parsed : data) as Resume;
            } catch {
                return data as Resume;
            }
        }
        return getSanitizedResume(data) as Resume;
    }, [selectedVersion]);

    // Fit the fixed-width (794px) resume paper into the preview column with a
    // transform. `scale` fits the width; `paperH` (natural height × scale, measured
    // off the untransformed layout box) reserves the scrolled height so only the
    // vertical axis scrolls and nothing is clipped, at any column width.
    const scrollRef = useRef<HTMLDivElement>(null);
    const paperRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.75);
    const [paperH, setPaperH] = useState(0);
    useLayoutEffect(() => {
        if (viewMode !== 'render') return;
        const cont = scrollRef.current;
        if (!cont) return;
        const recompute = () => {
            const inner = cont.clientWidth - 32; // p-4 gutters
            const s = Math.max(0.1, Math.min(1, inner / PAPER_WIDTH));
            setScale(s);
            const paper = paperRef.current;
            if (paper) setPaperH(paper.offsetHeight * s);
        };
        recompute();
        const roC = new ResizeObserver(recompute);
        roC.observe(cont);
        const paper = paperRef.current;
        const roP = paper ? new ResizeObserver(recompute) : null;
        if (paper && roP) roP.observe(paper);
        return () => { roC.disconnect(); roP?.disconnect(); };
    }, [viewMode, selectedVersionId, isOpen, resolvedResume]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 z-100 backdrop-blur-sm cursor-pointer"
                    />
                    <div className="fixed inset-0 z-101 flex items-center justify-center p-4 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 12 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#0e0f11] shadow-[0_24px_70px_-20px_rgb(0_0_0/0.8)] ring-1 ring-white/[0.07] focus:outline-none pointer-events-auto"
                    >
                        <div className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-400/10 text-sky-400 ring-1 ring-sky-400/20">
                                    <History size={18} />
                                </div>
                                <div>
                                    <h2 className="text-[15px] font-semibold tracking-tight text-white">{t('modals.versionHistory.title')}</h2>
                                    <p className="mt-0.5 text-[13px] text-neutral-500">{t('modals.versionHistory.subtitle')}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                                type="button"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex flex-1 overflow-hidden border-t border-white/[0.06]">
                            {/* Left: Timeline List */}
                            <div className="w-1/3 overflow-y-auto custom-scrollbar border-r border-white/[0.06]">
                                <div className="p-4 space-y-2">
                                    {isLoading ? (
                                        <div className="h-full flex flex-col items-center justify-center p-8 text-neutral-500 space-y-3">
                                            <Loader2 className="h-7 w-7 animate-spin text-sky-400" />
                                            <p className="text-sm font-medium">{t('modals.versionHistory.loading')}</p>
                                        </div>
                                    ) : versions.length > 0 ? (
                                        versions.map((version) => (
                                            <div
                                                key={version.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setSelectedVersionId(version.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        setSelectedVersionId(version.id);
                                                    }
                                                }}
                                                className={cn(
                                                    "group relative w-full cursor-pointer rounded-xl p-4 text-left outline-none transition-colors duration-200",
                                                    selectedVersionId === version.id
                                                        ? "bg-sky-400/[0.08] ring-1 ring-sky-400/25"
                                                        : "ring-1 ring-transparent hover:bg-white/[0.03]"
                                                )}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={cn(
                                                        "mt-0.5 shrink-0 rounded-lg p-1.5",
                                                        version.type === 'manual' ? "bg-sky-400/15 text-sky-300" : "bg-white/5 text-neutral-400"
                                                    )}>
                                                        {version.type === 'manual' ? <Bookmark size={14} /> : <Clock size={14} />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="mb-1 flex items-center justify-between">
                                                            <span className="font-mono text-xs text-neutral-500">{formatCompactDateTime(version.updatedAt)}</span>
                                                            {selectedVersionId === version.id && (
                                                                <motion.div layoutId="active-indicator" className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                                                            )}
                                                        </div>
                                                        <p className={cn(
                                                            "truncate text-sm font-medium",
                                                            selectedVersionId === version.id ? "text-white" : "text-neutral-300"
                                                        )}>
                                                            {version.name || (version.type === 'manual' ? t('common.manualSave') : t('common.autoSave'))}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmId(version.id);
                                                    }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-neutral-500 opacity-0 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                                                    title={t('common.delete')}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center p-8 text-neutral-500 space-y-3 opacity-50">
                                            <Clock size={32} />
                                            <p className="text-sm font-medium">{t('header.noHistory')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Version Preview & Restoration */}
                            <div className="relative flex min-w-0 flex-1 flex-col">
                                {isLoading ? (
                                    <div className="flex flex-1 items-center justify-center text-neutral-500">
                                        <div className="flex flex-col items-center gap-2 opacity-60">
                                            <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
                                            <span className="text-xs uppercase tracking-widest">{t('header.syncing')}</span>
                                        </div>
                                    </div>
                                ) : selectedVersion ? (
                                    <>
                                        {/* Preview toolbar: identity · mode toggle · restore */}
                                        <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="font-mono text-[11px] text-neutral-500">{formatCompactDateTime(selectedVersion.updatedAt)}</span>
                                                <span className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] font-medium text-neutral-400 ring-1 ring-white/[0.06]">
                                                    {generateShortHash(selectedVersion.id + selectedVersion.updatedAt)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-0.5 rounded-lg bg-white/[0.04] p-0.5 ring-1 ring-white/[0.06]">
                                                    {([
                                                        { id: 'render' as const, icon: Eye, label: t('modals.versionHistory.viewRender') },
                                                        { id: 'json' as const, icon: Code2, label: t('modals.versionHistory.viewJson') },
                                                    ]).map(({ id, icon: Icon, label }) => (
                                                        <button
                                                            key={id}
                                                            type="button"
                                                            onClick={() => setViewMode(id)}
                                                            className={cn(
                                                                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                                                                viewMode === id ? "bg-sky-400/12 text-sky-300 ring-1 ring-sky-400/25" : "text-neutral-400 hover:text-white"
                                                            )}
                                                        >
                                                            <Icon size={13} />
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => onRestore(selectedVersionId)}
                                                    className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-sky-400 cursor-pointer"
                                                >
                                                    <RotateCcw size={13} />
                                                    {t('modals.versionHistory.restore')}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="min-h-0 flex-1 px-5 pb-5">
                                            {/* Panes are keyed by view mode only (never by version): the
                                                measured scroll/paper nodes stay mounted across version switches,
                                                so their ResizeObserver never fires against a detached node and
                                                the fit scale can't collapse to the 0.1 floor. Switching versions
                                                just updates ResumePreview's props in place. */}
                                            {viewMode === 'json' ? (
                                                <motion.div
                                                    key="json"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="h-full overflow-hidden rounded-xl bg-[#0a0b0d] ring-1 ring-white/[0.06]"
                                                >
                                                    <div className="h-full overflow-y-auto p-5 font-mono text-[11px] leading-relaxed [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                                        {resolvedResume && (
                                                            <ReactJsonView
                                                                src={resolvedResume}
                                                                theme={workbenchJsonTheme}
                                                                displayDataTypes={false}
                                                                enableClipboard={false}
                                                                style={{ backgroundColor: 'transparent', fontSize: '11px', lineHeight: '1.7' }}
                                                            />
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="render"
                                                    ref={scrollRef}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar rounded-xl bg-neutral-500/10 p-4 ring-1 ring-white/[0.06]"
                                                >
                                                    {resolvedResume && (
                                                        <div
                                                            className="mx-auto overflow-hidden"
                                                            style={{ width: PAPER_WIDTH * scale, height: paperH || undefined }}
                                                        >
                                                            <div
                                                                ref={paperRef}
                                                                className="overflow-hidden rounded-md bg-white shadow-xl"
                                                                style={{ width: PAPER_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}
                                                            >
                                                                <ResumePreview
                                                                    info={resolvedResume.info}
                                                                    sections={resolvedResume.sections}
                                                                    sectionOrder={(resolvedResume.sectionOrder || []).map((s) => s.key)}
                                                                    templateId={resolvedResume.template}
                                                                    customTemplate={resolvedResume.customTemplate}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-1 items-center justify-center text-neutral-500">
                                        <div className="flex flex-col items-center gap-2 opacity-60">
                                            <History size={30} />
                                            <p className="text-sm">{t('modals.versionHistory.empty')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>

                    <ConfirmDialog 
                        isOpen={!!confirmId}
                        onClose={() => setConfirmId(null)}
                        onConfirm={() => {
                            if (confirmId) onDelete(confirmId);
                        }}
                        title={t('common.confirmDeleteVersion')}
                        description={useSettingStore.getState().cloudSync ? t('common.deleteDescriptionCloud') : t('common.deleteDescriptionLocal')}
                    />
                </>
            )}
        </AnimatePresence>
    );
}
