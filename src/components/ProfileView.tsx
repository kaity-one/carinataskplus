import React, { useState } from 'react';
import { 
  User, 
  Save, 
  LogOut, 
  Flame, 
  CheckCircle2, 
  Timer, 
  BookOpen, 
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Luna',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Quantum',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Carina',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Atlas',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Nova',
];

export const ProfileView: React.FC = () => {
  const { userProfile, updateUserProfile, signOut } = useAuth();
  const { tasks, habits, focusSessions, reflections } = useData();
  const { theme, toggleTheme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [role, setRole] = useState(userProfile?.role || 'Developer');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [dailyFocusTarget, setDailyFocusTarget] = useState<number>(userProfile?.dailyFocusTargetMinutes || 100);
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatarUrl || PRESET_AVATARS[0]);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Lifetime metrics calculation
  const totalTasksCompleted = tasks.filter(t => t.completed).length;
  const longestStreakEver = habits.reduce((max, h) => Math.max(max, h.bestStreak || 0), 0);
  const totalFocusMinutes = focusSessions
    .filter(s => s.sessionType === 'focus')
    .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);
  const totalReflections = reflections.length;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        role,
        bio: bio.trim(),
        dailyFocusTargetMinutes: dailyFocusTarget,
        avatarUrl,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Profile update failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Hồ sơ & Chỉ tiêu cá nhân</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tùy chỉnh không gian làm việc, định mức focus hàng ngày và thống kê kỷ luật.
          </p>
        </div>

        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold text-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>

      {/* Lifetime Accomplishments Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{totalTasksCompleted}</p>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Mục tiêu đã xong</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center transition-colors">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-500 flex items-center justify-center mx-auto mb-2">
            <Flame className="w-5 h-5 fill-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{longestStreakEver}d</p>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Kỷ lục chuỗi ngày</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center transition-colors">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2">
            <Timer className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{totalFocusHours}h</p>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Giờ Deep Focus</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center transition-colors">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-2">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{totalReflections}</p>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Số lần tổng kết ngày</p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs transition-colors">
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Theme Mode Preference Section */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
              Giao diện trang web (Chế độ Sáng / Tối)
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Chế độ Sáng (Light)</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>Chế độ Tối (Dark)</span>
              </button>
            </div>
          </div>

          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              Ảnh đại diện (Avatar)
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              {PRESET_AVATARS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAvatarUrl(url)}
                  className={`w-14 h-14 rounded-2xl overflow-hidden p-1 border-2 transition-all cursor-pointer ${
                    avatarUrl === url 
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md scale-105' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <img src={url} alt="Avatar option" className="w-full h-full object-cover rounded-xl" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Tên hiển thị
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-indigo-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Định hướng / Vai trò chính
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-indigo-500 outline-hidden"
              >
                <option value="Developer">Lập trình viên phần mềm (Software Developer)</option>
                <option value="Student">Sinh viên / Người nghiên cứu (Student & Research)</option>
                <option value="Professional">Chuyên viên / Doanh nghiệp (Professional)</option>
                <option value="Health/Fitness">Người rèn luyện sức khỏe (Fitness Enthusiast)</option>
                <option value="Creator">Nhà sáng tạo nội dung (Content Creator)</option>
              </select>
            </div>
          </div>

          {/* Daily Focus Target */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Định mức Focus mỗi ngày (Mục tiêu phút / ngày)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { min: 50, label: '50m (2 Poms)' },
                { min: 100, label: '100m (4 Poms)' },
                { min: 150, label: '150m (6 Poms)' },
                { min: 200, label: '200m (8 Poms)' },
              ].map((item) => (
                <button
                  key={item.min}
                  type="button"
                  onClick={() => setDailyFocusTarget(item.min)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    dailyFocusTarget === item.min
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Motto / Bio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Châm ngôn hành động / Tiểu sử
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="VD: Tập trung vào thói quen hàng ngày, xây dựng kỷ luật bền vững."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:border-indigo-500 outline-hidden placeholder-slate-400"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isSaved ? '✅ Đã lưu cài đặt thành công!' : 'Tùy chọn được lưu vào bộ nhớ đám mây của bạn'}
            </span>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Đang lưu...' : 'Cập nhật hồ sơ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
