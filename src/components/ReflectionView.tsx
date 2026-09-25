import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Save, 
  Calendar, 
  History,
  Smile,
  Meh,
  Frown,
  Zap
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { getTodayString, formatDateLabel } from '../utils/date';
import type { DailyReflection } from '../types';

const DISCIPLINE_RATINGS = [
  { score: 1, label: 'Xao nhãng / Chưa tốt', icon: Frown, color: 'text-rose-500' },
  { score: 2, label: 'Dưới kỳ vọng', icon: Meh, color: 'text-amber-500' },
  { score: 3, label: 'Tiến độ trung bình', icon: Smile, color: 'text-sky-500' },
  { score: 4, label: 'Kỷ luật vững vàng', icon: Zap, color: 'text-indigo-500' },
  { score: 5, label: 'Dòng chảy tập trung cao', icon: Sparkles, color: 'text-emerald-500' },
];

export const ReflectionView: React.FC = () => {
  const { reflections, saveReflection } = useData();

  const [date, setDate] = useState<string>(getTodayString());
  const [rating, setRating] = useState<number>(4);
  const [wins, setWins] = useState<string>('');
  const [challenges, setChallenges] = useState<string>('');
  const [tomorrowFocus, setTomorrowFocus] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load existing reflection for selected date if exists
  useEffect(() => {
    const existing = reflections.find(r => r.date === date);
    if (existing) {
      setRating(existing.rating);
      setWins(existing.wins || '');
      setChallenges(existing.challenges || '');
      setTomorrowFocus(existing.tomorrowFocus || '');
      setIsSaved(true);
    } else {
      setRating(4);
      setWins('');
      setChallenges('');
      setTomorrowFocus('');
      setIsSaved(false);
    }
  }, [date, reflections]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wins.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await saveReflection(rating, wins.trim(), challenges.trim(), tomorrowFocus.trim(), date);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Save reflection error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Tổng kết & Nhật ký kỷ luật ngày</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dành 5 phút cuối ngày: chấm điểm mức độ kỷ luật, ghi nhận chiến thắng và xác định trọng tâm ngày mai.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 focus:border-indigo-500 outline-hidden cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Reflection Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs transition-colors">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Rating Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                1. Điểm đánh giá mức độ kỷ luật & tập trung hôm nay
              </label>
              
              <div className="grid grid-cols-5 gap-2">
                {DISCIPLINE_RATINGS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = rating === item.score;
                  return (
                    <button
                      key={item.score}
                      type="button"
                      onClick={() => setRating(item.score)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${item.color}`} />
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{item.score} / 5</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight hidden sm:block">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Wins prompt */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                2. Những thành tựu & việc bạn đã hoàn thành xuất sắc hôm nay? *
              </label>
              <textarea
                required
                rows={3}
                placeholder="VD: Đã giải xong 2 bài cấu trúc dữ liệu, giữ vững chuỗi chạy bộ, hoàn tất review code PR #142..."
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-indigo-500 outline-hidden leading-relaxed placeholder-slate-400"
              />
            </div>

            {/* Obstacles & Energy prompt */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                3. Điều gì gây xao nhãng, cản trở hoặc làm bạn mất năng lượng?
              </label>
              <textarea
                rows={2}
                placeholder="VD: Dành quá nhiều thời gian lướt mạng xã hội lúc chiều, chưa uống đủ nước..."
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-indigo-500 outline-hidden leading-relaxed placeholder-slate-400"
              />
            </div>

            {/* Tomorrow's #1 Focus */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                4. Mục tiêu quan trọng nhất (#1 Non-Negotiable) cho ngày mai?
              </label>
              <input
                type="text"
                placeholder="VD: Hoàn tất bài tập lớn trước 12h trưa & tham gia họp sprint"
                value={tomorrowFocus}
                onChange={(e) => setTomorrowFocus(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-indigo-500 outline-hidden placeholder-slate-400"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {isSaved ? '✨ Đã lưu nhật ký thành công!' : 'Đánh giá mỗi tối trước khi đi ngủ'}
              </span>

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Đang lưu...' : 'Lưu nhật ký ngày'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* History of Past Journal Entries */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Lịch sử nhật ký</h3>
          </div>

          <div className="space-y-3">
            {reflections.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 text-center text-xs text-slate-500 dark:text-slate-400 shadow-xs transition-colors">
                Chưa có nhật ký nào được lưu. Hãy viết tổng kết ngày đầu tiên ở khung bên trái!
              </div>
            ) : (
              reflections
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 10)
                .map((ref) => (
                  <div
                    key={ref.id}
                    onClick={() => setDate(ref.date)}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border p-4.5 transition-all cursor-pointer shadow-xs ${
                      date === ref.date 
                        ? 'border-indigo-500 ring-2 ring-indigo-500/10 dark:ring-indigo-500/20' 
                        : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-white">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{formatDateLabel(ref.date)}</span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        Điểm: {ref.rating}/5
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed font-medium">
                      🎯 <span className="font-semibold text-slate-900 dark:text-white">Chiến thắng:</span> {ref.wins}
                    </p>

                    {ref.tomorrowFocus && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 italic">
                        Ngày mai: {ref.tomorrowFocus}
                      </p>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
