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
  const value = localStorage.getItem(STORAGE_KEY);
  return value === "zh" || value === "en" ? value : null;
}

function applyLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  document.documentElement.dataset.locale = locale;
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

export const useI18n = create<I18nState>()((set) => ({
  locale: "en",
  ready: false,
  hydrate: () => {
    const locale = readStored() ?? detectLocale();
    applyLocale(locale);
    set({ locale, ready: true });
  },
  setLocale: (locale) => {
    localStorage.setItem(STORAGE_KEY, locale);
    applyLocale(locale);
    set({ locale });
  },
}));

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
  return (key: MessageKey, vars?: Record<string, string | number>) => t(locale, key, vars);
}

export function planLabel(locale: Locale, planId: string) {
  const key = `plan.${planId}` as MessageKey;
  return dictionaries[locale][key] ?? dictionaries.en[key] ?? planId;
}
