export interface SpellMatch {
  offset: number;
  length: number;
  word: string;
  replacements: string[];
}

// Full locale codes used as preferredVariants when language is 'auto'
const LANG_MAP: Record<string, string> = {
  en: 'en-US',
  pt: 'pt-BR',
  zh: 'zh-CN',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  it: 'it-IT',
  nl: 'nl-NL',
  ru: 'ru-RU',
  pl: 'pl-PL',
  sv: 'sv',
  da: 'da-DK',
  uk: 'uk-UA',
  ca: 'ca-ES',
  ro: 'ro-RO',
};

const ALLOWED_ISSUE_TYPES = new Set(['misspelling', 'typographical', 'grammar']);
const LT_TIMEOUT_MS = 8000;

export async function checkSpelling(text: string, lang: string): Promise<SpellMatch[]> {
  if (!text.trim()) return [];
  // Require at least 2 words — single words give unreliable auto-detection
  if (text.trim().split(/\s+/).length < 2) return [];

  const preferredVariant = LANG_MAP[lang] ?? lang;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LT_TIMEOUT_MS);

  try {
    const res = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      // Use auto-detection so typing in any language is handled correctly.
      // preferredVariants hints toward the user's configured language when ambiguous.
      body: new URLSearchParams({
        text,
        language: 'auto',
        preferredVariants: preferredVariant,
      }).toString(),
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.matches ?? [])
      .filter((m: any) => ALLOWED_ISSUE_TYPES.has(m.rule?.issueType) && m.replacements?.length > 0)
      .map((m: any) => ({
        offset: m.offset,
        length: m.length,
        word: text.substring(m.offset, m.offset + m.length),
        replacements: m.replacements.slice(0, 3).map((r: any) => r.value),
      }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export function applyCorrection(text: string, match: SpellMatch, replacement: string): string {
  return text.substring(0, match.offset) + replacement + text.substring(match.offset + match.length);
}
