"use client";

/**
 * 记住上次成功登录的方式,下次把它提为主按钮(呼应参考图的 "you used X last time")。
 * 纯增强,localStorage 不可用时静默降级。见 brief §6 / §9.2。
 */
export type AuthMethod = "google" | "github" | "email";

const KEY = "mr-last-auth-method";

export const readLastMethod = (): AuthMethod | null => {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "google" || v === "github" || v === "email" ? v : null;
  } catch {
    return null;
  }
};

export const writeLastMethod = (method: AuthMethod): void => {
  try {
    window.localStorage.setItem(KEY, method);
  } catch {
    // ignore
  }
};
