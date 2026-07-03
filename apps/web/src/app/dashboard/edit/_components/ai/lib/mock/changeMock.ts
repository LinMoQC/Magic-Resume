import { nanoid } from 'nanoid';
import type { EditableTarget } from '../editableCanvas';
import type { Section } from '@/types/frontend/resume';
import {
  finalizeAfter,
  routeFreeText,
  sectionTitle,
  stripHtml,
  wrapLike,
  type PendingChange,
  type QuickActionId,
  type SelectionActionId,
} from '../changeModel';

/**
 * Deterministic mock generators for the living canvas. There is no model wired
 * into the AI Lab shell yet; these produce the proposed `after` text + rationale.
 *
 * Swapping this file for a real backend service (design §3.6 / `../services`)
 * leaves the change model + apply path in `../changeModel` untouched.
 */

/** A longer "why" revealed on demand under the one-line rationale (design §D). */
const RATIONALE_DETAIL: Record<string, string> = {
  quantify: '招聘方更信任可衡量的结果——用数字（比例/规模/耗时）替代笼统描述，能直接体现影响力量级。',
  concise: '一句话只讲一个重点，去掉修饰与重复，让招聘方 6 秒内抓住你的贡献。',
  verb: '用"主导/操盘/牵头"等强动词开头，突出你的主导性与责任范围，而非被动参与。',
  evidence: '为成果补一条可验证的事实（落地范围/复用/被收录），让描述更可信、更经得起追问。',
  rewrite: '从角色与价值出发整体重写，让这段更有主见、更贴合目标岗位的叙事。',
  tone: '在保留事实的前提下调整语气，让表达更有温度或更稳重，贴合目标团队气质。',
  shorten: '压缩到核心信息，适合篇幅紧张或需要一行速读的场景。',
  polish: '在不改变原意的前提下润色措辞，让这段读起来更专业有力。',
  translate: '生成对应语言版本，术语与表达按目标语言习惯调整。',
  free: '依据你的自定义指令改写，并尽量保留原有事实要点。',
  insert: '基于本段已有内容补一条同风格、可量化的新要点，接受后会作为新条目加入。',
};

// ----------------------------------------------------------------------------
// Element quick-action generation
// ----------------------------------------------------------------------------

interface Variant {
  text: (orig: string) => string;
  rationale: string;
}

const VARIANTS: Record<QuickActionId, Variant[]> = {
  quantify: [
    { text: () => '主导核心模块重构，使首屏加载时间缩短 40%，覆盖日活 50w+ 用户', rationale: '补上量化数据，突出影响力' },
    { text: () => '推动接口聚合与缓存策略，P95 响应从 800ms 降至 220ms', rationale: '用关键指标证明结果' },
    { text: () => '搭建可复用组件库，复用率达 70%，团队迭代效率提升约 3 倍', rationale: '量化效率收益' },
  ],
  concise: [
    { text: (o) => o.replace(/[，。].*$/, '') || '负责前端核心功能开发与性能优化', rationale: '去掉冗余表述，更紧凑' },
    { text: () => '负责核心模块开发，保障线上稳定与体验', rationale: '一句话讲清职责' },
    { text: () => '主导前端架构与关键功能落地', rationale: '精简到要点' },
  ],
  verb: [
    { text: () => '主导核心模块的设计与落地，推动跨团队协作交付', rationale: '动词更有力（主导/推动）' },
    { text: () => '操盘前端技术选型，攻克长列表性能瓶颈', rationale: '换用更主动的动词' },
    { text: () => '牵头组件体系建设，沉淀团队前端规范', rationale: '动词突出主导性' },
  ],
  evidence: [
    { text: (o) => `${o || '负责前端开发'}；相关方案已在 3 条业务线落地并形成文档沉淀`, rationale: '补上可验证的证据' },
    { text: (o) => `${o || '负责前端开发'}，获团队季度技术分享与最佳实践收录`, rationale: '用具体事实佐证' },
    { text: (o) => `${o || '负责前端开发'}，方案复用至 2 个新项目`, rationale: '补充落地证据' },
  ],
  rewrite: [
    { text: () => '以产品视角驱动前端工程，关注体验、性能与协作效率', rationale: '整体重写，更有主见' },
    { text: () => '专注用数据驱动的前端工程，平衡交付速度与质量', rationale: '换一种更鲜明的表达' },
    { text: () => '擅长把模糊需求拆解为可落地的前端方案', rationale: '突出个人方法论' },
  ],
  tone: [
    { text: () => '热衷打磨细节，乐于在团队中推动更高的工程标准', rationale: '语气更积极、有温度' },
    { text: () => '沉稳务实，习惯用结果说话', rationale: '语气更稳重' },
    { text: () => '保持好奇，持续学习并带动团队成长', rationale: '语气更有亲和力' },
  ],
  shorten: [
    { text: (o) => stripHtml(o).slice(0, 22) || '产品导向的前端工程师', rationale: '更短、更聚焦' },
    { text: () => '产品导向的前端工程师', rationale: '压缩为一行' },
    { text: () => '专注体验与性能的前端', rationale: '精简到核心' },
  ],
};

