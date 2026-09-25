import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertCircle } from 'lucide-react';
import type { Task, GoalCategory, PriorityLevel, Subtask } from '../types';
import { getTodayString } from '../utils/date';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  taskToEdit?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GoalCategory>('Work');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [date, setDate] = useState(getTodayString());
  const [notes, setNotes] = useState('');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState<number>(2);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setCategory(taskToEdit.category);
      setPriority(taskToEdit.priority);
      setDate(taskToEdit.date);
      setNotes(taskToEdit.notes || '');
      setEstimatedPomodoros(taskToEdit.estimatedPomodoros || 2);
      setSubtasks(taskToEdit.subtasks || []);
    } else {
      setTitle('');
      setCategory('Work');
      setPriority('medium');
      setDate(getTodayString());
      setNotes('');
      setEstimatedPomodoros(2);
      setSubtasks([]);
    }
    setErrorMsg('');
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: 'sub_' + Math.random().toString(36).substring(2, 9),
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tên mục tiêu.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        category,
        priority,
        date,
        completed: taskToEdit ? taskToEdit.completed : false,
        completedAt: taskToEdit ? taskToEdit.completedAt : null,
        notes: notes.trim() || undefined,
        estimatedPomodoros,
        completedPomodoros: taskToEdit?.completedPomodoros || 0,
        subtasks,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi lưu mục tiêu';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {taskToEdit ? 'Chỉnh sửa mục tiêu' : 'Mục tiêu hàng ngày mới'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Xác định rõ ràng việc cần hoàn thành</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Goal Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Tiêu đề mục tiêu *
            </label>
            <input
              type="text"
              required
              placeholder="VD: Hoàn thành bài tập cấu trúc dữ liệu / Tối ưu API backend"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-indigo-500 outline-hidden transition-all"
            />
          </div>

          {/* Category & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Danh mục
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GoalCategory)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-indigo-500 outline-hidden"
              >
                <option value="Study">Study (Học tập, Sách, Khóa học)</option>
                <option value="Work">Work (Công việc, Code, Kỹ thuật)</option>
                <option value="Health/Fitness">Health/Fitness (Gym, Dinh dưỡng)</option>
                <option value="Personal">Personal (Cá nhân, Dự án riêng)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Độ ưu tiên
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-indigo-500 outline-hidden"
              >
                <option value="high">🔴 Cao (High Priority)</option>
                <option value="medium">🟡 Vừa (Medium Priority)</option>
                <option value="low">🟢 Thấp (Low Priority)</option>
              </select>
            </div>
          </div>

          {/* Target Date & Estimated Pomodoros */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Ngày thực hiện
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-indigo-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Ước tính (25m Pomodoro)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={estimatedPomodoros}
                  onChange={(e) => setEstimatedPomodoros(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-indigo-500 outline-hidden"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                  ~{estimatedPomodoros * 25}m
                </span>
              </div>
            </div>
          </div>

          {/* Subtasks Checklist */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Các bước triển khai ({subtasks.filter(s => s.completed).length}/{subtasks.length})
            </label>
            
            <div className="space-y-2 mb-2">
              {subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={() => handleToggleSubtask(sub.id)}
                      className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <span className={`truncate ${sub.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                      {sub.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(sub.id)}
                    className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Thêm bước nhỏ..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Thêm
              </button>
            </div>
          </div>

          {/* Notes / References */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Ghi chú & Tài liệu liên quan
            </label>
            <textarea
              rows={3}
              placeholder="Thêm link, tiêu chí hoàn thành hoặc câu lệnh cần nhớ..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:border-indigo-500 outline-hidden transition-all"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Đang lưu...' : (taskToEdit ? 'Lưu thay đổi' : 'Tạo mục tiêu')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
