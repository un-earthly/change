import { translateWithModel } from './local-llm';
import { detectScript } from './language-detect';

// Optional DeepL key — set to unlock 500K chars/month free tier
const DEEPL_API_KEY = '';

// ── Individual translation backends ──────────────────────────────────────────

async function translateWithDeepL(text: string, src: string, tgt: string): Promise<string | null> {
  if (!DEEPL_API_KEY) return null;
  try {
    const srcCode = src.toUpperCase();
    const tgtCode = tgt.toUpperCase() === 'EN' ? 'EN-US' : tgt.toUpperCase();
    const res = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: { Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: [text], source_lang: srcCode, target_lang: tgtCode }),
    });
    const json = await res.json();
    return json.translations?.[0]?.text || null;
  } catch {
    return null;
  }
}

async function translateWithMyMemory(text: string, src: string, tgt: string): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${src}|${tgt}`;
    const json = await (await fetch(url)).json();
    if (json.responseStatus === 200) {
      const primary = json.responseData?.translatedText;
      if (primary && primary !== text) return primary;
    }
    return null;
  } catch {
    return null;
  }
}

async function translateWithLibre(text: string, src: string, tgt: string): Promise<string | null> {
  try {
    const res = await fetch('https://translate.argosopentech.com/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: src, target: tgt, format: 'text' }),
    });
    const json = await res.json();
    return json.translatedText || null;
  } catch {
    return null;
  }
}

// Pivot through English for language pairs neither API handles well.
// e.g.  fr → en → bn  is far more reliable than  fr → bn  directly.
async function translateViaPivot(text: string, src: string, tgt: string): Promise<string | null> {
  try {
    const toEn =
      (await translateWithMyMemory(text, src, 'en')) ??
      (await translateWithLibre(text, src, 'en'));
    if (!toEn || toEn === text) return null;

    return (
      (await translateWithMyMemory(toEn, 'en', tgt)) ??
      (await translateWithLibre(toEn, 'en', tgt))
    );
  } catch {
    return null;
  }
}

// ── Auto-detect source language ───────────────────────────────────────────────

// Returns the best guessed language code for the text.
// Uses fast script analysis; the on-device model refines Latin-script detection
// when it is loaded (called separately from ConversationScreen if needed).
export function detectSourceLanguage(text: string, fallback: string): string {
  return detectScript(text) ?? fallback;
}

// ── Main translation entry point ──────────────────────────────────────────────

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string> {
  const src = sourceLang.split('-')[0];
  const tgt = targetLang.split('-')[0];
  if (!text.trim() || src === tgt) return text;

  // 1. On-device SLM — best quality, fully offline, no API cost
  const local = await translateWithModel(text, src, tgt);
  if (local && local !== text) return local;

  // 2. DeepL — highest quality API (requires free key)
  const deepl = await translateWithDeepL(text, src, tgt);
  if (deepl && deepl !== text) return deepl;

  // 3. Direct MyMemory / LibreTranslate
  const direct =
    (await translateWithMyMemory(text, src, tgt)) ??
    (await translateWithLibre(text, src, tgt));
  if (direct && direct !== text) return direct;

  // 4. English-pivot — works for almost any language pair via indirect route
  //    Only used when neither language is English, since direct would already work then.
  if (src !== 'en' && tgt !== 'en') {
    const pivot = await translateViaPivot(text, src, tgt);
    if (pivot && pivot !== text) return pivot;
  }

  return text;
}
