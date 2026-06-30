'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Check, Eye, EyeOff, ShieldQuestion, X, ListChecks, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SKILLS } from '../skills/registry';
import Markdown from './Markdown';
import PolarisMark, { POLARIS_STAR_D } from '../PolarisMark';
import WidgetHost from './WidgetHost';
import type { ApprovalRequest, ChatMessage, SkillId } from '../types';
import type { WidgetActionResult } from '../widgets/types';

type ApprovalDecision = (msgId: string, approved: boolean) => void;

/**
 * Bot-side avatar. Consecutive bot messages share one avatar: only the first in a
 * run renders it, the rest pass `show={false}` and get a spacer so their text stays
 * aligned under the same column.
 */
function Avatar({ show }: { show: boolean }) {
  if (!show) return <div className="w-7 shrink-0" aria-hidden />;
  return (
    <div className="w-7 h-7 rounded-full bg-sky-500/10 border border-sky-500/20 shrink-0 flex items-center justify-center text-sky-400">
      <PolarisMark size={15} />
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
      {/* Polaris-themed loader: three north stars twinkling in sequence. */}
      <div className="flex items-center gap-1.5 pt-2 text-sky-400/80">
        {[0, 1, 2].map((i) => (
          <motion.svg
            key={i}
            width={12}
            height={12}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1, 0.7], rotate: [-12, 12, -12] }}
            transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
          >
            <path d={POLARIS_STAR_D} fill="currentColor" />
          </motion.svg>
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
            {isCanvasOpen ? '收起' : '查看'}
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

/**
 * A live review checklist (the analyze todolist). The agent ticks each step —
 * 读取简历 → 每个角色评审 → 汇总评分 — as its backend progress events land, so the
 * card is the narration of "分别 review" instead of one opaque "完成" badge. Once
 * done it doubles as the score-canvas toggle (the old exec-card affordance).
 */
function PlanCard({
  message,
  showAvatar,
  onToggleCanvas,
  isCanvasOpen,
}: {
  message: ChatMessage;
  showAvatar: boolean;
  onToggleCanvas: (id: SkillId) => void;
  isCanvasOpen: boolean;
}) {
  const todos = message.todos ?? [];
  const total = todos.length;
  const done = todos.filter((t) => t.status === 'completed').length;
  const allDone = total > 0 && done === total;

  return (
    <div className="flex gap-3 items-start">
      <Avatar show={showAvatar} />
      <div className="min-w-[280px] max-w-sm rounded-2xl bg-neutral-900 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-emerald-500/[0.12]">
            <ListChecks size={14} className="text-emerald-400" />
          </div>
          {message.subagentName ? (
            <span className="text-[13px] font-medium text-white">
              <span className="text-sky-400">子代理</span>
              {message.subagentName !== '子代理' && message.subagentName !== 'general-purpose'
                ? ` · ${message.subagentName}`
                : ''}
            </span>
          ) : (
            <span className="text-[13px] font-medium text-white">{message.content || '任务清单'}</span>
          )}
          {message.status === 'done' || allDone ? (
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <Check size={12} />
              完成
            </span>
          ) : total > 0 ? (
            <span className="ml-auto text-[11px] text-neutral-500 tabular-nums">{done}/{total}</span>
          ) : (
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-neutral-500">
              <Loader2 size={11} className="animate-spin" />
              工作中
            </span>
          )}
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {todos.map((todo, i) => (
            <li key={`${todo.content}-${i}`} className="flex items-center gap-2.5 text-xs">
              {todo.status === 'completed' ? (
                <Check size={13} className="shrink-0 text-emerald-400" />
              ) : todo.status === 'in_progress' ? (
                <Loader2 size={13} className="shrink-0 animate-spin text-sky-400" />
              ) : (
                <Circle size={12} className="shrink-0 text-neutral-600" />
              )}
              <span
                className={cn(
                  'truncate',
                  todo.status === 'completed'
                    ? 'text-neutral-400'
                    : todo.status === 'in_progress'
                      ? 'text-neutral-100'
                      : 'text-neutral-500'
                )}
              >
                {todo.content}
              </span>
              {/* On the last row (汇总竞争力评分), the canvas toggle floats right —
                  bottom-right of the card, sharing the line with that step. */}
              {allDone && i === total - 1 && (
                <button
                  type="button"
                  onClick={() => onToggleCanvas(message.skillId ?? 'analyze')}
                  className="ml-auto shrink-0 inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 rounded-full px-2.5 py-1 transition-colors cursor-pointer"
                >
                  {isCanvasOpen ? <EyeOff size={12} /> : <Eye size={12} />}
                  {isCanvasOpen ? '收起' : '查看'}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
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
  const decide = (approved: boolean) => onApproval?.(message.id, approved);

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
            {a.status === 'denied' ? (
              <>
                <X size={11} />
                已拒绝
              </>
            ) : a.readState === 'read' ? (
              <>
                <Check size={11} className="text-emerald-500/80" />
                已读取简历
              </>
            ) : a.readState === 'reading' ? (
              <>
                <Loader2 size={11} className="animate-spin text-neutral-500" />
                正在读取简历…
              </>
            ) : (
              <>
                <Check size={11} className="text-emerald-500/80" />
                已允许读取
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
    const skill = message.skillId ? SKILLS[message.skillId] : null;
    const SkillIcon = skill?.icon;
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl bg-neutral-800 text-neutral-100 px-4 py-2.5 text-sm leading-relaxed">
          {skill && (
            <span className="inline-flex items-center gap-1 align-middle mr-2 rounded-md bg-neutral-700/70 px-1.5 py-0.5">
              {SkillIcon && <SkillIcon size={11} className={skill.accent} />}
              <span className={cn('text-[11px] font-medium', skill.accent)}>{skill.name}</span>
            </span>
          )}
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
  /** a GenUI widget card was acted on (submit / cancel) */
  onWidgetAction?: (widgetId: string, result: WidgetActionResult) => void;
  /** a chat turn is awaiting its first token — render the thinking placeholder */
  thinking?: boolean;
};

export default function ChatThread({ messages, onToggleCanvas, openCanvasSkillId, onLogClick, onApproval, onWidgetAction, thinking }: ChatThreadProps) {
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
    <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        {/* New messages rise + fade in (Claude-desktop style 由下到上); keyed by id
            so only freshly-mounted turns animate, never re-renders of existing ones. */}
        {messages.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
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
            ) : m.role === 'plan' ? (
              <PlanCard
                message={m}
                showAvatar={showAvatarFor[i]}
                onToggleCanvas={onToggleCanvas}
                isCanvasOpen={openCanvasSkillId === (m.skillId ?? 'analyze')}
              />
            ) : m.role === 'widget' ? (
              m.widget ? (
                <div className="flex gap-3 items-start">
                  <Avatar show={showAvatarFor[i]} />
                  <WidgetHost instance={m.widget} onAction={onWidgetAction ?? (() => {})} />
                </div>
              ) : null
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