/** Produce the proposed value + rationale for an element quick action on a field. */
export function generate(
  originalHtml: string,
  action: QuickActionId | 'free',
  freeText: string | undefined,
  seed: number
): { after: string; rationale: string } {
  const origText = stripHtml(originalHtml);

  if (action === 'free') {
    // Route the instruction to a concrete skill when we can recognize the intent.
    const routed = freeText ? routeFreeText(freeText) : null;
    if (routed) {
      const rv = VARIANTS[routed];
      return {
        after: wrapLike(originalHtml, rv[seed % rv.length].text(origText)),
        rationale: `按你的要求：${freeText}`,
      };
    }
    const pool = [
      `${origText}（已按你的要求调整：${freeText ?? ''}）`,
      `已按"${freeText ?? ''}"重写：主导核心模块，兼顾体验与性能`,
      `按你的指令优化：${origText.slice(0, 18)}…，并补充了落地结果`,
    ];
    const after = pool[seed % pool.length];
    return { after: wrapLike(originalHtml, after), rationale: `按你的要求：${freeText ?? '自定义改写'}` };
  }

  const variants = VARIANTS[action];
  const v = variants[seed % variants.length];
  return { after: wrapLike(originalHtml, v.text(origText)), rationale: v.rationale };
}

export function createPendingChange(
  target: EditableTarget,
  originalHtml: string,
  action: QuickActionId | 'free',
  freeText?: string
): PendingChange {
  const seed = 0;
  const { after, rationale } = generate(originalHtml, action, freeText, seed);
  return {
    id: nanoid(),
    target,
    before: originalHtml,
    after: finalizeAfter(target.kind, after),
    rationale,
    rationaleDetail: RATIONALE_DETAIL[action],
    action,
    freeText,
    seed,
    status: 'pending',
  };
}

export function regeneratePendingChange(change: PendingChange): PendingChange {
  const seed = change.seed + 1;
  // Selection-scoped changes re-run the substring transform; element changes re-run generate().
  if (change.selectionText != null) {
    const { after, rationale } = applySelection(
      change.before,
      change.selectionText,
      change.action as SelectionActionId | 'free',
      change.freeText,
      change.lang,
      seed
    );
    return { ...change, after: finalizeAfter(change.target.kind, after), rationale, seed, status: 'pending' };
  }
  const { after, rationale } = generate(
    change.before,
    change.action as QuickActionId | 'free',
    change.freeText,
    seed
  );
  return {
    ...change,
    after: finalizeAfter(change.target.kind, after),
    rationale,
    seed,
    status: 'pending',
  };
}

// ----------------------------------------------------------------------------
// P2 · selection-driven changes (rewrite just the selected substring)
// ----------------------------------------------------------------------------

const EN_POOL = [
  'Led the redesign of the core module, cutting first-paint time by 40% across 500k+ DAU.',
  'Built a reusable component library, reaching 70% reuse and ~3x faster iteration.',
  'Drove API aggregation and caching, lowering P95 latency from 800ms to 220ms.',
  'Owned the front-end architecture and end-to-end delivery of key features.',
  'Optimized long-list rendering with virtualization, reducing render cost by 60%.',
];

function translateMock(text: string, lang: string | undefined, seed: number): string {
  if (!lang || /eng|english/i.test(lang)) return EN_POOL[seed % EN_POOL.length];
  return `【${lang}】${text}`;
}

/** Rewrite a selected phrase. Returns the new substring (not the whole field). */
function transformSelection(
  text: string,
  action: SelectionActionId | 'free',
  freeText: string | undefined,
  lang: string | undefined,
  seed: number
): string {
  switch (action) {
    case 'shorten': {
      const firstClause = text.split(/[，。,.;；、]/)[0]?.trim();
      if (firstClause && firstClause.length >= 4 && firstClause.length < text.length) return firstClause;
      return text.slice(0, Math.max(4, Math.ceil(text.length * 0.6)));
    }
    case 'translate':
      return translateMock(text, lang, seed);
    case 'polish':
    case 'free':
    default: {
      const polished = text
        .replace(/负责/g, '主导')
        .replace(/参与/g, '深度参与')
        .replace(/帮助/g, '推动')
        .replace(/做了|完成了/g, '交付了')
        .replace(/提升/g, '显著提升');
      if (polished !== text) return polished;
      return action === 'free' && freeText ? `${text}（${freeText}）` : `${text}，并量化了成果`;
    }
  }
}

