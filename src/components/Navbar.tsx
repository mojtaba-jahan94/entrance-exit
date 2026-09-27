import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Settings,
  PlusCircle,
  Coffee,
  Database,
  CalendarClock,
  LayoutDashboard,
  Table as TableIcon,
  TrendingUp,
} from 'lucide-react';
import {
  getCurrentTimeString,
  getTodayJalaliString,
  getJalaliWeekdayName,
  toPersianDigits,
} from '../utils/jalali';
import { AppTheme } from '../utils/theme';
import { ThemeSelector } from './ThemeSelector';

export type ActiveTab = 'dashboard' | 'timesheet' | 'leaves' | 'reports';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
  onOpenManualEntry: () => void;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
  isWorkingNow?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  currentTheme,
  onSelectTheme,
  onOpenManualEntry,
  onOpenSettings,
  onOpenBackup,
  isWorkingNow,
}) => {
  const [liveTime, setLiveTime] = useState<string>(getCurrentTimeString(true));
  const todayStr = getTodayJalaliString();
  const weekdayName = getJalaliWeekdayName(todayStr);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(getCurrentTimeString(true));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navTabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'پیشخوان',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: 'timesheet',
      label: 'کارنامه تردد',
      icon: <TableIcon className="h-4 w-4" />,
    },
    {
      id: 'leaves',
      label: 'مرخصی‌ها',
      icon: <Coffee className="h-4 w-4" />,
    },
    {
      id: 'reports',
      label: 'گزارشات',
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2 sm:px-6 sm:py-2.5">
        {/* Brand & Live Date/Time */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
            <CalendarClock className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-xs sm:text-base font-bold tracking-tight text-white truncate">
                سامانه مدیریت تردد
              </h1>
              {isWorkingNow && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  حضور فعال
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1.5 truncate">
              <span>{weekdayName}، {toPersianDigits(todayStr)}</span>
              <span className="inline-block h-1 w-1 rounded-full bg-slate-600"></span>
              <span className="font-mono text-cyan-400 font-semibold tracking-wider">
                {toPersianDigits(liveTime)}
              </span>
            </p>
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800/90 shadow-inner">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls & Theme Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Theme Selector Palette */}
          <ThemeSelector
            currentTheme={currentTheme}
            onSelectTheme={onSelectTheme}
          />

          {/* Quick Manual Entry Button */}
          <button
            onClick={onOpenManualEntry}
            className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="ثبت تردد دستی"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">ثبت تردد</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-slate-700/60 bg-slate-900/80 hover:bg-slate-850 hover:border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
            title="تنظیمات شیفت و محاسبات"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Backup / Export */}
          <button
            onClick={onOpenBackup}
            className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-slate-700/60 bg-slate-900/80 hover:bg-slate-850 hover:border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
            title="پشتیبان‌گیری و انتقال داده‌ها"
          >
            <Database className="h-4 w-4 text-cyan-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
