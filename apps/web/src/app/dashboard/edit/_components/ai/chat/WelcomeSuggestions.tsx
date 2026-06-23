'use client';

import React from 'react';
import { SKILL_LIST } from './registry';
import type { SkillId } from './types';

const EXAMPLE_PROMPTS = [
  '按这份 JD 优化我的简历',
  '给简历做一次竞争力体检',
  '把简历翻译成英文版',
  '模拟一场技术面试',
  '从零搭建一份新简历',
  '优化项目经历，突出量化成果',
  '分析简历有哪些硬伤',
  '翻译成日文版本',
  '模拟 HR 行为面试',
];

type WelcomeSuggestionsProps = {
  onPick: (id: SkillId) => void;
  onPrompt: (text: string) => void;
};

export default function WelcomeSuggestions({ onPick, onPrompt }: WelcomeSuggestionsProps) {
  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="mq-mask relative overflow-hidden mb-6">
        <div className="mq-track flex">
          {[...EXAMPLE_PROMPTS, ...EXAMPLE_PROMPTS].map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onPrompt(p)}
              className="shrink-0 mr-2 text-xs text-neutral-400 bg-neutral-900 hover:bg-neutral-800 hover:text-neutral-200 rounded-full px-3.5 py-2 transition-colors cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>
        <style jsx>{`
          .mq-track {
            width: max-content;
            animation: mqscroll 45s linear infinite;
          }
          .mq-mask:hover .mq-track {
            animation-play-state: paused;
          }
          .mq-mask {
            -webkit-mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
            mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
          }
          @keyframes mqscroll {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-50%);
            }
          }
        `}</style>
      </div>

      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <span className="text-xs text-neutral-500">推荐技能</span>
        <span className="text-[11px] text-neutral-600 inline-flex items-center gap-1.5">
          输入
          <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono text-[10px] leading-none">/</kbd>
          浏览全部
        </span>
      </div>

      <div className="relative">
        <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SKILL_LIST.map((skill) => {
            const Icon = skill.icon;
            return (
              <button
                key={skill.id}
                type="button"
                onClick={() => onPick(skill.id)}
                className="snap-start shrink-0 w-[150px] group flex flex-col items-center text-center px-2 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 transition-all active:scale-[0.97] cursor-pointer"
              >
                <Icon size={19} className={skill.accent} />
                <div className="text-[13px] font-medium text-white mt-2">{skill.name}</div>
                <div className="text-[11px] text-neutral-500 mt-0.5 leading-tight">{skill.tagline}</div>
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-12 bg-gradient-to-l from-[#0A0A0A] to-transparent" />
      </div>
    </div>
  );
}
