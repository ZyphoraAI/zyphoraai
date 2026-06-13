import { Task, ScheduleItem, ExamCountdown, StudyLog, QuickLink, Subject, StudySession } from '../types';

// Helper to calculate relative date strings
const getRelativeDateString = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const DEFAULT_TASKS: Task[] = [];

const DEFAULT_SCHEDULE: ScheduleItem[] = [];

const DEFAULT_EXAMS: ExamCountdown[] = [];

const DEFAULT_STUDY_LOGS: StudyLog[] = [];

const DEFAULT_QUICK_LINKS: QuickLink[] = [];

const DEFAULT_SUBJECTS: Subject[] = [];

const DEFAULT_STUDY_SESSIONS: StudySession[] = [];

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
  const streak = getLocalStorageItem<number>('student_os_streak', 0);

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
