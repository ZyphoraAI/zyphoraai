import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, UploadCloud, History, Calendar, CheckCircle2, AlertTriangle, 
  Trash2, Clock, Database, ShieldCheck, FileJson, ArrowLeftRight, Sparkles, 
  X, RefreshCw, FileText, ListTodo, Layers, ArrowRight
} from 'lucide-react';
import { Task, ScheduleItem, ExamCountdown, StudyLog, QuickLink, Subject, StudySession } from '../types';

interface BackupHistoryItem {
  id: string;
  filename: string;
  timestamp: string;
  sizeKb: number;
  summary: {
    subjects: number;
    chapters: number;
    topics: number;
    notes: number;
    tasks: number;
    exams: number;
    sessions: number;
  };
  dataStr?: string; // Optional embedded data reference
}

interface BackupRestoreViewProps {
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onRestoreComplete: (restoredData: {
    tasks: Task[];
    schedule: ScheduleItem[];
    exams: ExamCountdown[];
    studyLogs: StudyLog[];
    quickLinks: QuickLink[];
    subjects: Subject[];
    studySessions: StudySession[];
    streak: number;
  }) => void;
  subjects: Subject[];
  tasks: Task[];
  exams: ExamCountdown[];
  studySessions: StudySession[];
  schedule: ScheduleItem[];
  studyLogs: StudyLog[];
  quickLinks: QuickLink[];
}

