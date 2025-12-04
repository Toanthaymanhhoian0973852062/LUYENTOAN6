
export interface Lesson {
  id: string;
  title: string;
  chapterId: string;
}

export interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

// Quiz Data Structures
export interface MultipleChoiceQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number; // 0-3
  explanation?: string;
}

export interface TrueFalseStatement {
  id: number;
  statement: string;
  isTrue: boolean;
  explanation?: string;
}

export interface TrueFalseQuestion {
  id: number;
  stem: string; // The main context of the question
  statements: TrueFalseStatement[]; // Always 4 statements
}

export interface ShortAnswerQuestion {
  id: number;
  question: string;
  correctAnswer: string | number;
  explanation?: string;
}

export interface QuizData {
  topic: string;
  part1: MultipleChoiceQuestion[];
  part2: TrueFalseQuestion[];
  part3: ShortAnswerQuestion[];
}

export interface UserProgress {
  scores: Record<string, number>; // lessonId -> maxScore
}

export interface MathNews {
  title: string;
  content: string;
  imageUrl?: string;
}

export enum AppScreen {
  DASHBOARD = 'DASHBOARD',
  QUIZ = 'QUIZ',
  LOADING = 'LOADING',
  RESULT = 'RESULT',
}

export type QuizMode = 'ASSESSMENT' | 'PRACTICE';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}
