import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, Send, Sparkles, BookOpen, Layers, CheckCircle2, HelpCircle, 
  Trash2, MessageSquare, Plus, Check, ChevronRight, Bookmark, AlertCircle,
  Clock, ArrowRight, User, RefreshCw, Star, Info, FileText
} from 'lucide-react';
import katex from 'katex';
import { Subject, Chapter, Topic, SavedNote, TutorSession, TutorChatMessage } from '../types';

export const getApiUrl = (endpoint: string): string => {
  const isLocalOrSandbox = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.run.app')
  );
  if (endpoint.startsWith('/.netlify/functions/')) {
    if (isLocalOrSandbox) {
      return '/api/tutor/chat';
    }
    return endpoint;
  }
  if (isLocalOrSandbox) {
    return endpoint;
  }
  // Route to the deployed Cloud Run endpoint for Netlify/static hosting environments
  return `https://ais-pre-xbwyyxmvozyt2g2qyhovvv-246053219887.asia-southeast1.run.app${endpoint}`;
};

interface AITutorViewProps {
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  subjects: Subject[];
  onNavigate: (view: 'dashboard' | 'tasks' | 'planner' | 'recall' | 'revision' | 'library' | 'import' | 'backup' | 'tutor', subTab?: string) => void;
}

// Interface for tokenized blocks (code blocks, display equations, standard text)
interface Block {
  type: 'code' | 'math' | 'markdown';
  content: string;
  language?: string;
}

// Tokenizes text into code blocks, math blocks, and markdown content blocks
function tokenizeBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let currentIndex = 0;
  const length = text.length;

  while (currentIndex < length) {
    const codeIndex = text.indexOf('```', currentIndex);
    const mathIndex = text.indexOf('$$', currentIndex);

    let nextIndex = -1;
    let isCode = false;

    if (codeIndex !== -1 && mathIndex !== -1) {
      if (codeIndex < mathIndex) {
        nextIndex = codeIndex;
        isCode = true;
      } else {
        nextIndex = mathIndex;
        isCode = false;
      }
    } else if (codeIndex !== -1) {
      nextIndex = codeIndex;
      isCode = true;
    } else if (mathIndex !== -1) {
      nextIndex = mathIndex;
      isCode = false;
    }

    if (nextIndex === -1) {
      const remaining = text.substring(currentIndex);
      if (remaining) {
        blocks.push({ type: 'markdown', content: remaining });
      }
      break;
    }

    if (nextIndex > currentIndex) {
      const preceding = text.substring(currentIndex, nextIndex);
      if (preceding) {
        blocks.push({ type: 'markdown', content: preceding });
      }
    }

    if (isCode) {
      const contentStart = nextIndex + 3;
      const endCodeIndex = text.indexOf('```', contentStart);
      if (endCodeIndex === -1) {
        const codeContent = text.substring(contentStart);
        const firstNewline = codeContent.indexOf('\n');
        let language = '';
        let actualContent = codeContent;
        if (firstNewline !== -1) {
          const possibleLang = codeContent.substring(0, firstNewline).trim();
          if (possibleLang && /^[a-zA-Z0-9#+-]+$/.test(possibleLang)) {
            language = possibleLang;
            actualContent = codeContent.substring(firstNewline + 1);
          }
        }
        blocks.push({ type: 'code', content: actualContent, language });
        break;
      } else {
        const codeContent = text.substring(contentStart, endCodeIndex);
        const firstNewline = codeContent.indexOf('\n');
        let language = '';
        let actualContent = codeContent;
        if (firstNewline !== -1) {
          const possibleLang = codeContent.substring(0, firstNewline).trim();
          if (possibleLang && /^[a-zA-Z0-9#+-]+$/.test(possibleLang)) {
            language = possibleLang;
            actualContent = codeContent.substring(firstNewline + 1);
          }
        }
        blocks.push({ type: 'code', content: actualContent, language });
        currentIndex = endCodeIndex + 3;
      }
    } else {
      const contentStart = nextIndex + 2;
      const endMathIndex = text.indexOf('$$', contentStart);
      if (endMathIndex === -1) {
        const mathContent = text.substring(contentStart);
        blocks.push({ type: 'math', content: mathContent });
        break;
      } else {
        const mathContent = text.substring(contentStart, endMathIndex);
        blocks.push({ type: 'math', content: mathContent });
        currentIndex = endMathIndex + 2;
      }
    }
  }

  return blocks;
}

// Inline LaTeX Math rendering component with graceful text fallback
function MathComponent({ tex, displayMode }: { tex: string; displayMode: boolean; key?: React.Key }) {
  try {
    const html = katex.renderToString(tex, {
      displayMode,
      throwOnError: true,
    });
    return (
      <span 
        className={displayMode ? "block my-3 overflow-x-auto py-1 max-w-full scrollbar-thin" : "inline-block px-0.5"} 
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    );
  } catch (error) {
    console.warn("LaTeX rendering failed, using fallback:", error);
    if (displayMode) {
      return (
        <div className="block my-3 font-mono text-xs text-indigo-300 bg-slate-950/50 p-2.5 rounded-lg border border-indigo-500/10 overflow-x-auto">
          {tex}
        </div>
      );
    }
    return <span className="font-mono text-xs text-indigo-300">{tex}</span>;
  }
}

// Helper to parse inline elements like bold (**), italics (* or _), inline math ($), and code (`)
function parseInlineElements(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match: Inline math $...$, bold **...** or __...__, inline code `...`, italics *...* or _..._
  const regex = /(\$(?!\$)[^\$]+\$|\*\*.*?\*\*|__.*?__|`.*?`|\*.*?\*|_.*?_)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (!part) return null;

    // 1. Inline math: $...$
    if (part.startsWith('$') && part.endsWith('$') && !part.startsWith('$$')) {
      const tex = part.slice(1, -1);
      return <MathComponent key={i} tex={tex} displayMode={false} />;
    }

    // 2. Bold: **...** or __...__
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      const content = part.slice(2, -2);
      return <strong key={i} className="text-white font-bold font-sans">{parseInlineElements(content)}</strong>;
    }

    // 3. Inline code: `...`
    if (part.startsWith('`') && part.endsWith('`')) {
      const content = part.slice(1, -1);
      return <code key={i} className="px-1.5 py-0.5 bg-slate-950 text-indigo-300 font-mono text-xs rounded border border-white/5">{content}</code>;
    }

    // 4. Italics: *...* or _..._
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      const content = part.slice(1, -1);
      return <em key={i} className="italic text-slate-300">{parseInlineElements(content)}</em>;
    }

    return part;
  });
}

