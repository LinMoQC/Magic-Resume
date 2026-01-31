import React, { useState } from 'react';
import { History, Clock, Bookmark, RotateCcw, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { EditorComponents } from "@/lib/componentOptimization";

const ReactJsonView = EditorComponents.JsonViewer;

type Version = {
    id: string;
    timestamp: number;
    type: 'auto' | 'manual';
    name?: string;
    description?: string;
};

const MOCK_VERSIONS: Version[] = [
    { id: '1', timestamp: Date.now(), type: 'auto' },
    { id: '2', timestamp: Date.now() - 1000 * 60 * 30, type: 'manual', name: '主动保存' },
    { id: '3', timestamp: Date.now() - 1000 * 60 * 60 * 2, type: 'auto' },
    { id: '4', timestamp: Date.now() - 1000 * 60 * 60 * 24, type: 'manual', name: '主动保存' },
];

type VersionHistoryDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onRestore: (versionId: string) => void;
};

export default function VersionHistoryDialog({ isOpen, onClose, onRestore }: VersionHistoryDialogProps) {
    const { t } = useTranslation();
    const [selectedVersionId, setSelectedVersionId] = useState<string>(MOCK_VERSIONS[0].id);

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('zh-CN', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const selectedVersion = MOCK_VERSIONS.find(v => v.id === selectedVersionId);

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
                            {MOCK_VERSIONS.map((version) => (
                                <button
                                    key={version.id}
                                    onClick={() => setSelectedVersionId(version.id)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-xl transition-all duration-200 group relative outline-none",
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
                                                <span className="text-xs font-mono text-neutral-500">{formatTime(version.timestamp)}</span>
                                                {selectedVersionId === version.id && (
                                                    <motion.div layoutId="active-indicator" className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                )}
                                            </div>
                                            <p className={cn(
                                                "text-sm font-medium truncate",
                                                selectedVersionId === version.id ? "text-indigo-200" : "text-neutral-300"
                                            )}>
                                                {version.name || (version.type === 'manual' ? '主动保存' : '自动保存')}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Timeline line connector */}
                                    <div className="absolute left-7 top-[48px] bottom-[-16px] w-px bg-neutral-800 group-last:hidden" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Version Preview & Restoration */}
                    <div className="flex-1 bg-neutral-900/10 flex flex-col relative">
                        <AnimatePresence mode="wait">
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
                                            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">resumedata.json</span>
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
                                            src={{
                                                info: {
                                                    name: "Kai Huang",
                                                    title: "Full Stack Engineer",
                                                    email: "contact@example.com",
                                                    themeColor: "#6366f1"
                                                },
                                                sections: {
                                                    experience: [
                                                        { company: "Magic Tech", role: "Software Architect", date: "2024-Present" }
                                                    ]
                                                },
                                                version_id: selectedVersionId,
                                                timestamp: selectedVersion?.timestamp
                                            }} 
                                            theme="monokai"
                                            displayDataTypes={false}
                                            enableClipboard={false}
                                            style={{ backgroundColor: 'transparent', fontSize: '11px' }}
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none" />
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
