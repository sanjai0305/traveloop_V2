import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";

// Statically load English as the fallback
const resources = {
  en: { translation: en }
};

// Supported language codes
const SUPPORTED_LANGS = [
  "en", "es", "zh-CN", "zh-TW", "fil", "vi", "ar", "fr", "ko", "ru",
  "pt", "de", "hi", "ur", "ja", "fa", "pl", "it", "el", "he", "th", "tr"
];

// Helper to load language bundle dynamically via Vite chunk-splitting
export const loadLanguageBundle = async (lng) => {
  if (lng === "en" || i18n.hasResourceBundle(lng, "translation")) {
    return;
  }
  try {
    let module;
    // Vite requires semi-static path mapping to build chunks correctly
    if (lng === "es") module = await import("./locales/es.json");
    else if (lng === "zh-CN") module = await import("./locales/zh-CN.json");
    else if (lng === "zh-TW") module = await import("./locales/zh-TW.json");
    else if (lng === "fil") module = await import("./locales/fil.json");
    else if (lng === "vi") module = await import("./locales/vi.json");
    else if (lng === "ar") module = await import("./locales/ar.json");
    else if (lng === "fr") module = await import("./locales/fr.json");
    else if (lng === "ko") module = await import("./locales/ko.json");
    else if (lng === "ru") module = await import("./locales/ru.json");
    else if (lng === "pt") module = await import("./locales/pt.json");
    else if (lng === "de") module = await import("./locales/de.json");
    else if (lng === "hi") module = await import("./locales/hi.json");
    else if (lng === "ur") module = await import("./locales/ur.json");
    else if (lng === "ja") module = await import("./locales/ja.json");
    else if (lng === "fa") module = await import("./locales/fa.json");
    else if (lng === "pl") module = await import("./locales/pl.json");
    else if (lng === "it") module = await import("./locales/it.json");
    else if (lng === "el") module = await import("./locales/el.json");
    else if (lng === "he") module = await import("./locales/he.json");
    else if (lng === "th") module = await import("./locales/th.json");
    else if (lng === "tr") module = await import("./locales/tr.json");
    else {
      // Try dynamic import (fallback)
      module = await import(`./locales/${lng}.json`);
    }

    if (module && module.default) {
      i18n.addResourceBundle(lng, "translation", module.default, true, true);
    }
  } catch (error) {
    console.error(`Failed to load translation bundle for language: ${lng}`, error);
  }
};

// Auto-detect browser language on first visit
const getBrowserLanguage = () => {
  const code = (navigator.language || navigator.userLanguage || "en").substring(0, 2);
  
  // Custom check for Chinese variants
  if (code === "zh") {
    const fullCode = (navigator.language || navigator.userLanguage).toLowerCase();
    if (fullCode.includes("tw") || fullCode.includes("hk") || fullCode.includes("hant")) {
      return "zh-TW";
    }
    return "zh-CN";
  }

  // Tagalog check
  if (code === "tl") return "fil";
  
  // Hebrew check
  if (code === "iw") return "he";

  return SUPPORTED_LANGS.includes(code) ? code : "en";
};

const savedLang = localStorage.getItem("i18nextLng") || getBrowserLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

// Initialize active language bundle asynchronously if it's not English
if (savedLang !== "en") {
  loadLanguageBundle(savedLang).then(() => {
    i18n.changeLanguage(savedLang);
  });
}

export default i18n;
