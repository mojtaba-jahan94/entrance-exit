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

  // Compute friendly greeting based on time of day (just like "Morning, Alex!" in screenshot)
  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'صبح بخیر';
    if (hour >= 12 && hour < 17) return 'ظهر بخیر';
    if (hour >= 17 && hour < 21) return 'عصر بخیر';
    return 'شب بخیر';
  }, []);

  const displayName = user?.displayName || user?.username || 'همکار گرامی';

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'پیشخوان و تقویم',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      id: 'timesheet' as ActiveTab,
      label: 'کارنامه تردد',
      icon: <TableIcon className="h-5 w-5" />,
    },
    {
      id: 'leaves' as ActiveTab,
      label: 'مرخصی‌ها',
      icon: <Coffee className="h-5 w-5" />,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'گزارشات آماری',
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ];

  return (
    <>
      {/* 1. DESKTOP FLOATING LEFT SIDEBAR DOCK (Matches the vertical pill dock in the reference image!) */}
      <aside className="hidden md:flex fixed top-0 bottom-0 right-0 z-50 w-20 flex-col items-center justify-between py-6 px-3 bg-[#0f121b]/95 border-l border-white/[0.06] backdrop-blur-2xl">
        {/* Top Logo Brand Glyph */}
        <div className="flex flex-col items-center gap-2">
          <div
            onClick={() => onTabChange('dashboard')}
            className="group cursor-pointer flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#2f68fd] to-[#00d2ff] shadow-lg shadow-blue-600/30 ring-1 ring-white/20 transition-all hover:scale-105 active:scale-95"
            title="سامانه مدیریت و تقویم تردد"
          >
            {/* Sleek V / Glyph logo */}
            <CalendarClock className="h-6 w-6 text-white transition-transform group-hover:rotate-12" />
          </div>
        </div>

        {/* Middle Navigation Capsule (Rounded pill vertical container from screenshot) */}
        <nav className="flex flex-col items-center gap-2 rounded-[28px] border border-white/[0.08] bg-[#171b28]/90 p-2 shadow-2xl backdrop-blur-xl">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={item.label}
                className={`relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#2f68fd] text-white shadow-lg shadow-blue-600/40 ring-2 ring-blue-400/50 scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {item.icon}

                {/* Tooltip on hover */}
                <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-xl bg-[#1e2336] px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-xl border border-white/[0.08] transition-opacity group-hover:opacity-100 z-50">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Center Quick Add Entry (+) */}
          <div className="my-1 h-px w-6 bg-white/[0.08]" />
          <button
            onClick={onOpenManualEntry}
            title="ثبت سریع تردد"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 group relative"
          >
            <PlusCircle className="h-5 w-5" />
            <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-xl bg-[#1e2336] px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-xl border border-white/[0.08] transition-opacity group-hover:opacity-100 z-50">
              ثبت تردد جدید
            </span>
          </button>
        </nav>

        {/* Bottom Utility Controls & Profile Avatar */}
        <div className="flex flex-col items-center gap-3">
          {/* Settings */}
          <button
            onClick={onOpenSettings}
            title="تنظیمات شیفت و سامانه"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-[#171b28] text-slate-400 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.15] transition-all shadow-sm"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Theme Selector */}
          <ThemeSelector currentTheme={currentTheme} onSelectTheme={onSelectTheme} />

          {/* User Profile Avatar with Menu */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                title={`حساب کاربری: ${displayName}`}
                className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white font-bold text-sm shadow-lg ring-2 ring-white/10 hover:ring-blue-400 transition-all"
              >
                {displayName.charAt(0).toUpperCase()}
                <span
                  className={`absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border-2 border-[#0f121b] ${
                    isWorkingNow
                      ? 'bg-emerald-400 animate-pulse'
                      : dbStatus === 'connected'
                      ? 'bg-cyan-400'
                      : 'bg-amber-400'
                  }`}
                />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute left-14 bottom-0 w-64 rounded-2xl bg-[#161a28]/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-white/[0.08]">
                    <p className="font-bold text-white truncate text-sm">{displayName}</p>
                    <p className="text-slate-400 font-mono text-[11px] truncate dir-ltr text-right">
                      @{user.username}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-400">
                      <ShieldCheck className="h-3 w-3 text-emerald-400" />
                      <span>اتصال امن به سامانه</span>
                    </div>
                  </div>

                  <div className="py-1 space-y-0.5">
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
          )}
        </div>
      </aside>

      {/* 2. TOP HEADER BAR: Greeting ("Morning, Alex!"), Search Bar, Notifications & Live Status */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#0d101a]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 sm:px-6">
          {/* Right Header Area: Greeting + Subtitle (Just like "Morning, Alex!" in screenshot) */}
          <div className="flex items-center gap-3">
            {/* Mobile-only logo */}
            <div className="md:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-md shadow-blue-500/25">
              <CalendarClock className="h-5 w-5 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>{greeting}، {displayName}!</span>
                </h1>
                {isWorkingNow && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    حضور فعال
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>برنامه کاری و تقویم تردد شما در ماه جاری</span>
                <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-slate-600" />
                <span className="hidden sm:inline font-mono text-cyan-400">
                  {weekdayName}، {toPersianDigits(todayStr)}
                </span>
              </p>
            </div>
          </div>

          {/* Left Header Area: Search pill, Notification Bell, Live Time & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Pill Input (Matching "Search for some activities..." in screenshot!) */}
            <div className="relative hidden sm:block w-52 md:w-64">
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="جستجو در ترددها و روزها..."
                className="w-full rounded-2xl border border-white/[0.08] bg-[#171b28]/90 pr-9 pl-8 py-2 text-xs text-white placeholder-slate-400 shadow-inner hover:border-blue-500/40 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange?.('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Notification Bell Circle */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationToast(!showNotificationToast)}
                title="اعلان‌ها"
                className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#171b28] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all shadow-sm"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-[#0d101a]" />
              </button>

              {/* Notification Popover */}
              {showNotificationToast && (
                <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl border border-white/[0.1] bg-[#171b28]/95 p-3 shadow-2xl backdrop-blur-2xl z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                      اعلان‌های سامانه
                    </span>
                    <button
                      onClick={() => setShowNotificationToast(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-xl bg-[#121622] p-2.5 border border-white/[0.06]">
                      <span className="font-semibold text-blue-300 block text-xs">
                        تقویم شمسی هوشمند فعال است
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        کلیه تعطیلات رسمی ایران به همراه جزئیات حضور و مرخصی‌ها در تقویم پیشخوان لحاظ شده‌اند.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Clock Pill */}
            <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#171b28] px-3 py-1.5 font-mono text-xs shadow-inner">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-cyan-300 tracking-wider">
                {toPersianDigits(liveTime)}
              </span>
            </div>

            {/* Storage Mode Icon Button */}
            {onOpenStorageMode && (
              <button
                onClick={onOpenStorageMode}
                className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl border transition-all ${
                  storageMode === 'cloud_encrypted'
                    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                    : 'border-white/[0.08] bg-[#171b28] text-slate-400 hover:text-white'
                }`}
                title={storageMode === 'cloud_encrypted' ? 'فضای ابری رمزنگاری‌شده فعال است' : 'ذخیره در مرورگر'}
              >
                {storageMode === 'cloud_encrypted' ? (
                  <Lock className="h-4 w-4 text-cyan-400" />
                ) : (
                  <HardDrive className="h-4 w-4 text-slate-400" />
                )}
              </button>
            )}

            {/* Mobile User Profile Button */}
            {user && (
              <div className="md:hidden relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white font-bold text-xs ring-1 ring-white/20"
                >
                  {displayName.charAt(0).toUpperCase()}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
