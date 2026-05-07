export const VOICE_TEST_PHRASES: Record<string, string> = {
  en: 'Language is unbounded',
  bn: 'ভাষা হোক সর্বদা উন্মুক্ত',
  ar: 'اللغة بلا حدود',
  id: 'Bahasa itu tak terbatas',
  zh: '语言是无边界的',
  ko: '언어에는 경계가 없다',
  ja: '言語に境界はない',
  sq: 'Gjuha është e pakufizuar',
  am: 'ቋንቋ ወሰን የለውም',
  hy: 'Լեզուն անսահման է',
  az: 'Dil hədsizdir',
  be: 'Мова не мае мяжы',
  bg: 'Езикът е безграничен',
};

export function getTestPhrase(languageCode: string): string {
  return VOICE_TEST_PHRASES[languageCode] || VOICE_TEST_PHRASES['en'];
}
