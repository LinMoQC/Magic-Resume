'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Check,
  Eye,
  EyeOff,
  ShieldQuestion,
  X,
  ListChecks,
  Circle,
  CornerUpLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SKILLS } from '../skills/registry';
import Markdown from './Markdown';
import { PolarisGlyph } from '../PolarisMark';
import WidgetHost from './WidgetHost';
import type { ApprovalRequest, ChatMessage, SkillId } from '../types';
import type { WidgetActionResult } from '../widgets/types';

type ApprovalDecision = (msgId: string, approved: boolean) => void;

/**
 * Bot-side avatar. Consecutive bot messages share one avatar: only the first in a
 * run renders it, the rest pass `show={false}` and get a spacer so their text stays
 * aligned under the same column.
 */
/** 桌宠的三个姿态帧:AI 的状态 = 宠物的神态。历史消息永远 idle,
 *  只有正在进行的那一处在动(思考=抬头冒灵感星,输出=眯眼快抖)。 */
type AvatarVariant = 'idle' | 'thinking' | 'typing';
const PET_SRC: Record<AvatarVariant, string> = {
  idle: '/marks/polaris-pet-static.svg',
  thinking: '/marks/polaris-pet-thinking.svg',
  typing: '/marks/polaris-pet-typing.svg',
};

function Avatar({
  show,
  breathing = false,
  variant = 'idle',
}: {
  show: boolean;
  breathing?: boolean;
  variant?: AvatarVariant;
}) {
  if (!show) return <div className="w-7 shrink-0" aria-hidden />;
  // 无底板:桌宠轮廓自己立得住,套圈会退回"图标"感;w-7 占位保持消息缩进不变
  return (
    <div className={cn('w-7 h-7 shrink-0 flex items-center justify-center', breathing && 'ai-breath')}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={PET_SRC[variant]} width={24} height={24} alt="" aria-hidden="true" />
    </div>
  );
}

/**
 * 「呼吸叙述」的最小单元（docs/specs/ai-working-motion）：一枚随全局心跳呼吸的
 * 北极星，替换线程里所有 spinner —— 系统只有一个心跳，不是一堆各转各的零件。
 */
function BreathGlyph({ size = 11, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('ai-breath inline-flex shrink-0', className)} aria-hidden="true">
      <PolarisGlyph size={size} />
    </span>
  );
}

/**
 * Pre-first-token "thinking" state for chat turns (design §5 思考中 / §8.5). The
 * assistant bubble is created lazily on the first chunk, so without this the thread
 * shows nothing between send and first token — the gap the user reported. Sits at the
 * tail of the thread; hands off to the streaming bubble once text starts.
 */
function ThinkingIndicator({ showAvatar }: { showAvatar: boolean }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-3 items-start"
    >
      {/* 状态表达收拢到桌宠本体(抬头冒灵感星),文字旁不再放额外动画 */}
      <Avatar show={showAvatar} breathing variant="thinking" />
      <span className="ai-narrate pt-2 text-xs font-medium">{t('editPage.ai.narrate.thinking')}</span>
    </motion.div>
  );
}

/**
 * A tool activity line (e.g. read_resume) with a pending → done transition. Muted and
 * indented to sit under the bot avatar column; breathing star + narrated text while
 * running, subtle check when finished.
 */
function ActivityLine({ message }: { message: ChatMessage }) {
  const running = message.status === 'running';
  return (
    <div className="flex items-center gap-2 pl-10 text-[11px] text-neutral-500">
      {running ? (
        <BreathGlyph size={11} className="text-sky-400/70" />
      ) : (
        <Check size={11} className="shrink-0 text-neutral-600" />
      )}
      <span className={cn('truncate', running && 'ai-narrate')}>{message.content}</span>
    </div>
  );
}

