import { House, CloudCheck, CloudUpload, CloudOff } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSettingStore } from '@/store/useSettingStore';

export type SyncStatus = 'saved' | 'syncing' | 'modified' | 'local' | 'error';

interface HeaderTabProps {
    title?: string;
    updatedAt?: number;
    syncStatus?: SyncStatus;
}

export default function HeaderTab({ title, updatedAt, syncStatus = 'saved' }: HeaderTabProps) {
    const { t } = useTranslation();
    
    const formatTime = (timestamp?: number) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleString('zh-CN', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    const renderSyncVisual = () => {
        switch (syncStatus) {
            case 'syncing':
                return (
                    <div className="relative w-16 h-10 flex items-center justify-end">
                        <svg viewBox="0 0 64 40" className="absolute inset-0 w-full h-full opacity-20 overflow-visible">
                            <defs>
                                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                                    <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
                                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M5 10 Q32 20 50 20" stroke="url(#pathGradient)" fill="none" strokeWidth="0.5" />
                            <path d="M5 20 L50 20" stroke="url(#pathGradient)" fill="none" strokeWidth="0.5" />
                            <path d="M5 30 Q32 20 50 20" stroke="url(#pathGradient)" fill="none" strokeWidth="0.5" />
                            {[
                                { d: "M5 10 Q32 20 50 20", delay: 0, dur: 1.2 },
                                { d: "M5 20 L50 20", delay: 0.4, dur: 1 },
                                { d: "M5 30 Q32 20 50 20", delay: 0.8, dur: 1.4 }
                            ].map((path, i) => (
                                <motion.path 
                                    key={i}
                                    d={path.d} 
                                    stroke="currentColor" 
                                    fill="none" 
                                    strokeWidth="1.5"
                                    strokeDasharray="10 50"
                                    strokeLinecap="round"
                                    animate={{ strokeDashoffset: [60, -60] }}
                                    transition={{ duration: path.dur, repeat: Infinity, ease: "linear", delay: path.delay }}
                                    style={{ filter: 'drop-shadow(0 0 3px #818cf8)' }}
                                />
                            ))}
                        </svg>
                        <div className="relative z-10 bg-neutral-900 rounded-full p-1 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                            <CloudUpload size={18} className="text-indigo-400" />
                            <motion.div
                                className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"
                                animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0.8, 0.4] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </div>
                    </div>
                );
            case 'modified':
                return (
                    <div className="relative w-8 h-10 flex items-center justify-end">
                        <CloudUpload size={18} className="text-indigo-400/60" />
                    </div>
                );
            case 'error':
                return <CloudOff size={18} className="text-red-400" />;
            default:
                return (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative"
                    >
                        <CloudCheck size={18} className="text-indigo-400/80" />
                        <motion.div 
                            className="absolute -inset-1 bg-indigo-400/10 blur-sm rounded-full"
                            animate={{ opacity: [0, 0.5, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />
                    </motion.div>
                );
        }
    }

    const renderSyncLabel = () => {
        if (syncStatus === 'syncing') {
            return (
                <div className="flex items-baseline">
                    <span className="text-[10px] uppercase tracking-[0.4em] font-sans font-black italic text-indigo-400/90">
                        {t('header.syncing').replace(/\./g, '')}
                    </span>
                    <div className="flex gap-1 ml-[-2px]">
                        {[0, 1, 2].map((i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                                className="text-[10px] font-black text-indigo-400/90"
                            >
                                .
                            </motion.span>
                        ))}
                    </div>
                </div>
            );
        }
        
        return (
            <span className='text-xs text-neutral-500 font-sans whitespace-nowrap'>
                {syncStatus === 'error' ? t('header.syncError') : `${t('header.lastUpdated')} ${formatTime(updatedAt)}`}
            </span>
        );
    }

    return (
        <motion.div
            initial={{ y: -50, x: "-50%", opacity: 0 }}
            animate={{ y: 0, x: "-50%", opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, mass: 1 }}
            className='w-[600px] h-12 px-8 bg-neutral-900 absolute top-3 left-[50%] z-10 rounded-xl flex items-center justify-between text-sm text-neutral-400 border border-neutral-800 shadow-lg font-mono'
        >
            <div className="flex items-center gap-3">
                <Link href="/dashboard" className="hover:text-neutral-200 transition-colors">
                    <House size={20} />
                </Link>
                <span className='text-neutral-700/50'>/</span>
                <span className='text-neutral-200 font-medium truncate max-w-[320px] text-base'>{title || '未命名简历'}</span>
            </div>

            {useSettingStore.getState().cloudSync && (
                <div className="flex items-center gap-6">
                        <div className="flex items-center">
                            <div className={`${syncStatus === 'syncing' ? 'w-16' : 'w-8'} flex justify-end transition-all duration-300`}>
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`visual-${syncStatus}`}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {renderSyncVisual()}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                            
                            <span className="mx-3 text-neutral-800 font-light text-lg select-none">|</span>
                            
                            <div className="flex items-center justify-end">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`label-${syncStatus}`}
                                        initial={{ opacity: 0, x: 5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -5 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex items-center justify-end w-full"
                                    >
                                        {renderSyncLabel()}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                </div>
            )}
        </motion.div>
    );
}