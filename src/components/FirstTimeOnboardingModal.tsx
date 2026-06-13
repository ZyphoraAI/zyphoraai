import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Brain, Clock, ChevronRight, Check, BookOpen, Layers, GraduationCap } from 'lucide-react';
import { Subject } from '../types';

interface FirstTimeOnboardingModalProps {
  isOpen: boolean;
  onComplete: (firstSubject: Subject) => void;
  onSkip: () => void;
}

export default function FirstTimeOnboardingModal({ isOpen, onComplete, onSkip }: FirstTimeOnboardingModalProps) {
  const [step, setStep] = useState<number>(1);
  const [subjectName, setSubjectName] = useState<string>('');
  const [subjectCode, setSubjectCode] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('bg-indigo-550');

  const colorOptions = [
    { name: 'Indigo Aura', class: 'bg-indigo-550', value: 'bg-indigo-500' },
    { name: 'Emerald Sage', class: 'bg-emerald-500', value: 'bg-emerald-500' },
    { name: 'Cosmic Coral', class: 'bg-pink-500', value: 'bg-pink-500' },
    { name: 'Vapor Wave', class: 'bg-sky-400', value: 'bg-sky-450' },
    { name: 'Neon Mint', class: 'bg-teal-500', value: 'bg-teal-550' },
    { name: 'Atomic Rose', class: 'bg-rose-500', value: 'bg-rose-500' },
  ];

  if (!isOpen) return null;

  const handleNextStep = () => {
    setStep((prev) => prev + 1);
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;

    const newSubject: Subject = {
      id: `sub_${Date.now()}`,
      name: subjectName.trim(),
      code: subjectCode.trim() || undefined,
      color: selectedColor,
    };

    onComplete(newSubject);
  };

  return (
    <div id="first-time-onboarding-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <AnimatePresence mode="wait">
        <motion.div
          key={`onboarding-step-${step}`}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -15 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-lg bg-slate-900/90 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Neon fluid background effects */}
          <div className="absolute top-0 right-0 w-[120px] h-[120px] rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[120px] h-[120px] rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />

          {/* Stepper progress tabs */}
          <div className="flex items-center gap-1.5 mb-6">
            <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-indigo-500' : 'bg-white/10'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-indigo-500' : 'bg-white/10'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step >= 3 ? 'bg-indigo-500' : 'bg-white/10'}`} />
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <div className="p-3 bg-gradient-to-tr from-indigo-600 to-sky-400 text-white rounded-2xl w-fit mx-auto shadow-lg shadow-indigo-500/20">
                  <GraduationCap size={28} />
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
                  Welcome to Zyphora
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto font-sans leading-relaxed">
                  Your local-first, intelligence-guided study workstation. Let's briefly review how you can study cleaner and score higher.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-white/5 bg-white/[0.02]">
                  <Brain className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">AI study assistant helper</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Paste guidelines, class notes, or lectures. Our integrated backend outlines curriculum chapters and compiles flashcard/quiz cards automatically.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-white/5 bg-white/[0.02]">
                  <Layers className="w-5 h-5 text-sky-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">Spaced Repetition retrieval loops</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Ditch passive highlights. Test your memory with flashcard carousel decks and let our automated clock schedule repetitions to target forgetfulness.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-3 px-4 font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Continue Study Guide</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit mx-auto">
                  <Clock size={28} />
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
                  Organized Calendar & Planners
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto font-sans leading-relaxed">
                  Plan sessions and track exam dates with zero noise. Zyphora encapsulates full scheduling control offline.
                </p>
              </div>

              <div className="space-y-3 font-sans text-xs text-slate-400">
                <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01] flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span>Timetables for weekly recurring classes</span>
                </div>
                <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01] flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Countdowns and priorities for exams and test marks</span>
                </div>
                <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01] flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                  <span>Interactive streak monitor that rewards days you log study sessions</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-3 px-4 font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Setup Course Plan</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleFinish} className="space-y-6">
              <div className="space-y-2 text-center">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl w-fit mx-auto">
                  <Sparkles size={28} className="animate-pulse" />
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
                  Create Your First Course Plan
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto font-sans leading-relaxed">
                  Kickstart your academic space! Give your subject folder a clean name and a unique color palette to organize.
                </p>
              </div>

              <div className="space-y-4 font-sans text-left">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider font-mono text-slate-400 font-bold">
                    Course Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="e.g. Molecular Biology"
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[11px] uppercase tracking-wider font-mono text-slate-400 font-bold">
                      Subject Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={subjectCode}
                      onChange={(e) => setSubjectCode(e.target.value)}
                      placeholder="e.g. BIO-201"
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[11px] uppercase tracking-wider font-mono text-slate-400 font-bold">
                      Tag Color Palette
                    </label>
                    <div className="grid grid-cols-6 gap-2 pt-1.5">
                      {colorOptions.map((opt) => (
                        <button
                          key={opt.class}
                          type="button"
                          onClick={() => setSelectedColor(opt.value)}
                          className={`w-6.5 h-6.5 rounded-full flex items-center justify-center border hover:scale-110 transition cursor-pointer ${opt.class} ${
                            selectedColor === opt.value ? 'border-white scale-110' : 'border-transparent'
                          }`}
                          title={opt.name}
                        >
                          {selectedColor === opt.value && <Check size={11} className="text-white drop-shadow" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onSkip}
                  className="w-full sm:w-auto px-5 py-3 text-xs font-semibold text-slate-400 hover:text-white transition order-2 sm:order-1 cursor-pointer"
                >
                  Skip for Now
                </button>

                <button
                  type="submit"
                  disabled={!subjectName.trim()}
                  className="w-full sm:flex-1 py-3 px-5 font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-xl transition shadow flex items-center justify-center gap-1.5 order-1 sm:order-2 cursor-pointer"
                >
                  <span>Build Subject Workspace</span>
                  <Check size={14} />
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
