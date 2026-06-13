import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, Sparkles, Plus, Trash2, CheckCircle2, HelpCircle, Layers, 
  BookOpen, ChevronRight, AlertTriangle, RotateCcw, PenTool, Check, FileText, Calendar
} from 'lucide-react';
import { RecallQuestion, RecallFlashcard, RecallQuiz, QuizQuestion, Subject } from '../types';

interface SavedNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  subjectId?: string;
}

interface ActiveRecallHubProps {
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  subjects?: Subject[];
  // Callback to update dashboard statistics
  onRecallStatsChange?: (flashcardCount: number, quizCount: number) => void;
  activeTabProp?: 'editor' | 'questions' | 'flashcards' | 'quiz';
  activeNoteIdProp?: string;
}

// Preloaded default note and generated content
const DEFAULT_NOTE: SavedNote = {
  id: 'default_note_active_recall',
  title: 'Active Recall & Spaced Repetition',
  content: `Active recall is a learning strategy that involves moving information from temporary short-term storage to durable long-term memory by testing your mind. Instead of passively re-reading textbooks or highlighting definitions, you actively stimulate your memory for a piece of information.

Key concepts in active recall:
- Retrieval practice: Forcing your brain to retrieve knowledge increases synaptic strength.
- Flashcards: The front forces a question cue, while the back contains the answer.
- Multiple-choice Quizzes: Great for testing recognition and detailed conceptual understanding.
- Spaced repetition: Testing yourself at increasing intervals (e.g., 1 day, 3 days, 7 days) slows down the forgetting curve.`,
  createdAt: new Date().toISOString()
};

