// Maps tone number suffix to tone mark for each vowel
const TONE_MAP: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à', 'a'],
  e: ['ē', 'é', 'ě', 'è', 'e'],
  i: ['ī', 'í', 'ǐ', 'ì', 'i'],
  o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
  u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
  v: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
};

/**
 * Converts numeric pinyin (ni3 hao3) to tone-marked pinyin (nǐ hǎo).
 * Passthrough if already contains tone marks.
 */
export function toToneMarks(pinyin: string): string {
  return pinyin
    .split(' ')
    .map(syllable => convertSyllable(syllable))
    .join(' ');
}

function convertSyllable(s: string): string {
  const match = s.match(/^([a-züv]*)([1-5])$/i);
  if (!match) return s;
  const [, base, toneStr] = match;
  const tone = parseInt(toneStr, 10) - 1;
  const vowelOrder = ['a', 'e', 'ou', 'u', 'i', 'ü', 'v'];
  for (const vowel of vowelOrder) {
    if (base.includes(vowel) && TONE_MAP[vowel]) {
      return base.replace(vowel, TONE_MAP[vowel][tone]);
    }
  }
  return s;
}
