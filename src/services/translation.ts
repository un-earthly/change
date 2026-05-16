// Optional: set your DeepL free API key from deepl.com/pro-api (500K chars/month free)
const DEEPL_API_KEY = '';

async function translateWithDeepL(text: string, src: string, tgt: string): Promise<string | null> {
  if (!DEEPL_API_KEY) return null;
  try {
    const srcCode = src.split('-')[0].toUpperCase();
    const tgtCode = tgt.split('-')[0].toUpperCase() === 'EN' ? 'EN-US' : tgt.split('-')[0].toUpperCase();
    const res = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
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
      if (primary) return primary;
      const match = (json.matches as any[])?.find((m) => m.translation?.trim());
      if (match) return match.translation.trim();
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

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string> {
  const src = sourceLang.split('-')[0];
  const tgt = targetLang.split('-')[0];
  if (!text.trim() || src === tgt) return text;

  const result =
    (await translateWithDeepL(text, src, tgt)) ??
    (await translateWithMyMemory(text, src, tgt)) ??
    (await translateWithLibre(text, src, tgt));

  return result ?? text;
}
