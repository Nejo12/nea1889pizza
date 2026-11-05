import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Locale } from "date-fns";
import { de, enGB, es, fr, it, pt } from "date-fns/locale";
import { DICT, type Key } from "./i18n-dict";

export const LANGS = ["de", "en", "it", "fr", "es", "pt"] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_NAMES: Record<Lang, string> = {
  de: "Deutsch", en: "English", it: "Italiano", fr: "Français", es: "Español", pt: "Português",
};
export const DATE_LOCALES: Record<Lang, Locale> = { de, en: enGB, it, fr, es, pt };
const STORAGE_KEY = "nea-lang";

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (LANGS as readonly string[]).includes(v);
}

/** Pure lookup with {var} interpolation; falls back to German. */
export function translate(lang: Lang, key: Key, vars?: Record<string, string | number>) {
  let s = DICT[lang][key] ?? DICT.de[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: Key, vars?: Record<string, string | number>) => string };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("de");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback((key: Key, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}