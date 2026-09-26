import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Search, 
  Calendar, 
  Trash2, 
  Edit3, 
  Play, 
  ChevronDown, 
  ChevronRight, 
  CheckSquare,
  Lightbulb,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { getTodayString, getOffsetDateString, formatDateLabel } from '../utils/date';
import { fireConfetti } from '../utils/confetti';
import { playTaskDoneSound } from '../utils/audio';
import type { Task, GoalCategory, PriorityLevel, CalendarEvent } from '../types';
import { TaskModal } from './TaskModal';

interface GoalsViewProps {
  onStartFocusOnTask: (taskId: string, title: string, category: string) => void;
  onOpenProposalsModal: () => void;
  onNavigateToSchedule?: () => void;
}

type CategoryFilter = 'All' | GoalCategory;
type DateFilter = 'all' | 'today' | 'tomorrow' | 'upcoming';
type StatusFilter = 'all' | 'active' | 'completed';
type SortOption = 'priority' | 'date' | 'title';

const CATEGORY_STYLES: Record<GoalCategory, { badge: string; border: string }> = {
  Study: { badge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', border: 'border-l-blue-500' },
  Work: { badge: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800', border: 'border-l-indigo-500' },
  'Health/Fitness': { badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', border: 'border-l-emerald-500' },
  Personal: { badge: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800', border: 'border-l-purple-500' },
};

const PRIORITY_ORDER: Record<PriorityLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export const GoalsView: React.FC<GoalsViewProps> = ({ 
  onStartFocusOnTask, 
  onOpenProposalsModal,
  onNavigateToSchedule 
}) => {
  const { tasks, createTask, updateTask, toggleTask, deleteTask } = useData();

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('priority');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [calendarEventsCount, setCalendarEventsCount] = useState(0);

  const today = getTodayString();
  const tomorrow = getOffsetDateString(1);

  // Check if calendar has classes today
  useEffect(() => {
    try {
      const saved = localStorage.getItem('carinataskplus_calendar_events');
      if (saved) {
        const parsed: CalendarEvent[] = JSON.parse(saved);
        const todayCount = parsed.filter(e => e.date === today || e.dayOfWeek === new Date().getDay()).length;
        setCalendarEventsCount(todayCount);
      }
    } catch {
      // ignore
    }
  }, [today]);

  const handleLoadStarterPack = async () => {
    const starterItems = [
      {
        title: 'Ôn tập slide bài giảng & tạo flashcard ôn bài (Active Recall)',
        category: 'Study' as GoalCategory,
        priority: 'high' as PriorityLevel,
        estimatedPomodoros: 2,
        notes: 'Ôn tập theo phương pháp ngắt quãng, tự kiểm tra không nhìn tài liệu.',
        subtasks: ['Đọc lại ghi chú bài giảng', 'Tạo 10 thẻ hỏi đáp', 'Tự trả lời 3 câu hỏi khó']
      },
      {
        title: 'Làm bài tập về nhà môn chuyên ngành (Coursework)',
        category: 'Study' as GoalCategory,
        priority: 'high' as PriorityLevel,
        estimatedPomodoros: 3,
        notes: 'Giải bài tập độc lập trước khi trao đổi với bạn bè.',
        subtasks: ['Đọc đề bài và tóm tắt công thức', 'Giải các bài cơ bản', 'Giải bài nâng cao']
      },
      {
        title: 'Học 20 từ vựng tiếng Anh học thuật (IELTS / TOEIC)',
        category: 'Study' as GoalCategory,
        priority: 'medium' as PriorityLevel,
        estimatedPomodoros: 1,
        notes: 'Học cả collocations và phát âm chuẩn.',
      },
      {
        title: 'Tập thể thao 30 phút hoặc chạy bộ duy trì thể lực',
        category: 'Health/Fitness' as GoalCategory,
        priority: 'high' as PriorityLevel,
        estimatedPomodoros: 2,
        notes: 'Khởi động kỹ, chạy bộ hoặc tập gym để giải phóng năng lượng.',
      },
      {
        title: 'Tổng kết ngày & lập kế hoạch 3 việc quan trọng ngày mai',
        category: 'Personal' as GoalCategory,
        priority: 'medium' as PriorityLevel,
        estimatedPomodoros: 1,
        notes: '10 phút nhìn lại các việc đã xong và dọn dẹp bàn học.',
      }
    ];

    for (const item of starterItems) {
      await createTask({
        title: item.title,
        category: item.category,
        priority: item.priority,
        date: today,
        completed: false,
        estimatedPomodoros: item.estimatedPomodoros,
        completedPomodoros: 0,
        notes: item.notes,
        subtasks: item.subtasks?.map((st, i) => ({
          id: `sub_${Date.now()}_${i}`,
          title: st,
          completed: false,
        })) || [],
      });
    }

    playTaskDoneSound();
    fireConfetti();
  };

  const toggleExpand = (id: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Category filter
      if (categoryFilter !== 'All' && task.category !== categoryFilter) return false;

      // Status filter
      if (statusFilter === 'active' && task.completed) return false;
      if (statusFilter === 'completed' && !task.completed) return false;

      // Date filter
      if (dateFilter === 'today' && task.date !== today) return false;
      if (dateFilter === 'tomorrow' && task.date !== tomorrow) return false;
      if (dateFilter === 'upcoming' && task.date <= today) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchNotes = (task.notes || '').toLowerCase().includes(q);
        if (!matchTitle && !matchNotes) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'priority') {
        const diff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
        if (diff !== 0) return diff;
        return a.date.localeCompare(b.date);
      }
      if (sortBy === 'date') {
        return a.date.localeCompare(b.date);
      }
      return a.title.localeCompare(b.title);
    });
  }, [tasks, categoryFilter, statusFilter, dateFilter, searchQuery, sortBy, today, tomorrow]);

  // Batch action: Reschedule unfinished today's tasks to tomorrow
  const handleRescheduleUnfinished = async () => {
    const unfinishedToday = tasks.filter(t => t.date === today && !t.completed);
    for (const t of unfinishedToday) {
      await updateTask(t.id, { date: tomorrow });
    }
  };

  // Batch action: Clear completed tasks
  const handleClearCompleted = async () => {
    const completedTasks = tasks.filter(t => t.completed);
    for (const t of completedTasks) {
      await deleteTask(t.id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 transition-colors">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Quản lý mục tiêu hàng ngày</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Xác định, sắp xếp độ ưu tiên và hoàn thành các mục tiêu quan trọng qua học tập, công việc và sức khỏe.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onNavigateToSchedule && (
            <button
              onClick={onNavigateToSchedule}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold text-xs shadow-2xs transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>Thời khóa biểu (.ics)</span>
              {calendarEventsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-blue-600 text-[10px] font-black text-white rounded-full">
                  {calendarEventsCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={handleLoadStarterPack}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs shadow-2xs transition-all cursor-pointer"
            title="Tự động thêm 5 mục tiêu học tập & rèn luyện chuẩn cho ngày hôm nay"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Nạp bộ việc sinh viên (+5)</span>
          </button>

          <button
            onClick={onOpenProposalsModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Gợi ý nhiệm vụ mẫu</span>
          </button>
          <button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm mục tiêu mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4 transition-colors">
        
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(['All', 'Study', 'Work', 'Health/Fitness', 'Personal'] as CategoryFilter[]).map((cat) => {
            const isActive = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat === 'All' ? 'Tất cả (All)' : cat}
              </button>
            );
          })}
        </div>

        {/* Search, Date, Status, and Sort Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          
          {/* Search box */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm mục tiêu hoặc ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 outline-hidden"
            />
          </div>

          {/* Date filter tabs */}
          <div className="lg:col-span-3 flex rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800 text-xs">
            {(['today', 'tomorrow', 'upcoming', 'all'] as DateFilter[]).map((df) => (
              <button
                key={df}
                onClick={() => setDateFilter(df)}
                className={`flex-1 py-1.5 font-semibold capitalize rounded-lg transition-colors cursor-pointer ${
                  dateFilter === df ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {df === 'today' ? 'Hôm nay' : df === 'tomorrow' ? 'Ngày mai' : df === 'upcoming' ? 'Sắp tới' : 'Tất cả'}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="lg:col-span-3 flex rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800 text-xs">
            {(['all', 'active', 'completed'] as StatusFilter[]).map((sf) => (
              <button
                key={sf}
                onClick={() => setStatusFilter(sf)}
                className={`flex-1 py-1.5 font-semibold capitalize rounded-lg transition-colors cursor-pointer ${
                  statusFilter === sf ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {sf === 'all' ? 'Toàn bộ' : sf === 'active' ? 'Đang làm' : 'Đã xong'}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 outline-hidden cursor-pointer"
            >
              <option value="priority">Ưu tiên cao</option>
              <option value="date">Theo ngày</option>
              <option value="title">Theo tên</option>
            </select>
          </div>
        </div>

        {/* Batch action quick links */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2">
          <span>Đang hiển thị {filteredTasks.length} mục tiêu</span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRescheduleUnfinished}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium cursor-pointer"
            >
              Chuyển việc chưa xong hôm nay sang ngày mai
            </button>
            <span>•</span>
            <button
              onClick={handleClearCompleted}
              className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors font-medium cursor-pointer"
            >
              Dọn dẹp việc đã hoàn thành
            </button>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-xs transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Không tìm thấy mục tiêu nào</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Hãy điều chỉnh bộ lọc hoặc chọn từ kho gợi ý nhiệm vụ mẫu để thêm việc nhanh.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2.5 flex-wrap">
              <button
                onClick={handleLoadStarterPack}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nạp 5 mục tiêu sinh viên mẫu</span>
              </button>

              {onNavigateToSchedule && (
                <button
                  onClick={onNavigateToSchedule}
                  className="px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>Thời khóa biểu Google Calendar (.ics)</span>
                </button>
              )}

              <button
                onClick={onOpenProposalsModal}
                className="px-4 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-xs hover:bg-amber-600 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Xem gợi ý nhiệm vụ</span>
              </button>

              <button
                onClick={() => {
                  setEditingTask(null);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Tạo mục tiêu mới
              </button>
            </div>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const catStyle = CATEGORY_STYLES[task.category] || CATEGORY_STYLES.Study;
            const isExpanded = expandedTaskIds.has(task.id);
            const subtasksCount = task.subtasks?.length || 0;
            const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;

            return (
              <div
                key={task.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-l-4 ${catStyle.border} shadow-xs hover:shadow-md transition-all overflow-hidden group`}
              >
                <div className="p-4 sm:p-5 flex items-start justify-between gap-4">
                  {/* Left: Checkbox & Info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="mt-0.5 text-slate-300 dark:text-slate-600 hover:text-emerald-500 transition-all shrink-0 cursor-pointer"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 hover:text-indigo-600" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      {/* Meta badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catStyle.badge}`}>
                          {task.category}
                        </span>

                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                          task.priority === 'high' ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900' :
                          task.priority === 'medium' ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {task.priority}
                        </span>

                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDateLabel(task.date)}
                        </span>

                        {task.estimatedPomodoros && (
                          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                            {task.completedPomodoros || 0}/{task.estimatedPomodoros} poms
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className={`text-base font-bold tracking-tight ${
                        task.completed ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-900 dark:text-white'
                      }`}>
                        {task.title}
                      </h3>

                      {/* Notes Preview */}
                      {task.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {task.notes}
                        </p>
                      )}

                      {/* Subtask pill indicator */}
                      {subtasksCount > 0 && (
                        <button
                          onClick={() => toggleExpand(task.id)}
                          className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          <span>Các bước: {completedSubtasks}/{subtasksCount}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!task.completed && (
                      <button
                        onClick={() => onStartFocusOnTask(task.id, task.title, task.category)}
                        title="Bắt đầu Focus Session"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Focus</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setIsModalOpen(true);
                      }}
                      title="Sửa mục tiêu"
                      className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                      title="Xóa mục tiêu"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Subtasks checklist */}
                {isExpanded && task.subtasks && task.subtasks.length > 0 && (
                  <div className="px-5 pb-4 pt-1 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Các bước triển khai</p>
                    <div className="space-y-1.5">
                      {task.subtasks.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                          onClick={async () => {
                            const updatedSubtasks = task.subtasks?.map(s => s.id === sub.id ? { ...s, completed: !s.completed } : s);
                            await updateTask(task.id, { subtasks: updatedSubtasks });
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={sub.completed}
                            onChange={() => {}}
                            className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                          <span className={sub.completed ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-800 dark:text-slate-200'}>
                            {sub.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Task Modal for create and edit */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={async (taskData) => {
          if (editingTask) {
            await updateTask(editingTask.id, taskData);
          } else {
            await createTask(taskData);
          }
        }}
        taskToEdit={editingTask}
      />
    </div>
  );
};
