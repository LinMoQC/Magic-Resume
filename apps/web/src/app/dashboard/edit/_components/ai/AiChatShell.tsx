'use client';

import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, FileText, SquarePen, X, Bot, PencilRuler, PanelLeftClose, PanelLeftOpen, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { InfoType, Resume, Section } from '@/types/frontend/resume';
import { SKILLS } from './skills/registry';
import type { CanvasState, CanvasView, ChatMessage, SkillId } from './types';
import ChatThread from './conversation/ChatThread';
import Composer from './conversation/Composer';
import SkillParamForm from './conversation/SkillParamForm';
import WelcomeSuggestions from './conversation/WelcomeSuggestions';
import ArtifactCanvas from './canvas/ArtifactCanvas';
import InterviewOverlay from './interview/InterviewOverlay';
import LivingCanvas, { type BatchRequest, type FocusRequest } from './canvas/living/LivingCanvas';
import { useTranslation } from 'react-i18next';
import type { MultiPersonaResumeAnalysis } from '@/types/agent/multi-persona';
import { analyzeResumeMulti, streamChat, approveTool } from './lib/services/agentClient';
import { buildOpeningSeed, fallbackOpening } from './lib/openingSeed';
import { useResumeDraftStore } from '@/store/useResumeDraftStore';
import { useSettingStore } from '@/store/useSettingStore';

type AiChatShellProps = {
  resumeData: Resume;
  templateId: string;
  onClose: () => void;
  onApplySections: (sections: Section) => void;
  onApplyInfo: (info: InfoType) => void;
  onApplyFullResume: (resume: Resume) => void;
  setIsAiJobRunning: (running: boolean) => void;
};

const CLOSED_CANVAS: CanvasState = { open: false, skillId: null, view: 'preview', status: 'idle' };

/** First-token timeout for the generated opening — past this, fall back to a canned
 *  line so create mode never hangs on a blank canvas (design §5 超时 / §7). */
const FIRST_TOKEN_TIMEOUT_MS = 8000;

/** Map the shell's thread into the backend chat history (user/assistant text only). */
function toBackendHistory(
  msgs: ChatMessage[]
): { role: 'user' | 'assistant'; content: string }[] {
  return msgs
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && !!m.content)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content as string }));
}

