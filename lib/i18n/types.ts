export const languages = [
  { code: "en", label: "English", nativeLabel: "English", dir: "ltr" },
  { code: "ti", label: "Tigrinya", nativeLabel: "ትግርኛ", dir: "ltr" },
  { code: "am", label: "Amharic", nativeLabel: "አማርኛ", dir: "ltr" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", dir: "rtl" },
  { code: "fr", label: "French", nativeLabel: "Français", dir: "ltr" },
  { code: "so", label: "Somali", nativeLabel: "Soomaali", dir: "ltr" }
] as const;

export type LanguageCode = (typeof languages)[number]["code"];
export type Dictionary = Record<string, string>;

export const defaultLanguage: LanguageCode = "en";
