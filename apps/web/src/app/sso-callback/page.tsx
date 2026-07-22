"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { isCloudMode } from "@/lib/config/app";

/**
 * OAuth 回跳落点:Clerk 在此完成握手并跳转到 redirectUrlComplete(/dashboard)。
 * 组件本身不渲染 UI,这里给一个主题化的过场 spinner,避免「点了社交后白屏」。
 *
 * self-hosted 模式没有 <ClerkProvider>,而本页是静态预渲染的——若无条件挂载
 * Clerk 组件,`next build` 预渲染 /sso-callback 会抛「can only be used within
 * <ClerkProvider>」直接构建失败。self-hosted 本就没有 OAuth 回跳,直接不挂载。
 */
export default function SsoCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-desk">
      <Loader2 className="h-6 w-6 animate-spin text-ink-sky" />
      {isCloudMode ? (
        <AuthenticateWithRedirectCallback
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
        />
      ) : null}
    </main>
  );
}
