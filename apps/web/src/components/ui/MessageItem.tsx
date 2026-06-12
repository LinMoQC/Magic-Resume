"use client";

import React, { useState } from 'react';
import { Message } from '@/store/useMessageStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, User, Bot, FileText, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import { EditorComponents } from '@/lib/utils/componentOptimization';
import { useTranslation } from 'react-i18next';

const ReactJsonView = EditorComponents.JsonViewer;

interface MessageItemProps {
  message: Message;
  themeColor?: string;
}

export const MessageItem: React.FC<MessageItemProps> = ({ 
  message, 
  themeColor = '#3b82f6' 
}) => {
  const [showJson, setShowJson] = useState(false);
  const isUser = message.role === 'user';
  const hasJsonData = message.jsonData && typeof message.jsonData === 'object';
  const { user } = useUser();
  const { t } = useTranslation();

  const copyJsonToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(message.jsonData, null, 2));
      toast.success(t('common.notifications.copySuccess'));
    } catch (err) {
      console.error('复制失败:', err);
      toast.error(t('common.notifications.copyFailed'));
    }
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      {/* 头像 */}
      <div 
        className={`
          shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden
          ${isUser ? 'bg-neutral-600' : 'bg-linear-to-br from-blue-500 to-purple-600'}
        `}
      >
        {isUser ? (
          user?.imageUrl ? (
            <Image 
              src={user.imageUrl} 
              alt={t('common.userAvatarAlt')} 
              width={32} 
              height={32} 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-white" />
          )
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* 消息内容 */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* 文本内容 */}
        <Card 
          className={`
            p-3 rounded-2xl shadow-sm border-0
            ${isUser 
              ? 'bg-linear-to-r text-white ml-auto' 
              : 'bg-neutral-800 text-neutral-200'
            }
          `}
          style={isUser ? { 
            background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)` 
          } : {}}
        >
          <div className="text-sm leading-relaxed">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </Card>

        {/* JSON数据展示 */}
        {hasJsonData && (
          <div className="mt-2 w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowJson(!showJson)}
              className="flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50 p-2 rounded-md transition-colors"
            >
              <FileText className="w-3 h-3" />
              <span>{showJson ? t('common.ui.hide') : t('common.ui.view')}{t('common.ui.parseResumeData')}</span>
              {showJson ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </Button>

            {showJson && (
              <Card className="mt-2 p-3 bg-neutral-800 border border-neutral-700 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-neutral-400 font-medium">
                    {t('common.ui.parseResumeData')} (JSON)
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyJsonToClipboard}
                    className="h-6 px-2 text-xs text-neutral-400 hover:text-neutral-200"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    {t('sections.shared.copy')}
                  </Button>
                </div>
                <div className="max-h-96 overflow-auto">
                  <ReactJsonView
                    src={message.jsonData!}
                    theme={{
                      base00: 'transparent', // 背景
                      base01: '#262626', // 较浅的背景
                      base02: '#404040', // 选择背景
                      base03: '#737373', // 注释
                      base04: '#a3a3a3', // 暗前景
                      base05: '#e5e5e5', // 默认前景
                      base06: '#f5f5f5', // 亮前景
                      base07: '#ffffff', // 最亮前景
                      base08: '#ef4444', // 变量
                      base09: '#f97316', // 整数
                      base0A: '#eab308', // 类
                      base0B: '#22c55e', // 字符串
                      base0C: '#06b6d4', // 支持
                      base0D: '#3b82f6', // 函数
                      base0E: '#8b5cf6', // 关键字
                      base0F: '#f59e0b'  // 废弃
                    }}
                    name={false}
                    collapsed={2}
                    displayDataTypes={false}
                    displayObjectSize={false}
                    enableClipboard={true}
                    iconStyle="triangle"
                    indentWidth={2}
                    style={{
                      backgroundColor: 'transparent',
                      fontSize: '12px',
                      fontFamily: 'Monaco, "Lucida Console", monospace',
                      color: '#e5e5e5'
                    }}
                    collapseStringsAfterLength={80}
                    shouldCollapse={(field) => {
                      // 默认折叠较大的对象，但保持重要字段展开
                      if (field.name === 'info' || field.name === 'sections') return false;
                      return field.src && 
                             typeof field.src === 'object' && 
                             Object.keys(field.src).length > 5;
                    }}
                  />
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 