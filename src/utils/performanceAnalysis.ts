import { SavedNote, Subject, Chapter, Topic, RevisionItem, RevisionLog } from '../types';

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  noteId: string;
  score: number; // 0-100
  correctCount: number;
  totalCount: number;
  timestamp: string; // ISO string
}

export interface PerformanceAnalysis {
  strengths: { id: string; name: string; type: 'subject' | 'chapter' | 'topic'; score: number }[];
  weakAreas: { id: string; name: string; type: 'subject' | 'chapter' | 'topic'; score: number; reason: string }[];
  mostImproved: { name: string; type: 'subject' | 'chapter' | 'topic'; description: string }[];
  needsImmediateReview: { id: string; title: string; itemType: 'flashcard' | 'quiz' | 'note'; noteId: string; reason: string }[];
  forgottenFlashcards: { id: string; front: string; back: string; forgetCount: number; noteTitle: string }[];
  smartInsights: string[];
  aiRecommendations: {
    type: 'generate_flashcards' | 'generate_quizzes' | 'review_notes' | 'ask_ai_tutor' | 'schedule_review';
    title: string;
    description: string;
    actionLabel: string;
    targetId?: string;
    targetType?: string;
    noteTitle?: string;
  }[];
  improvementOverTime: { date: string; avgScore: number; count: number }[];
}

