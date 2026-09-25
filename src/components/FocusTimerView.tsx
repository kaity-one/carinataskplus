import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Timer, 
  Coffee, 
  Zap, 
  Volume2, 
  VolumeX, 
  Clock 
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { playTimerCompleteSound } from '../utils/audio';
import { fireConfetti } from '../utils/confetti';
import { getTodayString } from '../utils/date';

interface FocusTimerViewProps {
  initialTaskId?: string | null;
  initialTaskTitle?: string | null;
  initialCategory?: string | null;
}

type SessionMode = 'focus' | 'shortBreak' | 'longBreak';

const PRESET_DURATIONS: Record<SessionMode, number> = {
  focus: 25 * 60, // 25 min
  shortBreak: 5 * 60, // 5 min
  longBreak: 15 * 60, // 15 min
};

export const FocusTimerView: React.FC<FocusTimerViewProps> = ({
  initialTaskId,
  initialTaskTitle,
  initialCategory,
}) => {
  const { tasks, focusSessions, logFocusSession } = useData();

  const [mode, setMode] = useState<SessionMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(PRESET_DURATIONS.focus);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Selected task link
  const [selectedTaskId, setSelectedTaskId] = useState<string>(initialTaskId || '');

  const today = getTodayString();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Active task details
  const activeTask = tasks.find(t => t.id === selectedTaskId);

  // When initial props change from dashboard
  useEffect(() => {
    if (initialTaskId) {
      setSelectedTaskId(initialTaskId);
    }
  }, [initialTaskId]);

  // Mode switcher handler
  const switchMode = (newMode: SessionMode) => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(PRESET_DURATIONS[newMode]);
  };

  // Timer interval effect
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Completed session
      setIsActive(false);
      if (soundEnabled) {
        playTimerCompleteSound();
      }
      fireConfetti();

      // Log session
      const durationMins = Math.round(PRESET_DURATIONS[mode] / 60);
      logFocusSession(
        durationMins,
        mode,
        selectedTaskId || undefined,
        activeTask?.title || initialTaskTitle || undefined,
        activeTask?.category || initialCategory || 'Work'
      );

      // Transition to break if focus, or back to focus if break
      if (mode === 'focus') {
        setMode('shortBreak');
        setTimeLeft(PRESET_DURATIONS.shortBreak);
      } else {
        setMode('focus');
        setTimeLeft(PRESET_DURATIONS.focus);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode, soundEnabled, selectedTaskId, activeTask, initialTaskTitle, initialCategory, logFocusSession]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(PRESET_DURATIONS[mode]);
  };

  // Format mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Progress percentage
  const totalDuration = PRESET_DURATIONS[mode];
  const progressPercent = Math.round(((totalDuration - timeLeft) / totalDuration) * 100);

  // Today's focus sessions
  const todaySessions = focusSessions.filter(s => s.date === today);
  const todayTotalFocusMinutes = todaySessions
    .filter(s => s.sessionType === 'focus')
    .reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Timer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Đồng hồ Pomodoro & Tập trung sâu</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Loại bỏ phiền nhiễu và đắm chìm vào trạng thái Deep Flow với các chu kỳ tập trung chuẩn xác.
          </p>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            soundEnabled 
              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' 
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span>{soundEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}</span>
        </button>
      </div>

      {/* Main Timer Dial Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-12 shadow-sm text-center relative overflow-hidden transition-colors">
        
        {/* Mode Selector Tabs */}
        <div className="inline-flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-8 border border-slate-200/60 dark:border-slate-700 max-w-md w-full justify-center">
          <button
            onClick={() => switchMode('focus')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'focus' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tập trung (25m)
          </button>
          <button
            onClick={() => switchMode('shortBreak')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'shortBreak' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Nghỉ ngắn (5m)
          </button>
          <button
            onClick={() => switchMode('longBreak')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'longBreak' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Nghỉ dài (15m)
          </button>
        </div>

        {/* Linked Goal Selector */}
        <div className="max-w-md mx-auto mb-8 text-left">
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 text-center">
            Đang thực hiện cho mục tiêu:
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:border-indigo-500 outline-hidden text-center font-medium cursor-pointer"
          >
            <option value="">Tự do tập trung (Không gắn mục tiêu cụ thể)</option>
            {tasks.filter(t => !t.completed).map(t => (
              <option key={t.id} value={t.id}>
                [{t.category}] {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Large Time Display with JetBrains Mono font */}
        <div className="my-6">
          <div className="font-mono text-7xl sm:text-8xl font-black text-slate-900 dark:text-white tracking-tighter select-none">
            {timeFormatted}
          </div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-3">
            {mode === 'focus' ? '🎯 Giữ tập trung tối đa' : '☕ Thư giãn và tái tạo năng lượng não bộ'}
          </p>
        </div>

        {/* Circular / Linear Progress Bar */}
        <div className="max-w-md mx-auto my-6">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                mode === 'focus' ? 'bg-indigo-600' : mode === 'shortBreak' ? 'bg-emerald-500' : 'bg-purple-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-1.5">
            <span>Tiến độ: {progressPercent}%</span>
            <span>Còn lại {Math.round(timeLeft / 60)} phút</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={resetTimer}
            title="Đặt lại đồng hồ"
            className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTimer}
            className={`px-8 py-4 rounded-2xl font-bold text-sm text-white shadow-lg transition-all flex items-center gap-3 cursor-pointer ${
              isActive
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25 active:scale-95'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Bắt đầu phiên</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              if (mode === 'focus') switchMode('shortBreak');
              else switchMode('focus');
            }}
            title="Bỏ qua phiên này"
            className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Today's Focus History Log */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Nhật ký phiên tập trung hôm nay</h3>
          </div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg">
            Hôm nay: {todayTotalFocusMinutes} Phút
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {todaySessions.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center italic">
              Chưa có phiên tập trung nào hoàn thành hôm nay. Hãy bắt đầu bấm giờ để ghi nhận nỗ lực!
            </p>
          ) : (
            todaySessions.map((session) => (
              <div key={session.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${
                    session.sessionType === 'focus' 
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' 
                      : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {session.sessionType === 'focus' ? <Zap className="w-3.5 h-3.5" /> : <Coffee className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {session.taskTitle || (session.sessionType === 'focus' ? 'Phiên Deep Focus' : 'Nghỉ giải lao')}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {session.category || 'Chung'} • Hoàn tất lúc {new Date(session.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                  +{session.durationMinutes}m
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
