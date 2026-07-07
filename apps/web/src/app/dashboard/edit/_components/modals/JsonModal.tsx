import React from 'react';
import { EditorComponents } from "@/lib/utils/componentOptimization";
import { Resume } from '@/types/frontend/resume';
import { getSanitizedResume } from "@/store/useResumeStore";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { workbenchJsonTheme, workbenchJsonThemeLight } from "./jsonTheme";
import { useTheme } from "@/components/providers/ThemeProvider";

const ReactJsonView = EditorComponents.JsonViewer;

interface JsonModalProps {
    isJsonModalOpen: boolean;
    closeJsonModal: () => void;
    handleDownloadJson: () => void;
    activeResume: Resume;
    t: (key: string) => string;
}

export default function JsonModal({ isJsonModalOpen, closeJsonModal, handleDownloadJson, activeResume, t }: JsonModalProps) {
    const { resolvedTheme } = useTheme();
    const jsonTheme = resolvedTheme === 'light' ? workbenchJsonThemeLight : workbenchJsonTheme;
    return (
        <AnimatePresence>
            {isJsonModalOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeJsonModal}
                        className="fixed inset-0 bg-black/70 z-100 backdrop-blur-sm cursor-pointer"
                    />
                    <div className="fixed inset-0 z-101 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 12 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-desk shadow-[0_24px_70px_-20px_rgb(0_0_0/0.8)] ring-1 ring-white/[0.07] focus:outline-none pointer-events-auto"
                        >
                        <div className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-400/10 text-sky-400 ring-1 ring-sky-400/20">
                                    <span className="font-mono text-[10px] font-bold tracking-tight">{t('common.ui.json')}</span>
                                </div>
                                <h2 className="text-[15px] font-semibold tracking-tight text-white">{t('mobileEdit.jsonData')}</h2>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleDownloadJson}
                                    className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-neutral-400 hover:bg-white/5 hover:text-sky-300 transition-colors cursor-pointer"
                                    aria-label={t('common.ui.downloadJson')}
                                    title={t('common.ui.downloadJson')}
                                >
                                    <Download size={15} />
                                    <span className="hidden sm:inline">{t('common.ui.downloadJson')}</span>
                                </button>
                                <button
                                    onClick={closeJsonModal}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                                    type="button"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* terminal surface */}
                        <div className="relative mx-4 flex-1 overflow-hidden rounded-xl bg-desk ring-1 ring-white/[0.06]">
                            <div className="h-full overflow-y-auto custom-scrollbar p-5">
                                {activeResume && (
                                    <ReactJsonView
                                        src={getSanitizedResume(activeResume)}
                                        theme={jsonTheme}
                                        displayDataTypes={false}
                                        enableClipboard={false}
                                        style={{ backgroundColor: 'transparent', fontSize: '13px', lineHeight: '1.7', fontFamily: 'var(--font-mono, ui-monospace, monospace)' }}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end px-6 py-4">
                            <button
                                onClick={closeJsonModal}
                                className="rounded-lg bg-white/[0.06] px-4 py-2 text-sm font-medium text-neutral-200 ring-1 ring-white/[0.08] hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                {t('common.done')}
                            </button>
                        </div>
                    </motion.div>
                </div>
                </>
            )}
        </AnimatePresence>
    );
}