export const getQuizAttempts = (): QuizAttempt[] => {
  try {
    const raw = localStorage.getItem('quiz_attempts');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
};

export const saveQuizAttempt = (attempt: QuizAttempt) => {
  try {
    const attempts = getQuizAttempts();
    attempts.push(attempt);
    localStorage.setItem('quiz_attempts', JSON.stringify(attempts));
  } catch (err) {
    console.error('Failed to save quiz attempt:', err);
  }
};

export const runPerformanceAnalysis = (): PerformanceAnalysis => {
  // 1. Load data from localStorage
  const subjects: Subject[] = JSON.parse(localStorage.getItem('student_os_subjects') || '[]');
  const chapters: Chapter[] = JSON.parse(localStorage.getItem('recall_chapters') || '[]');
  const topics: Topic[] = JSON.parse(localStorage.getItem('recall_topics') || '[]');
  const notes: SavedNote[] = JSON.parse(localStorage.getItem('recall_study_notes') || '[]');
  const revisionItems: RevisionItem[] = JSON.parse(localStorage.getItem('revision_items') || '[]');
  const revisionLogs: RevisionLog[] = JSON.parse(localStorage.getItem('revision_logs') || '[]');
  const quizAttempts = getQuizAttempts();

  // Create lookup maps
  const subjectMap = new Map<string, string>(subjects.map(s => [s.id, s.name]));
  const chapterMap = new Map<string, { title: string; subjectId: string }>(chapters.map(c => [c.id, { title: c.title, subjectId: c.subjectId }]));
  const topicMap = new Map<string, { title: string; chapterId: string }>(topics.map(t => [t.id, { title: t.title, chapterId: t.chapterId }]));
  const noteMap = new Map<string, SavedNote>(notes.map(n => [n.id, n]));

  // 2. Track Scores & Counts for Subjects, Chapters, Topics
  // We combine Quiz scores and Revision Logs/Items to compute a composite score.
  const subjectScores: Record<string, { totalScore: number; count: number; quizScores: number[] }> = {};
  const chapterScores: Record<string, { totalScore: number; count: number; quizScores: number[] }> = {};
  const topicScores: Record<string, { totalScore: number; count: number; quizScores: number[] }> = {};

  // Initialize
  subjects.forEach(s => { subjectScores[s.id] = { totalScore: 0, count: 0, quizScores: [] }; });
  chapters.forEach(c => { chapterScores[c.id] = { totalScore: 0, count: 0, quizScores: [] }; });
  notes.forEach(n => { topicScores[n.id] = { totalScore: 0, count: 0, quizScores: [] }; }); // Topic is noteId in active recall

  // Process Quiz attempts
  quizAttempts.forEach(attempt => {
    const note = noteMap.get(attempt.noteId);
    if (!note) return;

    // Record topic quiz score
    if (topicScores[note.id]) {
      topicScores[note.id].quizScores.push(attempt.score);
    }

    // Record chapter quiz score
    if (note.chapterId && chapterScores[note.chapterId]) {
      chapterScores[note.chapterId].quizScores.push(attempt.score);
    }

    // Record subject quiz score
    if (note.subjectId && subjectScores[note.subjectId]) {
      subjectScores[note.subjectId].quizScores.push(attempt.score);
    }
  });

  // Process Revision items (Active Recall mastery scores)
  revisionItems.forEach(item => {
    const note = noteMap.get(item.noteId);
    if (!note) return;

    const mastery = item.masteryScore ?? (item.intervalLevel * 25); // estimate if no mastery

    // Record topic mastery
    if (topicScores[note.id]) {
      topicScores[note.id].totalScore += mastery;
      topicScores[note.id].count += 1;
    }

    // Record chapter mastery
    if (note.chapterId && chapterScores[note.chapterId]) {
      chapterScores[note.chapterId].totalScore += mastery;
      chapterScores[note.chapterId].count += 1;
    }

    // Record subject mastery
    if (note.subjectId && subjectScores[note.subjectId]) {
      subjectScores[note.subjectId].totalScore += mastery;
      subjectScores[note.subjectId].count += 1;
    }
  });

  // Helper to calculate final weighted score (0-100)
  const calculateCompositeScore = (data: { totalScore: number; count: number; quizScores: number[] }): number => {
    let quizAvg = data.quizScores.length > 0 
      ? data.quizScores.reduce((a, b) => a + b, 0) / data.quizScores.length 
      : -1;
    let revisionAvg = data.count > 0 
      ? data.totalScore / data.count 
      : -1;

    if (quizAvg !== -1 && revisionAvg !== -1) {
      return Math.round(quizAvg * 0.6 + revisionAvg * 0.4);
    } else if (quizAvg !== -1) {
      return Math.round(quizAvg);
    } else if (revisionAvg !== -1) {
      return Math.round(revisionAvg);
    }
    return 75; // Baseline default if no reviews yet
  };

  // 3. Compile final metrics
  const analyzedSubjects = Object.entries(subjectScores).map(([id, data]) => ({
    id,
    name: subjectMap.get(id) || 'Unknown Subject',
    type: 'subject' as const,
    score: calculateCompositeScore(data),
    hasData: data.count > 0 || data.quizScores.length > 0,
    quizCount: data.quizScores.length
  })).filter(s => s.hasData);

  const analyzedChapters = Object.entries(chapterScores).map(([id, data]) => ({
    id,
    name: chapterMap.get(id)?.title || 'Unknown Chapter',
    type: 'chapter' as const,
    score: calculateCompositeScore(data),
    hasData: data.count > 0 || data.quizScores.length > 0,
    quizCount: data.quizScores.length
  })).filter(c => c.hasData);

  const analyzedTopics = Object.entries(topicScores).map(([id, data]) => ({
    id,
    name: noteMap.get(id)?.title || 'Unknown Topic',
    type: 'topic' as const,
    score: calculateCompositeScore(data),
    hasData: data.count > 0 || data.quizScores.length > 0,
    quizCount: data.quizScores.length
  })).filter(t => t.hasData);

  // Determine strengths & weak areas
  const strengths = [...analyzedSubjects, ...analyzedChapters, ...analyzedTopics]
    .filter(x => x.score >= 85)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(x => ({ id: x.id, name: x.name, type: x.type, score: x.score }));

  const weakAreas = [...analyzedSubjects, ...analyzedChapters, ...analyzedTopics]
    .filter(x => x.score < 75)
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map(x => {
      let reason = 'Needs practice and reviews.';
      if (x.quizCount > 0 && x.score < 60) {
        reason = 'Scored low on recent quizzes.';
      } else if (x.score < 50) {
        reason = 'Struggling with spaced recall.';
      }
      return { id: x.id, name: x.name, type: x.type, score: x.score, reason };
    });

  // Frequently forgotten flashcards
  // We can look at revision logs where rating was 'again' or 'hard'
  const forgetCounts: Record<string, number> = {};
  revisionLogs.forEach(log => {
    if ((log.perfRating === 'again' || log.perfRating === 'hard') && log.itemType === 'flashcard') {
      // Find the card ID if title matches or we can group by title
      forgetCounts[log.title] = (forgetCounts[log.title] || 0) + 1;
    }
  });

  // Find forgotten flashcards from active revision items
  const forgottenFlashcards = revisionItems
    .filter(item => item.itemType === 'flashcard' && ((item.masteryScore ?? 100) < 60 || (forgetCounts[item.title] || 0) > 1))
    .slice(0, 3)
    .map(item => {
      // Guess back from storage if we can, or just mock/provide front/back from revision items
      // RevisionItems doesn't have front/back directly, but we can load it from generatedMaterial!
      const material = JSON.parse(localStorage.getItem('recall_generated_material') || '{}');
      let front = item.title;
      let back = 'Click to flip and review.';
      let noteTitle = 'Active Flashcard';

      Object.entries(material).forEach(([noteId, mat]: [string, any]) => {
        if (mat.flashcards) {
          const found = mat.flashcards.find((f: any) => f.front === item.title || f.id === item.itemId);
          if (found) {
            front = found.front;
            back = found.back;
            const noteObj = noteMap.get(noteId);
            if (noteObj) noteTitle = noteObj.title;
          }
        }
      });

      return {
        id: item.itemId,
        front,
        back,
        forgetCount: forgetCounts[item.title] || 1,
        noteTitle
      };
    });

  // Most improved topics
  // We find topics where recent quiz scores show upward trend, or recall repetition count is high (> 3)
  const mostImproved: { name: string; type: 'subject' | 'chapter' | 'topic'; description: string }[] = [];
  
  revisionItems.forEach(item => {
    if (item.repetitions && item.repetitions >= 3) {
      const note = noteMap.get(item.noteId);
      if (note) {
        mostImproved.push({
          name: note.title,
          type: 'topic',
          description: `Consecutive correct recalls: ${item.repetitions}. Great improvement!`
        });
      }
    }
  });

  // Needs immediate review
  // Items whose revision date is past or due today
  const todayStr = new Date().toISOString().split('T')[0];
  const needsImmediateReview = revisionItems
    .filter(item => item.nextRevisionDate <= todayStr)
    .slice(0, 4)
    .map(item => {
      let reason = 'Overdue for review.';
      if (item.nextRevisionDate === todayStr) {
        reason = 'Due today.';
      }
      return {
        id: item.itemId,
        title: item.title,
        itemType: item.itemType,
        noteId: item.noteId,
        reason
      };
    });

  // 4. Smart Insights Generator
  const smartInsights: string[] = [];
  if (strengths.length > 0) {
    const best = strengths[0];
    smartInsights.push(`You have mastered ${best.name} (${best.score}% proficiency). Keep up the excellent work!`);
  }
  if (weakAreas.length > 0) {
    const worst = weakAreas[0];
    smartInsights.push(`You struggle with ${worst.name} (${worst.score}% proficiency). We recommend focusing your review here.`);
  } else {
    smartInsights.push('Amazing progress! You have high proficiency across all reviewed topics.');
  }

  const forgotCount = forgottenFlashcards.reduce((sum, item) => sum + item.forgetCount, 0);
  if (forgotCount > 2) {
    smartInsights.push(`You have forgotten some flashcards multiple times. Try using mnemonics or asking the AI Tutor to explain them differently.`);
  }

  // 5. Actionable AI Recommendations
  const aiRecommendations: PerformanceAnalysis['aiRecommendations'] = [];

  // Suggest reviewing notes or creating flashcards for weak areas
  weakAreas.forEach(area => {
    if (area.type === 'topic') {
      const note = noteMap.get(area.id);
      if (note) {
        aiRecommendations.push({
          type: 'generate_flashcards',
          title: `Build Flashcards for ${area.name}`,
          description: `Reinforce your weak spots in this topic by generating high-yield memory flashcards.`,
          actionLabel: 'Synthesize Cards',
          targetId: area.id,
          targetType: 'topic',
          noteTitle: area.name
        });
        aiRecommendations.push({
          type: 'ask_ai_tutor',
          title: `Ask AI Tutor about ${area.name}`,
          description: `Get a simple, tailored explanation of this topic from our encouraging tutor.`,
          actionLabel: 'Consult Tutor',
          targetId: area.id,
          targetType: 'topic',
          noteTitle: area.name
        });
      }
    }
  });

  // Suggest scheduling review sessions for overdue items
  if (needsImmediateReview.length > 0) {
    const item = needsImmediateReview[0];
    aiRecommendations.push({
      type: 'schedule_review',
      title: `Schedule Review: ${item.title}`,
      description: `Add this overdue ${item.itemType} to your revision calendar to prevent forgetting.`,
      actionLabel: 'Schedule Now',
      targetId: item.id,
      targetType: item.itemType,
      noteTitle: item.title
    });
  }

  // Fallback default recommendation if list is too short
  if (aiRecommendations.length === 0) {
    aiRecommendations.push({
      type: 'generate_quizzes',
      title: 'Take a Comprehensive Quiz',
      description: 'Test your understanding across all chapters to gather more diagnostic insights!',
      actionLabel: 'Start Quiz'
    });
  }

  // 6. Track improvement over time
  // Generate mock-trending data or aggregate historical logs
  const improvementOverTime: { date: string; avgScore: number; count: number }[] = [];
  const days = 7;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    const displayDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    // Aggregate quiz scores and flashcards on this day
    const dayQuizzes = quizAttempts.filter(q => q.timestamp.startsWith(dStr));
    const dayReviews = revisionLogs.filter(r => r.timestamp.startsWith(dStr));

    let avg = 0;
    if (dayQuizzes.length > 0) {
      avg = Math.round(dayQuizzes.reduce((sum, q) => sum + q.score, 0) / dayQuizzes.length);
    } else {
      // mock a baseline trend line based on general revision levels so chart is never empty
      avg = 70 + Math.floor(Math.sin(i) * 5) + (strengths.length * 2);
    }

    improvementOverTime.push({
      date: displayDate,
      avgScore: Math.min(100, Math.max(0, avg)),
      count: dayReviews.length + dayQuizzes.length
    });
  }

  return {
    strengths,
    weakAreas: weakAreas.slice(0, 3),
    mostImproved: mostImproved.slice(0, 2),
    needsImmediateReview,
    forgottenFlashcards,
    smartInsights,
    aiRecommendations: aiRecommendations.slice(0, 3),
    improvementOverTime
  };
};
