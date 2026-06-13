import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UploadCloud, FileText, FileUp, Sparkles, AlertCircle, ChevronRight, 
  ChevronDown, BookOpen, CheckCircle2, FolderPlus, ArrowRight, X, 
  CheckSquare, Square, Brain, FileBox, Layers, Calendar, Play, RotateCcw, Check
} from 'lucide-react';
import { Subject, RecallQuestion, RecallFlashcard, RecallQuiz, QuizQuestion } from '../types';

interface AIStudyMaterialImportProps {
  subjects: Subject[];
  addSubject: (name: string, color: string, code?: string) => void;
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onNavigate: (view: 'dashboard' | 'tasks' | 'planner' | 'recall' | 'revision' | 'library') => void;
}

interface Chapter {
  id: string;
  title: string;
  topics: Topic[];
}

interface Topic {
  id: string;
  title: string;
  content: string;
}

interface AnalyzedResult {
  fileName: string;
  title: string;
  chapters: Chapter[];
  extractedTextLength: number;
  complexityScore?: number;
  readingDifficulty?: string;
  detectedConceptsCount?: number;
  detectedFormulasCount?: number;
  detectedProcessesCount?: number;
  detectedDefinitionsCount?: number;
  detectedFactsCount?: number;
  detectedDatesCount?: number;
  detectedVocabularyCount?: number;
  keyConcepts?: string[];
  formulas?: string[];
  processes?: string[];
  definitions?: string[];
}

// Inline Simple Markdown Parser/Formatter Component
function SimpleMarkdownRenderer({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split('\n');
  return (
    <div className="space-y-3 font-sans text-xs text-slate-300 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Headers
        if (trimmed.startsWith('### ')) {
          return <h4 key={idx} className="text-sm font-semibold text-white pt-2 border-b border-white/5 pb-1">{trimmed.replace('### ', '')}</h4>;
        }
        if (trimmed.startsWith('## ')) {
          return <h3 key={idx} className="text-base font-bold text-indigo-200 pt-3">{trimmed.replace('## ', '')}</h3>;
        }
        if (trimmed.startsWith('# ')) {
          return <h2 key={idx} className="text-lg font-extrabold text-indigo-400 pt-4 pb-2 border-b border-indigo-500/20">{trimmed.replace('# ', '')}</h2>;
        }

        // Bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-indigo-400 mt-1.5 shrink-0">•</span>
              <span>{renderBoldItalic(content)}</span>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-sky-400 font-mono font-semibold text-xs shrink-0">{numMatch[1]}.</span>
              <span>{renderBoldItalic(numMatch[2])}</span>
            </div>
          );
        }

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        // Plain text
        return <p key={idx}>{renderBoldItalic(trimmed)}</p>;
      })}
    </div>
  );
}

// Helper to convert **text** to <strong>text</strong> in raw string
function renderBoldItalic(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white/95">
          {part.substring(2, part.length - 2)}
        </strong>
      );
    }
    return part;
  });
}

const GENERATION_STEPS = [
  'Extracting key semantic entities...',
  'Synthesizing interactive testing material...',
  'Structuring clean summary frameworks...',
  'Compiling academic recall prompts...',
  'Finalizing formatting in Zyphora catalog...'
];

