/**
 * Local seed for the create-mode dynamic opening (design §7 / §8.1).
 *
 * The agent generates the first line instead of the shell hard-coding it. The seed
 * carries **no resume content** — reading the resume is gated behind the user's
 * approval (design §6.5; Magic-Core docs/agent-tool-approval-hitl.md). The agent
 * pulls the resume itself via the `read_resume` tool *if* it decides to, which
 * surfaces the approval prompt. So the opening is a warm from-scratch greeting, not
 * "I already read your resume…".
 *
 * TODO(§7): the user-facing fallback copy below should move into `locales/{en,zh}`
 * when the AI lab gets its full i18n pass; kept inline for now to match the rest of
 * this still-Chinese-literal component.
 */

function replyLanguage(language: string): string {
  if (language?.startsWith('zh')) return '中文';
  if (language?.startsWith('en')) return 'English';
  return language || '中文';
}

/**
 * Build the kickoff "user" turn that prompts the agent to open the conversation.
 * Not shown in the thread — it only seeds the first generated line.
 */
export function buildOpeningSeed(language: string): string {
  return [
    '[系统:引导创建开场]',
    '用户刚进入"引导创建",请你主动开场,不要等用户先说。',
    '一句话、动词开头、简短、别罗列清单、别复述本提示。',
    '若需要了解用户现有简历,可调用 read_resume(会先征求用户授权);不要假设你已看过简历。',
    `回复语言:${replyLanguage(language)}。`,
  ].join('\n');
}

/** Canned opening shown when generation times out / fails — guarantees a way in. */
export function fallbackOpening(language: string): string {
  if (language?.startsWith('en')) {
    return "Let's build your resume from scratch. First — what role and industry are you targeting?";
  }
  return '好,我们从零开始。先告诉我:你的目标岗位和所在行业是什么?';
}
