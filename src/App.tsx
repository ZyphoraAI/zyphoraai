import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RefreshCw, GraduationCap, CheckCircle2, Info, AlertTriangle, XCircle, X,
  Menu, LayoutDashboard, Brain, BookOpen, Layers, TrendingUp, Calendar, CalendarDays,
  Eye, EyeOff, Search, Database
} from 'lucide-react';
import { Task, ScheduleItem, ExamCountdown, StudyLog, QuickLink, Subject, StudySession } from './types';
import { loadInitialData, setLocalStorageItem } from './utils/storage';
import DashboardView from './components/DashboardView';
import TaskManagerView from './components/TaskManagerView';
import StudyPlannerView from './components/StudyPlannerView';
import ActiveRecallHubView from './components/ActiveRecallHubView';
import SmartRevisionView from './components/SmartRevisionView';
import StudyLibraryView from './components/StudyLibraryView';
import AIStudyMaterialImportView from './components/AIStudyMaterialImportView';
import UniversalSearchModal from './components/UniversalSearchModal';
import BackupRestoreView from './components/BackupRestoreView';
import AITutorView from './components/AITutorView';
import LandingPageView from './components/LandingPageView';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

// LayoutIntegrityMonitor removed as requested to clean up screen space
function LayoutIntegrityMonitor() {
  return null;
}

