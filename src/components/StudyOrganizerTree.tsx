import React, { useState } from 'react';
import { 
  Folder, FolderOpen, ChevronRight, ChevronDown, Plus, Trash2, 
  Settings, BookOpen, FileText, Sparkles, Tag, FolderPlus
} from 'lucide-react';
import { Subject, Chapter, Topic, SavedNote } from '../types';

interface StudyOrganizerTreeProps {
  subjects: Subject[];
  chapters: Chapter[];
  topics: Topic[];
  notes: SavedNote[];
  selectedSubjectId: string;
  selectedChapterId: string;
  selectedTopicId: string;
  onSelectSubject: (id: string) => void;
  onSelectChapter: (id: string) => void;
  onSelectTopic: (id: string) => void;
  onAddChapter: (subjectId: string, title: string) => void;
  onAddTopic: (chapterId: string, title: string) => void;
  onDeleteChapter: (id: string, e: React.MouseEvent) => void;
  onDeleteTopic: (id: string, e: React.MouseEvent) => void;
  onDeleteSubject: (id: string, e: React.MouseEvent) => void;
  onAddSubjectClick: () => void;
}

export default function StudyOrganizerTree({
  subjects,
  chapters,
  topics,
  notes,
  selectedSubjectId,
  selectedChapterId,
  selectedTopicId,
  onSelectSubject,
  onSelectChapter,
  onSelectTopic,
  onAddChapter,
  onAddTopic,
  onDeleteChapter,
  onDeleteTopic,
  onDeleteSubject,
  onAddSubjectClick
}: StudyOrganizerTreeProps) {
  // Collapsible tracking states
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({
    'sub-1': true, // Keep calc midterm open as default
    'sub-4': true  // Keep physics open as default
  });
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    'ch-1': true,
    'ch-2': true
  });

  // Creation prompts overlay
  const [addingChapterForSubId, setAddingChapterForSubId] = useState<string | null>(null);
  const [addingTopicForChId, setAddingTopicForChId] = useState<string | null>(null);
  
  const [chapterInputText, setChapterInputText] = useState('');
  const [topicInputText, setTopicInputText] = useState('');

  const toggleSubject = (sId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSubjects(prev => ({
      ...prev,
      [sId]: !prev[sId]
    }));
  };

  const toggleChapter = (chId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedChapters(prev => ({
      ...prev,
      [chId]: !prev[chId]
    }));
  };

  const submitChapter = (subjectId: string) => {
    if (!chapterInputText.trim()) return;
    onAddChapter(subjectId, chapterInputText);
    setChapterInputText('');
    setAddingChapterForSubId(null);
    // Auto-expand subject to show new chapter
    setExpandedSubjects(prev => ({ ...prev, [subjectId]: true }));
  };

  const submitTopic = (chapterId: string) => {
    if (!topicInputText.trim()) return;
    onAddTopic(chapterId, topicInputText);
    setTopicInputText('');
    setAddingTopicForChId(null);
    // Auto-expand chapter to show new topic
    setExpandedChapters(prev => ({ ...prev, [chapterId]: true }));
  };

  return (
    <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-4 flex flex-col h-[580px] justify-between">
      <div className="space-y-4 overflow-y-auto pr-1 flex-1">
        {/* Tree Header and Trigger */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <span className="text-xs font-mono font-bold text-slate-400 tracking-wider flex items-center gap-1.5 uppercase">
            <BookOpen size={12} className="text-indigo-400" />
            <span>Folder Tree</span>
          </span>
          <button
            onClick={onAddSubjectClick}
            className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/20 text-white text-[10px] font-semibold cursor-pointer transition shadow"
          >
            <Plus size={10} />
            <span>Course Plan</span>
          </button>
        </div>

        {subjects.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-xs text-slate-500 italic">No course subjects created.</p>
            <button
              onClick={onAddSubjectClick}
              className="mt-3 text-[10px] font-semibold px-2.5 py-1.5 bg-indigo-600/20 text-white border border-indigo-500/10 rounded-lg hover:border-indigo-500 transition cursor-pointer"
            >
              Add New Course Subject
            </button>
          </div>
        ) : (
          <div className="space-y-3 pl-1 font-sans">
            {subjects.map((sub) => {
              const isSubExpanded = expandedSubjects[sub.id];
              const isSelected = selectedSubjectId === sub.id && !selectedChapterId && !selectedTopicId;
              const subChapters = chapters.filter(c => c.subjectId === sub.id);

              return (
                <div key={sub.id} className="space-y-1">
                  
                  {/* Subject Node Row */}
                  <div 
                    onClick={() => onSelectSubject(sub.id)}
                    className={`group w-full p-2.5 rounded-xl flex items-center justify-between gap-2 border select-none cursor-pointer transition ${
                      isSelected 
                        ? 'bg-indigo-600/10 border-indigo-500 text-white font-semibold' 
                        : 'bg-white/2 hover:bg-white/5 border-transparent text-slate-350 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <button 
                        type="button"
                        onClick={(e) => toggleSubject(sub.id, e)}
                        className="p-1 hover:bg-white/8 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        {isSubExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${!sub.color?.startsWith('#') ? sub.color : ''}`} style={sub.color?.startsWith('#') ? { backgroundColor: sub.color } : undefined}></span>
                      <span className="text-xs truncate font-medium">
                        {sub.code ? `${sub.code} - ` : ''}{sub.name}
                      </span>
                    </div>

                    {/* Quick management controls in tree node hover */}
                    <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition shrink-0">
                      <button
                        title="Add Chapter"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddingChapterForSubId(addingChapterForSubId === sub.id ? null : sub.id);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-white/8 rounded cursor-pointer"
                      >
                        <FolderPlus size={11} />
                      </button>
                      <button
                        title="Remove Subject"
                        onClick={(e) => onDeleteSubject(sub.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-white/8 rounded cursor-pointer"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Add Chapter Form Box */}
                  {addingChapterForSubId === sub.id && (
                    <div className="ml-6 p-2 bg-slate-900 border border-white/5 rounded-lg flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Chapter name..."
                        value={chapterInputText}
                        onChange={(e) => setChapterInputText(e.target.value)}
                        className="bg-transparent text-[11px] text-white border-0 focus:ring-0 focus:outline-none p-1 flex-1 font-sans"
                        onKeyDown={(e) => e.key === 'Enter' && submitChapter(sub.id)}
                        autoFocus
                      />
                      <button
                        onClick={() => submitChapter(sub.id)}
                        className="text-[10px] font-bold py-1 px-2.5 bg-indigo-650 hover:bg-indigo-600 rounded text-white cursor-pointer transition font-sans"
                      >
                        Add
                      </button>
                    </div>
                  )}

                  {/* Chapters of Subject */}
                  {isSubExpanded && (
                    <div className="ml-5 border-l border-white/5 pl-2.5 space-y-1">
                      {subChapters.length === 0 ? (
                        <div className="py-1 text-center">
                          <span className="text-[10px] pl-1.5 text-slate-600 italic">No chapters created.</span>
                        </div>
                      ) : (
                        subChapters.map(ch => {
                          const isChExpanded = expandedChapters[ch.id];
                          const isChSelected = selectedChapterId === ch.id && !selectedTopicId;
                          const chTopics = topics.filter(t => t.chapterId === ch.id);

                          return (
                            <div key={ch.id} className="space-y-1">
                              
                              {/* Chapter Node Row */}
                              <div
                                onClick={() => onSelectChapter(ch.id)}
                                className={`group p-2 rounded-lg flex items-center justify-between gap-1.5 border select-none cursor-pointer transition ${
                                  isChSelected 
                                    ? 'bg-indigo-600/10 border-indigo-500/50 text-white font-medium' 
                                    : 'bg-transparent text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/3'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={(e) => toggleChapter(ch.id, e)}
                                    className="p-0.5 hover:bg-white/5 rounded text-slate-400 hover:text-white transition cursor-pointer"
                                  >
                                    {isChExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                                  </button>
                                  {isChExpanded ? (
                                    <FolderOpen size={12} className="text-indigo-400 shrink-0" />
                                  ) : (
                                    <Folder size={12} className="text-slate-500 shrink-0" />
                                  )}
                                  <span className="text-xs truncate">{ch.title}</span>
                                </div>

                                <div className="flex items-center gap-0.5 opacity-100 lg:opacity-0 group-hover:opacity-100 transition shrink-0">
                                  <button
                                    title="Add Topic"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAddingTopicForChId(addingTopicForChId === ch.id ? null : ch.id);
                                    }}
                                    className="p-0.5 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded cursor-pointer"
                                  >
                                    <Plus size={10} />
                                  </button>
                                  <button
                                    title="Remove Chapter"
                                    onClick={(e) => onDeleteChapter(ch.id, e)}
                                    className="p-0.5 text-slate-400 hover:text-rose-450 hover:bg-white/5 rounded cursor-pointer"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              </div>

                              {/* Add Topic Form Box */}
                              {addingTopicForChId === ch.id && (
                                <div className="ml-5 p-1.5 bg-slate-900 border border-white/5 rounded-lg flex items-center gap-1">
                                  <input
                                    type="text"
                                    placeholder="Topic name..."
                                    value={topicInputText}
                                    onChange={(e) => setTopicInputText(e.target.value)}
                                    className="bg-transparent text-[10px] text-white border-0 focus:ring-0 focus:outline-none p-1 flex-1 font-sans"
                                    onKeyDown={(e) => e.key === 'Enter' && submitTopic(ch.id)}
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => submitTopic(ch.id)}
                                    className="text-[9px] font-bold py-1 px-2 bg-indigo-650 hover:bg-indigo-600 rounded text-white cursor-pointer transition font-sans"
                                  >
                                    Add
                                  </button>
                                </div>
                              )}

                              {/* Topics in Chapter */}
                              {isChExpanded && (
                                <div className="ml-4 border-l border-white/5 pl-2.5 space-y-0.5">
                                  {chTopics.length === 0 ? (
                                    <div className="py-0.5 text-center">
                                      <span className="text-[9px] pl-1 text-slate-650 italic">No topics under chapter.</span>
                                    </div>
                                  ) : (
                                    chTopics.map(top => {
                                      const isTopSelected = selectedTopicId === top.id;
                                      const topicNotes = notes.filter(n => n.topicId === top.id);

                                      return (
                                        <div
                                          key={top.id}
                                          onClick={() => onSelectTopic(top.id)}
                                          className={`group p-1.5 pl-2 rounded-md flex items-center justify-between gap-1 border select-none cursor-pointer transition ${
                                            isTopSelected
                                              ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300 font-medium'
                                              : 'bg-transparent text-slate-450 hover:text-slate-300 border-transparent hover:bg-white/2'
                                          }`}
                                        >
                                          <div className="flex items-center gap-1.5 overflow-hidden">
                                            <FileText size={11} className="text-slate-500 shrink-0" />
                                            <span className="text-xs truncate">{top.title}</span>
                                          </div>

                                          <div className="flex items-center gap-1.5 shrink-0">
                                            {topicNotes.length > 0 && (
                                              <span className="text-[8px] font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-500/10 px-1 py-0.5 rounded font-bold">
                                                {topicNotes.length} G
                                              </span>
                                            )}
                                            <button
                                              title="Remove Topic"
                                              onClick={(e) => onDeleteTopic(top.id, e)}
                                              className="p-0.5 text-slate-500 hover:text-rose-450 hover:bg-white/5 rounded opacity-100 lg:opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                            >
                                              <Trash2 size={10} />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}

                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer System Credits in Folder Tree sidebar */}
      <div className="border-t border-white/5 pt-3 mt-3 text-center">
        <span className="text-[10px] font-mono text-slate-500 flex items-center justify-center gap-1">
          <Sparkles size={10} className="text-indigo-400 rotate-12" />
          <span>Manual Structure System</span>
        </span>
      </div>
    </div>
  );
}
