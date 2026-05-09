export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  if (!text.trim() || sourceLang === targetLang) return text;
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.responseStatus === 200 && json.responseData?.translatedText) {
      return json.responseData.translatedText;
    }
    return text;
  } catch {
    return text;
  }
}
