'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Loader2, Check, Eye, EyeOff, ShieldQuestion, X } from 'lucide-react';
import { SKILLS } from '../skills/registry';
import Markdown from './Markdown';
import type { ApprovalRequest, ChatMessage, SkillId } from '../types';

type ApprovalDecision = (
  msgId: string,
  req: { runId: string; requestId: string; scope: string },
  approved: boolean
) => void;

/**
 * Bot-side avatar. Consecutive bot messages share one avatar: only the first in a
 * run renders it, the rest pass `show={false}` and get a spacer so their text stays
 * aligned under the same column.
 */
function Avatar({ show }: { show: boolean }) {
  if (!show) return <div className="w-7 shrink-0" aria-hidden />;
  return (
    <div className="w-7 h-7 rounded-full bg-sky-500/10 border border-sky-500/20 shrink-0 flex items-center justify-center text-sky-400">
      <Bot size={15} />
    </div>
  );
}

/**
 * Pre-first-token "thinking" state for chat turns (design §5 思考中 / §8.5). The
 * assistant bubble is created lazily on the first chunk, so without this the thread
 * shows nothing between send and first token — the gap the user reported. Sits at the
 * tail of the thread; hands off to the streaming bubble once text starts.
 */
function ThinkingIndicator({ showAvatar }: { showAvatar: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-3 items-start"
    >
      <Avatar show={showAvatar} />
      <div className="flex items-center gap-1 pt-2.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-sky-400/70"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/**
 * A tool activity line (e.g. read_resume) with a pending → done transition. Muted and
 * indented to sit under the bot avatar column; spinner while running, subtle check
 * when finished — no contradictory "done" tick on an in-progress action.
 */
function ActivityLine({ message }: { message: ChatMessage }) {
  const running = message.status === 'running';
  return (
    <div className="flex items-center gap-2 pl-10 text-[11px] text-neutral-500">
      {running ? (
        <Loader2 size={11} className="shrink-0 animate-spin text-neutral-500" />
      ) : (
        <Check size={11} className="shrink-0 text-neutral-600" />
      )}
      <span className="truncate">{message.content}</span>
    </div>
  );
}

function ExecCard({
  message,
  onToggleCanvas,
  isCanvasOpen,
  showAvatar,
}: {
  message: ChatMessage;
  onToggleCanvas: (id: SkillId) => void;
  isCanvasOpen: boolean;
  showAvatar: boolean;
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
      <Avatar show={showAvatar} />
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

/**
 * Human-in-the-loop tool-approval prompt (design §6.5). The agent paused before a
 * sensitive tool (read_resume); the user must allow / deny before it runs.
 */
function ApprovalCard({
  message,
  onApproval,
  showAvatar,
}: {
  message: ChatMessage;
  onApproval?: ApprovalDecision;
  showAvatar: boolean;
}) {
  const a = message.approval as ApprovalRequest | undefined;
  if (!a) return null;
  const decide = (approved: boolean) =>
    onApproval?.(message.id, { runId: a.runId, requestId: a.requestId, scope: a.scope }, approved);

  return (
    <div className="flex gap-3 items-start">
      <Avatar show={showAvatar} />
      <div className="min-w-[260px] max-w-md rounded-2xl border border-sky-500/30 bg-sky-500/[0.07] px-4 py-3.5">
        <div className="flex items-start gap-2 text-[13px] text-sky-100 leading-relaxed">
          <ShieldQuestion size={15} className="text-sky-400 shrink-0 mt-0.5" />
          <span className="flex-1">{message.content || '想读取你的简历来给建议'}</span>
        </div>
        {a.status === 'pending' ? (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => decide(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 px-3 py-1.5 text-xs font-medium text-sky-100 transition-colors cursor-pointer"
            >
              <Check size={12} />
              允许
            </button>
            <button
              type="button"
              onClick={() => decide(false)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={12} />
              拒绝
            </button>
          </div>
        ) : (
          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-neutral-500">
            {a.status === 'approved' ? (
              <>
                <Check size={11} className="text-emerald-500/80" />
                已允许读取
              </>
            ) : (
              <>
                <X size={11} />
                已拒绝
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LogLine({
  message,
  onLogClick,
}: {
  message: ChatMessage;
  onLogClick?: (resumePath: string) => void;
}) {
  const clickable = !!message.resumePath && !!onLogClick;
  const className = 'flex items-center gap-2 pl-10 text-[11px] text-neutral-500';
  const body = (
    <>
      <Check size={12} className="text-emerald-500/80 shrink-0" />
      <span className="truncate">{message.content}</span>
    </>
  );
  if (!clickable) return <div className={className}>{body}</div>;
  return (
    <button
      type="button"
      onClick={() => onLogClick!(message.resumePath!)}
      title="回到这处改动"
      className={`${className} hover:text-neutral-300 transition-colors cursor-pointer w-full text-left`}
    >
      {body}
    </button>
  );
}

function Bubble({ message, showAvatar }: { message: ChatMessage; showAvatar: boolean }) {
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
      <Avatar show={showAvatar} />
      <div className="flex-1 pt-1 text-sm text-neutral-200 leading-relaxed">
        {message.streamed ? (
          <>
            <Markdown>{message.content ?? ''}</Markdown>
            {message.status === 'running' && (
              <span className="inline-block w-[3px] h-[0.95em] translate-y-[2px] ml-0.5 bg-sky-400/80 rounded-[1px] animate-pulse" />
            )}
          </>
        ) : (
          <span className="whitespace-pre-wrap">
            <TypewriterText text={message.content ?? ''} />
          </span>
        )}
      </div>
    </div>
  );
}

type ChatThreadProps = {
  messages: ChatMessage[];
  onToggleCanvas: (id: SkillId) => void;
  openCanvasSkillId: SkillId | null;
  onLogClick?: (resumePath: string) => void;
  /** resolve a tool-approval card (human-in-the-loop) */
  onApproval?: ApprovalDecision;
  /** a chat turn is awaiting its first token — render the thinking placeholder */
  thinking?: boolean;
};

export default function ChatThread({ messages, onToggleCanvas, openCanvasSkillId, onLogClick, onApproval, thinking }: ChatThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, thinking]);

  // Avatar grouping: within a run of consecutive bot messages (until the next user
  // turn), only the first "carded" bot message (assistant / exec / approval) shows
  // an avatar; the rest — and the indented log / activity lines — align under it.
  let botAvatarShown = false;
  const showAvatarFor = messages.map((m) => {
    if (m.role === 'user') {
      botAvatarShown = false;
      return false;
    }
    if (m.role === 'log' || m.role === 'activity') return false;
    if (botAvatarShown) return false;
    botAvatarShown = true;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        {messages.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            {m.role === 'exec' ? (
              <ExecCard
                message={m}
                onToggleCanvas={onToggleCanvas}
                isCanvasOpen={openCanvasSkillId === m.skillId}
                showAvatar={showAvatarFor[i]}
              />
            ) : m.role === 'log' ? (
              <LogLine message={m} onLogClick={onLogClick} />
            ) : m.role === 'activity' ? (
              <ActivityLine message={m} />
            ) : m.role === 'approval' ? (
              <ApprovalCard message={m} onApproval={onApproval} showAvatar={showAvatarFor[i]} />
            ) : (
              <Bubble message={m} showAvatar={showAvatarFor[i]} />
            )}
          </motion.div>
        ))}
        {thinking && <ThinkingIndicator showAvatar={!botAvatarShown} />}
        <div ref={endRef} />
      </div>
    </div>
  );
}
