"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

/**
 * OAuth 回跳落点:Clerk 在此完成握手并跳转到 redirectUrlComplete(/dashboard)。
 * 组件本身不渲染 UI,这里给一个主题化的过场 spinner,避免「点了社交后白屏」。
 */
export default function SsoCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-desk">
      <Loader2 className="h-6 w-6 animate-spin text-ink-sky" />
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
      />
    </main>
  );
}
