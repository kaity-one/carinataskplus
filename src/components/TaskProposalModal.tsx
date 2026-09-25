import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Plus, 
  Check, 
  Search, 
  Flame, 
  Timer, 
  CheckSquare, 
  Code2, 
  GraduationCap, 
  Activity, 
  Zap, 
  Layers,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { PROPOSED_TASKS } from '../utils/proposals';
import type { ProposedTask, GoalCategory, PriorityLevel } from '../types';
import { useData } from '../context/DataContext';
import { getTodayString } from '../utils/date';
import { fireConfetti } from '../utils/confetti';
import { playTaskDoneSound } from '../utils/audio';

interface TaskProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TrackFilter = 'All' | 'Developer' | 'Student' | 'Health/Fitness' | 'Productivity';

export const TaskProposalModal: React.FC<TaskProposalModalProps> = ({ isOpen, onClose }) => {
  const { createTask, createHabit } = useData();

  const [selectedTrack, setSelectedTrack] = useState<TrackFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedTaskIds, setAddedTaskIds] = useState<Set<string>>(new Set());
  const [addedHabitIds, setAddedHabitIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedMultiIds, setSelectedMultiIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleMultiSelect = (id: string) => {
    setSelectedMultiIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredProposals = PROPOSED_TASKS.filter(p => {
    if (selectedTrack !== 'All' && p.track !== selectedTrack) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchNotes = (p.notes || '').toLowerCase().includes(q);
      if (!matchTitle && !matchNotes) return false;
    }
    return true;
  });

  const handleAddGoal = async (p: ProposedTask) => {
    const today = getTodayString();
    await createTask({
      title: p.title,
      category: p.category,
      priority: p.priority,
      date: today,
      completed: false,
      notes: p.notes,
      estimatedPomodoros: p.estimatedPomodoros,
      completedPomodoros: 0,
      subtasks: p.subtasks?.map((st, i) => ({
        id: `sub_${Date.now()}_${i}`,
        title: st,
        completed: false,
      })) || [],
    });

    setAddedTaskIds(prev => new Set(prev).add(p.id));
    playTaskDoneSound();
    fireConfetti();
  };

  const handleAddHabit = async (p: ProposedTask) => {
    const colorMap: Record<GoalCategory, string> = {
      Study: '#3b82f6',
      Work: '#6366f1',
      'Health/Fitness': '#10b981',
      Personal: '#f59e0b',
    };

    await createHabit({
      title: p.title,
      description: p.notes,
      category: p.category,
      frequency: p.habitFrequency || 'daily',
      color: colorMap[p.category] || '#6366f1',
    });

    setAddedHabitIds(prev => new Set(prev).add(p.id));
    playTaskDoneSound();
    fireConfetti();
  };

  const handleAddSelectedBatch = async () => {
    const today = getTodayString();
    const tasksToAdd = PROPOSED_TASKS.filter(p => selectedMultiIds.has(p.id));
    for (const p of tasksToAdd) {
      await createTask({
        title: p.title,
        category: p.category,
        priority: p.priority,
        date: today,
        completed: false,
        notes: p.notes,
        estimatedPomodoros: p.estimatedPomodoros,
        completedPomodoros: 0,
        subtasks: p.subtasks?.map((st, i) => ({
          id: `sub_${Date.now()}_${i}`,
          title: st,
          completed: false,
        })) || [],
      });
      setAddedTaskIds(prev => new Set(prev).add(p.id));
    }
    setSelectedMultiIds(new Set());
    playTaskDoneSound();
    fireConfetti();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col transition-colors">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Đề xuất nhiệm vụ & thói quen mục tiêu
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                  Recommended Tasks
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Khám phá và thêm nhanh các nhiệm vụ mẫu chất lượng cao cho Dev, Sinh viên & Sức khỏe
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 sm:px-6 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 space-y-3">
          {/* Tracks tab pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'All' as TrackFilter, label: 'Tất cả (All)', icon: Layers },
              { id: 'Developer' as TrackFilter, label: '💻 Lập trình viên', icon: Code2 },
              { id: 'Student' as TrackFilter, label: '🎓 Sinh viên & Học tập', icon: GraduationCap },
              { id: 'Health/Fitness' as TrackFilter, label: '🏃 Sức khỏe & Thể lực', icon: Activity },
              { id: 'Productivity' as TrackFilter, label: '⚡ Năng suất & Đời sống', icon: Zap },
            ].map((item) => {
              const isActive = selectedTrack === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedTrack(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search box & Batch Add Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm mục tiêu đề xuất..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 outline-hidden"
              />
            </div>

            {selectedMultiIds.size > 0 && (
              <button
                onClick={handleAddSelectedBatch}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm {selectedMultiIds.size} mục tiêu đã chọn</span>
              </button>
            )}
          </div>
        </div>

        {/* Proposals List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredProposals.map((p) => {
            const isAddedTask = addedTaskIds.has(p.id);
            const isAddedHabit = addedHabitIds.has(p.id);
            const isExpanded = expandedIds.has(p.id);
            const isSelected = selectedMultiIds.has(p.id);

            return (
              <div
                key={p.id}
                className={`pt-3 first:pt-0 rounded-2xl p-3.5 transition-all ${
                  isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left: Checkbox selector & Task details */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMultiSelect(p.id)}
                      className="mt-1 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                      title="Chọn để thêm hàng loạt"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {p.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          p.priority === 'high' ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400' :
                          p.priority === 'medium' ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {p.priority}
                        </span>
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          ~{p.estimatedPomodoros * 25}m ({p.estimatedPomodoros} poms)
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          #{p.track}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {p.title}
                      </h4>

                      {p.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {p.notes}
                        </p>
                      )}

                      {/* Subtasks dropdown preview */}
                      {p.subtasks && p.subtasks.length > 0 && (
                        <button
                          onClick={() => toggleExpand(p.id)}
                          className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold cursor-pointer"
                        >
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          <span>Chi tiết {p.subtasks.length} bước triển khai (Checklist)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Add as Today Goal */}
                    <button
                      onClick={() => handleAddGoal(p)}
                      disabled={isAddedTask}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                        isAddedTask
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                      }`}
                    >
                      {isAddedTask ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã thêm mục tiêu</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm vào hôm nay</span>
                        </>
                      )}
                    </button>

                    {/* Add as Habit if applicable */}
                    {p.canBeHabit && (
                      <button
                        onClick={() => handleAddHabit(p)}
                        disabled={isAddedHabit}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                          isAddedHabit
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                        }`}
                      >
                        {isAddedHabit ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã tạo thói quen</span>
                          </>
                        ) : (
                          <>
                            <Flame className="w-3.5 h-3.5" />
                            <span>Tạo thói quen</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Subtasks details */}
                {isExpanded && p.subtasks && (
                  <div className="mt-3 ml-7 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Các bước đề xuất:
                    </p>
                    {p.subtasks.map((st, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Có sẵn {PROPOSED_TASKS.length} nhiệm vụ và thói quen mẫu được tối ưu</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
