import React, { useState, useEffect, useRef } from 'react';
import {
  CalendarClock,
  LayoutDashboard,
  Table as TableIcon,
  Coffee,
  TrendingUp,
  PlusCircle,
  Settings,
  Database,
  Search,
  Bell,
  LogOut,
  KeyRound,
  ShieldCheck,
  ChevronDown,
  HardDrive,
  Lock,
  X,
  Sparkles,
  Sliders,
  Calendar,
  Clock,
  Heart,
  Video,
  List,
} from 'lucide-react';
import {
  getCurrentTimeString,
  getTodayJalaliString,
  getJalaliWeekdayName,
  toPersianDigits,
} from '../utils/jalali';
import { AppTheme } from '../utils/theme';
import { ThemeSelector } from './ThemeSelector';
import { useAuth } from '../context/AuthContext';

export type ActiveTab = 'dashboard' | 'timesheet' | 'leaves' | 'reports';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
  onOpenManualEntry: () => void;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
  onOpenChangePassword?: () => void;
  onOpenStorageMode?: () => void;
  isWorkingNow?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  currentTheme,
  onSelectTheme,
  onOpenManualEntry,
  onOpenSettings,
  onOpenBackup,
  onOpenChangePassword,
  onOpenStorageMode,
  isWorkingNow,
  searchQuery = '',
  onSearchChange,
}) => {
  const { user, logout, dbStatus, storageMode } = useAuth();
  const [liveTime, setLiveTime] = useState<string>(getCurrentTimeString(true));
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const todayStr = getTodayJalaliString();
  const weekdayName = getJalaliWeekdayName(todayStr);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(getCurrentTimeString(true));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.displayName || user?.username || 'سارا علوی';
  const displayEmail = user?.username ? `${user.username}@tubistudio.com` : 'sarah@tubistudio.com';

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'پیشخوان و تحلیل (Analytics)',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      id: 'timesheet' as ActiveTab,
      label: 'کارنامه تردد (Timesheet)',
      icon: <TableIcon className="h-5 w-5" />,
    },
    {
      id: 'leaves' as ActiveTab,
      label: 'مرخصی و استراحت (Leaves)',
      icon: <Coffee className="h-5 w-5" />,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'گزارشات آماری (Reports)',
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ];

  return (
    <>
      {/* 1. DESKTOP FLOATING PILL DOCK (Left side floating capsule matching the reference image) */}
      <aside className="hidden md:flex fixed top-1/2 -translate-y-1/2 left-5 z-50 flex-col items-center gap-2.5 rounded-[36px] p-2 bg-[#1b102c]/80 border border-white/10 backdrop-blur-2xl shadow-2xl shadow-purple-950/70">
        {/* Top Logo / Home Glyph */}
        <button
          onClick={() => onTabChange('dashboard')}
          title="پیشخوان اصلی"
          className="flex h-10 w-10 items-center justify-center rounded-full text-purple-300 hover:text-white hover:bg-white/[0.08] transition-all"
        >
          <CalendarClock className="h-5 w-5 text-violet-400" />
        </button>

        <div className="h-px w-5 bg-white/10" />

        {/* Navigation Tabs */}
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={item.label}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 group ${
                isActive
                  ? 'bg-violet-600 text-white font-bold shadow-lg shadow-violet-600/50 ring-1 ring-violet-400/40 scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {item.icon}

              {/* Tooltip to the right in LTR / left view */}
              <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-xl bg-[#1e1233]/95 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-2xl border border-white/10 transition-opacity group-hover:opacity-100 z-50 backdrop-blur-xl">
                {item.label}
              </span>
            </button>
          );
        })}

        <div className="h-px w-5 bg-white/10" />

        {/* Quick Add Entry (+) */}
        <button
          onClick={onOpenManualEntry}
          title="ثبت سریع تردد جدید"
          className="flex h-10 w-10 items-center justify-center rounded-full text-violet-300 hover:text-white hover:bg-violet-600/30 transition-all group relative"
        >
          <PlusCircle className="h-5 w-5" />
          <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-xl bg-[#1e1233]/95 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-2xl border border-white/10 transition-opacity group-hover:opacity-100 z-50 backdrop-blur-xl">
            ثبت تردد جدید (+)
          </span>
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="تنظیمات شیفت و سامانه"
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all group relative"
        >
          <Settings className="h-4 w-4" />
          <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-xl bg-[#1e1233]/95 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-2xl border border-white/10 transition-opacity group-hover:opacity-100 z-50 backdrop-blur-xl">
            تنظیمات شیفت و UI
          </span>
        </button>
      </aside>

      {/* 2. TOP HEADER BAR (Matching reference header: Search pill, Bell, User profile chip) */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#120a1d]/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-8 py-3.5 md:pl-24">
          {/* Right Header Area: Search pill (matching "Find any meeting moment..." in reference) */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            {/* Mobile Logo */}
            <div className="md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600/40 border border-violet-400/30 text-violet-300">
              <CalendarClock className="h-5 w-5" />
            </div>

            {/* Pill Search Input */}
            <div className="relative w-full">
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="جستجو در رویدادها، ترددها و جلسات..."
                className="w-full rounded-full border border-white/10 bg-white/[0.04] pr-10 pl-8 py-2 text-xs text-white placeholder-slate-400/80 shadow-inner hover:border-violet-500/40 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all backdrop-blur-md"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange?.('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Left Header Area: Bell, User Profile Chip, Live Clock */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Clock Pill */}
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 font-mono text-xs shadow-inner">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-violet-200 tracking-wider">
                {toPersianDigits(liveTime)}
              </span>
            </div>

            {/* Notification Bell Pill */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationToast(!showNotificationToast)}
                title="اعلان‌ها"
                className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all shadow-sm"
              >
                <Bell className="h-4 w-4 text-slate-300" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-violet-400 ring-2 ring-[#120a1d]" />
              </button>

              {/* Notification Popover */}
              {showNotificationToast && (
                <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl border border-white/10 bg-[#1e1233]/95 p-3.5 shadow-2xl backdrop-blur-2xl z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                      اعلان‌های پیشخوان
                    </span>
                    <button
                      onClick={() => setShowNotificationToast(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-xl bg-[#2a1a45]/70 p-2.5 border border-white/[0.06]">
                      <span className="font-semibold text-violet-300 block text-xs">
                        تم Dark Glassmorphism فعال است
                      </span>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        سامانه به همراه تقویم هوشمند شمسی، نمودارهای شیشه‌ای تیره و وضعیت زنده ترددها آماده استفاده است.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Chip (Avatar + Name + Email + Chevron matching reference image) */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-2.5 sm:px-3 py-1.5 transition-all shadow-sm group"
              >
                {/* Avatar circle */}
                <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-white font-bold text-xs ring-1 ring-white/20">
                  {displayName.charAt(0).toUpperCase()}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#120a1d] ${
                      isWorkingNow
                        ? 'bg-emerald-400 animate-pulse'
                        : dbStatus === 'connected'
                        ? 'bg-cyan-400'
                        : 'bg-violet-400'
                    }`}
                  />
                </div>

                {/* Name & Title */}
                <div className="hidden sm:flex flex-col text-right leading-tight">
                  <span className="text-xs font-bold text-white truncate group-hover:text-violet-200 transition-colors">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-purple-300/80 font-mono truncate dir-ltr text-right">
                    {displayEmail}
                  </span>
                </div>

                <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-white transition-transform" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-[#1e1233]/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-white/[0.08]">
                    <p className="font-bold text-white truncate text-sm">{displayName}</p>
                    <p className="text-purple-300/80 font-mono text-[11px] truncate dir-ltr text-right">
                      {displayEmail}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-400">
                      <ShieldCheck className="h-3 w-3 text-emerald-400" />
                      <span>اتصال فعال و امن</span>
                    </div>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors text-right"
                    >
                      <Settings className="h-4 w-4 text-violet-400" />
                      <span>تنظیمات قوانین و ظاهر (UI)</span>
                    </button>

                    {onOpenStorageMode && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenStorageMode();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors text-right"
                      >
                        <ShieldCheck className="h-4 w-4 text-cyan-400" />
                        <span>فضای ابری و امنیت</span>
                      </button>
                    )}

                    {onOpenChangePassword && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenChangePassword();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors text-right"
                      >
                        <KeyRound className="h-4 w-4 text-blue-400" />
                        <span>تغییر رمز عبور</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenBackup();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors text-right"
                    >
                      <Database className="h-4 w-4 text-cyan-400" />
                      <span>پشتیبان‌گیری داده‌ها</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-white/[0.08]">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-right font-semibold"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>خروج از حساب</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 3. MOBILE BOTTOM DOCK */}
      <nav className="md:hidden fixed bottom-3 left-4 right-4 z-50 flex items-center justify-around py-2 px-3 rounded-full bg-[#1b102c]/90 border border-white/10 backdrop-blur-2xl shadow-2xl">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-full transition-all ${
                isActive
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.icon}
            </button>
          );
        })}
        <button
          onClick={onOpenManualEntry}
          className="flex items-center justify-center p-2 rounded-full text-violet-300 hover:text-white"
        >
          <PlusCircle className="h-5 w-5" />
        </button>
        <button
          onClick={onOpenSettings}
          className="flex items-center justify-center p-2 rounded-full text-slate-400 hover:text-white"
        >
          <Settings className="h-4 w-4" />
        </button>
      </nav>
    </>
  );
};
