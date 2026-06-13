export const languages = [
  { code: "en", label: "English", nativeLabel: "English", dir: "ltr" },
  { code: "ti", label: "Tigrinya", nativeLabel: "Tigrinya", dir: "ltr" },
  { code: "am", label: "Amharic", nativeLabel: "Amharic", dir: "ltr" },
  { code: "ar", label: "Arabic", nativeLabel: "Arabic", dir: "rtl" },
  { code: "fr", label: "French", nativeLabel: "Francais", dir: "ltr" },
  { code: "so", label: "Somali", nativeLabel: "Soomaali", dir: "ltr" }
] as const;

export type LanguageCode = (typeof languages)[number]["code"];
export type Dictionary = Record<string, string>;

export const defaultLanguage: LanguageCode = "en";
