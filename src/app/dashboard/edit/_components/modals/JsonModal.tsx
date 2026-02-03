import React from 'react';
import { EditorComponents } from "@/lib/utils/componentOptimization";
import { Resume } from '@/types/frontend/resume';
import { getSanitizedResume } from "@/store/useResumeStore";
import { FaDownload } from "react-icons/fa";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ReactJsonView = EditorComponents.JsonViewer;

interface JsonModalProps {
    isJsonModalOpen: boolean;
    closeJsonModal: () => void;
    handleDownloadJson: () => void;
    activeResume: Resume;
    t: (key: string) => string;
}

export default function JsonModal({ isJsonModalOpen, closeJsonModal, handleDownloadJson, activeResume, t }: JsonModalProps) {
    return (
        <AnimatePresence>
            {isJsonModalOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeJsonModal}
                        className="fixed inset-0 bg-black/80 z-[100]"
                    />
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-4xl h-[80vh] bg-[#0A0A0A] border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden focus:outline-none pointer-events-auto"
                        >
                        <div className="flex items-center justify-between p-6 border-b border-neutral-800 bg-neutral-900/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
                                    <pre className="text-xs font-bold">JSON</pre>
                                </div>
                                <h2 className="text-xl font-bold text-white uppercase tracking-wider">{t('mobileEdit.jsonData')}</h2>
                            </div>
                            <button
                                onClick={closeJsonModal}
                                className="p-2 rounded-full hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all active:scale-95"
                                type="button"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden relative">
                            <button
                                onClick={handleDownloadJson}
                                className="absolute top-6 right-8 p-3 bg-neutral-800/80 hover:bg-sky-600 text-neutral-400 hover:text-white rounded-xl transition-all duration-200 z-10 border border-neutral-700/50"
                                aria-label="Download JSON file"
                                title="Download JSON"
                            >
                                <FaDownload size={18} />
                            </button>
                            
                            <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-[#13111c]/30">
                                {activeResume && (
                                    <ReactJsonView 
                                        src={getSanitizedResume(activeResume)} 
                                        theme="monokai"
                                        displayDataTypes={false} 
                                        enableClipboard={false}
                                        style={{ backgroundColor: 'transparent', fontSize: '13px', lineHeight: '1.6' }}
                                    />
                                )}
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-neutral-800 bg-neutral-900/10 flex justify-end">
                            <button 
                                onClick={closeJsonModal}
                                className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-semibold transition-all active:scale-95"
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