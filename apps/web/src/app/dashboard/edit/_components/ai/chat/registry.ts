import { Wand2, BarChart3, BotMessageSquare, Mic, Languages } from 'lucide-react';
import type { AiSkill, SkillId } from './types';

/**
 * The AI skill registry. Mock data flows through `buildIntent` / `doneSummary`
 * today; the real wiring swaps the shell's mock runner for the existing hooks
 * (useResumeOptimizer, useMultiPersonaAnalyzer, translateApi, …) without
 * touching this metadata.
 */
export const SKILLS: Record<SkillId, AiSkill> = {
  create: {
    id: 'create',
    name: '引导创建',
    tagline: '对话式从零搭建',
    icon: BotMessageSquare,
    accent: 'text-sky-400',
    accentHex: '#38bdf8',
    surface: 'inline',
    isChat: true,
    params: [],
    buildIntent: () => '引导创建',
    doneSummary: '',
  },
  optimize: {
    id: 'optimize',
    name: '智能优化',
    tagline: '按 JD 定向改写',
    icon: Wand2,
    accent: 'text-violet-400',
    accentHex: '#a78bfa',
    surface: 'inline',
    params: [
      {
        id: 'jd',
        label: '目标 JD',
        kind: 'textarea',
        placeholder: '粘贴目标职位描述，AI 将据此定向优化…',
        defaultValue:
          '负责 C 端产品的需求分析、版本规划与数据驱动迭代，统筹跨团队协作落地。',
      },
      { id: 'company', label: '公司', kind: 'text', placeholder: '例如 字节跳动', defaultValue: '字节跳动' },
      { id: 'title', label: '岗位', kind: 'text', placeholder: '例如 高级产品经理', defaultValue: '高级产品经理' },
    ],
    cta: '开始优化',
    canvas: { views: ['preview', 'diff', 'json'], defaultView: 'preview' },
    buildIntent: (p) => `智能优化 · ${p.company || '—'} · ${p.title || '—'}`,
    doneSummary: '已改写 4 个模块',
  },
  analyze: {
    id: 'analyze',
    name: '简历分析',
    tagline: '多角色体检评分',
    icon: BarChart3,
    accent: 'text-emerald-400',
    accentHex: '#34d399',
    surface: 'inline',
    params: [],
    canvas: { views: ['score', 'json'], defaultView: 'score' },
    buildIntent: () => '分析这份简历的竞争力',
    doneSummary: '多角色体检完成',
  },
  translate: {
    id: 'translate',
    name: '一键翻译',
    tagline: '生成多语言版本',
    icon: Languages,
    accent: 'text-amber-400',
    accentHex: '#fbbf24',
    surface: 'inline',
    params: [
      {
        id: 'lang',
        label: '目标语言',
        kind: 'select',
        options: [
          { value: 'English', label: 'English' },
          { value: '日本語', label: '日本語' },
          { value: '한국어', label: '한국어' },
          { value: 'Français', label: 'Français' },
        ],
        defaultValue: 'English',
      },
    ],
    cta: '开始翻译',
    canvas: { views: ['preview', 'json'], defaultView: 'preview' },
    buildIntent: (p) => `翻译成 ${p.lang || 'English'}`,
    doneSummary: '已生成翻译版',
  },
  interview: {
    id: 'interview',
    name: '模拟面试',
    tagline: '语音实战演练',
    icon: Mic,
    accent: 'text-rose-400',
    accentHex: '#fb7185',
    surface: 'immersive',
    params: [],
    buildIntent: () => '模拟面试',
    doneSummary: '',
  },
};

export const SKILL_LIST: AiSkill[] = Object.values(SKILLS);
