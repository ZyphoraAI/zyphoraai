export interface Task {
  id: string;
  title: string;
  category: 'Assignment' | 'Exam Prep' | 'Project' | 'Reading' | 'Personal' | 'Other';
  priority: 'Low' | 'Medium' | 'High';
  status: 'To Do' | 'In Progress' | 'Completed';
  dueDate: string;
  notes?: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface ScheduleItem {
  id: string;
  subject: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location?: string;
  professor?: string;
}

export interface ExamCountdown {
  id: string;
  subject: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
}

export interface StudyLog {
  id: string;
  subject: string;
  duration: number; // minutes
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string; // Tailwind bg color class or hex string
  code?: string; // e.g. CS101, PHYS102
}

export interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  title: string;
  date: string; // YYYY-MM-DD
  duration: number; // in minutes
  completed: boolean;
}

export interface RecallQuestion {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
}

export interface RecallFlashcard {
  id: string;
  front: string;
  back: string;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface RecallQuiz {
  id: string;
  title: string;
  createdAt: string;
  questions: QuizQuestion[];
}

export interface RevisionItem {
  id: string;
  itemType: 'flashcard' | 'quiz' | 'note';
  itemId: string;
  noteId: string;
  title: string;
  intervalLevel: number; // e.g. 0, 1, 2, 3, 4 (representing boxes/repetitions)
  nextRevisionDate: string; // YYYY-MM-DD
  lastRevisionDate: string | null; // YYYY-MM-DD or null
  easiness?: number; // SM-2 easiness factor (default 2.5)
  repetitions?: number; // count of consecutive successful reviews
  intervalDays?: number; // previous interval in days
  masteryScore?: number; // 0-100 mastery rating
}

export interface RevisionLog {
  id: string;
  timestamp: string; // ISO string
  itemType: 'flashcard' | 'quiz' | 'note';
  title: string;
  perfRating: 'again' | 'hard' | 'good' | 'easy';
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  chapterId: string;
  title: string;
  createdAt: string;
}

export interface SavedNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
}

export interface TutorChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  isQuizQuestion?: boolean;
  correctAnswerIndex?: number;
  selectedAnswer?: number;
  options?: string[];
  explanation?: string;
}

export interface TutorSession {
  id: string;
  title: string;
  timestamp: string;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  selectedNoteId?: string;
  messages: TutorChatMessage[];
  mode: 'explain' | 'summarize' | 'examples' | 'questions' | 'quiz_me' | 'general';
  learningSupport: 'step_by_step' | 'beginner' | 'advanced' | 'real_world';
}


