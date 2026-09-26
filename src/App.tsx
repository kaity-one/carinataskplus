/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Menu, Target, Plus, Sun, Moon, Lightbulb } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { AuthView } from './components/AuthView';
import { DashboardView } from './components/DashboardView';
import { GoalsView } from './components/GoalsView';
import { HabitsView } from './components/HabitsView';
import { FocusTimerView } from './components/FocusTimerView';
import { ReflectionView } from './components/ReflectionView';
import { ProfileView } from './components/ProfileView';
import { ScheduleView } from './components/ScheduleView';
import { TaskModal } from './components/TaskModal';
import { TaskProposalModal } from './components/TaskProposalModal';
import { FirebaseUIProvider } from '@firebase-oss/ui-react';
import { ui } from './firebase/ui';
import type { ViewTab } from './types';

const MainLayout: React.FC = () => {
  const { user, isGuest, loading } = useAuth();
  const { createTask } = useData();
  const { theme, toggleTheme } = useTheme();

  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isGlobalTaskModalOpen, setIsGlobalTaskModalOpen] = useState(false);
  const [isProposalsModalOpen, setIsProposalsModalOpen] = useState(false);

  // Focus timer preloaded parameters
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [focusTaskTitle, setFocusTaskTitle] = useState<string | null>(null);
  const [focusCategory, setFocusCategory] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-indigo-500 to-amber-500 p-0.5 shadow-xl shadow-indigo-500/30 animate-pulse">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Target className="w-7 h-7 text-emerald-400" />
          </div>
        </div>
        <p className="mt-4 font-bold text-base text-slate-200">Đang tải CarinaTaskPlus...</p>
        <p className="text-xs text-slate-400 mt-1">Chuẩn bị không gian làm việc kỷ luật & năng suất</p>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <AuthView />;
  }

  const handleStartFocusOnTask = (taskId: string, title: string, category: string) => {
    setFocusTaskId(taskId);
    setFocusTaskTitle(title);
    setFocusCategory(category);
    setCurrentTab('focus');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors">
      {/* Dark Navy / Slate Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenProposalsModal={() => setIsProposalsModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-72 min-w-0">
        
        {/* Top bar for mobile and quick global actions */}
        <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl md:hidden transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight capitalize">
                {currentTab === 'dashboard' ? 'Tổng quan (Dashboard)' :
                 currentTab === 'goals' ? 'Mục tiêu hàng ngày (Goals)' :
                 currentTab === 'schedule' ? 'Thời khóa biểu & Lịch học (Google Calendar)' :
                 currentTab === 'habits' ? 'Chuỗi thói quen (Streak)' :
                 currentTab === 'focus' ? 'Đồng hồ Pomodoro (Focus)' :
                 currentTab === 'reflection' ? 'Nhật ký tổng kết ngày' :
                 'Hồ sơ & Thiết lập'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button (Light/Dark) */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Quick Task Proposals Button */}
            <button
              onClick={() => setIsProposalsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold text-xs transition-all cursor-pointer shadow-2xs"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Gợi ý nhiệm vụ</span>
            </button>

            {/* Quick Goal Creation Button */}
            <button
              onClick={() => setIsGlobalTaskModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thêm mục tiêu</span>
            </button>
          </div>
        </header>

        {/* Dynamic Tab Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={(tab) => setCurrentTab(tab)}
              onStartFocusOnTask={handleStartFocusOnTask}
              onOpenNewTaskModal={() => setIsGlobalTaskModalOpen(true)}
              onOpenProposalsModal={() => setIsProposalsModalOpen(true)}
            />
          )}

          {currentTab === 'goals' && (
            <GoalsView 
              onStartFocusOnTask={handleStartFocusOnTask} 
              onOpenProposalsModal={() => setIsProposalsModalOpen(true)}
              onNavigateToSchedule={() => setCurrentTab('schedule')}
            />
          )}

          {currentTab === 'schedule' && (
            <ScheduleView onNavigateToGoals={() => setCurrentTab('goals')} />
          )}

          {currentTab === 'habits' && <HabitsView />}

          {currentTab === 'focus' && (
            <FocusTimerView
              initialTaskId={focusTaskId}
              initialTaskTitle={focusTaskTitle}
              initialCategory={focusCategory}
            />
          )}

          {currentTab === 'reflection' && <ReflectionView />}

          {currentTab === 'profile' && <ProfileView />}
        </main>
      </div>

      {/* Global Quick Goal Modal */}
      <TaskModal
        isOpen={isGlobalTaskModalOpen}
        onClose={() => setIsGlobalTaskModalOpen(false)}
        onSave={async (data) => {
          await createTask(data);
        }}
      />

      {/* Task & Habit Proposals Library Modal */}
      <TaskProposalModal
        isOpen={isProposalsModalOpen}
        onClose={() => setIsProposalsModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <FirebaseUIProvider ui={ui}>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <MainLayout />
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </FirebaseUIProvider>
  );
}
