import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, CheckCircle, Clock, Calendar, ExternalLink, Plus, Trash2, 
  Play, Pause, RotateCcw, ChevronRight, AlertCircle, BookOpen, ListTodo,
  Tag, GraduationCap, Sparkles, Layers, FileText, UploadCloud, Database,
  Brain, Star, CalendarClock, Award
} from 'lucide-react';
import { Task, StudyLog, QuickLink, ExamCountdown, StudySession, Subject } from '../types';
import { runPerformanceAnalysis, PerformanceAnalysis } from '../utils/performanceAnalysis';
import { getApiUrl } from './AITutorView';

interface DashboardViewProps {
  tasks: Task[];
  studyLogs: StudyLog[];
  quickLinks: QuickLink[];
  exams: ExamCountdown[];
  streak: number;
  toggleTaskStatus: (id: string) => void;
  addQuickLink: (title: string, url: string) => void;
  deleteQuickLink: (id: string) => void;
  addStudyLog: (log: Omit<StudyLog, 'id' | 'date'>) => void;
  onNavigate: (view: any, subTab?: any) => void;
  studySessions: StudySession[];
  toggleStudySessionCompleted: (id: string) => void;
  addToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  totalFlashcards?: number;
  totalQuizzes?: number;
  subjects?: Subject[];
}

