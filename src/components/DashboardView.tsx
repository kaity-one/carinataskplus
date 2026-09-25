import React, { useMemo } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Flame, 
  Timer, 
  Sparkles, 
  ArrowUpRight, 
  TrendingUp, 
  Calendar, 
  Plus, 
  Play, 
  Zap, 
  Target, 
  Clock, 
  Lightbulb,
  GraduationCap,
  Briefcase,
  Activity,
  Compass,
  Award,
  Check,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getTodayString, formatDateLabel, MOTIVATIONAL_QUOTES } from '../utils/date';
import type { ViewTab, GoalCategory } from '../types';

interface DashboardViewProps {
  onNavigate: (tab: ViewTab) => void;
  onStartFocusOnTask: (taskId: string, title: string, category: string) => void;
  onOpenNewTaskModal: () => void;
  onOpenProposalsModal: () => void;
}

const CATEGORY_COLORS: Record<GoalCategory, { bg: string; text: string; bar: string; badge: string; border: string }> = {
  Study: { 
    bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', 
    text: 'text-blue-600 dark:text-blue-400', 
    bar: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800'
  },
  Work: { 
    bg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800', 
    text: 'text-indigo-600 dark:text-indigo-400', 
    bar: 'bg-indigo-500',
    badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800'
  },
  'Health/Fitness': { 
    bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', 
    text: 'text-emerald-600 dark:text-emerald-400', 
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800'
  },
  Personal: { 
    bg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800', 
    text: 'text-purple-600 dark:text-purple-400', 
    bar: 'bg-purple-500',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800'
  },
};

const CATEGORY_ICONS: Record<GoalCategory, React.ElementType> = {
  Study: GraduationCap,
  Work: Briefcase,
  'Health/Fitness': Activity,
  Personal: Compass,
};

