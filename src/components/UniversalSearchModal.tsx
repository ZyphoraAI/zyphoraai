import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, X, Clock, HelpCircle, ArrowRight, CornerDownLeft, Sparkles, 
  GraduationCap, Folder, Tag, FileText, Layers, BookOpen, Calendar, Trash2 
} from 'lucide-react';
import { Subject, Chapter, Topic, SavedNote, StudySession } from '../types';

export interface SearchResult {
  id: string;
  type: 'subject' | 'chapter' | 'topic' | 'note' | 'flashcard' | 'quiz' | 'question' | 'session';
  title: string;
  subtitle?: string;
  preview: string;
  color?: string;
  parentId?: string; // used for notes, flashcards, quizzes, questions
}

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onNavigate: (view: 'dashboard' | 'tasks' | 'planner' | 'recall' | 'revision' | 'library' | 'import', subTab?: string) => void;
  
  // Callbacks to coordinate with active view selections
  setSearchActiveRecallNoteId: (id: string | undefined) => void;
  setSearchLibrarySubjectId: (id: string | undefined) => void;
  setSearchLibraryChapterId: (id: string | undefined) => void;
  setSearchLibraryTopicId: (id: string | undefined) => void;
  setSearchLibraryNoteId: (id: string | undefined) => void;
}

