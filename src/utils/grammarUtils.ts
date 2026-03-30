import { GrammarRule } from '../data/grammar/types';
import { shuffle } from './exerciseUtils';

export type GrammarExerciseType = 'grammar-fill' | 'grammar-correct';

export interface GrammarExercise {
  type: GrammarExerciseType;
  ruleId: string;
  ruleTitle: string;
  /** For grammar-fill: the sentence with ___ */
  sentence?: string;
  /** For grammar-fill: the correct answer and 3 distractors (shuffled) */
  options: string[];
  correctIndex: number;
  /** For grammar-fill: English translation of the sentence */
  sentenceEnglish?: string;
  /** For grammar-correct: the 4 sentences (1 correct + 3 wrong) */
  sentences?: string[];
  /** For grammar-correct: English meaning of the correct sentence */
  correctEnglish?: string;
}

export function buildGrammarFill(rule: GrammarRule): GrammarExercise | null {
  if (!rule.fillBlanks || rule.fillBlanks.length === 0) return null;
  const item = rule.fillBlanks[Math.floor(Math.random() * rule.fillBlanks.length)];
  const allOptions = shuffle([item.answer, ...item.distractors.slice(0, 3)]);
  const correctIndex = allOptions.indexOf(item.answer);
  return {
    type: 'grammar-fill',
    ruleId: rule.id,
    ruleTitle: rule.title,
    sentence: item.sentence,
    options: allOptions,
    correctIndex,
    sentenceEnglish: item.english,
  };
}

export function buildGrammarCorrect(rule: GrammarRule): GrammarExercise | null {
  if (!rule.mcqSentences || rule.mcqSentences.length === 0) return null;
  const item = rule.mcqSentences[Math.floor(Math.random() * rule.mcqSentences.length)];
  const wrongs = item.wrong.slice(0, 3);
  const sentences = shuffle([item.correct, ...wrongs]);
  const correctIndex = sentences.indexOf(item.correct);
  return {
    type: 'grammar-correct',
    ruleId: rule.id,
    ruleTitle: rule.title,
    sentences,
    options: sentences,
    correctIndex,
    correctEnglish: item.english,
  };
}

export function buildGrammarExercise(rule: GrammarRule): GrammarExercise | null {
  const canFill = rule.fillBlanks && rule.fillBlanks.length > 0;
  const canCorrect = rule.mcqSentences && rule.mcqSentences.length > 0;

  if (canFill && canCorrect) {
    return Math.random() < 0.5 ? buildGrammarFill(rule) : buildGrammarCorrect(rule);
  }
  if (canFill) return buildGrammarFill(rule);
  if (canCorrect) return buildGrammarCorrect(rule);
  return null;
}
