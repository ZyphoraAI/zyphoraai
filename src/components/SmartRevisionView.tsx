import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar, Clock, CheckCircle2, AlertTriangle, Play, BookOpen, 
  Layers, FileText, ChevronRight, BarChart3, Star, Plus, 
  RotateCcw, History, Trash2, CheckCircle, TrendingUp, Sparkles, CalendarDays
} from 'lucide-react';
import { RevisionItem, RevisionLog } from '../types';

interface SmartRevisionViewProps {
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onNavigate?: (view: any) => void;
}

interface SavedNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function SmartRevisionView({ addToast, onNavigate }: SmartRevisionViewProps) {
  // State for revision items and logs
  const [revisionItems, setRevisionItems] = useState<RevisionItem[]>([]);
  const [revisionLogs, setRevisionLogs] = useState<RevisionLog[]>([]);

  // Source materials loaded from active recall module
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [generatedMaterial, setGeneratedMaterial] = useState<Record<string, {
    questions: any[];
    flashcards: any[];
    quizzes: any[];
  }>>({});

  // Mastery tracking states
  const [chapters, setChapters] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);

  // Scheduler Form State
  const [selectedType, setSelectedType] = useState<'note' | 'flashcard' | 'quiz'>('note');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [useSpacedRep, setUseSpacedRep] = useState<boolean>(true);

  // Active reviewing modal state
  const [activeReviewItem, setActiveReviewItem] = useState<RevisionItem | null>(null);
  const [revealedBack, setRevealedBack] = useState<boolean>(false);
  const [quizAnswerSelected, setQuizAnswerSelected] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Filter/tab for Daily revisions
  const [revisionTab, setRevisionTab] = useState<'all' | 'due' | 'upcoming' | 'overdue'>('due');

  // Active tab for cognitive mastery grid
  const [masteryViewTab, setMasteryViewTab] = useState<'subject' | 'chapter' | 'topic'>('subject');

  // Load all data from localStorage
  useEffect(() => {
    // 1. Revision Items
    const localItems = localStorage.getItem('revision_items');
    let loadedItems: RevisionItem[] = [];
    if (localItems) {
      try {
        loadedItems = JSON.parse(localItems);
      } catch (err) {
        console.error('Failed to parse revision items', err);
      }
    }
    setRevisionItems(loadedItems);

    // 2. Revision Logs
    const localLogs = localStorage.getItem('revision_logs');
    let loadedLogs: RevisionLog[] = [];
    if (localLogs) {
      try {
        loadedLogs = JSON.parse(localLogs);
      } catch (err) {
        console.error('Failed to parse revision logs', err);
      }
    }
    setRevisionLogs(loadedLogs);

    // 3. Saved Notes
    const localNotes = localStorage.getItem('recall_study_notes');
    let notesList: SavedNote[] = [];
    if (localNotes) {
      try {
        notesList = JSON.parse(localNotes);
        setSavedNotes(notesList);
      } catch (err) {
        console.error('Failed to parse recall notes', err);
      }
    }

    // 4. Generated Material
    const localMat = localStorage.getItem('recall_generated_material');
    if (localMat) {
      try {
        const mat = JSON.parse(localMat);
        setGeneratedMaterial(mat);
      } catch (err) {
        console.error('Failed to parse recall material', err);
      }
    }

    // 5. Chapters, Topics, and Subjects for Mastery Tracking
    const localChapters = localStorage.getItem('recall_chapters');
    if (localChapters) {
      try {
        setChapters(JSON.parse(localChapters));
      } catch (err) {}
    }
    const localTopics = localStorage.getItem('recall_topics');
    if (localTopics) {
      try {
        setTopics(JSON.parse(localTopics));
      } catch (err) {}
    }
    const localSubs = localStorage.getItem('student_os_subjects');
    if (localSubs) {
      try {
        setSubjectsList(JSON.parse(localSubs));
      } catch (err) {}
    }

    // Seed initial revision schedule if empty to make UI populated and friendly
    if (loadedItems.length === 0 && notesList.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const initialSeeds: RevisionItem[] = [
        {
          id: 'seed_rev_1',
          itemType: 'note',
          itemId: notesList[0].id,
          noteId: notesList[0].id,
          title: `Study Guide: ${notesList[0].title}`,
          intervalLevel: 1,
          nextRevisionDate: todayStr,
          lastRevisionDate: null
        }
      ];

      // Grab some flashcard or quiz if available
      const material = localMat ? JSON.parse(localMat) : null;
      if (material && material[notesList[0].id]) {
        const fcs = material[notesList[0].id].flashcards || [];
        if (fcs.length > 0) {
          initialSeeds.push({
            id: 'seed_rev_2',
            itemType: 'flashcard',
            itemId: fcs[0].id,
            noteId: notesList[0].id,
            title: `Flashcard: ${fcs[0].front}`,
            intervalLevel: 2,
            nextRevisionDate: yesterdayStr, // Overdue
            lastRevisionDate: null
          });
        }
        const qzs = material[notesList[0].id].quizzes || [];
        if (qzs.length > 0) {
          initialSeeds.push({
            id: 'seed_rev_3',
            itemType: 'quiz',
            itemId: qzs[0].id,
            noteId: notesList[0].id,
            title: `Quiz: ${qzs[0].title}`,
            intervalLevel: 1,
            nextRevisionDate: tomorrowStr, // Upcoming
            lastRevisionDate: null
          });
        }
      }

      setRevisionItems(initialSeeds);
      localStorage.setItem('revision_items', JSON.stringify(initialSeeds));
    }
  }, []);

  // Update selection item dropdown when selectedType changes
  useEffect(() => {
    if (selectedType === 'note') {
      if (savedNotes.length > 0) {
        setSelectedItemId(savedNotes[0].id);
      } else {
        setSelectedItemId('');
      }
    } else if (selectedType === 'flashcard') {
      // Find all available flashcards across all notes
      const fcs: { id: string; front: string }[] = [];
      Object.keys(generatedMaterial).forEach(noteId => {
        const mat = generatedMaterial[noteId];
        if (mat && mat.flashcards) {
          mat.flashcards.forEach((f: any) => {
            fcs.push({ id: f.id, front: f.front });
          });
        }
      });
      if (fcs.length > 0) {
        setSelectedItemId(fcs[0].id);
      } else {
        setSelectedItemId('');
      }
    } else if (selectedType === 'quiz') {
      const qzs: { id: string; title: string }[] = [];
      Object.keys(generatedMaterial).forEach(noteId => {
        const mat = generatedMaterial[noteId];
        if (mat && mat.quizzes) {
          mat.quizzes.forEach((q: any) => {
            qzs.push({ id: q.id, title: q.title });
          });
        }
      });
      if (qzs.length > 0) {
        setSelectedItemId(qzs[0].id);
      } else {
        setSelectedItemId('');
      }
    }
  }, [selectedType, savedNotes, generatedMaterial]);

  // Handle manual/automatic schedule creation
  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      addToast('Please select a study topic, flashcard, or quiz to schedule!', 'warning');
      return;
    }

    // Determine target details
    let title = '';
    let noteId = '';
    let itemId = selectedItemId;

    if (selectedType === 'note') {
      const note = savedNotes.find(n => n.id === selectedItemId);
      if (note) {
        title = `Study Guide: ${note.title}`;
        noteId = note.id;
      }
    } else if (selectedType === 'flashcard') {
      // Find parent note
      for (const nId of Object.keys(generatedMaterial)) {
        const mat = generatedMaterial[nId];
        if (mat && mat.flashcards) {
          const fc = mat.flashcards.find((f: any) => f.id === selectedItemId);
          if (fc) {
            title = `Flashcard: ${fc.front}`;
            noteId = nId;
            break;
          }
        }
      }
    } else if (selectedType === 'quiz') {
      for (const nId of Object.keys(generatedMaterial)) {
        const mat = generatedMaterial[nId];
        if (mat && mat.quizzes) {
          const qz = mat.quizzes.find((q: any) => q.id === selectedItemId);
          if (qz) {
            title = `Quiz: ${qz.title}`;
            noteId = nId;
            break;
          }
        }
      }
    }

    // Check if duplicate revision schedule for same item exists
    const duplicate = revisionItems.find(item => item.itemId === itemId && item.itemType === selectedType);
    if (duplicate) {
      addToast(`This ${selectedType} is already in your active revision schedule!`, 'info');
      return;
    }

    // Calculate dates
    let targetDate = customDate;
    if (useSpacedRep) {
      // Automatic starting repetition gets interval of 1 day (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDate = tomorrow.toISOString().split('T')[0];
    }

    const newItem: RevisionItem = {
      id: `rev_${Date.now()}`,
      itemType: selectedType,
      itemId,
      noteId,
      title: title || `${selectedType.toUpperCase()} Revision`,
      intervalLevel: 1, // Start at Leitner Box 1
      nextRevisionDate: targetDate,
      lastRevisionDate: null,
      easiness: 2.5,
      repetitions: 0,
      intervalDays: 1,
      masteryScore: 10 // Start at 10%
    };

    const updated = [newItem, ...revisionItems];
    setRevisionItems(updated);
    localStorage.setItem('revision_items', JSON.stringify(updated));

    addToast(`Successfully scheduled revision for: "${title}" ✅`, 'success');
  };

  // Delete a revision item from schedule
  const handleDeleteRevisionItem = (id: string) => {
    const updated = revisionItems.filter(item => item.id !== id);
    setRevisionItems(updated);
    localStorage.setItem('revision_items', JSON.stringify(updated));
    addToast('Item removed from revision schedule.', 'info');
  };

  // Launch review modal
  const handleStartReview = (item: RevisionItem) => {
    setActiveReviewItem(item);
    setRevealedBack(false);
    setQuizAnswerSelected(null);
    setQuizSubmitted(false);
  };

  // Log completed revision session with performance rating (Spaced Repetitions scheduler)
  const handleLogRevision = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!activeReviewItem) return;

    let q = 4; // default quality
    if (rating === 'again') q = 1;
    else if (rating === 'hard') q = 3;
    else if (rating === 'good') q = 4;
    else if (rating === 'easy') q = 5;

    // Load existing metrics or safe defaults
    let easiness = activeReviewItem.easiness ?? 2.5;
    let repetitions = activeReviewItem.repetitions ?? 0;
    let intervalDays = activeReviewItem.intervalDays ?? 0;
    
    // Existing level maps loosely to mastery
    let defaultMastery = activeReviewItem.intervalLevel * 20;
    if (defaultMastery === 0) defaultMastery = 10;
    let masteryScore = activeReviewItem.masteryScore ?? defaultMastery;

    if (q >= 3) {
      if (repetitions === 0) {
        intervalDays = 1;
      } else if (repetitions === 1) {
        intervalDays = 4;
      } else {
        intervalDays = Math.ceil(intervalDays * easiness);
      }
      repetitions += 1;
    } else {
      repetitions = 0;
      intervalDays = 1;
    }

    // SM-2 Easiness Formula
    easiness = easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easiness < 1.3) easiness = 1.3;

    // Adjust Mastery Score
    if (rating === 'again') {
      masteryScore = Math.max(0, masteryScore - 30);
    } else if (rating === 'hard') {
      masteryScore = Math.min(100, Math.max(25, masteryScore + 10));
    } else if (rating === 'good') {
      masteryScore = Math.min(100, Math.max(55, masteryScore + 20));
    } else if (rating === 'easy') {
      masteryScore = Math.min(100, Math.max(85, masteryScore + 35));
    }

    // Convert intervalDays back to corresponding Box levels for visualization
    let nextLevel = 1;
    if (intervalDays <= 1) nextLevel = 1;
    else if (intervalDays <= 4) nextLevel = 2;
    else if (intervalDays <= 8) nextLevel = 3;
    else if (intervalDays <= 15) nextLevel = 4;
    else nextLevel = 5;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const nextD = new Date();
    nextD.setDate(nextD.getDate() + intervalDays);
    const nextRevisionDateStr = nextD.toISOString().split('T')[0];

    // Update revisionItems state & storage
    const updatedItems = revisionItems.map(item => {
      if (item.id === activeReviewItem.id) {
        return {
          ...item,
          intervalLevel: nextLevel,
          lastRevisionDate: todayStr,
          nextRevisionDate: nextRevisionDateStr,
          easiness,
          repetitions,
          intervalDays,
          masteryScore
        };
      }
      return item;
    });

    setRevisionItems(updatedItems);
    localStorage.setItem('revision_items', JSON.stringify(updatedItems));

    // Log revision event
    const newLog: RevisionLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      itemType: activeReviewItem.itemType,
      title: activeReviewItem.title,
      perfRating: rating
    };

    const updatedLogs = [newLog, ...revisionLogs];
    setRevisionLogs(updatedLogs);
    localStorage.setItem('revision_logs', JSON.stringify(updatedLogs));

    addToast(`Revision logged: ${rating.toUpperCase()}! Next review in ${intervalDays} days (Mastery: ${masteryScore}%). 📅`, 'success');
    setActiveReviewItem(null);
  };

  // Filter lists helper variables
  const todayDateStr = new Date().toISOString().split('T')[0];

  const dueItems = revisionItems.filter(item => item.nextRevisionDate <= todayDateStr);
  const overdueItems = revisionItems.filter(item => item.nextRevisionDate < todayDateStr);
  
  // Upcoming is due after today
  const upcomingItems = revisionItems.filter(item => item.nextRevisionDate > todayDateStr);

  const activeFilteredItems = (() => {
    if (revisionTab === 'all') return revisionItems;
    if (revisionTab === 'due') return dueItems;
    if (revisionTab === 'overdue') return overdueItems;
    if (revisionTab === 'upcoming') return upcomingItems;
    return dueItems;
  })();

  // ----------------------------------------------------
  // PROGRESS ANALYTICS COMPUTATIONS
  // ----------------------------------------------------

  // 1. Total Completed
  const totalRevisionsCompleted = revisionLogs.length;

  // 2. Weekly Activity Log Count (Last 7 Days chart starting Mon-Sun)
  const getWeeklyRevisionCountByDay = () => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const result: Record<string, number> = {
      'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0, 'Friday': 0, 'Saturday': 0, 'Sunday': 0
    };

    const now = new Date();
    // Fetch logs within last 7 days
    revisionLogs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const timeDiff = now.getTime() - logDate.getTime();
      const diffDays = timeDiff / (1000 * 3600 * 24);
      if (diffDays <= 7) {
        const dayName = daysOfWeek[logDate.getDay()];
        if (result[dayName] !== undefined) {
          result[dayName] += 1;
        }
      }
    });

    return result;
  };

  const weeklyActivityData = getWeeklyRevisionCountByDay();

  // 3. Current Revision Streak: calculate contiguous completed days
  const calculateStreak = () => {
    if (revisionLogs.length === 0) return 0;

    // Get unique dates sorted descending
    const dates = revisionLogs.map(l => l.timestamp.split('T')[0]);
    const uniqueDates = (Array.from(new Set(dates)) as string[]).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streakCount = 0;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if any review logged today or yesterday
    if (!uniqueDates.includes(todayStr) && !uniqueDates.includes(yesterdayStr)) {
      return 0; // Streak broken
    }

    let currentCheck = new Date();
    // If today is not done but yesterday was, we start counting from yesterday
    if (!uniqueDates.includes(todayStr) && uniqueDates.includes(yesterdayStr)) {
      currentCheck = yesterday;
    }

    while (true) {
      const checkStr = currentCheck.toISOString().split('T')[0];
      if (uniqueDates.includes(checkStr)) {
        streakCount++;
        currentCheck.setDate(currentCheck.getDate() - 1); // Check day before
      } else {
        break;
      }
    }

    return streakCount;
  };

  const currentStreak = calculateStreak();

  // ----------------------------------------------------
  // PROGRESS PER SUBJECT, CHAPTER, TOPIC (Mastery Tracking)
  // ----------------------------------------------------
  
  // Helper to extract mastery score from RevisionItem
  const getItemMastery = (item: RevisionItem) => {
    if (item.masteryScore !== undefined) return item.masteryScore;
    const defaultM = item.intervalLevel * 20;
    return defaultM === 0 ? 10 : defaultM;
  };

  // 1. Progress per Subject
  const subjectMasteryData = subjectsList.map(subj => {
    // Find notes in this subject
    const relatedNotes = savedNotes.filter(n => n.subjectId === subj.id);
    const noteIds = relatedNotes.map(n => n.id);
    
    // Find revision items for these notes
    const relatedItems = revisionItems.filter(item => noteIds.includes(item.noteId));
    
    const count = relatedItems.length;
    const masteredCount = relatedItems.filter(item => getItemMastery(item) >= 80).length;
    const avgMastery = count > 0 
      ? Math.round(relatedItems.reduce((acc, item) => acc + getItemMastery(item), 0) / count) 
      : 0;

    return {
      id: subj.id,
      name: subj.name,
      color: subj.color,
      avgMastery,
      count,
      masteredCount
    };
  });

  // 2. Progress per Chapter
  const chapterMasteryData = chapters.map(ch => {
    const relatedNotes = savedNotes.filter(n => n.chapterId === ch.id);
    const noteIds = relatedNotes.map(n => n.id);
    const relatedItems = revisionItems.filter(item => noteIds.includes(item.noteId));
    
    const count = relatedItems.length;
    const masteredCount = relatedItems.filter(item => getItemMastery(item) >= 80).length;
    const avgMastery = count > 0 
      ? Math.round(relatedItems.reduce((acc, item) => acc + getItemMastery(item), 0) / count) 
      : 0;

    // Get subject name for sub-labels
    const parentSub = subjectsList.find(s => s.id === ch.subjectId);

    return {
      id: ch.id,
      title: ch.title,
      subjectName: parentSub?.name || 'General',
      avgMastery,
      count,
      masteredCount
    };
  });

  // 3. Progress per Topic
  const topicMasteryData = topics.map(tp => {
    const relatedNotes = savedNotes.filter(n => n.topicId === tp.id);
    const noteIds = relatedNotes.map(n => n.id);
    const relatedItems = revisionItems.filter(item => noteIds.includes(item.noteId));
    
    const count = relatedItems.length;
    const masteredCount = relatedItems.filter(item => getItemMastery(item) >= 80).length;
    const avgMastery = count > 0 
      ? Math.round(relatedItems.reduce((acc, item) => acc + getItemMastery(item), 0) / count) 
      : 0;

    // Get parent chapter title for context sub-labels
    const parentCh = chapters.find(c => c.id === tp.chapterId);

    return {
      id: tp.id,
      title: tp.title,
      chapterTitle: parentCh?.title || 'General',
      avgMastery,
      count,
      masteredCount
    };
  });

  // Keyboard event handler for distraction-free review engine
  useEffect(() => {
    if (!activeReviewItem) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes review session
      if (e.key === 'Escape') {
        setActiveReviewItem(null);
        return;
      }

      // If active item is a flashcard
      if (activeReviewItem.itemType === 'flashcard') {
        if (!revealedBack) {
          // Space or Enter to reveal
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            setRevealedBack(true);
          }
        } else {
          // 1, 2, 3, 4 ratings
          if (e.key === '1') handleLogRevision('again');
          else if (e.key === '2') handleLogRevision('hard');
          else if (e.key === '3') handleLogRevision('good');
          else if (e.key === '4') handleLogRevision('easy');
        }
      }

      // If active item is a quiz
      else if (activeReviewItem.itemType === 'quiz') {
        if (!quizSubmitted) {
          // 1, 2, 3, 4 selection (or a, b, c, d)
          if (['1', '2', '3', '4'].includes(e.key)) {
            setQuizAnswerSelected(parseInt(e.key) - 1);
          } else if (['a', 'b', 'c', 'd', 'A', 'B', 'C', 'D'].includes(e.key)) {
            const index = e.key.toLowerCase().charCodeAt(0) - 97;
            setQuizAnswerSelected(index);
          } else if (e.key === 'Enter' && quizAnswerSelected !== null) {
            setQuizSubmitted(true);
          }
        } else {
          // Press keys after quiz submitted to log rating
          if (e.key === '1') handleLogRevision('again');
          else if (e.key === '2') handleLogRevision('hard');
          else if (e.key === '3') handleLogRevision('good');
          else if (e.key === '4') handleLogRevision('easy');
        }
      }

      // If active item is a note
      else if (activeReviewItem.itemType === 'note') {
        if (e.key === '1') handleLogRevision('again');
        else if (e.key === '2') handleLogRevision('hard');
        else if (e.key === '3') handleLogRevision('good');
        else if (e.key === '4') handleLogRevision('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeReviewItem, revealedBack, quizSubmitted, quizAnswerSelected, revisionItems, revisionLogs]);

  // Helper inside Modal to retrieve active flashcard, quiz or note details
  const getReviewContent = () => {
    if (!activeReviewItem) return null;
    const { itemId, itemType, noteId } = activeReviewItem;

    if (itemType === 'note') {
      const note = savedNotes.find(n => n.id === itemId);
      return {
        title: note?.title || 'Note Details',
        body: note?.content || 'No text inside notes yet...'
      };
    } else if (itemType === 'flashcard') {
      const mat = generatedMaterial[noteId];
      if (mat) {
        const fc = (mat.flashcards || []).find(f => f.id === itemId);
        if (fc) {
          return {
            front: fc.front,
            back: fc.back
          };
        }
      }
      return { front: 'Flashcard not found', back: 'Delete or reschedule' };
    } else if (itemType === 'quiz') {
      const mat = generatedMaterial[noteId];
      if (mat) {
        const qz = (mat.quizzes || []).find(q => q.id === itemId);
        if (qz) {
          // Grab first logical quiz question to review
          const firstQ = qz.questions?.[0];
          return {
            title: qz.title,
            question: firstQ?.question || 'Quiz question missing',
            options: firstQ?.options || [],
            correctIndex: firstQ?.correctAnswerIndex ?? 0
          };
        }
      }
      return { title: 'Quiz Not Found', question: 'No active questions', options: [], correctIndex: 0 };
    }
    return null;
  };

  const reviewContent = getReviewContent();

  return (
    <div id="smart-revision-view-root" className="space-y-6">
      
      {/* Visual Workspace Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400">
            <Sparkles size={20} className="shrink-0 animate-pulse text-indigo-400" />
            <span className="text-xs uppercase font-mono tracking-wider font-bold">Leitner Cognitive Engine</span>
          </div>
          <h2 className="text-2xl font-display font-medium text-white tracking-tight">Smart Revision Workspace</h2>
          <p className="text-slate-350 text-xs max-w-2xl font-sans leading-relaxed">
            Boost memory consolidation by reviewing study material at increasing historical intervals. Stop cramming, start practicing strategic retrieval.
          </p>
        </div>

        {/* Analytics mini indicator pills */}
        <div className="flex gap-2 shrink-0 flex-wrap">
          <div className="bg-slate-900/60 border border-white/5 px-4 py-2.5 rounded-xl flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-400" />
            <div className="text-left leading-none">
              <span className="text-[9px] text-slate-500 uppercase font-mono block">Streak</span>
              <span className="text-xs font-mono font-bold text-white leading-none mt-1 inline-block">{currentStreak} Days</span>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-white/5 px-4 py-2.5 rounded-xl flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <div className="text-left leading-none">
              <span className="text-[9px] text-slate-500 uppercase font-mono block">Completed</span>
              <span className="text-xs font-mono font-bold text-white leading-none mt-1 inline-block">{totalRevisionsCompleted} logs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Dashboard and Progress */}
      <div id="revision-layout-main-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Daily Revision Dashboard + Task List (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Daily Revision Dashboard */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-b-white/5 pb-3">
              <h3 className="text-sm uppercase font-mono tracking-widest text-slate-350 font-bold flex items-center gap-2">
                <CalendarDays size={16} className="text-indigo-400" />
                Daily Revision Dashboard
              </h3>

              {/* Revision Filters Tab select */}
              <div className="flex bg-slate-950/45 p-0.5 border border-white/5 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setRevisionTab('due')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    revisionTab === 'due' ? 'bg-indigo-650 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Due Today ({dueItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRevisionTab('overdue')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    revisionTab === 'overdue' ? 'bg-indigo-650 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Overdue ({overdueItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRevisionTab('upcoming')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    revisionTab === 'upcoming' ? 'bg-indigo-650 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Upcoming ({upcomingItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRevisionTab('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    revisionTab === 'all' ? 'bg-indigo-650 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({revisionItems.length})
                </button>
              </div>
            </div>

            {/* List showing active revision tasks */}
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {activeFilteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/30 border border-white/5 rounded-2xl space-y-3">
                  <CheckCircle className="w-12 h-12 text-emerald-400/80 animate-pulse" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">No Active Revision Tasks</h4>
                    <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                      All caught up under this category! Schedule more flashcards or study notes below to keep your streak alive.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {activeFilteredItems.map((item) => {
                    const isOverdue = item.nextRevisionDate < todayDateStr;
                    const isDueTodayStr = item.nextRevisionDate === todayDateStr;

                    return (
                      <div
                        key={item.id}
                        className="p-4 bg-slate-900/40 border border-white/5 hover:border-white/10 rounded-xl transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl border ${
                            item.itemType === 'note' 
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              : item.itemType === 'flashcard'
                              ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          }`}>
                            {item.itemType === 'note' && <FileText size={18} />}
                            {item.itemType === 'flashcard' && <Layers size={18} />}
                            {item.itemType === 'quiz' && <BookOpen size={18} />}
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-white leading-relaxed font-sans">{item.title}</h4>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-mono">
                              <span className="flex items-center gap-1">
                                <Clock size={11} /> 
                                Next review: <span className={isOverdue ? 'text-rose-400 font-bold' : isDueTodayStr ? 'text-indigo-300 font-bold' : 'text-slate-350'}>
                                  {item.nextRevisionDate}
                                </span>
                              </span>
                              <span>•</span>
                              <span className="bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded-md text-[9px] font-semibold">
                                Leitner Box {item.intervalLevel}
                              </span>
                              {item.lastRevisionDate && (
                                <>
                                  <span>•</span>
                                  <span>Last review: {item.lastRevisionDate}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Review Play controller buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            onClick={() => handleStartReview(item)}
                            className="w-full sm:w-auto py-1.5 px-3.5 text-xs font-semibold rounded-lg bg-indigo-550 border border-indigo-400/20 text-indigo-100 hover:text-white hover:bg-indigo-600 transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                          >
                            <Play size={11} fill="currentColor" />
                            <span>Study & Log</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleDeleteRevisionItem(item.id)}
                            className="p-2 rounded-lg bg-slate-900 border border-white/5 hover:bg-rose-950/20 hover:border-rose-500/30 text-slate-500 hover:text-rose-400 transition"
                            title="Remove from schedule"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
          </div>

          {/* Revision Scheduler Setup Section */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <h3 className="text-sm uppercase font-mono tracking-widest text-slate-350 font-bold flex items-center gap-2">
              <Plus size={16} className="text-indigo-400" />
              Revision Scheduler Setup
            </h3>

            {(savedNotes.length === 0) ? (
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2 leading-relaxed">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>
                  No local study notes or active recall concepts exist yet to schedule! Head back to the <strong>Active Recall</strong> tab and paste or generate some study topics first!
                </span>
              </div>
            ) : (
              <form onSubmit={handleCreateSchedule} className="space-y-4 font-sans">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Item type option selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">1. Select Material Type</label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value as any)}
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                    >
                      <option value="note">Study Guide Note Topic</option>
                      <option value="flashcard">Logical Flashcard</option>
                      <option value="quiz">Interactive Quiz</option>
                    </select>
                  </div>

                  {/* Target Select Dropdown depending on selection */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">2. Choose Study Item Target</label>
                    <select
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                    >
                      {selectedType === 'note' && savedNotes.map(n => (
                        <option key={n.id} value={n.id}>Note: {n.title} ({Math.round(n.content.length / 5)} words)</option>
                      ))}

                      {selectedType === 'flashcard' && (() => {
                        const fcs: { id: string; front: string }[] = [];
                        Object.keys(generatedMaterial).forEach((noteId) => {
                          const mat = generatedMaterial[noteId];
                          if (mat && mat.flashcards) {
                            const note = savedNotes.find(sn => sn.id === noteId);
                            mat.flashcards.forEach((f: any) => {
                              fcs.push({ id: f.id, front: `${note ? note.title : 'Guide'} : ${f.front}` });
                            });
                          }
                        });
                        return fcs.map(f => (
                          <option key={f.id} value={f.id}>{f.front}</option>
                        ));
                      })()}

                      {selectedType === 'quiz' && (() => {
                        const qzs: { id: string; title: string }[] = [];
                        Object.keys(generatedMaterial).forEach((noteId) => {
                          const mat = generatedMaterial[noteId];
                          if (mat && mat.quizzes) {
                            const note = savedNotes.find(sn => sn.id === noteId);
                            mat.quizzes.forEach((q: any) => {
                              qzs.push({ id: q.id, title: `${note ? note.title : 'Guide'} : ${q.title}` });
                            });
                          }
                        });
                        return qzs.map(q => (
                          <option key={q.id} value={q.id}>{q.title}</option>
                        ));
                      })()}

                      {/* Fallback empty view option */}
                      {selectedType === 'flashcard' && Object.values(generatedMaterial).every(m => !(m as any).flashcards?.length) && (
                        <option disabled>No generated flashcards exist yet.</option>
                      )}
                      {selectedType === 'quiz' && Object.values(generatedMaterial).every(m => !(m as any).quizzes?.length) && (
                        <option disabled>No quizzes exist in database yet.</option>
                      )}
                    </select>
                  </div>

                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950/30 border border-white/5 rounded-xl">
                  {/* Automatic Leitner interval state selection */}
                  <div className="flex items-center gap-3">
                    <input
                      id="checkbox-spaced-rep"
                      type="checkbox"
                      checked={useSpacedRep}
                      onChange={(e) => setUseSpacedRep(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-opacity-0 bg-slate-950 border border-white/10"
                    />
                    <label htmlFor="checkbox-spaced-rep" className="text-xs cursor-pointer select-none">
                      <span className="font-semibold text-white block">Automatic Spaced Repetition (Recommended)</span>
                      <span className="text-[10px] text-slate-400 block font-normal">Schedules review for tomorrow, increasing intervals dynamically on success.</span>
                    </label>
                  </div>

                  {/* Date Input only shown if Custom Schedule is manually forced */}
                  {!useSpacedRep && (
                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Choose Date:</span>
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-505"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-indigo-650 hover:bg-indigo-600 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Calendar size={13} />
                    <span>Schedule Revision Event</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Progress Analytics & History logs (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Progress Analytics Chart */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <h3 className="text-sm uppercase font-mono tracking-widest text-slate-350 font-bold flex items-center gap-2 border-b border-b-white/5 pb-2">
              <BarChart3 size={16} className="text-indigo-400" />
              Smart Revision Analytics
            </h3>

            {/* Streak & Streak meter */}
            <div className="grid grid-cols-2 gap-3 pb-3">
              <div className="p-3 bg-slate-900/60 border border-white/5 rounded-xl text-center space-y-1">
                <span className="text-[10px] text-slate-500 font-mono block uppercase">Total Sessions</span>
                <span className="text-xl font-mono font-bold text-white">{totalRevisionsCompleted}</span>
              </div>
              <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-center space-y-1">
                <span className="text-[10px] text-indigo-400 font-mono block uppercase">Active Streak</span>
                <span className="text-xl font-mono font-bold text-indigo-300">{currentStreak} Days</span>
              </div>
            </div>

            {/* Weekly activity bars log */}
            <div className="space-y-3">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold block">Weekly Activity (Last 7 Days)</span>
              
              <div className="flex items-end justify-between h-24 pt-4 px-2 bg-slate-950/45 rounded-xl border border-white/5">
                {Object.entries(weeklyActivityData).map(([day, val]) => {
                  const maxVal = Math.max(...Object.values(weeklyActivityData), 1);
                  const barHeightPct = Math.round((val / maxVal) * 100);

                  return (
                    <div key={day} className="flex flex-col items-center flex-1 h-full group justify-end">
                      {/* Tooltip on hover */}
                      <span className="opacity-0 group-hover:opacity-100 transition absolute bg-slate-950 px-1.5 py-0.5 rounded text-[8px] font-mono text-indigo-200 border border-indigo-500/20 translate-y-[-24px]">
                        {val}
                      </span>
                      {/* Bar indicator */}
                      <div 
                        style={{ height: `${barHeightPct}%` }}
                        className={`w-3.5 rounded-t-sm transition-all duration-300 ${
                          val > 0 ? 'bg-indigo-455 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'bg-slate-800'
                        }`}
                      ></div>
                      <span className="text-[8px] text-slate-500 font-mono mt-2 truncate max-w-[28px]">
                        {day.substring(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Spaced Repetition Cognitive Mastery Map Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-b-white/5 pb-2">
              <h3 className="text-sm uppercase font-mono tracking-widest text-slate-350 font-bold flex items-center gap-2">
                <Star size={16} className="text-amber-400 fill-amber-500/10 animate-pulse" />
                Cognitive Mastery
              </h3>
              
              <div className="flex bg-slate-950/45 p-0.5 border border-white/5 rounded-lg text-[9px] font-semibold">
                <button
                  type="button"
                  onClick={() => setMasteryViewTab('subject')}
                  className={`px-2 py-1 rounded transition ${masteryViewTab === 'subject' ? 'bg-indigo-650 text-white' : 'text-slate-400'}`}
                >
                  Subject
                </button>
                <button
                  type="button"
                  onClick={() => setMasteryViewTab('chapter')}
                  className={`px-2 py-1 rounded transition ${masteryViewTab === 'chapter' ? 'bg-indigo-650 text-white' : 'text-slate-400'}`}
                >
                  Chapter
                </button>
                <button
                  type="button"
                  onClick={() => setMasteryViewTab('topic')}
                  className={`px-2 py-1 rounded transition ${masteryViewTab === 'topic' ? 'bg-indigo-650 text-white' : 'text-slate-400'}`}
                >
                  Topic
                </button>
              </div>
            </div>

            <p className="text-[10px] text-slate-450 font-sans leading-normal">
              Cognitive progress measured by your reviews and retention success scores.
            </p>

            <div className="space-y-3.5 max-h-[290px] overflow-y-auto pr-1">
              {masteryViewTab === 'subject' && (
                subjectMasteryData.length === 0 ? (
                  <div className="text-center p-6 text-slate-500 font-sans text-xs">No subjects created yet.</div>
                ) : (
                  subjectMasteryData.map(sub => (
                    <div key={sub.id} className="space-y-1 bg-slate-900/20 p-2.5 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white truncate max-w-[150px] flex items-center gap-1.5">
                          <span 
                            className="w-2.5 h-2.5 rounded-full inline-block shrink-0" 
                            style={{ backgroundColor: sub.color.startsWith('#') ? sub.color : undefined }}
                          />
                          {sub.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-350">{sub.avgMastery}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-indigo-455 h-full rounded-full transition-all duration-350"
                          style={{ width: `${sub.avgMastery}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                        <span>Card Items: {sub.count}</span>
                        <span>{sub.masteredCount} mastered</span>
                      </div>
                    </div>
                  ))
                )
              )}

              {masteryViewTab === 'chapter' && (
                chapterMasteryData.length === 0 ? (
                  <div className="text-center p-6 text-slate-500 font-sans text-xs">No study chapters created yet.</div>
                ) : (
                  chapterMasteryData.map(ch => (
                    <div key={ch.id} className="space-y-1 bg-slate-900/20 p-2.5 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white truncate max-w-[150px]" title={ch.title}>{ch.title}</span>
                        <span className="font-mono text-[10px] text-slate-350">{ch.avgMastery}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-350"
                          style={{ width: `${ch.avgMastery}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                        <span className="truncate max-w-[120px] text-slate-400">{ch.subjectName}</span>
                        <span>Items: {ch.count}</span>
                      </div>
                    </div>
                  ))
                )
              )}

              {masteryViewTab === 'topic' && (
                topicMasteryData.length === 0 ? (
                  <div className="text-center p-6 text-slate-500 font-sans text-xs">No topics created yet.</div>
                ) : (
                  topicMasteryData.map(tp => (
                    <div key={tp.id} className="space-y-1 bg-slate-900/20 p-2.5 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white truncate max-w-[150px]" title={tp.title}>{tp.title}</span>
                        <span className="font-mono text-[10px] text-slate-350">{tp.avgMastery}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-amber-500 h-full rounded-full transition-all duration-350"
                          style={{ width: `${tp.avgMastery}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                        <span className="truncate max-w-[120px] text-slate-450">{tp.chapterTitle}</span>
                        <span>Items: {tp.count}</span>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>

          {/* Interactive Study History Log Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <h3 className="text-sm uppercase font-mono tracking-widest text-slate-350 font-bold flex items-center gap-2 border-b border-b-white/5 pb-2">
              <History size={16} className="text-indigo-400 animate-pulse" />
              History Log
            </h3>

            <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
              {revisionLogs.length === 0 ? (
                <div className="text-center p-6 text-slate-500 font-sans text-xs">
                  No revision logs submitted yet.
                </div>
              ) : (
                revisionLogs.map(log => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-900/30 rounded-xl border border-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-white truncate font-medium font-sans leading-relaxed">{log.title}</p>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 border ${
                      log.perfRating === 'again'
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        : log.perfRating === 'good'
                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                        : 'bg-emerald-505 border border-emerald-500/20 text-emerald-400'
                    }`}>
                      {log.perfRating}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ----------------------------------------------------
          INTERACTIVE STUDY & REVISION POPUP/MODAL OVERLAY
          ---------------------------------------------------- */}
      <AnimatePresence>
        {activeReviewItem && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10">
            {/* Background Backdrop Blur Block */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl"
            />

            {/* Distraction-Free Close button on absolute corner */}
            <button
              type="button"
              onClick={() => setActiveReviewItem(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 x-50 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-350 hover:text-white rounded-xl text-xs font-semibold tracking-wider font-mono transition border border-white/5 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Exit Review [Esc]</span>
            </button>

            {/* Immersive Dedicated Review Workspace Frame */}
            <motion.div
              initial={{ scale: 0.98, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.98, y: 10, opacity: 0 }}
              className="relative w-full max-w-2xl bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl flex flex-col gap-6 font-sans text-slate-200 backdrop-blur-lg"
            >
              
              {/* Top HUD: Card Meta & Mastery indicators */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div className="space-y-1">
                  <span className="inline-block bg-indigo-500/20 text-indigo-300 text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border border-indigo-400/10">
                    {activeReviewItem.itemType.toUpperCase()} REVIEW DECK
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-white leading-relaxed">{activeReviewItem.title}</h3>
                </div>

                {/* Cognitive HUD indicators */}
                <div className="flex items-center gap-2 sm:gap-3 bg-slate-950/60 p-2 border border-white/5 rounded-xl text-[10px] font-mono font-semibold">
                  <div className="text-center px-1.5 border-r border-white/10">
                    <span className="text-indigo-400 block text-[9px] uppercase tracking-wider">Level</span>
                    <span className="text-white text-xs block font-bold">Box {activeReviewItem.intervalLevel}</span>
                  </div>
                  <div className="text-center px-1.5 border-r border-white/10">
                    <span className="text-amber-400 block text-[9px] uppercase tracking-wider">Easiness</span>
                    <span className="text-white text-xs block font-bold">{(activeReviewItem.easiness ?? 2.5).toFixed(1)}x</span>
                  </div>
                  <div className="text-center px-1.5">
                    <span className="text-emerald-400 block text-[9px] uppercase tracking-wider">Mastery</span>
                    <span className="text-white text-xs block font-bold">{getItemMastery(activeReviewItem)}%</span>
                  </div>
                </div>
              </div>

              {/* Distraction-Free Review Desk Content */}
              <div className="flex-1 py-3">
                
                {/* 1. Note Document Review */}
                {activeReviewItem.itemType === 'note' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
                      <FileText size={16} />
                      <span>Active Recall retrieval room</span>
                    </div>
                    <div className="p-5 bg-slate-950/45 border border-white/5 rounded-2xl max-h-[220px] overflow-y-auto leading-relaxed shadow-inner">
                      <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">{reviewContent?.body}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans leading-normal">
                      Spend 1-2 minutes reading the key details. Challenge yourself to reproduce the inner formulas or outline structure mentally before choosing a recall rating.
                    </p>
                  </div>
                )}

                {/* 2. Flashcard Recall Screen */}
                {activeReviewItem.itemType === 'flashcard' && (
                  <div className="space-y-6 text-center">
                    
                    {/* Index Card Front */}
                    <div className="p-6 sm:p-8 bg-slate-950/60 border border-white/5 rounded-2xl relative shadow-inner">
                      <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">Front Side Question</span>
                      <h4 className="text-sm sm:text-base font-bold text-white tracking-wide font-sans leading-relaxed pt-3">
                        {reviewContent?.front}
                      </h4>
                    </div>

                    {/* Reveal Action / Index Card Back */}
                    {!revealedBack ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setRevealedBack(true)}
                          className="py-3 px-6 bg-gradient-to-r from-indigo-600 to-indigo-750 hover:from-indigo-500 hover:to-indigo-650 text-white font-bold text-xs sm:text-sm rounded-xl border border-indigo-400/20 shadow-lg w-full transition cursor-pointer"
                        >
                          Reveal Solution [Space / Enter]
                        </button>
                        <span className="text-[10px] text-slate-500 font-mono block">Can also press spacebar to show the back</span>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 sm:p-8 bg-emerald-950/15 border border-emerald-500/20 rounded-2xl relative shadow-inner"
                      >
                        <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Solution Answer Back</span>
                        <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed font-sans pt-3 whitespace-pre-wrap">
                          {reviewContent?.back}
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* 3. Multiple Choice Interactive Practice */}
                {activeReviewItem.itemType === 'quiz' && (
                  <div className="space-y-4">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block">MCQ Answer Validation</span>
                    
                    <div className="p-4 sm:p-5 bg-slate-950/60 border border-white/5 rounded-2xl shadow-inner">
                      <p className="text-xs sm:text-sm text-white leading-relaxed font-semibold font-sans">
                        {reviewContent?.question}
                      </p>
                    </div>

                    {/* Radio Button Options list */}
                    <div className="grid grid-cols-1 gap-2.5">
                      {reviewContent?.options.map((opt: string, idx: number) => {
                        const isSelected = quizAnswerSelected === idx;
                        const isCorrect = idx === reviewContent.correctIndex;

                        let styleClasses = "border-white/5 bg-slate-950 hover:bg-white/5 text-slate-350 hover:border-white/10";
                        if (quizSubmitted) {
                          if (isCorrect) {
                            styleClasses = "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-bold shadow-[0_0_12px_rgba(16,185,129,0.1)]";
                          } else if (isSelected) {
                            styleClasses = "border-rose-500/40 bg-rose-500/10 text-rose-300";
                          } else {
                            styleClasses = "border-white/5 bg-slate-950 opacity-55";
                          }
                        } else if (isSelected) {
                          styleClasses = "border-indigo-500 bg-indigo-500/10 text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.1)]";
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (!quizSubmitted) setQuizAnswerSelected(idx);
                            }}
                            className={`w-full text-left p-3.5 text-xs sm:text-sm leading-relaxed border rounded-xl transition cursor-pointer flex items-center gap-1.5 ${styleClasses}`}
                          >
                            <span className="font-mono text-[10px] min-w-[20px] text-indigo-400 font-bold">({String.fromCharCode(65 + idx)})</span>
                            <span className="text-slate-200">{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {!quizSubmitted ? (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (quizAnswerSelected === null) {
                              addToast('Please choose an answer option!', 'warning');
                              return;
                            }
                            setQuizSubmitted(true);
                          }}
                          className="py-3 px-6 bg-gradient-to-r from-indigo-650 to-indigo-750 hover:bg-indigo-600 text-white font-semibold text-xs sm:text-sm rounded-xl border border-indigo-400/20 shadow-lg w-full transition cursor-pointer"
                        >
                          Submit Test Answer (Enter)
                        </button>
                        <span className="text-[9px] text-slate-500 font-mono block text-center">Press [1, 2, 3, 4] keys to pre-select options, then [Enter]</span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-950 text-center font-mono text-[11px] border border-white/5">
                        {quizAnswerSelected === reviewContent?.correctIndex ? (
                          <span className="text-emerald-400 font-semibold">✓ CORRECT OPTION chosen! Active memory is solid.</span>
                        ) : (
                          <span className="text-rose-400 font-semibold">✗ INCORRECT OPTION chosen! Correct answer is: ({String.fromCharCode(65 + (reviewContent?.correctIndex ?? 0))})</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Progress feedback buttons based on SM-2 spaced repetition scales */}
              <div className="space-y-3.5 pt-4 border-t border-white/5">
                <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-mono tracking-widest font-bold block text-center">
                  Assess recollection recall rating:
                </span>
                
                <div className="grid grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleLogRevision('again')}
                    className="py-3 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-semibold cursor-pointer transition flex flex-col items-center gap-0.5 group shadow"
                  >
                    <span className="font-bold group-hover:scale-105 transition">Again</span>
                    <span className="text-[8px] font-mono text-rose-400/70">Forget [1]</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogRevision('hard')}
                    className="py-3 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-semibold cursor-pointer transition flex flex-col items-center gap-0.5 group shadow"
                  >
                    <span className="font-bold group-hover:scale-105 transition">Hard</span>
                    <span className="text-[8px] font-mono text-amber-400/70">Struggle [2]</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogRevision('good')}
                    className="py-3 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-xs font-semibold cursor-pointer transition flex flex-col items-center gap-0.5 group shadow"
                  >
                    <span className="font-bold group-hover:scale-105 transition">Good</span>
                    <span className="text-[8px] font-mono text-indigo-300/70">Retained [3]</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogRevision('easy')}
                    className="py-3 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold cursor-pointer transition flex flex-col items-center gap-0.5 group shadow"
                  >
                    <span className="font-bold group-hover:scale-105 transition flex items-center gap-0.5">Easy ⚡</span>
                    <span className="text-[8px] font-mono text-emerald-400/70">Instant [4]</span>
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
