import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Upload, 
  FileText, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Plus, 
  Sparkles, 
  Trash2, 
  Info, 
  BookOpen, 
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Check,
  AlertCircle
} from 'lucide-react';
import { parseICS, parseCalendarJSON, getDemoStudentSchedule } from '../utils/icsParser';
import type { CalendarEvent, GoalCategory } from '../types';
import { useData } from '../context/DataContext';
import { getTodayString } from '../utils/date';
import { fireConfetti } from '../utils/confetti';
import { playTaskDoneSound } from '../utils/audio';

const STORAGE_KEY = 'carinataskplus_calendar_events';
const STORAGE_FILENAME_KEY = 'carinataskplus_calendar_filename';

const DAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

interface ScheduleViewProps {
  onNavigateToGoals?: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onNavigateToGoals }) => {
  const { createTask, tasks } = useData();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [filterDay, setFilterDay] = useState<number | 'all'>('all');
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importedTaskIds, setImportedTaskIds] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = getTodayString();
  const currentDayOfWeek = new Date().getDay();

  // Load saved calendar from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedName = localStorage.getItem(STORAGE_FILENAME_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEvents(parsed);
          if (savedName) setFileName(savedName);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const saveEvents = (newEvents: CalendarEvent[], name: string) => {
    setEvents(newEvents);
    setFileName(name);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents));
    localStorage.setItem(STORAGE_FILENAME_KEY, name);
  };

  const handleClearCalendar = () => {
    setEvents([]);
    setFileName(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_FILENAME_KEY);
    setSuccessMsg('Đã xóa thời khóa biểu đã lưu.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleFileUpload = (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let parsed: CalendarEvent[] = [];

        if (file.name.endsWith('.ics') || file.name.endsWith('.ical')) {
          parsed = parseICS(content);
        } else if (file.name.endsWith('.json')) {
          parsed = parseCalendarJSON(content);
        } else {
          // Attempt ICS parse by default
          parsed = parseICS(content);
        }

        if (!parsed || parsed.length === 0) {
          throw new Error('Không tìm thấy sự kiện hoặc buổi học nào trong tệp này.');
        }

        saveEvents(parsed, file.name);
        setSuccessMsg(`Nhận diện thành công ${parsed.length} buổi học từ Google Calendar!`);
        fireConfetti();
        setTimeout(() => setSuccessMsg(null), 4000);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lỗi đọc tệp lịch';
        setErrorMsg(msg);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Không thể đọc tệp tin. Vui lòng thử lại.');
    };

    reader.readAsText(file);
  };

  const handleLoadDemo = () => {
    const demo = getDemoStudentSchedule();
    saveEvents(demo, 'ThoiKhoaBieu_DaiHoc_Mau.ics');
    setSuccessMsg(`Đã tải thành công ${demo.length} buổi học mẫu để thử nghiệm!`);
    fireConfetti();
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Filter events for Today
  const todayEvents = events.filter(e => {
    // Exact date match OR day of week match
    if (e.date === todayStr) return true;
    return e.dayOfWeek === currentDayOfWeek;
  });

  // Filter events for display list
  const displayEvents = events.filter(e => {
    if (filterDay === 'all') return true;
    return e.dayOfWeek === filterDay;
  });

  // Convert a calendar event into a CarinaTaskPlus task
  const handleConvertToTask = async (ev: CalendarEvent) => {
    setIsImporting(true);
    try {
      // Calculate estimated Pomodoros based on duration
      let estimatedPoms = 2; // Default 50 mins
      if (ev.startTime && ev.endTime) {
        const [sh, sm] = ev.startTime.split(':').map(Number);
        const [eh, em] = ev.endTime.split(':').map(Number);
        const durationMins = (eh * 60 + em) - (sh * 60 + sm);
        if (durationMins > 0) {
          estimatedPoms = Math.max(1, Math.round(durationMins / 30));
        }
      }

      await createTask({
        title: `Đi học: ${ev.title}`,
        category: 'Study' as GoalCategory,
        priority: 'high',
        date: todayStr,
        completed: false,
        notes: [
          ev.location ? `📍 Địa điểm: ${ev.location}` : '',
          ev.startTime && ev.endTime ? `⏰ Thời gian: ${ev.startTime} - ${ev.endTime}` : '',
          ev.description ? `📝 Ghi chú: ${ev.description}` : '',
        ].filter(Boolean).join('\n'),
        estimatedPomodoros: estimatedPoms,
        completedPomodoros: 0,
        subtasks: [
          { id: `sub_${Date.now()}_1`, title: 'Chuẩn bị giáo trình, laptop & đồ dùng học tập', completed: false },
          { id: `sub_${Date.now()}_2`, title: 'Tham gia lớp đúng giờ & nghe giảng tích cực', completed: false },
          { id: `sub_${Date.now()}_3`, title: 'Ghi chú bài học & làm bài tập trên lớp', completed: false },
        ],
      });

      setImportedTaskIds(prev => new Set(prev).add(ev.id));
      playTaskDoneSound();
      fireConfetti();
      setSuccessMsg(`Đã thêm "${ev.title}" vào danh sách Mục tiêu hôm nay!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Không thể tạo nhiệm vụ từ buổi học');
    } finally {
      setIsImporting(false);
    }
  };

  // Batch import all today's events as tasks
  const handleBatchImportToday = async () => {
    if (todayEvents.length === 0) return;
    setIsImporting(true);
    let count = 0;

    for (const ev of todayEvents) {
      if (importedTaskIds.has(ev.id)) continue;
      await handleConvertToTask(ev);
      count++;
    }

    setIsImporting(false);
    if (count > 0) {
      setSuccessMsg(`Đã chuyển toàn bộ ${count} ca học hôm nay thành mục tiêu hàng ngày!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Helper to check event status
  const getEventTimeStatus = (start: string, end: string) => {
    const now = new Date();
    const [nowH, nowM] = [now.getHours(), now.getMinutes()];
    const currentMins = nowH * 60 + nowM;

    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;

    if (currentMins >= startMins && currentMins <= endMins) {
      return { text: 'Đang diễn ra', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
    }
    if (currentMins < startMins) {
      return { text: 'Sắp tới', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' };
    }
    return { text: 'Đã kết thúc', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Thời khóa biểu & Lịch học Google Calendar
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nhập file lịch học (.ics / Google Calendar) để quản lý giờ lên lớp và tự động chuyển thành mục tiêu học tập.
              </p>
            </div>
          </div>
        </div>

        {events.length > 0 && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-blue-500" />
              <span>Đổi file lịch khác</span>
            </button>
            <button
              onClick={handleClearCalendar}
              title="Xóa lịch hiện tại"
              className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Upload Zone when no events */}
      {events.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 p-8 sm:p-12 text-center transition-colors">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            accept=".ics,.ical,.json"
            className="hidden"
          />

          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-900/40 shadow-xs">
            <Upload className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
            Tải lên file Google Calendar (.ics)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Kéo thả hoặc tải lên file xuất lịch <span className="font-mono text-blue-500 font-semibold">.ics</span> từ Google Calendar, Apple Calendar, Outlook hoặc cổng thông tin sinh viên trường bạn.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Chọn file từ máy tính (.ics / .json)</span>
            </button>

            <button
              onClick={handleLoadDemo}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Dùng thử thời khóa biểu mẫu</span>
            </button>
          </div>

          {/* Quick instructions */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 max-w-lg mx-auto text-left">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span>Cách lấy file .ics từ Google Calendar:</span>
            </div>
            <ol className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 list-decimal list-inside leading-relaxed">
              <li>Mở <strong>Google Calendar</strong> trên máy tính.</li>
              <li>Nhấp biểu tượng <strong>Cài đặt (Bánh răng)</strong> ở góc trên bên phải → <strong>Cài đặt</strong>.</li>
              <li>Chọn <strong>Nhập và xuất (Import & Export)</strong> ở thanh bên trái → bấm <strong>Xuất (Export)</strong>.</li>
              <li>Giải nén file zip tải về và kéo file <span className="font-mono text-blue-500">.ics</span> vào đây.</li>
            </ol>
          </div>
        </div>
      ) : (
        <>
          {/* File status banner */}
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  Tệp đang mở: <span className="font-mono text-indigo-600 dark:text-indigo-400">{fileName || 'Google Calendar'}</span>
                </p>
                <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80">
                  Tổng cộng: <strong>{events.length}</strong> buổi học / sự kiện được đồng bộ
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              accept=".ics,.ical,.json"
              className="hidden"
            />
          </div>

          {/* Section: Today's Classes */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    Ca học hôm nay ({DAY_NAMES[currentDayOfWeek]}, {todayStr})
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {todayEvents.length > 0 
                    ? `Bạn có ${todayEvents.length} ca học cần hoàn thành trong ngày.`
                    : 'Hôm nay không có ca học nào trên lịch. Bạn có thể tự do tự học hoặc nghỉ ngơi!'}
                </p>
              </div>

              {todayEvents.length > 0 && (
                <button
                  type="button"
                  onClick={handleBatchImportToday}
                  disabled={isImporting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isImporting ? 'Đang thêm...' : 'Chuyển toàn bộ thành Task hôm nay'}</span>
                </button>
              )}
            </div>

            {todayEvents.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Hôm nay không có lịch học trùng khớp.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {todayEvents.map((ev) => {
                  const status = getEventTimeStatus(ev.startTime, ev.endTime);
                  const isAdded = importedTaskIds.has(ev.id);

                  return (
                    <div 
                      key={ev.id}
                      className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-blue-500/50 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                            {ev.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${status.color}`}>
                            {status.text}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{ev.startTime} - {ev.endTime}</span>
                          </div>

                          {ev.location && (
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                              <MapPin className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                              <span className="truncate">{ev.location}</span>
                            </div>
                          )}

                          {ev.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                              {ev.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">
                          {ev.date}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleConvertToTask(ev)}
                          disabled={isImporting || isAdded}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isAdded
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Đã thêm vào mục tiêu</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Tạo Task</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Full Timetable & Filter by Day */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Toàn bộ Thời khóa biểu
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Lọc danh sách ca học theo từng ngày trong tuần
                </p>
              </div>

              {/* Day filter buttons */}
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterDay('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterDay === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Tất cả
                </button>
                {[1, 2, 3, 4, 5, 6, 0].map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setFilterDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      filterDay === day
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {DAY_NAMES[day]}
                  </button>
                ))}
              </div>
            </div>

            {displayEvents.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Không có lịch học nào cho ngày được chọn.
              </p>
            ) : (
              <div className="space-y-3">
                {displayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex flex-col items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-900/40 font-bold">
                        <span className="text-[10px] uppercase">{ev.dayOfWeek !== undefined ? DAY_NAMES[ev.dayOfWeek].replace('Thứ ', 'T') : 'CAL'}</span>
                        <span className="text-xs font-black">{ev.startTime.substring(0, 5)}</span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {ev.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {ev.startTime} - {ev.endTime}
                          </span>
                          {ev.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" />
                              {ev.location}
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-slate-400">
                            {ev.date}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleConvertToTask(ev)}
                      disabled={isImporting || importedTaskIds.has(ev.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all self-end sm:self-auto cursor-pointer ${
                        importedTaskIds.has(ev.id)
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {importedTaskIds.has(ev.id) ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã thêm</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Lập mục tiêu</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
