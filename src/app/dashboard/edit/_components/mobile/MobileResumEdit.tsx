import { Button } from "@/components/ui/button";
import ResumePreviewPanel from "../preview/ResumePreviewPanel";
import Link from "next/link";
import { FiEdit, FiLayout } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import { FaCopy } from "react-icons/fa";
import ResumeContent from "../layout/ResumeContent";
import TemplatePanel from "../templates/TemplatePanel";
import Modal from "@/components/ui/Modal";
import Image from "next/image";
import { Resume } from '@/types/frontend/resume';
import React from "react";
import { useTranslation } from "react-i18next";

import { EditorComponents } from '@/lib/utils/componentOptimization';

const ReactJsonView = EditorComponents.JsonViewer;

interface MobileResumEditProps {
    activeResume: Resume | null;
    setPreviewScale: (scale: number) => void;
    leftPanelOpen: boolean;
    setLeftPanelOpen: (open: boolean) => void;
    rightPanelOpen: boolean;
    setRightPanelOpen: (open: boolean) => void;
    isJsonModalOpen: boolean;
    closeJsonModal: () => void;
    openJsonModal: () => void;
    handleCopyJson: () => void;
    renderSections: () => React.ReactNode;
    handleSave: () => void;
    onShowAI: () => void;
    isAiJobRunning: boolean;
}

export default function MobileResumEdit({
    activeResume,
    setPreviewScale,
    leftPanelOpen,
    setLeftPanelOpen,
    rightPanelOpen,
    setRightPanelOpen,
    isJsonModalOpen,
    closeJsonModal,
    openJsonModal,
    handleCopyJson,
    renderSections,
    handleSave,
    onShowAI,
    isAiJobRunning
}: MobileResumEditProps) {
    const { t } = useTranslation();
    const [currentTemplateId, setCurrentTemplateId] = React.useState('default-classic');

    return <main className="flex h-screen bg-black text-white flex-1">
        <div className='flex-1 flex items-center justify-center bg-black relative'>
            <ResumePreviewPanel
                activeResume={activeResume}
                previewScale={0.8}
                setPreviewScale={setPreviewScale}
                onShowAI={onShowAI}
                isAiJobRunning={isAiJobRunning}
            />
        </div>

        <div className="fixed w-[90vw] top-6 left-1/2 -translate-x-1/2 z-10 flex items-center justify-between gap-4">
            <Button onClick={() => setLeftPanelOpen(true)} className="rounded-full h-12 w-12"><FiEdit /></Button>
            <Link href="/dashboard" className="rounded-full h-12 w-12 flex items-center justify-center">
                <Image src="/simple-logo.png" alt="Magic Resume Logo" width={50} height={50} />
            </Link>
            <Button onClick={() => setRightPanelOpen(true)} className="rounded-full h-12 w-12"><FiLayout /></Button>
        </div>

        <AnimatePresence>
            {leftPanelOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/50 z-20"
                        onClick={() => setLeftPanelOpen(false)}
                    />
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed top-0 left-0 h-full w-[300px] z-30"
                    >
                        <ResumeContent
                            renderSections={renderSections}
                            handleSave={handleSave}
                            onShowJson={openJsonModal}
                        />
                    </motion.div>
                </>
            )}
            {rightPanelOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/50 z-20"
                        onClick={() => setRightPanelOpen(false)}
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed top-0 right-0 h-full w-[280px] z-30"
                    >
                        <TemplatePanel
                            rightCollapsed={false}
                            setRightCollapsed={() => { }}
                            onSelectTemplate={setCurrentTemplateId}
                            currentTemplateId={currentTemplateId}
                        />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
        <Modal
            isOpen={isJsonModalOpen}
            onClose={closeJsonModal}
            title={t('mobileEdit.jsonData')}
        >
            <div className="relative">
                <button
                    onClick={handleCopyJson}
                    className="absolute top-3 right-3 p-2 text-gray-400 rounded-md hover:bg-neutral-700 hover:text-white transition-colors"
                    aria-label={t('mobileEdit.copyJson')}
                >
                    <FaCopy />
                </button>
                <pre className="text-sm bg-neutral-800 p-4 rounded-md overflow-x-auto">
                    {activeResume && <ReactJsonView src={activeResume} />}
                </pre>
            </div>
        </Modal>
    </main>
}