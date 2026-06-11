"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { defaultLanguage, languages, type LanguageCode } from "@/lib/i18n/types";

type TranslateOptions = Record<string, string | number>;

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, options?: TranslateOptions) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function formatValue(value: string, options?: TranslateOptions) {
  if (!options) {
    return value;
  }

  return Object.entries(options).reduce(
    (text, [key, replacement]) => text.replaceAll(`{${key}}`, String(replacement)),
    value
  );
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(defaultLanguage);

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("exodus-language") as LanguageCode | null;
    if (savedLanguage && savedLanguage in dictionaries) {
      setLanguageState(savedLanguage);
    }
  }, []);

  useEffect(() => {
    const config = languages.find((item) => item.code === language);
    document.documentElement.lang = language;
    document.documentElement.dir = config?.dir ?? "ltr";
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    return {
      language,
      setLanguage(nextLanguage) {
        setLanguageState(nextLanguage);
        window.localStorage.setItem("exodus-language", nextLanguage);
      },
      t(key, options) {
        return formatValue(dictionaries[language][key] ?? dictionaries.en[key] ?? key, options);
      }
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useT() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useT must be used inside LanguageProvider");
  }
  return context;
}