const SELECTION_RATIONALE: Record<SelectionActionId | 'free', string> = {
  polish: '让这段表达更有力',
  shorten: '去掉冗余，更紧凑',
  translate: '翻译选中的片段',
  free: '按你的要求改写',
};

/** Compute the full-field after-value + rationale for a selection-scoped edit. */
function applySelection(
  fullHtml: string,
  selectionText: string,
  action: SelectionActionId | 'free',
  freeText: string | undefined,
  lang: string | undefined,
  seed: number
): { after: string; rationale: string } {
  const replacement = transformSelection(selectionText, action, freeText, lang, seed);
  // Replace just the selected run when it sits in contiguous text; otherwise rewrite the field.
  const after = fullHtml.includes(selectionText)
    ? fullHtml.replace(selectionText, replacement)
    : wrapLike(fullHtml, replacement);
  const rationale = action === 'free' && freeText ? `按你的要求：${freeText}` : SELECTION_RATIONALE[action];
  return { after, rationale };
}

export function createSelectionChange(
  target: EditableTarget,
  fullHtml: string,
  selectionText: string,
  action: SelectionActionId | 'free',
  freeText?: string,
  lang?: string
): PendingChange {
  const seed = 0;
  const { after, rationale } = applySelection(fullHtml, selectionText, action, freeText, lang, seed);
  return {
    id: nanoid(),
    target,
    before: fullHtml,
    after: finalizeAfter(target.kind, after),
    rationale,
    rationaleDetail: RATIONALE_DETAIL[action],
    action,
    freeText,
    selectionText,
    lang,
    seed,
    status: 'pending',
  };
}

// ----------------------------------------------------------------------------
// Section-level actions (design §5B 段落标题/排序)
// ----------------------------------------------------------------------------

const NEW_ITEM_POOL = [
  '主导该方向的关键项目落地，按时交付并沉淀可复用方案',
  '推动流程改进，将关键环节效率提升约 30%',
  '负责跨团队协作，协调 3+ 角色达成一致并落地',
];

/** Propose a brand-new item for a section (rendered as a green-only insert card). */
export function createInsertChange(sectionKey: string, title: string, seed = 0): PendingChange {
  const after = `<ul><li>${NEW_ITEM_POOL[seed % NEW_ITEM_POOL.length]}</li></ul>`;
  return {
    id: nanoid(),
    target: {
      sectionKey,
      itemId: `new-${nanoid(6)}`,
      fieldKey: 'summary',
      kind: 'html',
      label: `${title} · 新增一条`,
    },
    before: '',
    after,
    rationale: '为这段补一条同风格的新要点',
    rationaleDetail: RATIONALE_DETAIL.insert,
    action: 'free',
    isInsert: true,
    seed,
    status: 'pending',
  };
}

// ----------------------------------------------------------------------------
// P4 · proactive coach — intelligence anchored to specific canvas items (§11 P4)
// ----------------------------------------------------------------------------

/** Rich-text fields the coach scans for weak (unquantified) bullets. */
const COACH_FIELD_KEYS = ['summary', 'description'];

/**
 * Scan the resume for the weakest bullets (here: those lacking any quantification)
 * and anchor a concrete suggestion onto each. This is the smallest slice of the
 * "上层智能" layer: it reuses the exact locate-and-propose mechanism, just driven
 * by a heuristic instead of a user gesture.
 */
export function createCoachChanges(sections: Section): PendingChange[] {
  const out: PendingChange[] = [];
  for (const sectionKey of Object.keys(sections)) {
    if (sectionKey === 'skills' || sectionKey === 'languages') continue; // not bullet-y
    const items = sections[sectionKey];
    if (!Array.isArray(items)) continue;
    let indexInSection = 0;
    for (const item of items) {
      if (out.length >= 4) return out;
      if (item.visible === false) continue;
      indexInSection += 1;
      const fieldKey = COACH_FIELD_KEYS.find(
        (k) => typeof item[k] === 'string' && (item[k] as string).trim().length > 0
      );
      if (!fieldKey) continue;
      const html = String(item[fieldKey]);
      const text = stripHtml(html);
      const quantified = /\d|%|％/.test(text);
      if (quantified) continue; // already strong — leave it alone
      const seed = out.length;
      const { after } = generate(html, 'quantify', undefined, seed);
      out.push({
        id: nanoid(),
        target: {
          sectionKey,
          itemId: String(item.id),
          fieldKey,
          kind: 'html',
          label: `${sectionTitle(sectionKey)} · 第 ${indexInSection} 条`,
        },
        before: html,
        after,
        rationale: '这条缺量化，补个指标更有说服力',
        rationaleDetail: RATIONALE_DETAIL.quantify,
        action: 'quantify',
        seed,
        status: 'pending',
      });
    }
  }
  return out;
}