const CATEGORY_NAMES_VN: Record<GoalCategory, string> = {
  Study: 'Học tập (Study)',
  Work: 'Công việc (Work)',
  'Health/Fitness': 'Sức khỏe & Thể lực',
  Personal: 'Cá nhân & Đời sống',
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onStartFocusOnTask,
  onOpenNewTaskModal,
  onOpenProposalsModal,
}) => {
  const { userProfile } = useAuth();
  const { 
    tasks, 
    habits, 
    focusSessions, 
    toggleTask, 
    toggleHabitToday, 
    seedInitialDataIfEmpty 
  } = useData();

  const today = getTodayString();
  const todayLabel = formatDateLabel(today);

  // Pick quote based on day
  const dailyQuote = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
  }, []);

  // Today's tasks across all categories
  const todayTasks = useMemo(() => {
    return tasks.filter(t => t.date === today);
  }, [tasks, today]);

  const completedTodayTasks = useMemo(() => {
    return todayTasks.filter(t => t.completed);
  }, [todayTasks]);

  const remainingTodayTasks = todayTasks.length - completedTodayTasks.length;

  const completionPercentage = todayTasks.length > 0 
    ? Math.round((completedTodayTasks.length / todayTasks.length) * 100) 
    : 0;

  // Breakdown across all 4 categories specifically for TODAY's date
  const todayCategoryStats = useMemo(() => {
    const counts: Record<GoalCategory, { total: number; completed: number; pomsPlanned: number; pomsDone: number }> = {
      Study: { total: 0, completed: 0, pomsPlanned: 0, pomsDone: 0 },
      Work: { total: 0, completed: 0, pomsPlanned: 0, pomsDone: 0 },
      'Health/Fitness': { total: 0, completed: 0, pomsPlanned: 0, pomsDone: 0 },
      Personal: { total: 0, completed: 0, pomsPlanned: 0, pomsDone: 0 },
    };

    todayTasks.forEach(t => {
      if (counts[t.category]) {
        counts[t.category].total += 1;
        if (t.completed) counts[t.category].completed += 1;
        counts[t.category].pomsPlanned += (t.estimatedPomodoros || 0);
        counts[t.category].pomsDone += (t.completedPomodoros || 0);
      }
    });

    return counts;
  }, [todayTasks]);

  // Pomodoros planned and completed today
  const todayPomsPlanned = useMemo(() => {
    return todayTasks.reduce((sum, t) => sum + (t.estimatedPomodoros || 0), 0);
  }, [todayTasks]);

  const todayPomsCompleted = useMemo(() => {
    return todayTasks.reduce((sum, t) => sum + (t.completedPomodoros || 0), 0);
  }, [todayTasks]);

  // Habits active today
  const habitsSummary = useMemo(() => {
    let completedCount = 0;
    const items = habits.map(h => {
      const isDone = (h.completedDates || []).includes(today);
      if (isDone) completedCount++;
      return { ...h, isDoneToday: isDone };
    });
    return { items, completedCount, total: habits.length };
  }, [habits, today]);

  // Focus time logged today
  const focusTodayMinutes = useMemo(() => {
    return focusSessions
      .filter(s => s.date === today && s.sessionType === 'focus')
      .reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  }, [focusSessions, today]);

  const targetMinutes = userProfile?.dailyFocusTargetMinutes || 100;
  const focusProgress = Math.min(100, Math.round((focusTodayMinutes / targetMinutes) * 100));

  // Overall lifetime category distribution (for side balance card)
  const lifetimeCategoryStats = useMemo(() => {
    const counts: Record<GoalCategory, { total: number; completed: number }> = {
      Study: { total: 0, completed: 0 },
      Work: { total: 0, completed: 0 },
      'Health/Fitness': { total: 0, completed: 0 },
      Personal: { total: 0, completed: 0 },
    };

    tasks.forEach(t => {
      if (counts[t.category]) {
        counts[t.category].total += 1;
        if (t.completed) counts[t.category].completed += 1;
      }
    });

    return counts;
  }, [tasks]);

  // Motivational badge & text based on today's completion percentage
  const progressBadge = useMemo(() => {
    if (todayTasks.length === 0) {
      return {
        label: 'Chưa có mục tiêu',
        color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        advice: 'Hãy đặt từ 2-4 mục tiêu trọng tâm hôm nay để thiết lập đà làm việc năng suất.',
      };
    }
    if (completionPercentage === 100) {
      return {
        label: 'Hoàn thành 100% Xuất sắc!',
        color: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
        advice: 'Tuyệt đỉnh! Bạn đã hoàn tất mọi mục tiêu trong ngày. Hãy dành thời gian nghỉ ngơi và ghi chép nhật ký reflection.',
      };
    }
    if (completionPercentage >= 75) {
      return {
        label: 'Gần cán đích (75%+)',
        color: 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
        advice: 'Chỉ còn một vài nhiệm vụ nữa! Duy trì chuỗi tập trung để khép lại một ngày thắng lợi.',
      };
    }
    if (completionPercentage >= 50) {
      return {
        label: 'Đã vượt nửa chặng đường',
        color: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
        advice: 'Bạn đang đi đúng hướng! Hãy kích hoạt phiên Pomodoro tiếp theo để giải quyết nốt các mục tiêu còn lại.',
      };
    }
    if (completionPercentage > 0) {
      return {
        label: 'Đang tạo đà bứt phá',
        color: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
        advice: 'Bước khởi đầu thành công. Hãy giữ vững sự tập trung và tránh đa nhiệm để gia tăng tỷ lệ hoàn thành.',
      };
    }
    return {
      label: 'Sẵn sàng chinh phục',
      color: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700',
      advice: 'Danh sách mục tiêu hôm nay đã sẵn sàng. Hãy chọn mục tiêu ưu tiên cao nhất và bắt đầu ngay!',
    };
  }, [completionPercentage, todayTasks.length]);

  // Circular gauge circumference
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 transition-colors">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Keep the streak alive!</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Xin chào, {userProfile?.displayName?.split(' ')[0] || 'Achiever'}! 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            "{dailyQuote.text}" <span className="font-semibold text-slate-700 dark:text-slate-300">— {dailyQuote.author}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            onClick={onOpenProposalsModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Gợi ý nhiệm vụ</span>
          </button>
          <button
            onClick={onOpenNewTaskModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm mục tiêu</span>
          </button>
          <button
            onClick={() => onNavigate('focus')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
          >
            <Timer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Bấm giờ Focus</span>
          </button>
        </div>
      </div>

      {/* Empty State Banner if user has 0 tasks and 0 habits */}
      {tasks.length === 0 && habits.length === 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-50 via-emerald-50 to-amber-50 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Khởi động bảng điều khiển năng suất</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Nạp ngay các mục tiêu & thói quen gợi ý chất lượng cho lập trình, học tập và rèn luyện thể lực.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenProposalsModal}
              className="px-4 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-xs hover:bg-amber-600 shadow-sm shrink-0 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Xem gợi ý nhiệm vụ</span>
            </button>
            <button
              onClick={() => seedInitialDataIfEmpty()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 shadow-sm shrink-0 transition-all cursor-pointer"
            >
              Tải bộ mẫu có sẵn
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FEATURED: DAILY SUMMARY STATS CARD ACROSS ALL CATEGORIES FOR CURRENT DATE */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-8 transition-colors relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/5 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Thống kê tổng hợp ngày hôm nay
                </h2>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${progressBadge.color}`}>
                  {progressBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Ngày hiện tại: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{todayLabel} ({today})</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => onNavigate('goals')}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Quản lý chi tiết</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Content Grid: Overall Completion Gauge + Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 relative z-10 items-center">
          
          {/* Left Column (5 cols): Overall Gauge & Metrics */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 bg-slate-50/70 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
            {/* Circular Progress Gauge */}
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-slate-200 dark:stroke-slate-700"
                  strokeWidth="9"
                  fill="transparent"
                />
                {/* Active Progress Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-emerald-500 transition-all duration-700 ease-out"
                  strokeWidth="9"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                  {completionPercentage}%
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
                  Đã hoàn thành
                </span>
              </div>
            </div>

            {/* Overall Metrics Summary */}
            <div className="space-y-3 min-w-0 w-full">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tổng số mục tiêu hôm nay</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {completedTodayTasks.length} / {todayTasks.length}
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    ({completionPercentage}% xong)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-medium">Còn lại</span>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {remainingTodayTasks} mục tiêu
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-medium">Pomodoros</span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {todayPomsCompleted} / {todayPomsPlanned} phiên
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Category-by-Category Breakdown */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>Tỷ lệ hoàn thành theo danh mục (Hôm nay)</span>
              <span>Đạt / Tổng</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(todayCategoryStats) as GoalCategory[]).map((cat) => {
                const stat = todayCategoryStats[cat];
                const pct = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
                const colors = CATEGORY_COLORS[cat];
                const IconComponent = CATEGORY_ICONS[cat];
                const hasTasks = stat.total > 0;

                return (
                  <div 
                    key={cat}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      hasTasks 
                        ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700' 
                        : 'bg-slate-50/20 dark:bg-slate-800/10 border-dashed border-slate-200 dark:border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border ${colors.bg}`}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                            {cat}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {CATEGORY_NAMES_VN[cat].split(' (')[0]}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-xs font-extrabold ${pct === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                          {pct}%
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight">
                          {stat.completed}/{stat.total}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200/70 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${hasTasks ? colors.bar : 'bg-transparent'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Extra context badge */}
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span>
                        {hasTasks 
                          ? (pct === 100 ? '✓ Đã hoàn tất' : `${stat.total - stat.completed} việc cần làm`)
                          : 'Chưa có task hôm nay'
                        }
                      </span>
                      {stat.pomsPlanned > 0 && (
                        <span className="flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
                          <Timer className="w-2.5 h-2.5" />
                          {stat.pomsDone}/{stat.pomsPlanned} poms
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Card Footer: Contextual advice */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{progressBadge.advice}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenNewTaskModal}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              + Thêm mục tiêu hôm nay
            </button>
            <span>•</span>
            <button
              onClick={onOpenProposalsModal}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Xem mẫu gợi ý
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Daily Completion Rate */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mục tiêu hôm nay</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{completionPercentage}%</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              ({completedTodayTasks.length}/{todayTasks.length} xong)
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Habit Streaks Active */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-amber-300 dark:hover:border-amber-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Thói quen điểm danh</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {habitsSummary.completedCount}/{habitsSummary.total}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">thói quen xong hôm nay</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${habitsSummary.total > 0 ? (habitsSummary.completedCount / habitsSummary.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Focus Time Today */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Thời gian Focus</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Timer className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{focusTodayMinutes}m</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/ {targetMinutes}m mục tiêu</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${focusProgress}%` }}
            />
          </div>
        </div>

        {/* Longest Active Streak */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-purple-300 dark:hover:border-purple-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chuỗi kỷ lục</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {habits.reduce((max, h) => Math.max(max, h.currentStreak || 0), 0)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">ngày liên tục 🔥</span>
          </div>
          <div className="mt-3 text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kỷ luật tạo nên tự do</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Priorities & Habit Check-ins */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 7 cols: Today's Daily Goals */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mục tiêu hôm nay</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {todayTasks.length}
              </span>
            </div>
            <button
              onClick={() => onNavigate('goals')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Xem tất cả mục tiêu</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden transition-colors">
            {todayTasks.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Chưa có mục tiêu nào hôm nay</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Thêm nhiệm vụ mới hoặc chọn từ kho gợi ý nhiệm vụ mẫu để duy trì đà tiến độ.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={onOpenProposalsModal}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-white font-semibold text-xs hover:bg-amber-600 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Gợi ý nhiệm vụ</span>
                  </button>
                  <button
                    onClick={onOpenNewTaskModal}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    Tạo mục tiêu mới
                  </button>
                </div>
              </div>
            ) : (
              todayTasks.map((task) => {
                const catStyle = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.Study;
                return (
                  <div
                    key={task.id}
                    className="p-4 sm:p-5 flex items-start justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="mt-0.5 shrink-0 transition-transform active:scale-90 cursor-pointer"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-indigo-500" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catStyle.bg}`}>
                            {catStyle ? task.category : 'General'}
                          </span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.2 rounded-md ${
                            task.priority === 'high' ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900' :
                            task.priority === 'medium' ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {task.priority}
                          </span>
                          {task.estimatedPomodoros && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-medium">
                              <Timer className="w-3 h-3 text-indigo-500" />
                              {task.completedPomodoros || 0}/{task.estimatedPomodoros} poms
                            </span>
                          )}
                        </div>

                        <p className={`text-sm font-semibold leading-snug truncate ${
                          task.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'
                        }`}>
                          {task.title}
                        </p>

                        {task.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{task.notes}</p>
                        )}
                      </div>
                    </div>

                    {!task.completed && (
                      <button
                        onClick={() => onStartFocusOnTask(task.id, task.title, task.category)}
                        title="Bắt đầu Focus Timer cho mục tiêu này"
                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 5 cols: Habits Today & Lifetime Balance */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Habit quick checks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Thói quen hôm nay</h2>
              </div>
              <button
                onClick={() => onNavigate('habits')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Ma trận Streak</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3 transition-colors">
              {habits.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Chưa có thói quen nào.</p>
                  <button
                    onClick={() => onNavigate('habits')}
                    className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    + Tạo thói quen đầu tiên
                  </button>
                </div>
              ) : (
                habits.map((habit) => {
                  const isDoneToday = (habit.completedDates || []).includes(today);
                  return (
                    <div
                      key={habit.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{habit.title}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-semibold">
                            <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                            {habit.currentStreak || 0}d streak
                          </span>
                          <span>•</span>
                          <span className="capitalize">{habit.frequency}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleHabitToday(habit.id)}
                        className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                          isDoneToday
                            ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/20'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-400 hover:text-amber-600'
                        }`}
                      >
                        {isDoneToday ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Xong!</span>
                          </>
                        ) : (
                          <span>Điểm danh</span>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Lifetime Category distribution breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Cân bằng mục tiêu cuộc sống (Tổng thể)</span>
            </h3>

            <div className="space-y-3">
              {(Object.keys(lifetimeCategoryStats) as GoalCategory[]).map((cat) => {
                const stat = lifetimeCategoryStats[cat];
                const pct = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
                const config = CATEGORY_COLORS[cat];
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>{cat}</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {stat.completed}/{stat.total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`${config.bar} h-full rounded-full transition-all duration-300`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