export default function AiChatShell({
  resumeData,
  templateId,
  onClose,
  onApplySections,
  onApplyInfo,
  onApplyFullResume,
  setIsAiJobRunning,
}: AiChatShellProps) {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [paramSkill, setParamSkill] = useState<SkillId | null>(null);
  const [canvas, setCanvas] = useState<CanvasState>(CLOSED_CANVAS);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [livingOpen, setLivingOpen] = useState(false);
  const [livingSkillId, setLivingSkillId] = useState<SkillId | null>(null);
  const [batchRequest, setBatchRequest] = useState<BatchRequest | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const batchNonce = useRef(0);
  const focusNonce = useRef(0);
  const [analysis, setAnalysis] = useState<MultiPersonaResumeAnalysis | null>(null);
  const [chatMode, setChatMode] = useState<'idle' | 'create'>('idle');
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [draftReady, setDraftReady] = useState<Resume | null>(null);
  // Resource scopes the user has approved this session (e.g. 'resume'). Once granted,
  // the agent skips re-prompting — carried to the backend on every turn (§6.5).
  const [grantedScopes, setGrantedScopes] = useState<string[]>([]);
  const setResumeDraft = useResumeDraftStore((s) => s.setResumeDraft);
  // BYOK: each user's AI session is initialized with their own LLM config
  // (key / baseUrl / model) — the backend has no server-side key (design §3.11).
  const { apiKey, baseUrl, model, maxTokens } = useSettingStore();
  const { i18n } = useTranslation();
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  // runChat reads granted scopes mid-stream (after an in-stream approval), so mirror
  // them in a ref to dodge the stale closure.
  const grantedScopesRef = useRef(grantedScopes);
  grantedScopesRef.current = grantedScopes;

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const addAssistant = useCallback(
    (content: string) => addMessage({ id: nanoid(), role: 'assistant', content }),
    [addMessage]
  );

  const logChange = useCallback(
    (content: string, resumePath?: string) =>
      addMessage({ id: nanoid(), role: 'log', content, resumePath }),
    [addMessage]
  );

  // Flip the most recent in-progress tool activity (e.g. "正在读取你的简历…") to its
  // done state, so the read line resolves instead of spinning forever.
  const markReadActivityDone = useCallback(() => {
    setMessages((prev) => {
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].role === 'activity' && prev[i].status === 'running') {
          const next = prev.slice();
          next[i] = { ...next[i], status: 'done', content: '已读取简历' };
          return next;
        }
      }
      return prev;
    });
  }, []);

  // Click a log entry → reopen the canvas and scroll to that spot (design §5 可点回溯).
  const focusOnCanvas = useCallback((resumePath: string) => {
    focusNonce.current += 1;
    setLivingOpen(true);
    setRailCollapsed(false);
    setFocusRequest({ path: resumePath, nonce: focusNonce.current });
  }, []);

  const toggleLiving = useCallback(() => {
    setLivingOpen((open) => {
      const next = !open;
      if (next) {
        setStarted(true);
        setCanvas(CLOSED_CANVAS);
        setBatchRequest(null); // manual open starts clean — don't replay a prior skill batch
        setLivingSkillId(null);
      }
      return next;
    });
  }, []);

  // P3 · a whole-resume content skill (optimize / translate) drops its result onto
  // the living canvas as a batch of in-place pending changes instead of a Diff tab.
  const isBatchSkill = (id: SkillId) => id === 'optimize' || id === 'translate';

  const seedBatch = useCallback((id: SkillId, params: Record<string, string>) => {
    batchNonce.current += 1;
    const kind = id === 'translate' ? 'translate' : 'optimize';
    setStarted(true);
    setCanvas(CLOSED_CANVAS);
    setLivingOpen(true);
    setLivingSkillId(id);
    setBatchRequest({ kind, lang: params.lang, nonce: batchNonce.current });
  }, []);

  // analyze · real backend call (design P0) — multi-persona competitiveness → ScoreView.
  const runAnalyze = useCallback(
    async (execId: string) => {
      const markDone = () =>
        setMessages((prev) => prev.map((m) => (m.id === execId ? { ...m, status: 'done' } : m)));
      try {
        const result = await analyzeResumeMulti({
          resumeData,
          config: { apiKey, baseUrl, modelName: model, maxTokens },
          language: i18n.language,
        });
        setAnalysis(result);
        markDone();
        setLivingOpen(false);
        setCanvas({ open: true, skillId: 'analyze', view: 'score', status: 'ready' });
      } catch (err) {
        markDone();
        const msg = err instanceof Error ? err.message : '分析失败';
        toast.error(msg);
        addAssistant(`分析没能完成：${msg}`);
      } finally {
        setRunning(false);
        setIsAiJobRunning(false);
      }
    },
    [resumeData, apiKey, baseUrl, model, maxTokens, i18n.language, addAssistant, setIsAiJobRunning]
  );

  const runSkill = useCallback(
    (id: SkillId, params: Record<string, string>, opts?: { addIntent?: boolean }) => {
      const skill = SKILLS[id];
      setStarted(true);
      setParamSkill(null);
      if (opts?.addIntent !== false) {
        addMessage({ id: nanoid(), role: 'user', content: skill.buildIntent(params) });
      }
      const execId = nanoid();
      addMessage({ id: execId, role: 'exec', skillId: id, status: 'running' });
      setRunning(true);
      setIsAiJobRunning(true);

      // analyze runs against the real backend; other skills remain mock for now.
      if (id === 'analyze') {
        void runAnalyze(execId);
        return;
      }

      window.setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === execId ? { ...m, status: 'done' } : m))
        );
        setRunning(false);
        setIsAiJobRunning(false);
        if (isBatchSkill(id)) {
          seedBatch(id, params);
        } else if (skill.canvas) {
          setLivingOpen(false);
          setCanvas({ open: true, skillId: id, view: skill.canvas.defaultView, status: 'ready' });
        }
      }, 1500);
    },
    [addMessage, setIsAiJobRunning, seedBatch, runAnalyze]
  );

  // create / general · real streaming chat (design P-create). Streams message_chunk
  // into a live assistant bubble; a resume block surfaces as a reviewable draft.
  const runChat = useCallback(
    async (
      history: { role: 'user' | 'assistant'; content: string }[],
      mode: 'create' | 'general',
      // When set, this is the generated opening: a first-token timeout (or any failure /
      // empty stream before text) drops to this canned line instead of hanging or
      // surfacing an error — the opening must always leave a way in (design §5 / §8.1).
      opts?: { fallbackGreeting?: string }
    ) => {
      const aiId = nanoid();
      // The assistant bubble is created lazily on the first chunk so that any
      // `read_resume` activity line lands *above* the reply, not below it. Until then
      // the thread shows the `awaitingReply` thinking placeholder (design §8.5).
      let bubbleCreated = false;
      const ensureBubble = () => {
        if (bubbleCreated) return;
        addMessage({ id: aiId, role: 'assistant', content: '', status: 'running', streamed: true });
        bubbleCreated = true;
        setAwaitingReply(false); // bubble takes over from the thinking placeholder
      };
      setRunning(true);
      setIsAiJobRunning(true);
      setAwaitingReply(true);

      // The opening arms a first-token watchdog; on fire it aborts the hung stream and
      // the catch/empty paths below fall back to the canned greeting.
      const controller = new AbortController();
      const timer = opts?.fallbackGreeting
        ? window.setTimeout(() => {
            if (!bubbleCreated) controller.abort();
          }, FIRST_TOKEN_TIMEOUT_MS)
        : undefined;

      let acc = '';
      try {
        for await (const ev of streamChat({
          messages: history,
          mode,
          // The agent pulls the resume on demand via its `read_resume` tool; we just
          // hand it the id (+ the session token server-side), not a full snapshot.
          resumeId: resumeData.id,
          config: { apiKey, baseUrl, modelName: model, maxTokens },
          grantedScopes: grantedScopesRef.current,
          signal: controller.signal,
        })) {
          if (ev.type === 'message_chunk' && ev.content) {
            if (timer) window.clearTimeout(timer);
            ensureBubble();
            acc += ev.content;
            setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, content: acc } : m)));
          } else if (ev.type === 'tool_approval_request') {
            // Agent paused on a sensitive tool (read_resume) → ask the user (§6.5).
            const p = ev.payload as { requestId?: string; scope?: string; reason?: string } | undefined;
            if (ev.runId && p?.requestId) {
              setAwaitingReply(false); // the card replaces the thinking dots
              addMessage({
                id: nanoid(),
                role: 'approval',
                content: p.reason || '想读取你的简历来给建议',
                approval: { runId: ev.runId, requestId: p.requestId, scope: p.scope || 'resume', status: 'pending' },
              });
            }
          } else if (ev.type === 'tool_started' && (ev.payload as { toolName?: string } | undefined)?.toolName === 'read_resume') {
            // Only narrate the read when it runs unprompted (scope already granted this
            // session); when ungranted, the approval card above drives the read line.
            if (grantedScopesRef.current.includes('resume')) {
              addMessage({ id: nanoid(), role: 'activity', content: '正在读取你的简历…', status: 'running' });
            }
          } else if (ev.type === 'tool_result' && (ev.payload as { toolName?: string } | undefined)?.toolName === 'read_resume') {
            markReadActivityDone();
          } else if (ev.type === 'resume_update' || ev.type === 'resume_patch') {
            const draft = (ev.data ?? (ev.payload as { resume?: unknown } | undefined)?.resume) as
              | Resume
              | undefined;
            if (draft && typeof draft === 'object') {
              setResumeDraft(draft);
              setDraftReady(draft);
            }
          } else if (ev.type === 'error') {
            throw new Error(ev.error || '对话出错');
          }
        }
        // Opening that produced no text at all → canned greeting, not an empty bubble.
        if (opts?.fallbackGreeting && !bubbleCreated) {
          addAssistant(opts.fallbackGreeting);
        } else {
          ensureBubble();
          setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, status: 'done' } : m)));
        }
      } catch (err) {
        if (opts?.fallbackGreeting && !bubbleCreated) {
          // Opening failed / timed out before any text — canned greeting, no error noise.
          addAssistant(opts.fallbackGreeting);
        } else {
          const msg = err instanceof Error ? err.message : '对话失败';
          ensureBubble();
          setMessages((prev) =>
            prev.map((m) => (m.id === aiId ? { ...m, content: acc || `（出错：${msg}）`, status: 'done' } : m))
          );
          toast.error(msg);
        }
      } finally {
        if (timer) window.clearTimeout(timer);
        markReadActivityDone(); // resolve any read line still spinning when the run ends
        setRunning(false);
        setIsAiJobRunning(false);
        setAwaitingReply(false);
      }
    },
    [resumeData, apiKey, baseUrl, model, maxTokens, addMessage, addAssistant, markReadActivityDone, setResumeDraft, setIsAiJobRunning]
  );

  // Human-in-the-loop: user answered a `tool_approval_request` card. Resolve it
  // server-side (the paused run resumes), remember the grant for the session, and
  // narrate the read on approve. The streamChat loop is still running and picks the
  // continuation back up once the backend unblocks (design §6.5).
  const handleApproval = useCallback(
    (msgId: string, req: { runId: string; requestId: string; scope: string }, approved: boolean) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId && m.approval
            ? { ...m, approval: { ...m.approval, status: approved ? 'approved' : 'denied' } }
            : m
        )
      );
      if (approved) {
        setGrantedScopes((prev) => (prev.includes(req.scope) ? prev : [...prev, req.scope]));
        if (req.scope === 'resume') {
          addMessage({ id: nanoid(), role: 'activity', content: '正在读取你的简历…', status: 'running' });
        }
      }
      setAwaitingReply(true); // either way the agent now continues — wait for its reply
      void approveTool({ runId: req.runId, requestId: req.requestId, approved }).catch((err) => {
        toast.error(err instanceof Error ? err.message : '授权失败');
      });
    },
    [addMessage]
  );

  const selectSkill = useCallback(
    (id: SkillId) => {
      const skill = SKILLS[id];
      setStarted(true);
      if (skill.surface === 'immersive') {
        setOverlayOpen(true);
        return;
      }
      if (skill.isChat) {
        setChatMode('create');
        // Dynamic opening: the agent greets from scratch (no resume content in the
        // seed — reading is approval-gated, §6.5). Seed isn't shown as a user bubble;
        // a first-token timeout falls back to a canned greeting (design §8.1).
        const seed = buildOpeningSeed(i18n.language);
        void runChat([{ role: 'user', content: seed }], 'create', {
          fallbackGreeting: fallbackOpening(i18n.language),
        });
        return;
      }
      if (skill.params.length > 0) {
        setParamSkill(id);
        return;
      }
      runSkill(id, {});
    },
    [runChat, runSkill, i18n.language]
  );

  const handleSend = useCallback(
    (text: string) => {
      setStarted(true);
      // Build the backend history (prior turns + this one) before the optimistic add.
      const history = toBackendHistory(messagesRef.current).concat([{ role: 'user', content: text }]);
      addMessage({ id: nanoid(), role: 'user', content: text });
      if (chatMode === 'create') {
        void runChat(history, 'create');
      } else if (/优化|jd|岗位/i.test(text)) {
        setParamSkill('optimize');
      } else if (/翻|英文|english|日|韩/i.test(text)) {
        setParamSkill('translate');
      } else if (/分析|体检|评分|竞争力/.test(text)) {
        window.setTimeout(() => runSkill('analyze', {}, { addIntent: false }), 250);
      } else if (/面试|模拟/.test(text)) {
        setOverlayOpen(true);
      } else if (/创建|从零|搭建|新建|从头|新简历/.test(text)) {
        setChatMode('create');
        void runChat(history, 'create');
      } else {
        void runChat(history, 'general');
      }
    },
    [chatMode, addMessage, runSkill, runChat]
  );

  const cancelParams = useCallback(() => {
    setParamSkill(null);
    setStarted((s) => (messages.length === 0 ? false : s));
  }, [messages.length]);

  const toggleCanvas = useCallback(
    (id: SkillId) => {
      // Content skills live on the living canvas — re-open it and regenerate the batch.
      if (isBatchSkill(id)) {
        if (livingOpen) {
          setLivingOpen(false);
        } else {
          seedBatch(id, {});
        }
        return;
      }
      setLivingOpen(false);
      setCanvas((prev) => {
        if (prev.open && prev.skillId === id) return { ...prev, open: false };
        const sk = SKILLS[id];
        if (!sk.canvas) return prev;
        return {
          open: true,
          skillId: id,
          view: sk.canvas.defaultView,
          status: prev.skillId === id ? prev.status : 'ready',
        };
      });
    },
    [livingOpen, seedBatch]
  );

  const applyChanges = useCallback(() => {
    onApplySections(resumeData.sections);
    setCanvas((prev) => ({ ...prev, status: 'applied' }));
    addAssistant('已把 4 处改动应用到当前简历。要我再做一次多角色体检吗？');
    toast.success('已应用到简历');
  }, [onApplySections, resumeData.sections, addAssistant]);

  const resetSession = useCallback(() => {
    setMessages([]);
    setStarted(false);
    setParamSkill(null);
    setCanvas(CLOSED_CANVAS);
    setOverlayOpen(false);
    setLivingOpen(false);
    setChatMode('idle');
    setAwaitingReply(false);
    setGrantedScopes([]);
    setDraftReady(null);
  }, []);

  const applyDraft = useCallback(() => {
    if (!draftReady) return;
    onApplyFullResume(draftReady);
    setDraftReady(null);
    addAssistant('已把草稿应用到当前简历。');
  }, [draftReady, onApplyFullResume, addAssistant]);

  const composer = (
    <>
      {draftReady && (
        <div className="px-4 pb-2">
          <div className="max-w-3xl mx-auto flex items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-2.5 text-xs text-sky-200">
            <FileText size={14} className="text-sky-400 shrink-0" />
            <span className="flex-1">已根据对话生成简历草稿</span>
            <button
              type="button"
              onClick={applyDraft}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 px-3 py-1.5 text-sky-100 transition-colors cursor-pointer"
            >
              <Check size={12} />
              应用到简历
            </button>
          </div>
        </div>
      )}
      <Composer onPickSkill={selectSkill} onSend={handleSend} disabled={running || !!paramSkill} />
    </>
  );

  return (
    <div className="relative flex flex-col h-full">
      <header className="flex items-center gap-3 px-5 py-3 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
          <FlaskConical size={18} />
        </div>
        <span className="text-base font-semibold text-white tracking-tight">AI 实验室</span>
        <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400 border border-neutral-800 rounded-full px-2.5 py-1">
          <FileText size={12} />
          {resumeData.name || '未命名简历'}
        </span>
        <div className="ml-auto flex items-center gap-3 text-neutral-500">
          <button
            type="button"
            onClick={toggleLiving}
            aria-label="实时画布"
            title="在简历上直接让 AI 改"
            className={cn(
              'inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 border transition-colors cursor-pointer',
              livingOpen
                ? 'text-sky-300 border-sky-500/40 bg-sky-500/10'
                : 'text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
            )}
          >
            <PencilRuler size={13} />
            实时画布
          </button>
          <button
            type="button"
            onClick={resetSession}
            aria-label="新对话"
            title="新对话"
            className="hover:text-white transition-colors cursor-pointer"
          >
            <SquarePen size={17} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="hover:text-white transition-colors cursor-pointer active:scale-90"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {livingOpen && railCollapsed ? (
          <aside className="shrink-0 w-12 flex flex-col items-center gap-3 py-4 border-r border-neutral-900">
            <div className="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Bot size={15} />
            </div>
            <button
              type="button"
              onClick={() => setRailCollapsed(false)}
              aria-label="展开对话"
              title="展开对话"
              className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
            >
              <PanelLeftOpen size={16} />
            </button>
            {messages.length > 0 && (
              <span className="text-[10px] text-neutral-600 tabular-nums">{messages.length}</span>
            )}
          </aside>
        ) : (
        <div className={cn('relative flex-1 flex flex-col min-w-0 overflow-hidden', !started && 'justify-center')}>
          {livingOpen && (
            <button
              type="button"
              onClick={() => setRailCollapsed(true)}
              aria-label="收起对话为侧栏"
              title="收起为侧栏"
              className="absolute top-2 right-2 z-10 text-neutral-600 hover:text-white transition-colors cursor-pointer"
            >
              <PanelLeftClose size={16} />
            </button>
          )}
          <AnimatePresence initial={false} mode="popLayout">
            {!started ? (
              <motion.div
                key="greeting"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center text-center px-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-5">
                  <Bot size={27} />
                </div>
                <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">今天想怎么打磨简历？</h2>
                <p className="text-sm text-neutral-500">描述你的需求，我会调用合适的技能来完成</p>
              </motion.div>
            ) : (
              <motion.div
                key="thread"
                className="flex-1 min-h-0 flex"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.12 }}
              >
                <ChatThread
                  messages={messages}
                  onToggleCanvas={toggleCanvas}
                  onLogClick={focusOnCanvas}
                  onApproval={handleApproval}
                  thinking={awaitingReply}
                  openCanvasSkillId={
                    canvas.open ? canvas.skillId : livingOpen ? livingSkillId : null
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            layout="position"
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="relative"
          >
            <AnimatePresence>
              {paramSkill && (
                <motion.div
                  key="paramform"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute bottom-full left-0 right-0 px-4 pb-2"
                >
                  <div className="max-w-3xl mx-auto">
                    <SkillParamForm
                      skill={SKILLS[paramSkill]}
                      onRun={(values) => runSkill(paramSkill, values)}
                      onCancel={cancelParams}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {composer}
          </motion.div>

          <AnimatePresence mode="popLayout">
            {!started && (
              <motion.div
                key="cards"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
                transition={{ duration: 0.25, delay: 0.05 }}
                className="mt-1"
              >
                <WelcomeSuggestions onPick={selectSkill} onPrompt={handleSend} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}

        {livingOpen ? (
          <div className={cn('shrink-0 min-w-0', railCollapsed ? 'flex-1' : 'w-[58%]')}>
            <LivingCanvas
              resumeData={resumeData}
              templateId={templateId}
              onApplySections={onApplySections}
              onApplyInfo={onApplyInfo}
              onLog={logChange}
              onClose={() => setLivingOpen(false)}
              batchRequest={batchRequest}
              focusRequest={focusRequest}
            />
          </div>
        ) : (
          <ArtifactCanvas
            state={canvas}
            resumeData={resumeData}
            templateId={templateId}
            analysis={analysis}
            onSetView={(view: CanvasView) => setCanvas((prev) => ({ ...prev, view }))}
            onApply={applyChanges}
            onDiscard={() => setCanvas(CLOSED_CANVAS)}
            onExport={() => addAssistant('体检报告已导出为 PDF。')}
          />
        )}
      </div>

      <InterviewOverlay
        open={overlayOpen}
        onBack={() => setOverlayOpen(false)}
        onEnd={() => {
          setOverlayOpen(false);
          addAssistant('模拟面试结束，已生成面试纪要。想让我据此分析你的表现吗？');
        }}
      />
    </div>
  );
}