function ExecCard({
  message,
  onToggleCanvas,
  isCanvasOpen,
  showAvatar,
  avatarVariant,
}: {
  message: ChatMessage;
  onToggleCanvas: (id: SkillId) => void;
  isCanvasOpen: boolean;
  showAvatar: boolean;
  avatarVariant?: AvatarVariant;
}) {
  const { t } = useTranslation();
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
          <BreathGlyph size={13} className="ml-auto text-sky-400/80" />
        ) : (
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <Check size={12} />
            {t('aiLab.chat.done')}
          </span>
        )}
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <span className={cn('text-xs text-neutral-500 truncate', running && 'ai-narrate')}>
          {running ? t('aiLab.chat.running') : skill.doneSummary}
        </span>
        {clickable && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-400 bg-sky-500/10 group-hover:bg-sky-500/20 rounded-full px-2.5 py-1 shrink-0 transition-colors">
            {isCanvasOpen ? <EyeOff size={12} /> : <Eye size={12} />}
            {isCanvasOpen ? t('aiLab.chat.collapse') : t('aiLab.chat.view')}
          </span>
        )}
      </div>
    </>
  );

  return (
    <div className="flex gap-3 items-start">
      <Avatar show={showAvatar} variant={avatarVariant} />
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
  avatarVariant,
  onToggleCanvas,
  isCanvasOpen,
}: {
  message: ChatMessage;
  showAvatar: boolean;
  avatarVariant?: AvatarVariant;
  onToggleCanvas: (id: SkillId) => void;
  isCanvasOpen: boolean;
}) {
  const { t } = useTranslation();
  const todos = message.todos ?? [];
  const total = todos.length;
  const done = todos.filter((t) => t.status === 'completed').length;
  const allDone = total > 0 && done === total;

  return (
    <div className="flex gap-3 items-start">
      <Avatar show={showAvatar} variant={avatarVariant} />
      <div className="min-w-[280px] max-w-sm rounded-2xl bg-neutral-900 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-emerald-500/[0.12]">
            <ListChecks size={14} className="text-emerald-400" />
          </div>
          {message.subagentName ? (
            <span className="text-[13px] font-medium text-white">
              <span className="text-sky-400">{t('aiLab.chat.subagent')}</span>
              {message.subagentName !== '子代理' && message.subagentName !== 'general-purpose'
                ? ` · ${message.subagentName}`
                : ''}
            </span>
          ) : (
            <span className="text-[13px] font-medium text-white">{message.content || t('aiLab.chat.taskList')}</span>
          )}
          {message.status === 'done' || allDone ? (
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <Check size={12} />
              {t('aiLab.chat.done')}
            </span>
          ) : total > 0 ? (
            <span className="ml-auto text-[11px] text-neutral-500 tabular-nums">{done}/{total}</span>
          ) : (
            <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-neutral-500">
              <BreathGlyph size={11} className="text-sky-400/70" />
              <span className="ai-narrate">{t('aiLab.chat.working')}</span>
            </span>
          )}
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {todos.map((todo, i) => (
            <li key={`${todo.content}-${i}`} className="flex items-center gap-2.5 text-xs">
              {todo.status === 'completed' ? (
                <Check size={13} className="shrink-0 text-emerald-400" />
              ) : todo.status === 'in_progress' ? (
                <BreathGlyph size={13} className="text-sky-400" />
              ) : (
                <Circle size={12} className="shrink-0 text-neutral-600" />
              )}
              <span
                className={cn(
                  'truncate',
                  todo.status === 'completed'
                    ? 'text-neutral-400'
                    : todo.status === 'in_progress'
                      ? 'text-neutral-100 ai-narrate'
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
                  {isCanvasOpen ? t('aiLab.chat.collapse') : t('aiLab.chat.view')}
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
 * Human-in-the-loop approval prompt. The assistant asks before a sensitive action;
 * the user must allow / deny before it continues.
 */
function ApprovalCard({
  message,
  onApproval,
  showAvatar,
  avatarVariant,
}: {
  message: ChatMessage;
  onApproval?: ApprovalDecision;
  showAvatar: boolean;
  avatarVariant?: AvatarVariant;
}) {
  const { t } = useTranslation();
  const a = message.approval as ApprovalRequest | undefined;
  if (!a) return null;
  const decide = (approved: boolean) => onApproval?.(message.id, approved);

  return (
    <div className="flex gap-3 items-start">
      <Avatar show={showAvatar} variant={avatarVariant} />
      <div className="min-w-[260px] max-w-md rounded-2xl border border-sky-500/30 bg-sky-500/[0.07] px-4 py-3.5">
        <div className="flex items-start gap-2 text-[13px] text-sky-100 leading-relaxed">
          <ShieldQuestion size={15} className="text-sky-400 shrink-0 mt-0.5" />
          <span className="flex-1">{message.content || t('aiLab.chat.approval.defaultMessage')}</span>
        </div>
        {a.status === 'pending' ? (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => decide(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 px-3 py-1.5 text-xs font-medium text-sky-100 transition-colors cursor-pointer"
            >
              <Check size={12} />
              {t('aiLab.chat.approval.allow')}
            </button>
            <button
              type="button"
              onClick={() => decide(false)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={12} />
              {t('aiLab.chat.approval.deny')}
            </button>
          </div>
        ) : (
          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-neutral-500">
            {a.status === 'denied' ? (
              <>
                <X size={11} />
                {t('aiLab.chat.approval.denied')}
              </>
            ) : a.readState === 'read' ? (
              <>
                <Check size={11} className="text-emerald-500/80" />
                {t('aiLab.chat.approval.read')}
              </>
            ) : a.readState === 'reading' ? (
              <>
                <BreathGlyph size={11} className="text-sky-400/70" />
                <span className="ai-narrate">{t('aiLab.chat.approval.reading')}</span>
              </>
            ) : (
              <>
                <Check size={11} className="text-emerald-500/80" />
                {t('aiLab.chat.approval.allowed')}
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
  const { t } = useTranslation();
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
      title={t('aiLab.chat.backToChange')}
      className={`${className} hover:text-neutral-300 transition-colors cursor-pointer w-full text-left`}
    >
      {body}
    </button>
  );
}

function Bubble({
  message,
  showAvatar,
  avatarVariant,
}: {
  message: ChatMessage;
  showAvatar: boolean;
  avatarVariant?: AvatarVariant;
}) {
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
          {message.quote && (
            <div className="mb-2 flex items-start gap-2 rounded-lg bg-sunk px-2.5 py-2 text-left ring-1 ring-white/[0.05]">
              <CornerUpLeft size={12} className="mt-0.5 shrink-0 text-sky-400/80" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-medium text-neutral-500">{message.quote.label}</div>
                <div className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-neutral-300">
                  {message.quote.text}
                </div>
              </div>
            </div>
          )}
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 items-start">
      <Avatar show={showAvatar} variant={avatarVariant} />
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
  /** a run is streaming — the active bot run's avatar plays the typing pose */
  running?: boolean;
};

export default function ChatThread({ messages, onToggleCanvas, openCanvasSkillId, onLogClick, onApproval, onWidgetAction, thinking, running }: ChatThreadProps) {
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

  // 输出中:最后一轮 bot 消息组的头像(组内唯一可见的那个)演打字姿态;
  // 思考阶段由 ThinkingIndicator 自己演,历史消息永远静止。
  let lastAvatarIndex = -1;
  showAvatarFor.forEach((visible, i) => {
    if (visible) lastAvatarIndex = i;
  });
  const typingIndex = running && !thinking ? lastAvatarIndex : -1;
  const variantFor = (i: number): AvatarVariant => (i === typingIndex ? 'typing' : 'idle');

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
                avatarVariant={variantFor(i)}
              />
            ) : m.role === 'log' ? (
              <LogLine message={m} onLogClick={onLogClick} />
            ) : m.role === 'activity' ? (
              <ActivityLine message={m} />
            ) : m.role === 'approval' ? (
              <ApprovalCard message={m} onApproval={onApproval} showAvatar={showAvatarFor[i]} avatarVariant={variantFor(i)} />
            ) : m.role === 'plan' ? (
              <PlanCard
                message={m}
                showAvatar={showAvatarFor[i]}
                avatarVariant={variantFor(i)}
                onToggleCanvas={onToggleCanvas}
                isCanvasOpen={openCanvasSkillId === (m.skillId ?? 'analyze')}
              />
            ) : m.role === 'widget' ? (
              m.widget ? (
                <div className="flex gap-3 items-start">
                  <Avatar show={showAvatarFor[i]} variant={variantFor(i)} />
                  <WidgetHost instance={m.widget} onAction={onWidgetAction ?? (() => {})} />
                </div>
              ) : null
            ) : (
              <Bubble message={m} showAvatar={showAvatarFor[i]} avatarVariant={variantFor(i)} />
            )}
          </motion.div>
        ))}
        {thinking && <ThinkingIndicator showAvatar={!botAvatarShown} />}
        <div ref={endRef} />
      </div>
    </div>
  );
}
