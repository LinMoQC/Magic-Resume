import React, { useState, useRef, useEffect } from 'react';
import { Resume, useResumeStore } from '@/store/useResumeStore';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/app/components/ui/textarea';
import { Button } from '@/app/components/ui/button';
import { Send, Loader2, BotMessageSquare, Eye, FileText } from 'lucide-react';
import { useResumeCreator } from '@/app/hooks/useResumeCreator';
import ResumePreview from '../ResumePreview';
import { toast } from 'sonner';
import { MessageItem } from '@/app/components/ui/MessageItem';
import { LoadingAnimation } from '@/app/components/ui/LoadingAnimation';

type CreateTabProps = {
    onApplyChanges: (resume: Resume) => void;
    isAiJobRunning: boolean;
    setIsAiJobRunning: (isRunning: boolean) => void;
};



export default function CreateTab({ onApplyChanges, isAiJobRunning, setIsAiJobRunning }: CreateTabProps) {
    const { t } = useTranslation();
    const { messages, isLoading, sendMessage, resumeDraft } = useResumeCreator();
    const [input, setInput] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const [showPreview, setShowPreview] = useState(false);
    const templateId = useResumeStore(state => state.activeResume?.template) || 'classic';

    useEffect(() => {
        setIsAiJobRunning(isLoading);
    }, [isLoading, setIsAiJobRunning]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage(input);
        setInput('');
    };

    const handleApply = () => {
        if (resumeDraft) {
            onApplyChanges(resumeDraft);
            toast.success(t('common.notifications.resumeApplied'));
        }
    };

    return (
        <div className="flex gap-6 mt-6 h-[61vh]">
            <div className={`bg-neutral-900 rounded-lg border border-neutral-800 flex flex-col h-full ${showPreview ? 'w-1/2' : 'w-full'} transition-all duration-300 relative`}>
                {resumeDraft && (
                    <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)} className="text-neutral-400 hover:text-white absolute bottom-31 right-2">
                        <Eye size={16} className="mr-2" />
                        {showPreview ? t('common.ui.closePreview') : t('common.ui.previewResume')}
                    </Button>
                )}
                <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
                    {messages.map((msg) => (
                        <MessageItem
                            key={msg.id}
                            message={msg}
                            themeColor="#0ea5e9"
                        />
                    ))}
                    {isLoading && (
                        <LoadingAnimation
                            themeColor="#0ea5e9"
                        />
                    )}
                </div>
                <div className="p-4 border-t border-neutral-800">
                    <form onSubmit={handleSubmit} className="relative">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            placeholder={t('modals.aiModal.createTab.inputPlaceholder')}
                            className="bg-neutral-800 border-neutral-700 rounded-lg focus:ring-sky-500 focus:border-sky-500 resize-none pr-12 py-3"
                            rows={1}
                            disabled={isAiJobRunning}
                        />
                        <Button
                            type="submit"
                            disabled={isAiJobRunning || !input.trim()}
                            className="absolute right-2.5 bottom-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-md h-7 w-7 p-1"
                            size="icon"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                </div>
            </div>

            {showPreview && resumeDraft && (
                <div className="bg-neutral-900 rounded-lg border border-neutral-800 flex flex-col h-full w-1/2 transition-all duration-300">
                    <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-neutral-300 flex items-center">
                            <FileText size={18} className="mr-2 text-sky-400" />
                            {t('modals.aiModal.createTab.previewTitle')}
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 bg-white flex justify-center">
                        <div style={{ transform: 'scale(0.45)', transformOrigin: 'top center' }}>
                            <ResumePreview
                                info={resumeDraft.info}
                                sections={resumeDraft.sections}
                                sectionOrder={resumeDraft.sectionOrder.map((s: { key: string }) => s.key)}
                                templateId={templateId}
                            />
                        </div>
                    </div>
                    <div className="p-3 border-t border-neutral-800">
                        <Button onClick={handleApply} className="w-full bg-green-600 hover:bg-green-700 text-white">
                            {t('modals.aiModal.createTab.applyButton')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}