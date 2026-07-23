"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Theme } from "@radix-ui/themes";

/**
 * 主题:深色为默认(产品身份),新增可切换浅色 + 跟随系统。
 * class 策略:在 <html> 上打 `.dark` / `.light`,驱动 Tailwind `dark:` 变体、
 * 语义 token(globals.css)与 Radix Themes 的 appearance。
 * 防 FOUC 的首帧 class 由 layout 里的内联脚本在水合前写好,本 Provider 只负责
 * 水合后的读取 / 切换 / 系统监听,并保持 <html> class 与 Radix appearance 同步。
 * 设计规范见 docs/specs/light-theme/design.md。
 */

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "mr-theme";
// New users default to following the OS appearance; an explicit choice (stored
// under THEME_STORAGE_KEY) always wins. The anti-FOUC init script + the effect
// below resolve "system" to the OS preference before first paint.
const DEFAULT_PREFERENCE: ThemePreference = "system";

interface ThemeContextValue {
  /** 用户的选择(可为 system) */
  theme: ThemePreference;
  /** 实际生效的主题(system 已解析) */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(pref: ThemePreference): ResolvedTheme {
  if (pref === "system") return systemPrefersDark() ? "dark" : "light";
  return pref;
}

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return DEFAULT_PREFERENCE;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return DEFAULT_PREFERENCE;
}

function applyThemeClass(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 首帧与内联脚本保持一致:默认深色,避免水合前后 class 抖动。
  const [theme, setThemeState] = useState<ThemePreference>(DEFAULT_PREFERENCE);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");

  // 水合后:读取用户偏好并落地(内联脚本已设首帧 class,这里只做对齐)。
  useEffect(() => {
    const pref = readStoredPreference();
    const resolved = resolve(pref);
    setThemeState(pref);
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
  }, []);

  // 选择「跟随系统」时,监听系统主题变化。
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const resolved: ResolvedTheme = mq.matches ? "dark" : "light";
      setResolvedTheme(resolved);
      applyThemeClass(resolved);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: ThemePreference) => {
    const resolved = resolve(next);
    setThemeState(next);
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage 不可用(隐私模式等)时静默降级为会话内生效。
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <Theme appearance={resolvedTheme}>{children}</Theme>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within <ThemeProvider>");
  }
  return ctx;
}

/**
 * 防 FOUC 内联脚本:在水合前、首帧绘制前,依据 localStorage / 系统偏好
 * 直接给 <html> 打上正确的主题 class。放进 layout 的 <head>。
 */
export const themeInitScript = `(function(){try{var k='${THEME_STORAGE_KEY}';var p=localStorage.getItem(k);if(p!=='light'&&p!=='dark'&&p!=='system'){p='${DEFAULT_PREFERENCE}';}var d=p==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;var e=document.documentElement;e.classList.remove('light','dark');e.classList.add(d);e.style.colorScheme=d;}catch(e){var el=document.documentElement;el.classList.add('${DEFAULT_PREFERENCE}');el.style.colorScheme='${DEFAULT_PREFERENCE}';}})();`;
