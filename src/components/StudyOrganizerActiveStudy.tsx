import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, RotateCcw, Check, X, HelpCircle, 
  Layers, BookOpen, AlertCircle, Sparkles, Award
} from 'lucide-react';
import { RecallQuestion, RecallFlashcard, RecallQuiz, QuizQuestion } from '../types';

interface StudyOrganizerActiveStudyProps {
  type: 'flashcards' | 'quiz' | 'recall';
  material: {
    questions?: RecallQuestion[];
    flashcards?: RecallFlashcard[];
    quizzes?: RecallQuiz[];
  };
  noteTitle: string;
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export default function StudyOrganizerActiveStudy({ 
  type, 
  material, 
  noteTitle,
  addToast 
}: StudyOrganizerActiveStudyProps) {
  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const [quizSelectedAnswers, setQuizSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Active Recall questions state
  const [expandedRecallQs, setExpandedRecallQs] = useState<Record<string, boolean>>({});

  const questions = material.questions || [];
  const flashcards = material.flashcards || [];
  const quizzes = material.quizzes || [];
  const activeQuiz = quizzes[0];

  // Reset helper
  const handleResetQuiz = () => {
    setQuizSelectedAnswers({});
    setQuizSubmitted(false);
    addToast('Quiz restarted! Best of luck! 🎓', 'info');
  };

  const handleSelectQuizAnswer = (qId: string, optIdx: number) => {
    if (quizSubmitted) return;
    setQuizSelectedAnswers(prev => ({
      ...prev,
      [qId]: optIdx
    }));
  };

  if (type === 'flashcards') {
    if (flashcards.length === 0) {
      return (
        <div className="text-center py-12 bg-white/2 border border-white/5 rounded-2xl">
          <Layers className="mx-auto w-10 h-10 text-slate-500 animate-pulse mb-3" />
          <h4 className="text-sm font-semibold text-white">No Flashcards Generated Yet</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Use the "Topic Note Editor" tab to compile summaries, and click "Generate Flashcards" below!
          </p>
        </div>
      );
    }

    const currentCard = flashcards[currentCardIndex];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            Card {currentCardIndex + 1} of {flashcards.length}
          </span>
          <button 
            onClick={() => {
              setCurrentCardIndex(0);
              setIsFlipped(false);
            }}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={10} />
            <span>Reset Slide</span>
          </button>
        </div>

        {/* 3D-like flip card */}
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          className="h-48 w-full relative cursor-pointer group perspective"
        >
          <div className={`w-full h-full duration-500 preserve-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
            {/* Front Side */}
            <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-white/10 group-hover:border-indigo-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">FRONT SIDE</span>
                <p className="text-sm font-medium text-white italic mt-4 pre-wrap select-none leading-relaxed">
                  "{currentCard.front}"
                </p>
              </div>
              <p className="text-[10px] text-slate-400 select-none text-center">
                Click Card to Reveal Explanation &rarr;
              </p>
            </div>

            {/* Back Side */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-slate-950 to-indigo-950/60 border border-indigo-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">RECALL REVEALED</span>
                <p className="text-xs text-slate-200 mt-4 leading-relaxed pre-wrap select-none">
                  {currentCard.back}
                </p>
              </div>
              <p className="text-[10px] text-indigo-400 select-none text-center font-semibold">
                Click Card to flip back front &larr;
              </p>
            </div>
          </div>
        </div>

        {/* Card navigation controls */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            disabled={currentCardIndex === 0}
            onClick={() => {
              setIsFlipped(false);
              setCurrentCardIndex(prev => prev - 1);
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-white/5 border border-white/5 text-slate-300 hover:bg-white/8 hover:text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-1"
          >
            <ChevronLeft size={14} />
            <span>Previous</span>
          </button>
          
          <button
            disabled={currentCardIndex === flashcards.length - 1}
            onClick={() => {
              setIsFlipped(false);
              setCurrentCardIndex(prev => prev + 1);
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/30 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-1"
          >
            <span>Next Slide</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  if (type === 'quiz') {
    if (!activeQuiz || !activeQuiz.questions || activeQuiz.questions.length === 0) {
      return (
        <div className="text-center py-12 bg-white/2 border border-white/5 rounded-2xl">
          <BookOpen className="mx-auto w-10 h-10 text-slate-500 animate-pulse mb-3" />
          <h4 className="text-sm font-semibold text-white">No Topic Quiz Synthesized</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Use the "Topic Note Editor" tab to write academic summaries, then trigger "Synthesize Quiz" below!
          </p>
        </div>
      );
    }

    // Calculating current score if submitted
    const totalQs = activeQuiz.questions.length;
    let correctAnswersCount = 0;
    if (quizSubmitted) {
      activeQuiz.questions.forEach((q) => {
        if (quizSelectedAnswers[q.id] === q.correctAnswerIndex) {
          correctAnswersCount += 1;
        }
      });
    }

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide">{activeQuiz.title}</h4>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">Active comprehension assessment check</p>
          </div>
          <button
            onClick={handleResetQuiz}
            className="px-2.5 py-1 bg-white/5 border border-white/5 text-[10px] text-slate-300 font-semibold hover:bg-white/8 rounded-lg cursor-pointer transition flex items-center gap-1 shrink-0"
          >
            <RotateCcw size={10} />
            <span>Reset Score</span>
          </button>
        </div>

        <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
          {activeQuiz.questions.map((q, qIdx) => {
            const isCorrect = quizSelectedAnswers[q.id] === q.correctAnswerIndex;
            const chosen = quizSelectedAnswers[q.id];

            return (
              <div 
                key={q.id} 
                className={`p-4 rounded-xl border transition ${
                  quizSubmitted 
                    ? isCorrect 
                      ? 'bg-emerald-500/10 border-emerald-500/20' 
                      : 'bg-rose-500/10 border-rose-500/20'
                    : 'bg-slate-900/40 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400 mt-0.5">Q{qIdx + 1}.</span>
                  <p className="text-xs font-medium text-slate-200 leading-relaxed font-sans">{q.question}</p>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = chosen === optIdx;
                    const isCorrectOption = optIdx === q.correctAnswerIndex;

                    let buttonStyle = "bg-slate-900/60 border border-white/5 hover:border-indigo-500/45 text-slate-300";
                    if (isSelected) {
                      buttonStyle = "bg-indigo-600/30 border-indigo-500/80 text-white font-semibold shadow-indigo-600/10 shadow";
                    }

                    if (quizSubmitted) {
                      if (isCorrectOption) {
                        buttonStyle = "bg-emerald-600/30 border-emerald-500 text-emerald-100 font-semibold";
                      } else if (isSelected) {
                        buttonStyle = "bg-rose-600/30 border-rose-500 text-rose-100";
                      } else {
                        buttonStyle = "bg-slate-900/30 border-white/5 opacity-55 text-slate-400";
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={quizSubmitted}
                        onClick={() => handleSelectQuizAnswer(q.id, optIdx)}
                        className={`p-3 text-left rounded-lg text-xs leading-5 transition text-balance cursor-pointer flex items-center justify-between ${buttonStyle}`}
                      >
                        <span>{opt}</span>
                        {quizSubmitted && isCorrectOption && (
                          <Check size={12} className="text-emerald-400 shrink-0 ml-1.5" />
                        )}
                        {quizSubmitted && isSelected && !isCorrectOption && (
                          <X size={12} className="text-rose-455 shrink-0 ml-1.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scorecard panel or submit trigger */}
        {!quizSubmitted ? (
          <button
            onClick={() => {
              // Verify all answered
              const answeredCount = Object.keys(quizSelectedAnswers).length;
              if (answeredCount < totalQs) {
                addToast(`Answer all ${totalQs} questions first! (Currently done ${answeredCount})`, 'warning');
                return;
              }
              setQuizSubmitted(true);
              addToast('Quiz score calculated successfully! Review feedback below. 🎓', 'success');
            }}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border border-indigo-400/20 text-white text-xs font-semibold rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <BookOpen size={14} />
            <span>Grade Quiz Scorecard</span>
          </button>
        ) : (
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Award size={20} />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">Assessment Result</h5>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Accuracy Score: <span className="font-mono font-bold text-indigo-300">{Math.round((correctAnswersCount / totalQs) * 100)}%</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-between sm:justify-start">
              <span className="text-xs text-slate-300 font-mono">
                {correctAnswersCount} / {totalQs} Correct
              </span>
              <button
                onClick={handleResetQuiz}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Retake Exam
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (type === 'recall') {
    if (questions.length === 0) {
      return (
        <div className="text-center py-12 bg-white/2 border border-white/5 rounded-2xl">
          <HelpCircle className="mx-auto w-10 h-10 text-slate-500 animate-pulse mb-3" />
          <h4 className="text-sm font-semibold text-white">No Active Recall Questions</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Use the "Topic Note Editor" tab to save high-yielding review materials, then create a memory review deck!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            {questions.length} active questions available
          </span>
          <button
            onClick={() => {
              setExpandedRecallQs({});
              addToast('All answers collapsed.', 'info');
            }}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono cursor-pointer"
          >
            Collapse All
          </button>
        </div>

        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
          {questions.map((q, idx) => {
            const isExpanded = expandedRecallQs[q.id];

            return (
              <div 
                key={q.id}
                className="bg-slate-900/40 hover:bg-slate-905 border border-white/5 rounded-xl overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => {
                    setExpandedRecallQs(prev => ({
                      ...prev,
                      [q.id]: !prev[q.id]
                    }));
                  }}
                  className="w-full text-left p-4 flex items-start gap-3 focus:outline-none cursor-pointer"
                >
                  <span className="text-xs font-mono font-bold text-indigo-400 mt-0.5">
                    {idx + 1}.
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-200 leading-relaxed font-sans">
                      {q.question}
                    </p>
                    <span className="text-[9px] font-mono mt-1 text-indigo-400 block font-semibold hover:underline">
                      {isExpanded ? 'Hide Answer' : 'Reveal Answer &rarr;'}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1.5 border-t border-white/5 bg-slate-950/40 text-xs text-slate-300 leading-relaxed font-sans pre-wrap select-text border-l-2 border-l-indigo-500">
                    {q.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
