import { ChevronLeft, History, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSettingStore } from '@/store/useSettingStore';
import { isCloudMode } from '@/lib/config/app';
import { formatCompactDateTime } from '@/lib/utils/dateTime';
import ResumeSwitcher from './ResumeSwitcher';

export type SyncStatus = 'saved' | 'syncing' | 'modified' | 'local' | 'error';

interface HeaderTabProps {
    updatedAt?: number;
    syncStatus?: SyncStatus;
    onVersionClick?: () => void;
    onFeedbackClick?: () => void;
}

/**
 * 工作台顶栏 —— 不做盒子,做"舞台的边"。一层从画布顶部淡出的 scrim 托起标题与控件,
 * 让 chrome 退入背景(设计原则:画布是舞台、对话是旁白、能力按需浮现)。标题是主角,
 * 文档动作默认低调、靠近才点亮;同步收敛成一颗 sky 状态点 + 短词,完整时间在 hover。
 */
export default function HeaderTab({ updatedAt, syncStatus = 'saved', onVersionClick, onFeedbackClick }: HeaderTabProps) {
    const { t } = useTranslation();
    const cloudSync = useSettingStore((state) => state.cloudSync);

    // 紧凑同步状态:一颗状态点 + 短词;syncing 时呼吸扩散;完整时间在外层 title 里。
    const status = (() => {
        switch (syncStatus) {
            case 'syncing':
                return { word: t('header.syncing').replace(/\./g, ''), dot: 'bg-sky-400', text: 'text-sky-300/90', pulse: true };
            case 'error':
                return { word: t('header.syncError'), dot: 'bg-red-400', text: 'text-red-400/90', pulse: false };
            case 'modified':
                return { word: t('header.pendingSync'), dot: 'bg-neutral-500', text: 'text-neutral-500', pulse: false };
            case 'local':
                return { word: t('header.localOnly'), dot: 'bg-neutral-500', text: 'text-neutral-500', pulse: false };
            default:
                return { word: t('header.synced'), dot: 'bg-sky-400', text: 'text-neutral-500', pulse: false };
        }
    })();

    return (
        <motion.header
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute inset-x-0 top-0 z-50 flex h-16 min-w-0 items-center gap-4 overflow-visible bg-gradient-to-b from-black via-black/70 to-transparent px-6"
        >
            {/* 左:返回工作台 + 标题(主角) */}
            <div className="pointer-events-auto flex min-w-0 items-center gap-2">
                <Link
                    href="/dashboard"
                    aria-label={t('header.backToDashboard')}
                    title={t('header.backToDashboard')}
                    className="group -ml-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-white/[0.06] hover:text-neutral-200"
                >
                    <ChevronLeft size={18} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
                </Link>
                <ResumeSwitcher />
            </div>

            <div className="min-w-0 flex-1" />

            {/* 右:文档动作(按需浮现)+ 紧凑同步状态 */}
            {(cloudSync || isCloudMode) && (
                <div className="pointer-events-auto flex shrink-0 items-center gap-3">
                    <div className="flex items-center gap-0.5 opacity-70 transition-opacity duration-200 hover:opacity-100">
                        {cloudSync && (
                            <button
                                onClick={onVersionClick}
                                aria-label={t('header.versionHistory')}
                                type="button"
                                className="group/htip relative flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-neutral-100"
                            >
                                <History size={16} />
                                <span className="pointer-events-none absolute left-1/2 top-full z-[60] mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-xs text-neutral-100 shadow-lg shadow-black/40 opacity-0 transition-opacity duration-150 group-hover/htip:opacity-100">
                                    {t('header.versionHistory')}
                                </span>
                            </button>
                        )}
                        {isCloudMode && (
                            <button
                                onClick={onFeedbackClick}
                                aria-label={t('tools.feedback')}
                                type="button"
                                className="group/htip relative flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-neutral-100"
                            >
                                <MessageCircle size={16} />
                                <span className="pointer-events-none absolute left-1/2 top-full z-[60] mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-xs text-neutral-100 shadow-lg shadow-black/40 opacity-0 transition-opacity duration-150 group-hover/htip:opacity-100">
                                    {t('tools.feedback')}
                                </span>
                            </button>
                        )}
                    </div>

                    {cloudSync && (
                        <>
                            <span className="h-4 w-px bg-white/10" />
                            <div
                                className="flex items-center gap-2"
                                title={updatedAt ? `${t('header.lastUpdated')} ${formatCompactDateTime(updatedAt)}` : undefined}
                            >
                                <span className="relative flex h-1.5 w-1.5 items-center justify-center">
                                    {status.pulse && (
                                        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${status.dot} opacity-75`} />
                                    )}
                                    <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${status.dot}`} />
                                </span>
                                <span className={`whitespace-nowrap text-xs ${status.text}`}>{status.word}</span>
                            </div>
                        </>
                    )}
                </div>
            )}
        </motion.header>
    );
}
