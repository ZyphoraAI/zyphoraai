import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Clock, User, MapPin, Plus, Trash2, Edit2,
  Hourglass, LogIn, ChevronRight, BookOpen, AlertOctagon, Timer,
  Bookmark, CheckCircle2, Award, FolderHeart, CalendarDays, LucideIcon
} from 'lucide-react';
import { ScheduleItem, ExamCountdown, StudyLog, DayOfWeek, Subject, StudySession } from '../types';

interface StudyPlannerViewProps {
  schedule: ScheduleItem[];
  exams: ExamCountdown[];
  studyLogs: StudyLog[];
  addScheduleItem: (item: Omit<ScheduleItem, 'id'>) => void;
  deleteScheduleItem: (id: string) => void;
  addExam: (exam: Omit<ExamCountdown, 'id'>) => void;
  deleteExam: (id: string) => void;
  addStudyLog: (log: Omit<StudyLog, 'id' | 'date'>) => void;
  deleteStudyLog: (id: string) => void;
  subjects: Subject[];
  studySessions: StudySession[];
  addSubject: (name: string, color: string, code?: string) => void;
  updateSubject?: (id: string, name: string, color: string, code?: string) => void;
  deleteSubject: (id: string) => void;
  addStudySession: (session: Omit<StudySession, 'id'>) => void;
  deleteStudySession: (id: string) => void;
  toggleStudySessionCompleted: (id: string) => void;
  activeTabProp?: 'sessions' | 'subjects' | 'timetable' | 'exams' | 'logs';
}

