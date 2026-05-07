import { getLanguageByCode } from '../constants/languages';

// Mock translation service — replace with real API (Google Cloud Translation, DeepL, etc.)
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  // In production, call your translation API here:
  // const response = await fetch('https://translation-api.example.com/translate', {...})
  // return response.data.translatedText

  const targetName = getLanguageByCode(targetLang)?.name || targetLang;
  return `[${targetName}] ${text}`;
}
