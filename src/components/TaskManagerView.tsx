import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, Play, Plus, Trash2, Filter, AlertTriangle, 
  Search, Eye, Clock, Calendar, CheckSquare, Edit3, X, FolderMinus
} from 'lucide-react';
import { Task } from '../types';

interface TaskManagerViewProps {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
}

const CATEGORIES = ['Assignment', 'Exam Prep', 'Project', 'Reading', 'Personal', 'Other'] as const;
const PRIORITIES = ['Low', 'Medium', 'High'] as const;

export default function TaskManagerView({
  tasks,
  addTask,
  updateTask,
  deleteTask,
  toggleTaskStatus
}: TaskManagerViewProps) {
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'To Do' | 'In Progress' | 'Completed'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title'>('dueDate');

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<Task['category']>('Assignment');
  const [formPriority, setFormPriority] = useState<Task['priority']>('Medium');
  const [formDueDate, setFormDueDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Editing State
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Sorting priorities values
  const priorityValue = { High: 3, Medium: 2, Low: 1 };

  // Handle addition
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    addTask({
      title: formTitle.trim(),
      category: formCategory,
      priority: formPriority,
      status: 'To Do',
      dueDate: formDueDate || new Date().toISOString().split('T')[0],
      notes: formNotes.trim() || undefined
    });

    // Reset Form
    setFormTitle('');
    setFormCategory('Assignment');
    setFormPriority('Medium');
    setFormDueDate('');
    setFormNotes('');
    setShowAddForm(false);
  };

  // Handle Edit update
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;

    updateTask(editingTask);
    setEditingTask(null);
  };

  // Filter & Sort Tasks
  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (task.notes && task.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesTab = 
        activeTab === 'All' ? true :
        activeTab === 'To Do' ? task.status === 'To Do' :
        activeTab === 'In Progress' ? task.status === 'In Progress' :
        task.status === 'Completed';

      const matchesCategory = selectedCategory === 'All' ? true : task.category === selectedCategory;
      const matchesPriority = selectedPriority === 'All' ? true : task.priority === selectedPriority;

      return matchesSearch && matchesTab && matchesCategory && matchesPriority;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'priority') {
        return priorityValue[b.priority] - priorityValue[a.priority];
      }
      return a.title.localeCompare(b.title);
    });

  return (
    <div id="task-manager-view-container" className="space-y-6">
      
      {/* Search and Navigation filters */}
      <div id="task-actions-row" className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-xl">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="input-task-search"
            type="text"
            placeholder="Search tasks or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
          />
        </div>

        {/* Tab Filters */}
        <div id="task-tab-filters" className="flex overflow-x-auto w-full md:w-auto p-0.5 bg-slate-900/50 border border-white/5 rounded-xl gap-1">
          {(['All', 'To Do', 'In Progress', 'Completed'] as const).map((tab) => (
            <button
              key={tab}
              id={`tab-filter-${tab.replace(' ', '-')}`}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === tab 
                  ? 'bg-indigo-650 text-white shadow font-medium' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Create Task Button */}
        <button
          id="btn-open-create-task"
          onClick={() => setShowAddForm(true)}
          className="w-full md:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 text-white text-xs font-semibold rounded-xl shadow-lg transition transform hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} />
          Create Task
        </button>
      </div>

      {/* Grid: Tasks List + Category sorting sidebar */}
      <div id="tasks-filtering-grid" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sorting & Filter Control Sidebar (1/4 Column) */}
        <div className="space-y-6 lg:col-span-1">
          <div id="filters-sidebar-card" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl space-y-5">
            <h3 className="text-sm font-display font-medium text-white border-b border-white/10 pb-3 flex items-center gap-2">
              <Filter size={16} className="text-indigo-400" />
              <span>Scope Filters</span>
            </h3>

            {/* Sort Control */}
            <div className="space-y-1.5">
              <label htmlFor="select-sort" className="text-xs font-mono uppercase tracking-wider text-slate-400">Sort By</label>
              <select
                id="select-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-slate-900/50 border border-white/15 hover:border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="dueDate">🎯 Due Date</option>
                <option value="priority">🚩 Flag Priority</option>
                <option value="title">✏️ Alpha Title</option>
              </select>
            </div>

            {/* Category selection list */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block pb-1">Categories</span>
              <div className="space-y-1">
                <button
                  id="category-filter-all"
                  onClick={() => setSelectedCategory('All')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition flex items-center justify-between ${
                    selectedCategory === 'All' ? 'bg-indigo-600/30 text-indigo-300 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>All Categories</span>
                  <span className="font-mono text-[10px]">{tasks.length}</span>
                </button>
                {CATEGORIES.map((cat) => {
                  const count = tasks.filter(t => t.category === cat).length;
                  return (
                    <button
                      key={cat}
                      id={`category-filter-${cat.toLowerCase().replace(' ', '-')}`}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between ${
                        selectedCategory === cat ? 'bg-indigo-600/30 text-indigo-300 font-semibold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="font-mono text-[10px] bg-white/5 px-1.5 py-0.5 rounded-full text-slate-400">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority selection buttons */}
            <div className="space-y-1.5">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block pb-1">Priorities</span>
              <div className="flex bg-slate-900/40 p-1 border border-white/5 rounded-xl text-[10px] font-semibold">
                <button
                  id="priority-filter-all"
                  onClick={() => setSelectedPriority('All')}
                  className={`flex-1 py-1 px-2 rounded-md text-center transition ${selectedPriority === 'All' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  All
                </button>
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    id={`priority-filter-${p.toLowerCase()}`}
                    onClick={() => setSelectedPriority(p)}
                    className={`flex-1 py-1 px-2 rounded-md text-center transition ${selectedPriority === p ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Primary Tasks display (3/4 Columns) */}
        <div id="tasks-display-list-column" className="lg:col-span-3 space-y-4">
          
          <AnimatePresence>
            {/* Create Task Form panel */}
            {showAddForm && (
              <motion.form
                id="create-task-form"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleAddSubmit}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-display font-medium text-white flex items-center gap-1.5">
                    <CheckSquare size={16} className="text-indigo-400" />
                    <span>Establish New Study Task</span>
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)}
                    className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="create-task-title" className="text-xs text-slate-300 font-medium">Task / Goal Title</label>
                    <input
                      id="create-task-title"
                      type="text"
                      placeholder="e.g. Write AI thesis draft"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      required
                      className="bg-slate-900/50 border border-white/10 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm text-white rounded-xl p-3"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="create-task-due" className="text-xs text-slate-300 font-medium">Due Date</label>
                    <input
                      id="create-task-due"
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="bg-slate-900/50 border border-white/10 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm text-white rounded-xl p-3 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="create-task-category" className="text-xs text-slate-300 font-medium">Category</label>
                    <select
                      id="create-task-category"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="bg-slate-900/50 border border-white/10 text-sm text-white rounded-xl p-3 cursor-pointer"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="create-task-priority" className="text-xs text-slate-300 font-medium">Priority Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PRIORITIES.map(p => (
                        <button
                          key={p}
                          type="button"
                          id={`prio-btn-${p.toLowerCase()}`}
                          onClick={() => setFormPriority(p)}
                          className={`py-2 text-xs font-semibold rounded-xl border transition ${
                            formPriority === p 
                              ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50' 
                              : 'bg-slate-900/40 text-slate-500 border-white/5 hover:text-white'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="create-task-notes" className="text-xs text-slate-300 font-medium">Explanatory Notes</label>
                  <textarea
                    id="create-task-notes"
                    placeholder="Provide guidelines, checklist details, study links..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={2}
                    className="bg-slate-900/50 border border-white/10 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm text-white rounded-xl p-3"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-white/10 text-slate-350 hover:bg-white/5 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow"
                  >
                    Submit Task
                  </button>
                </div>
              </motion.form>
            )}

            {/* Edit Task Form panel */}
            {editingTask && (
              <motion.form
                id="edit-task-form"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleEditSubmit}
                className="bg-slate-950/20 border border-indigo-500/20 rounded-2xl p-6 shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-indigo-500/10 pb-3">
                  <h3 className="text-base font-display font-medium text-white flex items-center gap-1.5">
                    <Edit3 size={16} className="text-indigo-400" />
                    <span>Revise Existing Task</span>
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => setEditingTask(null)}
                    className="p-1 hover:bg-white/10 rounded-lg text-slate-450 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="edit-task-title" className="text-xs text-slate-300 font-medium">Task Title</label>
                    <input
                      id="edit-task-title"
                      type="text"
                      value={editingTask.title}
                      onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                      required
                      className="bg-slate-900/50 border border-white/10 focus:ring-1 focus:ring-indigo-505 focus:outline-none text-sm text-white rounded-xl p-3"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="edit-task-due" className="text-xs text-slate-300 font-medium">Due Date</label>
                    <input
                      id="edit-task-due"
                      type="date"
                      value={editingTask.dueDate}
                      onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                      className="bg-slate-900/50 border border-white/10 focus:ring-1 focus:ring-indigo-505 focus:outline-none text-sm text-white rounded-xl p-3 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="edit-task-category" className="text-xs text-slate-300 font-medium">Category</label>
                    <select
                      id="edit-task-category"
                      value={editingTask.category}
                      onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value as any })}
                      className="bg-slate-900/50 border border-white/10 text-sm text-white rounded-xl p-3"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="edit-task-priority" className="text-xs text-slate-300 font-medium">Priority</label>
                    <select
                      id="edit-task-priority"
                      value={editingTask.priority}
                      onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                      className="bg-slate-900/50 border border-white/10 text-sm text-white rounded-xl p-3"
                    >
                      {PRIORITIES.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="edit-task-status" className="text-xs text-slate-300 font-medium">Status</label>
                    <select
                      id="edit-task-status"
                      value={editingTask.status}
                      onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as any })}
                      className="bg-slate-900/50 border border-white/10 text-sm text-white rounded-xl p-3"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="edit-task-notes" className="text-xs text-slate-300 font-medium">Notes</label>
                  <textarea
                    id="edit-task-notes"
                    value={editingTask.notes || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, notes: e.target.value })}
                    rows={2}
                    className="bg-slate-900/50 border border-white/10 focus:ring-1 focus:ring-indigo-505 focus:outline-none text-sm text-white rounded-xl p-3"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="px-4 py-2 border border-white/10 text-slate-400 hover:bg-white/5 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
                  >
                    Save Changes
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Grid Task Items Checklist */}
          {filteredTasks.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center shadow-xl flex flex-col items-center justify-center">
              <FolderMinus size={40} className="text-slate-500 mb-3" />
              <p className="text-slate-400 text-sm">No tasks meet the active filter options.</p>
              <button
                id="btn-clear-filters"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setSelectedPriority('All');
                  setActiveTab('All');
                }}
                className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 underline"
              >
                Reset active filters
              </button>
            </div>
          ) : (
            <div id="tasks-timeline-piles" className="space-y-3">
              {filteredTasks.map((task) => (
                <motion.div
                  key={task.id}
                  id={`task-row-${task.id}`}
                  layoutId={`task-${task.id}`}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 shadow-md transition duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 flex-1 w-full">
                    {/* Status Checkbox toggle */}
                    <button
                      id={`btn-toggle-box-${task.id}`}
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`mt-1 flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer ${
                        task.status === 'Completed'
                          ? 'bg-indigo-650 border-indigo-650 text-white'
                          : 'border-white/20 hover:border-indigo-400 text-transparent'
                      }`}
                    >
                      <Check size={14} className="stroke-[3]" />
                    </button>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-sm font-sans font-medium text-white truncate ${task.status === 'Completed' ? 'line-through text-slate-450' : ''}`}>
                          {task.title}
                        </h4>
                        <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full border ${
                          task.priority === 'High' ? 'bg-red-500/10 text-red-300 border-red-500/20' :
                          task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="text-[9px] font-mono bg-white/5 border border-white/10 text-slate-355 px-2 py-0.5 rounded-md">
                          {task.category}
                        </span>
                        {task.status === 'In Progress' && (
                          <span className="text-[9px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-md">
                            In Progress
                          </span>
                        )}
                      </div>
                      
                      {task.notes && (
                        <p className="text-xs text-slate-400 line-clamp-2 md:line-clamp-none whitespace-pre-wrap">
                          {task.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-450" />
                          <span>Due: {task.dueDate}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {task.status !== 'Completed' && task.status !== 'In Progress' && (
                      <button
                        id={`btn-task-progress-${task.id}`}
                        onClick={() => updateTask({ ...task, status: 'In Progress' })}
                        className="px-2.5 py-1.5 bg-sky-505/10 hover:bg-sky-505/20 text-sky-300 rounded-lg text-[10px] uppercase font-mono font-bold transition flex items-center gap-1 border border-sky-500/10 cursor-pointer"
                        title="Mark in-progress"
                      >
                        <Play size={10} className="fill-sky-300" /> Start
                      </button>
                    )}
                    
                    <button
                      id={`btn-edit-trigger-${task.id}`}
                      onClick={() => setEditingTask(task)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-lg transition"
                      title="Edit task"
                    >
                      <Edit3 size={12} />
                    </button>

                    <button
                      id={`btn-delete-task-trigger-${task.id}`}
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 bg-red-650/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-white rounded-lg transition"
                      title="Delete task"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
