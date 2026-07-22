import { MaskIcon } from "@/components/icons/MaskIcon";

/**
 * 单色 provider 字形(currentColor),配中性按钮。见 brief §3:不各染品牌色。
 * 字形本体在 public/providers/*-mono.svg(规约:组件内不写 <svg>),经 CSS mask
 * 上色,颜色仍由调用方的 text-* 决定。
 */
export function GoogleIcon({ className }: { className?: string }) {
  return <MaskIcon src="/providers/google-mono.svg" className={className ?? "h-full w-full"} />;
}

export function GithubIcon({ className }: { className?: string }) {
  return <MaskIcon src="/providers/github-mono.svg" className={className ?? "h-full w-full"} />;
}
