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
  Moon,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Mail,
  Copy,
  Check,
  RefreshCw,
  Calendar,
  Lock,
  ExternalLink,
  UploadCloud,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { uploadUserAvatar } from '../firebase/storage';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Luna',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Quantum',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Carina',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Atlas',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Nova',
];

export const ProfileView: React.FC = () => {
  const { 
    user, 
    userProfile, 
    isGuest, 
    updateUserProfile, 
    signOut,
    sendVerificationEmail,
    sendPasswordReset,
    reloadUser 
  } = useAuth();
  const { tasks, habits, focusSessions, reflections } = useData();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [role, setRole] = useState(userProfile?.role || 'Developer');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [dailyFocusTarget, setDailyFocusTarget] = useState<number>(userProfile?.dailyFocusTargetMinutes || 100);
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatarUrl || PRESET_AVATARS[0]);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auth actions state
  const [copiedUid, setCopiedUid] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);
  const [isResettingPass, setIsResettingPass] = useState(false);
  const [passNotice, setPassNotice] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  // Cloud Storage Avatar Upload state
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsUploadingAvatar(true);
    try {
      const downloadUrl = await uploadUserAvatar(user?.uid || 'guest_user', file);
      setAvatarUrl(downloadUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tải ảnh lên thất bại';
      setUploadError(msg);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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

  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleSendVerification = async () => {
    setIsVerifying(true);
    setVerifyNotice(null);
    try {
      await sendVerificationEmail();
      setVerifyNotice('Đã gửi email xác thực! Vui lòng kiểm tra hộp thư đến (và thư mục Spam).');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gửi email xác thực';
      setVerifyNotice(`Lỗi: ${msg}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) return;
    setIsResettingPass(true);
    setPassNotice(null);
    try {
      await sendPasswordReset(user.email);
      setPassNotice(`Đã gửi email đặt lại mật khẩu đến ${user.email}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gửi yêu cầu đặt lại mật khẩu';
      setPassNotice(`Lỗi: ${msg}`);
    } finally {
      setIsResettingPass(false);
    }
  };

  const handleReloadAuth = async () => {
    setIsReloading(true);
    try {
      await reloadUser();
    } catch (err) {
      console.error("Reload user error:", err);
    } finally {
      setIsReloading(false);
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

          {/* Avatar Selector & Cloud Storage Upload */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Ảnh đại diện (Avatar)
              </label>

              {/* Cloud Storage File Upload Trigger */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className={`w-3.5 h-3.5 ${isUploadingAvatar ? 'animate-bounce text-indigo-500' : ''}`} />
                  <span>{isUploadingAvatar ? 'Đang tải ảnh lên Cloud Storage...' : 'Tải ảnh từ máy (Cloud Storage)'}</span>
                </button>
              </div>
            </div>

            {uploadError && (
              <p className="text-xs text-rose-500 dark:text-rose-400 mb-2">
                ⚠️ {uploadError}
              </p>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              {/* If current avatar is custom uploaded, show it prominently */}
              {!PRESET_AVATARS.includes(avatarUrl) && (
                <div className="relative group">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden p-0.5 border-2 border-indigo-600 ring-2 ring-indigo-500/30 shadow-md">
                    <img src={avatarUrl} alt="Custom avatar" className="w-full h-full object-cover rounded-xl" />
                  </div>
                  <span className="absolute -top-1.5 -right-1 px-1.5 py-0.5 bg-indigo-600 text-[9px] font-bold text-white rounded-full uppercase tracking-tighter shadow-xs">
                    Tùy chọn
                  </span>
                </div>
              )}

              {/* Preset Avatars */}
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
                  <img src={url} alt={`Preset ${i + 1}`} className="w-full h-full object-cover rounded-xl" />
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Hỗ trợ ảnh JPG, PNG, WebP (tối đa 5MB) lưu trữ an toàn trên Google Cloud Storage.
            </p>
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

      {/* Firebase Authentication & Identity Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tài khoản & Xác thực (Firebase Auth)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thông tin định danh người dùng và bảo mật hệ thống đám mây
              </p>
            </div>
          </div>

          {user && (
            <button
              type="button"
              onClick={handleReloadAuth}
              disabled={isReloading}
              title="Làm mới trạng thái xác thực từ Firebase"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin text-indigo-500' : ''}`} />
              <span>{isReloading ? 'Đang kiểm tra...' : 'Đồng bộ'}</span>
            </button>
          )}
        </div>

        {isGuest ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Đang hoạt động ở chế độ Khách (Guest Mode)</span>
            </div>
            <p>
              Dữ liệu của bạn hiện đang được lưu trên trình duyệt máy này. Để đồng bộ dữ liệu lên Firebase Firestore và truy cập trên mọi thiết bị, bạn hãy đăng xuất và đăng nhập bằng Google hoặc tài khoản Email.
            </p>
            <button
              onClick={() => signOut()}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng nhập tài khoản chính thức</span>
            </button>
          </div>
        ) : user ? (
          <div className="space-y-5">
            {/* Notices */}
            {verifyNotice && (
              <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{verifyNotice}</span>
              </div>
            )}

            {passNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{passNotice}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Firebase User UID */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Firebase UID
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyUid(user.uid)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {copiedUid ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUid ? 'Đã sao chép' : 'Sao chép UID'}</span>
                  </button>
                </div>
                <p className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate select-all">
                  {user.uid}
                </p>
              </div>

              {/* Email & Verification status */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Email & Trạng thái xác thực
                  </span>
                  {user.emailVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      <ShieldCheck className="w-3 h-3" />
                      Đã xác thực
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                      <ShieldAlert className="w-3 h-3" />
                      Chưa xác thực
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {user.email || 'Không có email'}
                  </p>
                  {!user.emailVerified && (
                    <button
                      type="button"
                      onClick={handleSendVerification}
                      disabled={isVerifying}
                      className="shrink-0 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {isVerifying ? 'Đang gửi...' : 'Gửi link xác thực'}
                    </button>
                  )}
                </div>
              </div>

              {/* Linked Provider */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Nhà cung cấp danh tính (Provider)
                </span>
                <div className="space-y-1.5">
                  {user.providerData && user.providerData.length > 0 ? (
                    user.providerData.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {p.providerId === 'google.com' ? 'Google Account' :
                           p.providerId === 'password' ? 'Email & Mật khẩu' :
                           p.providerId}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          ID: {p.providerId}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">Mặc định Firebase Auth</span>
                  )}
                </div>
              </div>

              {/* Account Timestamps */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Lịch sử truy cập
                </span>
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tạo tài khoản:</span>
                    <span className="font-mono text-[11px]">
                      {user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Đăng nhập gần nhất:</span>
                    <span className="font-mono text-[11px]">
                      {user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Reset action for Email/Password accounts */}
            {user.email && user.providerData.some(p => p.providerId === 'password') && (
              <div className="pt-2 flex items-center justify-between">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Cần thay đổi hoặc cài đặt lại mật khẩu cho tài khoản này?
                </div>
                <button
                  type="button"
                  onClick={handleSendPasswordReset}
                  disabled={isResettingPass}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isResettingPass ? 'Đang gửi...' : 'Gửi email đổi mật khẩu'}</span>
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
