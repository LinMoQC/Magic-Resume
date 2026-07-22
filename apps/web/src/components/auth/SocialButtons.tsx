"use client";

import { useTranslation } from "react-i18next";
import { ProviderButton } from "./AuthPrimitives";
import { GithubIcon, GoogleIcon } from "./providerIcons";
import type { AuthMethod } from "./lastMethod";

export type OAuthProvider = "google" | "github";

/**
 * 社交优先入口:Google / GitHub。若 `lastMethod` 命中,把它提为主按钮并加提示。
 * OAuth 的实际调用交给父卡片(sign-in / sign-up 用不同 Clerk hook)。见 brief §6。
 */
export function SocialButtons({
  onSelect,
  pending,
  disabled,
  lastMethod,
}: {
  onSelect: (provider: OAuthProvider) => void;
  pending: OAuthProvider | null;
  disabled?: boolean;
  lastMethod?: AuthMethod | null;
}) {
  const { t } = useTranslation();

  const google = (
    <ProviderButton
      key="google"
      icon={<GoogleIcon />}
      label={t("auth.continueWith.google")}
      hint={lastMethod === "google" ? t("auth.lastUsed") : undefined}
      highlight={lastMethod === "google"}
      loading={pending === "google"}
      disabled={disabled || (pending !== null && pending !== "google")}
      onClick={() => onSelect("google")}
    />
  );

  const github = (
    <ProviderButton
      key="github"
      icon={<GithubIcon />}
      label={t("auth.continueWith.github")}
      hint={lastMethod === "github" ? t("auth.lastUsed") : undefined}
      highlight={lastMethod === "github"}
      loading={pending === "github"}
      disabled={disabled || (pending !== null && pending !== "github")}
      onClick={() => onSelect("github")}
    />
  );

  // 上次用 GitHub 就把它排到前面(主按钮),否则默认 Google 优先。
  return (
    <div className="flex flex-col gap-2.5">
      {lastMethod === "github" ? [github, google] : [google, github]}
    </div>
  );
}
