import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Library, Search, Tag, BookOpen, Layers, HelpCircle, FileText, 
  ChevronRight, ArrowUpRight, GraduationCap, Grid, List, Briefcase, Calendar,
  FolderOpen, Plus, Trash2, Edit3, Save, Sparkles, Brain, Check, Folder, ArrowLeft,
  ChevronDown
} from 'lucide-react';
import { Subject, Chapter, Topic, SavedNote } from '../types';
import StudyOrganizerTree from './StudyOrganizerTree';
import StudyOrganizerActiveStudy from './StudyOrganizerActiveStudy';

interface StudyLibraryViewProps {
  subjects: Subject[];
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onNavigate: (view: 'dashboard' | 'tasks' | 'planner' | 'recall' | 'revision' | 'library' | 'import') => void;
  addSubject?: (name: string, color: string, code?: string) => void;
  updateSubject?: (id: string, name: string, color: string, code?: string) => void;
  deleteSubject?: (id: string) => void;

  // Search connection selections
  selectedSubjectIdProp?: string;
  selectedChapterIdProp?: string;
  selectedTopicIdProp?: string;
  selectedNoteIdProp?: string;
}

export default function StudyLibraryView({ 
  subjects, 
  addToast, 
  onNavigate,
  addSubject,
  updateSubject,
  deleteSubject,
  selectedSubjectIdProp,
  selectedChapterIdProp,
  selectedTopicIdProp,
  selectedNoteIdProp
}: StudyLibraryViewProps) {
  // Navigation tabs toggle: 'flat' (original view) or 'organizer' (expanded organizer)
  const [activeTabMode, setActiveTabMode] = useState<'flat' | 'organizer'>('organizer');

  // FLAT RECORDS DATABASE STATES (Original Functionality)
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [material, setMaterial] = useState<Record<string, { questions?: any[]; flashcards?: any[]; quizzes?: any[] }>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectIdFlat, setSelectedSubjectIdFlat] = useState<string>('all');
  const [selectedTypeFlat, setSelectedTypeFlat] = useState<'all' | 'note' | 'recall' | 'flashcard' | 'quiz'>('all');
  const [viewModeFlat, setViewModeFlat] = useState<'grid' | 'list'>('grid');

  // ORGANIZER WORKSPACE HIERARCHY STATES
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  // Selected Nodes in Tree Navigation
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  
  // Active selected note within active topic
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');

  // Editor Drafts
  const [draftNoteTitle, setDraftNoteTitle] = useState('');
  const [draftNoteContent, setDraftNoteContent] = useState('');

  // Responsive mobile sub-toggle: 'tree' outline or active 'workspace' panel
  const [mobileOrganizerView, setMobileOrganizerView] = useState<'tree' | 'workspace'>('tree');

  // Creator forms state
  const [isAddingSubjectForm, setIsAddingSubjectForm] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubColor, setNewSubColor] = useState('bg-indigo-500');

  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'editor' | 'flashcards' | 'quiz' | 'recall'>('editor');
  const [isSynthesizing, setIsSynthesizing] = useState<'questions' | 'flashcards' | 'quiz' | null>(null);

  const workspacePanelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll workspace panel to bottom of block when active tab is selected or changed
  useEffect(() => {
    if (activeWorkspaceTab !== 'editor' && workspacePanelRef.current) {
      setTimeout(() => {
        workspacePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [activeWorkspaceTab]);

  // Load and seed details on mount
  useEffect(() => {
    // 1. Study notes
    const localNotes = localStorage.getItem('recall_study_notes');
    let loadedNotes: SavedNote[] = [];
    if (localNotes) {
      try {
        loadedNotes = JSON.parse(localNotes);
      } catch (err) {
        console.error('Failed to parse notes in library', err);
      }
    }
    setNotes(loadedNotes);

    // 2. Generated material
    const localMaterial = localStorage.getItem('recall_generated_material');
    let loadedMaterial = {};
    if (localMaterial) {
      try {
        loadedMaterial = JSON.parse(localMaterial);
      } catch (err) {
        console.error('Failed to parse material in library', err);
      }
    }
    setMaterial(loadedMaterial);

    // 3. Chapters
    const localChapters = localStorage.getItem('recall_chapters');
    let loadedChapters: Chapter[] = [];
    if (localChapters) {
      try {
        loadedChapters = JSON.parse(localChapters);
      } catch (err) {}
    }

    // 4. Topics
    const localTopics = localStorage.getItem('recall_topics');
    let loadedTopics: Topic[] = [];
    if (localTopics) {
      try {
        loadedTopics = JSON.parse(localTopics);
      } catch (err) {}
    }

    // Auto seed default Math & Science hierarchy if they don't exist yet!
    if (loadedChapters.length === 0 && loadedTopics.length === 0) {
      let mathSub = subjects.find(s => s.name.toLowerCase().includes('math') || s.name.toLowerCase().includes('calculus'));
      let scienceSub = subjects.find(s => s.name.toLowerCase().includes('science') || s.name.toLowerCase().includes('physics'));
      
      const mathSubId = mathSub?.id || 'sub-1';
      const scienceSubId = scienceSub?.id || 'sub-4';

      loadedChapters = [
        { id: 'ch-1', subjectId: mathSubId, title: 'Algebra', createdAt: new Date().toISOString() },
        { id: 'ch-2', subjectId: scienceSubId, title: 'Force', createdAt: new Date().toISOString() }
      ];

      loadedTopics = [
        { id: 'top-1', chapterId: 'ch-1', title: 'Linear Equations', createdAt: new Date().toISOString() },
        { id: 'top-2', chapterId: 'ch-1', title: 'Quadratic Equations', createdAt: new Date().toISOString() },
        { id: 'top-3', chapterId: 'ch-2', title: 'Motion', createdAt: new Date().toISOString() }
      ];

      const seedNotes = [
        {
          id: 'note-math-demo',
          title: 'Introduction to Linear Equations',
          content: 'A linear equation is an algebraic equation of the form y = mx + b, where m is the slope and b is the y-intercept. The graph of a linear equation forms a straight line on a Cartesian plane.\n\nKey Concepts:\n1. Slope (m): Represents the steepness and direction of the line. Calculated as rise over run (change in y divided by change in x).\n2. Y-Intercept (b): The point where the graph crosses the vertical y-axis (when x = 0).\n3. Standard Form: Ax + By = C, where A, B, and C are integers.\n4. Independent Variable (x) and Dependent Variable (y).',
          createdAt: new Date().toISOString(),
          subjectId: mathSubId,
          chapterId: 'ch-1',
          topicId: 'top-1'
        },
        {
          id: 'note-science-demo',
          title: 'Understanding Force and Motion',
          content: 'Newton\'s laws of motion are three physical laws that, together, laid the foundation for classical mechanics. They describe the relationship between a body and the forces acting upon it, and its motion in response to those forces.\n\nKey Laws:\n1. Law of Inertia (Newton\'s First Law): An object at rest remains at rest, and an object in motion remains in motion with constant velocity, unless acted upon by a net external force.\n2. Acceleration Rule (Newton\'s Second Law): F = ma. The vector sum of the forces on an object is equal to the mass of that object multiplied by the acceleration vector.\n3. Action-Reaction (Newton\'s Third Law): For every action, there is an equal and opposite reaction.\n4. Force is measured in Newtons (N). Acceleration is change in velocity over time.',
          createdAt: new Date().toISOString(),
          subjectId: scienceSubId,
          chapterId: 'ch-2',
          topicId: 'top-3'
        }
      ];

      localStorage.setItem('recall_chapters', JSON.stringify(loadedChapters));
      localStorage.setItem('recall_topics', JSON.stringify(loadedTopics));

      // Append demo notes
      const mergedNotes = [...loadedNotes];
      if (!mergedNotes.some(n => n.id === 'note-math-demo')) {
        mergedNotes.push(...seedNotes);
        localStorage.setItem('recall_study_notes', JSON.stringify(mergedNotes));
        loadedNotes = mergedNotes;
      }
    }

    setChapters(loadedChapters);
    setTopics(loadedTopics);
    setNotes(loadedNotes);

    // Default selection to Maths Algebra -> Linear Equations
    setSelectedSubjectId('sub-1');
    setSelectedChapterId('ch-1');
    setSelectedTopicId('top-1');
    
    const initialNoteObj = loadedNotes.find(n => n.topicId === 'top-1');
    if (initialNoteObj) {
      setSelectedNoteId(initialNoteObj.id);
      setDraftNoteTitle(initialNoteObj.title);
      setDraftNoteContent(initialNoteObj.content);
    }
  }, [subjects]);

  // Selections coordination effect for global search results
  useEffect(() => {
    if (selectedSubjectIdProp) {
      setSelectedSubjectId(selectedSubjectIdProp);
      setActiveTabMode('organizer');
    }
    if (selectedChapterIdProp) {
      setSelectedChapterId(selectedChapterIdProp);
      setActiveTabMode('organizer');
      const ch = chapters.find(c => c.id === selectedChapterIdProp);
      if (ch) {
        setSelectedSubjectId(ch.subjectId);
      }
    }
    if (selectedTopicIdProp) {
      setSelectedTopicId(selectedTopicIdProp);
      setActiveTabMode('organizer');
      const tp = topics.find(t => t.id === selectedTopicIdProp);
      if (tp) {
        const ch = chapters.find(c => c.id === tp.chapterId);
        if (ch) {
          setSelectedChapterId(ch.id);
          setSelectedSubjectId(ch.subjectId);
        }
      }
      setMobileOrganizerView('workspace');
    }
    if (selectedNoteIdProp) {
      const noteObj = notes.find(n => n.id === selectedNoteIdProp);
      if (noteObj) {
        setSelectedNoteId(noteObj.id);
        setDraftNoteTitle(noteObj.title);
        setDraftNoteContent(noteObj.content);
        setActiveTabMode('organizer');
        setActiveWorkspaceTab('editor');
        if (noteObj.topicId) {
          setSelectedTopicId(noteObj.topicId);
          const tp = topics.find(t => t.id === noteObj.topicId);
          if (tp) {
            const ch = chapters.find(c => c.id === tp.chapterId);
            if (ch) {
              setSelectedChapterId(ch.id);
              setSelectedSubjectId(ch.subjectId);
            }
          }
        }
      }
      setMobileOrganizerView('workspace');
    }
  }, [selectedSubjectIdProp, selectedChapterIdProp, selectedTopicIdProp, selectedNoteIdProp, notes, chapters, topics]);

  // Sync utilities
  const saveChaptersToStorage = (updated: Chapter[]) => {
    setChapters(updated);
    localStorage.setItem('recall_chapters', JSON.stringify(updated));
  };

  const saveTopicsToStorage = (updated: Topic[]) => {
    setTopics(updated);
    localStorage.setItem('recall_topics', JSON.stringify(updated));
  };

  const saveNotesToStorage = (updated: SavedNote[]) => {
    setNotes(updated);
    localStorage.setItem('recall_study_notes', JSON.stringify(updated));
  };

  // State operations - Chapters & Topics
  const handleAddChapter = (subjectId: string, title: string) => {
    const newCh: Chapter = {
      id: `ch_${Date.now()}`,
      subjectId,
      title: title.trim(),
      createdAt: new Date().toISOString()
    };
    const updated = [...chapters, newCh];
    saveChaptersToStorage(updated);
    addToast(`Chapter "${title}" created successfully! 📂`, 'success');
  };

  const handleAddTopic = (chapterId: string, title: string) => {
    const newTop: Topic = {
      id: `top_${Date.now()}`,
      chapterId,
      title: title.trim(),
      createdAt: new Date().toISOString()
    };
    const updated = [...topics, newTop];
    saveTopicsToStorage(updated);
    addToast(`Topic "${title}" created successfully! 📍`, 'success');
  };

  const handleDeleteChapter = (chId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ch = chapters.find(c => c.id === chId);
    if (!ch) return;

    // Filter out chapter
    const updatedCh = chapters.filter(c => c.id !== chId);
    saveChaptersToStorage(updatedCh);

    // Get sub-topics to disconnect them
    const subTopics = topics.filter(t => t.chapterId === chId);
    const subTopicIds = subTopics.map(t => t.id);

    // Filter out topics
    const updatedTop = topics.filter(t => t.chapterId !== chId);
    saveTopicsToStorage(updatedTop);

    // Disconnect corresponding notes from this chapter and topics
    const updatedNotes = notes.map(n => {
      if (n.chapterId === chId || (n.topicId && subTopicIds.includes(n.topicId))) {
        return { ...n, chapterId: undefined, topicId: undefined };
      }
      return n;
    });
    saveNotesToStorage(updatedNotes);

    // Clear active selections if needed
    if (selectedChapterId === chId) {
      setSelectedChapterId('');
      setSelectedTopicId('');
      setSelectedNoteId('');
    }

    addToast(`Chapter "${ch.title}" deleted safely. Notes remain unorganized.`, 'info');
  };

  const handleDeleteTopic = (topId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const top = topics.find(t => t.id === topId);
    if (!top) return;

    // Filter out topic
    const updatedTop = topics.filter(t => t.id !== topId);
    saveTopicsToStorage(updatedTop);

    // Disconnect corresponding notes
    const updatedNotes = notes.map(n => {
      if (n.topicId === topId) {
        return { ...n, topicId: undefined };
      }
      return n;
    });
    saveNotesToStorage(updatedNotes);

    if (selectedTopicId === topId) {
      setSelectedTopicId('');
      setSelectedNoteId('');
    }

    addToast(`Topic "${top.title}" deleted safely. Notes kept unassigned.`, 'info');
  };

  const handleDeleteSubjectLocal = (subId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteSubject) {
      deleteSubject(subId);
      
      // Cascade delete chapters, topics, disconnect notes
      const updatedCh = chapters.filter(c => c.subjectId !== subId);
      const chIdsInSub = chapters.filter(c => c.subjectId === subId).map(c => c.id);
      saveChaptersToStorage(updatedCh);

      const updatedTop = topics.filter(t => !chIdsInSub.includes(t.chapterId));
      const topIdsInSub = topics.filter(t => chIdsInSub.includes(t.chapterId)).map(t => t.id);
      saveTopicsToStorage(updatedTop);

      const updatedNotes = notes.map(n => {
        if (n.subjectId === subId || (n.topicId && topIdsInSub.includes(n.topicId))) {
          return { ...n, subjectId: undefined, chapterId: undefined, topicId: undefined };
        }
        return n;
      });
      saveNotesToStorage(updatedNotes);

      if (selectedSubjectId === subId) {
        setSelectedSubjectId('');
        setSelectedChapterId('');
        setSelectedTopicId('');
        setSelectedNoteId('');
      }
    }
  };

  // Node Click Handlers from folder tree
  const handleSelectSubject = (id: string) => {
    setSelectedSubjectId(id);
    setSelectedChapterId('');
    setSelectedTopicId('');
    setSelectedNoteId('');
    setMobileOrganizerView('workspace');
  };

  const handleSelectChapter = (id: string) => {
    const ch = chapters.find(c => c.id === id);
    if (ch) {
      setSelectedSubjectId(ch.subjectId);
      setSelectedChapterId(id);
      setSelectedTopicId('');
      setSelectedNoteId('');
      setMobileOrganizerView('workspace');
    }
  };

  const handleSelectTopic = (id: string) => {
    const top = topics.find(t => t.id === id);
    if (top) {
      const ch = chapters.find(c => c.id === top.chapterId);
      if (ch) {
        setSelectedSubjectId(ch.subjectId);
        setSelectedChapterId(ch.id);
        setSelectedTopicId(id);
        setActiveWorkspaceTab('editor');

        // Find existing note in topic
        const topicNotes = notes.filter(n => n.topicId === id);
        if (topicNotes.length > 0) {
          const activeNote = topicNotes[0];
          setSelectedNoteId(activeNote.id);
          setDraftNoteTitle(activeNote.title);
          setDraftNoteContent(activeNote.content);
        } else {
          setSelectedNoteId('');
          setDraftNoteTitle('');
          setDraftNoteContent('');
        }
        setMobileOrganizerView('workspace');
      }
    }
  };

  // Manual save for notes guide inside organizer
  const handleSaveOrganizerNote = () => {
    if (!selectedTopicId) return;

    if (!draftNoteTitle.trim()) {
      addToast('Study guide title cannot be blank!', 'warning');
      return;
    }

    if (selectedNoteId) {
      // Edit existing
      const updated = notes.map(n => {
        if (n.id === selectedNoteId) {
          return {
            ...n,
            title: draftNoteTitle.trim(),
            content: draftNoteContent
          };
        }
        return n;
      });
      saveNotesToStorage(updated);
      addToast('Study note backup saved successfully! 💾', 'success');
    } else {
      // Create new note under active topic
      const newNote: SavedNote = {
        id: `note_${Date.now()}`,
        title: draftNoteTitle.trim(),
        content: draftNoteContent,
        createdAt: new Date().toISOString(),
        subjectId: selectedSubjectId || undefined,
        chapterId: selectedChapterId || undefined,
        topicId: selectedTopicId
      };
      const updated = [newNote, ...notes];
      saveNotesToStorage(updated);
      setSelectedNoteId(newNote.id);
      addToast(`Study note guide created under this topic! 📝`, 'success');
    }
  };

  // Fallback simulator for study material synthesis locally
  const applyLocalRecallFallback = (type: 'questions' | 'flashcards' | 'quiz', noteId: string, titlePattern: string, textBody: string) => {
    const rawText = textBody.trim();
    const sentences = rawText
      .split(/[.\n;]/)
      .map(s => s.trim())
      .filter(s => s.length > 15);

    const currentGen = { ...material };
    const noteMat = currentGen[noteId] || { questions: [], flashcards: [], quizzes: [] };

    if (type === 'questions') {
      const generated: any[] = [];
      if (sentences.length > 0) {
        sentences.slice(0, 10).forEach((s, idx) => {
          const words = s.split(' ');
          const term = words.slice(0, Math.min(3, words.length)).join(' ');
          generated.push({
            id: `q_org_${Date.now()}_${idx}`,
            question: `Analyze and describe the core features regarding "${term || 'this principle'}":`,
            answer: s,
            createdAt: new Date().toISOString()
          });
        });
      } else {
        generated.push({
          id: `q_org_empty`,
          question: `What primary outcomes are summarized regarding "${titlePattern}"?`,
          answer: rawText.substring(0, 300) || 'Synthesized summaries from notes outline.',
          createdAt: new Date().toISOString()
        });
      }
      noteMat.questions = generated;
    } 
    else if (type === 'flashcards') {
      const generated: any[] = [];
      if (sentences.length > 0) {
        sentences.slice(0, 10).forEach((s, idx) => {
          const words = s.split(' ');
          const term = words.slice(0, Math.min(3, words.length)).join(' ') || 'Key Topic Aspect';
          generated.push({
            id: `f_org_${Date.now()}_${idx}`,
            front: `Core concept: "${term}"`,
            back: s,
            createdAt: new Date().toISOString()
          });
        });
      } else {
        generated.push({
          id: `f_org_empty`,
          front: `${titlePattern} Concept Outline`,
          back: rawText.substring(0, 250) || 'Concept summary outline guides.',
          createdAt: new Date().toISOString()
        });
      }
      noteMat.flashcards = generated;
    } 
    else if (type === 'quiz') {
      const generatedQuizQs: any[] = [];
      if (sentences.length >= 2) {
        sentences.slice(0, 10).forEach((s, idx) => {
          const words = s.split(' ');
          const term = words.slice(0, Math.min(3, words.length)).join(' ');
          generatedQuizQs.push({
            id: `qz_org_q_${Date.now()}_${idx}`,
            question: `Which statement represents the valid analysis regarding "${term || 'this concept'}"?`,
            options: [
              s, // Correct target
              `An inconsistent mechanism countering ${term || 'this Principle'}.`,
              `The operational degradation of ${term || 'the variable'} system.`,
              `A passive representation of similar properties.`
            ],
            correctAnswerIndex: 0
          });
        });
      } else {
        generatedQuizQs.push({
          id: `qz_org_q_empty`,
          question: `Select the option that conforms with the core premise of ${titlePattern}:`,
          options: [
            `Understanding active synthesis of study records`,
            `Passive re-reading parameters`,
            `Simulated alternate frameworks`,
            `None of the above matches`
          ],
          correctAnswerIndex: 0
        });
      }

      const generatedQuiz = {
        id: `qz_org_gen_${Date.now()}`,
        title: `${titlePattern} Interactive Assessment`,
        createdAt: new Date().toISOString(),
        questions: generatedQuizQs
      };
      noteMat.quizzes = [generatedQuiz];
    }

    currentGen[noteId] = noteMat;
    setMaterial(currentGen);
    localStorage.setItem('recall_generated_material', JSON.stringify(currentGen));
  };

  // Synthesis engine runner
  const triggerOrganizerAISynthesis = async (type: 'questions' | 'flashcards' | 'quiz', noteId: string, titlePattern: string, textBody: string) => {
    if (!textBody.trim()) {
      addToast('Write first or paste note material before generating questions!', 'warning');
      return;
    }

    setIsSynthesizing(type);

    try {
      let endpoint = '';
      if (type === 'questions') endpoint = '/api/recall/questions';
      else if (type === 'flashcards') endpoint = '/api/recall/flashcards';
      else if (type === 'quiz') endpoint = '/api/recall/quiz';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: textBody, title: titlePattern })
      });

      if (!response.ok) {
        throw new Error(`Endpoint returned status ${response.status}`);
      }

      const responseData = await response.json();
      const currentGen = { ...material };
      const noteMat = currentGen[noteId] || { questions: [], flashcards: [], quizzes: [] };

      if (type === 'questions') {
        const formattedQs = responseData.map((q: any, idx: number) => ({
          id: `q_org_ai_${Date.now()}_${idx}`,
          question: q.question,
          answer: q.answer,
          createdAt: new Date().toISOString()
        }));
        noteMat.questions = formattedQs;
        addToast(`Synthesized ${formattedQs.length} custom review questions! 🧠`, 'success');
        setActiveWorkspaceTab('recall');
      } 
      else if (type === 'flashcards') {
        const formattedFCs = responseData.map((f: any, idx: number) => ({
          id: `f_org_ai_${Date.now()}_${idx}`,
          front: f.front,
          back: f.back,
          createdAt: new Date().toISOString()
        }));
        noteMat.flashcards = formattedFCs;
        addToast(`Synthesized ${formattedFCs.length} high-yield memory flashcards! 🗂️`, 'success');
        setActiveWorkspaceTab('flashcards');
      } 
      else if (type === 'quiz') {
        const formattedQuiz = {
          id: `qz_org_ai_${Date.now()}`,
          title: responseData.title || `${titlePattern} comprehension quiz`,
          createdAt: new Date().toISOString(),
          questions: responseData.questions.map((q: any, idx: number) => ({
            id: `qz_q_org_ai_${Date.now()}_${idx}`,
            question: q.question,
            options: q.options,
            correctAnswerIndex: q.correctAnswerIndex
          }))
        };
        noteMat.quizzes = [formattedQuiz];
        addToast(`Synthesized dynamic multiple choice scorecard check! 🎓`, 'success');
        setActiveWorkspaceTab('quiz');
      }

      currentGen[noteId] = noteMat;
      setMaterial(currentGen);
      localStorage.setItem('recall_generated_material', JSON.stringify(currentGen));

    } catch (err) {
      console.warn('AI offline, executing manual local structural synthesizer fallback...', err);
      applyLocalRecallFallback(type, noteId, titlePattern, textBody);
      addToast(`Engine processed: Compiled memory material via offline high-speed Parser! ⚙️`, 'info');
      
      if (type === 'questions') setActiveWorkspaceTab('recall');
      if (type === 'flashcards') setActiveWorkspaceTab('flashcards');
      if (type === 'quiz') setActiveWorkspaceTab('quiz');
    } finally {
      setIsSynthesizing(null);
    }
  };

  // Attach unassigned notes selection
  const handleAttachNoteToTopic = (noteIdToAttach: string) => {
    if (!selectedTopicId) return;

    const updated = notes.map(n => {
      if (n.id === noteIdToAttach) {
        return {
          ...n,
          subjectId: selectedSubjectId || undefined,
          chapterId: selectedChapterId || undefined,
          topicId: selectedTopicId
        };
      }
      return n;
    });

    saveNotesToStorage(updated);
    setSelectedNoteId(noteIdToAttach);
    
    const targetNote = updated.find(n => n.id === noteIdToAttach);
    if (targetNote) {
      setDraftNoteTitle(targetNote.title);
      setDraftNoteContent(targetNote.content);
    }

    addToast('Linked unorganized note guide to this topic! 🔗', 'success');
  };

  // FLAT RECORDS DATABASE HANDLERS (PERSISTING ALL ORIGINAL CODE ACTIONS)
  const handleAssignSubjectFlat = (noteId: string, subId: string) => {
    const updatedNotes = notes.map(n => {
      if (n.id === noteId) {
        return { ...n, subjectId: subId || undefined };
      }
      return n;
    });
    setNotes(updatedNotes);
    localStorage.setItem('recall_study_notes', JSON.stringify(updatedNotes));
    addToast('Subject mapping updated successfully!', 'success');
  };

  const handleOpenStudyItemFlat = (item: any) => {
    localStorage.setItem('active_recall_note_id', item.noteId);
    localStorage.setItem('active_recall_tab', item.tab);
    onNavigate('recall');
    addToast(`Launched "${item.title}" in Active Recall Workspace! 🚀`, 'success');
  };

  const handleCreateSubjectFromOrganizer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    if (addSubject) {
      addSubject(newSubName, newSubColor, newSubCode || undefined);
    }
    setNewSubName('');
    setNewSubCode('');
    setNewSubColor('bg-indigo-500');
    setIsAddingSubjectForm(false);
  };

  // Compile library items list (Original database structure)
  const libraryItems = (() => {
    const items: any[] = [];
    notes.forEach(note => {
      const subject = subjects.find(s => s.id === note.subjectId);
      const noteMat = material[note.id] || {};
      
      // 1. Note item
      items.push({
        id: `lib_note_${note.id}`,
        itemId: note.id,
        noteId: note.id,
        type: 'note',
        title: note.title || 'Untitled Topic Guide',
        content: note.content || 'No text added.',
        createdAt: note.createdAt,
        subjectId: note.subjectId,
        subject,
        count: note.content ? note.content.split(/\s+/).filter(Boolean).length : 0,
        countLabel: 'words',
        actionLabel: 'Open Note Editor',
        tab: 'editor'
      });

      // 2. Active Recall Questions Set
      if (noteMat.questions && noteMat.questions.length > 0) {
        items.push({
          id: `lib_rec_${note.id}`,
          itemId: note.id,
          noteId: note.id,
          type: 'recall',
          title: `Active Recall: ${note.title || 'Topic Guide'}`,
          content: `List of conceptual review questions synthesized for active retrieval practice.`,
          createdAt: note.createdAt,
          subjectId: note.subjectId,
          subject,
          count: noteMat.questions.length,
          countLabel: 'questions',
          actionLabel: 'Recall Practice',
          tab: 'questions'
        });
      }

      // 3. Flashcards Deck
      if (noteMat.flashcards && noteMat.flashcards.length > 0) {
        items.push({
          id: `lib_fc_${note.id}`,
          itemId: note.id,
          noteId: note.id,
          type: 'flashcard',
          title: `Flashcards: ${note.title || 'Topic Guide'}`,
          content: `Interactive front-and-back study cards maximizing retrieval strength.`,
          createdAt: note.createdAt,
          subjectId: note.subjectId,
          subject,
          count: noteMat.flashcards.length,
          countLabel: 'cards',
          actionLabel: 'Study Slide Deck',
          tab: 'flashcards'
        });
      }

      // 4. Interactive Quiz
      if (noteMat.quizzes && noteMat.quizzes.length > 0) {
        const qz = noteMat.quizzes[0];
        items.push({
          id: `lib_qz_${note.id}`,
          itemId: qz.id,
          noteId: note.id,
          type: 'quiz',
          title: `Quiz: ${qz.title || note.title || 'Topic Guide'}`,
          content: `Interactive multiple-choice comprehensive verification scorecard check.`,
          createdAt: note.createdAt,
          subjectId: note.subjectId,
          subject,
          count: qz.questions ? qz.questions.length : 0,
          countLabel: 'questions',
          actionLabel: 'Take Quiz',
          tab: 'quiz'
        });
      }
    });
    return items;
  })();

  // Filter and Search items (Original database filtering)
  const filteredItemsFlat = libraryItems.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject = 
      selectedSubjectIdFlat === 'all' ||
      (selectedSubjectIdFlat === 'unassigned' && !item.subjectId) ||
      item.subjectId === selectedSubjectIdFlat;

    const matchesType = 
      selectedTypeFlat === 'all' ||
      item.type === selectedTypeFlat;

    return matchesSearch && matchesSubject && matchesType;
  });

  const totalNotesCount = libraryItems.filter(i => i.type === 'note').length;
  const totalRecallSets = libraryItems.filter(i => i.type === 'recall').length;
  const totalFlashcardDecks = libraryItems.filter(i => i.type === 'flashcard').length;
  const totalQuizzesCount = libraryItems.filter(i => i.type === 'quiz').length;

  return (
    <div id="study-library-workspace" className="space-y-6 animate-fade-in text-slate-100">
      
      {/* 1. Page Header with Branding and Core Selector Tabs */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
            <Library className="w-5 h-5 lg:w-6 lg:h-6" />
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-display font-medium text-white tracking-wide">Study Library & Organizer</h1>
            <p className="text-xs text-slate-400">Manage Course Subjects, collapsible Chapters & Topics, and write high-yield summaries.</p>
          </div>
        </div>

        {/* Global Tab Selector Mode switch */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTabMode('organizer')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
              activeTabMode === 'organizer' 
                ? 'bg-indigo-650 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={13} />
            <span>Material Organizer</span>
          </button>
          
          <button
            onClick={() => setActiveTabMode('flat')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
              activeTabMode === 'flat' 
                ? 'bg-indigo-650 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Library size={13} />
            <span>Flat Library Records</span>
          </button>
        </div>
      </div>

      {/* RENDER VIEW ACCORDING TO DESTRUCTURING MODE SELECTORS */}
      {activeTabMode === 'flat' ? (
        
        // ================= FLAT RECORDS VIEW MODE (ORIGINAL FULLY PERSISTED SUITE) =================
        <div className="space-y-6 font-sans">
          
          {/* Flat counters */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] text-slate-400 font-mono uppercase">Total Resources</span>
              <p className="text-lg font-bold text-white mt-1">{libraryItems.length}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] text-slate-400 font-mono uppercase">Notes Guides</span>
              <p className="text-lg font-bold text-amber-400 mt-1">{totalNotesCount}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] text-slate-400 font-mono uppercase">Recall Sets</span>
              <p className="text-lg font-bold text-indigo-400 mt-1">{totalRecallSets}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] text-slate-400 font-mono uppercase">Flashcard Decks</span>
              <p className="text-lg font-bold text-violet-400 mt-1">{totalFlashcardDecks}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center col-span-2 md:col-span-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase">Quizzes</span>
              <p className="text-lg font-bold text-emerald-400 mt-1">{totalQuizzesCount}</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row gap-4 justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search flat items catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-450 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: 'All Content', icon: Library, color: 'text-slate-200' },
                  { id: 'note', label: 'Note Guides', icon: FileText, color: 'text-amber-400' },
                  { id: 'recall', label: 'Recall Sets', icon: HelpCircle, color: 'text-indigo-400' },
                  { id: 'flashcard', label: 'Flashcards', icon: Layers, color: 'text-violet-400' },
                  { id: 'quiz', label: 'Quizzes', icon: BookOpen, color: 'text-emerald-400' }
                ].map((tb) => (
                  <button
                    key={tb.id}
                    onClick={() => setSelectedTypeFlat(tb.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition whitespace-nowrap border ${
                      selectedTypeFlat === tb.id 
                        ? 'bg-indigo-650 border-indigo-500 text-white shadow' 
                        : 'bg-white/5 hover:bg-white/8 border-transparent text-slate-450'
                    }`}
                  >
                    <tb.icon size={12} className={tb.color} />
                    <span>{tb.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-white/5">
              <span className="text-[10px] font-mono text-slate-450 uppercase flex items-center gap-1">
                <Tag size={11} />
                <span>FILTER SUBJECT:</span>
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedSubjectIdFlat('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition ${
                    selectedSubjectIdFlat === 'all' ? 'bg-indigo-650 text-white shadow' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedSubjectIdFlat('unassigned')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition ${
                    selectedSubjectIdFlat === 'unassigned' ? 'bg-indigo-650 text-white shadow' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  Unassigned
                </button>
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSubjectIdFlat(s.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition flex items-center gap-1 border ${
                      selectedSubjectIdFlat === s.id ? 'bg-indigo-600/30 border-indigo-500 text-white shadow font-semibold' : 'bg-white/5 border-transparent text-slate-400'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${!s.color?.startsWith('#') ? s.color : ''}`} style={s.color?.startsWith('#') ? { backgroundColor: s.color } : undefined}></span>
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={viewModeFlat === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-4"}>
            {filteredItemsFlat.map((item) => (
              <div
                key={item.id}
                className="relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col justify-between h-56"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase">
                      {item.type} Guide
                    </span>
                    {item.subject ? (
                      <span 
                        className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold text-white ${!item.subject.color?.startsWith('#') ? item.subject.color : ''}`}
                        style={item.subject.color?.startsWith('#') ? { backgroundColor: item.subject.color } : undefined}
                      >
                        {item.subject.name}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[8px] font-mono text-slate-500 bg-white/3 rounded">
                        Unassigned
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.content}</p>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-3">
                  <select
                    value={item.subjectId || ''}
                    onChange={(e) => handleAssignSubjectFlat(item.noteId, e.target.value)}
                    className="bg-slate-950 border border-white/10 text-[10px] text-slate-300 rounded px-1.5 py-1 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleOpenStudyItemFlat(item)}
                    className="py-1 px-3 text-[10px] font-bold rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white cursor-pointer transition flex items-center gap-1"
                  >
                    <span>Launch & Study</span>
                    <ArrowUpRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

      ) : (

        // ================= STUDY ORGANIZER TREE VIEW MODE (NEW CORE HIERARCHY WORKSPACE) =================
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px] font-sans">
          
          {/* MOBILE TOGGLE SELECTOR SUBBAR: Only visible on mobile/tablets */}
          <div className="lg:hidden col-span-12 flex bg-slate-950/80 p-1 border border-white/5 rounded-xl justify-between">
            <button
              onClick={() => setMobileOrganizerView('tree')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition text-center ${
                mobileOrganizerView === 'tree' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              🌲 Tree Outline Search
            </button>
            <button
              onClick={() => setMobileOrganizerView('workspace')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition text-center ${
                mobileOrganizerView === 'workspace' ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              📝 Details Workspace
            </button>
          </div>

          {/* LEFT COLUMN: Folders Tree Navigation Outline */}
          <div className={`col-span-12 lg:col-span-4 ${mobileOrganizerView === 'tree' ? 'block' : 'hidden lg:block'}`}>
            <StudyOrganizerTree
              subjects={subjects}
              chapters={chapters}
              topics={topics}
              notes={notes}
              selectedSubjectId={selectedSubjectId}
              selectedChapterId={selectedChapterId}
              selectedTopicId={selectedTopicId}
              onSelectSubject={handleSelectSubject}
              onSelectChapter={handleSelectChapter}
              onSelectTopic={handleSelectTopic}
              onAddChapter={handleAddChapter}
              onAddTopic={handleAddTopic}
              onDeleteChapter={handleDeleteChapter}
              onDeleteTopic={handleDeleteTopic}
              onDeleteSubject={handleDeleteSubjectLocal}
              onAddSubjectClick={() => setIsAddingSubjectForm(true)}
            />
          </div>

          {/* RIGHT COLUMN: Selective Details Workspace Panel */}
          <div className={`col-span-12 lg:col-span-8 ${mobileOrganizerView === 'workspace' ? 'block' : 'hidden lg:block'}`}>
            <AnimatePresence mode="wait">
              
              {/* Adding New Course Subject Popover Modal Form */}
              {isAddingSubjectForm && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-slate-950/90 border border-indigo-500/20 rounded-2xl p-6 shadow-2xl space-y-4 mb-4"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <GraduationCap className="text-indigo-400" size={16} />
                      <span>Establish Global Study Course</span>
                    </h3>
                    <button 
                      onClick={() => setIsAddingSubjectForm(false)}
                      className="text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleCreateSubjectFromOrganizer} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-mono uppercase font-bold mb-1.5">Subject name</label>
                        <input
                          type="text"
                          placeholder="e.g. Organic Chemistry"
                          value={newSubName}
                          onChange={(e) => setNewSubName(e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-mono uppercase font-bold mb-1.5">Course code</label>
                        <input
                          type="text"
                          placeholder="e.g. CHEM-221 (optional)"
                          value={newSubCode}
                          onChange={(e) => setNewSubCode(e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-mono uppercase font-bold mb-1.5">COURSE CARD ICON GLOW ACCENT COLOR</label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {[
                          { cls: 'bg-indigo-500', name: 'Indigo' },
                          { cls: 'bg-purple-500', name: 'Royal Purple' },
                          { cls: 'bg-rose-500', name: 'Alizarin Crimson' },
                          { cls: 'bg-amber-500', name: 'Sunset Orange' },
                          { cls: 'bg-teal-500', name: 'Aqua Teal' },
                          { cls: 'bg-emerald-500', name: 'Mint Emerald' },
                          { cls: 'bg-pink-500', name: 'Fuchsia Pink' }
                        ].map((c) => (
                          <button
                            key={c.cls}
                            type="button"
                            onClick={() => setNewSubColor(c.cls)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white border transition flex items-center gap-1.5 cursor-pointer ${
                              newSubColor === c.cls ? 'border-white bg-indigo-650' : 'border-white/5 bg-slate-900 hover:bg-slate-850'
                            }`}
                          >
                            <span className={`w-2.5 h-2.5 rounded-full ${c.cls}`}></span>
                            <span>{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-750 hover:from-indigo-500 text-white text-xs font-semibold rounded-xl text-center shadow-lg transition cursor-pointer"
                    >
                      Establish Course Scheme
                    </button>
                  </form>
                </motion.div>
              )}

              {/* A. If a Topic Is Selected (Study note guide editor & memory practice synthesis hub) */}
              {selectedTopicId ? (
                (() => {
                  const activeSub = subjects.find(s => s.id === selectedSubjectId);
                  const activeCh = chapters.find(c => c.id === selectedChapterId);
                  const activeTop = topics.find(t => t.id === selectedTopicId);
                  const topicNotes = notes.filter(n => n.topicId === selectedTopicId);
                  const activeNote = topicNotes.find(n => n.id === selectedNoteId) || topicNotes[0];
                  const unassignedNotes = notes.filter(n => !n.topicId);

                  return (
                    <motion.div
                      key={`top_${selectedTopicId}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-4"
                    >
                      {/* Responsive Workspace Header Breadcrumbs */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-md">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono uppercase">
                          <button 
                            type="button"
                            onClick={() => setMobileOrganizerView('tree')}
                            className="lg:hidden p-1 hover:bg-white/5 rounded text-indigo-400 mr-1"
                          >
                            <ArrowLeft size={10} />
                          </button>
                          <span>{activeSub?.name || 'Class'}</span>
                          <ChevronRight size={10} />
                          <span>{activeCh?.title || 'Chapter'}</span>
                          <ChevronRight size={10} />
                          <span className="text-white font-bold">{activeTop?.title || 'Topic'}</span>
                        </div>
                        <h2 className="text-lg font-bold text-white mt-2 flex items-center gap-2 font-display">
                          <FileText className="text-indigo-400" size={18} />
                          <span>Workspace Summary: {activeTop?.title}</span>
                        </h2>
                      </div>

                      {/* Organizer Details Sub-Tabs */}
                      <div className="flex bg-slate-950 p-1 border border-white/5 rounded-xl gap-1">
                        {[
                          { id: 'editor', label: '📝 Note Guide Editor' },
                          { id: 'recall', label: '🧠 Recall Practice' },
                          { id: 'flashcards', label: '🗂️ Flashcard Deck' },
                          { id: 'quiz', label: '🎓 Chapter Quiz' }
                        ].map((tb) => (
                          <button
                            key={tb.id}
                            onClick={() => setActiveWorkspaceTab(tb.id as any)}
                            className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold cursor-pointer transition ${
                              activeWorkspaceTab === tb.id ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {tb.label}
                          </button>
                        ))}
                      </div>

                      {/* Display Selected Workspace Tab Panel */}
                      <div ref={workspacePanelRef} className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl min-h-[380px]">
                        {activeWorkspaceTab === 'editor' && (
                          <div className="space-y-4">
                            
                            {/* If there are no notes under this topic, offer attachment dropdown or create draft input */}
                            {!activeNote ? (
                              <div className="py-8 text-center space-y-4">
                                <FileText className="mx-auto w-12 h-12 text-slate-600 animate-pulse ms-1" />
                                <div>
                                  <h4 className="text-sm font-semibold text-white">No Notes Guides Active for This Topic</h4>
                                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                                    Create a fresh summary note for Newton / Equations, or attach from unorganized library guide list.
                                  </p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                                  <button
                                    onClick={() => {
                                      setDraftNoteTitle(`Summary of ${activeTop?.title}`);
                                      setDraftNoteContent('');
                                      // Trigger fake save to create
                                      const dummyNote: SavedNote = {
                                        id: `note_${Date.now()}`,
                                        title: `Summary of ${activeTop?.title}`,
                                        content: '',
                                        createdAt: new Date().toISOString(),
                                        subjectId: selectedSubjectId || undefined,
                                        chapterId: selectedChapterId || undefined,
                                        topicId: selectedTopicId
                                      };
                                      saveNotesToStorage([dummyNote, ...notes]);
                                      setSelectedNoteId(dummyNote.id);
                                    }}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 transition cursor-pointer font-sans"
                                  >
                                    + Create Note Canvas
                                  </button>

                                  {unassignedNotes.length > 0 && (
                                    <select
                                      onChange={(e) => e.target.value && handleAttachNoteToTopic(e.target.value)}
                                      className="bg-slate-900 border border-white/10 text-xs text-slate-300 rounded-lg p-2 focus:outline-none"
                                      defaultValue=""
                                    >
                                      <option value="" disabled>-- Link Existing Note --</option>
                                      {unassignedNotes.map((n) => (
                                        <option key={n.id} value={n.id}>{n.title}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </div>
                            ) : (
                              
                              // Inline text editor
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center justify-between">
                                  <div className="md:col-span-3">
                                    <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1 font-bold">TOPIC DOCUMENT TITLE</label>
                                    <input
                                      type="text"
                                      value={draftNoteTitle}
                                      onChange={(e) => setDraftNoteTitle(e.target.value)}
                                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans font-bold"
                                      placeholder="Note Guide Title..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-mono text-slate-450 uppercase mb-1 font-bold">STATE ACTIONS</label>
                                    <button
                                      onClick={handleSaveOrganizerNote}
                                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-550 border border-indigo-400/20 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition shadow"
                                    >
                                      <Save size={12} />
                                      <span>Save Summary</span>
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[9px] font-mono text-slate-450 uppercase tracking-widest mb-1.5 font-bold">
                                    GUIDE BODY CONTENT ({draftNoteContent.length} characters)
                                  </label>
                                  <textarea
                                    value={draftNoteContent}
                                    onChange={(e) => setDraftNoteContent(e.target.value)}
                                    rows={10}
                                    placeholder="Type or paste comprehensive textbooks summary details here. Write at least two structured paragraphs for optimal AI Recall synthesis outputs..."
                                    className="w-full bg-slate-950/40 border border-white/10 focus:border-indigo-500 rounded-2xl p-4 text-xs text-slate-200 focus:outline-none leading-relaxed font-sans focus:ring-0 resize-none pr-1 focus:ring-indigo-500/20"
                                  />
                                </div>

                                {/* Sparkles Synthesis Hub Deck triggers */}
                                <div className="mt-4 p-4.5 bg-gradient-to-br from-indigo-950/40 to-indigo-950/25 border border-indigo-500/10 rounded-2xl">
                                  <div className="flex items-center gap-2 border-b border-indigo-500/10 pb-2 mb-3">
                                    <Sparkles className="text-yellow-400 rotate-12" size={15} />
                                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
                                      AI Active Memory Synthesis Hub
                                    </h4>
                                  </div>

                                  <p className="text-[11px] text-slate-350 leading-relaxed font-sans mb-3.5">
                                    Directly synthesize flashcard decks, multiple choice quizzes, or revealable recall tests directly from this noteguide!
                                  </p>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <button
                                      disabled={!!isSynthesizing}
                                      onClick={() => triggerOrganizerAISynthesis('questions', activeNote.id, activeNote.title, draftNoteContent)}
                                      className="py-2.5 px-3 rounded-lg bg-indigo-950/80 border border-indigo-500/15 hover:border-indigo-500/50 hover:bg-indigo-650 text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
                                    >
                                      <Brain size={12} className={isSynthesizing === 'questions' ? 'animate-spin' : ''} />
                                      <span>{isSynthesizing === 'questions' ? 'Generating...' : 'Recall Questions'}</span>
                                    </button>

                                    <button
                                      disabled={!!isSynthesizing}
                                      onClick={() => triggerOrganizerAISynthesis('flashcards', activeNote.id, activeNote.title, draftNoteContent)}
                                      className="py-2.5 px-3 rounded-lg bg-indigo-950/80 border border-indigo-500/15 hover:border-indigo-500/50 hover:bg-indigo-650 text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
                                    >
                                      <Layers size={12} className={isSynthesizing === 'flashcards' ? 'animate-spin' : ''} />
                                      <span>{isSynthesizing === 'flashcards' ? 'Generating...' : 'Flashcards'}</span>
                                    </button>

                                    <button
                                      disabled={!!isSynthesizing}
                                      onClick={() => triggerOrganizerAISynthesis('quiz', activeNote.id, activeNote.title, draftNoteContent)}
                                      className="py-2.5 px-3 rounded-lg bg-indigo-950/80 border border-indigo-500/15 hover:border-indigo-500/50 hover:bg-indigo-650 text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
                                    >
                                      <GraduationCap size={12} className={isSynthesizing === 'quiz' ? 'animate-spin' : ''} />
                                      <span>{isSynthesizing === 'quiz' ? 'Generating...' : 'Interactive Quiz'}</span>
                                    </button>
                                  </div>
                                </div>

                              </div>
                            )}

                          </div>
                        )}

                        {activeWorkspaceTab === 'flashcards' && activeNote && (
                          <StudyOrganizerActiveStudy
                            type="flashcards"
                            material={material[activeNote.id] || {}}
                            noteTitle={activeNote.title}
                            addToast={addToast}
                          />
                        )}

                        {activeWorkspaceTab === 'quiz' && activeNote && (
                          <StudyOrganizerActiveStudy
                            type="quiz"
                            material={material[activeNote.id] || {}}
                            noteTitle={activeNote.title}
                            addToast={addToast}
                          />
                        )}

                        {activeWorkspaceTab === 'recall' && activeNote && (
                          <StudyOrganizerActiveStudy
                            type="recall"
                            material={material[activeNote.id] || {}}
                            noteTitle={activeNote.title}
                            addToast={addToast}
                          />
                        )}

                        {!activeNote && activeWorkspaceTab !== 'editor' && (
                          <div className="text-center py-12">
                            <h4 className="text-sm font-semibold text-slate-350">Create Guide Notes First</h4>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                              No active notes guides created for this topic. Use the "Note Guide Editor" to add summary texts.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })()
              ) : selectedChapterId ? (
                
                // B. If a Chapter Is Selected
                (() => {
                  const ch = chapters.find(c => c.id === selectedChapterId);
                  const sub = subjects.find(s => s.id === ch?.subjectId);
                  const chTopics = topics.filter(t => t.chapterId === selectedChapterId);

                  return (
                    <motion.div
                      key={`ch_${selectedChapterId}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6"
                    >
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono uppercase">
                        <span>{sub?.name}</span>
                        <ChevronRight size={10} />
                        <span className="text-white font-bold">{ch?.title}</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 border border-indigo-400/10 rounded-full font-bold">CHAPTER VIEW</span>
                        <h2 className="text-lg font-bold text-white mt-2 font-display">{ch?.title}</h2>
                        <p className="text-xs text-slate-400 font-sans">Contains collapsible sub-topics or conceptual subjects for active review analysis.</p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans border-b border-white/5 pb-2">Active Topics Outlines</h4>
                        
                        {chTopics.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-4">No topics created within this chapter. Add sub-topics in the sidebar outline tree to organize guides.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {chTopics.map((top) => {
                              const tNotes = notes.filter(n => n.topicId === top.id);

                              return (
                                <div
                                  key={top.id}
                                  onClick={() => handleSelectTopic(top.id)}
                                  className="p-4 bg-slate-900/60 border border-white/5 hover:border-indigo-500/30 rounded-xl cursor-pointer transition text-left hover:bg-slate-900 duration-200"
                                >
                                  <h4 className="text-xs font-bold text-indigo-300 font-sans truncate">{top.title}</h4>
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    {tNotes.length === 0 ? 'No guide sheets created yet.' : `${tNotes.length} summary guidelist active.`}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })()
              ) : selectedSubjectId ? (
                
                // C. If a Subject Is Selected
                (() => {
                  const sub = subjects.find(s => s.id === selectedSubjectId);
                  const subChapters = chapters.filter(c => c.subjectId === selectedSubjectId);
                  const subChIds = subChapters.map(c => c.id);
                  const subTopics = topics.filter(t => subChIds.includes(t.chapterId));
                  const subNotes = notes.filter(n => n.subjectId === selectedSubjectId);

                  return (
                    <motion.div
                      key={`sub_${selectedSubjectId}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6"
                    >
                      <div className="space-y-1.5">
                        <span 
                          className={`px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded-md text-white ${sub?.color && !sub.color.startsWith('#') ? sub.color : !sub ? 'bg-indigo-500' : ''}`}
                          style={sub?.color && sub.color.startsWith('#') ? { backgroundColor: sub.color } : undefined}
                        >
                          {sub?.code || 'COURSE'}
                        </span>
                        <h2 className="text-lg font-bold text-white mt-1.5 font-display">{sub?.name}</h2>
                        <p className="text-xs text-slate-400">Class study guidelines. Contains Chapters, Topics, and synthesized Active Recall decks.</p>
                      </div>

                      <div className="grid grid-cols-3 gap-3.5">
                        <div className="bg-slate-950/45 p-3 rounded-xl border border-white/5 text-center">
                          <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">Chapters</span>
                          <p className="text-lg font-bold text-white mt-1 font-mono">{subChapters.length}</p>
                        </div>
                        <div className="bg-slate-950/45 p-3 rounded-xl border border-white/5 text-center">
                          <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">Topics</span>
                          <p className="text-lg font-bold text-white mt-1 font-mono">{subTopics.length}</p>
                        </div>
                        <div className="bg-slate-950/45 p-3 rounded-xl border border-white/5 text-center">
                          <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">Notes</span>
                          <p className="text-lg font-bold text-white mt-1 font-mono">{subNotes.length}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans border-b border-white/5 pb-2">Course Chapters Catalog</h3>
                        
                        {subChapters.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-4">No chapters created within this Course Plan. Click "+ Chapter" in folder tree outline sidebar to start organizing.</p>
                        ) : (
                          <div className="space-y-2">
                            {subChapters.map(ch => {
                              const chTops = topics.filter(t => t.chapterId === ch.id);

                              return (
                                <div
                                  key={ch.id}
                                  onClick={() => handleSelectChapter(ch.id)}
                                  className="p-3 bg-slate-900/40 border border-white/5 hover:border-indigo-500/20 rounded-xl cursor-pointer flex items-center justify-between hover:bg-slate-900 transition"
                                >
                                  <div>
                                    <h4 className="text-xs font-bold text-white">{ch.title}</h4>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{chTops.length} topic divisions mapped.</p>
                                  </div>
                                  <ChevronRight size={12} className="text-slate-400" />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })()
              ) : (
                
                // D. Visual default empty state
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-16 text-center border border-dashed border-white/10 rounded-2xl bg-white/2 space-y-4 font-sans"
                >
                  <BookOpen size={44} className="mx-auto text-indigo-400 animate-pulse" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">Select Academic Study Target</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mt-1">
                      Pick any Subject, collapsible Chapter, or Topic target node in the sidebar outlines tree to browse summaries or synthesize question quizzes!
                    </p>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>

      )}

    </div>
  );
}