export default function DashboardView({
  tasks,
  studyLogs,
  quickLinks,
  exams,
  streak,
  toggleTaskStatus,
  addQuickLink,
  deleteQuickLink,
  addStudyLog,
  onNavigate,
  studySessions,
  toggleStudySessionCompleted,
  addToast,
  totalFlashcards = 0,
  totalQuizzes = 0,
  subjects = []
}: DashboardViewProps) {
  // Pomodoro Timer State
  const [timerMode, setTimerMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // default 25 mins
  const [timerActive, setTimerActive] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(25);
  
  // Quick Links Inputs
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [showAddLink, setShowAddLink] = useState(false);

  // Revision schedule items for home dashboard reminders and tasks
  const [revisionItems, setRevisionItems] = useState<any[]>([]);
  const [revisionLogs, setRevisionLogs] = useState<any[]>([]);

  // Recent Study materials
  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  const [recentFlashcards, setRecentFlashcards] = useState<any[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  
  // AI Tutor metrics states
  const [recentTutorSessions, setRecentTutorSessions] = useState<any[]>([]);
  const [frequentTopics, setFrequentTopics] = useState<string[]>([]);
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [aiCoachingReport, setAiCoachingReport] = useState<string | null>(null);

  useEffect(() => {
    const local = localStorage.getItem('revision_items');
    if (local) {
      try {
        setRevisionItems(JSON.parse(local));
      } catch (err) {
        console.error('Failed to parse revision items on dashboard', err);
      }
    }

    const logsLocal = localStorage.getItem('revision_logs');
    if (logsLocal) {
      try {
        setRevisionLogs(JSON.parse(logsLocal));
      } catch (err) {}
    }

    // Load custom notes and generated materials
    const notesLocal = localStorage.getItem('recall_study_notes');
    if (notesLocal) {
      try {
        const parsed = JSON.parse(notesLocal);
        setRecentNotes(parsed.slice(-3).reverse());
      } catch (err) {}
    }

    const materialLocal = localStorage.getItem('recall_generated_material');
    if (materialLocal) {
      try {
        const parsed = JSON.parse(materialLocal);
        let allFC: any[] = [];
        let allQZ: any[] = [];
        Object.entries(parsed).forEach(([noteId, mat]: [string, any]) => {
          if (mat.flashcards) {
            allFC.push(...mat.flashcards.map((f: any) => ({ ...f, noteId })));
          }
          if (mat.quizzes) {
            (mat.quizzes || []).forEach((qObj: any) => {
              if (qObj.questions) {
                allQZ.push(...qObj.questions.map((q: any) => ({ ...q, noteId, quizTitle: qObj.title })));
              }
            });
          }
        });
        setRecentFlashcards(allFC.slice(-3).reverse());
        setRecentQuizzes(allQZ.slice(-3).reverse());
      } catch (err) {}
    }

    // Load recently imported materials
    const logsStr = localStorage.getItem('imported_materials_log');
    if (logsStr) {
      try {
        setRecentUploads(JSON.parse(logsStr).slice(0, 4));
      } catch (e) {}
    }

    // Load last backup timestamp
    const lastBackup = localStorage.getItem('student_os_last_backup_date');
    if (lastBackup) {
      setLastBackupDate(lastBackup);
    }

    // Load AI Tutor history and calculate study metrics
    const tutorSessionsStr = localStorage.getItem('student_os_tutor_sessions');
    if (tutorSessionsStr) {
      try {
        const parsed = JSON.parse(tutorSessionsStr);
        setRecentTutorSessions(parsed.slice(0, 3));
        
        // Find most frequently studied topics based on session counts
        const topicCounts: Record<string, number> = {};
        parsed.forEach((s: any) => {
          if (s.title && s.title !== 'General Chat') {
            const cleanTopic = s.title.replace(' Session', '').trim();
            if (cleanTopic) {
              topicCounts[cleanTopic] = (topicCounts[cleanTopic] || 0) + 1;
            }
          }
        });
        const sorted = Object.entries(topicCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([topicName]) => topicName)
          .slice(0, 4);
        setFrequentTopics(sorted);
      } catch (e) {
        console.error('Failed to parse AI tutor metrics on dashboard', e);
      }
    }
  }, []);

  // Quick Study Log Input (Modal or Quick bar)
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [logSubject, setLogSubject] = useState('');
  const [logDuration, setLogDuration] = useState(30);
  const [logNotes, setLogNotes] = useState('');

  // Pomodoro ticking effect
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      
      // Auto transition & log warning / auto study session logging if work completed
      if (timerMode === 'work') {
        if (addToast) {
          addToast('🎯 Pomodoro focus session completed! Great job. Logging study hours. 🎉', 'success');
        } else {
          alert('🎯 Pomodoro focus session completed! Great job. Logging study session.');
        }
        // Auto log study session
        addStudyLog({
          subject: 'Pomodoro Session',
          duration: customMinutes,
          notes: 'Completed a structured Pomodoro cycle.'
        });
        // Switch to Break
        handleModeChange('shortBreak');
      } else {
        if (addToast) {
          addToast('☕ Break finished! Time to lock-in and study. ✍️', 'info');
        } else {
          alert('☕ Break finished! Time to get back to work.');
        }
        handleModeChange('work');
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const handleModeChange = (mode: 'work' | 'shortBreak' | 'longBreak') => {
    setTimerActive(false);
    setTimerMode(mode);
    let mins = 25;
    if (mode === 'work') mins = customMinutes;
    else if (mode === 'shortBreak') mins = 5;
    else if (mode === 'longBreak') mins = 15;
    
    setTimeLeft(mins * 60);
  };

  const handleCustomTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimerActive(false);
    setTimeLeft(customMinutes * 60);
    setTimerMode('work');
  };

  const toggleTimer = () => {
    setTimerActive(!timerActive);
  };

  const resetTimer = () => {
    setTimerActive(false);
    let mins = 25;
    if (timerMode === 'work') mins = customMinutes;
    else if (timerMode === 'shortBreak') mins = 5;
    else if (timerMode === 'longBreak') mins = 15;
    setTimeLeft(mins * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Stats Calculations
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;
  const pendingTasks = tasks.filter(t => t.status !== 'Completed');
  const criticalTasksCount = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;
  
  const totalStudyMinutes = studyLogs.reduce((acc, log) => acc + log.duration, 0);
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);

  // ----------------------------------------------------
  // SMART REVISION METRICS (Dashboard Integration)
  // ----------------------------------------------------
  const todayDateStr = new Date().toISOString().split('T')[0];

  // 1. Cards / items due today
  const cardsDueTodayCount = revisionItems.filter(item => item.nextRevisionDate <= todayDateStr).length;

  // 2. Mastered cards count (mastery score >= 80)
  const masteredCardsCount = revisionItems.filter(item => {
    const mastery = item.masteryScore !== undefined 
      ? item.masteryScore 
      : (item.intervalLevel * 20 || 10);
    return mastery >= 80;
  }).length;

  // 3. Spaced Repetition review streak
  const calculateRevisionStreak = () => {
    if (revisionLogs.length === 0) return 0;
    const dates = revisionLogs.map(l => l.timestamp.split('T')[0]);
    const uniqueDates = (Array.from(new Set(dates)) as string[]).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streakCount = 0;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (!uniqueDates.includes(todayStr) && !uniqueDates.includes(yesterdayStr)) {
      return 0;
    }

    let currentCheck = new Date();
    if (!uniqueDates.includes(todayStr) && uniqueDates.includes(yesterdayStr)) {
      currentCheck = yesterday;
    }

    while (true) {
      const checkStr = currentCheck.toISOString().split('T')[0];
      if (uniqueDates.includes(checkStr)) {
        streakCount++;
        currentCheck.setDate(currentCheck.getDate() - 1);
      } else {
        break;
      }
    }
    return streakCount;
  };

  const revisionStreakValue = calculateRevisionStreak();

  // Group by study activity to find top subject
  const topActiveSubject = (() => {
    const durationMap: Record<string, number> = {};
    studyLogs.forEach(log => {
      if (log.subject) {
        durationMap[log.subject] = (durationMap[log.subject] || 0) + log.duration;
      }
    });

    let topName = '';
    let maxDur = 0;
    Object.entries(durationMap).forEach(([name, dur]) => {
      if (dur > maxDur) {
        maxDur = dur;
        topName = name;
      }
    });

    if (!topName) return null;

    // Check if it matches any of our defined subjects
    const matchedSubject = (subjects || []).find(
      s => s.name.toLowerCase() === topName.toLowerCase() || 
           s.code?.toLowerCase() === topName.toLowerCase()
    );

    return {
      name: matchedSubject ? matchedSubject.name : topName,
      code: matchedSubject?.code,
      color: matchedSubject ? matchedSubject.color : 'bg-indigo-600',
      hours: (maxDur / 60).toFixed(1)
    };
  })();

  // Study Planner calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = (studySessions || []).filter(s => s.date === todayStr);
  const totalPlannedMinutes = (studySessions || []).filter(s => !s.completed).reduce((sum, s) => sum + s.duration, 0);
  const totalPlannedHours = (totalPlannedMinutes / 60).toFixed(1);
  const completedSessionsCount = (studySessions || []).filter(s => s.completed).length;

  // Group study hours by day for the last 5 days
  const getLast5DaysData = () => {
    const data = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayLogs = studyLogs.filter(log => log.date === dateStr);
      const minutesSpent = dayLogs.reduce((acc, log) => acc + log.duration, 0);
      data.push({ dateStr, label: dayName, minutes: minutesSpent });
    }
    return data;
  };

  const chartData = getLast5DaysData();
  const maxMinutesInChart = Math.max(...chartData.map(d => d.minutes), 60); // min height baseline

  // Find nearest upcoming exam
  const upcomingExams = exams
    .map(e => {
      const examDate = new Date(e.date);
      const today = new Date();
      today.setHours(0,0,0,0);
      const diffTime = examDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...e, diffDays };
    })
    .filter(e => e.diffDays >= 0)
    .sort((a, b) => a.diffDays - b.diffDays);

  const nearestExam = upcomingExams[0];

  const handleAddLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    
    // Add protocol if missing
    let url = newLinkUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    addQuickLink(newLinkTitle, url);
    setNewLinkTitle('');
    setNewLinkUrl('');
    setShowAddLink(false);
  };

  const handleQuickLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logSubject.trim()) return;
    addStudyLog({
      subject: logSubject.trim(),
      duration: Number(logDuration),
      notes: logNotes.trim()
    });
    setLogSubject('');
    setLogNotes('');
    setShowQuickLog(false);
  };

  // Get high priority tasks for Quick Tasks
  const quickTasks = tasks
    .filter(t => t.status !== 'Completed')
    .slice(0, 3);

  // Load dynamic weak topic detection performance data
  const performanceData = runPerformanceAnalysis();

  const handleRecommendationAction = (rec: any) => {
    if (rec.type === 'generate_flashcards') {
      onNavigate('recall', 'flashcards');
    } else if (rec.type === 'generate_quizzes') {
      onNavigate('recall', 'quiz');
    } else if (rec.type === 'review_notes') {
      onNavigate('recall', 'notes');
    } else if (rec.type === 'ask_ai_tutor') {
      onNavigate('tutor');
    } else if (rec.type === 'schedule_review') {
      onNavigate('planner');
    }
  };

  const handleRequestCoachingReport = async () => {
    try {
      setAiReportLoading(true);
      setAiCoachingReport(null);
      const res = await fetch(getApiUrl('/api/recall/ai-insights'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          strengths: performanceData.strengths, 
          weakAreas: performanceData.weakAreas 
        })
      });
      if (!res.ok) throw new Error('Failed to generate coaching insights');
      const data = await res.json();
      setAiCoachingReport(data.coachingReport);
      if (addToast) {
        addToast('🎯 Strategic report compiled successfully!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      if (addToast) {
        addToast('⚠️ Could not generate strategic report. Please try again.', 'error');
      }
    } finally {
      setAiReportLoading(false);
    }
  };

  return (
    <div id="dashboard-view-container" className="space-y-8 animate-fade-in">
      
      {/* Backup and Restore Alert Banner */}
      <div id="dashboard-backup-reminder-banner" className="w-full max-w-full">
        {!lastBackupDate ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl gap-3 text-orange-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Your Workspace is Not Backed Up!</h4>
                <p className="text-xs text-orange-205/80 text-orange-100 mt-0.5">
                  Your student data is stored entirely in this browser. To prevent data loss, please secure your profile by creating an offline backup snapshot.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('backup')}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0 transition flex items-center gap-1.5 self-start sm:self-center"
            >
              <Database size={13} />
              <span>Backup Now</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl gap-3 text-emerald-305 transition duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Academic Database Protected</h4>
                <p className="text-[11px] text-emerald-300 mt-0.5">
                  Last Backed Up: <span className="font-mono font-medium text-white">{new Date(lastBackupDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('backup')}
              className="px-4 py-2 bg-emerald-600/30 hover:bg-indigo-600 border border-emerald-500/30 text-emerald-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0 transition flex items-center gap-1.5 self-start sm:self-center"
            >
              <Database size={13} />
              <span>Snapshot Manager</span>
            </button>
          </div>
        )}
      </div>

      {/* Upgraded Dashboard Bento Statistics Grid */}
      <div id="stats-dashboard-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-9 gap-4">
        {/* Total Tasks */}
        <div id="stat-card-total-tasks" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Total Tasks</span>
            <h3 className="text-3xl font-display font-medium text-white mt-1">{totalTasksCount}</h3>
            <span className="text-xs text-indigo-300 mt-2 block font-sans">
              {pendingTasks.length} pending focus
            </span>
          </div>
          <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <ListTodo className="w-6 h-6" />
          </div>
        </div>

        {/* Completed Tasks */}
        <div id="stat-card-completed-tasks" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Completed Tasks</span>
            <h3 className="text-3xl font-display font-medium text-emerald-400 mt-1">{completedTasksCount}</h3>
            <span className="text-xs text-emerald-300 mt-2 block font-sans">
              {totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0}% completion
            </span>
          </div>
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Upcoming Exams */}
        <div id="stat-card-upcoming-exams" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Upcoming Exams</span>
            <h3 className="text-3xl font-display font-medium text-sky-400 mt-1">{upcomingExams.length}</h3>
            {nearestExam ? (
              <span className="text-xs text-sky-305 mt-2 block font-sans truncate max-w-[130px]" title={`Next: ${nearestExam.title} (${nearestExam.diffDays}d)`}>
                Next: {nearestExam.diffDays === 0 ? 'Today' : `${nearestExam.diffDays}d`} - {nearestExam.subject}
              </span>
            ) : (
              <span className="text-xs text-slate-400 mt-2 block font-sans">All caught up!</span>
            )}
          </div>
          <div className="p-3.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Study Streak */}
        <div id="stat-card-streak" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Study Streak</span>
            <h3 className="text-3xl font-display font-medium text-amber-400 mt-1 flex items-center gap-1.5">
              <Flame size={28} className="fill-amber-500 stroke-amber-400 animate-pulse" />
              {streak} Days
            </h3>
            <span className="text-xs text-amber-200 mt-2 block font-sans">Consistent focus!</span>
          </div>
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Flame className="w-6 h-6 text-amber-400" />
          </div>
        </div>

        {/* Study hours state */}
        <div id="stat-card-hours" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Study Clocked</span>
            <h3 className="text-3xl font-display font-medium text-white mt-1">{totalStudyHours} hr</h3>
            <span className="text-xs text-indigo-300 mt-2 block font-sans">Across {studyLogs.length} sessions</span>
          </div>
          <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Total Flashcards */}
        <div id="stat-card-flashcards" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Flashcards</span>
            <h3 className="text-3xl font-display font-medium text-indigo-400 mt-1">{totalFlashcards}</h3>
            <span className="text-xs text-indigo-300 mt-2 block font-sans cursor-pointer hover:underline" onClick={() => onNavigate('recall', 'flashcards')}>
              Test recall &rarr;
            </span>
          </div>
          <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Total Quizzes */}
        <div id="stat-card-quizzes" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Recall Quizzes</span>
            <h3 className="text-3xl font-display font-medium text-emerald-400 mt-1">{totalQuizzes}</h3>
            <span className="text-xs text-emerald-305 mt-2 block font-sans cursor-pointer hover:underline" onClick={() => onNavigate('recall', 'quiz')}>
              Challenge &rarr;
            </span>
          </div>
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Total Subjects */}
        <div id="stat-card-subjects" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Total Subjects</span>
            <h3 className="text-3xl font-display font-medium text-pink-450 mt-1">{(subjects || []).length}</h3>
            <span className="text-xs text-pink-300 mt-2 block font-sans cursor-pointer hover:underline" onClick={() => onNavigate('planner', 'subjects')}>
              Organize &rarr;
            </span>
          </div>
          <div className="p-3.5 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        {/* AI Tutor Session stat card */}
        <div id="stat-card-tutor" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">AI Tutor</span>
            <h3 className="text-3xl font-display font-medium text-purple-400 mt-1">{recentTutorSessions.length || 0}</h3>
            <span className="text-xs text-purple-300 mt-2 block font-sans cursor-pointer hover:underline animate-pulse font-semibold" onClick={() => onNavigate('tutor')}>
              Join Study Chat &rarr;
            </span>
          </div>
          <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <Brain className="w-6 h-6" />
          </div>
        </div>

        {/* Top Active Subject */}
        <div id="stat-card-top-active-subject" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Top Subject</span>
            <h3 className="text-xs font-sans font-bold text-white mt-1.5 truncate max-w-[110px]" title={topActiveSubject?.name || 'None'}>
              {topActiveSubject ? topActiveSubject.name : 'None'}
            </h3>
            <span className="text-xs text-indigo-300 mt-1 block font-sans">
              {topActiveSubject ? `${topActiveSubject.hours} hrs Study` : 'No study logged'}
            </span>
          </div>
          <div 
            className={`p-3.5 rounded-xl text-white ${topActiveSubject && !topActiveSubject.color.startsWith('#') ? topActiveSubject.color : !topActiveSubject ? 'bg-indigo-650/30' : ''}`}
            style={topActiveSubject?.color.startsWith('#') ? { backgroundColor: topActiveSubject.color } : undefined}
          >
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* Smart Spaced Repetition - Cards Due Today */}
        <div id="stat-card-revision-due" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg flex items-center justify-between transition hover:bg-white/10">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-300 font-bold">Reviews Due Today</span>
            <h3 className="text-3xl font-display font-medium text-indigo-400 mt-1">{cardsDueTodayCount}</h3>
            <span className="text-xs text-indigo-300 mt-2 block font-sans cursor-pointer hover:underline" onClick={() => onNavigate('revision')}>
              Start review &rarr;
            </span>
          </div>
          <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <CalendarClock className="w-6 h-6 text-indigo-400" />
          </div>
        </div>

        {/* Smart Spaced Repetition - Recall Streak */}
        <div id="stat-card-revision-streak" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg flex items-center justify-between transition hover:bg-white/10">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">Recall Streak</span>
            <h3 className="text-3xl font-display font-medium text-amber-400 mt-1">{revisionStreakValue} Days</h3>
            <span className="text-xs text-amber-205 mt-2 block font-sans">Active daily logs!</span>
          </div>
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Flame className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
        </div>

        {/* Smart Spaced Repetition - Mastered Cards */}
        <div id="stat-card-revision-mastered" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg flex items-center justify-between transition hover:bg-white/10">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-300 font-bold">Cognitive Mastery</span>
            <h3 className="text-3xl font-display font-medium text-emerald-400 mt-1">
              {masteredCardsCount}<span className="text-sm font-sans text-slate-400 font-normal">/{revisionItems.length || 0}</span>
            </h3>
            <span className="text-xs text-emerald-350 mt-2 block font-sans cursor-pointer hover:underline" onClick={() => onNavigate('revision')}>
              Map strength &rarr;
            </span>
          </div>
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Award className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* AI Weak Topic Detection & Diagnostic Hub */}
      <div id="ai-weak-topic-detection-dashboard" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl">
              <Brain className="w-5 h-5 text-violet-400 animate-pulse" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-display font-medium text-white tracking-wide">AI Weak Topic Detection & Diagnostic Hub</h2>
              <p className="text-xs text-slate-400 font-sans">Dynamic diagnostic analysis of your quiz attempts, flashcard performance, and active study retention schedules</p>
            </div>
          </div>
          <button
            type="button"
            disabled={aiReportLoading}
            onClick={handleRequestCoachingReport}
            className="text-xs font-semibold py-2 px-4 rounded-xl bg-violet-600/20 hover:bg-violet-600/35 text-violet-300 border border-violet-500/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-center"
          >
            {aiReportLoading ? (
              <>
                <span className="animate-spin text-[10px]">⌛</span>
                <span>Compiling Strategy...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} className="text-violet-400" />
                <span>Request Strategic Coach Report</span>
              </>
            )}
          </button>
        </div>

        {/* Live AI Strategic Coaching Report Display Panel */}
        {aiCoachingReport && (
          <div className="p-4 bg-slate-950/70 border border-violet-500/25 rounded-2xl space-y-3 text-left animate-fade-in max-h-[300px] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                <Brain size={12} />
                <span>AI Senior Academic Coach Report</span>
              </span>
              <button 
                onClick={() => setAiCoachingReport(null)}
                className="text-[10px] font-mono text-slate-505 hover:text-slate-300 uppercase cursor-pointer"
              >
                Clear
              </button>
            </div>
            <div className="text-xs text-slate-300 leading-relaxed space-y-2 font-sans whitespace-pre-wrap">
              {aiCoachingReport}
            </div>
          </div>
        )}

        {/* Smart Insights Block */}
        <div className="space-y-2 text-left">
          <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-bold">Smart Insights</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {performanceData.smartInsights.map((insight, idx) => (
              <div key={idx} className="flex items-center gap-2.5 p-3 bg-indigo-950/20 border border-indigo-500/15 rounded-xl">
                <Sparkles size={14} className="text-indigo-455 text-indigo-400 shrink-0" />
                <p className="text-xs font-sans text-slate-300">{insight}</p>
              </div>
            ))}
            {performanceData.smartInsights.length === 0 && (
              <p className="text-xs text-slate-500 font-sans italic">No study logs or recall items recorded yet. Study some notes or take a quiz to initialize smart insights!</p>
            )}
          </div>
        </div>

        {/* Core 4-Column Performance Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Column 1: Strengths & Masteries */}
          <div className="p-4 bg-slate-950/30 border border-white/5 rounded-2xl space-y-3.5 text-left flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider font-mono">Strengths</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold">MASTERED</span>
              </div>
              <p className="text-[10px] text-slate-500">Highest scores and solid retrieval retention rates</p>
            </div>
            
            <div className="space-y-2.5 flex-1 mt-2">
              {performanceData.strengths.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[120px]" title={item.name}>{item.name}</span>
                    <span className="text-[11px] font-bold font-mono text-emerald-400">{item.score}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1">
                    <div className="bg-emerald-400 h-1 rounded-full" style={{ width: `${item.score}%` }}></div>
                  </div>
                  <span className="text-[8px] uppercase tracking-wide text-slate-500 font-mono">{item.type}</span>
                </div>
              ))}
              {performanceData.strengths.length === 0 && (
                <div className="py-8 text-center text-[11px] text-slate-500 italic">No masteries (over 85%) recorded yet. Keep studying!</div>
              )}
            </div>
          </div>

          {/* Column 2: Weak Areas */}
          <div className="p-4 bg-slate-950/30 border border-white/5 rounded-2xl space-y-3.5 text-left flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-rose-400 tracking-wider font-mono">Weak Areas</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono font-bold">DIAGNOSED</span>
              </div>
              <p className="text-[10px] text-slate-500">Lower quiz scores or forgotten recall items</p>
            </div>
            
            <div className="space-y-2.5 flex-1 mt-2">
              {performanceData.weakAreas.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[120px]" title={item.name}>{item.name}</span>
                    <span className="text-[11px] font-bold font-mono text-rose-400">{item.score}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1">
                    <div className="bg-rose-400 h-1 rounded-full" style={{ width: `${item.score}%` }}></div>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-none">{item.reason}</p>
                </div>
              ))}
              {performanceData.weakAreas.length === 0 && (
                <div className="py-8 text-center text-[11px] text-slate-500 italic">Perfect run! No weak areas (under 75%) currently diagnosed.</div>
              )}
            </div>
          </div>

          {/* Column 3: Most Improved */}
          <div className="p-4 bg-slate-950/30 border border-white/5 rounded-2xl space-y-3.5 text-left flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-sky-400 tracking-wider font-mono">Most Improved</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono font-bold">TRENDING</span>
              </div>
              <p className="text-[10px] text-slate-500">Rising scores and consistent consecutive correct recalls</p>
            </div>
            
            <div className="space-y-2.5 flex-1 mt-2">
              {performanceData.mostImproved.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-sky-500/5 border border-sky-500/10 rounded-xl space-y-1.5">
                  <span className="text-xs font-bold text-white block truncate" title={item.name}>{item.name}</span>
                  <p className="text-[10px] text-slate-350 leading-relaxed">{item.description}</p>
                  <span className="text-[8px] uppercase tracking-wide text-slate-500 font-mono block">{item.type}</span>
                </div>
              ))}
              {performanceData.mostImproved.length === 0 && (
                <div className="py-8 text-center text-[11px] text-slate-500 italic">Practice recall prompts multiple times to unlock trending.</div>
              )}
            </div>
          </div>

          {/* Column 4: Needs Immediate Review */}
          <div className="p-4 bg-slate-950/30 border border-white/5 rounded-2xl space-y-3.5 text-left flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-amber-400 tracking-wider font-mono">Needs Review</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold">CRITICAL</span>
              </div>
              <p className="text-[10px] text-slate-500">Spaced repetition reviews past due or expiring today</p>
            </div>
            
            <div className="space-y-2.5 flex-1 mt-2">
              {performanceData.needsImmediateReview.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-1 transition hover:bg-amber-500/10 cursor-pointer" onClick={() => onNavigate('revision')}>
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="text-xs font-bold text-white truncate max-w-[120px]" title={item.title}>{item.title}</span>
                    <span className="text-[8px] uppercase px-1 rounded bg-slate-900 text-slate-400 font-mono shrink-0">{item.itemType}</span>
                  </div>
                  <p className="text-[9px] text-amber-350 leading-none">{item.reason}</p>
                </div>
              ))}
              {performanceData.needsImmediateReview.length === 0 && (
                <div className="py-8 text-center text-[11px] text-emerald-400 italic">Fantastic! Your active review queue is completely empty.</div>
              )}
            </div>
          </div>

        </div>

        {/* AI Recommendations & Smart Remediation Action Cards */}
        <div className="space-y-3 text-left border-t border-white/5 pt-5">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-violet-400" />
            <span className="text-xs font-bold uppercase text-slate-200 tracking-wider">AI Coach Remediation Recommendations</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {performanceData.aiRecommendations.map((rec, idx) => (
              <div key={idx} className="p-4 bg-slate-900/35 border border-white/10 rounded-2xl flex flex-col justify-between gap-3 h-full">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {rec.type === 'generate_flashcards' ? '🎴' :
                       rec.type === 'generate_quizzes' ? '📝' :
                       rec.type === 'review_notes' ? '📚' :
                       rec.type === 'ask_ai_tutor' ? '🤖' : '📅'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-200 leading-snug">{rec.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{rec.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRecommendationAction(rec)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold cursor-pointer transition text-center"
                >
                  {rec.actionLabel} &rarr;
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Improvement Track Over Time Progress Chart */}
        <div className="space-y-3.5 text-left border-t border-white/5 pt-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Historical Improvement Track Over Time</span>
            <span className="text-[9px] font-mono text-indigo-300">Dynamic performance averages</span>
          </div>
          
          <div className="flex items-end justify-between h-28 pt-4 px-2">
            {performanceData.improvementOverTime.map((pt, index) => {
              // height percentage from score (0-100)
              const heightPct = Math.min(100, Math.max(12, pt.avgScore));
              return (
                <div key={index} className="flex flex-col items-center flex-1 group relative">
                  <div className="w-full px-2 flex flex-col justify-end items-center relative">
                    {/* Tooltip */}
                    <div className="absolute -top-10 px-2 py-1 bg-slate-950 border border-white/10 text-slate-200 text-[10px] font-mono rounded opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none whitespace-nowrap z-10 text-center">
                      <p className="font-bold text-indigo-305 text-indigo-300">{pt.avgScore}% proficiency</p>
                      <p className="text-[9px] text-slate-400">{pt.count} sessions completed</p>
                    </div>
                    
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ delay: index * 0.05, duration: 0.5, ease: 'easeOut' }}
                      className="w-full max-w-[32px] rounded-t bg-gradient-to-t from-violet-600/30 to-violet-400 group-hover:from-violet-500 group-hover:to-violet-300 shadow-[0_0_8px_rgba(139,92,246,0.15)] flex items-center justify-center relative min-h-[16px]"
                    >
                      <span className="text-[8px] font-bold font-mono text-slate-300 group-hover:text-white absolute top-1">{pt.avgScore}</span>
                    </motion.div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 mt-2">{pt.date}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Focus Row: Pomodoro + Study Analytics */}
      <div id="focus-analytics-row" className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Interactive Pomodoro Focus Timer Card (3/5 wide) */}
        <div id="pomodoro-box-card" className="lg:col-span-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
                <h2 className="text-lg font-display font-medium text-white tracking-wide">Focus Station / Pomodoro</h2>
              </div>
              <div className="flex bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-0.5 text-xs transition">
                <button 
                  id="pomo-mode-work"
                  onClick={() => handleModeChange('work')}
                  className={`px-3 py-1.5 rounded-md font-medium transition ${timerMode === 'work' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
                >
                  Work
                </button>
                <button 
                  id="pomo-mode-short"
                  onClick={() => handleModeChange('shortBreak')}
                  className={`px-3 py-1.5 rounded-md font-medium transition ${timerMode === 'shortBreak' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
                >
                  Short Break
                </button>
                <button 
                  id="pomo-mode-long"
                  onClick={() => handleModeChange('longBreak')}
                  className={`px-3 py-1.5 rounded-md font-medium transition ${timerMode === 'longBreak' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
                >
                  Long Break
                </button>
              </div>
            </div>

            {/* Display Countdown Clock */}
            <div className="flex flex-col items-center justify-center py-6">
              <span className="text-7xl sm:text-8xl font-mono tracking-tighter text-white font-medium select-none drop-shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-300 mt-2">
                {timerMode === 'work' ? '🎯 Remain Locked-In' : '☕ Relax and Recharge'}
              </span>
            </div>
          </div>

          <div className="space-y-5">
            {/* Action buttons */}
            <div className="flex items-center gap-3 justify-center">
              <button
                id="btn-timer-toggle"
                onClick={toggleTimer}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium shadow-lg transition duration-200 transform hover:scale-[1.02] cursor-pointer ${
                  timerActive 
                    ? 'bg-amber-600 hover:bg-amber-500 border border-amber-500/20 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 text-white'
                }`}
              >
                {timerActive ? <Pause size={18} /> : <Play size={18} />}
                {timerActive ? 'Pause Session' : 'Start Focus'}
              </button>
              
              <button
                id="btn-timer-reset"
                onClick={resetTimer}
                className="flex items-center justify-center p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-xl transition duration-150"
                title="Reset timer"
              >
                <RotateCcw size={18} />
              </button>
            </div>

            {/* Custom Timer Input block */}
            <form onSubmit={handleCustomTimeSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-white/5 pt-4 text-xs">
              <label htmlFor="custom-mins-input" className="text-slate-400 font-sans">Customize work block (mins):</label>
              <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1">
                <input
                  id="custom-mins-input"
                  type="number"
                  min="1"
                  max="180"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Math.max(1, Number(e.target.value)))}
                  className="w-12 text-center bg-transparent border-none text-white focus:outline-none font-mono"
                />
                <button
                  type="submit"
                  className="bg-indigo-600/50 hover:bg-indigo-600 border border-indigo-500/30 text-white px-2 py-1 rounded-md transition font-medium"
                >
                  Set
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Study Logging & Analytics (2/5 wide) */}
        <div id="analytics-bar-chart-card" className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
              <h2 className="text-lg font-display font-medium text-white flex items-center gap-2">
                <BookOpen size={18} className="text-indigo-400" />
                <span>Focus Logs (5 Days)</span>
              </h2>
              <button
                id="btn-toggle-quick-log"
                onClick={() => setShowQuickLog(!showQuickLog)}
                className="p-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/25 rounded-lg text-indigo-300 hover:text-white transition"
                title="Log study session"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Quick Logging Drawer inside column */}
            <AnimatePresence>
              {showQuickLog && (
                <motion.form 
                  id="quick-log-inline-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleQuickLogSubmit}
                  className="bg-white/5 rounded-xl border border-white/10 p-4 mb-4 space-y-3 overflow-hidden text-xs"
                >
                  <div className="flex flex-col gap-1">
                    <label htmlFor="log-subject-input" className="text-xs text-slate-300 font-medium">Subject / Class Name</label>
                    <input
                      id="log-subject-input"
                      type="text"
                      placeholder="e.g. Psychology lecture, Calc homework"
                      value={logSubject}
                      onChange={(e) => setLogSubject(e.target.value)}
                      required
                      className="bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="log-duration-input" className="text-xs text-slate-300 font-medium">Duration (mins)</label>
                      <input
                        id="log-duration-input"
                        type="number"
                        min="1"
                        max="600"
                        value={logDuration}
                        onChange={(e) => setLogDuration(Number(e.target.value))}
                        required
                        className="bg-white/5 border border-white/10 rounded-lg p-2 text-white font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="log-notes-input" className="text-xs text-slate-300 font-medium">Quick Notes</label>
                      <input
                        id="log-notes-input"
                        type="text"
                        placeholder="Optional details..."
                        value={logNotes}
                        onChange={(e) => setLogNotes(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowQuickLog(false)}
                      className="px-2.5 py-1.5 text-slate-400 hover:text-white font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-500 font-medium"
                    >
                      Log Focus
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Micro bar chart */}
            <div id="bars-visual-chart" className="flex items-end justify-between h-40 pt-4 px-2">
              {chartData.map((d, index) => {
                const heightPercentage = Math.min(100, Math.max(10, (d.minutes / maxMinutesInChart) * 100));
                return (
                  <div key={index} className="flex flex-col items-center flex-1 group">
                    <div className="w-full px-1.5 flex flex-col justify-end items-center relative">
                      {/* Tooltip */}
                      <div className="absolute -top-8 px-2 py-1 bg-slate-950 border border-white/10 text-slate-200 text-[10px] font-mono rounded opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none whitespace-nowrap z-10">
                        {d.minutes} mins
                      </div>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercentage}%` }}
                        transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
                        className={`w-full max-w-[28px] rounded-t-lg transition-all duration-200 ${
                          d.minutes > 0 
                            ? 'bg-gradient-to-t from-indigo-600 to-sky-400 group-hover:from-indigo-500 group-hover:to-sky-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]' 
                            : 'bg-white/5 border-t border-dashed border-white/10'
                        }`}
                      ></motion.div>
                    </div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 mt-2.5">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 mt-6 text-xs text-slate-400 flex items-center justify-between">
            <span>Peak study Day: {chartData.reduce((prev, curr) => prev.minutes > curr.minutes ? prev : curr).label}</span>
            <button 
              onClick={() => onNavigate('planner')}
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 group"
            >
              Study Planner <ChevronRight size={14} className="group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>
      </div>

      {/* Smart Spaced Repetition Revisions Reminder Panel */}
      {(() => {
        const todayDStr = new Date().toISOString().split('T')[0];
        const dueRevisionItems = revisionItems.filter(item => item.nextRevisionDate <= todayDStr);

        return (
          <div id="dashboard-smart-revision-addon" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                  <Flame className="w-5 h-5 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-medium text-white tracking-wide">Smart Revision Reminder</h2>
                  <p className="text-xs text-slate-400 font-sans">Spaced Repetition items due for memory recall practice today</p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => onNavigate('revision')}
                className="text-xs font-semibold py-1.5 px-3 rounded-lg bg-indigo-550 border border-indigo-400/20 text-indigo-100 hover:text-white hover:bg-indigo-600 transition flex items-center gap-1 cursor-pointer"
              >
                <span>Open Revision Workspace</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* List of items due today */}
            {dueRevisionItems.length === 0 ? (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs text-emerald-400 flex items-center gap-2.5">
                <CheckCircle size={16} className="shrink-0" />
                <span><strong>No revisions pending!</strong> All your retention schedules are perfectly up to date for today. Keep up the high score! 🧠✨</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 bg-indigo-505 bg-opacity-10 border border-indigo-500/20 rounded-xl text-xs text-indigo-200 flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-indigo-400" />
                  <div>
                    <span className="font-semibold block">Retention Session Due!</span>
                    <span className="text-[11px] text-slate-400 leading-relaxed block">
                      You have <strong>{dueRevisionItems.length} active revision sessions</strong> due today. Recalling card prompts or note answers now reinforces long-term retention.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dueRevisionItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-900/40 border border-white/5 hover:border-white/10 rounded-xl transition flex flex-col justify-between gap-3 h-full"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                            item.itemType === 'note' ? 'bg-amber-500/15 text-amber-300' :
                            item.itemType === 'flashcard' ? 'bg-indigo-500/15 text-indigo-300' :
                            'bg-emerald-500/15 text-emerald-300'
                          }`}>
                            {item.itemType}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">Box {item.intervalLevel}</span>
                        </div>

                        <h4 className="text-xs font-semibold text-white font-sans line-clamp-1 h-4">{item.title}</h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigate('revision')}
                        className="w-full py-1.5 bg-indigo-550 border border-indigo-500/20 rounded-lg text-center text-[11px] font-bold text-white hover:bg-indigo-650 transition cursor-pointer"
                      >
                        Start Active recall &rarr;
                      </button>
                    </div>
                  ))}
                  {dueRevisionItems.length > 3 && (
                    <div
                      onClick={() => onNavigate('revision')}
                      className="p-4 bg-white/2 hover:bg-white/5 border border-white/5 border-dashed rounded-xl transition flex flex-col items-center justify-center gap-2 cursor-pointer text-center h-full"
                    >
                      <span className="text-xs font-mono font-bold text-indigo-300">+{dueRevisionItems.length - 3} More</span>
                      <span className="text-[10px] text-slate-500 font-sans">Practice additional due items</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Study Planner Integration Panel */}
      <div id="dashboard-study-planner-addon" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <Calendar className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-display font-medium text-white tracking-wide">Study Planner Today</h2>
              <p className="text-xs text-slate-400 font-sans">Active goals and scheduled sessions in your plan</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-xl text-center">
              <span className="text-slate-400 uppercase text-[9px] block tracking-wide">Hours Planned</span>
              <span className="text-sm font-semibold text-indigo-300">{totalPlannedHours} hr</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl text-center">
              <span className="text-slate-400 uppercase text-[9px] block tracking-wide">Sessions Done</span>
              <span className="text-sm font-semibold text-emerald-405">{completedSessionsCount} / {studySessions.length}</span>
            </div>
          </div>
        </div>

        {/* Content columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Today's agenda list */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-mono text-slate-400 flex items-center gap-1.5">
              <Clock size={12} className="text-indigo-400" />
              <span>Today's Study Checklist ({todaySessions.length})</span>
            </h3>
            
            {todaySessions.length === 0 ? (
              <div className="py-6 px-4 rounded-xl border border-dashed border-white/10 bg-white/2 bg-opacity-10 text-center text-slate-400">
                <p className="text-xs">No study sessions planned for today.</p>
                <button
                  id="btn-navigate-to-planner-today"
                  onClick={() => onNavigate('planner')}
                  className="mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                >
                  Go to Planner & Schedule a Session
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {todaySessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3.5 rounded-xl border transition flex items-start gap-3 ${
                      session.completed
                        ? 'bg-emerald-500/5 border-emerald-500/25 text-slate-400'
                        : 'bg-white/5 border-white/5 hover:border-indigo-500/20 text-white'
                    }`}
                  >
                    <button
                      id={`btn-complete-session-pomo-${session.id}`}
                      onClick={() => toggleStudySessionCompleted(session.id)}
                      className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center text-[10px] transition font-bold select-none cursor-pointer ${
                        session.completed
                          ? 'bg-emerald-555 border-transparent text-white bg-emerald-600'
                          : 'border-white/30 hover:border-indigo-400 text-transparent'
                      }`}
                      title={session.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      ✓
                    </button>
                    <div className="overflow-hidden flex-1">
                      <p className={`text-xs font-semibold font-sans truncate ${session.completed ? 'line-through text-slate-500 animate-pulse' : 'text-white'}`}>
                        {session.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                          {session.subjectName}
                        </span>
                        <span className="text-[10px] font-mono text-indigo-300">
                          ⏱️ {session.duration}m
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Quick Status bento section */}
          <div className="lg:col-span-1 bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider font-mono text-slate-350 border-b border-white/5 pb-1.5">Planner Status</h4>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div id="planner-status-upcoming" className="flex items-center justify-between">
                  <span className="text-slate-400">Total Scheduled:</span>
                  <span className="font-semibold text-white">{studySessions.length} sessions</span>
                </div>
                <div id="planner-status-uncompleted" className="flex items-center justify-between">
                  <span className="text-slate-400">Hours Remaining:</span>
                  <span className="font-semibold text-indigo-350">{(studySessions.filter(s => !s.completed).reduce((a, s) => a + s.duration, 0) / 60).toFixed(1)} hrs</span>
                </div>
                <div id="planner-status-completed" className="flex items-center justify-between">
                  <span className="text-slate-400">Achievements:</span>
                  <span className="font-semibold text-emerald-400">{completedSessionsCount} logged</span>
                </div>
              </div>

              {/* Subject Manager Quick Access CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('planner', 'subjects');
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-[11px] font-medium leading-none flex items-center gap-1 font-sans">
                    🗂️ Course Subject Manager
                  </span>
                  <ChevronRight size={12} className="ml-auto" />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 mt-4">
              <button
                id="btn-navigate-to-planner-dashboard-cta"
                onClick={() => onNavigate('planner')}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 rounded-xl text-center text-xs font-bold text-white transition block cursor-pointer"
              >
                Open Full Study Planner
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Understory Row: Quick Tasks + Quick Links */}
      <div id="dashboard-understory-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Quick Tasks List Panel */}
        <div id="quick-tasks-card" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h2 className="text-lg font-display font-medium text-white flex items-center gap-2">
                <CheckCircle size={18} className="text-indigo-400" />
                <span>Quick Tasks Checklist</span>
              </h2>
              <button 
                onClick={() => onNavigate('tasks')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-sans"
              >
                Configure
              </button>
            </div>

            {quickTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">All cleaned up! No pending tasks.</p>
                <button
                  onClick={() => onNavigate('tasks')}
                  className="mt-3 text-xs bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/20 text-white px-3 py-1.5 rounded-lg transition"
                >
                  Create custom task
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {quickTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 transition"
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        id={`btn-complete-quick-task-${task.id}`}
                        onClick={() => toggleTaskStatus(task.id)}
                        className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-white/30 checked:bg-indigo-600 flex items-center justify-center text-xs text-white hover:border-indigo-400 transition"
                      >
                        <div className="w-2 h-2 rounded bg-indigo-550 opacity-0 hover:opacity-100 transition"></div>
                      </button>
                      <div>
                        <p className="text-sm font-sans font-medium text-white line-clamp-1">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                            task.priority === 'High' ? 'bg-red-500/10 text-red-300 border border-red-500/20' :
                            task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                            'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          }`}>
                            {task.priority}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">Due: {task.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick bookmarks / links panel */}
        <div id="quick-links-card" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h2 className="text-lg font-display font-medium text-white flex items-center gap-2">
                <ExternalLink size={18} className="text-indigo-400" />
                <span>Student Bookmarks</span>
              </h2>
              <button 
                id="btn-toggle-add-link"
                onClick={() => setShowAddLink(!showAddLink)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-sans"
              >
                <Plus size={14} /> Add Link
              </button>
            </div>

            {/* Quick Links Form */}
            <AnimatePresence>
              {showAddLink && (
                <motion.form
                  id="add-bookmark-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleAddLinkSubmit}
                  className="bg-white/5 rounded-xl border border-white/10 p-3 mb-4 space-y-3 overflow-hidden text-xs"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="bookmark-title-input" className="text-[10px] uppercase font-mono text-slate-400">Name</label>
                      <input
                        id="bookmark-title-input"
                        type="text"
                        placeholder="e.g. Canvas"
                        value={newLinkTitle}
                        onChange={(e) => setNewLinkTitle(e.target.value)}
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="bookmark-url-input" className="text-[10px] uppercase font-mono text-slate-400">URL</label>
                      <input
                        id="bookmark-url-input"
                        type="text"
                        placeholder="e.g. canvas.instructure.com"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-[10px]">
                    <button 
                      type="button" 
                      onClick={() => setShowAddLink(false)}
                      className="px-2 py-1 text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded"
                    >
                      Add Bookmark
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Display list */}
            {quickLinks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">No bookmarks yet. Add custom bookmarks!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {quickLinks.map((link) => (
                  <div 
                    key={link.id}
                    className="group flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 p-2.5 rounded-xl transition"
                  >
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-1.5 text-indigo-200 hover:text-white transition overflow-hidden text-xs font-medium"
                    >
                      <ExternalLink size={12} className="flex-shrink-0" />
                      <span className="truncate">{link.title}</span>
                    </a>
                    <button
                      id={`btn-delete-link-${link.id}`}
                      onClick={() => deleteQuickLink(link.id)}
                      className="text-slate-500 hover:text-red-400 p-1 rounded transition opacity-0 group-hover:opacity-100"
                      title="Delete link"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* AI Imports & Most Studied Topics Row */}
      <div id="ai-imports-analytics-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recently Uploaded/Imported Materials */}
        <div id="recently-uploaded-materials-card" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h2 className="text-lg font-display font-medium text-white flex items-center gap-2">
                <FileText size={18} className="text-indigo-400" />
                <span>Recently Uploaded Materials</span>
              </h2>
              <button 
                onClick={() => onNavigate('import' as any)}
                className="text-xs text-indigo-405 hover:text-indigo-300 font-sans flex items-center gap-1 cursor-pointer"
              >
                <span>Upload System</span>
                <ChevronRight size={12} />
              </button>
            </div>

            {recentUploads.length === 0 ? (
              <div className="text-center py-8 text-slate-505 italic space-y-2 flex flex-col items-center justify-center">
                <UploadCloud size={28} className="text-slate-600 animate-pulse" />
                <p className="text-xs">No academic documents imported yet.</p>
                <button
                  onClick={() => onNavigate('import' as any)}
                  className="mt-3 text-xs font-semibold px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/20 rounded-lg text-white transition cursor-pointer"
                >
                  Import Syllabus PDF
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentUploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="p-3 bg-slate-900/40 border border-white/5 rounded-xl flex items-center justify-between hover:bg-slate-900/60 transition"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
                        <FileText size={14} />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold text-white truncate">{upload.title}</h4>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {upload.fileName} • {upload.topicsCount} subjects parsed
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-mono text-slate-450 block">
                        {new Date(upload.timestamp).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                      </span>
                      {upload.subjectName && (
                        <span 
                          className="text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded text-white mt-1 inline-block"
                          style={{ backgroundColor: upload.subjectColor || '#6366f1' }}
                        >
                          {upload.subjectName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Most Studied Topics Analytics */}
        <div id="most-studied-topics-card" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h2 className="text-lg font-display font-medium text-white flex items-center gap-2">
                <Layers size={18} className="text-indigo-400" />
                <span>Most Studied Topics</span>
              </h2>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-350 px-2 py-0.5 rounded border border-white/5">
                Focus Analytics
              </span>
            </div>

            {studyLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 italic space-y-2 flex flex-col items-center justify-center">
                <Clock size={28} className="text-slate-600 animate-pulse" />
                <p className="text-xs">No focus session logs registered yet.</p>
                <button
                  onClick={() => onNavigate('planner')}
                  className="mt-3 text-xs font-semibold px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-650 border border-indigo-500/20 rounded-lg text-white transition cursor-pointer"
                >
                  Log a focus session
                </button>
              </div>
            ) : (
              (() => {
                // Calculation of studied subjects from real user database
                const totals: Record<string, number> = {};
                studyLogs.forEach(log => {
                  const s = (log.subject || 'General Study').trim();
                  totals[s] = (totals[s] || 0) + log.duration;
                });
                
                const sorted = Object.entries(totals)
                  .map(([name, mins]) => {
                    const matchingSub = subjects.find(s => s.name.toLowerCase() === name.toLowerCase() || s.code?.toLowerCase() === name.toLowerCase());
                    return {
                      name,
                      minutes: mins,
                      color: matchingSub?.color || '#a855f7'
                    };
                  })
                  .sort((a, b) => b.minutes - a.minutes)
                  .slice(0, 4);

                const maxMinutes = Math.max(...sorted.map(s => s.minutes), 1);

                return (
                  <div className="space-y-4">
                    {sorted.map((item, index) => (
                      <div key={index} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200 truncate pr-2">{item.name}</span>
                          <span className="text-[10px] font-mono text-indigo-300 font-bold shrink-0">
                            {item.minutes} mins study
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${item.color && !item.color.startsWith('#') ? item.color : ''}`}
                            style={{ 
                              width: `${(item.minutes / maxMinutes) * 100}%`,
                              backgroundColor: item.color && item.color.startsWith('#') ? item.color : undefined
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        </div>

      </div>

      {/* AI Tutor Insights & Activity Panel */}
      <div id="ai-tutor-insights-panel" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
              <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-display font-medium text-white tracking-wide">🧠 AI Study Tutor Insights</h2>
              <p className="text-xs text-slate-400 font-sans">Track your recent session conversations, frequently studied chapters, and smart recall shortcuts</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => onNavigate('tutor')}
            className="text-xs font-semibold py-1.5 px-3.5 rounded-lg bg-indigo-650 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 text-white transition flex items-center gap-1 cursor-pointer"
          >
            <span>Open AI Tutor</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Tutor Sessions Column */}
          <div className="space-y-3 bg-white/2 border border-white/5 p-4 rounded-xl">
            <h3 className="text-xs uppercase font-mono tracking-wider text-purple-300 font-bold flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Clock size={12} /> Recent Conversations
            </h3>
            {recentTutorSessions.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-1">
                <p className="italic">No tutor conversations found.</p>
                <button
                  onClick={() => onNavigate('tutor')}
                  className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                >
                  Start study chat with AI Tutor &rarr;
                </button>
              </div>
            ) : (
              <div className="space-y-2 mt-2">
                {recentTutorSessions.map((session) => (
                  <div 
                    key={session.id} 
                    onClick={() => onNavigate('tutor')}
                    className="p-3 bg-slate-900/40 hover:bg-slate-900/70 border border-white/5 hover:border-indigo-505/30 rounded-xl transition text-left cursor-pointer flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <h4 className="text-xs font-semibold text-white truncate">{session.title}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(session.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • {session.messages?.length || 0} msgs
                      </p>
                    </div>
                    <span className="text-[9px] uppercase font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded border border-indigo-500/20 shrink-0">
                      {session.mode}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Frequently Studied Topics Column */}
          <div className="space-y-3 bg-white/2 border border-white/5 p-4 rounded-xl">
            <h3 className="text-xs uppercase font-mono tracking-wider text-amber-300 font-bold flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Star size={12} className="text-amber-400 fill-amber-400/20" /> Frequently Studied Topics
            </h3>
            {frequentTopics.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center italic">
                Choose a priority subject to start generating AI insights.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {frequentTopics.map((topic, i) => (
                  <div 
                    key={i}
                    onClick={() => onNavigate('tutor')}
                    className="p-3 bg-indigo-500/5 hover:bg-indigo-500/15 border border-indigo-500/10 hover:border-indigo-505/30 rounded-xl transition text-left cursor-pointer flex flex-col justify-between"
                  >
                    <span className="text-xs font-semibold text-white truncate my-1">&ldquo;{topic}&rdquo;</span>
                    <span className="text-[9px] text-indigo-400 font-mono mt-2 self-start flex items-center gap-1">
                      Study Topic <ChevronRight size={10} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Study Materials Bento Block Section */}
      <div id="recent-study-materials-panel" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-display font-medium text-white tracking-wide">📚 Recent Study Materials</h2>
              <p className="text-xs text-slate-400 font-sans">Quick-access reference panel for your note cards, flashcards, and recall quizzes</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => onNavigate('library')}
            className="text-xs font-semibold py-1.5 px-3 rounded-lg bg-indigo-550 border border-indigo-400/20 text-indigo-100 hover:text-white hover:bg-indigo-600 transition flex items-center gap-1 cursor-pointer"
          >
            <span>Open Study Library</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Notes column */}
          <div className="space-y-3 bg-white/2 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xs uppercase font-mono tracking-wider text-amber-300 font-bold flex items-center gap-1.5 border-b border-white/5 pb-2">
                <FileText size={12} /> Notes & Study Guides
              </h3>
              {recentNotes.length === 0 ? (
                <p className="text-[11px] text-slate-500 py-6 text-center italic">No pasted notes found yet.</p>
              ) : (
                <div className="space-y-2 mt-2">
                  {recentNotes.map((note) => {
                    const noteSubject = subjects.find(s => s.id === note.subjectId);
                    return (
                      <div key={note.id} className="p-2.5 bg-slate-900/40 rounded-lg hover:bg-slate-900/60 transition text-left">
                        <h4 className="text-xs font-semibold text-white truncate">{note.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-mono text-slate-500">{note.content ? `${Math.round(note.content.length / 5)} words` : '0 words'}</span>
                          {noteSubject && (
                            <span 
                              className={`text-[8px] font-bold text-white px-1.5 py-0.5 rounded truncate max-w-[80px] ${!noteSubject.color?.startsWith('#') ? noteSubject.color : ''}`}
                              style={noteSubject.color?.startsWith('#') ? { backgroundColor: noteSubject.color } : undefined}
                            >
                              {noteSubject.name}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              onClick={() => onNavigate('recall')}
              className="w-full mt-3 py-1.5 bg-indigo-550/30 hover:bg-indigo-550 border border-indigo-500/10 hover:border-indigo-550 text-indigo-200 hover:text-white rounded-lg text-center text-[10px] font-bold transition cursor-pointer"
            >
              Open Recall Hub
            </button>
          </div>

          {/* Flashcards column */}
          <div className="space-y-3 bg-white/2 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xs uppercase font-mono tracking-wider text-indigo-300 font-bold flex items-center gap-1.5 border-b border-white/5 pb-2">
                <Layers size={12} /> Flashcards
              </h3>
              {recentFlashcards.length === 0 ? (
                <p className="text-[11px] text-slate-500 py-6 text-center italic">No flashcards created yet.</p>
              ) : (
                <div className="space-y-2 mt-2">
                  {recentFlashcards.map((fc, i) => (
                    <div key={fc.id || i} className="p-2.5 bg-slate-900/40 rounded-lg hover:bg-slate-900/60 transition text-left">
                      <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">{fc.front}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">&rarr; {fc.back}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => onNavigate('library')}
              className="w-full mt-3 py-1.5 bg-indigo-550/30 hover:bg-indigo-550 border border-indigo-500/10 hover:border-indigo-550 text-indigo-200 hover:text-white rounded-lg text-center text-[10px] font-bold transition cursor-pointer"
            >
              Study Library Grid
            </button>
          </div>

          {/* Quizzes column */}
          <div className="space-y-3 bg-white/2 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xs uppercase font-mono tracking-wider text-emerald-300 font-bold flex items-center gap-1.5 border-b border-white/5 pb-2">
                <BookOpen size={12} /> Recall Quizzes
              </h3>
              {recentQuizzes.length === 0 ? (
                <p className="text-[11px] text-slate-500 py-6 text-center italic">No quizzes generated yet.</p>
              ) : (
                <div className="space-y-2 mt-2">
                  {recentQuizzes.map((qz, i) => (
                    <div key={qz.id || i} className="p-2.5 bg-slate-900/40 rounded-lg hover:bg-slate-900/60 transition text-left">
                      <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">{qz.question}</h4>
                      <p className="text-[9px] text-emerald-305 font-medium mt-1 font-mono">Options: {qz.options?.length || 4}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => onNavigate('recall')}
              className="w-full mt-3 py-1.5 bg-indigo-550/30 hover:bg-indigo-550 border border-indigo-500/10 hover:border-indigo-550 text-indigo-200 hover:text-white rounded-lg text-[10px] font-bold transition cursor-pointer text-center"
            >
              Generate Quizzes
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
