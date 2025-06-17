import React, { useState, useRef, useEffect } from 'react';
import { Resume } from '@/store/useResumeStore';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/app/components/ui/textarea';
import { Button } from '@/app/components/ui/button';
import { Send, Loader2, Bot, User, BotMessageSquare } from 'lucide-react';
import ResumePreview from '../ResumePreview';
import { useResumeCreator } from '@/app/hooks/useResumeCreator';
import { Message } from '@/store/useMessageStore';
import { useMessageStore } from '@/store/useMessageStore';
import { useUser } from '@clerk/nextjs';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';

type CreateTabProps = {
    onApplyChanges: (resume: Resume) => void;
};

const ChatMessage: React.FC<{ message: Message; userAvatarUrl?: string }> = ({ message, userAvatarUrl }) => {
    const isUser = message.role === 'user';
    return (
        <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : ''} min-w-5`}>
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white">
                    <Bot size={20} />
                </div>
            )}
            <div className={`p-3 rounded-lg max-w-lg ${isUser ? 'bg-sky-700 text-white' : 'bg-neutral-800 text-neutral-200'}`}>
                {isUser ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                    <ReactMarkdown >{message.content}</ReactMarkdown>
                )}
            </div>
            {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-600 flex items-center justify-center text-white overflow-hidden">
                    {userAvatarUrl ? (
                        <Image src={userAvatarUrl} alt="User Avatar" width={32} height={32} className="w-full h-full object-cover" />
                    ) : (
                        <User size={20} />
                    )}
                </div>
            )}
        </div>
    );
};

export default function CreateTab({ onApplyChanges }: CreateTabProps) {
    const { t } = useTranslation();
    const { messages, isLoading, resumeDraft, sendMessage } = useResumeCreator();
    const [input, setInput] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const { messages: messageStoreMessages } = useMessageStore();

    const { user } = useUser();

    // 新增状态和副作用用于动态加载点
    const [loadingDots, setLoadingDots] = useState('.');

    useEffect(() => {
        // 自动滚动到底部
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        // 只有在加载中且最后一条消息是用户消息时才显示动态点
        if (isLoading && messageStoreMessages.length > 0 && messageStoreMessages[messageStoreMessages.length - 1].role === 'user') {
            interval = setInterval(() => {
                setLoadingDots(prev => {
                    if (prev.length < 3) return prev + '.';
                    return '.';
                });
            }, 300); // 每 300ms 改变一次点
        } else {
            setLoadingDots('.'); // 当不加载时或加载条件不满足时重置点
        }
        return () => clearInterval(interval);
    }, [isLoading, messageStoreMessages]); // 依赖于 isLoading 和 messages

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
        setInput('');
    };

    return (
        <div className="flex flex-col gap-6 mt-6 h-[61vh]">
            {/* 左侧：对话区域 */}
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 flex flex-col h-full">
                <div className="p-4 border-b border-neutral-800">
                    <h3 className="text-lg font-semibold text-neutral-300 flex items-center">
                        <BotMessageSquare size={18} className="mr-2 text-sky-400" />
                        {t('modals.aiModal.createTab.chatTitle')}
                    </h3>
                </div>
                <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
                    {messages.map((msg) => (
                        <ChatMessage 
                            key={msg.id} 
                            message={msg} 
                            userAvatarUrl={msg.role === 'user' ? user?.imageUrl : undefined}
                        />
                    ))}
                    {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                        <ChatMessage key="loading" message={{ id: 'loading', role: 'ai', content: loadingDots }} />
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
                                    // handleSubmit(e);
                                }
                            }}
                            placeholder={t('modals.aiModal.createTab.inputPlaceholder')}
                            className="bg-neutral-800 border-neutral-700 rounded-lg focus:ring-sky-500 focus:border-sky-500 resize-none pr-12 py-3"
                            rows={1}
                            disabled={isLoading}
                        />
                        {input.trim() && (
                            <Button 
                                type="submit" 
                                disabled={isLoading} 
                                className="absolute right-2.5 bottom-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-md h-7 w-7 p-1"
                                size="icon"
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        )}
                    </form>
                </div>
            </div>

            {/* 右侧：实时预览区域 */}
            {/* <div className="bg-neutral-900 rounded-lg border border-neutral-800 flex flex-col h-[65vh]">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-300">
              {t('modals.aiModal.createTab.previewTitle')}
            </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 bg-white flex justify-center">
            {resumeDraft ? (
                <div style={{ transform: 'scale(0.55)', transformOrigin: 'top center' }}>
                    <ResumePreview
                      info={resumeDraft.info}
                      sections={resumeDraft.sections}
                      sectionOrder={resumeDraft.sectionOrder.map((s: { key: unknown; }) => s.key)}
                      templateId={templateId}
                    />
                </div>
            ) : (
                <div className="text-neutral-500 flex items-center justify-center">{t('modals.aiModal.createTab.previewPlaceholder')}</div>
            )}
        </div>
        {resumeDraft && (
            <div className="p-3 border-t border-neutral-800">
                <Button onClick={handleApply} className="w-full bg-green-600 hover:bg-green-700 text-white">
                    {t('modals.aiModal.createTab.applyButton')}
                </Button>
            </div>
        )}
      </div> */}
        </div>
    );
}