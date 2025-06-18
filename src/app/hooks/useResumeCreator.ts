import { useCallback, useEffect, useRef, useState } from 'react';
import { useSettingStore } from '@/store/useSettingStore';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';
import { useResumeDraftStore } from '@/store/useResumeDraftStore';
import { useMessageStore, Message } from '@/store/useMessageStore';
import { Resume } from '@/store/useResumeStore';

export const useResumeCreator = () => {
  const { t } = useTranslation();
  const { apiKey, baseUrl, model } = useSettingStore();
  
  const { messages, setMessages, addMessage, isLoading, setIsLoading, updateLastAIMessage } = useMessageStore();
  const { resumeDraft, setResumeDraft } = useResumeDraftStore();
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: nanoid(),
          role: 'ai',
          content: t('modals.aiModal.createTab.initialMessage'),
        }
      ]);
    }
  }, [t, messages.length, setMessages]);
  
  const generateResume = useCallback(async () => {
    setIsGenerating(true);
    addMessage({ id: nanoid(), role: 'ai', content: "好的，我将根据我们的对话为您生成一份简历草稿..." });
    try {
        const config = { apiKey, baseUrl, modelName: model, maxTokens: 4096 };
        const response = await fetch('/api/graph-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages,
            currentResume: null, // Start fresh
            config,
            request_type: 'generate_resume'
          }),
        });
  
        if (!response.body) throw new Error("Response body is null");
  
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
  
          const lines = value.split('\\n\\n').filter(line => line.startsWith('data: '));
          for (const line of lines) {
            const jsonString = line.substring('data: '.length).trim();
            if(!jsonString) continue;
            try {
              const chunk = JSON.parse(jsonString);
              if (chunk.type === 'resume_update') {
                setResumeDraft(chunk.data as Resume);
              }
            } catch (parseError) {
              console.error('Failed to parse JSON, skipping line:', parseError, 'Original data:', jsonString);
            }
          }
        }
        toast.success("简历草稿已生成！现在您可以点击右上角的“预览”按钮查看。");
    } catch (error) {
        console.error('Error generating resume:', error);
        addMessage({ id: nanoid(), role: 'ai', content: "抱歉，生成简历时遇到问题，请稍后再试。" });
    } finally {
        setIsGenerating(false);
    }
  }, [apiKey, baseUrl, model, messages, addMessage, setResumeDraft]);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!apiKey) {
      toast.error(t('modals.aiModal.notifications.apiKeyMissing'));
      return;
    }
    if (!userMessage.trim()) return;

    const newUserMessage: Message = { id: nanoid(), role: 'user', content: userMessage };
    addMessage(newUserMessage);
    setIsLoading(true);
    let streamStarted = false;

    try {
      const config = { apiKey, baseUrl, modelName: model, maxTokens: 4096 };
      const response = await fetch('/api/graph-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
          config,
          request_type: 'chat'
        }),
      });

      if (!response.body) throw new Error("Response body is null");

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let aiResponse = '';
      
      while (true) {
        const { value, done } = await reader.read();

        if (!streamStarted) {
            streamStarted = true;
            setIsLoading(false); 
        }

        if (done) break;

        const lines = value.split('\\n\\n').filter(line => line.startsWith('data: '));
        for (const line of lines) {
          const jsonString = line.substring('data: '.length).trim();
          if(!jsonString) continue;
          try {
            const chunk = JSON.parse(jsonString);
            if (chunk.type === 'message_chunk') {
              aiResponse += chunk.content;
              updateLastAIMessage(aiResponse);
            }
          } catch (parseError) {
            console.error('Failed to parse JSON, skipping line:', parseError, 'Original data:', jsonString);
          }
        }
      }
      
      const completionKeywords = ['创建', '完成', '好了', '可以了', 'generate', 'create', 'done'];
      const userMessageLower = userMessage.toLowerCase();
      if (completionKeywords.some(keyword => userMessageLower.includes(keyword))) {
        await generateResume();
      }

    } catch (error) {
      console.error('Chat error:', error);
      if (!streamStarted) {
        updateLastAIMessage(t('modals.aiModal.createTab.errorReply'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, t, messages, addMessage, updateLastAIMessage, baseUrl, model, setIsLoading, generateResume]);

  return { messages, isLoading: isLoading || isGenerating, resumeDraft, sendMessage, generateResume };
};