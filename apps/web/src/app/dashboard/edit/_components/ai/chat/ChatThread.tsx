'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Loader2, Check, Eye, EyeOff } from 'lucide-react';
import { SKILLS } from './registry';
import type { ChatMessage, SkillId } from './types';

function AssistantAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-sky-500/10 border border-sky-500/20 shrink-0 flex items-center justify-center text-sky-400">
      <Bot size={15} />
    </div>
  );
}

function ExecCard({
  message,
  onToggleCanvas,
  isCanvasOpen,
}: {
  message: ChatMessage;
  onToggleCanvas: (id: SkillId) => void;
  isCanvasOpen: boolean;
}) {
  const skill = message.skillId ? SKILLS[message.skillId] : null;
  if (!skill) return null;
  const Icon = skill.icon;
  const running = message.status === 'running';
  const clickable = !running && !!skill.canvas;

  const body = (
    <>
      <div className="flex items-center gap-2.5">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${skill.accentHex}1f` }}
        >
          <Icon size={14} className={skill.accent} />
        </div>
        <span className="text-[13px] font-medium text-white">{skill.name}</span>
        {running ? (
          <Loader2 size={14} className="ml-auto text-neutral-500 animate-spin" />
        ) : (
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <Check size={12} />
            完成
          </span>
        )}
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <span className="text-xs text-neutral-500 truncate">{running ? '正在执行…' : skill.doneSummary}</span>
        {clickable && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-400 bg-sky-500/10 group-hover:bg-sky-500/20 rounded-full px-2.5 py-1 shrink-0 transition-colors">
            {isCanvasOpen ? <EyeOff size={12} /> : <Eye size={12} />}
            {isCanvasOpen ? '收起画布' : '查看画布'}
          </span>
        )}
      </div>
    </>
  );

  return (
    <div className="flex gap-3 items-start">
      <AssistantAvatar />
      {clickable ? (
        <button
          type="button"
          onClick={() => onToggleCanvas(skill.id)}
          className="group text-left min-w-[280px] max-w-sm rounded-2xl bg-neutral-900 hover:bg-neutral-800/80 px-4 py-3.5 transition-colors cursor-pointer"
        >
          {body}
        </button>
      ) : (
        <div className="min-w-[260px] max-w-sm rounded-2xl bg-neutral-900 px-4 py-3.5">{body}</div>
      )}
    </div>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShown('');
    setDone(false);
    let i = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (cancelled) return;
      i += 1;
      setShown(text.slice(0, i));
      if (i < text.length) {
        const ch = text[i - 1];
        const pause = /[，。！？、；：,.!?]/.test(ch) ? 280 : /\s/.test(ch) ? 40 : 24;
        timer = setTimeout(tick, pause);
      } else {
        setDone(true);
      }
    };
    timer = setTimeout(tick, 320);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text]);

  return (
    <span>
      {shown}
      {!done && (
        <span className="inline-block w-[3px] h-[0.95em] translate-y-[2px] ml-0.5 bg-sky-400/80 rounded-[1px] animate-pulse" />
      )}
    </span>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl bg-neutral-800 text-neutral-100 px-4 py-2.5 text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 items-start">
      <AssistantAvatar />
      <div className="flex-1 pt-1 text-sm text-neutral-200 leading-relaxed">
        <TypewriterText text={message.content ?? ''} />
      </div>
    </div>
  );
}

type ChatThreadProps = {
  messages: ChatMessage[];
  onToggleCanvas: (id: SkillId) => void;
  openCanvasSkillId: SkillId | null;
};

export default function ChatThread({ messages, onToggleCanvas, openCanvasSkillId }: ChatThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        {messages.map((m) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            {m.role === 'exec' ? (
              <ExecCard
                message={m}
                onToggleCanvas={onToggleCanvas}
                isCanvasOpen={openCanvasSkillId === m.skillId}
              />
            ) : (
              <Bubble message={m} />
            )}
          </motion.div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