// Polished markdown and LaTeX block/inline renderer
function MarkdownRenderer({ text }: { text: string }) {
  if (!text) return null;

  const blocks = tokenizeBlocks(text);

  return (
    <div className="space-y-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans max-w-full overflow-hidden">
      {blocks.map((block, bIdx) => {
        if (block.type === 'code') {
          return (
            <div key={bIdx} className="my-3 rounded-xl border border-white/10 overflow-hidden shadow-lg bg-slate-950">
              <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900 border-b border-white/5 text-[10px] text-slate-400 font-mono select-none">
                <span>{block.language || 'code'}</span>
                <button
                  onClick={(e) => {
                    navigator.clipboard.writeText(block.content);
                    const btn = e.currentTarget;
                    btn.innerText = 'Copied!';
                    setTimeout(() => { btn.innerText = 'Copy'; }, 2000);
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Copy
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-xs font-mono text-emerald-400 leading-relaxed max-w-full">
                <code>{block.content}</code>
              </pre>
            </div>
          );
        }

        if (block.type === 'math') {
          return <MathComponent key={bIdx} tex={block.content} displayMode={true} />;
        }

        const lines = block.content.split('\n');
        return (
          <React.Fragment key={bIdx}>
            {lines.map((line, idx) => {
              const leadingSpaces = line.search(/\S/);
              const trimmed = line.trim();
              const indentClass = leadingSpaces > 4 ? "pl-8" : leadingSpaces > 1 ? "pl-4" : "pl-1";

              // Headers
              if (trimmed.startsWith('###')) {
                return (
                  <h4 key={idx} className="text-xs sm:text-sm font-bold text-white pt-2.5 pb-1 flex items-center gap-1.5 font-sans">
                    {parseInlineElements(trimmed.replace('###', '').trim())}
                  </h4>
                );
              }
              if (trimmed.startsWith('##')) {
                return (
                  <h3 key={idx} className="text-xs sm:text-sm font-bold text-indigo-300 pt-3.5 pb-1 uppercase tracking-wider font-sans">
                    {parseInlineElements(trimmed.replace('##', '').trim())}
                  </h3>
                );
              }
              if (trimmed.startsWith('#')) {
                return (
                  <h2 key={idx} className="text-sm sm:text-base font-bold text-white pt-4 pb-1 border-b border-indigo-500/20 font-sans">
                    {parseInlineElements(trimmed.replace('#', '').trim())}
                  </h2>
                );
              }

              // Horizontal rule
              if (trimmed === '---') {
                return <div key={idx} className="my-3 border-t border-white/10" />;
              }

              // Bullet lists
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('+ ')) {
                const itemText = trimmed.substring(2);
                return (
                  <div key={idx} className={`flex items-start gap-2 ${indentClass} my-0.5`}>
                    <span className="text-indigo-400 select-none mt-1.5 text-[8px] shrink-0">●</span>
                    <span className="text-xs sm:text-sm">{parseInlineElements(itemText)}</span>
                  </div>
                );
              }

              // Numbered lists
              const matchNum = trimmed.match(/^(\d+)\.\s(.*)/);
              if (matchNum) {
                return (
                  <div key={idx} className={`flex items-start gap-2 ${indentClass} my-0.5`}>
                    <span className="font-mono text-xs text-indigo-400 select-none shrink-0">{matchNum[1]}.</span>
                    <span className="text-xs sm:text-sm">{parseInlineElements(matchNum[2])}</span>
                  </div>
                );
              }

              // Blockquotes
              if (trimmed.startsWith('>')) {
                return (
                  <blockquote key={idx} className="pl-3.5 py-1 border-l-2 border-indigo-500 bg-white/5 text-slate-300 italic my-1 rounded-r-lg text-xs sm:text-sm leading-relaxed">
                    {parseInlineElements(trimmed.replace(/^>\s*/, ''))}
                  </blockquote>
                );
              }

              if (trimmed === '') {
                return <div key={idx} className="h-1.5" />;
              }

              return <p key={idx} className="text-xs sm:text-sm my-0.5 leading-relaxed">{parseInlineElements(line)}</p>;
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function AITutorView({ addToast, subjects, onNavigate }: AITutorViewProps) {
  // Database state preloaded from local storage
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [materials, setMaterials] = useState<any>({});

  // Tutor session states
  const [sessions, setSessions] = useState<TutorSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Selector filters
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [includeStudyNotes, setIncludeStudyNotes] = useState<boolean>(true);

  // Gemini Layout & Smart scrolling variables
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chatInterfaceRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 60;
    setShouldAutoScroll(isAtBottom);
  };

  useEffect(() => {
    setShouldAutoScroll(true);
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
      chatInterfaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  }, [activeSessionId]);

  // Mode and deep study variables
  const [currentMode, setCurrentMode] = useState<TutorSession['mode']>('explain');
  const [learningSupport, setLearningSupport] = useState<TutorSession['learningSupport']>('step_by_step');
  
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load datasets on mount
  useEffect(() => {
    try {
      const localChapters = localStorage.getItem('recall_chapters');
      if (localChapters) setChapters(JSON.parse(localChapters));

      const localTopics = localStorage.getItem('recall_topics');
      if (localTopics) setTopics(JSON.parse(localTopics));

      const localNotes = localStorage.getItem('recall_study_notes');
      if (localNotes) setNotes(JSON.parse(localNotes));

      const localMaterials = localStorage.getItem('recall_generated_material');
      if (localMaterials) setMaterials(JSON.parse(localMaterials));

      const localSessions = localStorage.getItem('student_os_tutor_sessions');
      if (localSessions) {
        const parsed = JSON.parse(localSessions);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
          // Sync selectors with loaded session context
          const sess = parsed[0];
          if (sess.subjectId) setSelectedSubjectId(sess.subjectId);
          if (sess.chapterId) setSelectedChapterId(sess.chapterId);
          if (sess.topicId) setSelectedTopicId(sess.topicId);
          if (sess.mode) setCurrentMode(sess.mode);
          if (sess.learningSupport) setLearningSupport(sess.learningSupport);
        }
      }
    } catch (e) {
      console.error('Failed to load datasets in AI tutor view', e);
    }
  }, []);

  // Save sessions to localStorage whenever changes occur
  const saveSessions = (updatedSessions: TutorSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem('student_os_tutor_sessions', JSON.stringify(updatedSessions));
  };

  // Filter lists based on matches
  const filteredChapters = chapters.filter(c => c.subjectId === selectedSubjectId);
  const filteredTopics = topics.filter(t => t.chapterId === selectedChapterId);

  // Extract selected note context
  const getContextPayload = () => {
    if (!includeStudyNotes) return null;

    let matchedNote: SavedNote | undefined;
    if (selectedTopicId) {
      matchedNote = notes.find(n => n.topicId === selectedTopicId);
    } else if (selectedChapterId) {
      matchedNote = notes.find(n => n.chapterId === selectedChapterId);
    } else if (selectedSubjectId) {
      matchedNote = notes.find(n => n.subjectId === selectedSubjectId);
    }

    // Capture extra materials like related active recalls
    let additionalMaterial = '';
    if (selectedTopicId && materials[selectedTopicId]) {
      const mat = materials[selectedTopicId];
      if (mat.questions && mat.questions.length > 0) {
        additionalMaterial += `\nRecall Practice Questions:\n${mat.questions.map((q: any, i: number) => `Q${i+1}: ${q.question} (A: ${q.answer})`).join('\n')}\n`;
      }
      if (mat.flashcards && mat.flashcards.length > 0) {
        additionalMaterial += `\nStudy Flashcards:\n${mat.flashcards.map((f: any, i: number) => `F${i+1} Front: ${f.front} | Back: ${f.back}`).join('\n')}\n`;
      }
    }

    const currentSub = subjects.find(s => s.id === selectedSubjectId);
    const currentChap = chapters.find(c => c.id === selectedChapterId);
    const currentTop = topics.find(t => t.id === selectedTopicId);

    return {
      subject: currentSub?.name || '',
      chapter: currentChap?.title || '',
      topic: currentTop?.title || '',
      noteText: matchedNote ? `Title: ${matchedNote.title}\nContent:\n${matchedNote.content}` : '',
      additionalMaterial
    };
  };

  // Find active session
  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  // Auto scroll logic: Smart anchor to bottom if the user hasn't scrolled up
  useEffect(() => {
    if (shouldAutoScroll) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
      chatInterfaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [activeSession?.messages, isLoading, shouldAutoScroll]);

  // Handle setting active session
  const selectSession = (session: TutorSession) => {
    setActiveSessionId(session.id);
    if (session.subjectId) setSelectedSubjectId(session.subjectId);
    if (session.chapterId) setSelectedChapterId(session.chapterId);
    if (session.topicId) setSelectedTopicId(session.topicId);
    setCurrentMode(session.mode);
    setLearningSupport(session.learningSupport);
  };

  // Start new tutoring interaction session
  const handleStartNewSession = (initialModeOverride?: TutorSession['mode']) => {
    const topicObj = topics.find(t => t.id === selectedTopicId);
    const subjectObj = subjects.find(s => s.id === selectedSubjectId);
    
    let titleStr = 'General Chat';
    if (topicObj) {
      titleStr = `${topicObj.title} Session`;
    } else if (subjectObj) {
      titleStr = `${subjectObj.name} Session`;
    }

    const modeToUse = initialModeOverride || currentMode;

    const newSession: TutorSession = {
      id: `session_${Date.now()}`,
      title: titleStr,
      timestamp: new Date().toISOString(),
      subjectId: selectedSubjectId || undefined,
      chapterId: selectedChapterId || undefined,
      topicId: selectedTopicId || undefined,
      messages: [],
      mode: modeToUse,
      learningSupport
    };

    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setActiveSessionId(newSession.id);
    addToast(`New study session created for ${titleStr}! 🎓`, 'success');

    // Automatically generate a local welcome message starting instantly
    triggerInitialGreeting(newSession, modeToUse);
  };

  const triggerInitialGreeting = (session: TutorSession, modeToUse: TutorSession['mode']) => {
    const topicObj = topics.find(t => t.id === session.topicId);
    const subjectObj = subjects.find(s => s.id === session.subjectId);
    
    let contextStr = '';
    if (topicObj) {
      contextStr = `We are studying **${topicObj.title}** under chapter **${chapters.find(c => c.id === session.chapterId)?.title || ''}**.`;
    } else if (subjectObj) {
      contextStr = `We are focusing on the subject **${subjectObj.name}**.`;
    } else {
      contextStr = `No study topic or subject has been selected on the left panel, which means **General Ask-Me-Anything Mode is active**! You are free to ask me anything you want.`;
    }

    const modeLabels: Record<string, string> = {
      explain: 'Explain Topic step-by-step',
      summarize: 'Summarize study materials',
      examples: 'Provide practical real-world scenarios',
      questions: 'Ask check-your-understanding challenges',
      quiz_me: 'Start an active multiple choice test'
    };

    const text = `### 🎓 Ready to Learn!

Hello! I am your **AI Study Tutor**. Let's study efficiently and fast.

**Current Configurations:**
- 🛠️ **Study Mode**: \`${modeLabels[modeToUse] || modeToUse}\`
- 🎯 **Style**: \`${learningSupport.replace(/_/g, ' ')}\`

${contextStr}

How can I help you today? You can **type any question about any topic** directly, query specific parts of your syllabus, or select a Subject/Topic from the left sidebar to sync your saved study notes!`;

    const welcomeMsg: TutorChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text
    };

    // Update active session locally
    setSessions(prev => prev.map(s => {
      if (s.id === session.id) {
        return { ...s, messages: [welcomeMsg] };
      }
      return s;
    }));

    // Update local storage too
    const localSessStr = localStorage.getItem('student_os_tutor_sessions');
    if (localSessStr) {
      try {
        const parsed = JSON.parse(localSessStr);
        const updatedParsed = parsed.map((item: any) => {
          if (item.id === session.id) {
            return { ...item, messages: [welcomeMsg] };
          }
          return item;
        });
        localStorage.setItem('student_os_tutor_sessions', JSON.stringify(updatedParsed));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Send Message function
  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend || inputMessage;
    if (!rawText.trim()) return;

    // Check if an active session exists, if not, create one
    let targetSession = activeSession;
    let actualSessions = [...sessions];

    if (!targetSession) {
      const topicObj = topics.find(t => t.id === selectedTopicId);
      const subjectObj = subjects.find(s => s.id === selectedSubjectId);
      let titleStr = 'General Chat';
      if (topicObj) {
        titleStr = `${topicObj.title} Session`;
      } else if (subjectObj) {
        titleStr = `${subjectObj.name} Session`;
      }

      targetSession = {
        id: `session_${Date.now()}`,
        title: titleStr,
        timestamp: new Date().toISOString(),
        subjectId: selectedSubjectId || undefined,
        chapterId: selectedChapterId || undefined,
        topicId: selectedTopicId || undefined,
        messages: [],
        mode: currentMode,
        learningSupport
      };
      actualSessions = [targetSession, ...actualSessions];
      setSessions(actualSessions);
      setActiveSessionId(targetSession.id);
    }

    const userMsg: TutorChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toISOString(),
      text: rawText
    };

    const currentMsgHistory = [...targetSession.messages, userMsg];
    
    // Optimistic UI update
    const withUserMessage = actualSessions.map(s => {
      if (s.id === targetSession!.id) {
        return { ...s, messages: currentMsgHistory };
      }
      return s;
    });
    const assistantMsgId = `msg_assistant_${Date.now()}`;
    const assistantMsg: TutorChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      text: ''
    };

    const withEmptyAssistantMessage = withUserMessage.map(s => {
      if (s.id === targetSession!.id) {
        return { ...s, messages: [...currentMsgHistory, assistantMsg] };
      }
      return s;
    });

    // Optimistic UI update with empty bubble
    setSessions(withEmptyAssistantMessage);
    if (!textToSend) setInputMessage('');
    setShouldAutoScroll(true);
    setIsLoading(true);

    try {
      const contextPayload = getContextPayload();

      // Detect Netlify environment where HTTP streaming is not supported (buffers chunks and times out or returns 404 router fallback)
      const isNetlify = typeof window !== 'undefined' && (
        window.location.hostname.endsWith('.netlify.app') || 
        (!window.location.hostname.includes('.run.app') && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
      );

      // Send to server
      const response = await fetch(getApiUrl('/.netlify/functions/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMsgHistory,
          mode: currentMode,
          learningSupport,
          context: contextPayload,
          stream: !isNetlify
        })
      });

      // Detect content type as HTML (likely Netlify 404/SPA route fallback, or general server crash)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('API returned an HTML document instead of AI text response. (Redirected to Netlify 404/index fallback because CDN proxies do not support chunked chunk-by-chunk HTTP streaming).');
      }

      if (response.status === 404) {
        throw new Error('AI Tutor server endpoint not found (404). Please ensure the backend is active.');
      }

      if (response.status === 503) {
        throw new Error('AI Tutor client not initialized (503). Ensure process.env.GEMINI_API_KEY is configured under Secrets.');
      }

      if (response.status >= 500) {
        throw new Error(`AI Tutor internal server error (status ${response.status}).`);
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Request failed with status ${response.status}`);
      }

      // Immediately hide loader when response starts resolving
      setIsLoading(false);

      let finalText = '';

      if (contentType.includes('application/json')) {
        try {
          const parsed = await response.json();
          finalText = parsed.response || parsed.text || parsed.reply || parsed.message || JSON.stringify(parsed);
        } catch (jsonErr: any) {
          console.warn("Failed to parse JSON response content:", jsonErr);
          throw new Error(`Failed to parse AI response as JSON: ${jsonErr.message}`);
        }
      } else {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        let streamText = '';

        if (reader && !isNetlify) {
          let isFirstRealChunk = true;
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              
              if (isFirstRealChunk && chunk.trim()) {
                isFirstRealChunk = false;
                if (chunk.trim().startsWith('<')) {
                  throw new Error('Server response starts with an HTML tag (likely a static file redirect or router page).');
                }
              }

              streamText += chunk;

              // Update active session locally inside state with the stream so far
              setSessions(prevSessions => {
                return prevSessions.map(s => {
                  if (s.id === targetSession!.id) {
                    const messagesList = [...s.messages];
                    const assistIdx = messagesList.findIndex(m => m.id === assistantMsgId);
                    if (assistIdx !== -1) {
                      messagesList[assistIdx] = { ...messagesList[assistIdx], text: streamText };
                    } else {
                      messagesList.push({ ...assistantMsg, text: streamText });
                    }
                    return { ...s, messages: messagesList };
                  }
                  return s;
                });
              });
            }
          } catch (readErr) {
            console.warn("Error inside reader.read() loop. Falling back to text if empty. Error details:", readErr);
          }
          finalText = streamText;
        } else {
          // Direct non-stream text retrieval for Netlify or fallback environments
          finalText = await response.text();
        }

        if (finalText.trim().startsWith('<')) {
          throw new Error('Parsed response content starts with HTML. Response was likely a router view instead of raw text.');
        }

        if (finalText.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(finalText);
            finalText = parsed.response || parsed.text || parsed.reply || parsed.message || finalText;
          } catch (jsonErr) {
            console.warn("Response started with { but could not be parsed as JSON:", jsonErr);
          }
        }
      }

      // Update active session locally inside state with final text
      setSessions(prevSessions => {
        const updated = prevSessions.map(s => {
          if (s.id === targetSession!.id) {
            const messagesList = [...s.messages];
            const assistIdx = messagesList.findIndex(m => m.id === assistantMsgId);
            if (assistIdx !== -1) {
              messagesList[assistIdx] = { ...messagesList[assistIdx], text: finalText };
            } else {
              messagesList.push({ ...assistantMsg, text: finalText });
            }
            return { ...s, messages: messagesList };
          }
          return s;
        });
        saveSessions(updated);
        return updated;
      });
    } catch (e: any) {
      console.error(e);
      addToast(`Tutor could not respond: ${e.message}`, 'error');
      
      // Let user retry by keeping text
      if (!textToSend) setInputMessage(rawText);

      // Populate user friendly explanation in the bubble instead of leaving it empty or showing HTML
      const fallbackErrorMessage = `⚠️ **AI Tutor Service Unavailable**\n\nThere was an unexpected issue retrieving a response from Zyphora AI Tutor. This could be due to:\n- A temporary network outage\n- Stale host or workspace backend paths on Netlify\n- An unhandled internal server error (500)\n\n**Details:** ${e.message || "Unknown error"}\n\n*Please type your message again or click Retry. If you are running on Netlify, make sure the API routes are properly proxied to your active cloud server backend.*`;

      setSessions(prevSessions => {
        const updated = prevSessions.map(s => {
          if (s.id === targetSession!.id) {
            const messagesList = [...s.messages];
            const assistIdx = messagesList.findIndex(m => m.id === assistantMsgId);
            if (assistIdx !== -1) {
              messagesList[assistIdx] = { ...messagesList[assistIdx], text: fallbackErrorMessage };
            } else {
              messagesList.push({ ...assistantMsg, text: fallbackErrorMessage });
            }
            return { ...s, messages: messagesList };
          }
          return s;
        });
        saveSessions(updated);
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Prompt suggest selector chips triggers
  const handleSuggestionClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  // Delete session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    saveSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
    }
    addToast('Tutor session archive deleted', 'info');
  };

  // Clean all session records
  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to permanently clear all academic tutor chats? This cannot be undone.')) {
      saveSessions([]);
      setActiveSessionId(null);
      addToast('Tutor logs cleared completely.', 'info');
    }
  };

  // Get matching labels for currently selected filters
  const selectedSubjectName = subjects.find(s => s.id === selectedSubjectId)?.name || '';
  const selectedChapterName = chapters.find(c => c.id === selectedChapterId)?.title || '';
  const selectedTopicName = topics.find(t => t.id === selectedTopicId)?.title || '';

  // Mode and Tone settings UI choices
  const modesList = [
    { id: 'explain', label: 'Explain Topic', icon: Brain, color: 'text-indigo-400 bg-indigo-500/10' },
    { id: 'summarize', label: 'Summarize Notes', icon: FileText, color: 'text-emerald-400 bg-emerald-500/10' },
    { id: 'examples', label: 'Give Examples', icon: Star, color: 'text-amber-400 bg-amber-500/10' },
    { id: 'questions', label: 'Practice Prompts', icon: HelpCircle, color: 'text-sky-400 bg-sky-500/10' },
    { id: 'quiz_me', label: 'Quiz Me Mode', icon: Layers, color: 'text-rose-400 bg-rose-500/10' }
  ];

  const supportStylesList = [
    { id: 'step_by_step', label: 'Step-by-step', desc: 'Detailed progression paths' },
    { id: 'beginner', label: 'Beginner-friendly', desc: 'Simple terms & analogies' },
    { id: 'advanced', label: 'Advanced dive', desc: 'Rigorous nomenclature' },
    { id: 'real_world', label: 'Real-world focus', desc: 'Everyday applications' }
  ];

  // Suggestion prompts list depending on modes
  const getSuggestions = () => {
    const topicLabel = selectedTopicName || selectedSubjectName || '';
    
    // Fallback for general query if no context is selected
    if (!topicLabel) {
      switch (currentMode) {
        case 'explain':
          return [
            `Explain the difference between Active Recall and Spaced Repetition`,
            `How does the mechanism of action in mitochondria generate ATP?`,
            `Explain simple interest vs compound interest with an easy analogy.`
          ];
        case 'summarize':
          return [
            `Create a cheat sheet on basic SQL concepts`,
            `Summarize the key events of World War I in 5 bullets`,
            `Generate a summary of core principles of classical economics`
          ];
        case 'examples':
          return [
            `Give me 3 practical examples of Newton's laws in real life`,
            `What is a real-world scenario of a race condition in software development?`,
            `Give me everyday analogy examples of how inflation works`
          ];
        case 'questions':
          return [
            `Give me a study question to test my understanding of cells`,
            `Challenge me with a creative logic puzzle`,
            `Ask me a practice question about basic statistics`
          ];
        case 'quiz_me':
          return [
            `Start a quick general science multiple-choice quiz!`,
            `Quiz me on web development vocabulary`,
            `Test my knowledge with history true-or-false trivia`
          ];
        default:
          return [
            `What is the best technique to memorize historical dates?`,
            `Give me some tips on avoiding exam anxiety`,
            `Explain how the Feynman learning technique works`
          ];
      }
    }

    // Specific context chosen
    switch (currentMode) {
      case 'explain':
        return [
          `Can you explain the core concepts of ${topicLabel}?`,
          `Give me an analogy to understand ${topicLabel} clearly.`,
          `What are the most common misconceptions about ${topicLabel}?`
        ];
      case 'summarize':
        return [
          `Summarize the key takeaways for ${topicLabel}.`,
          `Create a quick bullet-point revision outline for ${topicLabel}.`,
          `Generate a cheat-sheet overview of ${topicLabel}.`
        ];
      case 'examples':
        return [
          `Give me 3 everyday practical examples of ${topicLabel}.`,
          `How is ${topicLabel} applied in modern technology or engineering?`,
          `Show me a scenario where failing to apply ${topicLabel} causes an issue.`
        ];
      case 'questions':
        return [
          `Give me a conceptual practice question about ${topicLabel}.`,
          `What is a typical exam question on ${topicLabel}?`,
          `Challenge me with a difficult discussion question.`
        ];
      case 'quiz_me':
        return [
          `Start a multiple-choice quiz about ${topicLabel}!`,
          `Quiz me on the definitions and vocabulary for ${topicLabel}.`,
          `Ask me a true-or-false query to test my memory on ${topicLabel}.`
        ];
      default:
        return [
          `What should I focus on when studying ${topicLabel}?`,
          `Can you connect ${topicLabel} with adjacent chapters?`,
          `How can I effectively memorize ${topicLabel}?`
        ];
    }
  };

  const suggestions = getSuggestions();

  return (
    <div id="ai-tutor-container" className="space-y-6 text-slate-200 animate-fade-in w-full max-w-full">
      
      {/* View Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2">
            <Brain className="text-indigo-400 w-6 h-6 shrink-0" />
            AI Study Tutor
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyze your custom study guides, ask questions, run interactive quizzes, and receive personalized explanations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sessions.length > 0 && (
            <button
              onClick={handleClearAllHistory}
              className="px-3 py-1.5 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 text-slate-350 hover:text-rose-400 rounded-xl text-xs transition duration-150 cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              <span>Clear Chats</span>
            </button>
          )}
          <button
            onClick={() => handleStartNewSession()}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-950/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Context, Mode selection, History (4 Cols) */}
        {!isSidebarCollapsed && (
          <div className="lg:col-span-4 space-y-6">
          
          {/* Section 1: Study Context selector */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/10">
              <BookOpen size={13} className="text-indigo-400" />
              Tutor Context Loader
            </h3>

            <div className="space-y-3 text-xs">
              {/* Subject Dropdown */}
              <div className="space-y-1">
                <label className="text-slate-400 font-medium font-sans">Active Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={e => {
                    setSelectedSubjectId(e.target.value);
                    setSelectedChapterId('');
                    setSelectedTopicId('');
                  }}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-505"
                >
                  <option value="">-- Select Subject (Optional) --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code ? `[${s.code}] ` : ''}{s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chapter Dropdown */}
              <div className="space-y-1">
                <label className="text-slate-400 font-medium font-sans">Syllabus Chapter</label>
                <select
                  value={selectedChapterId}
                  onChange={e => {
                    setSelectedChapterId(e.target.value);
                    setSelectedTopicId('');
                  }}
                  disabled={!selectedSubjectId}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-505 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">-- Select Chapter (Optional) --</option>
                  {filteredChapters.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              {/* Topic Dropdown */}
              <div className="space-y-1">
                <label className="text-slate-400 font-medium font-sans">Focus Topic</label>
                <select
                  value={selectedTopicId}
                  onChange={e => setSelectedTopicId(e.target.value)}
                  disabled={!selectedChapterId}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-505 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">-- Select Section / Topic (Optional) --</option>
                  {filteredTopics.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              {/* Include Study Notes Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-slate-250 block">Include Notes in Context</span>
                  <p className="text-[9px] text-slate-455 text-slate-400">Tutor reads matched saved summaries</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeStudyNotes} 
                    onChange={e => setIncludeStudyNotes(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-350 after:bg-slate-405 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Context Summary Indicators */}
              {includeStudyNotes && (selectedSubjectId || selectedChapterId || selectedTopicId) && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-400/20 text-slate-300 rounded-xl text-[10px] space-y-1">
                  <span className="font-semibold block text-indigo-305 flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-indigo-400" />
                    Target Context Loaded successfully:
                  </span>
                  <div className="space-y-0.5 pl-3 border-l border-indigo-500/20 text-slate-400">
                    {selectedSubjectName && <p>Subject: <strong className="text-white">{selectedSubjectName}</strong></p>}
                    {selectedChapterName && <p>Chapter: <strong className="text-white">{selectedChapterName}</strong></p>}
                    {selectedTopicName && <p>Topic: <strong className="text-white">{selectedTopicName}</strong></p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Study Modes */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/10">
              <Sparkles size={13} className="text-indigo-400" />
              Active Study Modes
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {modesList.map(m => {
                const isSelected = currentMode === m.id;
                const IconComponent = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setCurrentMode(m.id as any);
                      // If active session mode changes, update it
                      if (activeSession) {
                        const updated = sessions.map(s => {
                          if (s.id === activeSession.id) {
                            return { ...s, mode: m.id as any };
                          }
                          return s;
                        });
                        saveSessions(updated);
                      }
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border transition text-left cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-600/20 border-indigo-500 hover:bg-indigo-600/30' 
                        : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg border border-white/5 ${m.color}`}>
                        <IconComponent size={14} />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white block">{m.label}</span>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {m.id === 'explain' && 'Interactive guided explanations'}
                          {m.id === 'summarize' && 'Distill key concepts into notes'}
                          {m.id === 'examples' && 'Vivid world analogies'}
                          {m.id === 'questions' && 'Active learning conceptual testing'}
                          {m.id === 'quiz_me' && 'Dynamic multiple choice test'}
                        </p>
                      </div>
                    </div>
                    {isSelected && <div className="h-2 w-2 rounded-full bg-indigo-400 shadow-md shadow-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Learning Support Tones */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3.5 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-1.5 border-b border-white/10">
              <Info size={13} className="text-indigo-400" />
              Learning Support Style
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {supportStylesList.map(s => {
                const isSelected = learningSupport === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setLearningSupport(s.id as any);
                      if (activeSession) {
                        const updated = sessions.map(item => {
                          if (item.id === activeSession.id) {
                            return { ...item, learningSupport: s.id as any };
                          }
                          return item;
                        });
                        saveSessions(updated);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                      isSelected 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow font-semibold' 
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <span className="text-[11px] leading-tight block">{s.label}</span>
                    <span className="text-[8px] text-slate-400 font-normal leading-none block">{s.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Chat History sessions list */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <MessageSquare size={13} className="text-indigo-400" />
                Session History
              </h3>
              <span className="text-[9px] font-mono text-slate-450 bg-white/5 px-2 py-0.5 rounded-md text-slate-400">
                {sessions.length} archived
              </span>
            </div>

            {sessions.length === 0 ? (
              <div className="py-6 text-center text-slate-400 space-y-2 text-xs">
                <MessageSquare className="w-8 h-8 text-slate-650 text-slate-600 mx-auto animate-pulse" />
                <p>No study sessions saved yet.</p>
                <button
                  onClick={() => handleStartNewSession()}
                  className="px-3 py-1 bg-indigo-605 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-[10px] font-medium transition cursor-pointer"
                >
                  Start First Session
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {sessions.map(s => {
                  const isSelected = s.id === activeSessionId;
                  const chatModeIcon = modesList.find(m => m.id === s.mode)?.icon || MessageSquare;
                  const Icon = chatModeIcon;
                  return (
                    <div
                      key={s.id}
                      onClick={() => selectSession(s)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition text-left cursor-pointer group text-xs ${
                        isSelected 
                          ? 'bg-indigo-600/10 border-indigo-500/50' 
                          : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`p-1 rounded-md ${isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-slate-400'}`}>
                          <Icon size={12} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-slate-200 block truncate group-hover:text-white transition">
                            {s.title}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                            {new Date(s.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:text-rose-400 text-slate-450 hover:bg-rose-500/10 rounded transition cursor-pointer ml-1 shrink-0"
                        title="Delete session"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

        {/* Right Column: Chat interface */}
        <div 
          ref={chatInterfaceRef}
          className={`${isSidebarCollapsed ? 'lg:col-span-12 max-w-4xl mx-auto w-full' : 'lg:col-span-8'} flex flex-col space-y-4`}
        >
          
          {/* Active Title bar */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-white/5 to-indigo-500/5">
            <div className="flex items-center gap-3">
              {/* Sidebar toggle button (Gemini Style) */}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-slate-300 hover:text-indigo-400 transition cursor-pointer flex items-center justify-center shrink-0"
                title={isSidebarCollapsed ? "Show Study Context & Settings" : "Hide Study Context & Settings"}
              >
                <BookOpen size={14} className={`transition-all duration-300 ${isSidebarCollapsed ? 'opacity-60' : 'text-indigo-400'}`} />
              </button>

              <div className="p-3 bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 rounded-xl shrink-0">
                <Brain className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-indigo-305 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                  {currentMode === 'explain' && 'Mode: Explain'}
                  {currentMode === 'summarize' && 'Mode: Summarize'}
                  {currentMode === 'examples' && 'Mode: Examples'}
                  {currentMode === 'questions' && 'Mode: Practice QA'}
                  {currentMode === 'quiz_me' && 'Mode: Interactive Quiz'}
                </span>
                <h3 className="text-sm font-bold text-white truncate mt-1">
                  {activeSession ? activeSession.title : 'Ready to start study conversation...'}
                </h3>
              </div>
            </div>

            {activeSession && (
              <div className="flex items-center gap-2 border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0 shrink-0">
                <span className="text-[10px] font-mono text-slate-400 text-slate-350 bg-white/5 px-2 py-1 rounded-lg flex items-center gap-1.5 border border-white/5">
                  <Clock size={11} className="text-slate-400" />
                  {activeSession.messages.length} messages
                </span>
                <span className="text-[10px] font-mono text-slate-400 text-slate-350 bg-indigo-500/10 px-2 py-1 rounded-lg flex items-center gap-1.5 border border-indigo-500/25">
                  <Star size={11} className="text-indigo-400 fill-indigo-400/30" />
                  {learningSupport === 'step_by_step' && 'Steps'}
                  {learningSupport === 'beginner' && 'Concepts'}
                  {learningSupport === 'advanced' && 'Rigoro'}
                  {learningSupport === 'real_world' && 'RealWorld'}
                </span>
              </div>
            )}
          </div>

          {/* Message Thread Panel */}
          <div className="bg-white/5 border border-white/10 rounded-3xl shadow-xl flex flex-col h-[580px] overflow-hidden justify-between relative">
            
            {/* Scrollable chat flow */}
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scroll-smooth"
            >
              {!activeSession || activeSession.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto p-4">
                  <div className="h-14 w-14 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 flex items-center justify-center animate-bounce">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-white">Ask your AI Study Buddy Anything!</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      You can type any general question in the typing box below to start chatting instantly, or optionally load a specific Topic from the sidebar to sync your saved study materials.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 w-full pt-2">
                    <button
                      onClick={() => handleStartNewSession('explain')}
                      className="py-2 px-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-400/35 text-xs text-slate-300 font-semibold rounded-xl text-left flex items-center justify-between cursor-pointer group animate-pulse"
                    >
                      <span>{selectedTopicName ? `Explain "${selectedTopicName}" step-by-step` : "Start general study tutorial &rarr;"}</span>
                      <ArrowRight size={13} className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </button>
                    <button
                      onClick={() => handleStartNewSession('quiz_me')}
                      className="py-2 px-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-400/35 text-xs text-slate-300 font-semibold rounded-xl text-left flex items-center justify-between cursor-pointer group"
                    >
                      <span>{selectedTopicName ? `Quiz me on "${selectedTopicName}"` : "Interactive Study Quiz Game &rarr;"}</span>
                      <ArrowRight size={13} className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSession.messages.map((m) => {
                    const isUser = m.sender === 'user';
                    return (
                      <div 
                        key={m.id} 
                        className={`flex items-start gap-3.5 max-w-full sm:max-w-[90%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                      >
                        {/* Avatar */}
                        <div className={`p-1.5 sm:p-2 rounded-xl shrink-0 border text-xs flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 font-bold transition-all duration-200 ${
                          isUser 
                            ? 'bg-gradient-to-tr from-indigo-700 to-indigo-500 border-indigo-400 text-white shadow-md' 
                            : 'bg-indigo-950/40 border-indigo-500/20 text-indigo-400 shadow-md'
                        }`}>
                          {isUser ? <User size={13} className="text-indigo-200" /> : <Sparkles size={13} className="text-indigo-400 animate-pulse" />}
                        </div>

                        {/* Content bubble */}
                        <div className={`p-4 sm:p-5 rounded-3xl relative shadow-md border transition-all duration-200 ${
                          isUser 
                            ? 'bg-slate-800/90 border-white/10 text-slate-100 rounded-tr-none hover:border-white/20' 
                            : 'bg-indigo-500/[0.03] border-indigo-500/15 text-slate-200 rounded-tl-none leading-relaxed hover:border-indigo-500/25'
                        }`}>
                          <div className="text-[10px] text-indigo-400/80 font-mono mb-1.5 block select-none">
                            {isUser ? 'Student' : 'Tutor'} • {new Date(m.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </div>
                          
                          {isUser ? (
                            <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{m.text}</p>
                          ) : m.text === "" ? (
                            <div className="flex flex-col space-y-2.5 py-1">
                              <div className="flex items-center gap-1.5 text-xs text-indigo-450 text-indigo-400 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping shrink-0" />
                                <span className="animate-pulse">Thinking...</span>
                              </div>
                              <div className="space-y-1.5 w-full min-w-[200px]">
                                <div className="h-2 bg-indigo-500/10 rounded-full animate-pulse w-full" />
                                <div className="h-2 bg-indigo-500/10 rounded-full animate-pulse w-11/12" />
                                <div className="h-2 bg-indigo-500/10 rounded-full animate-pulse w-2/3" />
                              </div>
                            </div>
                          ) : (
                            <MarkdownRenderer text={m.text} />
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Hint Suggestion Chips */}
            {activeSession && activeSession.messages.length > 0 && !isLoading && (
              <div className="px-4 py-2 border-t border-white/10 flex items-center gap-2 overflow-x-auto select-none no-scrollbar bg-slate-950/20 shrink-0">
                <span className="text-[9px] font-mono uppercase text-indigo-400 font-bold shrink-0">Prompts:</span>
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(s)}
                    className="text-[10px] text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 hover:border-indigo-505/40 border border-white/10 rounded-lg px-2.5 py-1 whitespace-nowrap transition cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Input controls form - Gemini Pill design */}
          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-2 pl-4 shadow-xl flex gap-3 items-center backdrop-blur-md focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/10 transition-all duration-200">
            <textarea
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
              rows={1}
              placeholder={isLoading ? "Please wait for response..." : "Ask your AI tutor anything..."}
              className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-0 resize-none py-2 h-10 min-h-[40px] max-h-[120px] disabled:opacity-60 leading-5"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputMessage.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-full transition shadow-md shrink-0 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center h-9 w-9"
              title="Send message"
            >
              <Send size={13} className={isLoading ? "animate-pulse" : ""} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
