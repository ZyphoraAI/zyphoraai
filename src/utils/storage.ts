import { Task, ScheduleItem, ExamCountdown, StudyLog, QuickLink, Subject, StudySession } from '../types';

// Helper to calculate relative date strings
const getRelativeDateString = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const DEFAULT_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Analyze machine learning dataset',
    category: 'Project',
    priority: 'High',
    status: 'In Progress',
    dueDate: getRelativeDateString(2),
    notes: 'Use Pandas and Scikit-learn. Need to write the results section and plot confusion matrix.',
  },
  {
    id: 't2',
    title: 'Read Psychology textbook Chapter 4 & 5',
    category: 'Reading',
    priority: 'Low',
    status: 'To Do',
    dueDate: getRelativeDateString(5),
    notes: 'Focus on cognitive development theories and Piaget stages.',
  },
  {
    id: 't3',
    title: 'Prepare cheat sheet for Calculus II Exam',
    category: 'Exam Prep',
    priority: 'High',
    status: 'To Do',
    dueDate: getRelativeDateString(3),
    notes: 'Include integration by parts, trigonometric substitution, and Taylor series formulas.',
  },
  {
    id: 't4',
    title: 'Submit English literature rough draft',
    category: 'Assignment',
    priority: 'Medium',
    status: 'Completed',
    dueDate: getRelativeDateString(-1),
    notes: 'Reviewed thesis statement and feedback from writing lab.',
  }
];

const DEFAULT_SCHEDULE: ScheduleItem[] = [
  {
    id: 's1',
    subject: 'Calculus II',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:30',
    location: 'Science Auditorium C',
    professor: 'Dr. Evelyn Harris',
  },
  {
    id: 's2',
    subject: 'AI & Machine Learning Foundations',
    dayOfWeek: 'Monday',
    startTime: '13:00',
    endTime: '14:30',
    location: 'Tech Lab 3B',
    professor: 'Prof. Marcus Vance',
  },
  {
    id: 's3',
    subject: 'Introduction to Psychology',
    dayOfWeek: 'Tuesday',
    startTime: '10:00',
    endTime: '11:30',
    location: 'Humanities Hall 201',
    professor: 'Dr. Sarah Lin',
  },
  {
    id: 's4',
    subject: 'AI & Machine Learning Foundations',
    dayOfWeek: 'Wednesday',
    startTime: '13:00',
    endTime: '14:30',
    location: 'Tech Lab 3B',
    professor: 'Prof. Marcus Vance',
  },
  {
    id: 's5',
    subject: 'Advanced Physics',
    dayOfWeek: 'Thursday',
    startTime: '11:00',
    endTime: '12:30',
    location: 'Physics Lab 102',
    professor: 'Dr. Raymond Holt',
  },
  {
    id: 's6',
    subject: 'Study Group: Calculus II',
    dayOfWeek: 'Friday',
    startTime: '15:00',
    endTime: '16:30',
    location: 'Central Library Floor 2',
    professor: 'Study Companions',
  },
];

const DEFAULT_EXAMS: ExamCountdown[] = [
  {
    id: 'e1',
    subject: 'Calculus II',
    title: 'Midterm Integration Exam',
    date: getRelativeDateString(3),
    time: '10:00',
  },
  {
    id: 'e2',
    subject: 'AI Foundations',
    title: 'Term Project Presentation',
    date: getRelativeDateString(7),
    time: '13:00',
  },
  {
    id: 'e3',
    subject: 'Psychology 101',
    title: 'Behavioral Science Quiz 2',
    date: getRelativeDateString(12),
    time: '14:00',
  }
];

const DEFAULT_STUDY_LOGS: StudyLog[] = [
  {
    id: 'l1',
    subject: 'Calculus II',
    duration: 90,
    date: getRelativeDateString(-3),
    notes: 'Solved improper integrals and comparison test questions.',
  },
  {
    id: 'l2',
    subject: 'AI Foundations',
    duration: 120,
    date: getRelativeDateString(-2),
    notes: 'Coded decision tree classifier and visualised split states.',
  },
  {
    id: 'l3',
    subject: 'Psychology 101',
    duration: 60,
    date: getRelativeDateString(-1),
    notes: 'Created flashcards for Piaget developmental stages.',
  },
  {
    id: 'l4',
    subject: 'Calculus II',
    duration: 45,
    date: getRelativeDateString(0),
    notes: 'Reviewed series convergence tests.',
  }
];

