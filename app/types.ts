export interface Question {
  id: string;
  title: string;
  statement: string;
  modelAnswer: string;
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
}

export interface SyntaxError {
  line: number;
  message: string;
  type: 'error' | 'warning';
}

export interface SyntaxCheckResult {
  isValid: boolean;
  errors: SyntaxError[];
}

export interface AnswerCheckResult {
  isCorrect: boolean;
  similarity: number;
  feedback: string[];
  suggestions: string[];
}
