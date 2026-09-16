import { useCallback } from "react";
import { create } from "zustand";
import { en, type MessageKey } from "@/lib/locales/en";
import { zh } from "@/lib/locales/zh";

export type Locale = "en" | "zh";

const dictionaries: Record<Locale, Record<MessageKey, string>> = { en, zh };

const STORAGE_KEY = "curialy.locale";

function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const language = (navigator.language || "").toLowerCase();
  return language.startsWith("zh") ? "zh" : "en";
}

function readStored(): Locale | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "zh" || value === "en" ? value : null;
  } catch {
    return null;
  }
}

function readClientLocale(): Locale {
  if (typeof window === "undefined") return "en";
  return readStored() ?? detectLocale();
}

function applyLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.lang = locale === "zh" ? "zh-CN" : "en";
  root.dataset.locale = locale;
}

function persist(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
    document.cookie = `curialy_locale=${locale};path=/;max-age=31536000;samesite=lax`;
  } catch {
    /* private mode */
  }
}

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] === undefined ? `{${key}}` : String(vars[key]),
  );
}

type I18nState = {
  locale: Locale;
  ready: boolean;
  hydrate: () => void;
  setLocale: (locale: Locale) => void;
};

export const useI18n = create<I18nState>()((set, get) => ({
  locale: readClientLocale(),
  ready: typeof window !== "undefined",
  hydrate: () => {
    const locale = readStored() ?? detectLocale();
    applyLocale(locale);
    persist(locale);
    if (get().locale !== locale || !get().ready) set({ locale, ready: true });
  },
  setLocale: (locale) => {
    if (get().locale === locale) {
      applyLocale(locale);
      persist(locale);
      return;
    }
    persist(locale);
    applyLocale(locale);
    set({ locale, ready: true });
  },
}));

if (typeof window !== "undefined") {
  window.__CURIALY_SET_LOCALE = (locale: Locale) => {
    useI18n.getState().setLocale(locale);
  };
}

export function t(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
) {
  const table = dictionaries[locale] ?? dictionaries.en;
  return interpolate(table[key] ?? dictionaries.en[key], vars);
}

export function useT() {
  const locale = useI18n((s) => s.locale);
  return useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => t(locale, key, vars),
    [locale],
  );
}

export function planLabel(locale: Locale, planId: string) {
  const key = `plan.${planId}` as MessageKey;
  return dictionaries[locale][key] ?? dictionaries.en[key] ?? planId;
}

declare global {
  interface Window {
    __CURIALY_SET_LOCALE?: (locale: Locale) => void;
    __curialyApplyLocale?: (locale: Locale) => void;
    __CURIALY_I18N?: Record<string, Record<string, string>>;
  }
}
