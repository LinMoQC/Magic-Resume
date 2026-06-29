'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, FileText, SquarePen, X, PencilRuler, Check, CircleStop } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { InfoType, Resume, Section } from '@/types/frontend/resume';
import { SKILLS } from './skills/registry';
import { WIDGETS } from './widgets/registry';
import type { WidgetActionResult, WidgetKind } from './widgets/types';
import type { CanvasState, ChatMessage, PlanTodo, SkillId } from './types';
import ChatThread from './conversation/ChatThread';
import Composer from './conversation/Composer';
import WelcomeSuggestions from './conversation/WelcomeSuggestions';
import ArtifactCanvas from './canvas/ArtifactCanvas';
import { PolarisAvatar } from './PolarisMark';
import InterviewOverlay from './interview/InterviewOverlay';
import LivingCanvas, { type BatchRequest, type FocusRequest } from './canvas/living/LivingCanvas';
import { type BatchKind } from './lib/diffResume';
import type { MultiPersonaResumeAnalysis } from '@/types/agent/multi-persona';
import { streamChat, approveTool, endSessionThread } from './lib/services/agentClient';
import type { AgentSseEvent } from './lib/services/types';
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

/** Default conversational intent when a content skill is launched without typed text.
 *  The AI gathers specifics (JD / target language) in-conversation via a `request_form`
 *  card — the frontend no longer pre-collects them in a gated popup. */
