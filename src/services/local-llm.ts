import { initLlama, type LlamaContext } from 'llama.rn';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// Qwen2.5-0.5B: ~390 MB, strong multilingual translation, fast on mobile
const MODEL_FILENAME = 'qwen2.5-0.5b-instruct-q4_k_m.gguf';
const MODEL_URL =
  'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf';

export const MODEL_PATH = `${FileSystem.documentDirectory}${MODEL_FILENAME}`;
export const MODEL_SIZE_MB = 390;

let ctx: LlamaContext | null = null;
let loadPromise: Promise<void> | null = null;

// ── Download ──────────────────────────────────────────────────────────────────

export async function isModelDownloaded(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(MODEL_PATH);
  return info.exists && (info as any).size > 1_000_000;
}

export async function downloadModel(
  onProgress: (ratio: number) => void,
): Promise<void> {
  const dl = FileSystem.createDownloadResumable(
    MODEL_URL,
    MODEL_PATH,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      if (totalBytesExpectedToWrite > 0) {
        onProgress(totalBytesWritten / totalBytesExpectedToWrite);
      }
    },
  );
  await dl.downloadAsync();
}

export async function deleteModel(): Promise<void> {
  if (await isModelDownloaded()) {
    await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
  }
  ctx = null;
  loadPromise = null;
}

// ── Load ──────────────────────────────────────────────────────────────────────

export function isModelLoaded(): boolean {
  return ctx !== null;
}

export async function loadModel(): Promise<void> {
  if (ctx) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const downloaded = await isModelDownloaded();
    if (!downloaded) return;

    // Android paths must not have the file:// prefix
    const modelPath =
      Platform.OS === 'android'
        ? MODEL_PATH.replace('file://', '')
        : MODEL_PATH;

    ctx = await initLlama({
      model: modelPath,
      n_ctx: 512,   // small context — translation inputs are short
      n_threads: 4,
      n_gpu_layers: 0, // CPU-only for widest device compatibility
    });
  })();

  return loadPromise;
}

// ── Inference ─────────────────────────────────────────────────────────────────

const LANG_NAMES: Record<string, string> = {
  en: 'English', fr: 'French', es: 'Spanish', de: 'German', it: 'Italian',
  pt: 'Portuguese', nl: 'Dutch', pl: 'Polish', ru: 'Russian', uk: 'Ukrainian',
  ar: 'Arabic', he: 'Hebrew', fa: 'Persian', ur: 'Urdu',
  hi: 'Hindi', bn: 'Bengali', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam',
  si: 'Sinhala', my: 'Burmese', th: 'Thai', vi: 'Vietnamese', id: 'Indonesian',
  tr: 'Turkish', ko: 'Korean', ja: 'Japanese', zh: 'Chinese',
  el: 'Greek', km: 'Khmer',
};

function langName(code: string): string {
  return LANG_NAMES[code.split('-')[0]] ?? code;
}

export async function translateWithModel(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string | null> {
  if (!ctx) return null;
  const src = langName(sourceLang);
  const tgt = langName(targetLang);

  try {
    const { text: output } = await ctx.completion({
      messages: [
        {
          role: 'system',
          content:
            'You are a professional translator. Output only the translated text — no quotes, no explanations, no extra lines.',
        },
        {
          role: 'user',
          content: `Translate this ${src} text into ${tgt}:\n${text}`,
        },
      ],
      n_predict: 256,
      temperature: 0.1,
      top_p: 0.9,
      stop: ['\n\n', '<|im_end|>', '<|endoftext|>'],
    });

    const cleaned = output
      .trim()
      .replace(/^["""'']+|["""'']+$/g, '')
      .trim();
    return cleaned || null;
  } catch {
    return null;
  }
}

export async function detectLangWithModel(text: string): Promise<string | null> {
  if (!ctx) return null;
  try {
    const { text: output } = await ctx.completion({
      messages: [
        {
          role: 'system',
          content:
            'Detect the language of the text. Respond with only the ISO 639-1 two-letter code (e.g. en, fr, bn, zh). Nothing else.',
        },
        { role: 'user', content: text },
      ],
      n_predict: 6,
      temperature: 0.0,
    });
    const code = output.trim().toLowerCase().replace(/[^a-z-]/g, '');
    return /^[a-z]{2}(-[a-z]{2})?$/.test(code) ? code : null;
  } catch {
    return null;
  }
}
