import { VocabCard } from '../types/vocab';

/** Pick N random unique items from array, excluding the given item */
export function pickDistractors(
  pool: VocabCard[],
  exclude: VocabCard,
  count: number,
): VocabCard[] {
  const candidates = pool.filter(c => c.id !== exclude.id);
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Shuffle an array in place and return it */
export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type ExerciseType =
  | 'word-cn-en'      // Chinese → English MCQ
  | 'word-en-cn'      // English → Chinese MCQ
  | 'fill-blank'      // Fill-in-the-blank sentence
  | 'bubble-cn'       // Reorder Chinese character bubbles (match English)
  | 'sentence-mcq'    // Sentence translation MCQ
  | 'bubble-en'       // Reorder English word bubbles (match Chinese)
  | 'listen-word'     // Listening: identify word
  | 'listen-sentence'; // Listening: sentence comprehension

export interface Exercise {
  type: ExerciseType;
  card: VocabCard;
  options?: string[];      // For MCQ types: 4 answer strings
  correctIndex?: number;   // Index into options
  bubbles?: string[];      // For bubble reorder: shuffled words/characters
  correctOrder?: number[]; // For bubble reorder: correct indices of bubbles
  prompt?: string;         // Extra prompt text (e.g., blanked sentence)
  useTraditional?: boolean;
}

/** Build an MCQ exercise with 4 options (1 correct + 3 distractors) */
export function buildWordCnEn(card: VocabCard, pool: VocabCard[], useTraditional: boolean): Exercise {
  const distractors = pickDistractors(pool, card, 3);
  const allOptions = shuffle([card, ...distractors]);
  const correctIndex = allOptions.findIndex(o => o.id === card.id);
  return {
    type: 'word-cn-en',
    card,
    options: allOptions.map(o => o.english),
    correctIndex,
    useTraditional,
  };
}

export function buildWordEnCn(card: VocabCard, pool: VocabCard[], useTraditional: boolean): Exercise {
  const distractors = pickDistractors(pool, card, 3);
  const allOptions = shuffle([card, ...distractors]);
  const correctIndex = allOptions.findIndex(o => o.id === card.id);
  return {
    type: 'word-en-cn',
    card,
    options: allOptions.map(o => useTraditional ? o.traditional : o.simplified),
    correctIndex,
    useTraditional,
  };
}

export function buildFillBlank(card: VocabCard, pool: VocabCard[], useTraditional: boolean): Exercise {
  const hanzi = useTraditional ? card.traditional : card.simplified;
  const sentence = useTraditional ? card.exampleTraditional : card.exampleSimplified;
  // Replace first occurrence of the word in the sentence
  const blanked = sentence.replace(hanzi, '___');
  const distractors = pickDistractors(pool, card, 3);
  const allOptions = shuffle([card, ...distractors]);
  const correctIndex = allOptions.findIndex(o => o.id === card.id);
  return {
    type: 'fill-blank',
    card,
    prompt: blanked,
    options: allOptions.map(o => useTraditional ? o.traditional : o.simplified),
    correctIndex,
    useTraditional,
  };
}

export function buildSentenceMCQ(card: VocabCard, pool: VocabCard[], useTraditional: boolean): Exercise {
  const distractors = pickDistractors(pool, card, 3);
  const allOptions = shuffle([card, ...distractors]);
  const correctIndex = allOptions.findIndex(o => o.id === card.id);
  return {
    type: 'sentence-mcq',
    card,
    options: allOptions.map(o => o.exampleEnglish),
    correctIndex,
    useTraditional,
  };
}

export function buildBubbleCn(card: VocabCard, useTraditional: boolean): Exercise {
  // Split the Chinese sentence into individual characters as bubbles
  const sentence = useTraditional ? card.exampleTraditional : card.exampleSimplified;
  const chars = sentence.split('');
  const shuffledChars = shuffle(chars);
  const correctOrder = shuffledChars.map((_, i) => i);
  // correctOrder maps position in sorted to position in bubbles — we store bubbles as shuffled
  // and correctAnswer is just chars joined = sentence
  return {
    type: 'bubble-cn',
    card,
    bubbles: shuffledChars,
    prompt: card.exampleEnglish, // show English, arrange Chinese
    useTraditional,
  };
}

export function buildBubbleEn(card: VocabCard, useTraditional: boolean): Exercise {
  const words = card.exampleEnglish.split(' ');
  const shuffledWords = shuffle(words);
  return {
    type: 'bubble-en',
    card,
    bubbles: shuffledWords,
    prompt: useTraditional ? card.exampleTraditional : card.exampleSimplified,
    useTraditional,
  };
}

export function buildListenWord(card: VocabCard, pool: VocabCard[], useTraditional: boolean): Exercise {
  const distractors = pickDistractors(pool, card, 3);
  const allOptions = shuffle([card, ...distractors]);
  const correctIndex = allOptions.findIndex(o => o.id === card.id);
  return {
    type: 'listen-word',
    card,
    options: allOptions.map(o => useTraditional ? o.traditional : o.simplified),
    correctIndex,
    useTraditional,
  };
}

export function buildListenSentence(card: VocabCard, pool: VocabCard[], useTraditional: boolean): Exercise {
  const distractors = pickDistractors(pool, card, 3);
  const allOptions = shuffle([card, ...distractors]);
  const correctIndex = allOptions.findIndex(o => o.id === card.id);
  return {
    type: 'listen-sentence',
    card,
    options: allOptions.map(o => o.exampleEnglish),
    correctIndex,
    useTraditional,
  };
}

export function buildExerciseForCard(
  card: VocabCard,
  pool: VocabCard[],
  useTraditional: boolean,
  listenEnabled: boolean,
): Exercise {
  const types: ExerciseType[] = [
    'word-cn-en',
    'word-en-cn',
    'fill-blank',
    'bubble-cn',
    'sentence-mcq',
    'bubble-en',
  ];
  if (listenEnabled) {
    types.push('listen-word', 'listen-sentence');
  }
  const type = types[Math.floor(Math.random() * types.length)];
  switch (type) {
    case 'word-cn-en':    return buildWordCnEn(card, pool, useTraditional);
    case 'word-en-cn':    return buildWordEnCn(card, pool, useTraditional);
    case 'fill-blank':    return buildFillBlank(card, pool, useTraditional);
    case 'bubble-cn':     return buildBubbleCn(card, useTraditional);
    case 'sentence-mcq':  return buildSentenceMCQ(card, pool, useTraditional);
    case 'bubble-en':     return buildBubbleEn(card, useTraditional);
    case 'listen-word':   return buildListenWord(card, pool, useTraditional);
    case 'listen-sentence': return buildListenSentence(card, pool, useTraditional);
    default:              return buildWordCnEn(card, pool, useTraditional);
  }
}