export default function App() {
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'tasks' | 'planner' | 'recall' | 'revision' | 'library' | 'import' | 'backup' | 'tutor'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [plannerActiveTab, setPlannerActiveTab] = useState<'sessions' | 'subjects' | 'timetable' | 'exams' | 'logs'>('sessions');
  const [activeRecallTab, setActiveRecallTab] = useState<'editor' | 'questions' | 'flashcards' | 'quiz'>('editor');

  // Universal Search coordinates states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchActiveRecallNoteId, setSearchActiveRecallNoteId] = useState<string | undefined>(undefined);
  const [searchLibrarySubjectId, setSearchLibrarySubjectId] = useState<string | undefined>(undefined);
  const [searchLibraryChapterId, setSearchLibraryChapterId] = useState<string | undefined>(undefined);
  const [searchLibraryTopicId, setSearchLibraryTopicId] = useState<string | undefined>(undefined);
  const [searchLibraryNoteId, setSearchLibraryNoteId] = useState<string | undefined>(undefined);

  const handleNavigate = (view: 'dashboard' | 'tasks' | 'planner' | 'recall' | 'revision' | 'library' | 'import' | 'backup' | 'tutor', subTab?: string) => {
    setActiveView(view);
    if (view === 'planner' && subTab) {
      setPlannerActiveTab(subTab as any);
      localStorage.setItem('planner_active_tab', subTab);
    }
    if (view === 'recall' && subTab) {
      setActiveRecallTab(subTab as any);
      localStorage.setItem('active_recall_tab', subTab);
    }
    setIsMobileMenuOpen(false);
  };
  
  // App States loaded from localStorage on initialize
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [exams, setExams] = useState<ExamCountdown[]>([]);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [streak, setStreak] = useState<number>(4);

  // Active Recall Dashboard stats
  const [totalFlashcards, setTotalFlashcards] = useState<number>(0);
  const [totalQuizzes, setTotalQuizzes] = useState<number>(0);

  // Success Notification state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newToast: Toast = { id, message, type };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500); // 4.5 seconds auto dismiss
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load state on mount first
  useEffect(() => {
    const data = loadInitialData();
    setTasks(data.tasks);
    setSchedule(data.schedule);
    setExams(data.exams);
    setStudyLogs(data.studyLogs);
    setQuickLinks(data.quickLinks);
    setSubjects(data.subjects || []);
    setStudySessions(data.studySessions || []);
    setStreak(data.streak);

    // Initial load for flashcards and quizzes counters
    const localMaterial = localStorage.getItem('recall_generated_material');
    if (localMaterial) {
      try {
        const parsed = JSON.parse(localMaterial);
        let cards = 0;
        let quizCount = 0;
        Object.values(parsed).forEach((val: any) => {
          cards += (val.flashcards || []).length;
          quizCount += (val.quizzes || []).length;
        });
        setTotalFlashcards(cards);
        setTotalQuizzes(quizCount);
      } catch (err) {
        console.error('Failed to restore stats metadata', err);
      }
    } else {
      setTotalFlashcards(3);
      setTotalQuizzes(1);
    }
  }, []);

  // Sync to localStorage on updates
  const handleSetTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    setLocalStorageItem('student_os_tasks', newTasks);
  };

  const handleSetSchedule = (newSched: ScheduleItem[]) => {
    setSchedule(newSched);
    setLocalStorageItem('student_os_schedule', newSched);
  };

  const handleSetExams = (newExams: ExamCountdown[]) => {
    setExams(newExams);
    setLocalStorageItem('student_os_exams', newExams);
  };

  const handleSetStudyLogs = (newLogs: StudyLog[]) => {
    setStudyLogs(newLogs);
    setLocalStorageItem('student_os_study_logs', newLogs);
  };

  const handleSetQuickLinks = (newLinks: QuickLink[]) => {
    setQuickLinks(newLinks);
    setLocalStorageItem('student_os_quick_links', newLinks);
  };

  const handleSetSubjects = (newSubjects: Subject[]) => {
    setSubjects(newSubjects);
    setLocalStorageItem('student_os_subjects', newSubjects);
  };

  const handleSetStudySessions = (newSessions: StudySession[]) => {
    setStudySessions(newSessions);
    setLocalStorageItem('student_os_study_sessions', newSessions);
  };

  // State operations - Tasks
  const addTask = (taskWithoutId: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskWithoutId,
      id: `task_${Date.now()}`
    };
    handleSetTasks([...tasks, newTask]);
    addToast(`Task "${newTask.title}" created successfully! 🎯`, 'success');
  };

  const updateTask = (updatedTask: Task) => {
    const revised = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    handleSetTasks(revised);
    addToast(`Task details refined successfully! ✨`, 'success');
  };

  const deleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    const filtered = tasks.filter(t => t.id !== id);
    handleSetTasks(filtered);
    addToast(`Task "${task?.title || 'Academic goal'}" removed.`, 'info');
  };

  const toggleTaskStatus = (id: string) => {
    let messageText = '';
    let type: 'success' | 'info' = 'success';
    const revised = tasks.map(t => {
      if (t.id === id) {
        const nextStatus: Task['status'] = t.status === 'Completed' ? 'To Do' : 'Completed';
        if (nextStatus === 'Completed') {
          messageText = `Awesome! "${t.title}" completed! 🎉`;
          type = 'success';
        } else {
          messageText = `"${t.title}" active and pending.`;
          type = 'info';
        }
        return { ...t, status: nextStatus };
      }
      return t;
    });
    handleSetTasks(revised);
    if (messageText) {
      addToast(messageText, type);
    }
  };

  // State operations - Schedule
  const addScheduleItem = (schedWithoutId: Omit<ScheduleItem, 'id'>) => {
    const newItem: ScheduleItem = {
      ...schedWithoutId,
      id: `sched_${Date.now()}`
    };
    handleSetSchedule([...schedule, newItem]);
    addToast(`Lecture "${newItem.subject}" added to weekly schedule! 🏫`, 'success');
  };

  const deleteScheduleItem = (id: string) => {
    const item = schedule.find(s => s.id === id);
    const filtered = schedule.filter(s => s.id !== id);
    handleSetSchedule(filtered);
    addToast(`Class "${item?.subject || 'Lecture'}" removed from schedule.`, 'info');
  };

  // State operations - Exams
  const addExam = (examWithoutId: Omit<ExamCountdown, 'id'>) => {
    const newItem: ExamCountdown = {
      ...examWithoutId,
      id: `exam_${Date.now()}`
    };
    handleSetExams([...exams, newItem]);
    addToast(`Exam milestone for "${newItem.title}" locked in! 📅`, 'success');
  };

  const deleteExam = (id: string) => {
    const exam = exams.find(e => e.id === id);
    const filtered = exams.filter(e => e.id !== id);
    handleSetExams(filtered);
    addToast(`Exam countdown for "${exam?.title || 'test'}" deleted.`, 'info');
  };

  // State operations - Study Logs
  const addStudyLog = (logWithoutId: Omit<StudyLog, 'id' | 'date'>) => {
    const newLog: StudyLog = {
      ...logWithoutId,
      id: `log_${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    
    // Auto-increment streak if last study date is from yesterday or today
    const updatedStudyLogs = [...studyLogs, newLog];
    handleSetStudyLogs(updatedStudyLogs);

    // Update streak logic
    let nextStreak = streak;
    const todayStr = new Date().toISOString().split('T')[0];
    const lastSessionIndex = studyLogs.length - 1;
    const lastSession = lastSessionIndex >= 0 ? studyLogs[lastSessionIndex] : null;

    if (!lastSession || lastSession.date !== todayStr) {
      nextStreak = streak + 1;
      setStreak(nextStreak);
      setLocalStorageItem('student_os_streak', nextStreak);
      addToast(`Study logged (${newLog.duration}m)! Dynamic study streak risen to ${nextStreak} days! 🔥`, 'success');
    } else {
      addToast(`Study hours logged (${newLog.duration}m)! Dedicated work! ✍️`, 'success');
    }
  };

  const deleteStudyLog = (id: string) => {
    const filtered = studyLogs.filter(l => l.id !== id);
    handleSetStudyLogs(filtered);
    addToast(`Focus session log removed from history book.`, 'info');
  };

  // State operations - Quick Links
  const addQuickLink = (title: string, url: string) => {
    const newLink: QuickLink = {
      id: `link_${Date.now()}`,
      title,
      url
    };
    handleSetQuickLinks([...quickLinks, newLink]);
    addToast(`Student bookmark "${title}" created! 🔖`, 'success');
  };

  const deleteQuickLink = (id: string) => {
    const link = quickLinks.find(l => l.id === id);
    const filtered = quickLinks.filter(l => l.id !== id);
    handleSetQuickLinks(filtered);
    addToast(`Bookmark "${link?.title || ''}" removed.`, 'info');
  };

  // State operations - Subjects
  const addSubject = (name: string, color: string, code?: string) => {
    const newSubject: Subject = {
      id: `sub_${Date.now()}`,
      name: name.trim(),
      color,
      code: code?.trim() || undefined
    };
    handleSetSubjects([...subjects, newSubject]);
    addToast(`Course Subject "${name}" established successfully! 🗂️`, 'success');
  };

  const updateSubject = (id: string, name: string, color: string, code?: string) => {
    const updated = subjects.map(s => {
      if (s.id === id) {
        return {
          ...s,
          name: name.trim(),
          color,
          code: code?.trim() || undefined
        };
      }
      return s;
    });
    handleSetSubjects(updated);
    addToast(`Course Subject "${name}" updated successfully! 🗂️`, 'success');
  };

  const deleteSubject = (id: string) => {
    const sub = subjects.find(s => s.id === id);
    handleSetSubjects(subjects.filter(s => s.id !== id));
    // Filter matching session plans
    handleSetStudySessions(studySessions.filter(sess => sess.subjectId !== id));
    addToast(`Subject "${sub?.name || 'Class'}" and related schedule logs removed.`, 'info');
  };

  // State operations - Study Sessions
  const addStudySession = (sessWithoutId: Omit<StudySession, 'id'>) => {
    const newSess: StudySession = {
      ...sessWithoutId,
      id: `sess_${Date.now()}`
    };
    handleSetStudySessions([...studySessions, newSess]);
    addToast(`Study session "${newSess.title}" planned! 🗓️`, 'success');
  };

  const deleteStudySession = (id: string) => {
    const sess = studySessions.find(s => s.id === id);
    handleSetStudySessions(studySessions.filter(s => s.id !== id));
    addToast(`Planned session "${sess?.title || 'Session'}" deleted.`, 'info');
  };

  const toggleStudySessionCompleted = (id: string) => {
    let msgStr = '';
    const updated = studySessions.map(s => {
      if (s.id === id) {
        const nextCompleted = !s.completed;
        
        // Auto-log to StudyLogs if marked completed!
        if (nextCompleted) {
          // Calculate formatted todays date
          const todayStr = new Date().toISOString().split('T')[0];
          const newLog: StudyLog = {
            id: `log_${Date.now()}`,
            subject: s.subjectName || 'Completed Plan',
            duration: s.duration,
            date: todayStr,
            notes: `Planned session completed: ${s.title}`
          };
          
          const updatedLogs = [...studyLogs, newLog];
          setStudyLogs(updatedLogs);
          setLocalStorageItem('student_os_study_logs', updatedLogs);

          // Update streak
          let nextStreak = streak;
          const lastSessionIndex = studyLogs.length - 1;
          const lastSession = lastSessionIndex >= 0 ? studyLogs[lastSessionIndex] : null;

          if (!lastSession || lastSession.date !== todayStr) {
            nextStreak = streak + 1;
            setStreak(nextStreak);
            setLocalStorageItem('student_os_streak', nextStreak);
            msgStr = `Sessional goal "${s.title}" achieved! Daily streak elevated to ${nextStreak}! 🔥`;
          } else {
            msgStr = `Sessional goal "${s.title}" achieved! Study hours logged. 🎉`;
          }
        } else {
          msgStr = `Goal session "${s.title}" marked active.`;
        }
        return { ...s, completed: nextCompleted };
      }
      return s;
    });
    handleSetStudySessions(updated);
    if (msgStr) addToast(msgStr, 'success');
  };

  // Clear all databases / reset function
  const handleResetData = () => {
    if (confirm('⚠️ Are you sure you want to reset all progress, schedules, and logs? This cannot be undone.')) {
      localStorage.clear();
      const data = loadInitialData();
      setTasks(data.tasks);
      setSchedule(data.schedule);
      setExams(data.exams);
      setStudyLogs(data.studyLogs);
      setQuickLinks(data.quickLinks);
      setSubjects(data.subjects || []);
      setStudySessions(data.studySessions || []);
      setStreak(4);
      setActiveView('dashboard');
      addToast('Application data has been successfully reset.', 'info');
    }
  };

  return (
    <div id="applet-viewport" className="relative w-full max-w-full bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 min-h-screen text-slate-100 font-sans antialiased overflow-x-hidden selection:bg-indigo-500/30 selection:text-white flex flex-col">
      
      {/* Decorative ambient glowing orbits (aesthetic cosmic vibe, no clutter inside container borders) */}
      <div className="absolute top-20 left-1/4 w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none z-0"></div>

      <AnimatePresence mode="wait">
        {showLanding ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full relative z-10"
          >
            <LandingPageView onGetStarted={() => {
              setShowLanding(false);
              setActiveView('dashboard');
            }} />
          </motion.div>
        ) : (
          <motion.div
            key="workspace"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            id="content-boundary"
            className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 flex flex-col min-h-screen justify-between overflow-x-hidden"
          >
            <div className="space-y-6 w-full max-w-full">
              {/* Main App Header with dynamic user welcomes */}
              <header id="main-navigation-header" className="w-full max-w-full flex flex-row items-center justify-between border-b border-white/10 pb-5 gap-3 sm:gap-4 relative">
                <div 
                  onClick={() => setShowLanding(true)}
                  className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 cursor-pointer hover:opacity-90 transition group"
                  title="Return to Landing Page"
                >
                  <div className="p-2 sm:p-3 bg-gradient-to-tr from-indigo-600 to-sky-400 rounded-2xl shadow-[0_0_15px_rgba(99,102,241,0.3)] shrink-0 group-hover:scale-105 transition-transform">
                    <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white flex items-center gap-2">
                      Zyphora <span className="text-xs uppercase px-2 py-0.5 bg-indigo-550 border border-indigo-400/20 text-indigo-200 font-mono rounded-md font-semibold shrink-0">MVP</span>
                    </h1>
                    <p className="text-xs text-slate-400 font-sans truncate">
                      Welcome back, <span className="text-indigo-300 font-medium font-mono">drgndezntskk</span> • Academic Workspace
                    </p>
                  </div>
                </div>

            {/* Desktop Quick Search Target */}
            <div className="hidden sm:block max-w-[160px] md:max-w-[220px] lg:max-w-xs w-full relative">
              <button
                id="search-trigger-btn"
                onClick={() => setIsSearchOpen(true)}
                className="w-full flex items-center bg-white/5 hover:bg-white/10 hover:border-indigo-500/40 border border-white/10 rounded-xl px-3 py-2 text-slate-400 hover:text-slate-200 transition cursor-pointer text-xs group"
              >
                <Search size={14} className="mr-2 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate">Search library...</span>
                <kbd className="ml-auto bg-white/10 border border-white/10 rounded px-1.5 py-0.5 text-[9px] font-mono select-none">⌘K</kbd>
              </button>
            </div>

            {/* Mobile Search Icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="sm:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-305 hover:text-white transition cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
              aria-label="Universal Search"
            >
              <Search size={18} />
            </button>

            {/* Hamburger Button for Mobile/Tablet */}
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer z-50 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Desktop View Select Nav Header Menu */}
            <nav id="navbar-view-select" className="hidden lg:flex items-center bg-white/5 border border-white/10 p-1 rounded-xl">
              <button
                id="btn-nav-dashboard"
                onClick={() => handleNavigate('dashboard')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  activeView === 'dashboard' 
                    ? 'bg-indigo-600 border border-indigo-500/20 text-white shadow' 
                    : 'text-slate-350 hover:text-white'
                }`}
              >
                <span>Dashboard</span>
              </button>
              <button
                id="btn-nav-tasks"
                onClick={() => handleNavigate('tasks')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  activeView === 'tasks' 
                    ? 'bg-indigo-600 border border-indigo-500/20 text-white shadow' 
                    : 'text-slate-350 hover:text-white'
                }`}
              >
                <span>Tasks</span>
              </button>
              <button
                id="btn-nav-planner"
                onClick={() => handleNavigate('planner', 'sessions')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  activeView === 'planner' && plannerActiveTab !== 'exams'
                    ? 'bg-indigo-600 border border-indigo-500/20 text-white shadow' 
                    : 'text-slate-350 hover:text-white'
                }`}
              >
                <span>Planner</span>
              </button>
              <button
                id="btn-nav-exams"
                onClick={() => handleNavigate('planner', 'exams')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  activeView === 'planner' && plannerActiveTab === 'exams'
                    ? 'bg-indigo-600 border border-indigo-500/20 text-white shadow' 
                    : 'text-slate-350 hover:text-white'
                }`}
              >
                <span>Exams</span>
              </button>
              <button
                id="btn-nav-recall"
                onClick={() => handleNavigate('recall', 'questions')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  activeView === 'recall' && activeRecallTab === 'questions'
                    ? 'bg-indigo-600 border border-indigo-500/20 text-white shadow' 
                    : 'text-slate-350 hover:text-white'
                }`}
              >
                <span>Active Recall</span>
              </button>
              <button
                id="btn-nav-flashcards"
                onClick={() => handleNavigate('recall', 'flashcards')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  activeView === 'recall' && activeRecallTab === 'flashcards'
                    ? 'bg-indigo-600 border border-indigo-500/20 text-white shadow' 
                    : 'text-slate-350 hover:text-white'
                }`}
              >
                <span>Flashcards</span>
              </button>
              <button
                id="btn-nav-quizzes"
                onClick={() => handleNavigate('recall', 'quiz')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  activeView === 'recall' && activeRecallTab === 'quiz'
                    ? 'bg-indigo-600 border border-indigo-500/20 text-white shadow' 
                    : 'text-slate-350 hover:text-white'
                }`}
              >
                <span>Quizzes</span>
              </button>
              <button
                id="btn-nav-library"
                onClick={() => handleNavigate('library')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  activeView === 'library' 
                    ? 'bg-indigo-600 border border-indigo-500/20 text-white shadow' 
                    : 'text-slate-350 hover:text-white'
                }`}
              >
                <span>Study Library</span>
              </button>
              <button
                id="btn-nav-revision"
                onClick={() => handleNavigate('revision')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  activeView === 'revision' 
                    ? 'bg-indigo-600 border border-indigo-500/20 text-white shadow' 
                    : 'text-slate-350 hover:text-white'
                }`}
              >
                <span>Smart Revision</span>
              </button>
              <button
                id="btn-nav-tutor"
                onClick={() => handleNavigate('tutor')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  activeView === 'tutor' 
                    ? 'bg-indigo-600 border border-indigo-500/20 text-white shadow' 
                    : 'text-slate-350 hover:text-white'
                }`}
              >
                <span>AI Tutor</span>
              </button>
              <button
                id="btn-nav-backup"
                onClick={() => handleNavigate('backup')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  activeView === 'backup' 
                    ? 'bg-indigo-600 border border-indigo-500/20 text-white shadow' 
                    : 'text-slate-350 hover:text-white'
                }`}
              >
                <span>Backup</span>
              </button>
            </nav>
          </header>

          {/* Mobile Overlay Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
                />

                {/* Sidebar Menu Drawer */}
                <motion.div
                  initial={{ x: '-100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '-100%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="fixed top-0 left-0 bottom-0 w-full max-w-[280px] bg-slate-950/95 border-r border-white/10 p-5 shadow-2x z-50 flex flex-col justify-between overflow-y-auto lg:hidden"
                >
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div 
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setShowLanding(true);
                        }}
                        className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition"
                        title="Return to Landing Page"
                      >
                        <div className="p-2 bg-gradient-to-tr from-indigo-600 to-sky-400 rounded-xl shadow">
                          <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-display font-bold text-white">Zyphora</span>
                      </div>
                      <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="border-b border-white/5 pb-2">
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Navigation Menu</p>
                    </div>

                    <nav className="space-y-1">
                      {[
                        { name: 'Dashboard', view: 'dashboard', tab: null, icon: LayoutDashboard },
                        { name: 'Tasks', view: 'tasks', tab: null, icon: CheckCircle2 },
                        { name: 'Exams', view: 'planner', tab: 'exams', icon: CalendarDays },
                        { name: 'Study Planner', view: 'planner', tab: 'sessions', icon: Calendar },
                        { name: 'Active Recall', view: 'recall', tab: 'questions', icon: Brain },
                        { name: 'Flashcards', view: 'recall', tab: 'flashcards', icon: Layers },
                        { name: 'Quizzes', view: 'recall', tab: 'quiz', icon: BookOpen },
                        { name: 'Study Library', view: 'library', tab: null, icon: BookOpen },
                        { name: 'Smart Revision', view: 'revision', tab: null, icon: TrendingUp },
                        { name: 'AI Tutor', view: 'tutor', tab: null, icon: Brain },
                        { name: 'Backup & Restore', view: 'backup', tab: null, icon: Database }
                      ].map((item) => {
                        const IconComponent = item.icon;
                        const isSelected = 
                          activeView === item.view && 
                          (item.view !== 'planner' || plannerActiveTab === item.tab || (!item.tab && plannerActiveTab === 'sessions')) &&
                          (item.view !== 'recall' || activeRecallTab === item.tab || (!item.tab && activeRecallTab === 'questions'));
                        
                        return (
                          <button
                            key={item.name}
                            onClick={() => handleNavigate(item.view as any, item.tab || undefined)}
                            className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                              isSelected 
                                ? 'bg-indigo-650 border border-indigo-500/10 text-white shadow' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <IconComponent size={14} className={isSelected ? 'text-indigo-200' : 'text-slate-400'} />
                            <span>{item.name}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  <div className="border-t border-white/5 pt-5 mt-6">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleResetData();
                      }}
                      className="flex items-center gap-2 text-[10px] text-slate-500 font-mono hover:text-indigo-400 transition"
                    >
                      <RefreshCw size={10} />
                      Reset all default data
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Core View Panel */}
          <main id="applet-primary-routing-view">
            <AnimatePresence mode="wait">
              {activeView === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <DashboardView
                    tasks={tasks}
                    studyLogs={studyLogs}
                    quickLinks={quickLinks}
                    exams={exams}
                    streak={streak}
                    toggleTaskStatus={toggleTaskStatus}
                    addQuickLink={addQuickLink}
                    deleteQuickLink={deleteQuickLink}
                    addStudyLog={addStudyLog}
                    onNavigate={handleNavigate}
                    studySessions={studySessions}
                    toggleStudySessionCompleted={toggleStudySessionCompleted}
                    addToast={addToast}
                    totalFlashcards={totalFlashcards}
                    totalQuizzes={totalQuizzes}
                    subjects={subjects}
                  />
                </motion.div>
              )}

              {activeView === 'tasks' && (
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <TaskManagerView
                    tasks={tasks}
                    addTask={addTask}
                    updateTask={updateTask}
                    deleteTask={deleteTask}
                    toggleTaskStatus={toggleTaskStatus}
                  />
                </motion.div>
              )}

              {activeView === 'planner' && (
                <motion.div
                  key="planner"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <StudyPlannerView
                    schedule={schedule}
                    exams={exams}
                    studyLogs={studyLogs}
                    addScheduleItem={addScheduleItem}
                    deleteScheduleItem={deleteScheduleItem}
                    addExam={addExam}
                    deleteExam={deleteExam}
                    addStudyLog={addStudyLog}
                    deleteStudyLog={deleteStudyLog}
                    subjects={subjects}
                    studySessions={studySessions}
                    addSubject={addSubject}
                    updateSubject={updateSubject}
                    deleteSubject={deleteSubject}
                    addStudySession={addStudySession}
                    deleteStudySession={deleteStudySession}
                    toggleStudySessionCompleted={toggleStudySessionCompleted}
                    activeTabProp={plannerActiveTab}
                  />
                </motion.div>
              )}

              {activeView === 'recall' && (
                <motion.div
                  key="recall"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <ActiveRecallHubView
                    addToast={addToast}
                    subjects={subjects}
                    onRecallStatsChange={(flashcards, quizzes) => {
                      setTotalFlashcards(flashcards);
                      setTotalQuizzes(quizzes);
                    }}
                    activeTabProp={activeRecallTab}
                    activeNoteIdProp={searchActiveRecallNoteId}
                  />
                </motion.div>
              )}

              {activeView === 'revision' && (
                <motion.div
                  key="revision"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <SmartRevisionView
                    addToast={addToast}
                    onNavigate={setActiveView}
                  />
                </motion.div>
              )}

              {activeView === 'library' && (
                <motion.div
                  key="library"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <StudyLibraryView
                    subjects={subjects}
                    addToast={addToast}
                    onNavigate={setActiveView}
                    addSubject={addSubject}
                    updateSubject={updateSubject}
                    deleteSubject={deleteSubject}
                    selectedSubjectIdProp={searchLibrarySubjectId}
                    selectedChapterIdProp={searchLibraryChapterId}
                    selectedTopicIdProp={searchLibraryTopicId}
                    selectedNoteIdProp={searchLibraryNoteId}
                  />
                </motion.div>
              )}

              {activeView === 'import' && (
                <motion.div
                  key="import"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <AIStudyMaterialImportView
                    subjects={subjects}
                    addSubject={addSubject}
                    addToast={addToast}
                    onNavigate={setActiveView}
                  />
                </motion.div>
              )}

              {activeView === 'backup' && (
                <motion.div
                  key="backup"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <BackupRestoreView
                    addToast={addToast}
                    subjects={subjects}
                    tasks={tasks}
                    exams={exams}
                    studySessions={studySessions}
                    schedule={schedule}
                    studyLogs={studyLogs}
                    quickLinks={quickLinks}
                    onRestoreComplete={(data) => {
                      setTasks(data.tasks);
                      setSchedule(data.schedule);
                      setExams(data.exams);
                      setStudyLogs(data.studyLogs);
                      setQuickLinks(data.quickLinks);
                      setSubjects(data.subjects);
                      setStudySessions(data.studySessions);
                      setStreak(data.streak);

                      try {
                        const localMaterial = localStorage.getItem('recall_generated_material');
                        if (localMaterial) {
                          const parsed = JSON.parse(localMaterial);
                          let cards = 0;
                          let quizCount = 0;
                          Object.values(parsed).forEach((val: any) => {
                            cards += (val.flashcards || []).length;
                            quizCount += (val.quizzes || []).length;
                          });
                          setTotalFlashcards(cards);
                          setTotalQuizzes(quizCount);
                        } else {
                          setTotalFlashcards(0);
                          setTotalQuizzes(0);
                        }
                      } catch (e) {
                        setTotalFlashcards(0);
                        setTotalQuizzes(0);
                      }

                      setActiveView('dashboard');
                    }}
                  />
                </motion.div>
              )}

              {activeView === 'tutor' && (
                <motion.div
                  key="tutor"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <AITutorView
                    addToast={addToast}
                    subjects={subjects}
                    onNavigate={handleNavigate}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Floating Toast Notification Container Queue */}
        <div 
          id="system-toast-container" 
          className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2 max-w-sm w-[calc(100%-3rem)] pointer-events-none"
        >
          <AnimatePresence>
            {toasts.map((toast) => {
              const iconMap = {
                success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
                info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
                warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
                error: <XCircle className="w-5 h-5 text-rose-450 shrink-0" />
              };
              const borderMap = {
                success: 'border-l-emerald-500 shadow-emerald-950/10',
                info: 'border-l-sky-500 shadow-indigo-950/10',
                warning: 'border-l-amber-500 shadow-amber-950/10',
                error: 'border-l-rose-500 shadow-red-950/10'
              };

              return (
                <motion.div
                  key={toast.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85, y: -10 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  className={`pointer-events-auto flex items-center justify-between gap-3 p-4 bg-slate-900/90 backdrop-blur-md border border-white/10 ${borderMap[toast.type]} border-l-4 rounded-xl shadow-xl overflow-hidden`}
                >
                  <div className="flex items-center gap-3">
                    {iconMap[toast.type]}
                    <p className="text-xs font-sans font-medium text-slate-100">
                      {toast.message}
                    </p>
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition shrink-0"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer with small restore options */}
        <footer id="applet-system-footer" className="flex flex-col sm:flex-row items-center justify-between border-t border-white/5 pt-6 mt-12 text-[10px] text-slate-500 font-mono">
          <span>Zyphora • Local data isolated in client sandbox</span>
          <button
            id="btn-reset-app-data"
            onClick={handleResetData}
            className="flex items-center gap-1 hover:text-indigo-400 transition"
          >
            <RefreshCw size={10} />
            Reset all default data
          </button>
        </footer>

      </motion.div>
      )}
      </AnimatePresence>
      <UniversalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        subjects={subjects}
        onNavigate={handleNavigate}
        setSearchActiveRecallNoteId={setSearchActiveRecallNoteId}
        setSearchLibrarySubjectId={setSearchLibrarySubjectId}
        setSearchLibraryChapterId={setSearchLibraryChapterId}
        setSearchLibraryTopicId={setSearchLibraryTopicId}
        setSearchLibraryNoteId={setSearchLibraryNoteId}
      />
      {/* Layout Integrity Monitor removed to clean up layout */}
    </div>
  );
}
