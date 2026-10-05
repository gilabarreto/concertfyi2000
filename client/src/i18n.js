import { useSyncExternalStore } from "react";

// The English text is the key: t("Upcoming Concerts") looks itself up in the visitor's
// dictionary and falls back to itself, so a string nobody translated yet still reads fine
// and English needs no dictionary at all. i18n.test.mjs fails when a literal translation key has no
// entry in pt/es/fr. API content (bios, setlists, reviews) stays as the source wrote it.
export const LANGUAGES = ["en", "pt", "es", "fr"];

// Loaded on demand: the entry bundle sits close to its 270 kB ceiling, and a visitor only
// ever needs one dictionary.
const loaders = {
  pt: () => import("./locales/pt.json"),
  es: () => import("./locales/es.json"),
  fr: () => import("./locales/fr.json"),
};

const browserLanguage = () =>
  (navigator.languages || [navigator.language])
    .map((tag) => String(tag).slice(0, 2).toLowerCase())
    .find((code) => LANGUAGES.includes(code));

let lang = "en";
let dictionary = {};
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());

export async function setLanguage(next, { save = true } = {}) {
  if (!LANGUAGES.includes(next)) return;
  if (save) localStorage.setItem("lang", next);
  const loaded = next === "en" ? {} : (await loaders[next]()).default;
  lang = next;
  dictionary = loaded;
  document.documentElement.lang = next;
  notify();
}

// No saved pick: the browser's first supported language, else English.
if (typeof window !== "undefined") {
  const initial = localStorage.getItem("lang") || browserLanguage() || "en";
  if (initial !== "en") setLanguage(initial, { save: false });
}

export const getLanguage = () => lang;

export function translate(text, vars) {
  const template = dictionary[text] || text;
  return vars ? template.replace(/\{(\w+)\}/g, (match, name) => vars[name] ?? match) : template;
}

// Re-renders the calling component when the language (or its dictionary) changes.
export function useT() {
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => dictionary,
  );
  return translate;
}