const DEFAULT_QUICK_LINKS: QuickLink[] = [
  { id: 'q1', title: 'University Portal', url: 'https://university.edu' },
  { id: 'q2', title: 'Google Drive', url: 'https://drive.google.com' },
  { id: 'q3', title: 'E-Library Catalog', url: 'https://library.university.edu' },
  { id: 'q4', title: 'ChatGPT', url: 'https://chatgpt.com' },
];

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'sub-1', name: 'Calculus II', color: 'bg-indigo-500', code: 'MATH-201' },
  { id: 'sub-2', name: 'AI & Machine Learning Foundations', color: 'bg-teal-500', code: 'CS-440' },
  { id: 'sub-3', name: 'Introduction to Psychology', color: 'bg-pink-500', code: 'PSY-101' },
  { id: 'sub-4', name: 'Advanced Physics', color: 'bg-sky-500', code: 'PHYS-302' },
];

const DEFAULT_STUDY_SESSIONS: StudySession[] = [
  {
    id: 'sess-1',
    subjectId: 'sub-1',
    subjectName: 'Calculus II',
    title: 'Practice set 3 (Integration by parts)',
    date: getRelativeDateString(0), // Today
    duration: 60,
    completed: false
  },
  {
    id: 'sess-2',
    subjectId: 'sub-2',
    subjectName: 'AI & Machine Learning Foundations',
    title: 'Review Decision Trees lecture notes',
    date: getRelativeDateString(0), // Today
    duration: 45,
    completed: true
  },
  {
    id: 'sess-3',
    subjectId: 'sub-3',
    subjectName: 'Introduction to Psychology',
    title: 'Read chapter 4 and summarize stages',
    date: getRelativeDateString(1), // Tomorrow
    duration: 90,
    completed: false
  },
  {
    id: 'sess-4',
    subjectId: 'sub-4',
    subjectName: 'Advanced Physics',
    title: 'Solve thermodynamics practice test',
    date: getRelativeDateString(3), // In 3 days
    duration: 120,
    completed: false
  }
];

export const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const value = localStorage.getItem(key);
    if (value) {
      return JSON.parse(value) as T;
    }
  } catch (err) {
    console.error(`Error reading key ${key} from localStorage:`, err);
  }
  return defaultValue;
};

export const setLocalStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing key ${key} to localStorage:`, err);
  }
};

export const loadInitialData = () => {
  const tasks = getLocalStorageItem<Task[]>('student_os_tasks', DEFAULT_TASKS);
  const schedule = getLocalStorageItem<ScheduleItem[]>('student_os_schedule', DEFAULT_SCHEDULE);
  const exams = getLocalStorageItem<ExamCountdown[]>('student_os_exams', DEFAULT_EXAMS);
  const studyLogs = getLocalStorageItem<StudyLog[]>('student_os_study_logs', DEFAULT_STUDY_LOGS);
  const quickLinks = getLocalStorageItem<QuickLink[]>('student_os_quick_links', DEFAULT_QUICK_LINKS);
  const subjects = getLocalStorageItem<Subject[]>('student_os_subjects', DEFAULT_SUBJECTS);
  const studySessions = getLocalStorageItem<StudySession[]>('student_os_study_sessions', DEFAULT_STUDY_SESSIONS);
  const streak = getLocalStorageItem<number>('student_os_streak', 4);

  // Write if empty to guarantee state is active
  if (!localStorage.getItem('student_os_tasks')) setLocalStorageItem('student_os_tasks', tasks);
  if (!localStorage.getItem('student_os_schedule')) setLocalStorageItem('student_os_schedule', schedule);
  if (!localStorage.getItem('student_os_exams')) setLocalStorageItem('student_os_exams', exams);
  if (!localStorage.getItem('student_os_study_logs')) setLocalStorageItem('student_os_study_logs', studyLogs);
  if (!localStorage.getItem('student_os_quick_links')) setLocalStorageItem('student_os_quick_links', quickLinks);
  if (!localStorage.getItem('student_os_subjects')) setLocalStorageItem('student_os_subjects', subjects);
  if (!localStorage.getItem('student_os_study_sessions')) setLocalStorageItem('student_os_study_sessions', studySessions);
  if (!localStorage.getItem('student_os_streak')) setLocalStorageItem('student_os_streak', streak);

  return { tasks, schedule, exams, studyLogs, quickLinks, subjects, studySessions, streak };
};
