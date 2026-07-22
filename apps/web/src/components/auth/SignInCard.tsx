"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { AuthButton, AuthField, AuthTextLink, FieldError, OtpField } from "./AuthPrimitives";
import { SocialButtons, type OAuthProvider } from "./SocialButtons";
import { getClerkErrorMessage } from "./authErrors";
import { readLastMethod, writeLastMethod, type AuthMethod } from "./lastMethod";

const SSO_CALLBACK_URL = "/sso-callback";
const AFTER_AUTH_URL = "/dashboard";

type Step = "start" | "email" | "password" | "code" | "forgot" | "reset";

export default function SignInCard() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const reduce = useReducedMotion();

  const [step, setStep] = React.useState<Step>("start");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [pendingOAuth, setPendingOAuth] = React.useState<OAuthProvider | null>(null);
  const [lastMethod, setLastMethod] = React.useState<AuthMethod | null>(null);

  React.useEffect(() => setLastMethod(readLastMethod()), []);

  const goTo = (next: Step) => {
    setError(null);
    setStep(next);
  };

  const complete = async (createdSessionId: string | null) => {
    if (!createdSessionId) return;
    writeLastMethod("email");
    await setActive?.({ session: createdSessionId });
    router.push(AFTER_AUTH_URL);
  };

  const handleOAuth = async (provider: OAuthProvider) => {
    if (!isLoaded || !signIn) return;
    setError(null);
    setPendingOAuth(provider);
    writeLastMethod(provider);
    try {
      await signIn.authenticateWithRedirect({
        strategy: `oauth_${provider}`,
        redirectUrl: SSO_CALLBACK_URL,
        redirectUrlComplete: AFTER_AUTH_URL,
      });
    } catch (err) {
      setPendingOAuth(null);
      setError(getClerkErrorMessage(err, t));
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setBusy(true);
    setError(null);
    try {
      const res = await signIn.create({ identifier: email, password });
      if (res.status === "complete") await complete(res.createdSessionId);
      else setError(t("auth.errors.generic"));
    } catch (err) {
      setError(getClerkErrorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  const switchToCode = async () => {
    if (!isLoaded || !signIn) return;
    setBusy(true);
    setError(null);
    try {
      const res = await signIn.create({ identifier: email });
      const factor = res.supportedFirstFactors?.find((f) => f.strategy === "email_code");
      const emailAddressId = factor && "emailAddressId" in factor ? factor.emailAddressId : undefined;
      if (!emailAddressId) {
        setError(t("auth.errors.generic"));
        return;
      }
      await signIn.prepareFirstFactor({ strategy: "email_code", emailAddressId });
      setCode("");
      goTo("code");
    } catch (err) {
      setError(getClerkErrorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setBusy(true);
    setError(null);
    try {
      const res = await signIn.attemptFirstFactor({ strategy: "email_code", code });
      if (res.status === "complete") await complete(res.createdSessionId);
      else setError(t("auth.errors.generic"));
    } catch (err) {
      setError(getClerkErrorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  const sendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setBusy(true);
    setError(null);
    try {
      await signIn.create({ strategy: "reset_password_email_code", identifier: email });
      setCode("");
      setNewPassword("");
      goTo("reset");
    } catch (err) {
      setError(getClerkErrorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setBusy(true);
    setError(null);
    try {
      const res = await signIn.attemptFirstFactor({ strategy: "reset_password_email_code", code });
      if (res.status === "needs_new_password") {
        const done = await signIn.resetPassword({ password: newPassword });
        if (done.status === "complete") await complete(done.createdSessionId);
        else setError(t("auth.errors.generic"));
      } else if (res.status === "complete") {
        await complete(res.createdSessionId);
      } else {
        setError(t("auth.errors.generic"));
      }
    } catch (err) {
      setError(getClerkErrorMessage(err, t));
    } finally {
      setBusy(false);
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
      title={t("auth.signIn.title")}
      switchPrompt={t("auth.signIn.switchPrompt")}
      switchHref="/sign-up"
      switchLabel={t("auth.signIn.switchLink")}
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.trim()) goTo("password");
              }}
              className="flex flex-col gap-4"
            >
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
              <AuthButton type="submit" variant="primary" disabled={!email.trim()}>
                {t("auth.continue")}
              </AuthButton>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={submitPassword} className="flex flex-col gap-4">
              <BackRow label={email} onBack={() => goTo("email")} />
              <AuthField
                label={t("auth.fields.password")}
                type="password"
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                trailing={
                  <AuthTextLink type="button" onClick={() => goTo("forgot")}>
                    {t("auth.forgotPassword")}
                  </AuthTextLink>
                }
              />
              {error && <FieldError>{error}</FieldError>}
              <AuthButton type="submit" variant="primary" loading={busy} disabled={!password}>
                {t("auth.signIn.submit")}
              </AuthButton>
              <div className="text-center">
                <AuthTextLink onClick={switchToCode} disabled={busy}>
                  {t("auth.useCodeInstead")}
                </AuthTextLink>
              </div>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={submitCode} className="flex flex-col gap-4">
              <BackRow label={t("auth.back")} onBack={() => goTo("password")} />
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
                {t("auth.signIn.submit")}
              </AuthButton>
            </form>
          )}

          {step === "forgot" && (
            <form onSubmit={sendResetCode} className="flex flex-col gap-4">
              <BackRow label={t("auth.back")} onBack={() => goTo("password")} />
              <p className="text-[13.5px] text-[color:var(--text-secondary)]">
                {t("auth.forgot.hint")}
              </p>
              <AuthField
                label={t("auth.fields.email")}
                type="email"
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error && <FieldError>{error}</FieldError>}
              <AuthButton type="submit" variant="primary" loading={busy} disabled={!email.trim()}>
                {t("auth.forgot.send")}
              </AuthButton>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={submitReset} className="flex flex-col gap-4">
              <BackRow label={t("auth.back")} onBack={() => goTo("forgot")} />
              <p className="text-[13.5px] text-[color:var(--text-secondary)]">
                {t("auth.codeSentTo", { email })}
              </p>
              <OtpField
                autoFocus
                value={code}
                error={Boolean(error)}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
              <AuthField
                label={t("auth.fields.newPassword")}
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {error && <FieldError>{error}</FieldError>}
              <AuthButton
                type="submit"
                variant="primary"
                loading={busy}
                disabled={code.length < 6 || newPassword.length < 8}
              >
                {t("auth.forgot.reset")}
              </AuthButton>
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