export default function AIStudyMaterialImportView({ 
  subjects, 
  addSubject, 
  addToast, 
  onNavigate 
}: AIStudyMaterialImportProps) {
  
  // File States
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Applet Processing Flags
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepIdx, setGenerationStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Analysis result holder
  const [analysisResult, setAnalysisResult] = useState<AnalyzedResult | null>(null);

  // Adaptive study parameters
  const [studyMode, setStudyMode] = useState<'quick' | 'standard' | 'deep' | 'exam'>('standard');
  const [flashcardsCount, setFlashcardsCount] = useState(15);
  const [mcqsCount, setMcqsCount] = useState(10);
  const [recallCount, setRecallCount] = useState(8);
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(true);

  // Auto-calculated adaptive recommendations whenever Study Mode or analysisResult changes
  useEffect(() => {
    if (!analysisResult) return;
    const concepts = analysisResult.detectedConceptsCount || 10;
    const formulas = analysisResult.detectedFormulasCount || 2;
    const processes = analysisResult.detectedProcessesCount || 2;
    const filesz = analysisResult.extractedTextLength || 5000;

    let fc = 15;
    let mq = 10;
    let rc = 8;

    if (studyMode === 'quick') {
      fc = Math.max(5, Math.min(20, Math.ceil(concepts * 0.8 + formulas * 1.0)));
      mq = Math.max(3, Math.min(10, Math.ceil(concepts * 0.4)));
      rc = Math.max(3, Math.min(8, Math.ceil(concepts * 0.3)));
    } else if (studyMode === 'standard') {
      fc = Math.max(10, Math.min(30, Math.ceil(concepts * 1.5 + formulas * 1.5)));
      mq = Math.max(5, Math.min(18, Math.ceil(concepts * 0.8 + processes * 1.0)));
      rc = Math.max(5, Math.min(15, Math.ceil(concepts * 0.5 + processes * 0.5)));
    } else if (studyMode === 'deep') {
      fc = Math.max(15, Math.min(50, Math.ceil(concepts * 2.5 + formulas * 2.0)));
      mq = Math.max(10, Math.min(30, Math.ceil(concepts * 1.6 + processes * 1.5)));
      rc = Math.max(8, Math.min(25, Math.ceil(concepts * 1.1 + processes * 1.0)));
    } else if (studyMode === 'exam') {
      fc = Math.max(20, Math.min(65, Math.ceil(concepts * 3.5 + formulas * 3.0)));
      mq = Math.max(15, Math.min(45, Math.ceil(concepts * 2.2 + processes * 2.0)));
      rc = Math.max(12, Math.min(35, Math.ceil(concepts * 1.6 + processes * 1.5)));
    }

    setFlashcardsCount(fc);
    setMcqsCount(mq);
    setRecallCount(rc);
  }, [studyMode, analysisResult]);
  
  // Struct Selection Trackers
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [selectedTopics, setSelectedTopics] = useState<Record<string, boolean>>({});
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

  // Resource Types Requested For Generation
  const [resourceSelection, setResourceSelection] = useState<Record<string, boolean>>({
    flashcard: true,
    mcq: true,
    recall: false,
    summary: true,
    notes: false
  });

  // Generated Outcomes Holder
  const [generatedMaterial, setGeneratedMaterial] = useState<Record<string, any>>({});
  const [activePreviewTab, setActivePreviewTab] = useState<string>('');

  // Course subjects mapping
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  // Quick Create Subject Popover State
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubColor, setNewSubColor] = useState('#6366f1');
  const [newSubCode, setNewSubCode] = useState('');

  // Practice Interactive modes
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, number>>({});
  const [practiceSubmitted, setPracticeSubmitted] = useState(false);

  // Handle default subject selection index
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  // Loading animation simulation for progress steps
  useEffect(() => {
    let timer: any = null;
    if (isGenerating) {
      timer = setInterval(() => {
        setGenerationStepIdx(prev => {
          if (prev < GENERATION_STEPS.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 3200);
    } else {
      setGenerationStepIdx(0);
    }
    return () => clearInterval(timer);
  }, [isGenerating]);

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processSelectedFile(e.target.files[0]);
    }
  };

  // Convert uploaded file to base64 stream and send to server API
  const processSelectedFile = async (selectedFile: File) => {
    setError(null);
    const validExtensions = ['.pdf', '.docx', '.txt'];
    const nameLower = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some(ext => nameLower.endsWith(ext));

    if (!isValid) {
      setError("Unsupported file format! Please upload only .pdf, .docx, or .txt academic documents.");
      addToast("Unsupported file format!", "error");
      return;
    }

    setFile(selectedFile);
    setIsAnalyzing(true);
    
    try {
      const base64Str = await convertFileToBase64(selectedFile);
      
      const response = await fetch('/api/import/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          base64: base64Str,
          mimeType: selectedFile.type,
          fileName: selectedFile.name
        })
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('Server returned an HTML response instead of analyzed study data. Please check if your backend API is active under this domain.');
      }

      if (!response.ok) {
        let errorMsg = "Internal Server text extraction failure";
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (jsonErr) {}
        throw new Error(errorMsg);
      }

      const result: AnalyzedResult = await response.json();
      setAnalysisResult(result);
      
      // Auto-expand first chapter, and select all topics default
      const defaultExpanded: Record<string, boolean> = {};
      const defaultSelected: Record<string, boolean> = {};
      
      if (result.chapters && result.chapters.length > 0) {
        defaultExpanded[result.chapters[0].id] = true;
        result.chapters.forEach(chap => {
          chap.topics.forEach(t => {
            defaultSelected[t.id] = true;
          });
        });
        
        // Focus first topic
        if (result.chapters[0].topics.length > 0) {
          setActiveTopicId(result.chapters[0].topics[0].id);
        }
      }
      
      setExpandedChapters(defaultExpanded);
      setSelectedTopics(defaultSelected);
      addToast("Textbook parsed successfully! Topic Explorer unlocked.", "success");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong extracting the document text.");
      addToast("Analysis failed!", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const resultString = reader.result as string;
        // Strip data prefix: 'data:application/pdf;base64,'
        const base64Data = resultString.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (e) => reject(e);
    });
  };

  // Checkbox interactions
  const toggleChapterSelected = (chap: Chapter) => {
    const topicIds = chap.topics.map(t => t.id);
    const allSelected = topicIds.every(id => selectedTopics[id]);
    
    const nextSelected = { ...selectedTopics };
    topicIds.forEach(id => {
      nextSelected[id] = !allSelected;
    });
    setSelectedTopics(nextSelected);
  };

  const toggleTopicSelected = (topicId: string) => {
    setSelectedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  const getSelectedTopicsCount = (): number => {
    return Object.values(selectedTopics).filter(Boolean).length;
  };

  // Compile selected contents
  const concatenateSelectedContent = (): string => {
    if (!analysisResult) return '';
    const selectedTexts: string[] = [];
    
    analysisResult.chapters.forEach(ch => {
      ch.topics.forEach(t => {
        if (selectedTopics[t.id]) {
          selectedTexts.push(`### ${ch.title} > ${t.title}\n${t.content}`);
        }
      });
    });
    
    return selectedTexts.join('\n\n');
  };

  // Trigger Gemini generator endpoint
  const handleGenerateStudyResources = async () => {
    const selectedCount = getSelectedTopicsCount();
    if (selectedCount === 0) {
      addToast("Please select at least one topic from the explorer tree!", "warning");
      return;
    }

    const requestedTypes = Object.entries(resourceSelection)
      .filter(([_, value]) => value)
      .map(([key]) => key);

    if (requestedTypes.length === 0) {
      addToast("Please select at least one study resource type to generate!", "warning");
      return;
    }

    setIsGenerating(true);
    setGenerationStepIdx(0);
    setError(null);
    setGeneratedMaterial({});
    
    const textSegmentToSynthesize = concatenateSelectedContent();
    const finalMaterial: Record<string, any> = {};

    try {
      // Execute generators in parallel to stay quick
      const promises = requestedTypes.map(async (type) => {
        const response = await fetch('/api/import/generate-study', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: textSegmentToSynthesize,
            type: type,
            limit: type === 'flashcard' ? flashcardsCount : type === 'mcq' ? mcqsCount : type === 'recall' ? recallCount : undefined,
            studyMode: studyMode
          })
        });

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          throw new Error(`Server returned an HTML page instead of generated study materials for resource type "${type}".`);
        }

        if (!response.ok) {
          throw new Error(`Failed synthesizing study materials for type: ${type}`);
        }

        const jsonResult = await response.json();
        if (jsonResult.success) {
          finalMaterial[type] = jsonResult.data;
        }
      });

      await Promise.all(promises);
      
      setGeneratedMaterial(finalMaterial);
      
      // Auto-focus first available preview tab
      const firstTab = Object.keys(finalMaterial)[0] || '';
      setActivePreviewTab(firstTab);
      
      // Reset interactive state
      setActiveFlashcardIndex(0);
      setFlashcardFlipped(false);
      setPracticeAnswers({});
      setPracticeSubmitted(false);

      addToast("Academic materials generated and loaded!", "success");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An error occurred calling the study generator engine.");
      addToast("Generation failed!", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Save generated items directly to local storage / library systems
  const handleSaveToStudyLibrary = () => {
    if (!analysisResult) return;
    
    const subject = subjects.find(s => s.id === selectedSubjectId);
    const subjectName = subject ? subject.name : 'Unassigned';
    
    // Core item we save as a SavedNote under the Library schema
    // Since we want to save notes/summaries, we generate a final markdown content containing summary or notes requested,
    // or we fall back to a breakdown page of what was study-processed
    let finalNoteContent = `## AI Imported Study Guide: ${analysisResult.title}\n\n`;
    
    if (generatedMaterial.notes) {
      finalNoteContent += `${generatedMaterial.notes.notes}\n\n`;
    } else if (generatedMaterial.summary) {
      finalNoteContent += `${generatedMaterial.summary.summary}\n\n`;
    } else {
      // Build index fall-back text
      finalNoteContent += `### Processed Syllabus Outline:\n`;
      analysisResult.chapters.forEach(chap => {
        finalNoteContent += `- **${chap.title}**\n`;
        chap.topics.forEach(t => {
          if (selectedTopics[t.id]) {
            finalNoteContent += `  - ${t.title}\n`;
          }
        });
      });
    }

    const uniqueNoteId = `recall_note_${Date.now()}`;
    const newLibraryNote = {
      id: uniqueNoteId,
      title: `${analysisResult.title} [AI Study Deck]`,
      content: finalNoteContent,
      createdAt: new Date().toISOString(),
      subjectId: selectedSubjectId || undefined
    };

    // Save Study Notes List
    const existingNotesStr = localStorage.getItem('recall_study_notes') || '[]';
    const existingNotes = JSON.parse(existingNotesStr);
    const updatedNotes = [...existingNotes, newLibraryNote];
    localStorage.setItem('recall_study_notes', JSON.stringify(updatedNotes));

    // Save Related questions, flashcards, or quizzes inside recall_generated_material
    const existingMaterialsStr = localStorage.getItem('recall_generated_material') || '{}';
    const existingMaterials = JSON.parse(existingMaterialsStr);

    // Format active recall questions with IDs
    const saveQuestions = (generatedMaterial.recall || []).map((q: any, i: number) => ({
      id: `q_ai_${Date.now()}_${i}`,
      question: q.question,
      answer: q.answer,
      createdAt: new Date().toISOString()
    }));

    // Format flashcards with IDs
    const saveFlashcards = (generatedMaterial.flashcard || []).map((fc: any, i: number) => ({
      id: `fc_ai_${Date.now()}_${i}`,
      front: fc.front,
      back: fc.back,
      createdAt: new Date().toISOString()
    }));

    // Format Quiz
    let saveQuizzes: RecallQuiz[] = [];
    if (generatedMaterial.mcq) {
      const mcqRaw = generatedMaterial.mcq;
      saveQuizzes = [{
        id: `quiz_ai_${Date.now()}`,
        title: mcqRaw.title || `Interactive Quiz: ${analysisResult.title}`,
        createdAt: new Date().toISOString(),
        questions: (mcqRaw.questions || []).map((q: any, i: number) => ({
          id: `qz_q_ai_${Date.now()}_${i}`,
          question: q.question,
          options: q.options || [],
          correctAnswerIndex: q.correctAnswerIndex ?? 0
        }))
      }];
    }

    existingMaterials[uniqueNoteId] = {
      questions: saveQuestions,
      flashcards: saveFlashcards,
      quizzes: saveQuizzes
    };

    localStorage.setItem('recall_generated_material', JSON.stringify(existingMaterials));

    // Log this upload event for dashboard integration!
    const dashboardLogsStr = localStorage.getItem('imported_materials_log') || '[]';
    try {
      const dashboardLogs = JSON.parse(dashboardLogsStr);
      const newUploadLog = {
        id: `import_log_${Date.now()}`,
        title: analysisResult.title,
        fileName: file?.name || "textbook_source.pdf",
        timestamp: new Date().toISOString(),
        chaptersCount: analysisResult.chapters.length,
        topicsCount: getSelectedTopicsCount(),
        subjectName: subjectName,
        subjectColor: subject?.color || '#a855f7'
      };
      localStorage.setItem('imported_materials_log', JSON.stringify([newUploadLog, ...dashboardLogs].slice(0, 10)));
    } catch (e) {
      console.error(e);
    }

    addToast(`Successfully synchronized AI study deck for course "${subjectName}"!`, "success");
    
    // Jump straight to the Study Library to review!
    onNavigate('library');
  };

  // Add Dynamic course subject inline
  const handleQuickAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) {
      addToast('Please input a valid subject description title.', 'warning');
      return;
    }
    
    addSubject(newSubName, newSubColor, newSubCode || undefined);
    setNewSubName('');
    setNewSubCode('');
    setShowSubjectModal(false);
  };

  // File Removal / Start over
  const handleResetImport = () => {
    setFile(null);
    setAnalysisResult(null);
    setGeneratedMaterial({});
    setActivePreviewTab('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* App Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm uppercase tracking-wider mb-1 font-mono">
            <Sparkles className="h-4 w-4 shrink-0 animate-pulse" />
            AI Smart Learning Hub
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">AI Study Material Import System</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload text documents, textbooks, or notes. Leverage generative intelligence to outline chapters and synthesize custom study cards.
          </p>
        </div>
        
        {analysisResult && (
          <button
            onClick={handleResetImport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-slate-300 font-medium transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Import Different File
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: File Upload Screen */}
        {!analysisResult && !isAnalyzing && (
          <motion.div
            key="upload-zone-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="max-w-xl mx-auto py-8"
          >
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-10 cursor-pointer transition relative overflow-hidden group ${
                dragActive 
                  ? 'border-indigo-500 bg-indigo-950/25 shadow-lg shadow-indigo-950/10' 
                  : 'border-white/10 bg-slate-900/30 hover:border-indigo-500/50 hover:bg-indigo-950/5'
              }`}
            >
              {/* Abs orbit lines */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full border border-indigo-500/10 -mr-16 -mt-16 pointer-events-none group-hover:border-indigo-500/20 transition-all duration-550"></div>
              
              <div className="p-5 rounded-2xl bg-gradient-to-tr from-indigo-950 to-indigo-900/40 text-indigo-400 mb-4 ring-4 ring-indigo-500/5 group-hover:scale-105 transition-transform duration-300">
                <UploadCloud className="h-8 w-8 animate-bounce delay-100" />
              </div>
              
              <span className="text-sm font-semibold text-white group-hover:text-indigo-300 transition duration-150">
                Drag and drop your study material
              </span>
              <p className="text-xs text-slate-400 mt-2 text-center max-w-sm px-6">
                Supports <strong className="text-indigo-400 font-semibold font-mono">PDF</strong>, <strong className="text-indigo-400 font-semibold font-mono">DOCX</strong>, and <strong className="text-indigo-400 font-semibold font-mono">TXT</strong> syllabus textbooks or study drafts.
              </p>
              
              <div className="mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer transition">
                Browse Files
              </div>
              
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-start gap-2.5 p-4 bg-rose-950/20 border border-rose-500/20 rounded-xl"
              >
                <AlertCircle className="h-5 w-5 text-rose-455 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-rose-400">Import Analysis Error</h4>
                  <p className="text-[11px] text-rose-300 mt-0.5 leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Loading / Text Extraction & Chapter Breakdown State */}
        {isAnalyzing && (
          <motion.div
            key="analysis-loading-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="relative mb-6">
              <div className="h-16 w-16 rounded-full border-t-2 border-indigo-500 border-r-2 border-transparent animate-spin z-10 index-1"></div>
              <div className="absolute inset-2 bg-indigo-950/50 rounded-full flex items-center justify-center">
                <Brain className="h-6 w-6 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-white">Synthesizing Course Structure</h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed">
              We are parsing your file: <span className="font-mono text-indigo-300">{file?.name}</span>.<br />
              Extracting syllabus content structures and compiling active chapters...
            </p>
          </motion.div>
        )}

        {/* Step 2: Main Workspace (Topic Explorer Sidebar + Preview Panel) */}
        {analysisResult && !isGenerating && Object.keys(generatedMaterial).length === 0 && (
          <motion.div
            key="topic-explorer-workspace"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left: Material Info & Topic Tree */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="p-1.5 bg-indigo-950 rounded-lg text-indigo-400 shrink-0">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-white truncate">{analysisResult.title}</h4>
                    <p className="text-[10px] text-slate-400 truncate">{file?.name || 'Uploaded book'}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 pt-2 font-mono">
                  <span>Selected Topics:</span>
                  <span className="text-white font-bold">{getSelectedTopicsCount()} total</span>
                </div>
              </div>

              {/* Collapsible Chapters & Nested Subtopics list */}
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-3 bg-white/2 border-b border-white/5 text-[11px] font-bold text-slate-300 flex justify-between items-center">
                  <span>TOPIC EXPLORER STRUCTURE</span>
                  <span className="text-[10px] text-slate-400 font-mono">(Chapters: {analysisResult.chapters.length})</span>
                </div>
                
                <div className="max-h-[350px] overflow-y-auto divide-y divide-white/5">
                  {analysisResult.chapters.map(chap => {
                    const isExpanded = expandedChapters[chap.id];
                    const allSelected = chap.topics.every(t => selectedTopics[t.id]);
                    const someSelected = chap.topics.some(t => selectedTopics[t.id]) && !allSelected;

                    return (
                      <div key={chap.id} className="bg-white/[0.01]">
                        {/* Chapter Node */}
                        <div className="flex items-center justify-between p-3 hover:bg-white/5 transition duration-150">
                          <div className="flex items-center gap-2 shrink-0 min-w-0 pr-2">
                            <button
                              onClick={() => toggleChapterSelected(chap)}
                              className="text-slate-400 hover:text-white transition shrink-0"
                            >
                              {allSelected ? (
                                <CheckSquare className="h-4 w-4 text-indigo-500 fill-indigo-500/20" />
                              ) : someSelected ? (
                                <div className="h-4 w-4 bg-indigo-500/20 border border-indigo-500 rounded flex items-center justify-center shrink-0">
                                  <div className="h-1 w-2 bg-indigo-400"></div>
                                </div>
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                            
                            <span className="text-xs font-semibold text-slate-200 truncate pr-2">
                              {chap.title}
                            </span>
                          </div>

                          <button
                            onClick={() => setExpandedChapters(prev => ({ ...prev, [chap.id]: !prev[chap.id] }))}
                            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        </div>

                        {/* Topics Items */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-slate-950/40 pl-6 border-l border-white/5"
                            >
                              {chap.topics.map(topic => {
                                const isSelected = selectedTopics[topic.id];
                                const isFocused = activeTopicId === topic.id;

                                return (
                                  <div 
                                    key={topic.id}
                                    onClick={() => setActiveTopicId(topic.id)}
                                    className={`flex items-center gap-2 p-2.5 border-b border-white/2 hover:bg-white/5 cursor-pointer transition ${
                                      isFocused ? 'bg-indigo-950/20 border-r-2 border-r-indigo-500' : ''
                                    }`}
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTopicSelected(topic.id);
                                      }}
                                      className="text-slate-400 hover:text-white transition shrink-0"
                                    >
                                      {isSelected ? (
                                        <CheckSquare className="h-3.5 w-3.5 text-indigo-500" />
                                      ) : (
                                        <Square className="h-3.5 w-3.5" />
                                      )}
                                    </button>

                                    <div className="min-w-0 pr-1">
                                      <p className={`text-[11px] truncate ${isFocused ? 'text-indigo-300 font-bold' : 'text-slate-350'}`}>
                                        {topic.title}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Active Topic Content Preview & Generation Engine Controls */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Highlight Topic Preview Tab */}
              <div className="bg-slate-900/30 border border-white/5 rounded-2xl flex-1 flex flex-col min-h-[280px]">
                {activeTopicId ? (
                  (() => {
                    // Match topic
                    let activeTopic: Topic | null = null;
                    analysisResult.chapters.forEach(chap => {
                      const found = chap.topics.find(t => t.id === activeTopicId);
                      if (found) activeTopic = found;
                    });

                    return (
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-[10px] uppercase font-mono font-bold text-slate-400 mb-1 border-b border-white/5 pb-2">
                            <BookOpen size={12} className="text-indigo-400" />
                            Syllabus Text Segment Preview
                          </div>
                          <h3 className="text-sm font-bold text-white mt-1.5">{activeTopic?.title}</h3>
                          <p className="text-xs text-slate-300 mt-3 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto pr-2">
                            {activeTopic?.content}
                          </p>
                        </div>
                        
                        <div className="text-[10px] text-slate-450 mt-4 border-t border-white/5 pt-2 text-right">
                          Estimated length: {activeTopic?.content ? activeTopic.content.split(/\s+/).filter(Boolean).length : 0} words
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-center flex-1">
                    <FileText size={24} className="mb-2 text-slate-600 animate-pulse" />
                    <p className="text-xs">No active subtopic selected for preview.</p>
                  </div>
                )}
              </div>

              {/* Study Generation Controls Dashboard */}
              <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 space-y-6">
                {/* ADVANCED CONTENT ANALYSIS & COMPLEXITY SCORING BLOCK */}
                <div className="border-b border-white/5 pb-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wide">
                        <Brain className="h-4 w-4 text-indigo-400 animate-pulse" />
                        Syllabus Content Analysis & Complexity Score
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Extracted semantic signals and textual density analytics of the document.
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setShowAdvancedAnalysis(!showAdvancedAnalysis)}
                      className="text-[10px] text-indigo-400 font-semibold font-mono hover:underline cursor-pointer bg-indigo-950/30 px-2 py-1 rounded border border-indigo-500/10"
                    >
                      {showAdvancedAnalysis ? "Minimize Analytics" : "Maximize Analytics"}
                    </button>
                  </div>

                  {showAdvancedAnalysis && (
                    <div className="space-y-4">
                      {/* Density Score Indicator row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Rating Dial */}
                        <div className="bg-slate-950/40 p-3.5 rounded-xl border border-white/5 flex flex-col justify-between">
                          <span className="text-[9px] uppercase font-mono text-slate-400 tracking-wider">Complexity Score</span>
                          <div className="flex items-baseline gap-1 mt-1.5">
                            <span className="text-2xl font-bold text-white">{analysisResult.complexityScore || 5}</span>
                            <span className="text-xs text-slate-500 font-mono">/10</span>
                          </div>
                          {/* Visual slider track representation */}
                          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-2">
                            <div 
                              className={`h-full rounded-full ${
                                (analysisResult.complexityScore || 5) <= 3 
                                  ? "bg-emerald-500" 
                                  : (analysisResult.complexityScore || 5) <= 7 
                                    ? "bg-amber-500" 
                                    : "bg-rose-500"
                              }`}
                              style={{ width: `${(analysisResult.complexityScore || 5) * 10}%` }}
                            />
                          </div>
                        </div>

                        {/* Reading Difficulty */}
                        <div className="bg-slate-950/40 p-3.5 rounded-xl border border-white/5 flex flex-col justify-between">
                          <span className="text-[9px] uppercase font-mono text-slate-400 tracking-wider">Academic Grade level</span>
                          <div className="text-sm font-bold text-indigo-300 mt-2 truncate">
                            {analysisResult.readingDifficulty || "Intermediate"}
                          </div>
                          <span className="text-[9px] text-slate-500 mt-1">
                            Syllabus terms & textual style detection
                          </span>
                        </div>

                        {/* File Size details */}
                        <div className="bg-slate-950/40 p-3.5 rounded-xl border border-white/5 flex flex-col justify-between">
                          <span className="text-[9px] uppercase font-mono text-slate-400 tracking-wider">Document Density</span>
                          <div className="text-sm font-bold text-white mt-2 font-mono">
                            {(analysisResult.extractedTextLength / 1000).toFixed(1)} KB
                          </div>
                          <span className="text-[9px] text-slate-500 mt-1">
                            Total character count processed
                          </span>
                        </div>
                      </div>

                      {/* Extracted stats grid bento box */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                        {[
                          { label: 'Concepts', count: analysisResult.detectedConceptsCount ?? 14, color: 'text-indigo-400', bg: 'bg-indigo-950/20 border-indigo-500/10' },
                          { label: 'Formulas', count: analysisResult.detectedFormulasCount ?? 6, color: 'text-sky-400', bg: 'bg-sky-950/20 border-sky-500/10' },
                          { label: 'Processes', count: analysisResult.detectedProcessesCount ?? 3, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-500/10' },
                          { label: 'Definitions', count: analysisResult.detectedDefinitionsCount ?? 8, color: 'text-pink-400', bg: 'bg-pink-950/20 border-pink-500/10' },
                          { label: 'Important Facts', count: analysisResult.detectedFactsCount ?? 15, color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-500/10' },
                          { label: 'Key Dates', count: analysisResult.detectedDatesCount ?? 2, color: 'text-teal-400', bg: 'bg-teal-950/20 border-teal-500/10' },
                          { label: 'Vocabulary', count: analysisResult.detectedVocabularyCount ?? 10, color: 'text-rose-400', bg: 'bg-rose-950/20 border-rose-500/10' }
                        ].map((stat, idx) => (
                          <div key={idx} className={`p-2 rounded-xl border text-center flex flex-col justify-between ${stat.bg}`}>
                            <span className="text-[9px] uppercase font-mono text-slate-405 truncate block">{stat.label}</span>
                            <span className={`text-sm font-bold block mt-1 ${stat.color}`}>{stat.count}</span>
                          </div>
                        ))}
                      </div>

                      {/* Display some actual lists if returned */}
                      {((analysisResult.keyConcepts && analysisResult.keyConcepts.length > 0) || 
                        (analysisResult.formulas && analysisResult.formulas.length > 0) ||
                        (analysisResult.processes && analysisResult.processes.length > 0)) && (
                        <div className="bg-slate-950/30 p-3.5 rounded-xl border border-white/5 space-y-2 text-[10px]">
                          <strong className="uppercase font-mono text-slate-400 tracking-wider block mb-1">Detected Content Features Catalogs</strong>
                          <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                            {(analysisResult.keyConcepts || []).map((term, i) => (
                              <span key={`concept-${i}`} className="bg-indigo-950/40 border border-indigo-550/20 px-2 py-0.5 rounded text-indigo-300 font-sans">
                                💡 {term}
                              </span>
                            ))}
                            {(analysisResult.formulas || []).map((term, i) => (
                              <span key={`formula-${i}`} className="bg-sky-950/40 border border-sky-550/20 px-2 py-0.5 rounded text-sky-300 font-sans">
                                🧪 {term}
                              </span>
                            ))}
                            {(analysisResult.processes || []).map((term, i) => (
                              <span key={`process-${i}`} className="bg-emerald-950/40 border border-emerald-550/20 px-2 py-0.5 rounded text-emerald-300 font-sans">
                                🔄 {term}
                              </span>
                            ))}
                            {(analysisResult.definitions || []).map((term, i) => (
                              <span key={`def-${i}`} className="bg-pink-950/40 border border-pink-550/20 px-2 py-0.5 rounded text-pink-300 font-sans">
                                📖 {term}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ADAPTIVE STUDY MODES SELECTOR BLOCK */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wide flex items-center gap-1.5">
                      <Layers size={13} className="text-emerald-400" />
                      1. Select Study Mode Profile
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-white/5 uppercase">
                      Adaptive Recommendations Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'quick', title: 'Quick Review', desc: 'Minimal cards for rapid testing' },
                      { id: 'standard', title: 'Standard', desc: 'Optimal, balanced outline coverage' },
                      { id: 'deep', title: 'Deep Study', desc: 'Exhaustive notes & memory deck' },
                      { id: 'exam', title: 'Exam Prep', desc: 'Maximizes target fact retrieval Qs' }
                    ].map(mode => {
                      const isActive = studyMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setStudyMode(mode.id as any)}
                          className={`flex flex-col items-start p-3 rounded-2xl border text-left cursor-pointer transition ${
                            isActive 
                              ? 'bg-indigo-650/20 border-indigo-500/70 text-white shadow-md shadow-indigo-950/10' 
                              : 'bg-white/[0.01] border-white/5 text-slate-400 hover:bg-white/5'
                          }`}
                        >
                          <span className={`text-[11px] font-bold ${isActive ? 'text-indigo-300' : 'text-slate-350'}`}>
                            {mode.title}
                          </span>
                          <span className="text-[9px] text-slate-450 mt-1 select-none leading-relaxed">
                            {mode.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SLIDERS FOR FINE-TUNING QUANTITIES */}
                <div className="space-y-3 bg-slate-950/30 p-4 rounded-2xl border border-white/5">
                  <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wide flex items-center gap-1.5">
                    <RotateCcw size={13} className="text-sky-400" />
                    2. Fine-Tune Generation Quantities
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Flashcards Count Slider */}
                    {resourceSelection.flashcard && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <label className="text-[11px] font-bold text-slate-300 md:col-span-3 truncate flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                          Flashcards Count:
                        </label>
                        <div className="md:col-span-7 flex items-center gap-3">
                          <input 
                            type="range"
                            min="5"
                            max="60"
                            value={flashcardsCount}
                            onChange={(e) => setFlashcardsCount(parseInt(e.target.value, 10))}
                            className="flex-1 accent-indigo-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
                          />
                        </div>
                        <span className="md:col-span-2 text-right text-[11px] font-mono text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/20">
                          {flashcardsCount} items
                        </span>
                      </div>
                    )}

                    {/* MCQs Count Slider */}
                    {resourceSelection.mcq && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <label className="text-[11px] font-bold text-slate-300 md:col-span-3 truncate flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          MCQ Questions:
                        </label>
                        <div className="md:col-span-7 flex items-center gap-3">
                          <input 
                            type="range"
                            min="3"
                            max="35"
                            value={mcqsCount}
                            onChange={(e) => setMcqsCount(parseInt(e.target.value, 10))}
                            className="flex-1 accent-emerald-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
                          />
                        </div>
                        <span className="md:col-span-2 text-right text-[11px] font-mono text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                          {mcqsCount} items
                        </span>
                      </div>
                    )}

                    {/* Active Recall Questions Slider */}
                    {resourceSelection.recall && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <label className="text-[11px] font-bold text-slate-300 md:col-span-3 truncate flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                          Recall Prompts:
                        </label>
                        <div className="md:col-span-7 flex items-center gap-3">
                          <input 
                            type="range"
                            min="3"
                            max="30"
                            value={recallCount}
                            onChange={(e) => setRecallCount(parseInt(e.target.value, 10))}
                            className="flex-1 accent-sky-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
                          />
                        </div>
                        <span className="md:col-span-2 text-right text-[11px] font-mono text-sky-450 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-500/20">
                          {recallCount} items
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* SELECT CHANNELS & TRIGGER PANEL */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wide flex items-center gap-1.5">
                    <CheckSquare size={13} className="text-indigo-400" />
                    3. Study Resource Selection
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { key: 'flashcard', title: 'Flashcards', desc: 'Q&A Memory deck' },
                      { key: 'mcq', title: 'MCQ Quiz', desc: 'Multiple choice test' },
                      { key: 'recall', title: 'Recall Check', desc: 'Active retrieval Q\'s' },
                      { key: 'summary', title: 'Summary', desc: 'Synthesized overview' },
                      { key: 'notes', title: 'Study Notes', desc: 'Comprehensive notebooks' }
                    ].map(spec => {
                      const activeState = resourceSelection[spec.key];
                      return (
                        <button
                          key={spec.key}
                          onClick={() => setResourceSelection(prev => ({ ...prev, [spec.key]: !prev[spec.key] }))}
                          className={`flex flex-col items-start gap-1 p-3 rounded-2xl border text-left transition relative overflow-hidden group hover:-translate-y-0.5 duration-200 cursor-pointer ${
                            activeState 
                              ? 'bg-indigo-650/15 border-indigo-500/40 text-white' 
                              : 'bg-white/[0.01] border-white/5 text-slate-400 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={`text-[11px] font-bold ${activeState ? 'text-indigo-300' : 'text-slate-350'}`}>{spec.title}</span>
                            <span className={`h-4 w-4 rounded-full border flex items-center justify-center ${activeState ? 'border-indigo-400 text-indigo-400 bg-indigo-900/40' : 'border-slate-600'}`}>
                              {activeState && <Check size={10} />}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-450 truncate mt-0.5">{spec.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* METRICS & ACTION BUTTON PANEL */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-white/5">
                  <div className="bg-slate-950/40 px-4 py-2.5 rounded-xl border border-white/5 flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                    <div className="text-[11px]">
                      <span className="text-slate-400">Estimated Generation Period: </span>
                      <span className="font-mono text-indigo-300 font-bold">
                        ~{Math.max(3, Math.ceil((resourceSelection.flashcard ? flashcardsCount * 0.15 : 0) + (resourceSelection.mcq ? mcqsCount * 0.35 : 0) + (resourceSelection.recall ? recallCount * 0.25 : 0) + (resourceSelection.summary ? 2 : 0) + (resourceSelection.notes ? 3 : 0)))}s
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateStudyResources}
                    className="flex items-center justify-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-950/20 cursor-pointer hover:shadow-indigo-505/30 transition group"
                  >
                    Generate Selected Assets
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Synthesis Generation Screen */}
        {isGenerating && (
          <motion.div
            key="generation-loading-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto"
          >
            <div className="h-16 w-16 relative mb-6">
              <div className="h-full w-full rounded-full border-2 border-t-indigo-500 border-indigo-950/20 border-dotted animate-spin"></div>
              <div className="absolute inset-2 bg-indigo-950/50 rounded-full flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
              </div>
            </div>
            
            <h3 className="text-sm font-semibold text-white">Generating Study Material</h3>
            <p className="text-[11px] text-indigo-400 mt-1.5 font-mono bg-indigo-950/40 px-3 py-1 rounded-full inline-block border border-indigo-500/20">
              {GENERATION_STEPS[generationStepIdx]}
            </p>
            
            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-6">
              <motion.div 
                className="bg-indigo-500 h-full"
                animate={{ width: `${((generationStepIdx + 1) / GENERATION_STEPS.length) * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            
            <p className="text-[10px] text-slate-400 mt-4 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-white/5">
              Calling Gemini on parsed syllabus. This will synthesize flashcards, active recall questions, and summarizing guides simultaneously.
            </p>
          </motion.div>
        )}

        {/* Step 4: Preview Generated Study Deck Results & Subject library sync */}
        {Object.keys(generatedMaterial).length > 0 && !isGenerating && (
          <motion.div
            key="study-deck-results"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Column: Preview Content tabs navigation and Subject Saving Form Card */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider border-b border-white/5 pb-2 mb-3">
                  RESOURCE SELECTOR
                </h4>
                <div className="space-y-1.5 font-sans">
                  {Object.entries(generatedMaterial).map(([key, rawData]) => {
                    const data = rawData as any;
                    const countMap: Record<string, string> = {
                      flashcard: `${(data || []).length} cards`,
                      mcq: `${(data.questions || []).length} questions`,
                      recall: `${(data || []).length} recall prompts`,
                      summary: 'markdown summary',
                      notes: 'study guide'
                    };
                    const labelMap: Record<string, string> = {
                      flashcard: 'Flashcard Deck',
                      mcq: 'Multiple Choice Quiz',
                      recall: 'Recall Questions',
                      summary: 'Syllabus Summary',
                      notes: 'Course Notes'
                    };

                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setActivePreviewTab(key);
                          setActiveFlashcardIndex(0);
                          setFlashcardFlipped(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          activePreviewTab === key 
                            ? 'bg-indigo-650/15 border-indigo-500/50 text-white font-semibold' 
                            : 'bg-white/[0.01] border-white/2 text-slate-400 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                          <span className="text-xs truncate">{labelMap[key]}</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-450 bg-slate-950 px-2 py-0.5 rounded-md border border-white/5">{countMap[key]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SAVE TO STUDY LIBRARY CONTROL CARD */}
              <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-5 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1">
                    <FolderPlus size={13} className="text-indigo-400" />
                    SAVE IN ZYPHORA
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    Choose which subject folder to store this generated deck under.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase font-mono tracking-wider mb-1.5">
                      Target Course Subject Folder
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        className="flex-1 bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                      >
                        <option value="">-- select course --</option>
                        {subjects.map(sub => (
                          <option key={sub.id} value={sub.id}>
                            {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                          </option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => setShowSubjectModal(true)}
                        className="p-2 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/35 text-indigo-300 rounded-xl transition cursor-pointer"
                        title="Create new Subject"
                      >
                        <FolderPlus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveToStudyLibrary}
                    disabled={!selectedSubjectId}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-550 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-transparent text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer transition"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Save Study Deck inside Library
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Preview Panels based on focused tab (with workspace testing tools) */}
            <div className="lg:col-span-8">
              <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 min-h-[400px] flex flex-col justify-between">
                
                {/* 1. FLASHCARD PREVIEW DECK WORKSPACE */}
                {activePreviewTab === 'flashcard' && (
                  (() => {
                    const list: any[] = generatedMaterial.flashcard || [];
                    const currentCard = list[activeFlashcardIndex];
                    if (!currentCard) return null;

                    return (
                      <div className="space-y-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-slate-450 border-b border-white/5 pb-2 text-[10px] uppercase font-mono tracking-wider">
                            <span>Interactive Flashcards Preview</span>
                            <span>{activeFlashcardIndex + 1} of {list.length}</span>
                          </div>

                          <div className="py-6 max-w-sm mx-auto w-full">
                            {/* Card Object */}
                            <div 
                              onClick={() => setFlashcardFlipped(prev => !prev)}
                              className={`h-52 w-full card-rotator cursor-pointer select-none rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 p-6 flex flex-col items-center justify-center text-center shadow-lg hover:border-indigo-500/50 transition relative overflow-hidden`}
                            >
                              {/* Ambient pulse */}
                              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full filter blur-xl animate-pulse pointer-events-none"></div>
                              
                              <span className="text-[9px] uppercase font-mono text-slate-450 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-550 mb-3 block">
                                {flashcardFlipped ? 'BACK side (Answer)' : 'FRONT side (Prompt)'}
                              </span>

                              <p className={`text-sm tracking-tight font-medium ${flashcardFlipped ? 'text-indigo-200' : 'text-white'}`}>
                                {flashcardFlipped ? currentCard.back : currentCard.front}
                              </p>

                              <span className="text-[9px] text-slate-500 mt-4 italic block font-mono">
                                Click anywhere to Flip
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Pagination controller bar */}
                        <div className="flex justify-between items-center border-t border-white/5 pt-4">
                          <button
                            disabled={activeFlashcardIndex === 0}
                            onClick={() => {
                              setActiveFlashcardIndex(prev => prev - 1);
                              setFlashcardFlipped(false);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 disabled:opacity-40 text-xs text-slate-350 cursor-pointer"
                          >
                            Previous Card
                          </button>
                          
                          <button
                            disabled={activeFlashcardIndex === list.length - 1}
                            onClick={() => {
                              setActiveFlashcardIndex(prev => prev + 1);
                              setFlashcardFlipped(false);
                            }}
                            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white cursor-pointer"
                          >
                            Next Card
                          </button>
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* 2. MULTIPLE CHOICE COMPETENCE QUIZ PRACTICE ENGINES */}
                {activePreviewTab === 'mcq' && (
                  (() => {
                    const quiz = generatedMaterial.mcq || {};
                    const questionsList: any[] = quiz.questions || [];

                    return (
                      <div className="space-y-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[10px] uppercase font-mono tracking-wider text-slate-400">
                            <span>Interactive Practice quiz</span>
                            <span>{questionsList.length} Questions</span>
                          </div>
                          
                          <h3 className="text-sm font-bold text-white mt-3 font-sans">{quiz.title || "Interactive Practice MCQ Quiz"}</h3>
                          
                          <div className="space-y-5 mt-4 max-h-[300px] overflow-y-auto pr-2 divide-y divide-white/5">
                            {questionsList.map((q, qIndex) => {
                              const selectedOpt = practiceAnswers[qIndex];
                              const isCorrect = selectedOpt === q.correctAnswerIndex;

                              return (
                                <div key={qIndex} className="pt-4 space-y-3">
                                  <h4 className="text-xs font-semibold text-slate-250 flex items-start gap-1.5">
                                    <span className="text-indigo-400 font-mono font-bold text-xs shrink-0">{qIndex + 1}.</span>
                                    <span>{q.question}</span>
                                  </h4>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-3">
                                    {(q.options || []).map((opt: string, optIdx: number) => {
                                      const isChosen = selectedOpt === optIdx;
                                      const isCorrectIdx = q.correctAnswerIndex === optIdx;

                                      let optionStyle = "bg-white/[0.01] hover:bg-white/5 text-slate-300 border-white/5";
                                      if (practiceSubmitted) {
                                        if (isCorrectIdx) {
                                          optionStyle = "bg-emerald-900/20 border-emerald-500/50 text-emerald-300";
                                        } else if (isChosen && !isCorrect) {
                                          optionStyle = "bg-rose-900/20 border-rose-500/50 text-rose-300";
                                        } else {
                                          optionStyle = "bg-white/[0.01] text-slate-500 border-white/2 opacity-35";
                                        }
                                      } else if (isChosen) {
                                        optionStyle = "bg-indigo-950 border-indigo-500/60 text-indigo-200 font-semibold";
                                      }

                                      return (
                                        <button
                                          key={optIdx}
                                          disabled={practiceSubmitted}
                                          onClick={() => setPracticeAnswers(prev => ({ ...prev, [qIndex]: optIdx }))}
                                          className={`px-3 py-2 border rounded-xl text-left text-[11px] transition duration-150 shrink-0 ${optionStyle}`}
                                        >
                                          {opt}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Controls for evaluation */}
                        <div className="flex justify-end items-center border-t border-white/5 pt-4 gap-2">
                          {practiceSubmitted && (
                            <button
                              onClick={() => {
                                setPracticeAnswers({});
                                setPracticeSubmitted(false);
                              }}
                              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-xs text-slate-300 rounded-xl transition cursor-pointer"
                            >
                              Clear Answers
                            </button>
                          )}
                          
                          <button
                            disabled={Object.keys(practiceAnswers).length < questionsList.length || practiceSubmitted}
                            onClick={() => {
                              setPracticeSubmitted(true);
                              addToast("Quiz graded! Preview answers below.", "info");
                            }}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-40"
                          >
                            Submit & Grade Quiz
                          </button>
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* 3. ACTIVE RECALL QUESTIONS LIST */}
                {activePreviewTab === 'recall' && (
                  (() => {
                    const list: any[] = generatedMaterial.recall || [];
                    return (
                      <div className="space-y-4">
                        <div className="border-b border-white/5 pb-2 text-[10px] uppercase font-mono tracking-wider text-slate-400">
                          Active Recall Questions List Preview
                        </div>

                        <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2 divide-y divide-white/5">
                          {list.map((item, id) => (
                            <div key={id} className="pt-3 space-y-2">
                              <h4 className="text-xs font-bold text-slate-205 flex items-start gap-1.5 leading-relaxed">
                                <span className="text-sky-400 font-mono font-bold shrink-0">{id + 1}.</span>
                                <span>{item.question}</span>
                              </h4>
                              <p className="text-[11px] text-slate-350 bg-slate-950/40 p-3 rounded-xl border border-white/2 pl-4 border-l-2 border-l-sky-505 leading-relaxed">
                                <strong className="text-sky-305 font-mono text-[9px] uppercase tracking-wider block mb-0.5">Explanation:</strong>
                                {item.answer}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* 4. SYLLABUS SUMMARY DOCUMENT WITH MARKDOWN FORMATTER */}
                {activePreviewTab === 'summary' && (
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="border-b border-white/5 pb-2 text-[10px] uppercase font-mono tracking-wider text-slate-400">
                      Syllabus Summary Guide
                    </div>

                    <div className="flex-1 max-h-[320px] overflow-y-auto pr-2 bg-slate-950/30 p-4 rounded-2xl border border-white/2">
                      <SimpleMarkdownRenderer text={generatedMaterial.summary?.summary || ''} />
                    </div>
                  </div>
                )}

                {/* 5. NOTES DOCUMENT WITH MARKDOWN FORMATTER */}
                {activePreviewTab === 'notes' && (
                  <div className="space-y-4 flex-1 flex flex-col font-sans">
                    <div className="border-b border-white/5 pb-2 text-[10px] uppercase font-mono tracking-wider text-slate-400">
                      Study Notes Catalog
                    </div>

                    <div className="flex-1 max-h-[320px] overflow-y-auto pr-2 bg-slate-950/30 p-4 rounded-2xl border border-white/2">
                      <SimpleMarkdownRenderer text={generatedMaterial.notes?.notes || ''} />
                    </div>
                  </div>
                )}

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUICK CREATE COURSE SUBJECT INLINE MODAL */}
      <AnimatePresence>
        {showSubjectModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] pointer-events-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setShowSubjectModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-450 hover:bg-white/5 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>

              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
                  <FolderPlus size={16} className="text-indigo-400" />
                  Establish Course Folder
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Set up a unique database subject directory to house AI materials.
                </p>
              </div>

              <form onSubmit={handleQuickAddSubject} className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Subject Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bio-Chemistry II"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Course Code</label>
                    <input
                      type="text"
                      placeholder="e.g. BIO122"
                      value={newSubCode}
                      onChange={(e) => setNewSubCode(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Theme Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newSubColor}
                        onChange={(e) => setNewSubColor(e.target.value)}
                        className="h-8 w-12 bg-transparent border-0 cursor-pointer shrink-0"
                      />
                      <span className="text-[10px] font-mono text-slate-300">{newSubColor}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition text-center"
                >
                  Create Folder
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
