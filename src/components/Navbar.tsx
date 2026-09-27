import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Settings,
  PlusCircle,
  FileSpreadsheet,
  Coffee,
  CheckCircle2,
  Database,
  CalendarClock,
} from 'lucide-react';
import {
  getCurrentTimeString,
  getTodayJalaliString,
  getJalaliWeekdayName,
  toPersianDigits,
} from '../utils/jalali';

interface NavbarProps {
  onOpenManualEntry: () => void;
  onOpenLeaves: () => void;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
  todayWorkedMinutes?: number;
  isWorkingNow?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenManualEntry,
  onOpenLeaves,
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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2 sm:px-6 sm:py-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-md shadow-indigo-500/25 ring-1 ring-white/20">
            <CalendarClock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white sm:text-lg truncate">
                <span className="sm:hidden">سامانه تردد</span>
                <span className="hidden sm:inline">سامانه مدیریت تردد و کارکرد</span>
              </h1>
              <span className="hidden xs:inline-flex rounded-full bg-indigo-500/10 px-1.5 py-0.2 sm:px-2 sm:py-0.5 text-[10px] sm:text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                تقویم شمسی
              </span>
              {isWorkingNow && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  حضور فعال
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5 sm:gap-2 truncate">
              <span>{weekdayName}، {toPersianDigits(todayStr)}</span>
              <span className="inline-block h-1 w-1 rounded-full bg-slate-600"></span>
              <span className="font-mono text-cyan-400 text-[11px] sm:text-xs font-semibold tracking-wider">
                {toPersianDigits(liveTime)}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          {/* Working Status Indicator (Desktop only) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/60 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                isWorkingNow ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <span className={isWorkingNow ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
              {isWorkingNow ? 'در حال کار (حضور فعال)' : 'شیفت ثبت نشده'}
            </span>
          </div>

          {/* Quick Manual Entry Button */}
          <button
            onClick={onOpenManualEntry}
            className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-medium shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="ثبت تردد دستی"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">ثبت تردد دستی</span>
          </button>

          {/* Leaves Manager */}
          <button
            onClick={onOpenLeaves}
            className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-850 hover:border-slate-700 text-slate-200 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-medium transition-all"
            title="مدیریت مرخصی‌ها"
          >
            <Coffee className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline">مرخصی‌ها</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-850 hover:border-slate-700 text-slate-300 hover:text-white transition-all"
            title="تنظیمات شیفت و محاسبات"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Backup / Export */}
          <button
            onClick={onOpenBackup}
            className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-850 hover:border-slate-700 text-slate-300 hover:text-white transition-all"
            title="پشتیبان‌گیری و انتقال داده‌ها"
          >
            <Database className="h-4 w-4 text-cyan-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
