export interface VocabCard {
  id: string;
  level: number;
  simplified: string;
  traditional: string;
  pinyin: string;
  english: string;
  partOfSpeech: string;
  exampleSimplified: string;
  exampleTraditional: string;
  examplePinyin: string;
  exampleEnglish: string;
  example2Simplified?: string;
  example2Traditional?: string;
  example2Pinyin?: string;
  example2English?: string;
}

export interface SRSState {
  cardId: string;
  interval: number;
  repetition: number;
  efactor: number;
  dueDate: string;
  firstSeenDate: string;
  lastReviewDate: string;
  lapses: number;
}
