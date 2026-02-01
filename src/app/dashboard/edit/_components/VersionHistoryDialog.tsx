import React, { useState, useEffect } from 'react';
import { History, Clock, Bookmark, RotateCcw, Loader2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { EditorComponents } from "@/lib/componentOptimization";
import { ResumeVersion, getSanitizedResume } from '@/store/useResumeStore';
import { useSettingStore } from '@/store/useSettingStore';
import ConfirmDialog from '@/app/components/ConfirmDialog';

const ReactJsonView = EditorComponents.JsonViewer;

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

    // Sync selectedVersionId with the latest version when opening or when versions change
    useEffect(() => {
        if (isOpen && versions.length > 0) {
            if (!selectedVersionId || !versions.find(v => v.id === selectedVersionId)) {
                setSelectedVersionId(versions[0].id);
            }
        }
    }, [isOpen, versions, selectedVersionId]);

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('zh-CN', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const selectedVersion = versions.find(v => v.id === selectedVersionId);
    
    // Generate a deterministic 7-char hash from string
    const generateHash = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).substring(0, 7).padEnd(7, '0');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[70vh] bg-neutral-950 border-neutral-800 text-white flex flex-col p-0 focus:outline-none overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b border-neutral-800 shrink-0">
                    <DialogTitle className="flex items-center text-xl font-bold tracking-tight">
                        <History className="mr-3 text-indigo-400" size={24} />
                        {t('header.versionHistory')}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Timeline List */}
                    <div className="w-1/3 border-r border-neutral-800 overflow-y-auto custom-scrollbar">
                        <div className="p-4 space-y-2">
                            {isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-neutral-500 space-y-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                    <p className="text-sm font-medium">加载中...</p>
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
                                            "w-full text-left p-4 rounded-xl transition-all duration-200 group relative outline-none cursor-pointer",
                                            selectedVersionId === version.id 
                                                ? "bg-indigo-500/10 border border-indigo-500/30" 
                                                : "hover:bg-neutral-900 border border-transparent"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={cn(
                                                "mt-1 p-1.5 rounded-lg shrink-0",
                                                version.type === 'manual' ? "bg-indigo-500/20 text-indigo-400" : "bg-neutral-800 text-neutral-400"
                                            )}>
                                                {version.type === 'manual' ? <Bookmark size={14} /> : <Clock size={14} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-mono text-neutral-500">{formatTime(version.updatedAt)}</span>
                                                    </div>
                                                    {selectedVersionId === version.id && (
                                                        <motion.div layoutId="active-indicator" className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                    )}
                                                </div>
                                                <p className={cn(
                                                    "text-sm font-medium truncate",
                                                    selectedVersionId === version.id ? "text-indigo-200" : "text-neutral-300"
                                                )}>
                                                    {version.name || (version.type === 'manual' ? t('common.manualSave') : t('common.autoSave'))}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Timeline line connector */}
                                        <div className="absolute left-7 top-[48px] bottom-[-16px] w-px bg-neutral-800 group-last:hidden" />

                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setConfirmId(version.id);
                                            }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-red-500/0 hover:bg-red-500/10 text-red-500/0 group-hover:text-red-500 transition-all duration-200"
                                            title={t('common.delete') || '删除'}
                                        >
                                            <Trash2 size={16} />
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
                    <div className="flex-1 bg-neutral-900/10 flex flex-col relative">
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div
                                    key="loading-right"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 flex items-center justify-center text-neutral-500"
                                >
                                    <div className="flex flex-col items-center gap-2 opacity-50">
                                        <Loader2 className="h-6 w-6 animate-spin text-neutral-600" />
                                        <span className="text-xs uppercase tracking-widest">{t('header.syncing')}</span>
                                    </div>
                                </motion.div>
                            ) : selectedVersion ? (
                                <motion.div
                                    key={selectedVersionId}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="p-8 flex-1 flex flex-col overflow-y-auto custom-scrollbar min-h-0"
                                >
                                    {/* Version JSON Data View */}
                                    <div className="flex-1 bg-[#13111c] rounded-2xl border border-neutral-800 p-0 relative overflow-hidden group min-h-[300px]">
                                        <div className="absolute inset-x-0 top-0 h-10 bg-neutral-900/50 backdrop-blur-md border-b border-neutral-800 flex items-center px-4 justify-between z-10">
                                            <div className="flex items-center gap-1.5 font-mono">
                                                <div className="flex gap-1.5 mr-2">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
                                                </div>
                                                <span className="ml-2 text-[10px] font-mono font-medium text-neutral-400 bg-neutral-800/50 border border-neutral-800 px-1.5 py-0.5 rounded">
                                                    {generateHash(selectedVersion.id + selectedVersion.updatedAt)}
                                                </span>
                                            </div>
                                            
                                            <button 
                                                onClick={() => onRestore(selectedVersionId)}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 active:scale-95"
                                            >
                                                <RotateCcw size={14} />
                                                恢复
                                            </button>
                                        </div>
                                        <div className="p-6 pt-14 h-full overflow-y-auto font-mono text-[11px] leading-relaxed [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                            <ReactJsonView 
                                                src={(() => {
                                                    const data = selectedVersion?.data as Record<string, unknown>;
                                                    // Handle legacy dirty data: if 'content' string exists, parse it
                                                    if (data?.content && typeof data.content === 'string') {
                                                        try {
                                                            const parsed = JSON.parse(data.content);
                                                            // Fallback: if parsed is just a string (double encoded), return it or object
                                                            return typeof parsed === 'object' ? parsed : data;
                                                        } catch {
                                                            return data || {};
                                                        }
                                                    }
                                                    // Clean data: return sanitized version
                                                    return getSanitizedResume(data);
                                                })()} 
                                                theme="monokai"
                                                displayDataTypes={false}
                                                enableClipboard={false}
                                                style={{ backgroundColor: 'transparent', fontSize: '11px' }}
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none" />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="no-selection"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 flex items-center justify-center text-neutral-500"
                                >
                                    <div className="flex flex-col items-center gap-2 opacity-50">
                                        <History size={32} />
                                        <p className="text-sm">{t('header.noHistory')}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </DialogContent>

            <ConfirmDialog 
                isOpen={!!confirmId}
                onClose={() => setConfirmId(null)}
                onConfirm={() => {
                    if (confirmId) onDelete(confirmId);
                }}
                title={t('common.confirmDeleteVersion')}
                description={useSettingStore.getState().cloudSync ? t('common.deleteDescriptionCloud') : t('common.deleteDescriptionLocal')}
            />
        </Dialog>
    );
}