const SKILL_INTENT: Record<BatchKind, string> = {
  optimize: '帮我针对目标岗位优化我的简历。',
  translate: '把我的简历翻译成目标语言。',
};

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
  const [canvas, setCanvas] = useState<CanvasState>(CLOSED_CANVAS);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [livingOpen, setLivingOpen] = useState(false);
  const [livingSkillId, setLivingSkillId] = useState<SkillId | null>(null);
  const [batchRequest, setBatchRequest] = useState<BatchRequest | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const batchNonce = useRef(0);
  const focusNonce = useRef(0);
  // Set while a whole-resume skill (optimize/translate) run is in flight, so the
  // `resume_update` it emits routes into the living-canvas diff (not the chat draft
  // banner). Survives the read_resume approval pause; reset when a new run starts.
  const skillBatchRunRef = useRef<{ kind: BatchKind; lang?: string } | null>(null);
  const [analysis, setAnalysis] = useState<MultiPersonaResumeAnalysis | null>(null);
  const [chatMode, setChatMode] = useState<'idle' | 'create'>('idle');
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [draftReady, setDraftReady] = useState<Resume | null>(null);
  // One conversation = one sessionId (= LangGraph thread, namespaced by user
  // server-side). "New chat" mints a new one (resetSession). Mirrored in a ref so
  // the HITL resume — fired from an event handler — reads the current id without a
  // stale closure (design §2).
  const [sessionId, setSessionId] = useState(() => nanoid());
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  // Single source of truth for the in-flight run: the AbortController that stops it
  // (so close / new-chat / unmount halts the backend stream instead of orphaning a
  // run that keeps spending the user's BYOK tokens), plus a generation counter so a
  // superseded run's lingering async callbacks early-return instead of writing into
  // the new session (design P0 · CC4 / LC3).
  const controllerRef = useRef<AbortController | null>(null);
  const runGenRef = useRef(0);
  // True once this session opened a persisted chat thread (create / general), so we
  // only fire the reclaim DELETE when there's actually a thread to delete.
  const sessionUsedRef = useRef(false);
  // On unmount (modal close / route back): abort the in-flight run, invalidate its
  // callbacks, and reclaim the backend session thread (ephemeral-data lifecycle).
  useEffect(
    () => () => {
      runGenRef.current += 1;
      controllerRef.current?.abort();
      if (sessionUsedRef.current) void endSessionThread(sessionIdRef.current);
    },
    []
  );
  const setResumeDraft = useResumeDraftStore((s) => s.setResumeDraft);
  // BYOK: each user's AI session is initialized with their own LLM config
  // (key / baseUrl / model) — the backend has no server-side key (design §3.11).
  const { apiKey, baseUrl, model, maxTokens } = useSettingStore();
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  // The analyze skill renders a live review todolist (a `plan` card) instead of a
  // single exec card. It's created on the first plan_update — which the backend
  // only emits once the analyze_resume tool actually runs, i.e. *after* approval,
  // so the card lands below the approval card. The id is tracked here so later
  // plan_updates update the same card and resume_analysis can finalize it.
  const planCardRef = useRef<string | null>(null);
  // Name of the active subagent (set on subagent_started, cleared on completed).
  // While set, plan_updates feed that subagent's own todolist card and its raw
  // streamed tokens are kept out of the main bubble.
  const activeSubagentRef = useRef<string | null>(null);
  // The active subagent's OWN plan card — separate from planCardRef so starting a
  // subagent mid-run doesn't orphan the main agent's plan card (which would then
  // never finalize and hang on "工作中").
  const subagentPlanCardRef = useRef<string | null>(null);
  // The read_resume approval card spans two streams (approve in one, the read in
  // the next). Tracked here so the read's progress (reading → read) updates that
  // same card's footer in place — 已允许读取 → 已读取简历 — instead of a separate line.
  const readApprovalRef = useRef<string | null>(null);

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

  // Flip the most recent in-progress tool activity to its done state with the
  // given label, so an activity line resolves instead of spinning forever.
  const markActivityDone = useCallback((doneText: string) => {
    setMessages((prev) => {
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].role === 'activity' && prev[i].status === 'running') {
          const next = prev.slice();
          next[i] = { ...next[i], status: 'done', content: doneText };
          return next;
        }
      }
      return prev;
    });
  }, []);

  const markReadActivityDone = useCallback(
    () => markActivityDone('已读取简历'),
    [markActivityDone]
  );

  // Advance a read_resume approval card's footer through its read lifecycle
  // (reading → read), so 已允许读取 / 正在读取简历… / 已读取简历 all live in one place.
  const setApprovalReadState = useCallback(
    (msgId: string, readState: 'reading' | 'read') => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId && m.approval
            ? { ...m, approval: { ...m.approval, readState } }
            : m
        )
      );
    },
    []
  );

  // Click a log entry → reopen the canvas and scroll to that spot (design §5 可点回溯).
  const focusOnCanvas = useCallback((resumePath: string) => {
    focusNonce.current += 1;
    setLivingOpen(true);
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

  // Consume an agent SSE stream into the thread — shared by the initial chat and
  // the HITL resume (approve), since both speak the same normalized event schema.
  // The initial stream ends at a `tool_approval_request`; approving opens a fresh
  // continuation stream that this same consumer drains (design §6 native HITL).
  // Streams message_chunk into a live assistant bubble; a resume surfaces as a
  // reviewable draft.
  const consumeStream = useCallback(
    async (makeGen: (signal: AbortSignal) => AsyncGenerator<AgentSseEvent>) => {
      const aiId = nanoid();
      // The assistant bubble is created lazily on the first chunk so any
      // `read_resume` activity line lands *above* the reply (design §8.5).
      let bubbleCreated = false;
      const ensureBubble = () => {
        if (bubbleCreated) return;
        addMessage({ id: aiId, role: 'assistant', content: '', status: 'running', streamed: true });
        bubbleCreated = true;
        setAwaitingReply(false);
      };

      // Supersede any prior in-flight run: abort it and bump the generation so its
      // lingering callbacks early-return instead of writing into this run's session.
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const myGen = ++runGenRef.current;
      const isCurrent = () => myGen === runGenRef.current;

      setRunning(true);
      setIsAiJobRunning(true);
      setAwaitingReply(true);

      let acc = '';
      // The initial stream ends when the agent pauses for approval; track it so the
      // finalizer doesn't drop an empty assistant bubble after the approval card.
      let pausedForApproval = false;
      try {
        for await (const ev of makeGen(controller.signal)) {
          // A newer run (or unmount) superseded this one — stop touching state.
          if (!isCurrent()) return;
          if (ev.type === 'message_chunk' && ev.content) {
            // A subagent's raw tokens (e.g. translation JSON / its reasoning) stay out
            // of the chat — its progress shows on its own todolist card and its result
            // lands via resume_update. Only the main agent's narration hits the bubble.
            if (!activeSubagentRef.current) {
              ensureBubble();
              acc += ev.content;
              setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, content: acc } : m)));
            }
          } else if (ev.type === 'tool_approval_request') {
            // Agent paused before a sensitive tool (read_resume) OR to collect input
            // via a GenUI widget (request_form). The initial stream ends here; the
            // card drives the resume (§6 · genui-systematization §4).
            const p = ev.payload as {
              requestId?: string;
              toolName?: string;
              reason?: string;
              args?: Record<string, unknown>;
            } | undefined;
            if (p?.requestId) {
              pausedForApproval = true;
              setAwaitingReply(false); // the card replaces the thinking dots
              if (p.toolName && WIDGETS[p.toolName]) {
                // GenUI widget: render the registered card; submit/cancel resumes the
                // run via handleWidgetAction (respond / reject).
                addMessage({
                  id: nanoid(),
                  role: 'widget',
                  widget: {
                    widgetId: p.requestId,
                    kind: p.toolName as WidgetKind,
                    props: p.args ?? {},
                    status: 'pending',
                  },
                });
              } else {
                const approvalId = nanoid();
                // The read result resolves on this same card; the direct read_resume
                // approval owns it; analyze reads via its todolist.
                if (p.toolName === 'read_resume') readApprovalRef.current = approvalId;
                addMessage({
                  id: approvalId,
                  role: 'approval',
                  content: p.reason || '想读取你的简历来给建议',
                  approval: { requestId: p.requestId, toolName: p.toolName, scope: 'resume', status: 'pending' },
                });
              }
            }
          } else if (ev.type === 'tool_started' && (ev.payload as { toolName?: string } | undefined)?.toolName === 'read_resume') {
            // The read runs after approval. Show progress on the approval card
            // itself (已允许读取 → 正在读取简历…) instead of a separate activity line;
            // fall back to a line only if there's no card to update.
            if (readApprovalRef.current) {
              setApprovalReadState(readApprovalRef.current, 'reading');
            } else {
              addMessage({ id: nanoid(), role: 'activity', content: '正在读取你的简历…', status: 'running' });
            }
          } else if (ev.type === 'tool_result' && (ev.payload as { toolName?: string } | undefined)?.toolName === 'read_resume') {
            if (readApprovalRef.current) {
              setApprovalReadState(readApprovalRef.current, 'read'); // → 已读取简历
              readApprovalRef.current = null;
            } else {
              markReadActivityDone();
            }
          } else if (ev.type === 'plan_update') {
            // A live todolist (the analyze checklist, or a write_todos plan from the
            // main agent or a subagent). Route to the active subagent's card while one
            // is running, else the main card — so the two never collide. The label
            // comes from the backend (analyze → "简历多角色评审"); plain plans default.
            const payload = ev.payload as { todos?: PlanTodo[]; label?: string } | undefined;
            const todos = payload?.todos;
            if (Array.isArray(todos)) {
              const allDone = todos.length > 0 && todos.every((t) => t.status === 'completed');
              const sub = activeSubagentRef.current;
              const ref = sub ? subagentPlanCardRef : planCardRef;
              if (ref.current) {
                const planId = ref.current;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === planId ? { ...m, todos, status: allDone ? 'done' : 'running' } : m
                  )
                );
              } else {
                const planId = nanoid();
                ref.current = planId;
                setAwaitingReply(false); // the todolist replaces the thinking dots
                // Route the card's canvas toggle to the right surface: a batch run
                // (translate / optimize) lives on the living canvas; analyze on the
                // score canvas. Without this the toggle was hardcoded to 'analyze',
                // so a translate plan opened the empty score canvas (and mislabelled
                // 查看/收起 since the living canvas was already open).
                const canvasSkill: SkillId = skillBatchRunRef.current
                  ? skillBatchRunRef.current.kind
                  : 'analyze';
                addMessage({
                  id: planId,
                  role: 'plan',
                  ...(sub ? { subagentName: sub } : { skillId: canvasSkill }),
                  content: sub ? '' : payload?.label || '任务清单',
                  todos,
                  status: allDone ? 'done' : 'running',
                });
              }
            }
          } else if (ev.type === 'subagent_started') {
            // A subagent started. Everything until subagent_completed is its work:
            // give it its OWN todolist card (separate ref, so the main plan card isn't
            // orphaned), and keep its raw streamed tokens out of the main bubble.
            const payload = ev.payload as
              | { name?: string; args?: { description?: string } }
              | undefined;
            const rawName = payload?.name;
            const task = payload?.args?.description?.trim();
            // Prefer the subagent's type/skill name (e.g. resume-translation); for a
            // generic worker (general-purpose), fall back to the task it was given so
            // the card says what it's doing instead of an empty "子代理".
            const name =
              rawName && rawName !== '子代理' && rawName !== 'general-purpose'
                ? rawName
                : task
                  ? task.length > 36
                    ? `${task.slice(0, 36)}…`
                    : task
                  : '子代理';
            activeSubagentRef.current = name;
            const planId = nanoid();
            subagentPlanCardRef.current = planId;
            setAwaitingReply(false);
            addMessage({
              id: planId,
              role: 'plan',
              subagentName: name,
              content: '',
              todos: [],
              status: 'running',
            });
          } else if (ev.type === 'subagent_completed') {
            activeSubagentRef.current = null;
            if (subagentPlanCardRef.current) {
              const planId = subagentPlanCardRef.current;
              subagentPlanCardRef.current = null;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === planId
                    ? { ...m, status: 'done', todos: (m.todos ?? []).map((t) => ({ ...t, status: 'completed' })) }
                    : m
                )
              );
            }
          } else if (ev.type === 'resume_update' || ev.type === 'resume_patch') {
            const draft = (ev.data ?? (ev.payload as { resume?: unknown } | undefined)?.resume) as
              | Resume
              | undefined;
            // A resume_update must carry a keyed `sections` object. A malformed
            // payload (e.g. a backend that forgot to unwrap the stored `content`
            // blob) would otherwise reach MagicResumeRenderer and crash it on
            // `data.sections.<key>`. Ignore + warn instead of rendering garbage.
            const sections =
              draft && typeof draft === 'object' ? draft.sections : undefined;
            if (draft && sections && typeof sections === 'object' && !Array.isArray(sections)) {
              const batch = skillBatchRunRef.current;
              if (batch) {
                // optimize/translate skill run → stage real per-field diffs on the
                // living canvas (the agent's full resume vs the current one).
                batchNonce.current += 1;
                setBatchRequest({
                  kind: batch.kind,
                  lang: batch.lang,
                  proposedSections: sections,
                  nonce: batchNonce.current,
                });
              } else {
                setResumeDraft(draft);
                setDraftReady(draft);
              }
            } else {
              console.warn(
                '[ai] ignoring malformed resume_update (no sections object)',
                draft,
              );
            }
          } else if (ev.type === 'resume_analysis') {
            // The analyze_resume tool finished — surface the structured
            // multi-persona result on the ScoreView canvas (analyze runs entirely
            // through /api/chat; there's no separate analyze endpoint).
            const result = (ev.data ?? (ev.payload as { data?: unknown } | undefined)?.data) as
              | MultiPersonaResumeAnalysis
              | undefined;
            if (result && typeof result === 'object') {
              setAnalysis(result);
              setLivingOpen(false);
              setCanvas({ open: true, skillId: 'analyze', view: 'score', status: 'ready' });
              // The analysis landed → mark every checklist step done (defensive: the
              // assemble step's plan_update may race the artifact event).
              if (planCardRef.current) {
                const planId = planCardRef.current;
                planCardRef.current = null;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === planId
                      ? {
                          ...m,
                          status: 'done',
                          todos: m.todos?.map((t) => ({ ...t, status: 'completed' })),
                        }
                      : m
                  )
                );
              }
            }
          } else if (ev.type === 'error') {
            throw new Error(ev.error || '对话出错');
          }
        }
        if (pausedForApproval && !bubbleCreated) {
          // Paused for approval before any text — the card is the terminal UI for
          // this segment; the resume stream picks up after the user decides.
        } else {
          ensureBubble();
          setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, status: 'done' } : m)));
        }
      } catch (err) {
        // Aborted (user stopped / closed / reset / unmounted) or superseded by a
        // newer run — not a failure, so no error bubble or toast.
        if (controller.signal.aborted || !isCurrent()) {
          return;
        }
        const msg = err instanceof Error ? err.message : '对话失败';
        ensureBubble();
        setMessages((prev) =>
          prev.map((m) => (m.id === aiId ? { ...m, content: acc || `（出错：${msg}）`, status: 'done' } : m))
        );
        toast.error(msg);
      } finally {
        // Only the current run cleans up shared UI state — a superseded/unmounted run
        // must not flip the new run's spinners off or write into its thread.
        if (isCurrent()) {
          markReadActivityDone(); // resolve any read line still spinning
          // Finalize any still-live plan card — the main one AND an active subagent's —
          // so neither hangs on a spinner if the stream ends/errors mid-step.
          activeSubagentRef.current = null;
          for (const ref of [planCardRef, subagentPlanCardRef]) {
            if (!ref.current) continue;
            const planId = ref.current;
            ref.current = null;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === planId
                  ? {
                      ...m,
                      status: 'done',
                      todos: m.todos?.map((t) =>
                        t.status === 'in_progress' ? { ...t, status: 'pending' } : t
                      ),
                    }
                  : m
              )
            );
          }
          setRunning(false);
          setIsAiJobRunning(false);
          setAwaitingReply(false);
          controllerRef.current = null;
        }
      }
    },
    [addMessage, markReadActivityDone, setApprovalReadState, setResumeDraft, setIsAiJobRunning]
  );

  // analyze · runs in-conversation through the single /api/chat entry. The
  // orchestrator calls the `analyze_resume` tool (engine), which reads the resume
  // and runs the 3-persona analysis internally, streaming a checklist (plan_update)
  // as it goes and finally a `resume_analysis` event that consumeStream maps onto
  // the ScoreView. The live todolist card is owned by consumeStream via planCardRef.
  const runAnalyze = useCallback(
    async () => {
      planCardRef.current = null; // a fresh review todolist for this run
      skillBatchRunRef.current = null; // not a whole-resume skill batch run
      await consumeStream((signal) =>
        streamChat({
          messages: [{ role: 'user', content: SKILLS.analyze.buildIntent({}) }],
          mode: 'analyze',
          // No sessionId: analyze is a one-shot transform — it runs threadless so the
          // backend skips the checkpointer (no write amplification / no cross-mode
          // context bleed, CC1). sessionId is reserved for the create/general chat.
          resumeId: resumeData.id,
          config: { apiKey, baseUrl, modelName: model, maxTokens },
          signal,
        })
      );
    },
    [consumeStream, resumeData.id, apiKey, baseUrl, model, maxTokens]
  );

  // Whole-resume content skill (optimize / translate) → CONVERSATIONAL run via
  // /api/chat (session-threaded). No upfront param popup: the AI routes to the
  // resume-optimization / resume-translation skill, and when it needs specifics
  // (JD / target language) it calls `request_form` mid-conversation → a FormCard the
  // user fills → `respond` resumes → optimize. The final full-resume `resume_update`
  // diffs onto the living canvas (skillBatchRunRef survives the form interrupt).
  const runContentSkill = useCallback(
    (kind: BatchKind, message: string) => {
      setCanvas(CLOSED_CANVAS);
      setLivingOpen(true);
      setLivingSkillId(kind);
      skillBatchRunRef.current = { kind };
      sessionUsedRef.current = true; // multi-turn (ask → fill → optimize) needs the thread
      void consumeStream((signal) =>
        streamChat({
          messages: [{ role: 'user', content: message }],
          mode: kind,
          sessionId: sessionIdRef.current,
          resumeId: resumeData.id,
          config: { apiKey, baseUrl, modelName: model, maxTokens },
          signal,
        })
      );
    },
    [consumeStream, resumeData.id, apiKey, baseUrl, model, maxTokens]
  );

  // The user acted on a GenUI widget card (submit / cancel). Mark it resolved and
  // resume the paused run via the HITL channel: submit → `respond` with the values;
  // cancel → `reject` (design/genui-systematization.md §5).
  const handleWidgetAction = useCallback(
    (widgetId: string, result: WidgetActionResult) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.widget?.widgetId === widgetId
            ? {
                ...m,
                widget: {
                  ...m.widget,
                  status: result.type === 'submit' ? 'submitted' : 'cancelled',
                },
              }
            : m
        )
      );
      // Resume the paused `request_form` tool. Submit → `edit` injects the user's
      // values into the tool args (the tool echoes them back to the model); cancel
      // → `reject`. (langchain HITL has no `respond`, so submit rides on `edit`.)
      const w = messagesRef.current.find((m) => m.widget?.widgetId === widgetId)?.widget;
      const decision =
        result.type === 'submit'
          ? {
              type: 'edit' as const,
              editedAction: {
                name: w?.kind ?? 'request_form',
                args: { ...(w?.props ?? {}), values: result.values ?? {} },
              },
            }
          : { type: 'reject' as const, message: '用户取消了填写' };
      void consumeStream((signal) =>
        approveTool({
          sessionId: sessionIdRef.current,
          decisions: [decision],
          resumeId: resumeData.id,
          config: { apiKey, baseUrl, modelName: model, maxTokens },
          signal,
        })
      );
    },
    [consumeStream, resumeData.id, apiKey, baseUrl, model, maxTokens]
  );

  // create / general · real streaming chat. Sends only the new turn(s); the
  // checkpointer (keyed by sessionId) supplies the rest of the history (§2).
  const runChat = useCallback(
    (history: { role: 'user' | 'assistant'; content: string }[], mode: 'create' | 'general') => {
      skillBatchRunRef.current = null; // not a whole-resume skill batch run
      sessionUsedRef.current = true; // a persisted chat thread now exists → reclaim on end
      return consumeStream((signal) =>
        streamChat({
          messages: history,
          mode,
          sessionId: sessionIdRef.current,
          // The agent pulls the resume on demand via its `read_resume` tool; we
          // just hand it the id (+ the session token server-side).
          resumeId: resumeData.id,
          config: { apiKey, baseUrl, modelName: model, maxTokens },
          signal,
        })
      );
    },
    [consumeStream, resumeData.id, apiKey, baseUrl, model, maxTokens]
  );

  // Human-in-the-loop: the user answered a `tool_approval_request` card. Resume the
  // paused thread by sessionId with the decision; the approve endpoint streams the
  // continuation, which the shared consumer drains (design §6 native HITL).
  const handleApproval = useCallback(
    (msgId: string, approved: boolean) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId && m.approval
            ? { ...m, approval: { ...m.approval, status: approved ? 'approved' : 'denied' } }
            : m
        )
      );
      void consumeStream((signal) =>
        approveTool({
          sessionId: sessionIdRef.current,
          decisions: [{ type: approved ? 'approve' : 'reject' }],
          resumeId: resumeData.id,
          config: { apiKey, baseUrl, modelName: model, maxTokens },
          signal,
        })
      );
    },
    [consumeStream, resumeData.id, apiKey, baseUrl, model, maxTokens]
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
        runContentSkill('optimize', text); // conversational; AI asks for JD via a FormCard
      } else if (/翻|英文|english|日|韩/i.test(text)) {
        runContentSkill('translate', text);
      } else if (/分析|体检|评分|竞争力/.test(text)) {
        void runAnalyze();
      } else if (/面试|模拟/.test(text)) {
        setOverlayOpen(true);
      } else if (/创建|从零|搭建|新建|从头|新简历/.test(text)) {
        setChatMode('create');
        void runChat(history, 'create');
      } else {
        void runChat(history, 'general');
      }
    },
    [chatMode, addMessage, runContentSkill, runAnalyze, runChat]
  );

  // A skill picked from the `/` menu rides as a chip + freeform text in the Composer:
  // selecting it no longer launches immediately; the user types context, then Enter
  // runs it here. The text maps to the skill's primary param (translate → target
  // language, optimize → JD); empty text falls back to the skill's own defaults.
  const runSkillWithText = useCallback(
    (id: SkillId, text: string) => {
      const skill = SKILLS[id];
      setStarted(true);
      const t = text.trim();

      if (skill.surface === 'immersive') {
        setOverlayOpen(true);
        return;
      }

      // Content skills (optimize / translate) run conversationally: typed text is the
      // turn; with no text we send a natural intent and the AI gathers specifics via a
      // FormCard. No upfront param popup.
      if (id === 'translate' || id === 'optimize') {
        const msg = t || SKILL_INTENT[id];
        addMessage({ id: nanoid(), role: 'user', content: msg, skillId: id });
        runContentSkill(id, msg);
        return;
      }

      const display = t || skill.buildIntent({});
      // Tag the turn with the skill so the bubble shows which skill ran.
      addMessage({ id: nanoid(), role: 'user', content: display, skillId: id });

      if (skill.isChat) {
        setChatMode('create');
        void runChat(
          toBackendHistory(messagesRef.current).concat([{ role: 'user', content: display }]),
          'create',
        );
        return;
      }

      // analyze (no params): the multi-persona tool takes no freeform input — the
      // typed text just shows as the turn while the standard analysis runs.
      void runAnalyze();
    },
    [addMessage, runChat, runContentSkill, runAnalyze],
  );

  const toggleCanvas = useCallback(
    (id: SkillId) => {
      // Content skills live on the living canvas. Re-running optimize/translate needs
      // its params (JD / language), so the rail toggle just shows/hides the canvas with
      // the last result — re-run the skill itself to regenerate.
      if (isBatchSkill(id)) {
        setLivingOpen((open) => !open);
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
    []
  );

  const applyChanges = useCallback(() => {
    onApplySections(resumeData.sections);
    setCanvas((prev) => ({ ...prev, status: 'applied' }));
    addAssistant('已把 4 处改动应用到当前简历。要我再做一次多角色体检吗？');
    toast.success('已应用到简历');
  }, [onApplySections, resumeData.sections, addAssistant]);

  const resetSession = useCallback(() => {
    runGenRef.current += 1; // invalidate the in-flight run's lingering callbacks
    controllerRef.current?.abort(); // stop the old thread's backend stream
    if (sessionUsedRef.current) void endSessionThread(sessionIdRef.current); // reclaim old thread
    sessionUsedRef.current = false;
    setMessages([]);
    setStarted(false);
    setCanvas(CLOSED_CANVAS);
    setOverlayOpen(false);
    setLivingOpen(false);
    setChatMode('idle');
    setAwaitingReply(false);
    setSessionId(nanoid()); // new conversation → new thread (don't continue the old)
    setDraftReady(null);
  }, []);

  // (param-form popup removed — optimize/translate now gather inputs in-conversation
  //  via a FormCard widget; see runContentSkill + handleWidgetAction.)

  const stopRun = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  const handleClose = useCallback(() => {
    // Closing mid-run aborts the backend stream (no orphaned BYOK token burn); the
    // confirm just guards against losing an in-flight job to a stray click.
    if (
      running &&
      typeof window !== 'undefined' &&
      !window.confirm('AI 正在生成，关闭将停止本次生成。确定关闭？')
    ) {
      return;
    }
    controllerRef.current?.abort();
    onClose();
  }, [running, onClose]);

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
      {running && (
        <div className="px-4 pb-2">
          <div className="max-w-3xl mx-auto flex justify-center">
            <button
              type="button"
              onClick={stopRun}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900/80 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:border-neutral-600 transition-colors cursor-pointer"
            >
              <CircleStop size={13} />
              停止生成
            </button>
          </div>
        </div>
      )}
      <Composer onRunSkill={runSkillWithText} onSend={handleSend} disabled={running} />
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
            onClick={handleClose}
            aria-label="关闭"
            className="hover:text-white transition-colors cursor-pointer active:scale-90"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <div className={cn('relative flex-1 flex flex-col min-w-0 overflow-hidden', !started && 'justify-center')}>
          <AnimatePresence initial={false} mode="popLayout">
            {!started ? (
              <motion.div
                key="greeting"
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
                }}
                className="flex flex-col items-center text-center px-4"
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10, scale: 0.92 },
                    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: 'easeOut' } },
                  }}
                >
                  <PolarisAvatar className="mb-5" />
                </motion.div>
                <motion.h2
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
                  }}
                  className="text-2xl font-semibold text-white tracking-tight mb-2"
                >
                  今天想怎么打磨简历？
                </motion.h2>
                <motion.p
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
                  }}
                  className="text-sm text-neutral-500"
                >
                  描述你的需求，我会调用合适的技能来完成
                </motion.p>
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
                  onWidgetAction={handleWidgetAction}
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
                <WelcomeSuggestions onPrompt={handleSend} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 实时画布以宽度+透明度滑入/滑出（贴元素、不弹跳，缓动同参数表单）。 */}
        <AnimatePresence initial={false}>
          {livingOpen && (
            <motion.div
              key="living-canvas"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '58%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="shrink-0 min-w-0 overflow-hidden"
            >
              <LivingCanvas
                resumeData={resumeData}
                templateId={templateId}
                onApplySections={onApplySections}
                onApplyInfo={onApplyInfo}
                onLog={logChange}
                batchRequest={batchRequest}
                focusRequest={focusRequest}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {!livingOpen && (
          <ArtifactCanvas
            state={canvas}
            resumeData={resumeData}
            templateId={templateId}
            analysis={analysis}
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
