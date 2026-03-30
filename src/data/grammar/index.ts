import hsk1Grammar from './hsk1-grammar.json';
import hsk2Grammar from './hsk2-grammar.json';
import hsk3Grammar from './hsk3-grammar.json';
import hsk4Grammar from './hsk4-grammar.json';
import hsk5Grammar from './hsk5-grammar.json';
import { GrammarRule } from './types';

const grammarByLevel: Record<number, GrammarRule[]> = {
  1: hsk1Grammar as GrammarRule[],
  2: hsk2Grammar as GrammarRule[],
  3: hsk3Grammar as GrammarRule[],
  4: hsk4Grammar as GrammarRule[],
  5: hsk5Grammar as GrammarRule[],
};

export function getGrammarForLevel(level: number): GrammarRule[] {
  return grammarByLevel[level] ?? [];
}

export function getAllGrammarIds(level: number): string[] {
  return (grammarByLevel[level] ?? []).map(r => r.id);
}

export function getAllGrammarForLevels(levels: number[]): GrammarRule[] {
  return levels.flatMap(l => grammarByLevel[l] ?? []);
}
