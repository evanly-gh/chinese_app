import React from 'react';
import { Exercise } from '../../utils/exerciseUtils';
import { GrammarExercise as GrammarExerciseType } from '../../utils/grammarUtils';
import { WordMCQ } from './WordMCQ';
import { FillBlank } from './FillBlank';
import { SentenceMCQ } from './SentenceMCQ';
import { BubbleReorder } from './BubbleReorder';
import { ListenWord } from './ListenWord';
import { ListenSentence } from './ListenSentence';
import { GrammarExercise } from './GrammarExercise';

interface ExerciseHostProps {
  exercise: Exercise | GrammarExerciseType;
  onAnswer: (correct: boolean) => void;
}

export function ExerciseHost({ exercise, onAnswer }: ExerciseHostProps) {
  switch (exercise.type) {
    case 'grammar-fill':
    case 'grammar-correct':
      return <GrammarExercise exercise={exercise as GrammarExerciseType} onAnswer={onAnswer} />;
    case 'word-cn-en':
    case 'word-en-cn':
      return <WordMCQ exercise={exercise as Exercise} onAnswer={onAnswer} />;
    case 'fill-blank':
      return <FillBlank exercise={exercise as Exercise} onAnswer={onAnswer} />;
    case 'sentence-mcq':
      return <SentenceMCQ exercise={exercise as Exercise} onAnswer={onAnswer} />;
    case 'bubble-cn':
    case 'bubble-en':
      return <BubbleReorder exercise={exercise as Exercise} onAnswer={onAnswer} />;
    case 'listen-word':
      return <ListenWord exercise={exercise as Exercise} onAnswer={onAnswer} />;
    case 'listen-sentence':
      return <ListenSentence exercise={exercise as Exercise} onAnswer={onAnswer} />;
    default:
      return <WordMCQ exercise={exercise as Exercise} onAnswer={onAnswer} />;
  }
}
