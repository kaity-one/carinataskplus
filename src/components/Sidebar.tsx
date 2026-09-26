import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Flame, 
  Timer, 
  BookOpen, 
  User, 
  LogOut, 
  Sparkles,
  Zap,
  Target,
  Sun,
  Moon,
  Lightbulb,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { getTodayString } from '../utils/date';
import type { ViewTab } from '../types';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenProposalsModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
  onOpenProposalsModal,
}) => {
  const { userProfile, signOut, isGuest } = useAuth();
  const { tasks, habits } = useData();
  const { theme, toggleTheme } = useTheme();

  const today = getTodayString();
  const pendingTasksCount = tasks.filter(t => t.date === today && !t.completed).length;
  
  // Calculate maximum streak across all habits
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak || 0), 0);

  const navItems = [
    {
      id: 'dashboard' as ViewTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'goals' as ViewTab,
      label: 'Daily Goals',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? `${pendingTasksCount}` : null,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    },
    {
      id: 'schedule' as ViewTab,
      label: 'Lịch học (Calendar)',
      icon: Calendar,
      badge: 'Google Cal',
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    },
    {
      id: 'habits' as ViewTab,
      label: 'Habit Streaks',
      icon: Flame,
      badge: maxStreak > 0 ? `${maxStreak} 🔥` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'focus' as ViewTab,
      label: 'Focus Session',
      icon: Timer,
      badge: 'Timer',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    },
    {
      id: 'reflection' as ViewTab,
      label: 'Daily Reflection',
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'profile' as ViewTab,
      label: 'Profile & Target',
      icon: User,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-200 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand & Mode Header */}
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-indigo-500 to-amber-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white tracking-tight">CarinaTask</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">PLUS</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Focus & Habit Mastery</p>
            </div>
          </div>

          {/* User role track badge */}
          <div className="mt-4 px-3 py-2 rounded-lg bg-slate-800/70 border border-slate-700/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-medium truncate">{userProfile?.role || 'Disciplined Achiever'}</span>
            </div>
            {isGuest && (
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Guest</span>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Workspace
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${isActive ? 'bg-indigo-800/80 text-white' : item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Proposed Tasks Button */}
          <button
            onClick={() => {
              onOpenProposalsModal();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <Lightbulb className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Gợi ý nhiệm vụ</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300">
              Propose
            </span>
          </button>

          {/* Quick Motivational Snippet */}
          <div className="mt-4 mx-1 p-3.5 rounded-xl bg-gradient-to-br from-slate-800/90 to-slate-800/40 border border-slate-700/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Streak Philosophy</span>
            </div>
            <p className="text-[12px] text-slate-300 leading-relaxed italic">
              "Action creates motivation, not the other way around. Keep today's streak unbroken."
            </p>
          </div>
        </div>

        {/* User Footer Profile & Sign Out & Theme Toggle */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/90 space-y-3">
          {/* Light / Dark Mode Toggle button */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
              <span>{theme === 'dark' ? 'Giao diện Tối (Dark)' : 'Giao diện Sáng (Light)'}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700/60 text-slate-300">
              Đổi màu
            </span>
          </button>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={userProfile?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                alt="Avatar"
                className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {userProfile?.displayName || 'User'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {userProfile?.email || 'Logged in'}
                </p>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
