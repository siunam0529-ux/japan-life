"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { Language, translations } from "@/lib/i18n/translations";

const STORAGE_KEY = "japan-life:language";
const LANGUAGE_EVENT = "japan-life:language-change";

function readLanguage(): Language {
  if (typeof window === "undefined") return "zh-CN";

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "ja" || saved === "zh-TW" || saved === "zh-CN") return saved;
  if (saved === "zh") return "zh-CN";
  return "zh-CN";
}

export function useLanguage() {
  const language = useSyncExternalStore<Language>(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener(LANGUAGE_EVENT, onStoreChange);
  
      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(LANGUAGE_EVENT, onStoreChange);
      };
    },
    readLanguage,
    () => "zh-CN",
  );

  const setLanguage = useCallback((nextLanguage: Language) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    window.dispatchEvent(new Event(LANGUAGE_EVENT));
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "zh-CN" ? "zh-TW" : language === "zh-TW" ? "ja" : "zh-CN");
  }, [language, setLanguage]);

  const t = useMemo(() => translations[language], [language]);

  return {
    language,
    setLanguage,
    t,
    toggleLanguage,
  };
}
