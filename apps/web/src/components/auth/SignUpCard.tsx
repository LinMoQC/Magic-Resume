"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { AuthButton, AuthField, FieldError, OtpField } from "./AuthPrimitives";
import { SocialButtons, type OAuthProvider } from "./SocialButtons";
import { getClerkErrorMessage } from "./authErrors";
import { readLastMethod, writeLastMethod, type AuthMethod } from "./lastMethod";

const SSO_CALLBACK_URL = "/sso-callback";
const AFTER_AUTH_URL = "/dashboard";

type Step = "start" | "email" | "verify";

export default function SignUpCard() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const reduce = useReducedMotion();

  const [step, setStep] = React.useState<Step>("start");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [pendingOAuth, setPendingOAuth] = React.useState<OAuthProvider | null>(null);
  const [lastMethod, setLastMethod] = React.useState<AuthMethod | null>(null);

  React.useEffect(() => setLastMethod(readLastMethod()), []);

  const goTo = (next: Step) => {
    setError(null);
    setStep(next);
  };

  const handleOAuth = async (provider: OAuthProvider) => {
    if (!isLoaded || !signUp) return;
    setError(null);
    setPendingOAuth(provider);
    writeLastMethod(provider);
    try {
      await signUp.authenticateWithRedirect({
        strategy: `oauth_${provider}`,
        redirectUrl: SSO_CALLBACK_URL,
        redirectUrlComplete: AFTER_AUTH_URL,
      });
    } catch (err) {
      setPendingOAuth(null);
      setError(getClerkErrorMessage(err, t));
    }
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setBusy(true);
    setError(null);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setCode("");
      goTo("verify");
    } catch (err) {
      setError(getClerkErrorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  const submitVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setBusy(true);
    setError(null);
    try {
      const res = await signUp.attemptEmailAddressVerification({ code });
      if (res.status === "complete") {
        writeLastMethod("email");
        await setActive?.({ session: res.createdSessionId });
        router.push(AFTER_AUTH_URL);
      } else {
        setError(t("auth.errors.generic"));
      }
    } catch (err) {
      setError(getClerkErrorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    if (!isLoaded || !signUp) return;
    setError(null);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    } catch (err) {
      setError(getClerkErrorMessage(err, t));
    }
  };

  // 原地 opacity 交叉淡入:步骤绝对定位重叠,不重排、不留空档 → 不抖。
  const stepAnim = {
    initial: { opacity: reduce ? 1 : 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: reduce ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <AuthShell
      title={t("auth.signUp.title")}
      switchPrompt={t("auth.signUp.switchPrompt")}
      switchHref="/sign-in"
      switchLabel={t("auth.signUp.switchLink")}
    >
      <AnimatePresence initial={false}>
        <motion.div key={step} {...stepAnim} className="absolute inset-x-0 top-0 flex flex-col gap-4">
          {step === "start" && (
            <div className="flex flex-col gap-2.5">
              <SocialButtons
                onSelect={handleOAuth}
                pending={pendingOAuth}
                disabled={!isLoaded}
                lastMethod={lastMethod}
              />
              <AuthButton onClick={() => goTo("email")} disabled={!isLoaded}>
                {t("auth.continueWith.email")}
              </AuthButton>
              {error && <FieldError>{error}</FieldError>}
            </div>
          )}

          {step === "email" && (
            <form onSubmit={submitCreate} className="flex flex-col gap-4">
              <BackRow label={t("auth.back")} onBack={() => goTo("start")} />
              <AuthField
                label={t("auth.fields.email")}
                type="email"
                autoFocus
                autoComplete="email"
                placeholder={t("auth.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <AuthField
                label={t("auth.fields.password")}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="-mt-1 text-[12px] text-[color:var(--text-muted)]">
                {t("auth.passwordHint")}
              </p>
              {/* Clerk 智能验证码挂载点(若实例开启 bot 防护) */}
              <div id="clerk-captcha" />
              {error && <FieldError>{error}</FieldError>}
              <AuthButton
                type="submit"
                variant="primary"
                loading={busy}
                disabled={!email.trim() || password.length < 8}
              >
                {t("auth.signUp.submit")}
              </AuthButton>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={submitVerify} className="flex flex-col gap-4">
              <BackRow label={t("auth.back")} onBack={() => goTo("email")} />
              <p className="text-[13.5px] text-[color:var(--text-secondary)]">
                {t("auth.codeSentTo", { email })}
              </p>
              <OtpField
                autoFocus
                value={code}
                error={Boolean(error)}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
              {error && <FieldError>{error}</FieldError>}
              <AuthButton type="submit" variant="primary" loading={busy} disabled={code.length < 6}>
                {t("auth.signUp.verify")}
              </AuthButton>
              <div className="text-center">
                <button
                  type="button"
                  onClick={resendCode}
                  className="text-[13px] font-medium text-ink-sky transition-colors hover:text-ink-sky-hover"
                >
                  {t("auth.resend")}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </AnimatePresence>
    </AuthShell>
  );
}

function BackRow({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-1.5 self-start text-[13px] text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text-secondary)]"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      <span className="max-w-[240px] truncate">{label}</span>
    </button>
  );
}