const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function StudyPlannerView({
  schedule,
  exams,
  studyLogs,
  addScheduleItem,
  deleteScheduleItem,
  addExam,
  deleteExam,
  addStudyLog,
  deleteStudyLog,
  subjects,
  studySessions,
  addSubject,
  updateSubject,
  deleteSubject,
  addStudySession,
  deleteStudySession,
  toggleStudySessionCompleted,
  activeTabProp
}: StudyPlannerViewProps) {
  // Tabs for subcomponents
  const [plannerTab, setPlannerTab] = useState<'sessions' | 'subjects' | 'timetable' | 'exams' | 'logs'>(() => {
    const saved = localStorage.getItem('planner_active_tab');
    if (saved) {
      localStorage.removeItem('planner_active_tab');
      return saved as any;
    }
    return 'sessions';
  });

  // Sync tab change from outside
  useEffect(() => {
    if (activeTabProp) {
      setPlannerTab(activeTabProp);
    }
  }, [activeTabProp]);

  // Interactive selected day for class scheduler on mobile
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');

  // New states for study sessions
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessTitle, setSessTitle] = useState('');
  const [sessSubjectId, setSessSubjectId] = useState('');
  const [sessDate, setSessDate] = useState('');
  const [sessDuration, setSessDuration] = useState(45);

  // New states for subjects
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [subjName, setSubjName] = useState('');
  const [subjColor, setSubjColor] = useState('bg-indigo-500');
  const [subjCode, setSubjCode] = useState('');
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const handleStartEditSubject = (sub: Subject) => {
    setEditingSubject(sub);
    setSubjName(sub.name);
    setSubjColor(sub.color);
    setSubjCode(sub.code || '');
    setShowSubjectForm(true);
  };

  const handleCancelSubjectEdit = () => {
    setEditingSubject(null);
    setSubjName('');
    setSubjCode('');
    setSubjColor('bg-indigo-500');
    setShowSubjectForm(false);
  };

  // Timetable Form State
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [schedSubject, setSchedSubject] = useState('');
  const [schedDay, setSchedDay] = useState<DayOfWeek>('Monday');
  const [schedStart, setSchedStart] = useState('09:00');
  const [schedEnd, setSchedEnd] = useState('10:30');
  const [schedLocation, setSchedLocation] = useState('');
  const [schedProf, setSchedProf] = useState('');

  // Exam Form State
  const [showExamForm, setShowExamForm] = useState(false);
  const [examSubject, setExamSubject] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');

  // Settle Logging state
  const [showLogForm, setShowLogForm] = useState(false);
  const [logSubject, setLogSubject] = useState('');
  const [logDuration, setLogDuration] = useState(45);
  const [logNotes, setLogNotes] = useState('');

  // Handlers
  const handleSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjName.trim()) return;

    if (editingSubject && updateSubject) {
      updateSubject(editingSubject.id, subjName.trim(), subjColor, subjCode.trim() || undefined);
      setEditingSubject(null);
    } else {
      addSubject(subjName.trim(), subjColor, subjCode.trim() || undefined);
    }

    setSubjName('');
    setSubjCode('');
    setSubjColor('bg-indigo-500');
    setShowSubjectForm(false);
  };

  const handleStudySessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessTitle.trim() || !sessSubjectId || !sessDate) return;

    // Resolve subject name from id
    const resolvedSubjName = subjects.find(s => s.id === sessSubjectId)?.name || 'Study Session';

    addStudySession({
      subjectId: sessSubjectId,
      subjectName: resolvedSubjName,
      title: sessTitle.trim(),
      date: sessDate,
      duration: sessDuration,
      completed: false
    });

    setSessTitle('');
    setSessSubjectId('');
    setSessDate('');
    setSessDuration(45);
    setShowSessionForm(false);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedSubject.trim()) return;

    addScheduleItem({
      subject: schedSubject.trim(),
      dayOfWeek: schedDay,
      startTime: schedStart,
      endTime: schedEnd,
      location: schedLocation.trim() || undefined,
      professor: schedProf.trim() || undefined
    });

    setSchedSubject('');
    setSchedLocation('');
    setSchedProf('');
    setShowScheduleForm(false);
  };

  const handleExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examSubject.trim() || !examTitle.trim() || !examDate) return;

    addExam({
      subject: examSubject.trim(),
      title: examTitle.trim(),
      date: examDate,
      time: examTime || undefined
    });

    setExamSubject('');
    setExamTitle('');
    setExamDate('');
    setExamTime('');
    setShowExamForm(false);
  };

  const handleStudyLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logSubject.trim()) return;

    addStudyLog({
      subject: logSubject.trim(),
      duration: logDuration,
      notes: logNotes.trim() || undefined
    });

    setLogSubject('');
    setLogDuration(45);
    setLogNotes('');
    setShowLogForm(false);
  };

  // Days calculations
  const calculateDaysLeft = (dateStr: string) => {
    const examDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div id="study-planner-container" className="space-y-6">
      
      {/* Tab select header bar */}
      <div id="planner-sub-navigation-tabs" className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-4">
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900/50 border border-white/5 rounded-2xl">
          <button
            id="planner-tab-sessions"
            onClick={() => setPlannerTab('sessions')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1 ${
              plannerTab === 'sessions' ? 'bg-indigo-650 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            🗓️ Study Planner
          </button>
          <button
            id="planner-tab-subjects"
            onClick={() => setPlannerTab('subjects')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1 ${
              plannerTab === 'subjects' ? 'bg-indigo-650 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            🗂️ Course Subjects
          </button>
          <button
            id="planner-tab-timetable"
            onClick={() => setPlannerTab('timetable')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1 ${
              plannerTab === 'timetable' ? 'bg-indigo-650 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            🏫 Weekly Schedule
          </button>
          <button
            id="planner-tab-exams"
            onClick={() => setPlannerTab('exams')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1 ${
              plannerTab === 'exams' ? 'bg-indigo-650 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            🔔 Exams & Countdowns
          </button>
          <button
            id="planner-tab-logs"
            onClick={() => setPlannerTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1 ${
              plannerTab === 'logs' ? 'bg-indigo-650 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            ✍️ Study Logbook
          </button>
        </div>

        {/* Dynamic button corresponding to the current state form */}
        <div className="self-end md:self-auto">
          {plannerTab === 'sessions' && (
            <button
              id="btn-trigger-add-session"
              onClick={() => setShowSessionForm(!showSessionForm)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            >
              <Plus size={14} /> Plan Session
            </button>
          )}
          {plannerTab === 'subjects' && (
            <button
              id="btn-trigger-add-subject"
              onClick={() => setShowSubjectForm(!showSubjectForm)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            >
              <Plus size={14} /> Create Subject
            </button>
          )}
          {plannerTab === 'timetable' && (
            <button
              id="btn-trigger-add-lecture"
              onClick={() => setShowScheduleForm(!showScheduleForm)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Add Class
            </button>
          )}
          {plannerTab === 'exams' && (
            <button
              id="btn-trigger-add-exam"
              onClick={() => setShowExamForm(!showExamForm)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Register Exam
            </button>
          )}
          {plannerTab === 'logs' && (
            <button
              id="btn-trigger-add-log"
              onClick={() => setShowLogForm(!showLogForm)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Register Log
            </button>
          )}
        </div>
      </div>

      {/* Main interactive layouts based on active tab */}
      <div>
        
        {/* TAB 0: STUDY PLANNER / SESSIONS */}
        {plannerTab === 'sessions' && (
          <div className="space-y-6">
            
            {/* Session Plan Form */}
            <AnimatePresence>
              {showSessionForm && (
                <motion.form
                  id="add-session-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleStudySessionSubmit}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl space-y-4 overflow-hidden text-xs"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="text-sm font-display font-semibold text-indigo-300">Schedule a Planned Study Session</h3>
                    <button 
                      type="button" 
                      onClick={() => setShowSessionForm(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      Dismiss
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="session-title-input" className="text-slate-355 font-medium">Session Goal / Title</label>
                      <input
                        id="session-title-input"
                        type="text"
                        placeholder="e.g. Practice thermodynamics problem set"
                        value={sessTitle}
                        onChange={(e) => setSessTitle(e.target.value)}
                        required
                        className="bg-slate-900/50 border border-white/10 p-2.5 rounded-xl text-white focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="session-subject-select" className="text-slate-355 font-medium">Subject Module</label>
                      {subjects.length === 0 ? (
                        <div className="flex items-center gap-2 border border-dashed border-red-500/30 bg-red-500/5 rounded-xl p-2 text-rose-300">
                          <span>Please create a subject first under the Course Subjects tab!</span>
                        </div>
                      ) : (
                        <select
                          id="session-subject-select"
                          value={sessSubjectId}
                          onChange={(e) => setSessSubjectId(e.target.value)}
                          required
                          className="bg-slate-900/50 border border-white/10 p-2.5 rounded-xl text-white focus:outline-none"
                        >
                          <option value="">-- Choose Subject --</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.code ? `[${s.code}] ` : ''}{s.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="session-date-input" className="text-slate-355 font-medium">Planned Date</label>
                      <input
                        id="session-date-input"
                        type="date"
                        value={sessDate}
                        onChange={(e) => setSessDate(e.target.value)}
                        required
                        className="bg-slate-900/50 border border-white/10 p-2.5 rounded-xl text-white focus:outline-none font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="session-duration-input" className="text-slate-355 font-medium">Duration (Minutes)</label>
                      <div className="flex items-center gap-2">
                        <input
                          id="session-duration-input"
                          type="number"
                          min="5"
                          max="480"
                          value={sessDuration}
                          onChange={(e) => setSessDuration(Number(e.target.value))}
                          required
                          className="bg-slate-900/50 border border-white/10 p-2.5 rounded-xl text-white focus:outline-none font-mono flex-grow"
                        />
                        <span className="text-slate-400 font-mono">mins</span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        {[25, 45, 60, 90].map(mins => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setSessDuration(mins)}
                            className={`px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-355 rounded cursor-pointer ${sessDuration === mins ? 'border border-indigo-500 bg-indigo-650 text-white' : 'border-transparent'}`}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 text-xs pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setShowSessionForm(false)}
                      className="px-4 py-2 border border-white/10 text-slate-300 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={subjects.length === 0}
                      className="px-4 py-2 bg-indigo-600 rounded-xl font-bold text-white shadow hover:bg-indigo-550 disabled:opacity-50 cursor-pointer"
                    >
                      Save Session
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Session stats indicator bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Structured Sessions</span>
                  <p className="text-xl font-bold text-white mt-1">
                    {studySessions.filter(s => !s.completed).length} Scheduled
                  </p>
                </div>
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <CalendarDays size={18} />
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Focus Commitment</span>
                  <p className="text-xl font-bold text-white mt-1">
                    {(studySessions.filter(s => !s.completed).reduce((sum, s) => sum + s.duration, 0) / 60).toFixed(1)} hrs
                  </p>
                </div>
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Hourglass size={18} />
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-sans">Sessions Achieved</span>
                  <p className="text-xl font-bold text-emerald-400 mt-1">
                    {studySessions.filter(s => s.completed).length} Completed
                  </p>
                </div>
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <CheckCircle2 size={18} />
                </div>
              </div>
            </div>

            {/* Calendar View: Display upcoming study sessions sorted by nearest date */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2">
                  <Bookmark size={16} className="text-indigo-400" />
                  <span>Calendar Queue / Upcoming Study Sessions</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">Sorted by nearest date</span>
              </div>

              {/* Sorted Upcoming items */}
              {studySessions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 border border-dashed border-white/5 rounded-2xl bg-white/2">
                  <FolderHeart size={36} className="mx-auto text-slate-500 mb-2 animate-pulse" />
                  <p className="text-sm font-sans font-medium">Your study planner schedule is currently empty.</p>
                  <p className="text-xs text-slate-500 mt-1 font-sans">Plan lessons or milestones to keep up consistency!</p>
                  <button
                    onClick={() => setShowSessionForm(true)}
                    className="mt-4 px-4 py-2 bg-indigo-600/30 hover:bg-indigo-650 border border-indigo-500/20 text-white rounded-xl text-xs font-bold font-sans transition cursor-pointer"
                  >
                    Schedule a session now
                  </button>
                </div>
              ) : (
                <div id="planner-calendar-sorted-list" className="space-y-2.5">
                  {[...studySessions]
                    .sort((a, b) => a.date.localeCompare(b.date)) // Sort nearest first
                    .map(session => {
                      const subjectColorClass = subjects.find(s => s.id === session.subjectId)?.color || 'bg-indigo-650';
                      const isToday = session.date === new Date().toISOString().split('T')[0];
                      
                      return (
                        <div
                          key={session.id}
                          className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            session.completed
                              ? 'bg-emerald-500/5 border-emerald-500/15 text-slate-400'
                              : isToday
                              ? 'bg-indigo-500/5 border-indigo-455 shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                              : 'bg-slate-905/40 border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Interactive Completed Check */}
                            <button
                              id={`btn-complete-sess-${session.id}`}
                              onClick={() => toggleStudySessionCompleted(session.id)}
                              className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center font-bold text-xs select-none cursor-pointer transition ${
                                session.completed
                                  ? 'bg-emerald-500 border-transparent text-white'
                                  : 'border-white/30 text-transparent hover:border-indigo-400'
                              }`}
                              title={session.completed ? 'Mark incomplete' : 'Mark completed'}
                            >
                              ✓
                            </button>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span 
                                  className={`text-[9px] uppercase tracking-wider font-semibold font-mono px-2 py-0.5 rounded text-white ${!subjectColorClass?.startsWith('#') ? subjectColorClass : ''}`}
                                  style={subjectColorClass?.startsWith('#') ? { backgroundColor: subjectColorClass } : undefined}
                                >
                                  {session.subjectName}
                                </span>
                                {isToday && (
                                  <span className="text-[10px] uppercase font-bold text-indigo-305 font-mono animate-pulse">
                                    ● Today
                                  </span>
                                )}
                              </div>
                              <h4 className={`text-sm font-sans font-semibold mt-1 ${session.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                                {session.title}
                              </h4>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-6 text-xs font-mono font-medium self-stretch sm:self-auto border-t sm:border-t-0 border-white/5 pt-2.5 sm:pt-0">
                            <div className="text-left sm:text-right">
                              <span className="block text-[10px] text-slate-400 font-sans">Date scheduled:</span>
                              <span className="text-white font-mono">{session.date}</span>
                            </div>
                            <div className="text-left sm:text-right">
                              <span className="block text-[10px] text-slate-400 font-sans">Focus commitment:</span>
                              <span className="text-indigo-350">{session.duration} mins ({(session.duration / 60).toFixed(1)}h)</span>
                            </div>
                            <button
                              id={`btn-delete-session-${session.id}`}
                              onClick={() => deleteStudySession(session.id)}
                              className="p-2 bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition cursor-pointer"
                              title="Delete planned session"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 0.1: COURSE SUBJECTS */}
        {plannerTab === 'subjects' && (
          <div className="space-y-6">
            
            {/* Subject Add Form */}
            <AnimatePresence>
              {showSubjectForm && (
                <motion.form
                  id="add-subject-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleSubjectSubmit}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl space-y-4 overflow-hidden text-xs"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="text-sm font-display font-semibold text-indigo-300">
                      {editingSubject ? 'Modify Academic Course Module / Subject' : 'Create Academic Course Module / Subject'}
                    </h3>
                    <button 
                      type="button" 
                      onClick={handleCancelSubjectEdit}
                      className="text-slate-400 hover:text-white"
                    >
                      Dismiss
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="subject-name-input" className="text-slate-355 font-medium">Subject Name</label>
                      <input
                        id="subject-name-input"
                        type="text"
                        placeholder="e.g. AI & Machine Learning Foundations"
                        value={subjName}
                        onChange={(e) => setSubjName(e.target.value)}
                        required
                        className="bg-slate-900/50 border border-white/10 p-2.5 rounded-xl text-white focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="subject-code-input" className="text-slate-355 font-medium">Course Code (Optional)</label>
                      <input
                        id="subject-code-input"
                        type="text"
                        placeholder="e.g. CS-440"
                        value={subjCode}
                        onChange={(e) => setSubjCode(e.target.value)}
                        className="bg-slate-900/50 border border-white/10 p-2.5 rounded-xl text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-slate-355 font-medium">Course Color Theme Label</label>
                    <div className="flex flex-wrap gap-2.5 p-3.5 bg-slate-900/40 rounded-2xl border border-white/5">
                      {[
                        { bg: 'bg-indigo-500', label: 'Indigo' },
                        { bg: 'bg-teal-500', label: 'Teal' },
                        { bg: 'bg-pink-500', label: 'Pink' },
                        { bg: 'bg-sky-500', label: 'Sky' },
                        { bg: 'bg-purple-500', label: 'Purple' },
                        { bg: 'bg-amber-500', label: 'Amber' },
                        { bg: 'bg-rose-500', label: 'Rose' },
                        { bg: 'bg-emerald-500', label: 'Emerald' }
                      ].map((preset) => {
                        const active = subjColor === preset.bg;
                        return (
                          <button
                            key={preset.bg}
                            type="button"
                            onClick={() => setSubjColor(preset.bg)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 ${
                              active
                                ? 'bg-indigo-650 border border-indigo-400/30 text-white shadow'
                                : 'bg-white/5 text-slate-400 hover:text-white border-transparent'
                            }`}
                          >
                            <span className={`w-2.5 h-2.5 rounded-full ${preset.bg}`}></span>
                            <span>{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 text-xs pt-1">
                    <button
                      type="button"
                      onClick={handleCancelSubjectEdit}
                      className="px-4 py-2 border border-white/10 text-slate-300 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 rounded-xl font-bold text-white shadow hover:bg-indigo-550"
                    >
                      {editingSubject ? 'Save Changes' : 'Create Subject'}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* List custom subjects inside beautiful frosted bento grid */}
            {subjects.length === 0 ? (
              <div className="py-12 bg-white/5 border border-white/10 rounded-3xl text-center text-slate-400">
                <FolderHeart size={44} className="mx-auto text-slate-500 mb-2" />
                <p className="text-sm font-sans font-medium">No Course Subjects created yet.</p>
                <p className="text-xs text-slate-500 mt-1 font-sans">Define subjects to easily catalog sessions, lectures, and logs.</p>
                <button
                  type="button"
                  onClick={() => setShowSubjectForm(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600/30 hover:bg-indigo-650 border border-indigo-550 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Create your first subject
                </button>
              </div>
            ) : (
              <div id="course-subjects-bento-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((s) => {
                  // Calculate sessions scheduled per this subject
                  const subSessions = studySessions.filter((sess) => sess.subjectId === s.id);
                  const subPlannedDuration = subSessions.filter((sess) => !sess.completed).reduce((sum, sess) => sum + sess.duration, 0);
                  const subCompletedCount = subSessions.filter((sess) => sess.completed).length;

                  return (
                    <div
                      key={s.id}
                      className="relative overflow-hidden bg-white/5 border border-white/10 hover:border-white/15 rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-44 group transition-all"
                    >
                      {/* Colored top bar accent */}
                      <div 
                        className={`absolute top-0 left-0 right-0 h-1.5 ${!s.color?.startsWith('#') ? s.color : ''}`}
                        style={s.color?.startsWith('#') ? { backgroundColor: s.color } : undefined}
                      ></div>

                      <div className="space-y-2 col-span-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="overflow-hidden">
                            {s.code && (
                              <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                                {s.code}
                              </span>
                            )}
                            <h4 className="text-sm font-sans font-bold text-white mt-2 truncate group-hover:text-indigo-305 transition">
                              {s.name}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              id={`btn-edit-subj-${s.id}`}
                              onClick={() => handleStartEditSubject(s)}
                              className="bg-white/5 hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-400 p-2 rounded-lg transition cursor-pointer"
                              title="Edit Subject Name / Code"
                            >
                              <Edit2 size={11} />
                            </button>
                            <button
                              id={`btn-delete-subj-${s.id}`}
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${s.name}"? This will delete all scheduled sessions associated with it.`)) {
                                  deleteSubject(s.id);
                                }
                              }}
                              className="bg-white/5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 p-2 rounded-lg transition cursor-pointer"
                              title="Delete subject"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-3.5 mt-3 grid grid-cols-2 gap-2 text-xs font-mono font-medium">
                        <div>
                          <span className="block text-[9px] text-slate-400 font-sans uppercase">Planned Study</span>
                          <span className="text-indigo-350">
                            {subPlannedDuration} mins ({(subPlannedDuration / 60).toFixed(1)}h)
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-400 font-sans uppercase">Completed sessions</span>
                          <span className="text-emerald-305">
                            {subCompletedCount} sessions
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 1: WEEKLY TIMETABLE */}
        {plannerTab === 'timetable' && (
          <div className="space-y-6">
            
            {/* Pop/Drop Form for Schedule block */}
            <AnimatePresence>
              {showScheduleForm && (
                <motion.form
                  id="add-class-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleScheduleSubmit}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl space-y-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="text-sm font-display font-semibold text-indigo-300">Schedule Class Lecture</h3>
                    <button 
                      type="button" 
                      onClick={() => setShowScheduleForm(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      Dismiss
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <label htmlFor="sched-subject" className="text-slate-355 font-medium">Class / Subject Name</label>
                      <input
                        id="sched-subject"
                        type="text"
                        placeholder="e.g. Advanced Physics"
                        value={schedSubject}
                        onChange={(e) => setSchedSubject(e.target.value)}
                        required
                        className="bg-slate-900/50 border border-white/10 p-2.5 rounded-xl text-white focus:outline-none"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1 text-xs">
                      <label htmlFor="sched-day" className="text-slate-355 font-medium">Day of the Week</label>
                      <select
                        id="sched-day"
                        value={schedDay}
                        onChange={(e) => setSchedDay(e.target.value as DayOfWeek)}
                        className="bg-slate-900/50 border border-white/10 p-2.5 rounded-xl text-white focus:outline-none"
                      >
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex flex-col gap-1">
                        <label htmlFor="sched-start" className="text-slate-355 font-medium">Start Time</label>
                        <input
                          id="sched-start"
                          type="time"
                          value={schedStart}
                          onChange={(e) => setSchedStart(e.target.value)}
                          required
                          className="bg-slate-900/50 border border-white/10 p-2.5 rounded-xl text-white focus:outline-none font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label htmlFor="sched-end" className="text-slate-355 font-medium">End Time</label>
                        <input
                          id="sched-end"
                          type="time"
                          value={schedEnd}
                          onChange={(e) => setSchedEnd(e.target.value)}
                          required
                          className="bg-slate-900/50 border border-white/10 p-2.5 rounded-xl text-white focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <label htmlFor="sched-location" className="text-slate-355 font-medium">Location (Room / Hall / Lab)</label>
                      <input
                        id="sched-location"
                        type="text"
                        placeholder="e.g. Science Auditorium D"
                        value={schedLocation}
                        onChange={(e) => setSchedLocation(e.target.value)}
                        className="bg-slate-900/50 border border-white/10 p-2.5 rounded-xl text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <label htmlFor="sched-prof" className="text-slate-355 font-medium">Professor / Instructor</label>
                      <input
                        id="sched-prof"
                        type="text"
                        placeholder="e.g. Dr. Ernest Rutherford"
                        value={schedProf}
                        onChange={(e) => setSchedProf(e.target.value)}
                        className="bg-slate-900/50 border border-white/10 p-2.5 rounded-xl text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setShowScheduleForm(false)}
                      className="px-4 py-2 border border-white/10 text-slate-300 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 rounded-xl font-bold text-white shadow hover:bg-indigo-550"
                    >
                      Schedule
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Desktop Full Weekly Grid View (Densely optimized layout) */}
            <div className="hidden lg:grid grid-cols-7 gap-3">
              {DAYS_OF_WEEK.map((day) => {
                const dayClasses = schedule
                  .filter((c) => c.dayOfWeek === day)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));
                
                return (
                  <div key={day} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col justify-start min-h-[350px]">
                    <div className="border-b border-white/10 pb-2 mb-3 text-center">
                      <span className="text-xs font-display font-semibold uppercase tracking-wide text-indigo-300">{day}</span>
                      <span className="block text-[10px] font-mono text-slate-500">{dayClasses.length} Scheduled</span>
                    </div>

                    <div className="space-y-2 flex-grow overflow-y-auto">
                      {dayClasses.map((item) => (
                        <div 
                          key={item.id} 
                          id={`sched-item-${item.id}`}
                          className="bg-slate-900/40 border border-white/5 hover:border-indigo-500/20 p-2.5 rounded-xl relative group text-xs text-left"
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-semibold text-white truncate text-xs">{item.subject}</span>
                            <button
                              id={`delete-class-${item.id}`}
                              onClick={() => deleteScheduleItem(item.id)}
                              className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-0.5 rounded"
                              title="Remove class"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-1 text-[10px] text-indigo-300 font-mono mt-1.5">
                            <Clock size={10} />
                            <span>{item.startTime} - {item.endTime}</span>
                          </div>

                          {item.location && (
                            <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-1 truncate">
                              <MapPin size={9} />
                              <span className="truncate">{item.location}</span>
                            </div>
                          )}

                          {item.professor && (
                            <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-0.5 truncate">
                              <User size={9} />
                              <span className="truncate">{item.professor}</span>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {dayClasses.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-10">
                          <BookOpen size={18} className="text-slate-450 mb-1" />
                          <span className="text-[10px] font-mono">No Classes</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Column Tabs view (Fits small frames elegantly) */}
            <div className="lg:hidden space-y-4">
              <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-none">
                {DAYS_OF_WEEK.map((day) => {
                  const active = selectedDay === day;
                  const count = schedule.filter((c) => c.dayOfWeek === day).length;
                  return (
                    <button
                      key={day}
                      id={`day-tab-${day.toLowerCase()}`}
                      onClick={() => setSelectedDay(day)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                        active 
                          ? 'bg-indigo-600 border border-indigo-500 text-white font-medium' 
                          : 'bg-white/5 border border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{day.substring(0, 3)}</span>
                      {count > 0 && <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded-full">{count}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Day items list */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[220px]">
                <h4 className="border-b border-white/10 pb-2 mb-3 text-xs uppercase tracking-wider font-mono text-slate-400">
                  Lectures for {selectedDay}
                </h4>

                <div className="space-y-2">
                  {schedule
                    .filter((c) => c.dayOfWeek === selectedDay)
                    .sort((a,b) => a.startTime.localeCompare(b.startTime))
                    .map((item) => (
                      <div 
                        key={item.id}
                        id={`mob-sched-item-${item.id}`} 
                        className="bg-slate-900/30 border border-white/5 p-3.5 rounded-xl flex items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 mt-0.5">
                            <BookOpen size={16} />
                          </div>
                          <div>
                            <span className="font-semibold text-white text-sm">{item.subject}</span>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                              <span className="flex items-center gap-1"><Clock size={11} /> {item.startTime} - {item.endTime}</span>
                              {item.location && <span className="flex items-center gap-1"><MapPin size={11} /> {item.location}</span>}
                              {item.professor && <span className="flex items-center gap-1"><User size={11} /> {item.professor}</span>}
                            </div>
                          </div>
                        </div>

                        <button 
                          id={`delete-class-mob-${item.id}`}
                          onClick={() => deleteScheduleItem(item.id)}
                          className="hover:bg-red-500/20 text-slate-500 hover:text-red-400 p-2 rounded-xl transition flex-shrink-0"
                          title="Remove class"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}

                  {schedule.filter((c) => c.dayOfWeek === selectedDay).length === 0 && (
                    <div className="py-12 text-center text-slate-400">
                      <p className="text-sm">No classes scheduled for {selectedDay}.</p>
                      <button
                        onClick={() => setShowScheduleForm(true)}
                        className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold"
                      >
                        Schedule first lecture
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: EXAMS & COUNTER BOARDS */}
        {plannerTab === 'exams' && (
          <div className="space-y-6">
            
            {/* Pop Form for Exams */}
            <AnimatePresence>
              {showExamForm && (
                <motion.form
                  id="add-exam-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleExamSubmit}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl space-y-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="text-sm font-display font-semibold text-indigo-300">Log Upcoming Major Exam</h3>
                    <button 
                      type="button" 
                      onClick={() => setShowExamForm(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Dismiss
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <label htmlFor="exam-subject-input" className="text-slate-355 font-medium">Subject / Course Code</label>
                      <input
                        id="exam-subject-input"
                        type="text"
                        placeholder="e.g. Calculus II"
                        value={examSubject}
                        onChange={(e) => setExamSubject(e.target.value)}
                        required
                        className="bg-slate-900/50 border border-white/10 p-2.5 rounded-xl text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <label htmlFor="exam-title-input" className="text-slate-355 font-medium">Exam Description</label>
                      <input
                        id="exam-title-input"
                        type="text"
                        placeholder="e.g. Final Comprehensive Exam"
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        required
                        className="bg-slate-900/50 border border-white/10 p-2.5 rounded-xl text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <label htmlFor="exam-date-input" className="text-slate-355 font-medium">Date of Exam</label>
                      <input
                        id="exam-date-input"
                        type="date"
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                        required
                        className="bg-slate-900/50 border border-white/10 p-2.5 rounded-xl text-white focus:outline-none font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <label htmlFor="exam-time-input" className="text-slate-355 font-medium">Start Time</label>
                      <input
                        id="exam-time-input"
                        type="time"
                        value={examTime}
                        onChange={(e) => setExamTime(e.target.value)}
                        className="bg-slate-900/50 border border-white/10 p-2.5 rounded-xl text-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setShowExamForm(false)}
                      className="px-4 py-2 border border-white/10 text-slate-300 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 rounded-xl font-bold text-white shadow hover:bg-indigo-550"
                    >
                      Log Exam
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Countdown Grid (Bento columns) */}
            {exams.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center opacity-70">
                <AlertOctagon size={40} className="mx-auto text-slate-500 mb-2" />
                <p className="text-sm text-slate-400">No exams registered. Enjoy your free schedule!</p>
              </div>
            ) : (
              <div id="exams-grid-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exams.map((exam) => {
                  const daysLeft = calculateDaysLeft(exam.date);
                  const isOverdue = daysLeft < 0;
                  
                  return (
                    <div 
                      key={exam.id}
                      id={`exam-box-${exam.id}`} 
                      className={`relative overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-44 transition hover:border-white/20`}
                    >
                      {/* Gradient border indicators based on urgency */}
                      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                        isOverdue ? 'bg-slate-600' :
                        daysLeft <= 3 ? 'bg-gradient-to-r from-red-500 to-rose-400' :
                        daysLeft <= 7 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                        'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}></div>

                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono text-indigo-300 uppercase bg-indigo-500/10 px-2 py-0.5 rounded-md">
                              {exam.subject}
                            </span>
                            <h4 className="text-sm font-sans font-bold text-white mt-2 line-clamp-1">{exam.title}</h4>
                          </div>
                          <button
                            id={`delete-exam-${exam.id}`}
                            onClick={() => deleteExam(exam.id)}
                            className="bg-white/5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 p-1.5 rounded-lg transition"
                            title="Remove exam"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between border-t border-white/5 pt-3 mt-3">
                        <div className="text-xs text-slate-400 font-mono">
                          <span>Date: {exam.date}</span>
                          {exam.time && <span className="block text-[10px] text-slate-500">Time: {exam.time}</span>}
                        </div>

                        <div className="text-right">
                          {isOverdue ? (
                            <span className="text-xs font-mono text-slate-500">Passed</span>
                          ) : (
                            <span className={`text-2xl font-display font-bold font-mono tracking-tighter ${
                              daysLeft <= 3 ? 'text-red-400' :
                              daysLeft <= 7 ? 'text-amber-400' :
                              'text-emerald-400'
                            }`}>
                              {daysLeft === 0 ? 'Today' : `${daysLeft}d`}
                            </span>
                          )}
                          <span className="block text-[8px] font-mono uppercase tracking-wider text-slate-500">
                            {isOverdue ? 'history' : daysLeft === 0 ? 'alert' : 'countdown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* TAB 3: STUDY SESSIONS LOG */}
        {plannerTab === 'logs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Logging Form (Left col) */}
            <div className="lg:col-span-1">
              <div id="logs-sidebar-form-card" className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block pb-1 border-b border-white/10 flex items-center gap-1">
                  <Timer size={14} className="text-indigo-400" />
                  <span>Register Completed Study Session</span>
                </span>
                
                <form id="study-logger-direct-form" onSubmit={handleStudyLogSubmit} className="space-y-4 text-xs">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="log-subject" className="text-slate-355 font-medium">Subject / Course Name</label>
                    <input
                      id="log-subject"
                      type="text"
                      placeholder="e.g. Calculus Practice"
                      value={logSubject}
                      onChange={(e) => setLogSubject(e.target.value)}
                      required
                      className="bg-slate-900/50 border border-white/10 p-2.5 rounded-xl text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="log-duration" className="text-slate-355 font-medium">Duration (Minutes)</label>
                    <div className="flex items-center gap-2">
                      <input
                        id="log-duration"
                        type="number"
                        min="5"
                        max="480"
                        value={logDuration}
                        onChange={(e) => setLogDuration(Number(e.target.value))}
                        required
                        className="bg-slate-900/50 border border-white/10 p-2.5 rounded-xl text-white focus:outline-none font-mono flex-grow"
                      />
                      <span className="text-slate-450 font-mono text-xs">mins</span>
                    </div>
                    {/* presets buttons */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      {[25, 45, 90].map(mins => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setLogDuration(mins)}
                          className={`py-1 text-[10px] font-mono rounded ${logDuration === mins ? 'bg-indigo-650 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="log-notes" className="text-slate-355 font-medium">Aims or Accomplishments</label>
                    <textarea
                      id="log-notes"
                      placeholder="e.g. Practiced 10 derivatives, completed midterm sheet."
                      value={logNotes}
                      onChange={(e) => setLogNotes(e.target.value)}
                      rows={3}
                      className="bg-slate-900/50 border border-white/10 p-2.5 rounded-xl text-white focus:outline-none font-sans"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-550 border border-indigo-500/20 rounded-xl font-bold text-white shadow transition"
                  >
                    Log Study Session
                  </button>
                </form>
              </div>
            </div>

            {/* List log Entries (Right cols) */}
            <div className="lg:col-span-2 space-y-3">
              <div id="logs-list-stack" className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl min-h-[350px]">
                <h3 className="text-sm font-display font-medium text-white border-b border-white/10 pb-3 mb-4">
                  History Logbook ({studyLogs.length} Entries)
                </h3>

                {studyLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-450">
                    <p className="text-sm">No study logs in the history book yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                    {studyLogs
                      .slice()
                      .reverse() // show latest logs first
                      .map((log) => (
                        <div 
                          key={log.id} 
                          id={`log-row-${log.id}`}
                          className="bg-slate-900/30 border border-white/5 hover:border-white/10 p-3.5 rounded-xl flex items-start justify-between gap-4 text-xs transition"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg flex-shrink-0 mt-0.5">
                              <Hourglass size={14} />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-white">{log.subject}</span>
                                <span className="font-mono text-[10px] text-indigo-300">
                                  ⏱️ {log.duration} mins ({(log.duration / 60).toFixed(1)} hrs)
                                </span>
                              </div>
                              {log.notes && <p className="text-slate-400 mt-1">{log.notes}</p>}
                              <span className="text-[10px] font-mono text-slate-500 mt-1 block">Logged on: {log.date}</span>
                            </div>
                          </div>

                          <button 
                            id={`delete-log-${log.id}`}
                            onClick={() => deleteStudyLog(log.id)}
                            className="bg-white/5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 p-1.5 rounded-lg transition"
                            title="Delete log entry"
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
        )}

      </div>

    </div>
  );
}