export default function BackupRestoreView({
  addToast,
  onRestoreComplete,
  subjects,
  tasks,
  exams,
  studySessions,
  schedule,
  studyLogs,
  quickLinks
}: BackupRestoreViewProps) {
  const [history, setHistory] = useState<BackupHistoryItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Pending import data waiting for user confirmation
  const [pendingImport, setPendingImport] = useState<{
    filename: string;
    timestamp: string;
    sizeKb: number;
    summary: any;
    rawPayload: any;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load backup history log metadata on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('student_os_backup_history_log');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load backup history', e);
    }
  }, []);

  // Sync backup history
  const saveHistoryToStorage = (updatedHistory: BackupHistoryItem[]) => {
    setHistory(updatedHistory);
    localStorage.setItem('student_os_backup_history_log', JSON.stringify(updatedHistory));
  };

  // Compile active system statistics
  const getActiveStats = () => {
    let chaptersCount = 0;
    let topicsCount = 0;
    let notesCount = 0;

    try {
      const recallChapters = localStorage.getItem('recall_chapters');
      if (recallChapters) chaptersCount = JSON.parse(recallChapters).length;
    } catch (e) {}

    try {
      const recallTopics = localStorage.getItem('recall_topics');
      if (recallTopics) topicsCount = JSON.parse(recallTopics).length;
    } catch (e) {}

    try {
      const recallNotes = localStorage.getItem('recall_study_notes');
      if (recallNotes) notesCount = JSON.parse(recallNotes).length;
    } catch (e) {}

    return {
      subjects: subjects.length,
      chapters: chaptersCount,
      topics: topicsCount,
      notes: notesCount,
      tasks: tasks.length,
      exams: exams.length,
      sessions: studySessions.length,
      logs: studyLogs.length
    };
  };

  const activeStats = getActiveStats();

  // Create & Export backup package
  const handleExport = (createInternalPoint: boolean = false) => {
    try {
      const activeStatsInfo = getActiveStats();

      // Gather ALL browser data keys
      const dataPayload: Record<string, any> = {};

      const keysToExport = [
        'student_os_tasks',
        'student_os_schedule',
        'student_os_exams',
        'student_os_study_logs',
        'student_os_quick_links',
        'student_os_subjects',
        'student_os_study_sessions',
        'student_os_streak',
        'recall_study_notes',
        'recall_generated_material',
        'recall_chapters',
        'recall_topics',
        'revision_items',
        'revision_logs',
        'imported_materials_log'
      ];

      keysToExport.forEach(key => {
        const value = localStorage.getItem(key);
        if (value !== null) {
          try {
            dataPayload[key] = JSON.parse(value);
          } catch (e) {
            dataPayload[key] = value;
          }
        }
      });

      const backupPackage = {
        $schema: 'https://students-os.app/schemas/backup-v1.json',
        version: 1,
        origin: 'zyphora',
        timestamp: new Date().toISOString(),
        meta: {
          exportedAt: Date.now(),
          summary: activeStatsInfo
        },
        data: dataPayload
      };

      const payloadStr = JSON.stringify(backupPackage, null, 2);
      const blob = new Blob([payloadStr], { type: 'application/json' });
      const sizeKb = parseFloat((blob.size / 1024).toFixed(1));
      
      const dateString = new Date().toISOString().split('T')[0];
      const timeString = new Date().toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '');
      const filename = `student_os_backup_${dateString}_${timeString}.json`;

      // Trigger automatic save in history
      const newHistoryItem: BackupHistoryItem = {
        id: `backup_${Date.now()}`,
        filename,
        timestamp: new Date().toISOString(),
        sizeKb,
        summary: activeStatsInfo,
        dataStr: payloadStr // Embed content for instant single-click cloud-less restore
      };

      // Keep only last 10 entries to avoid localStorage quota excesses
      const updatedHistory = [newHistoryItem, ...history].slice(0, 10);
      saveHistoryToStorage(updatedHistory);

      // Save last backup timestamp key for Quick reminders on Dashboard
      localStorage.setItem('student_os_last_backup_date', new Date().toISOString());

      if (!createInternalPoint) {
        // Trigger actual browser file download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        addToast('Data backup files compiled & downloaded successfully! 🚀', 'success');
      } else {
        addToast('Internal safety backup checkpoint captured in history timeline! 🔒', 'success');
      }
    } catch (err) {
      console.error('Backup exports failed', err);
      addToast('An error occurred during backing up data exports.', 'error');
    }
  };

  // Parsing & validating file structure
  const validateAndParseBackup = (jsonStr: string, sourceFileName: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      
      // Safety Checks
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('File content of JSON must represent a root object structure.');
      }
      if (parsed.origin !== 'student_os' && parsed.origin !== 'zyphora') {
        throw new Error('This file does not belong to Zyphora format standards.');
      }
      if (!parsed.data || typeof parsed.data !== 'object') {
        throw new Error('No data structure block found inside the backup payload.');
      }

      const backupSummary = parsed.meta?.summary || {
        subjects: Array.isArray(parsed.data.student_os_subjects) ? parsed.data.student_os_subjects.length : 0,
        chapters: Array.isArray(parsed.data.recall_chapters) ? parsed.data.recall_chapters.length : 0,
        topics: Array.isArray(parsed.data.recall_topics) ? parsed.data.recall_topics.length : 0,
        notes: Array.isArray(parsed.data.recall_study_notes) ? parsed.data.recall_study_notes.length : 0,
        tasks: Array.isArray(parsed.data.student_os_tasks) ? parsed.data.student_os_tasks.length : 0,
        exams: Array.isArray(parsed.data.student_os_exams) ? parsed.data.student_os_exams.length : 0,
        sessions: Array.isArray(parsed.data.student_os_study_sessions) ? parsed.data.student_os_study_sessions.length : 0,
        logs: Array.isArray(parsed.data.student_os_study_logs) ? parsed.data.student_os_study_logs.length : 0
      };

      const sizeKb = parseFloat((new Blob([jsonStr]).size / 1024).toFixed(1));

      // Load confirmation modal
      setPendingImport({
        filename: sourceFileName,
        timestamp: parsed.timestamp || new Date().toISOString(),
        sizeKb,
        summary: backupSummary,
        rawPayload: parsed.data
      });
      setValidationError(null);
    } catch (err: any) {
      setValidationError(err.message || 'Malformed backup file format. Must be structured JSON.');
      addToast('Validation Check Failed: Malformed JSON file.', 'error');
    }
  };

  // File Handle Upload inputs
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        validateAndParseBackup(event.target.result, file.name);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Drag and Drop files
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        setValidationError('Invalid file type! Backup file must end in .json extension.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          validateAndParseBackup(event.target.result, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  // Final Action: Complete restore overwrite operations
  const executeOverwriteRestore = () => {
    if (!pendingImport) return;

    try {
      // 1. Create a quiet fallback pre-restore checkpoint just in case
      handleExport(true);

      const d = pendingImport.rawPayload;

      // 2. Overwrite standard local storage values safely with fallback defaults
      const keysMap: Record<string, any> = {
        'student_os_tasks': d.student_os_tasks || [],
        'student_os_schedule': d.student_os_schedule || [],
        'student_os_exams': d.student_os_exams || [],
        'student_os_study_logs': d.student_os_study_logs || [],
        'student_os_quick_links': d.student_os_quick_links || [],
        'student_os_subjects': d.student_os_subjects || [],
        'student_os_study_sessions': d.student_os_study_sessions || [],
        'student_os_streak': typeof d.student_os_streak === 'number' ? d.student_os_streak : 4,
        'recall_study_notes': d.recall_study_notes || [],
        'recall_generated_material': d.recall_generated_material || {},
        'recall_chapters': d.recall_chapters || [],
        'recall_topics': d.recall_topics || [],
        'revision_items': d.revision_items || [],
        'revision_logs': d.revision_logs || [],
        'imported_materials_log': d.imported_materials_log || []
      };

      Object.entries(keysMap).forEach(([key, val]) => {
        localStorage.setItem(key, JSON.stringify(val));
      });

      // Update state in main app layout context immediately
      onRestoreComplete({
        tasks: keysMap['student_os_tasks'],
        schedule: keysMap['student_os_schedule'],
        exams: keysMap['student_os_exams'],
        studyLogs: keysMap['student_os_study_logs'],
        quickLinks: keysMap['student_os_quick_links'],
        subjects: keysMap['student_os_subjects'],
        studySessions: keysMap['student_os_study_sessions'],
        streak: keysMap['student_os_streak']
      });

      // Save dynamic metadata flags
      localStorage.setItem('student_os_last_backup_date', new Date().toISOString());

      addToast(`Workspace fully restored successfully matching backup: "${pendingImport.filename}"! 🎉`, 'success');
      setPendingImport(null);
    } catch (err) {
      console.error('System restore crash', err);
      addToast('Critical fail: Failed to overwrite database registers.', 'error');
    }
  };

  // Restore directly from history checkpoint
  const handleRestoreFromHistory = (item: BackupHistoryItem) => {
    if (!item.dataStr) {
      addToast('History element payload details missing.', 'warning');
      return;
    }
    
    // Safely parse history entry string
    try {
      const parsed = JSON.parse(item.dataStr);
      setPendingImport({
        filename: item.filename,
        timestamp: item.timestamp,
        sizeKb: item.sizeKb,
        summary: item.summary,
        rawPayload: parsed.data
      });
      setValidationError(null);
    } catch (e) {
      addToast('Could not load history elements representation.', 'error');
    }
  };

  // Delete history item
  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = history.filter(h => h.id !== id);
    saveHistoryToStorage(filtered);
    addToast('Backup index deleted from history logs.', 'info');
  };

  // Format backup date strings
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div id="backup-restore-container" className="space-y-6 animate-fade-in text-slate-100 max-w-full">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2">
            <Database className="text-indigo-400 w-6 h-6 shrink-0" />
            Backup & Recovery System
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Secure your complete academic records. Export high-fidelity JSON packages or restore historical checkpoints.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-mono px-2.5 py-1 bg-white/5 border border-white/10 text-slate-305 rounded-lg flex items-center gap-1.5 shrink-0 select-none">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Security Shield Active
          </span>
        </div>
      </div>

      {/* Main Core Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-full">
        
        {/* Export and Metrics column */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Capture Backup Snapshot</h3>
                  <p className="text-[11px] text-slate-450">Compress all local profile indices into a standalone portable configuration.</p>
                </div>
              </div>

              {/* Data registry stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-center p-2 rounded hover:bg-white/5 transition">
                  <span className="block text-[10px] text-slate-400 font-medium">Subjects</span>
                  <span className="text-lg font-bold text-indigo-300 font-mono">{activeStats.subjects}</span>
                </div>
                <div className="text-center p-2 rounded hover:bg-white/5 transition">
                  <span className="block text-[10px] text-slate-400 font-medium">Chapters</span>
                  <span className="text-lg font-bold text-emerald-305 font-mono">{activeStats.chapters}</span>
                </div>
                <div className="text-center p-2 rounded hover:bg-white/5 transition">
                  <span className="block text-[10px] text-slate-400 font-medium">Topics</span>
                  <span className="text-lg font-bold text-teal-300 font-mono">{activeStats.topics}</span>
                </div>
                <div className="text-center p-2 rounded hover:bg-white/5 transition">
                  <span className="block text-[10px] text-slate-400 font-medium">Study Notes</span>
                  <span className="text-lg font-bold text-purple-305 font-mono">{activeStats.notes}</span>
                </div>
                <div className="text-center p-2 rounded hover:bg-white/5 transition">
                  <span className="block text-[10px] text-slate-400 font-medium">Focus Tasks</span>
                  <span className="text-lg font-bold text-sky-305 font-mono">{activeStats.tasks}</span>
                </div>
                <div className="text-center p-2 rounded hover:bg-white/5 transition">
                  <span className="block text-[10px] text-slate-400 font-medium">Scheduled Exams</span>
                  <span className="text-lg font-bold text-amber-305 font-mono">{activeStats.exams}</span>
                </div>
                <div className="text-center p-2 rounded hover:bg-white/5 transition">
                  <span className="block text-[10px] text-slate-400 font-medium">Planner Sessions</span>
                  <span className="text-lg font-bold text-rose-300 font-mono">{activeStats.sessions}</span>
                </div>
                <div className="text-center p-2 rounded hover:bg-white/5 transition">
                  <span className="block text-[10px] text-slate-400 font-medium">History Logs</span>
                  <span className="text-lg font-bold text-pink-305 font-mono">{activeStats.logs}</span>
                </div>
              </div>

              <div id="backup-notice-alert" className="p-3 bg-indigo-500/10 border border-indigo-400/20 text-slate-300 rounded-xl text-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Your exported JSON can be moved to any browser or device running Zyphora to seamlessly recover your complete progress instantly. Perfect for migrating devices or syncing study nodes offline.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleExport(false)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-950/20 active:scale-98 transition duration-150 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Compile & Save Offline Backup (.json)</span>
            </button>
          </div>
        </div>

        {/* Upload and Import column */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 rounded-xl">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Upload / Restore Backup</h3>
                <p className="text-[11px] text-slate-450">Restore from an existing JSON backup file to overwrite current environment states.</p>
              </div>
            </div>

            {/* Drag and drop zone */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                dragActive 
                  ? 'border-indigo-400 bg-indigo-505/10 bg-indigo-500/15' 
                  : 'border-white/10 bg-white/5 hover:border-slate-450 hover:bg-white/10'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-full bg-slate-800/80 border border-white/5 flex items-center justify-center mx-auto text-slate-300">
                  <FileJson className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    Drag and drop your back up file, or <span className="text-indigo-400 underline">browse</span>
                  </p>
                  <p className="text-[10px] text-slate-455 text-slate-400 mt-1">Accepts raw JSON backup formats only</p>
                </div>
              </div>
            </div>

            {validationError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Backup History Column */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl w-full max-w-full">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/10 border border-violet-400/20 text-violet-400 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Internal Restore checkpoints</h3>
              <p className="text-[11px] text-slate-455 text-slate-400">Restore instantly from checkpoints quietly cached in your browser.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-450 bg-white/5 px-2 py-1 rounded-md">
            Max History: 10 cached
          </span>
        </div>

        {history.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Database className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
            <h4 className="text-xs font-semibold text-slate-350">No checkpoints recorded</h4>
            <p className="text-[10px] text-slate-500 max-w-sm mx-auto">
              Any file exports compress logs and generate safety checkpoints on this machine for instant rollbacks.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full text-left text-xs text-slate-300 min-w-[500px]">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-mono text-[9px] uppercase tracking-wider">
                  <th className="py-2 px-3">Date Captured</th>
                  <th className="py-2 px-3">Filename</th>
                  <th className="py-2 px-3">Archive Size</th>
                  <th className="py-2 px-3">Metrics Snapshot</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                    onClick={() => handleRestoreFromHistory(item)}
                  >
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-450 group-hover:text-indigo-400 transition" />
                        <span className="font-mono">{formatDate(item.timestamp)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-sans font-medium text-slate-300 text-[11px] truncate max-w-[180px] block" title={item.filename}>
                        {item.filename}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-400 text-xs px-1.5 py-0.5 bg-white/5 rounded border border-white/5">
                        {item.sizeKb} KB
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-305 rounded" title="Subjects">
                          S:{item.summary.subjects}
                        </span>
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-305 rounded" title="Study Notes">
                          N:{item.summary.notes}
                        </span>
                        <span className="px-1.5 py-0.5 bg-sky-500/10 text-sky-305 rounded" title="Pending Tasks">
                          T:{item.summary.tasks}
                        </span>
                        <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-305 rounded" title="Exams">
                          E:{item.summary.exams}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleRestoreFromHistory(item)}
                          className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white rounded-lg text-[10px] font-mono transition duration-150 cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw size={10} className="group-hover:rotate-180 transition-transform" />
                          Restore
                        </button>
                        <button
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                          className="p-1 text-slate-450 hover:text-rose-450 hover:bg-rose-500/10 rounded transition cursor-pointer"
                          title="Delete index checkpoint"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Safety Overwrite Confirmation Modal Dialog */}
      <AnimatePresence>
        {pendingImport && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            
            {/* Darker blur backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPendingImport(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Dialog Card Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400 border-b border-rose-500/10 pb-3">
                <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-sans uppercase tracking-tight">Overwrite Active Database?</h3>
                  <p className="text-[10px] text-rose-400 font-mono mt-0.5">Warning: This action completely replaces your current profile!</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  You are about to restore the local computer workspace to match the selected JSON backup archive. All active tasks, schedule, calendars, note guides, flashcard decks, and revision history logs will be overwritten.
                </p>

                {/* Import stats overview summary */}
                <div className="bg-slate-950/60 rounded-xl p-4 border border-white/5 space-y-2.5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Target Backup File</span>
                    <span className="text-xs font-semibold text-white truncate block font-mono">{pendingImport.filename}</span>
                  </div>

                  <div className="flex items-center gap-3 divide-x divide-white/10 pt-1.5 border-t border-white/5">
                    <div className="flex-1">
                      <span className="block text-[9px] font-mono text-slate-500 uppercase">Backup Stamp</span>
                      <span className="text-xs font-bold text-slate-300 font-mono block mt-0.5">{formatDate(pendingImport.timestamp)}</span>
                    </div>
                    <div className="pl-3 w-24">
                      <span className="block text-[9px] font-mono text-slate-500 uppercase">File Size</span>
                      <span className="text-xs font-bold text-indigo-300 font-mono block mt-0.5">{pendingImport.sizeKb} KB</span>
                    </div>
                  </div>

                  {/* Quick items listing badges */}
                  <div className="pt-2 border-t border-white/10">
                    <span className="block text-[9px] font-mono text-slate-550 text-slate-500 uppercase mb-1">Backup Contents Preview</span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[9px] font-medium px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-350 rounded">
                        Subjects: {pendingImport.summary.subjects}
                      </span>
                      <span className="text-[9px] font-medium px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-350 rounded">
                        Notes: {pendingImport.summary.notes}
                      </span>
                      <span className="text-[9px] font-medium px-2 py-0.5 bg-sky-500/10 border border-sky-500/20 text-sky-350 rounded">
                        Tasks: {pendingImport.summary.tasks}
                      </span>
                      <span className="text-[9px] font-medium px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-350 rounded">
                        Exams: {pendingImport.summary.exams}
                      </span>
                      <span className="text-[9px] font-medium px-2 py-0.5 bg-pink-500/10 border border-pink-500/20 text-pink-350 rounded">
                        Sessions: {pendingImport.summary.sessions}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-305 rounded-xl flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>A safety checkpoints rollback slot has been quietly cached prior to this action.</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                <button
                  onClick={() => setPendingImport(null)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-semibold rounded-xl text-xs transition duration-150 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={executeOverwriteRestore}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition duration-150 shadow-lg shadow-rose-950/20 cursor-pointer hover:scale-101 active:scale-98"
                >
                  Yes, Overwrite & Restore
                </button>
              </div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
