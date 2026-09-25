import React, { useState } from 'react';
import { 
  Flame, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Calendar, 
  Trophy, 
  Sparkles, 
  TrendingUp, 
  Check
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { getTodayString, generateHabitHeatmap } from '../utils/date';
import { HabitModal } from './HabitModal';
import type { Habit, GoalCategory } from '../types';

export const HabitsView: React.FC = () => {
  const { habits, createHabit, toggleHabitToday, deleteHabit } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const today = getTodayString();

  const filteredHabits = habits.filter(h => {
    if (selectedCategory !== 'All' && h.category !== selectedCategory) return false;
    return true;
  });

  const totalStreakDays = habits.reduce((acc, h) => acc + (h.currentStreak || 0), 0);
  const maxActiveStreak = habits.reduce((acc, h) => Math.max(acc, h.currentStreak || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 transition-colors">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-indigo-950/30 p-6 sm:p-8 rounded-3xl border border-amber-200/60 dark:border-amber-900/60 shadow-xs transition-colors">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold shadow-xs">
            <Flame className="w-3.5 h-3.5 fill-white" />
            <span>Habit Consistency Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Giữ vững chuỗi thói quen (Streak) 🔥
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Thành công là tích lũy từ những thói quen kỷ luật mỗi ngày. Theo dõi tiến độ trực quan với ma trận 35 ngày.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo thói quen mới</span>
        </button>
      </div>

      {/* Streak KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chuỗi kỷ lục</p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
              <span>{maxActiveStreak}</span>
              <span className="text-xs text-amber-500 font-bold uppercase">Ngày liên tục</span>
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-500">
            <Flame className="w-6 h-6 fill-amber-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng ngày rèn luyện</p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
              <span>{totalStreakDays}</span>
              <span className="text-xs text-indigo-500 font-bold uppercase">Ngày tích lũy</span>
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Điểm danh hôm nay</p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
              <span>
                {habits.filter(h => (h.completedDates || []).includes(today)).length}/{habits.length}
              </span>
              <span className="text-xs text-emerald-500 font-bold uppercase">Đã check-in</span>
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', 'Study', 'Work', 'Health/Fitness', 'Personal'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {cat === 'All' ? 'Tất cả' : cat}
          </button>
        ))}
      </div>

      {/* Habit List with 35-Day Heatmap Matrix */}
      <div className="space-y-4">
        {filteredHabits.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-xs transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-500 flex items-center justify-center mx-auto mb-3">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Chưa có thói quen nào</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Bắt đầu với thói quen đơn giản: đọc sách 20 phút, lập trình 1 tiếng hoặc uống đủ 2L nước.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-white font-semibold text-xs hover:bg-amber-600 transition-colors cursor-pointer"
            >
              Tạo thói quen đầu tiên
            </button>
          </div>
        ) : (
          filteredHabits.map((habit) => {
            const isCompletedToday = (habit.completedDates || []).includes(today);
            const heatmapItems = generateHabitHeatmap(habit.completedDates || [], 35);
            const streakColor = habit.color || '#f97316';

            return (
              <div
                key={habit.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                {/* Habit Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: `${streakColor}15`, color: streakColor }}
                    >
                      <Flame className="w-6 h-6 fill-current" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {habit.category}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 capitalize">
                          {habit.frequency}
                        </span>
                        {habit.bestStreak > 0 && (
                          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-200 dark:border-amber-800">
                            <Trophy className="w-3 h-3 text-amber-500" />
                            Kỷ lục: {habit.bestStreak}d
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{habit.title}</h3>
                      {habit.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{habit.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions & Streak Badge */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    {/* Streak pill */}
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end text-lg font-extrabold text-amber-600 dark:text-amber-400">
                        <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
                        <span>{habit.currentStreak || 0}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ngày liên tiếp</p>
                    </div>

                    {/* Today Check-In Button */}
                    <button
                      onClick={() => toggleHabitToday(habit.id)}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                        isCompletedToday
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isCompletedToday ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Đã check-in</span>
                        </>
                      ) : (
                        <span>Điểm danh</span>
                      )}
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      title="Xóa thói quen"
                      className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 35-Day Consistency Heatmap Grid */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Ma trận điểm danh 35 ngày qua</span>
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Nhấp vào ô để thay đổi điểm danh</span>
                  </div>

                  {/* Heatmap Squares */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {heatmapItems.map((item) => (
                      <button
                        key={item.date}
                        onClick={() => toggleHabitToday(habit.id, item.date)}
                        title={`${item.formatted} - ${item.isCompleted ? 'Đã xong' : 'Chưa xong'} (Nhấp để bật/tắt)`}
                        className={`w-5 h-5 rounded-md transition-all active:scale-90 cursor-pointer ${
                          item.isCompleted
                            ? 'shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700/50'
                        } ${item.isToday ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900' : ''}`}
                        style={{
                          backgroundColor: item.isCompleted ? streakColor : undefined
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <HabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (data) => {
          await createHabit(data);
        }}
      />
    </div>
  );
};
