"use client";

import * as React from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type AuthButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "neutral";
  loading?: boolean;
};

/**
 * 主按钮走 sky 填充(唯一强调),neutral 走面板表面 + hairline。两态都主题感知。
 * 见 brief §3 配色决策:强调稀有。
 */
export const AuthButton = React.forwardRef<HTMLButtonElement, AuthButtonProps>(
  ({ className, variant = "neutral", loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={loading || disabled}
      className={cn(
        "relative inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-[14px] font-medium",
        "transition-[transform,background-color,border-color,opacity] duration-150 active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink-sky/50 focus-visible:ring-offset-desk",
        "disabled:pointer-events-none disabled:opacity-60",
        variant === "primary"
          ? // 与产品既有主 CTA 一致:sky 填充 + 浅色文字(不用 on-fill-sky,那是深色)。
            "bg-fill-sky text-white hover:brightness-110"
          : "border border-hairline bg-raised text-[color:var(--text-primary)] hover:border-strong",
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
AuthButton.displayName = "AuthButton";

/** 社交按钮:中性表面 + 单色 provider 字形。`highlight` 用于「上次用这个」。 */
export function ProviderButton({
  icon,
  label,
  hint,
  highlight,
  loading,
  ...props
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  highlight?: boolean;
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <div className="flex flex-col gap-1">
      <AuthButton variant={highlight ? "primary" : "neutral"} loading={loading} {...props}>
        {!loading && (
          <span className="grid h-4 w-4 place-items-center [&>svg]:h-full [&>svg]:w-full">{icon}</span>
        )}
        {label}
      </AuthButton>
      {hint ? (
        <p className="text-center text-[12px] text-[color:var(--text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fields                                                              */
/* ------------------------------------------------------------------ */

type AuthFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  trailing?: React.ReactNode;
  error?: string;
};

/** 输入:凹槽表面 + hairline,聚焦时 sky 描边 + 极淡染环。密码型自带显隐切换。 */
export const AuthField = React.forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ label, trailing, error, className, type, id, ...props }, ref) => {
    const [reveal, setReveal] = React.useState(false);
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const isPassword = type === "password";
    const resolvedType = isPassword ? (reveal ? "text" : "password") : type;

    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor={inputId} className="text-[13px] font-medium text-[color:var(--text-secondary)]">
            {label}
          </label>
          {trailing}
        </div>
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={resolvedType}
            aria-invalid={Boolean(error)}
            className={cn(
              "h-11 w-full rounded-xl border bg-sunk px-3.5 text-[14px] text-[color:var(--text-primary)]",
              "placeholder:text-[color:var(--text-muted)] transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-sky/25",
              isPassword && "pr-11",
              error ? "border-[color:var(--rev-del)]" : "border-hairline focus-visible:border-ink-sky",
              className,
            )}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setReveal((v) => !v)}
              className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text-secondary)]"
              aria-label={reveal ? "Hide" : "Show"}
            >
              {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          ) : null}
        </div>
        {error ? <FieldError>{error}</FieldError> : null}
      </div>
    );
  },
);
AuthField.displayName = "AuthField";

/** 6 位验证码:单输入、宽字距、居中,克制不做分格盒子。 */
export const OtpField = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }
>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      className={cn(
        "h-14 w-full rounded-xl border bg-sunk text-center text-[22px] font-semibold tracking-[0.5em]",
        "text-[color:var(--text-primary)] transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-sky/25",
        error ? "border-[color:var(--rev-del)]" : "border-hairline focus-visible:border-ink-sky",
        className,
      )}
      {...props}
    />
  ),
);
OtpField.displayName = "OtpField";

/* ------------------------------------------------------------------ */
/* Text bits                                                           */
/* ------------------------------------------------------------------ */

export function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="text-[12.5px] text-[color:var(--rev-del)]">
      {children}
    </p>
  );
}

export function AuthTextLink({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "text-[13px] font-medium text-ink-sky transition-colors hover:text-ink-sky-hover",
        "focus-visible:outline-none focus-visible:underline underline-offset-2",
        className,
      )}
      {...props}
    />
  );
}
