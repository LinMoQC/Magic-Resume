import { useCallback, useEffect, useState } from 'react';
import { useSettingStore } from '@/store/useSettingStore';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';
import { useResumeDraftStore } from '@/store/useResumeDraftStore';
import { useMessageStore, Message } from '@/store/useMessageStore';
import { Resume } from '@/store/useResumeStore';

const nextUrl = process.env.NEXT_PUBLIC_IF_USE_BACKEND === 'true' ? '/api' : '/api/node';

export const useResumeCreator = () => {
  const { t } = useTranslation();
  const { apiKey, baseUrl, model } = useSettingStore();
  
  const { messages, setMessages, addMessage, isLoading, setIsLoading, updateLastAIMessage, updateLastAIMessageWithJSON } = useMessageStore();
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
    addMessage({ id: nanoid(), role: 'ai', content: t('common.notifications.generatingDraft') });
    try {
        const config = { apiKey, baseUrl, modelName: model, maxTokens: 4096 };
        const response = await fetch(`${nextUrl}/chat-agent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages,
            currentResume: null,
            config,
            request_type: 'generate_resume'
          }),
        });
  
        if (!response.body) throw new Error("Response body is null");
  
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
  
          const lines = value.split('\n\n').filter(line => line.startsWith('data: '));
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
  }, [apiKey, baseUrl, model, messages, addMessage, setResumeDraft,t]);

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
      const config = { apiKey, baseUrl, modelName: model, maxTokens: 65536 };
      
      const requestBody = {
        messages: [...messages, newUserMessage],
        config
      };
      
      const response = await fetch(`${nextUrl}/chat-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API请求失败: ${response.status} - ${errorText}`);
      }

      if (!response.body) throw new Error("Response body is null");

      // 预先创建AI消息
      const aiMessageId = nanoid();
      addMessage({ id: aiMessageId, role: 'ai', content: '正在生成简历中...' });
      setIsLoading(false);

      // 使用更简单的流处理方法
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let aiResponse = '';
      while (true) {
        const { value, done } = await reader.read();

        if (!streamStarted) {
            streamStarted = true;
        }

        if (done) {
          break;
        }

        const text = decoder.decode(value, { stream: true });
        buffer += text;
        
        // 处理缓冲区中的完整消息
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一个可能不完整的行
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonString = line.substring('data: '.length).trim();
            if (!jsonString) continue;
            
            try {
              const chunk = JSON.parse(jsonString);
              
              if (chunk.type === 'message_chunk') {
                aiResponse += chunk.content;
                
                // 检查是否包含简历JSON数据
                if (aiResponse.includes('[RESUME]')) {
                  try {
                    console.log('AI回复内容:', aiResponse);
                    
                    const resumeStartIndex = aiResponse.indexOf('[RESUME]');
                    const resumeJsonStart = aiResponse.indexOf('{', resumeStartIndex);
                    
                    if (resumeJsonStart !== -1) {
                      // 寻找匹配的结束花括号
                      let braceCount = 0;
                      let resumeJsonEnd = -1;
                      
                      for (let i = resumeJsonStart; i < aiResponse.length; i++) {
                        if (aiResponse[i] === '{') braceCount++;
                        if (aiResponse[i] === '}') {
                          braceCount--;
                          if (braceCount === 0) {
                            resumeJsonEnd = i + 1;
                            break;
                          }
                        }
                      }
                      
                      if (resumeJsonEnd !== -1) {
                        const resumeJson = aiResponse.substring(resumeJsonStart, resumeJsonEnd);
                        console.log('提取的JSON:', resumeJson);
                        
                        const resumeData = JSON.parse(resumeJson);
                        console.log('解析到简历数据:', resumeData);
                        
                        // 验证数据结构
                        if (resumeData && typeof resumeData === 'object') {
                          setResumeDraft(resumeData as Resume);
                          
                          // 清理回复内容，只保留纯文本部分
                          const cleanResponse = aiResponse.substring(0, resumeStartIndex).trim() + 
                                              "\n\n✅ 简历已成功生成！您可以在右侧预览或点击下方按钮查看解析的数据结构。";
                          
                          // 更新最后一条AI消息，添加JSON数据
                          updateLastAIMessageWithJSON(cleanResponse, resumeData);
                          
                          toast.success("简历数据已应用到预览中！");
                        } else {
                          console.error('简历数据格式不正确');
                        }
                      }
                    }
                  } catch (parseError) {
                    console.error('解析简历JSON失败:', parseError);
                    console.log('原始AI回复:', aiResponse);
                  }
                } else {
                  // 如果还没有检测到简历数据，就正常更新消息
                  updateLastAIMessage(aiResponse);
                }
              } else if (chunk.type === 'error') {
                updateLastAIMessage(`错误: ${chunk.content}`);
              }
            } catch (parseError) {
              console.error('JSON解析失败:', parseError, 'Original data:', jsonString);
            }
          }
        }
      }
      
      // 更精确的关键词匹配，避免误触发
      const completionKeywords = ['生成简历', '创建简历', '完成简历', '可以生成了', 'generate resume', 'create resume'];
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
  }, [apiKey, t, messages, addMessage, updateLastAIMessage, updateLastAIMessageWithJSON, baseUrl, model, setIsLoading, generateResume, setResumeDraft]);

  return { messages, isLoading: isLoading || isGenerating, resumeDraft, sendMessage, generateResume };
};