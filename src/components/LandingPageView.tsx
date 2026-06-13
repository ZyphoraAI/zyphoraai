import { motion } from 'motion/react';
import { 
  GraduationCap, ArrowRight, Brain, Layers, BookOpen, 
  TrendingUp, Calendar, FileText, CheckCircle2, ChevronDown, Sparkles
} from 'lucide-react';

interface LandingPageViewProps {
  onGetStarted: () => void;
}

export default function LandingPageView({ onGetStarted }: LandingPageViewProps) {
  
  const handleScrollToFeatures = () => {
    const targetElement = document.getElementById('zyphora-features-section');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    {
      id: 'feat-ai-tutor',
      icon: <Brain className="w-6 h-6 text-indigo-400" />,
      title: 'AI Tutor Support',
      desc: 'Ask complex academic questions, dissect hard readings, and receive detailed semantic explanations custom-tailored to your learning pace.'
    },
    {
      id: 'feat-recall',
      icon: <CheckCircle2 className="w-6 h-6 text-sky-400" />,
      title: 'Active Recall Hub',
      desc: 'Break standard reading habits by prompting active responses. Keep your brain constantly testing itself rather than passively re-reading notes.'
    },
    {
      id: 'feat-flashcards',
      icon: <Layers className="w-6 h-6 text-violet-400" />,
      title: 'Intelligent Flashcards',
      desc: 'Formulate dynamic flashcard decks complete with custom 3D flipping, bento catalog structures, and smart spaced repetition schedules.'
    },
    {
      id: 'feat-quizzes',
      icon: <BookOpen className="w-6 h-6 text-emerald-400" />,
      title: 'Interactive Quizzes',
      desc: 'Assess and reinforce subject knowledge with auto-generated comprehension quizzes. Take real-time challenges with standard lists or focused views.'
    },
    {
      id: 'feat-tracking',
      icon: <TrendingUp className="w-6 h-6 text-pink-400" />,
      title: 'Progress Tracking',
      desc: 'Monitor courses, map out session metrics, log hours of focused study, and elevate your personal daily streaks to stay motivated.'
    },
    {
      id: 'feat-planning',
      icon: <Calendar className="w-6 h-6 text-amber-400" />,
      title: 'Advanced Study Planning',
      desc: 'Schedule lectures, organize class timetables, map out upcoming exam milestones, and construct perfect weekly study sessions.'
    }
  ];

  const steps = [
    {
      id: 'step-add-notes',
      number: '01',
      title: 'Structure & Import',
      desc: 'Easily organize subjects and course modules. Paste your study materials, lectures, or text files directly into your personal Sandbox.'
    },
    {
      id: 'step-generate',
      number: '02',
      title: 'Synthesize Materials',
      desc: 'Our integrated intelligence automatically extracts key highlights, structuring custom Active Recall questions, flashcards, and quizzes.'
    },
    {
      id: 'step-learn',
      number: '03',
      title: 'Active Learning Node',
      desc: 'Engage with carousel memory cards, rate your comprehension levels, ask our AI Tutor for clarifications, and take interactive testing quizzes.'
    },
    {
      id: 'step-track',
      number: '04',
      title: 'Spaced Revision Loops',
      desc: 'Log and monitor key study logs. Our Smart Spaced Repetition engine schedules timed revisions so you review content right when your memory needs it.'
    }
  ];

  return (
    <div id="zyphora-landing-wrapper" className="min-h-screen text-slate-100 font-sans relative overflow-x-hidden flex flex-col justify-between">
      
      {/* Dynamic ambient glowing space blobs */}
      <div id="landing-ambient-glow-1" className="absolute top-[10%] left-[10%] w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none z-0" />
      <div id="landing-ambient-glow-2" className="absolute top-[40%] right-[10%] w-[400px] h-[400px] rounded-full bg-blue-500/15 blur-[150px] pointer-events-none z-0" />
      <div id="landing-ambient-glow-3" className="absolute bottom-[15%] left-[20%] w-[450px] h-[450px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none z-0" />

      {/* Header Bar */}
      <header id="zyphora-landing-header" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between border-b border-white/5 relative z-10">
        <div id="landing-logo-container" className="flex items-center gap-2.5">
          <div className="p-2 sm:p-2.5 bg-gradient-to-tr from-indigo-600 to-sky-450 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <GraduationCap className="h-5.5 w-5.5 text-white" />
          </div>
          <span className="font-display font-black text-lg sm:text-xl tracking-tight text-white bg-clip-text">
            Zyphora
          </span>
        </div>
        
        <button
          id="btn-landing-top-cta"
          onClick={onGetStarted}
          className="px-4.5 py-2 text-xs sm:text-sm font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 rounded-xl transition-all shadow duration-250 cursor-pointer flex items-center gap-1.5"
        >
          <span>Launch App</span>
          <ArrowRight size={14} className="text-indigo-400" />
        </button>
      </header>

      {/* Hero Section */}
      <section id="zyphora-hero-section" className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Tagline */}
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold text-indigo-300">
            <Sparkles size={12} className="text-indigo-400 animate-pulse" />
            <span>The Ultimate Intelligent Academic Suite</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl font-display font-black tracking-tight text-white leading-[1.1] max-w-4xl mx-auto">
            Study Smarter with <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">AI</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-slate-300 font-sans max-w-2xl mx-auto leading-relaxed">
            Zyphora transforms passive learning into structured, active mastery. Connect your notes, auto-synthesize flashcards, take AI-powered quizzes, ask our interactive tutor, and manage your schedule seamlessly.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              id="btn-landing-hero-get-started"
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl shadow-[0_4px_25px_rgba(79,70,229,0.35)] hover:shadow-[0_4px_30px_rgba(79,70,229,0.5)] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
            >
              <span>Get Started</span>
              <ArrowRight size={16} />
            </button>
            <button
              id="btn-landing-hero-learn-more"
              onClick={handleScrollToFeatures}
              className="w-full sm:w-auto px-8 py-4 text-sm font-semibold text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 hover:border-slate-500/40 rounded-2xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Learn More</span>
              <ChevronDown size={16} className="text-slate-400" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features Grid Section */}
      <section id="zyphora-features-section" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-indigo-400">Features Integrated</h2>
          <h3 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">
            Engineered for Academic High-Performance
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 font-sans max-w-xl mx-auto leading-relaxed">
            Leave static highlighters behind. Elevate your GPA through active testing science and continuous AI evaluation modules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat) => (
            <div
              key={feat.id}
              id={feat.id}
              className="bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 backdrop-blur-md p-6.5 rounded-2xl transition-all duration-300 flex flex-col gap-4 group hover:bg-white/[0.04] hover:-translate-y-1 transform"
            >
              <div className="p-3 bg-white/5 rounded-xl w-fit group-hover:scale-110 transition-transform duration-350">
                {feat.icon}
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="text-sm font-bold text-white font-sans">{feat.title}</h4>
                <p className="text-xs text-slate-350 font-sans leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="zyphora-how-it-works-section" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-emerald-400">The Workflow</h2>
          <h3 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">
            How Zyphora Guides You to Mastery
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 font-sans max-w-xl mx-auto leading-relaxed">
            Follow a proven cognitive sequence from unstructured lecture notes to robust memory retrieval patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Subtle connecting lane behind cards on large screens */}
          <div className="hidden lg:block absolute top-[44px] left-[5%] right-[5%] h-0.5 bg-white/5 z-0" />
          
          {steps.map((step, idx) => (
            <div
              key={step.id}
              id={step.id}
              className="bg-slate-950/40 border border-white/5 backdrop-blur-sm p-6 rounded-2xl flex flex-col gap-4 relative z-10 group hover:border-indigo-500/20 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-400 tracking-wider">STEP {step.number}</span>
                <span className="text-2xl font-black font-display text-white/5 group-hover:text-white/10 transition-colors">
                  {step.number}
                </span>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  {idx === 0 && <FileText className="w-4 h-4 text-indigo-400" />}
                  {idx === 1 && <Sparkles className="w-4 h-4 text-emerald-300" />}
                  {idx === 2 && <Brain className="w-4 h-4 text-sky-400" />}
                  {idx === 3 && <TrendingUp className="w-4 h-4 text-pink-400" />}
                  <span>{step.title}</span>
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-400 font-sans leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust banner/Final CTA */}
      <section id="zyphora-final-cta-section" className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mb-16">
        <div className="bg-gradient-to-tr from-indigo-950/45 to-slate-900/40 border border-indigo-500/20 backdrop-blur-md p-8 sm:p-12 rounded-3xl text-center space-y-6 shadow-xl relative overflow-hidden">
          {/* Small background abstract light */}
          <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          
          <div className="space-y-2">
            <h3 className="text-xl sm:text-3xl font-display font-bold text-white tracking-tight">
              Ready to Upgrade Your Study OS?
            </h3>
            <p className="text-xs sm:text-sm text-indigo-200/80 max-w-xl mx-auto font-sans leading-relaxed">
              Launch Zyphora and experience the power of custom active recall, direct flashcards carousel, structured examinations planning, and offline-safe local backups.
            </p>
          </div>
          
          <button
            id="btn-landing-final-get-started"
            onClick={onGetStarted}
            className="px-8 py-3.5 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer max-w-xs mx-auto flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <span>Launch Academic Workspace</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

    </div>
  );
}
