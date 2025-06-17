import { useCallback, useEffect, useRef } from 'react';
import { useSettingStore } from '@/store/useSettingStore';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';
import { useResumeDraftStore } from '@/store/useResumeDraftStore';
import { useMessageStore, Message } from '@/store/useMessageStore';

export const useResumeCreator = () => {
  const { t } = useTranslation();
  const { apiKey, baseUrl, model } = useSettingStore();
  
  const { messages, setMessages, addMessage, isLoading, setIsLoading, updateLastAIMessage } = useMessageStore();
  const retryCount = useRef(0);
  const maxRetries = 2;

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

  const { resumeDraft, setResumeDraft } = useResumeDraftStore();

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!apiKey) {
      toast.error(t('modals.aiModal.notifications.apiKeyMissing'));
      return;
    }
    if (!userMessage.trim()) return;

    const newUserMessage: Message = { id: nanoid(), role: 'user', content: userMessage };
    addMessage(newUserMessage);
    setIsLoading(true);

    try {
      const config = { apiKey, baseUrl, modelName: model, maxTokens: 4096 };
      const response = await fetch('/api/graph-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
          currentResume: resumeDraft,
          config,
        }),
      });

      if (!response.body) throw new Error("Response body is null");

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let aiResponse = '';
      
      // 流式处理响应
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const lines = value.split('\\n\\n').filter(line => line.startsWith('data: '));
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonString = line.substring('data: '.length).trimStart();
            try {
              const chunk = JSON.parse(jsonString);
              console.log('chunk', chunk);

              if (chunk.type === 'message_chunk') {
                aiResponse += chunk.content.trimStart();
                updateLastAIMessage(aiResponse);
              } else if (chunk.type === 'resume_update') {
                  setResumeDraft(chunk.data);
              }
            } catch (parseError) {
              console.error('解析 JSON 失败，跳过此行:', parseError, '原始数据:', jsonString);
              continue; // 跳过当前循环的剩余部分，继续下一行
            }
          }
        }
      }

      if (!aiResponse) {
        if (retryCount.current < maxRetries) {
          retryCount.current++;
          toast.info(t('modals.aiModal.createTab.retryNotification'));
          
          const lastUserMessage = messages[messages.length - 1];
          if (lastUserMessage && lastUserMessage.role === 'user') {
            await sendMessage(lastUserMessage.content);
          }
        } else {
          toast.error(t('modals.aiModal.createTab.retryFailed'));
          retryCount.current = 0;
        }
        return;
      }

      retryCount.current = 0; // Reset on success

      const responseText = aiResponse;
      const resumeMatch = responseText.match(/\[RESUME\]\s*([\s\S]*\{[\s\S]*\})/);

      if (resumeMatch && resumeMatch[1]) {
        try {
          const jsonString = resumeMatch[1];
          const resumeData = JSON.parse(jsonString);
          setResumeDraft(resumeData);
        } catch (parseError) {
          console.error('解析 JSON 失败:', parseError, '原始数据:', resumeMatch[1]);
        }
      }

    } catch (error) {
      console.log('error', error);
      addMessage({ id: nanoid(), role: 'ai', content: t('modals.aiModal.createTab.errorReply') });
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, t, messages, resumeDraft, addMessage, updateLastAIMessage, baseUrl, model, setIsLoading, setResumeDraft]);

  return { messages, isLoading, resumeDraft, sendMessage };
};