export default function UniversalSearchModal({
  isOpen,
  onClose,
  subjects,
  onNavigate,
  setSearchActiveRecallNoteId,
  setSearchLibrarySubjectId,
  setSearchLibraryChapterId,
  setSearchLibraryTopicId,
  setSearchLibraryNoteId
}: UniversalSearchModalProps) {
  const [tempQuery, setTempQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Suggestions for empty queries
  const SUGGESTIONS = [
    'Calculus', 'Equations', 'Force', 'Motion', 'Psychology', 'Recall', 'Decisions'
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('student_os_recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse recent searches', e);
    }
  }, [isOpen]);

  // Handle hotkey Cmd+K or Ctrl+K to toggle modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          onClose(); // safety close logic
          // Trigger open via parent state would be standard, but toggling here
          const trigger = document.getElementById('search-trigger-btn');
          if (trigger) trigger.click();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced query updater
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(tempQuery);
    }, 150);
    return () => clearTimeout(handler);
  }, [tempQuery]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTempQuery('');
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Built matches database
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setResults([]);
      return;
    }

    // 1. Gather all data sources
    const subjectsList = subjects || [];
    
    let chaptersList: Chapter[] = [];
    try {
      const stored = localStorage.getItem('recall_chapters');
      if (stored) chaptersList = JSON.parse(stored);
    } catch (e) {}

    let topicsList: Topic[] = [];
    try {
      const stored = localStorage.getItem('recall_topics');
      if (stored) topicsList = JSON.parse(stored);
    } catch (e) {}

    let notesList: SavedNote[] = [];
    try {
      const stored = localStorage.getItem('recall_study_notes');
      if (stored) notesList = JSON.parse(stored);
    } catch (e) {}

    let sessionsList: StudySession[] = [];
    try {
      const stored = localStorage.getItem('student_os_study_sessions');
      if (stored) sessionsList = JSON.parse(stored);
    } catch (e) {}

    let materialMap: Record<string, { questions?: any[]; flashcards?: any[]; quizzes?: any[] }> = {};
    try {
      const stored = localStorage.getItem('recall_generated_material');
      if (stored) materialMap = JSON.parse(stored);
    } catch (e) {}

    const matches: SearchResult[] = [];

    // 2. Perform deep search matching
    
    // - Subjects
    subjectsList.forEach(sub => {
      if (sub.name.toLowerCase().includes(query) || (sub.code && sub.code.toLowerCase().includes(query))) {
        matches.push({
          id: sub.id,
          type: 'subject',
          title: sub.name,
          subtitle: sub.code || 'Course Code',
          preview: `Course Subject • ${sub.code || 'No Code'}`,
          color: sub.color,
        });
      }
    });

    // - Chapters
    chaptersList.forEach(ch => {
      if (ch.title.toLowerCase().includes(query)) {
        const parentSub = subjectsList.find(s => s.id === ch.subjectId);
        matches.push({
          id: ch.id,
          type: 'chapter',
          title: ch.title,
          subtitle: parentSub ? `Subject: ${parentSub.name}` : undefined,
          preview: parentSub ? `Chapter under Course: ${parentSub.name}` : 'Course Plan Chapter',
        });
      }
    });

    // - Topics
    topicsList.forEach(tp => {
      if (tp.title.toLowerCase().includes(query)) {
        const parentCh = chaptersList.find(c => c.id === tp.chapterId);
        const parentSub = parentCh ? subjectsList.find(s => s.id === parentCh.subjectId) : null;
        matches.push({
          id: tp.id,
          type: 'topic',
          title: tp.title,
          subtitle: parentCh ? `Chapter: ${parentCh.title}` : undefined,
          preview: parentSub && parentCh ? `Topic: ${parentSub.name} › ${parentCh.title}` : 'Topic Outline Node',
        });
      }
    });

    // - Notes Guides
    notesList.forEach(note => {
      const titleMatch = note.title.toLowerCase().includes(query);
      const contentMatch = note.content.toLowerCase().includes(query);
      if (titleMatch || contentMatch) {
        let matchExcerpt = '';
        if (contentMatch) {
          const idx = note.content.toLowerCase().indexOf(query);
          const start = Math.max(0, idx - 45);
          const end = Math.min(note.content.length, idx + query.length + 45);
          const rawExcerpt = note.content.substring(start, end).replace(/\n/g, ' ');
          matchExcerpt = (start > 0 ? '...' : '') + rawExcerpt + (end < note.content.length ? '...' : '');
        } else {
          matchExcerpt = note.content.length > 90 ? note.content.substring(0, 90) + '...' : note.content;
        }

        const parentSub = subjectsList.find(s => s.id === note.subjectId);
        matches.push({
          id: note.id,
          type: 'note',
          title: note.title,
          subtitle: parentSub ? `Subject: ${parentSub.name}` : undefined,
          preview: matchExcerpt,
        });
      }
    });

    // - Flashcards, Quizzes, and Questions
    Object.entries(materialMap).forEach(([noteId, mat]) => {
      const parentNote = notesList.find(n => n.id === noteId);
      const parentSub = parentNote ? subjectsList.find(s => s.id === parentNote.subjectId) : null;

      // Flashcards
      const fcs = mat.flashcards || [];
      fcs.forEach((fc, fcIdx) => {
        const frontMatch = fc.front.toLowerCase().includes(query);
        const backMatch = fc.back.toLowerCase().includes(query);
        if (frontMatch || backMatch) {
          matches.push({
            id: `${noteId}-fc-${fcIdx}`,
            type: 'flashcard',
            title: `Flashcard: ${fc.front}`,
            subtitle: parentNote ? `${parentNote.title}` : 'Memory Deck',
            preview: `Answer: ${fc.back} • ${parentSub ? parentSub.name : 'Recall Guide'}`,
            parentId: noteId,
          });
        }
      });

      // Quizzes
      const qzs = mat.quizzes || [];
      qzs.forEach((qz, qzIdx) => {
        const titleMatch = (qz.title || '').toLowerCase().includes(query);
        let matchedQText = '';
        let questionsMatch = false;

        if (qz.questions) {
          for (const q of qz.questions) {
            if (q.question.toLowerCase().includes(query)) {
              questionsMatch = true;
              matchedQText = q.question;
              break;
            }
          }
        }

        if (titleMatch || questionsMatch) {
          matches.push({
            id: `${noteId}-qz-${qzIdx}`,
            type: 'quiz',
            title: qz.title || 'Chapter Quiz',
            subtitle: parentNote ? `${parentNote.title}` : 'Assessment',
            preview: matchedQText ? `Matching Question: "${matchedQText}"` : `Quiz with ${(qz.questions || []).length} items • ${parentSub ? parentSub.name : 'Study System'}`,
            parentId: noteId,
          });
        }
      });

      // Questions (Active Recall tests)
      const qas = mat.questions || [];
      qas.forEach((qa, qaIdx) => {
        const questionMatch = qa.question.toLowerCase().includes(query);
        const answerMatch = qa.answer.toLowerCase().includes(query);
        if (questionMatch || answerMatch) {
          matches.push({
            id: `${noteId}-qa-${qaIdx}`,
            type: 'question',
            title: `Recall Test: ${qa.question}`,
            subtitle: parentNote ? `${parentNote.title}` : 'Active Retrieve',
            preview: `Self-Explanation Answer: ${qa.answer}`,
            parentId: noteId,
          });
        }
      });
    });

    // - Study Sessions
    sessionsList.forEach(sess => {
      const titleMatch = sess.title.toLowerCase().includes(query);
      const subjectMatch = sess.subjectName.toLowerCase().includes(query);
      if (titleMatch || subjectMatch) {
        matches.push({
          id: sess.id,
          type: 'session',
          title: sess.title,
          subtitle: `${sess.subjectName}`,
          preview: `${sess.completed ? '✓ Completed' : '⏳ Scheduled'} • duration: ${sess.duration} mins • ${sess.date}`,
        });
      }
    });

    setResults(matches);
    setSelectedIndex(0);
  }, [searchQuery, subjects]);

  // Handle Result Clicks & Navigations
  const handleSelectResult = (result: SearchResult) => {
    // 1. Add search query to recent searches
    const q = searchQuery.trim();
    if (q) {
      const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem('student_os_recent_searches', JSON.stringify(updated));
    }

    // 2. Clear previous transition states
    setSearchActiveRecallNoteId(undefined);
    setSearchLibrarySubjectId(undefined);
    setSearchLibraryChapterId(undefined);
    setSearchLibraryTopicId(undefined);
    setSearchLibraryNoteId(undefined);

    // 3. Routing operations
    switch (result.type) {
      case 'subject':
        onNavigate('planner', 'subjects');
        break;
      case 'chapter':
        setSearchLibraryChapterId(result.id);
        onNavigate('library');
        break;
      case 'topic':
        setSearchLibraryTopicId(result.id);
        onNavigate('library');
        break;
      case 'note':
        setSearchLibraryNoteId(result.id);
        onNavigate('library');
        break;
      case 'flashcard':
        if (result.parentId) {
          setSearchActiveRecallNoteId(result.parentId);
        }
        onNavigate('recall', 'flashcards');
        break;
      case 'quiz':
        if (result.parentId) {
          setSearchActiveRecallNoteId(result.parentId);
        }
        onNavigate('recall', 'quiz');
        break;
      case 'question':
        if (result.parentId) {
          setSearchActiveRecallNoteId(result.parentId);
        }
        onNavigate('recall', 'questions');
        break;
      case 'session':
        onNavigate('planner', 'sessions');
        break;
    }

    onClose();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectResult(results[selectedIndex]);
      }
    }
  };

  // Keep selected element visible inside overflow container
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Quick Action: Delete custom recent searches
  const handleDeleteRecent = (search: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== search);
    setRecentSearches(updated);
    localStorage.setItem('student_os_recent_searches', JSON.stringify(updated));
  };

  // Quick Action: Clear all recents
  const handleClearAllRecents = () => {
    setRecentSearches([]);
    localStorage.removeItem('student_os_recent_searches');
  };

  // Groups representation
  const renderIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'subject': return <GraduationCap className="h-4 w-4 text-indigo-400 shrink-0" />;
      case 'chapter': return <Folder className="h-4 w-4 text-emerald-400 shrink-0" />;
      case 'topic': return <Tag className="h-4 w-4 text-teal-400 shrink-0" />;
      case 'note': return <FileText className="h-4 w-4 text-purple-400 shrink-0" />;
      case 'flashcard': return <Layers className="h-4 w-4 text-violet-400 shrink-0" />;
      case 'quiz': return <BookOpen className="h-4 w-4 text-pink-400 shrink-0" />;
      case 'question': return <HelpCircle className="h-4 w-4 text-amber-400 shrink-0" />;
      case 'session': return <Calendar className="h-4 w-4 text-sky-400 shrink-0" />;
    }
  };

  const getFormatName = (type: SearchResult['type']): string => {
    switch (type) {
      case 'subject': return 'Subject';
      case 'chapter': return 'Chapter';
      case 'topic': return 'Topic';
      case 'note': return 'Note Guide';
      case 'flashcard': return 'Flashcard';
      case 'quiz': return 'Quiz';
      case 'question': return 'Active Recall';
      case 'session': return 'Study Session';
    }
  };

  // Grouped results map
  const renderHeaderGroupLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'subject':
      case 'chapter':
      case 'topic':
        return 'ORGANIZATION / CURRICULUM';
      case 'note':
        return 'STUDY GUIDES / NOTEBOOKS';
      case 'flashcard':
      case 'quiz':
      case 'question':
        return 'RECALL & COMPREHENSION AIDS';
      case 'session':
        return 'PLANNER & TIMEBOXES';
    }
  };

  // Divide the flat results array into logically grouped sections visually but preserve flat index for keyboard selectors.
  const groupedIndices: Record<string, number[]> = {};
  results.forEach((res, index) => {
    const parentHeader = renderHeaderGroupLabel(res.type);
    if (!groupedIndices[parentHeader]) {
      groupedIndices[parentHeader] = [];
    }
    groupedIndices[parentHeader].push(index);
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[10vh] px-4 md:px-0">
          
          {/* Immersive backdrop overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Search Box Card */}
          <motion.div 
            id="search-palette-modal"
            initial={{ opacity: 0, scale: 0.97, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -20 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-2xl bg-slate-900/95 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.15)] overflow-hidden flex flex-col max-h-[75vh]"
          >
            {/* Realtime Action Input Wrapper */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0">
              <Search className="h-5 w-5 text-indigo-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search subjects, chapters, topics, notes, flashcards, active recall..."
                value={tempQuery}
                onChange={(e) => setTempQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full text-sm bg-transparent border-0 text-slate-100 placeholder-slate-450 focus:ring-0 focus:outline-none py-1"
              />
              {tempQuery && (
                <button 
                  onClick={() => setTempQuery('')}
                  className="p-1 rounded-md text-slate-450 hover:text-white hover:bg-white/5 transition shrink-0 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-block bg-slate-800 border border-white/5 rounded px-2 py-0.5 text-[10px] text-slate-400 font-mono shrink-0 select-none">ESC</kbd>
            </div>

            {/* Results, Suggestions & Recents viewports */}
            <div 
              ref={scrollContainerRef}
              className="overflow-y-auto flex-1 p-3 space-y-4 max-h-[400px]"
            >
              <AnimatePresence mode="wait">
                {searchQuery.trim() === '' ? (
                  /* Initial display: suggestions & recents */
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {recentSearches.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center px-2">
                          <span className="text-[10px] font-mono tracking-wider font-bold text-slate-450 uppercase flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-450" />
                            Recent Searches
                          </span>
                          <button 
                            onClick={handleClearAllRecents}
                            className="text-[9px] text-slate-400 hover:text-rose-400 transition flex items-center gap-1 font-mono cursor-pointer"
                          >
                            <Trash2 className="w-2.5 h-2.5" /> Clear All
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 px-1 py-1">
                          {recentSearches.map((term, idx) => (
                            <div 
                              key={idx}
                              onClick={() => setTempQuery(term)}
                              className="group flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/5 hover:border-indigo-500/40 hover:bg-indigo-500/10 text-slate-300 hover:text-white rounded-xl text-xs transition cursor-pointer"
                            >
                              <span>{term}</span>
                              <span 
                                onClick={(e) => handleDeleteRecent(term, e)}
                                className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <span className="text-[10px] font-mono tracking-wider font-bold text-slate-450 uppercase px-2 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        Quick Suggestions
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-1">
                        {SUGGESTIONS.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => setTempQuery(s)}
                            className="text-left px-3 py-2 bg-white/5 border border-white/5 hover:border-indigo-400/40 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-indigo-500/5 transition cursor-pointer flex items-center justify-between"
                          >
                            <span>{s}</span>
                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition text-indigo-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3 text-[10px] text-slate-400 px-2 flex items-center gap-2">
                      <div className="p-1 rounded bg-indigo-500/10 text-indigo-400">
                        <kbd className="font-mono">Ctrl+K</kbd>
                      </div>
                      <span>to quick trigger research anytime</span>
                    </div>
                  </motion.div>
                ) : results.length > 0 ? (
                  /* Display Grouped Results */
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {Object.entries(groupedIndices).map(([groupTitle, itemIndices]) => (
                      <div key={groupTitle} className="space-y-1.5">
                        <div className="text-[9px] font-mono tracking-wider font-bold text-slate-450 uppercase px-2">
                          {groupTitle}
                        </div>
                        <div className="space-y-1">
                          {itemIndices.map((flatIdx) => {
                            const res = results[flatIdx];
                            const isSelected = selectedIndex === flatIdx;
                            return (
                              <div
                                key={res.id}
                                data-selected={isSelected}
                                onClick={() => handleSelectResult(res)}
                                onMouseEnter={() => setSelectedIndex(flatIdx)}
                                className={`group w-full text-left p-3 rounded-xl transition cursor-pointer border flex flex-col justify-between gap-1 ${
                                  isSelected 
                                    ? 'bg-indigo-600/20 border-indigo-500/45 text-white' 
                                    : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-500/20' : 'bg-white/5'}`}>
                                      {renderIcon(res.type)}
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="text-xs font-semibold font-sans truncate text-white">
                                        {res.title}
                                      </h4>
                                      {res.subtitle && (
                                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                          {res.subtitle}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <span className="text-[9px] px-2 py-0.5 font-mono uppercase bg-white/5 border border-white/10 rounded text-slate-400 shrink-0">
                                    {getFormatName(res.type)}
                                  </span>
                                </div>

                                <div className="pl-[34px] flex items-center justify-between gap-2">
                                  <p className="text-[10px] text-slate-400 font-sans line-clamp-1 group-hover:text-slate-300 transition italic">
                                    {res.preview}
                                  </p>
                                  {isSelected && (
                                    <span className="hidden sm:flex items-center gap-1 text-[9px] text-indigo-400 font-mono self-end shrink-0">
                                      <span>Go</span> <CornerDownLeft className="w-2.5 h-2.5" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  /* Empty states search results none loaded */
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-12 px-6 text-center space-y-3"
                  >
                    <div className="h-12 w-12 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center mx-auto mb-2 text-indigo-400">
                      <HelpCircle className="w-6 h-6 animate-pulse" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200">No content matches found</h3>
                    <p className="text-xs text-slate-450 max-w-md mx-auto">
                      Could not find any items matching "<span className="text-indigo-300 font-mono">{searchQuery}</span>". Try refining your search or checking spelling.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer hints */}
            {results.length > 0 && (
              <div className="hidden sm:flex items-center justify-between px-4 py-2 bg-slate-850/80 border-t border-white/5 text-[9px] text-slate-450 font-mono shrink-0">
                <span className="flex items-center gap-1.5">
                  Type <span className="px-1 py-0.5 bg-white/5 rounded border border-white/5">↑↓</span> to navigate, <span className="px-1 py-0.5 bg-white/5 rounded border border-white/5">Enter</span> to select
                </span>
                <span>Found {results.length} items</span>
              </div>
            )}
          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
}