const DEFAULT_QUESTIONS: RecallQuestion[] = [
  {
    id: 'q_default_1',
    question: 'How does active recall differ from passive studying like re-reading?',
    answer: 'Passive studying involves re-reading or highlighting where information flows "in" to the brain. Active recall forces retrieval practice, moving information "out" of the brain, which builds much stronger synaptic connections.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q_default_2',
    question: 'What is Spaced Repetition and why is it paired with Active Recall?',
    answer: 'Spaced repetition is the practice of reviewing material at increasing time intervals (e.g., 1 day, 3 days, 1 week) to counteract the forgetting curve, maximizing retention efficiency.',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_FLASHCARDS: RecallFlashcard[] = [
  {
    id: 'f_default_1',
    front: 'Active Recall definition',
    back: 'A highly efficient study method where you actively stimulate your brain to retrieve information rather than passively reviewing it.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'f_default_2',
    front: 'Retrieval Practice concept',
    back: 'Forcing your memory to pull out information, which strengthens memory retention and synaptic pathways.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'f_default_3',
    front: 'The Forgetting Curve',
    back: 'A mathematical formula representing how learned information slips from memory over time if there is no retrieval attempt.',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_QUIZ: RecallQuiz = {
  id: 'qz_default_1',
  title: 'Introduction to Active Recall Quiz',
  createdAt: new Date().toISOString(),
  questions: [
    {
      id: 'qz_q_1',
      question: 'Which study method forces your brain to retrieve information and strengthens synapses?',
      options: [
        'Passive re-reading of textbooks',
        'Highlighting keywords with markers',
        'Active Recall/Retrieval Practice',
        'Listening to lectures on repeat'
      ],
      correctAnswerIndex: 2
    },
    {
      id: 'qz_q_2',
      question: 'What is the optimal study practice to pair with active recall to disrupt the naturally occurring forgetting curve?',
      options: [
        'Spaced Repetition',
        'Cramming the night before an exam',
        'Writing summary notebooks',
        'Visual brainstorming sessions'
      ],
      correctAnswerIndex: 0
    }
  ]
};

export default function ActiveRecallHubView({ addToast, subjects = [], onRecallStatsChange, activeTabProp, activeNoteIdProp }: ActiveRecallHubProps) {
  // Saved Notes Topics States
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string>(() => localStorage.getItem('active_recall_note_id') || 'default_note_active_recall');
  const [noteTitleInput, setNoteTitleInput] = useState('');
  const [noteContentInput, setNoteContentInput] = useState('');

  // Active recall lists
  const [questions, setQuestions] = useState<RecallQuestion[]>([]);
  const [flashcards, setFlashcards] = useState<RecallFlashcard[]>([]);
  const [quizzes, setQuizzes] = useState<RecallQuiz[]>([]);

  // Generated content mappings by noteId
  // Format: { [noteId]: { questions: [], flashcards: [], quizzes: [] } }
  const [generatedMaterial, setGeneratedMaterial] = useState<Record<string, {
    questions: RecallQuestion[];
    flashcards: RecallFlashcard[];
    quizzes: RecallQuiz[];
  }>>({});

  // Hub workspace flags
  const [activeTab, setActiveTab] = useState<'editor' | 'questions' | 'flashcards' | 'quiz'>(() => (localStorage.getItem('active_recall_tab') as any) || 'editor');

  // Synchronize state when tab changes from outside (e.g., mobile hamburger menu selection)
  useEffect(() => {
    if (activeTabProp) {
      setActiveTab(activeTabProp);
    }
  }, [activeTabProp]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationType, setGenerationType] = useState<string | null>(null);

  // Expanded questions track
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  // Flashcards state
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flashcardLayoutMode, setFlashcardLayoutMode] = useState<'carousel' | 'grid'>('carousel');

  // Quiz Engine state
  const [quizScores, setQuizScores] = useState<Record<string, { selectedAnswers: Record<string, number>; submitted: boolean }>>({});
  const [quizLayoutMode, setQuizLayoutMode] = useState<'all' | 'focused'>('all');
  const [currentQuizQuestionIndex, setCurrentQuizQuestionIndex] = useState<Record<string, number>>({});

  // Active status indicator (checks if server has Gemini credentials)
  const [isGeminiActive, setIsGeminiActive] = useState<boolean>(true);

  // Initialize and load from localstorage
  useEffect(() => {
    // Check if custom saved study notes exist
    const localNotes = localStorage.getItem('recall_study_notes');
    let loadedNotes: SavedNote[] = [];
    if (localNotes) {
      try {
        loadedNotes = JSON.parse(localNotes);
      } catch (err) {
        console.error('Failed to parse study notes', err);
      }
    }

    if (loadedNotes.length === 0) {
      loadedNotes = [DEFAULT_NOTE];
      localStorage.setItem('recall_study_notes', JSON.stringify(loadedNotes));
    }
    setSavedNotes(loadedNotes);

    // Load generated material
    const localMaterial = localStorage.getItem('recall_generated_material');
    let loadedMaterial: typeof generatedMaterial = {};
    if (localMaterial) {
      try {
        loadedMaterial = JSON.parse(localMaterial);
      } catch (err) {
        console.error('Failed to parse generated materials', err);
      }
    }

    // Embed default materials if not yet customized
    if (!loadedMaterial['default_note_active_recall']) {
      loadedMaterial['default_note_active_recall'] = {
        questions: DEFAULT_QUESTIONS,
        flashcards: DEFAULT_FLASHCARDS,
        quizzes: [DEFAULT_QUIZ]
      };
      localStorage.setItem('recall_generated_material', JSON.stringify(loadedMaterial));
    }
    setGeneratedMaterial(loadedMaterial);

    // Initial setup with active note
    const activeND = loadedNotes.find(n => n.id === activeNoteId) || loadedNotes[0];
    if (activeND) {
      setActiveNoteId(activeND.id);
      setNoteTitleInput(activeND.title);
      setNoteContentInput(activeND.content);
      
      const material = loadedMaterial[activeND.id] || { questions: [], flashcards: [], quizzes: [] };
      setQuestions(material.questions);
      setFlashcards(material.flashcards);
      setQuizzes(material.quizzes);
    }

    // Ping check server health / API support
    fetch('/api/health')
      .then(r => r.json())
      .then(data => {
        if (data.geminiKeyPresent === false) {
          setIsGeminiActive(false);
        }
      })
      .catch(() => {
        // App is likely running in local offline Vite dev server (not full-stack yet)
        setIsGeminiActive(false);
      });
  }, []);

  // Update total counts on dashboard
  useEffect(() => {
    if (onRecallStatsChange) {
      // Calculate total counts across all saved notes
      let totalCards = 0;
      let totalQuizzes = 0;
      Object.values(generatedMaterial).forEach((val: any) => {
        totalCards += (val.flashcards || []).length;
        totalQuizzes += (val.quizzes || []).length;
      });
      onRecallStatsChange(totalCards, totalQuizzes);
    }
  }, [generatedMaterial, onRecallStatsChange]);

  // Sync search selection note
  useEffect(() => {
    if (activeNoteIdProp && savedNotes.length > 0) {
      const activeND = savedNotes.find(n => n.id === activeNoteIdProp);
      if (activeND) {
        setActiveNoteId(activeND.id);
        setNoteTitleInput(activeND.title);
        setNoteContentInput(activeND.content);
        
        const material = generatedMaterial[activeND.id] || { questions: [], flashcards: [], quizzes: [] };
        setQuestions(material.questions || []);
        setFlashcards(material.flashcards || []);
        setQuizzes(material.quizzes || []);
        setFlippedCards({});
        setCurrentCardIndex(0);
      }
    }
  }, [activeNoteIdProp, savedNotes, generatedMaterial]);

  // Synchronize state preferences to localStorage
  useEffect(() => {
    localStorage.setItem('active_recall_note_id', activeNoteId);
  }, [activeNoteId]);

  useEffect(() => {
    localStorage.setItem('active_recall_tab', activeTab);
  }, [activeTab]);

  // Update note subject helper
  const handleUpdateNoteSubject = (subjectId: string) => {
    const updated = savedNotes.map(n => {
      if (n.id === activeNoteId) {
        return { ...n, subjectId: subjectId || undefined };
      }
      return n;
    });
    setSavedNotes(updated);
    localStorage.setItem('recall_study_notes', JSON.stringify(updated));
    addToast('Notes subject assignment updated!', 'success');
  };

  // Handle active note change
  const handleSelectNote = (id: string) => {
    setActiveNoteId(id);
    const selected = savedNotes.find(n => n.id === id);
    if (selected) {
      setNoteTitleInput(selected.title);
      setNoteContentInput(selected.content);
      
      const material = generatedMaterial[id] || { questions: [], flashcards: [], quizzes: [] };
      setQuestions(material.questions);
      setFlashcards(material.flashcards);
      setQuizzes(material.quizzes);
      
      // Reset interaction states
      setExpandedQuestions({});
      setFlippedCards({});
      setCurrentCardIndex(0);
      setActiveTab('editor');
    }
  };

  // Create a new empty study note topic
  const handleAddNewNote = () => {
    const newNote: SavedNote = {
      id: `note_${Date.now()}`,
      title: 'New Analytical Study Topic',
      content: '',
      createdAt: new Date().toISOString()
    };
    const updated = [...savedNotes, newNote];
    setSavedNotes(updated);
    localStorage.setItem('recall_study_notes', JSON.stringify(updated));
    setActiveNoteId(newNote.id);
    setNoteTitleInput(newNote.title);
    setNoteContentInput(newNote.content);
    setQuestions([]);
    setFlashcards([]);
    setQuizzes([]);
    
    setExpandedQuestions({});
    setFlippedCards({});
    setCurrentCardIndex(0);
    setActiveTab('editor');
    addToast('New study notes canvas created! 📝', 'success');
  };

  // Delete a note topic and its materials
  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedNotes.length <= 1) {
      addToast('Cannot delete the last remaining topic canvas.', 'warning');
      return;
    }
    
    const index = savedNotes.findIndex(n => n.id === id);
    const updated = savedNotes.filter(n => n.id !== id);
    setSavedNotes(updated);
    localStorage.setItem('recall_study_notes', JSON.stringify(updated));

    const updatedMaterial = { ...generatedMaterial };
    delete updatedMaterial[id];
    setGeneratedMaterial(updatedMaterial);
    localStorage.setItem('recall_generated_material', JSON.stringify(updatedMaterial));

    addToast('Study topic and related material deleted successfully.', 'info');

    // Switch to another note
    const nextActiveIndex = index === 0 ? 0 : index - 1;
    const nextActive = updated[nextActiveIndex];
    if (nextActive) {
      handleSelectNote(nextActive.id);
    }
  };

  // Save changes to current note content
  const handleSaveNoteContent = () => {
    const updated = savedNotes.map(n => {
      if (n.id === activeNoteId) {
        return { ...n, title: noteTitleInput.trim() || 'Untitled Topic', content: noteContentInput };
      }
      return n;
    });
    setSavedNotes(updated);
    localStorage.setItem('recall_study_notes', JSON.stringify(updated));
    addToast('Study notes successfully backed up! 💾', 'success');
  };

  // Call API to generate active recall materials
  const triggerGeneration = async (type: 'questions' | 'flashcards' | 'quiz') => {
    if (!noteContentInput.trim()) {
      addToast('Please enter or paste some study notes first to generate recall materials!', 'warning');
      return;
    }

    setIsGenerating(true);
    setGenerationType(type);
    
    try {
      let endpoint = '';
      if (type === 'questions') endpoint = '/api/recall/questions';
      else if (type === 'flashcards') endpoint = '/api/recall/flashcards';
      else if (type === 'quiz') endpoint = '/api/recall/quiz';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: noteContentInput })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const responseData = await response.json();
      
      // Load current material state
      const currentGen = { ...generatedMaterial };
      const noteMat = currentGen[activeNoteId] || { questions: [], flashcards: [], quizzes: [] };

      if (type === 'questions') {
        const formattedQs: RecallQuestion[] = responseData.map((q: any, idx: number) => ({
          id: `q_gen_${Date.now()}_${idx}`,
          question: q.question,
          answer: q.answer,
          createdAt: new Date().toISOString()
        }));
        noteMat.questions = formattedQs;
        setQuestions(formattedQs);
        setActiveTab('questions');
        addToast(`Successfully synthesized ${formattedQs.length} active recall questions! 🧠`, 'success');
      } 
      else if (type === 'flashcards') {
        const formattedFCs: RecallFlashcard[] = responseData.map((f: any, idx: number) => ({
          id: `f_gen_${Date.now()}_${idx}`,
          front: f.front,
          back: f.back,
          createdAt: new Date().toISOString()
        }));
        noteMat.flashcards = formattedFCs;
        setFlashcards(formattedFCs);
        setCurrentCardIndex(0);
        setActiveTab('flashcards');
        addToast(`Successfully generated ${formattedFCs.length} high-fidelity flashcards! 🗂️`, 'success');
      } 
      else if (type === 'quiz') {
        const formattedQuiz: RecallQuiz = {
          id: `qz_gen_${Date.now()}`,
          title: responseData.title || `${noteTitleInput} Comprehension Quiz`,
          createdAt: new Date().toISOString(),
          questions: responseData.questions.map((q: any, idx: number) => ({
            id: `qz_q_${Date.now()}_${idx}`,
            question: q.question,
            options: q.options,
            correctAnswerIndex: q.correctAnswerIndex
          }))
        };
        noteMat.quizzes = [formattedQuiz];
        setQuizzes([formattedQuiz]);
        
        // Reset scoreboard
        const copyScores = { ...quizScores };
        delete copyScores[formattedQuiz.id];
        setQuizScores(copyScores);
        
        setActiveTab('quiz');
        addToast(`Synthesized a high-yield interactive multiple-choice quiz! 🎓`, 'success');
      }

      currentGen[activeNoteId] = noteMat;
      setGeneratedMaterial(currentGen);
      localStorage.setItem('recall_generated_material', JSON.stringify(currentGen));

    } catch (err) {
      console.error(`Generation error:`, err);
      
      // Fallback local rule-based generation when server is unavailable or fails
      applyLocalRecallFallback(type);
    } finally {
      setIsGenerating(false);
      setGenerationType(null);
    }
  };

  const handleQuickScheduleRevision = (type: 'note' | 'flashcard' | 'quiz', itemId: string, titlePattern: string) => {
    const local = localStorage.getItem('revision_items');
    let items: any[] = [];
    if (local) {
      try {
        items = JSON.parse(local);
      } catch (e) {
        console.error(e);
      }
    }

    const duplicate = items.find(it => it.itemId === itemId && it.itemType === type);
    if (duplicate) {
      addToast(`This ${type} is already scheduled in your revision planner!`, 'info');
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const note = savedNotes.find(n => n.id === activeNoteId);
    const noteTitle = note ? note.title : 'Guide';

    const newItem = {
      id: `rev_quick_${Date.now()}`,
      itemType: type,
      itemId,
      noteId: activeNoteId,
      title: `${type === 'note' ? 'Study Guide' : type === 'flashcard' ? 'Flashcard' : 'Quiz'}: ${noteTitle} (${titlePattern})`,
      intervalLevel: 1,
      nextRevisionDate: tomorrowStr,
      lastRevisionDate: null
    };

    const updated = [newItem, ...items];
    localStorage.setItem('revision_items', JSON.stringify(updated));
    addToast(`"${titlePattern}" is successfully added to Smart Revisions! Scheduled for tomorrow. 📅`, 'success');
  };

  // High quality simulated recall generator fallback
  const applyLocalRecallFallback = (type: 'questions' | 'flashcards' | 'quiz') => {
    const rawText = noteContentInput.trim();
    // Split text into points/lines
    const sentences = rawText
      .split(/[.\n;]/)
      .map(s => s.trim())
      .filter(s => s.length > 20);

    const currentGen = { ...generatedMaterial };
    const noteMat = currentGen[activeNoteId] || { questions: [], flashcards: [], quizzes: [] };

    if (type === 'questions') {
      const generated: RecallQuestion[] = [];
      if (sentences.length > 0) {
        sentences.slice(0, 4).forEach((s, idx) => {
          // Attempt to isolate key terms
          const words = s.split(' ');
          const term = words.slice(0, Math.min(3, words.length)).join(' ');
          generated.push({
            id: `q_fall_${Date.now()}_${idx}`,
            question: `What critical information is summarized regarding "${term}..."?`,
            answer: s,
            createdAt: new Date().toISOString()
          });
        });
      } else {
        generated.push({
          id: `q_fall_empty`,
          question: 'What is the primary thesis of the pasted document?',
          answer: rawText.substring(0, 300) + '...',
          createdAt: new Date().toISOString()
        });
      }
      noteMat.questions = generated;
      setQuestions(generated);
      setActiveTab('questions');
      addToast('Synthesized questions via high-speed Local Engine. 🧠', 'info');
    } 
    else if (type === 'flashcards') {
      const generated: RecallFlashcard[] = [];
      if (sentences.length > 0) {
        sentences.slice(0, 4).forEach((s, idx) => {
          const words = s.split(' ');
          const term = words.slice(0, Math.min(3, words.length)).join(' ') + ' concept';
          generated.push({
            id: `f_fall_${Date.now()}_${idx}`,
            front: `Explain the concept: "${term}"`,
            back: s,
            createdAt: new Date().toISOString()
          });
        });
      } else {
        generated.push({
          id: 'f_fall_empty',
          front: 'Study Notes Overview',
          back: rawText.substring(0, 200) + '...',
          createdAt: new Date().toISOString()
        });
      }
      noteMat.flashcards = generated;
      setFlashcards(generated);
      setCurrentCardIndex(0);
      setActiveTab('flashcards');
      addToast('Compiled flashcard package via Local Engine. 🗂️', 'info');
    } 
    else if (type === 'quiz') {
      const generatedQuizQs: QuizQuestion[] = [];
      if (sentences.length >= 2) {
        sentences.slice(0, 3).forEach((s, idx) => {
          const words = s.split(' ');
          const term = words.slice(0, Math.min(3, words.length)).join(' ');
          generatedQuizQs.push({
            id: `qz_fall_q_${Date.now()}_${idx}`,
            question: `Which of the following aligns closest with "${term}" in this context?`,
            options: [
              s, // Correct option
              `An unrelated process counteracting ${term}.`,
              `The biological degeneration of the ${term} framework.`,
              'None of these statements match.'
            ],
            correctAnswerIndex: 0
          });
        });
      } else {
        generatedQuizQs.push({
          id: `qz_fall_q_empty`,
          question: `The text is primarily formulated around which of the following?`,
          options: [
            `${noteTitleInput}`,
            'No clear concepts described',
            'Hypothetical math systems',
            'Experimental cognitive science'
          ],
          correctAnswerIndex: 0
        });
      }

      const generatedQuiz: RecallQuiz = {
        id: `qz_fall_${Date.now()}`,
        title: `${noteTitleInput} (Local Quiz)`,
        createdAt: new Date().toISOString(),
        questions: generatedQuizQs
      };

      noteMat.quizzes = [generatedQuiz];
      setQuizzes([generatedQuiz]);
      
      const copyScores = { ...quizScores };
      delete copyScores[generatedQuiz.id];
      setQuizScores(copyScores);

      setActiveTab('quiz');
      addToast('Constructed interactive multiple-choice quiz via Local Engine! 🎓', 'info');
    }

    currentGen[activeNoteId] = noteMat;
    setGeneratedMaterial(currentGen);
    localStorage.setItem('recall_generated_material', JSON.stringify(currentGen));
  };

  // Toggle flashcard flip
  const toggleFlipCard = (id: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Toggle single active recall question expansion
  const toggleExpandQuestion = (id: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Handle Quiz Option Select
  const handleSelectQuizOption = (quizId: string, qIndex: number, optionIndex: number) => {
    const qScores = quizScores[quizId] || { selectedAnswers: {}, submitted: false };
    if (qScores.submitted) return; // Locked once submitted

    setQuizScores(prev => ({
      ...prev,
      [quizId]: {
        ...qScores,
        selectedAnswers: {
          ...qScores.selectedAnswers,
          [qIndex]: optionIndex
        }
      }
    }));
  };

  // Submit Quiz Answers
  const handleSubmitQuiz = (quizId: string) => {
    const qScores = quizScores[quizId] || { selectedAnswers: {}, submitted: false };
    const activeQuiz = quizzes.find(q => q.id === quizId);
    if (!activeQuiz) return;

    // Check if all questions are answered
    const totalQs = activeQuiz.questions.length;
    const answeredCount = Object.keys(qScores.selectedAnswers).length;
    
    if (answeredCount < totalQs) {
      addToast('Please complete all questions before submitting!', 'warning');
      return;
    }

    setQuizScores(prev => ({
      ...prev,
      [quizId]: {
        ...qScores,
        submitted: true
      }
    }));

    // Calculate score
    let correctCount = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (qScores.selectedAnswers[idx] === q.correctAnswerIndex) {
        correctCount += 1;
      }
    });

    const percent = Math.round((correctCount / totalQs) * 100);
    if (percent >= 80) {
      addToast(`Spectacular work! Score: ${percent}% (${correctCount}/${totalQs}) 🏆`, 'success');
    } else {
      addToast(`Quiz submitted. Score: ${percent}% (${correctCount}/${totalQs}). Try reviewing the topics again! ✍️`, 'info');
    }
  };

  // Reset Quiz
  const handleResetQuiz = (quizId: string) => {
    setQuizScores(prev => {
      const updated = { ...prev };
      delete updated[quizId];
      return updated;
    });
    addToast('Quiz has been reset. Ready to challenge again!', 'info');
  };

  return (
    <div id="active-recall-hub-root" className="space-y-6">
      
      {/* Intro Context Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400">
            <Brain size={22} className="shrink-0" />
            <span className="text-xs uppercase font-mono tracking-wider font-semibold">Study Booster Pack</span>
          </div>
          <h2 className="text-2xl font-display font-medium text-white tracking-tight">Active Recall Workspace</h2>
          <p className="text-slate-350 text-xs max-w-2xl font-sans leading-relaxed">
            Harness cognitive science to solidify concepts. Paste study guidelines, slide content, or notes, and generate premium study aids instantly.
          </p>
        </div>

        {/* Gemini Engine status banner */}
        <div className="flex items-center gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-white/5 self-start md:self-center shrink-0">
          <div className={`w-2.5 h-2.5 rounded-full ${isGeminiActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></div>
          <div className="font-mono text-[10px]">
            <span className="text-slate-400">Recall Engine: </span>
            <span className={isGeminiActive ? 'text-emerald-400 font-semibold' : 'text-amber-300 font-semibold'} title="Uses server-side Gemini 3.5 Flash">
              {isGeminiActive ? 'Gemini AI Active' : 'Local Backup Simulation'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div id="recall-hub-workspace-grid" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left column sidebar note navigators */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl shadow-xl backdrop-blur-md space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">Topics Folder</span>
              <button
                type="button"
                onClick={handleAddNewNote}
                className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-white border border-indigo-500/30 transition flex items-center gap-1 cursor-pointer"
                title="Create New Topic Notes Canvas"
              >
                <Plus size={14} />
                <span className="text-[10px] font-semibold">New</span>
              </button>
            </div>

            {/* Note selector item cards stack list */}
            <div className="space-y-2 max-h-[300px] lg:max-h-[420px] overflow-y-auto pr-1">
              {savedNotes.map((note) => {
                const isActive = note.id === activeNoteId;
                const mat = generatedMaterial[note.id] || { questions: [], flashcards: [], quizzes: [] };
                const totalMat = (mat.questions || []).length + (mat.flashcards || []).length + (mat.quizzes || []).length;
                const noteSubject = subjects.find(s => s.id === note.subjectId);

                return (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note.id)}
                    className={`group w-full text-left p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
                      isActive 
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-200' 
                        : 'bg-white/0 border-white/5 hover:bg-white/5 text-slate-355 hover:text-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium truncate font-sans leading-tight">
                        {note.title}
                      </span>
                      <button
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-slate-400 hover:text-rose-400 transition"
                        title="Delete folder and contents"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono">
                      <span className="text-slate-500">{note.content ? `${Math.round(note.content.length / 5)} words` : '0 words'}</span>
                      {noteSubject && (
                        <span 
                          className={`px-1 rounded text-white text-[8px] truncate font-medium max-w-[80px] ${!noteSubject.color?.startsWith('#') ? noteSubject.color : ''}`}
                          style={noteSubject.color?.startsWith('#') ? { backgroundColor: noteSubject.color } : undefined}
                        >
                          {noteSubject.name}
                        </span>
                      )}
                      {totalMat > 0 && (
                        <span className="bg-indigo-500/20 text-indigo-300 px-1 rounded font-semibold text-[8px]">
                          {totalMat} items
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right workspace interactive viewport panel */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Work View Mode Navigation Tabs */}
          <div className="flex items-center bg-white/5 border border-white/10 p-1 rounded-2xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition shrink-0 ${
                activeTab === 'editor' 
                  ? 'bg-indigo-600 border border-indigo-500/20 text-white shadow' 
                  : 'text-slate-355 hover:text-white'
              }`}
            >
              <PenTool size={13} />
              <span>Notes Editor</span>
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition shrink-0 ${
                activeTab === 'questions' 
                  ? 'bg-indigo-600 border border-indigo-500/20 text-white shadow' 
                  : 'text-slate-355 hover:text-white'
              }`}
            >
              <HelpCircle size={13} />
              <span>Recall Questions ({questions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition shrink-0 ${
                activeTab === 'flashcards' 
                  ? 'bg-indigo-600 border border-indigo-500/20 text-white shadow' 
                  : 'text-slate-355 hover:text-white'
              }`}
            >
              <Layers size={13} />
              <span>Flashcards ({flashcards.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition shrink-0 ${
                activeTab === 'quiz' 
                  ? 'bg-indigo-600 border border-indigo-500/20 text-white shadow' 
                  : 'text-slate-355 hover:text-white'
              }`}
            >
              <BookOpen size={13} />
              <span>Quiz ({quizzes.length})</span>
            </button>
          </div>

          {/* Active Tab rendering viewport container slots */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md min-h-[380px] flex flex-col justify-between">
            
            {/* Notes Editor Canvas Viewport */}
            {activeTab === 'editor' && (
              <div className="space-y-4 h-full flex flex-col justify-between animate-fade-in flex-1">
                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs uppercase tracking-wider font-mono text-slate-400 font-bold flex items-center gap-1">
                          <FileText size={13} /> Topic Title
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">Autosaved to cache</span>
                      </div>
                      <input
                        type="text"
                        value={noteTitleInput}
                        onChange={(e) => setNoteTitleInput(e.target.value)}
                        onBlur={handleSaveNoteContent}
                        placeholder="e.g. Physics Section 3: Thermodynamics"
                        className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-sans"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-wider font-mono text-slate-400 font-bold flex items-center gap-1">
                        📚 Course Subject
                      </label>
                      <select
                        value={savedNotes.find(n => n.id === activeNoteId)?.subjectId || ''}
                        onChange={(e) => handleUpdateNoteSubject(e.target.value)}
                        className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition cursor-pointer font-sans"
                      >
                        <option value="">-- No Subject --</option>
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.code ? `[${s.code}] ` : ''}{s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label className="text-xs uppercase tracking-wider font-mono text-slate-400 font-bold flex items-center gap-1 pt-2">
                    📚 Pasted Notes Text Content
                  </label>
                  
                  <textarea
                    value={noteContentInput}
                    onChange={(e) => setNoteContentInput(e.target.value)}
                    onBlur={handleSaveNoteContent}
                    placeholder="Paste or write your detailed lecture topics, slides, definitions, or study guidelines here. Use at least 4-5 sentences for optimal AI-powered questions generation..."
                    className="w-full flex-1 min-h-[180px] bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none font-sans leading-relaxed"
                  />
                </div>

                {/* Synthesis Command Control Center Bento Panel */}
                <div className="pt-6 border-t border-white/5 mt-6">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-white flex items-center gap-1">
                        <Sparkles size={13} className="text-indigo-400" /> Cognitive recall generation suite
                      </span>
                      <p className="text-[10px] text-slate-400 font-sans">Choose which study tools should be synthesized from this topic context.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => triggerGeneration('questions')}
                        disabled={isGenerating}
                        className="py-2 px-3 text-xs font-semibold rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 hover:text-white transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      >
                        {isGenerating && generationType === 'questions' ? (
                          <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <HelpCircle size={13} />
                        )}
                        <span>Active Questions</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerGeneration('flashcards')}
                        disabled={isGenerating}
                        className="py-2 px-3 text-xs font-semibold rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/25 text-violet-300 hover:text-white transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      >
                        {isGenerating && generationType === 'flashcards' ? (
                          <div className="w-3.5 h-3.5 border-2 border-violet-300 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Layers size={13} />
                        )}
                        <span>Flashcards</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerGeneration('quiz')}
                        disabled={isGenerating}
                        className="py-2 px-3 text-xs font-semibold rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 hover:text-white transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      >
                        {isGenerating && generationType === 'quiz' ? (
                          <div className="w-3.5 h-3.5 border-2 border-emerald-305 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <BookOpen size={13} />
                        )}
                        <span>Multiple-Choice Quiz</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickScheduleRevision('note', activeNoteId, noteTitleInput || 'Notes Topic')}
                        className="py-2 px-3 text-xs font-semibold rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 hover:text-white transition cursor-pointer flex items-center gap-1"
                        title="Add this complete note guide topic to the Smart Revision queue"
                      >
                        <Calendar size={13} />
                        <span>Schedule Spaced Revision</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Questions Viewport */}
            {activeTab === 'questions' && (
              <div className="space-y-4 h-full animate-fade-in flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5 border-b border-white/5 pb-2 mb-4">
                    <HelpCircle size={15} className="text-indigo-400" /> Active Recall Question List
                  </h3>

                  {questions.length === 0 ? (
                    /* Empty layout state block */
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 border border-white/5 rounded-2xl space-y-3">
                      <HelpCircle className="w-10 h-10 text-slate-600 animate-pulse" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wide">No Questions Logged</h4>
                        <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
                          We haven't parsed this study topic yet. Let Gemini extract deep conceptual questioning logs for you!
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerGeneration('questions')}
                        className="py-2 px-4 text-xs font-semibold rounded-xl bg-indigo-500/15 hover:bg-indigo-500/35 text-indigo-300 border border-indigo-500/40 cursor-pointer transition mt-2"
                      >
                        Synthesize Questions
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {questions.map((q, qidx) => {
                        const isExpanded = !!expandedQuestions[q.id];
                        return (
                          <div 
                            key={q.id}
                            className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden transition"
                          >
                            <button
                              onClick={() => toggleExpandQuestion(q.id)}
                              className="w-full text-left p-4 flex items-start justify-between gap-3 hover:bg-white/5 transition cursor-pointer"
                            >
                              <div className="flex gap-2 text-slate-200">
                                <span className="font-mono text-[10px] text-indigo-400 pt-0.5 font-bold">Q{qidx + 1}.</span>
                                <p className="text-xs font-semibold text-slate-100 leading-relaxed font-sans">{q.question}</p>
                              </div>
                              <span className="text-[10px] uppercase font-mono text-indigo-400 shrink-0 font-bold self-center bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/10 whitespace-nowrap">
                                {isExpanded ? 'Hide Answer' : 'Reveal Answer'}
                              </span>
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="border-t border-white/5 bg-slate-900/60"
                                >
                                  <div className="p-4 text-xs text-indigo-200 bg-indigo-500/5 leading-relaxed font-sans flex gap-2">
                                    <span className="font-mono text-[10px] text-emerald-400 pt-0.5 font-bold">Concept:</span>
                                    <p>{q.answer}</p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {questions.length > 0 && (
                  <div className="pt-4 border-t border-white/5 mt-4 text-[10px] font-mono text-slate-400 flex justify-between items-center">
                    <span>{questions.length} questions loaded</span>
                    <button
                      type="button"
                      onClick={() => triggerGeneration('questions')}
                      className="text-indigo-400 hover:text-indigo-200 transition font-sans font-semibold cursor-pointer"
                    >
                      Regenerate
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Flashcards Viewport */}
            {activeTab === 'flashcards' && (
              <div className="space-y-4 h-full animate-fade-in flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-b-white/5 pb-2 mb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-1.5 animate-pulse">
                      <Layers size={15} className="text-violet-400" /> Active Recall Flashcards
                    </h3>
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/5 text-[10px] font-mono">
                      <button
                        type="button"
                        onClick={() => setFlashcardLayoutMode('carousel')}
                        className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition ${flashcardLayoutMode === 'carousel' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      >
                        Carousel (1-by-1)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFlashcardLayoutMode('grid')}
                        className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition ${flashcardLayoutMode === 'grid' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      >
                        Grid View (Scan All)
                      </button>
                    </div>
                  </div>

                  {flashcards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 border border-white/5 rounded-2xl space-y-3">
                      <Layers className="w-10 h-10 text-slate-600 animate-pulse" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wide">No Cards Generated</h4>
                        <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
                          We haven't compiled flashcards for this study topic. Let Gemini generate customized double-sided study cards!
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerGeneration('flashcards')}
                        className="py-2 px-4 text-xs font-semibold rounded-xl bg-violet-500/15 hover:bg-violet-500/35 text-violet-300 border border-violet-500/40 cursor-pointer transition mt-2"
                      >
                        Generate Flashcards
                      </button>
                    </div>
                  ) : flashcardLayoutMode === 'carousel' ? (
                    <div className="space-y-6 flex flex-col items-center">
                      
                      {/* Active Flashcard Canvas (interactive 3D Perspective Flip) */}
                      <div 
                        onClick={() => toggleFlipCard(flashcards[currentCardIndex].id)}
                        className="w-full max-w-sm h-48 cursor-pointer select-none"
                        style={{ perspective: '1000px' }}
                      >
                        <div 
                          className="w-full h-full relative transition-transform duration-500 transform-style-3d shadow-2xl rounded-2xl"
                          style={{ 
                            transformStyle: 'preserve-3d',
                            transform: flippedCards[flashcards[currentCardIndex].id] ? 'rotateY(180deg)' : 'rotateY(0)' 
                          }}
                        >
                          {/* Front Side Card */}
                          <div 
                            className="absolute inset-0 w-full h-full bg-slate-900 border border-white/10 rounded-2xl p-6 flex flex-col justify-between text-center overflow-hidden"
                            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                          >
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Front Side Option</span>
                            <div className="flex-1 flex items-center justify-center">
                              <h4 className="text-sm font-semibold font-sans text-slate-100 tracking-wide leading-relaxed bg-emerald-500/5 px-2 py-1 rounded-sm border border-emerald-500/10">
                                {flashcards[currentCardIndex].front}
                              </h4>
                            </div>
                            <span className="text-[10px] text-indigo-400 font-sans font-semibold">Tap Card to Flip & Reveal</span>
                          </div>

                          {/* Back Side Card */}
                          <div 
                            className="absolute inset-0 w-full h-full bg-indigo-950 border border-indigo-500/30 rounded-2xl p-6 flex flex-col justify-between text-center overflow-hidden"
                            style={{ 
                              backfaceVisibility: 'hidden', 
                              WebkitBackfaceVisibility: 'hidden',
                              transform: 'rotateY(180deg)' 
                            }}
                          >
                            <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-bold">Retrieved concept / back</span>
                            <div className="flex-1 flex items-center justify-center">
                              <p className="text-xs font-medium font-sans text-indigo-200 leading-relaxed max-h-[100px] overflow-y-auto">
                                {flashcards[currentCardIndex].back}
                              </p>
                            </div>
                            <span className="text-[10px] text-slate-400 font-sans font-semibold">Tap to flip back</span>
                          </div>
                        </div>
                      </div>

                      {/* Navigation Carousel Controllers */}
                      <div className="flex items-center gap-6 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentCardIndex(prev => Math.max(0, prev - 1));
                          }}
                          disabled={currentCardIndex === 0}
                          className="p-2 sm:p-2.5 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-slate-900 transition text-slate-350 hover:text-white disabled:opacity-30 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                          &larr; Prev
                        </button>

                        <span className="font-mono text-xs text-slate-400 font-semibold select-none">
                          Card {currentCardIndex + 1} of {flashcards.length}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setCurrentCardIndex(prev => Math.min(flashcards.length - 1, prev + 1));
                          }}
                          disabled={currentCardIndex === flashcards.length - 1}
                          className="p-2 sm:p-2.5 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-slate-900 transition text-slate-350 hover:text-white disabled:opacity-30 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                          Next &rarr;
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Show All Bento Grid view */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[350px] overflow-y-auto pr-1">
                      {flashcards.map((fc, index) => {
                        const isFlipped = !!flippedCards[fc.id];
                        return (
                          <div
                            key={fc.id}
                            onClick={() => toggleFlipCard(fc.id)}
                            className="bg-slate-900/60 border border-white/5 hover:border-violet-500/30 rounded-2xl p-4 cursor-pointer hover:bg-slate-900/80 transition flex flex-col justify-between min-h-[140px] text-center relative select-none group"
                          >
                            <span className="absolute top-2.5 left-3 font-mono text-[9px] text-slate-500 font-bold">
                              Card {index + 1}
                            </span>
                            
                            <div className="flex-1 flex flex-col justify-center py-2">
                              {!isFlipped ? (
                                <>
                                  <span className="text-[8px] uppercase tracking-wider font-mono text-indigo-400 font-bold mb-1 block">Front Cue</span>
                                  <p className="text-[11px] font-semibold text-white leading-relaxed font-sans">{fc.front}</p>
                                  <span className="text-[9px] text-indigo-400 mt-2.5 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Click to reveal details</span>
                                </>
                              ) : (
                                <div className="bg-indigo-950/25 border border-indigo-500/10 rounded-xl p-2.5">
                                  <span className="text-[8px] uppercase tracking-wider font-mono text-emerald-400 font-bold mb-1 block">Memory Back</span>
                                  <p className="text-[10px] text-indigo-200 leading-relaxed font-sans">{fc.back}</p>
                                  <span className="text-[9px] text-slate-500 mt-2.5 block">Click to flip back</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-end mt-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickScheduleRevision('flashcard', fc.id, fc.front.substring(0, 25) + '...');
                                }}
                                className="text-[9px] text-amber-300 font-mono bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded-lg hover:bg-amber-900/35 transition"
                              >
                                📅 Schedule Repetition
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {flashcards.length > 0 && (
                  <div className="pt-4 border-t border-white/5 mt-4 text-[10px] font-mono text-slate-400 flex justify-between items-center text-xs">
                    <span>Study Package of {flashcards.length} Interactive Deck</span>
                    <div className="flex items-center gap-4 text-[10px]">
                      {flashcardLayoutMode === 'carousel' && (
                        <button
                          type="button"
                          onClick={() => handleQuickScheduleRevision(
                            'flashcard', 
                            flashcards[currentCardIndex].id, 
                            flashcards[currentCardIndex].front.substring(0, 25) + '...'
                          )}
                          className="text-amber-400 hover:text-amber-250 transition font-sans font-semibold cursor-pointer"
                          title="Add this specific flashcard to the Smart Spaced Repetition queue"
                        >
                          📅 Schedule Revision
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => triggerGeneration('flashcards')}
                        className="text-violet-400 hover:text-violet-200 transition font-sans font-semibold cursor-pointer"
                      >
                        Regenerate Deck
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quiz Viewport */}
            {activeTab === 'quiz' && (
              <div className="space-y-4 h-full animate-fade-in flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-b-white/5 pb-2 mb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-1.5 animate-pulse">
                      <BookOpen size={15} className="text-emerald-400" /> Topic Comprehension Quiz
                    </h3>
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/5 text-[10px] font-mono">
                      <button
                        type="button"
                        onClick={() => setQuizLayoutMode('all')}
                        className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition ${quizLayoutMode === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      >
                        All (Standard List)
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuizLayoutMode('focused')}
                        className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition ${quizLayoutMode === 'focused' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      >
                        Focused (1-by-1)
                      </button>
                    </div>
                  </div>

                  {quizzes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 border border-white/5 rounded-2xl space-y-3">
                      <BookOpen className="w-10 h-10 text-slate-600 animate-pulse" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wide">No Quiz Loaded</h4>
                        <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
                          We haven't constructed a multiple-choice diagnostic test from these study notes. Let Gemini design one!
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerGeneration('quiz')}
                        className="py-2 px-4 text-xs font-semibold rounded-xl bg-emerald-500/15 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 cursor-pointer transition mt-2"
                      >
                        Generate Quiz
                      </button>
                    </div>
                  ) : (
                    <div>
                      {quizzes.map((quiz) => {
                        const scoreData = quizScores[quiz.id] || { selectedAnswers: {}, submitted: false };
                        const isSubmitted = scoreData.submitted;

                        // Calculate results if submitted
                        let correctAnswersCount = 0;
                        quiz.questions.forEach((q, idx) => {
                          if (scoreData.selectedAnswers[idx] === q.correctAnswerIndex) {
                            correctAnswersCount += 1;
                          }
                        });

                        const currentQIdx = currentQuizQuestionIndex[quiz.id] || 0;
                        const shownQuestions = quizLayoutMode === 'all' 
                          ? quiz.questions 
                          : [quiz.questions[currentQIdx]].filter(Boolean);

                        return (
                          <div key={quiz.id} className="space-y-5">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-white/5 pb-2">
                              <h4 className="text-xs uppercase font-mono tracking-wider font-semibold text-slate-300">
                                {quiz.title}
                              </h4>
                              {isSubmitted && (
                                <span className={`text-xs ml-auto font-bold px-2.5 py-0.5 rounded-lg border ${
                                  correctAnswersCount === quiz.questions.length 
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                                }`}>
                                  Score: {correctAnswersCount}/{quiz.questions.length} ({Math.round((correctAnswersCount / quiz.questions.length) * 100)}%)
                                </span>
                              )}
                            </div>

                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                              {shownQuestions.map((q, rawIdx) => {
                                const qidx = quizLayoutMode === 'all' ? rawIdx : currentQIdx;
                                return (
                                  <div key={q.id} className="space-y-2.5 bg-slate-900/40 border border-white/5 p-4 rounded-xl">
                                    <p className="text-xs font-semibold text-slate-200 leading-relaxed font-sans flex gap-2">
                                      <span className="text-indigo-400 font-mono">{qidx + 1}.</span>
                                      <span>{q.question}</span>
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {q.options.map((opt, optidx) => {
                                        const isSelected = scoreData.selectedAnswers[qidx] === optidx;
                                        const isCorrect = q.correctAnswerIndex === optidx;
                                        
                                        // Border colors based on state
                                        let optionStyle = 'bg-slate-900/60 border-white/5 text-slate-350 hover:bg-white/5';
                                        let statusSign = null;

                                        if (isSelected && !isSubmitted) {
                                          optionStyle = 'bg-indigo-500/10 border-indigo-500 text-indigo-200';
                                        } 
                                        else if (isSubmitted) {
                                          if (isCorrect) {
                                            optionStyle = 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-medium';
                                            statusSign = <Check size={11} className="text-emerald-400" />;
                                          } 
                                          else if (isSelected && !isCorrect) {
                                            optionStyle = 'bg-rose-500/10 border-rose-500 text-rose-400 line-through';
                                          } 
                                          else {
                                            optionStyle = 'bg-slate-900/40 border-white/5 text-slate-550 opacity-60';
                                          }
                                        }

                                        return (
                                          <button
                                            key={optidx}
                                            type="button"
                                            onClick={() => handleSelectQuizOption(quiz.id, qidx, optidx)}
                                            disabled={isSubmitted}
                                            className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center justify-between gap-2 ${
                                              isSubmitted ? 'cursor-default' : 'cursor-pointer'
                                            } ${optionStyle}`}
                                          >
                                            <span>{opt}</span>
                                            {statusSign}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Pagination controllers for Focused Mode */}
                            {quizLayoutMode === 'focused' && (
                              <div className="flex items-center justify-between bg-slate-950/40 p-2 border border-white/5 rounded-xl text-xs font-mono">
                                <button
                                  type="button"
                                  onClick={() => setCurrentQuizQuestionIndex(prev => ({ ...prev, [quiz.id]: Math.max(0, currentQIdx - 1) }))}
                                  disabled={currentQIdx === 0}
                                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 disabled:opacity-30 cursor-pointer text-[10px]"
                                >
                                  &larr; Prev Question
                                </button>
                                <span className="text-[10px] text-slate-400 font-bold">
                                  Question {currentQIdx + 1} of {quiz.questions.length}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setCurrentQuizQuestionIndex(prev => ({ ...prev, [quiz.id]: Math.min(quiz.questions.length - 1, currentQIdx + 1) }))}
                                  disabled={currentQIdx === quiz.questions.length - 1}
                                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 disabled:opacity-30 cursor-pointer text-[10px]"
                                >
                                  Next Question &rarr;
                                </button>
                              </div>
                            )}

                            {/* Quiz Interactive CAs Submit Buttons panel */}
                            <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                              {!isSubmitted ? (
                                <button
                                  type="button"
                                  onClick={() => handleSubmitQuiz(quiz.id)}
                                  className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/20 text-white cursor-pointer transition flex items-center gap-1.5"
                                >
                                  <CheckCircle2 size={13} />
                                  <span>Submit Quiz Answers</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleResetQuiz(quiz.id);
                                    setCurrentQuizQuestionIndex(prev => ({ ...prev, [quiz.id]: 0 }));
                                  }}
                                  className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-350 hover:text-white cursor-pointer transition flex items-center gap-1.5"
                                >
                                  <RotateCcw size={13} />
                                  <span>Retake Quiz</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => triggerGeneration('quiz')}
                                className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 cursor-pointer transition border border-indigo-500/20 ml-auto"
                              >
                                Generate Different Quiz
                              </button>

                              <button
                                type="button"
                                onClick={() => handleQuickScheduleRevision(
                                  'quiz', 
                                  quiz.id, 
                                  quiz.title.substring(0, 30)
                                )}
                                className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-350 cursor-pointer transition border border-amber-500/20"
                                title="Add this quiz to your spaced repetition memory queue"
                              >
                                📅 Schedule Revision
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {quizzes.length > 0 && quizzes[0].questions.length > 0 && (
                  <div className="pt-4 border-t border-white/5 mt-4 text-[10px] font-mono text-slate-400">
                    <span>Active quiz containing {quizzes[0].questions.length} MCQ diagnostics</span>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
