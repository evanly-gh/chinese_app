export interface GrammarExample {
  simplified: string;
  traditional: string;
  pinyin: string;
  english: string;
}

export interface FillBlankExercise {
  sentence: string;   // with ___ for the blank
  answer: string;     // correct word/particle
  distractors: string[]; // 3 wrong options
  english: string;    // English translation of the full sentence
}

export interface MCQSentenceExercise {
  correct: string;    // correct sentence (simplified)
  wrong: string[];    // 3 incorrect variations
  english: string;    // English meaning
}

export interface GrammarRule {
  id: string;           // e.g., "gr_hsk1_001"
  level: number;        // 1-5
  title: string;
  pattern: string;      // syntactic pattern
  explanation: string;  // 1-2 sentences
  examples: GrammarExample[];
  fillBlanks: FillBlankExercise[];
  mcqSentences?: MCQSentenceExercise[];
}
