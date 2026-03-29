import React from 'react';
import { Exercise } from '../../utils/exerciseUtils';
import { WordMCQ } from './WordMCQ';
import { FillBlank } from './FillBlank';
import { SentenceMCQ } from './SentenceMCQ';
import { BubbleReorder } from './BubbleReorder';
import { ListenWord } from './ListenWord';
import { ListenSentence } from './ListenSentence';

interface ExerciseHostProps {
  exercise: Exercise;
  onAnswer: (correct: boolean) => void;
}

export function ExerciseHost({ exercise, onAnswer }: ExerciseHostProps) {
  switch (exercise.type) {
    case 'word-cn-en':
    case 'word-en-cn':
      return <WordMCQ exercise={exercise} onAnswer={onAnswer} />;
    case 'fill-blank':
      return <FillBlank exercise={exercise} onAnswer={onAnswer} />;
    case 'sentence-mcq':
      return <SentenceMCQ exercise={exercise} onAnswer={onAnswer} />;
    case 'bubble-cn':
    case 'bubble-en':
      return <BubbleReorder exercise={exercise} onAnswer={onAnswer} />;
    case 'listen-word':
      return <ListenWord exercise={exercise} onAnswer={onAnswer} />;
    case 'listen-sentence':
      return <ListenSentence exercise={exercise} onAnswer={onAnswer} />;
    default:
      return <WordMCQ exercise={exercise} onAnswer={onAnswer} />;
  }
}
