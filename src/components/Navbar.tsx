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
import { useAuth } from '../context/AuthContext';

export type ActiveTab = 'dashboard' | 'timesheet' | 'leaves' | 'reports';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
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
      {/* 1. DESKTOP FLOATING SIDEBAR DOCK (Next-Gen Apple visionOS / iOS 27 Liquid Glass Dock) */}
      <aside className="hidden md:flex fixed top-4 bottom-4 right-4 z-50 w-20 flex-col items-center justify-between py-6 px-3 liquid-glass rounded-[32px] border border-[var(--border)] shadow-2xl backdrop-blur-[28px]">
        {/* Top Logo Brand Glyph */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => onTabChange('dashboard')}
            className="group cursor-pointer flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--accent)] shadow-lg border border-[var(--border-strong)] transition-all hover:scale-105 active:scale-95"
            title="سامانه مدیریت و تقویم تردد"
            aria-label="سامانه مدیریت و تقویم تردد"
          >
            <CalendarClock className="h-6 w-6 transition-transform group-hover:rotate-12" />
          </button>
        </div>

        {/* Middle Navigation Capsule (Liquid Glass Pill Capsule) */}
        <nav aria-label="بخش‌های اصلی سامانه" className="flex flex-col items-center gap-2.5 rounded-[30px] border border-[var(--border)] bg-[var(--surface-2)] p-2 shadow-inner backdrop-blur-xl">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                title={item.label}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200 group ${
                  isActive
                    ? 'liquid-pill-btn-primary shadow-lg ring-2 ring-[var(--focus)] scale-105'
                    : 'text-muted hover:text-[var(--text-main)] hover:bg-[var(--surface)]'
                }`}
              >
                {item.icon}

                {/* Tooltip on hover */}
                <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-xl liquid-glass px-3 py-1.5 text-xs font-semibold text-[var(--text-main)] opacity-0 shadow-xl border border-[var(--border)] transition-opacity group-hover:opacity-100 z-50">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Center Quick Add Entry (+) */}
          <div className="my-1 h-px w-6 bg-[var(--border)]" />
          <button
            type="button"
            onClick={onOpenManualEntry}
            title="ثبت سریع تردد"
            aria-label="ثبت سریع تردد"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] hover:opacity-95 text-[var(--bg)] shadow-md border border-[var(--border-strong)] transition-all hover:scale-105 active:scale-95 group relative font-bold"
          >
            <PlusCircle className="h-5 w-5" />
            <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-xl liquid-glass px-3 py-1.5 text-xs font-semibold text-[var(--text-main)] opacity-0 shadow-xl border border-[var(--border)] transition-opacity group-hover:opacity-100 z-50">
              ثبت تردد جدید
            </span>
          </button>
        </nav>

        {/* Bottom Utility Controls & Profile Avatar */}
        <div className="flex flex-col items-center gap-3">
          {/* Settings */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="تنظیمات شیفت و سامانه"
            aria-label="تنظیمات شیفت و سامانه"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-muted hover:text-[var(--text-main)] hover:bg-[var(--surface)] transition-all shadow-sm"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* User Profile Avatar with Menu */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                title={`حساب کاربری: ${displayName}`}
                aria-label={`حساب کاربری: ${displayName}`}
                aria-expanded={isUserMenuOpen}
                className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border-strong)] font-bold text-sm shadow-lg ring-2 ring-[var(--border)] hover:ring-[var(--focus)] transition-all"
              >
                {displayName.charAt(0).toUpperCase()}
                <span
                  className={`absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border-2 border-[var(--bg)] ${
                    isWorkingNow
                      ? 'bg-[var(--semantic-success)] animate-pulse'
                      : dbStatus === 'connected'
                      ? 'bg-[var(--semantic-info)]'
                      : 'bg-[var(--semantic-warning)]'
                  }`}
                />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute left-14 bottom-0 w-64 rounded-[26px] liquid-glass-modal p-2.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 shadow-2xl">
                  <div className="px-3 py-2 border-b border-[var(--border)]">
                    <p className="font-bold text-[var(--text-main)] truncate text-sm">{displayName}</p>
                    <p className="text-muted font-mono text-[11px] truncate dir-ltr text-right">
                      @{user.username}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[var(--semantic-success)]">
                      <ShieldCheck className="h-3.5 w-3.5" />
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
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-muted hover:text-[var(--text-main)] hover:bg-[var(--surface-2)] transition-colors text-right"
                      >
                        <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
                        <span>فضای ابری و امنیت</span>
                      </button>
                    )}

                    {onOpenChangePassword && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenChangePassword();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-muted hover:text-[var(--text-main)] hover:bg-[var(--surface-2)] transition-colors text-right"
                      >
                        <KeyRound className="h-4 w-4 text-[var(--accent)]" />
                        <span>تغییر رمز عبور</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenBackup();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-muted hover:text-[var(--text-main)] hover:bg-[var(--surface-2)] transition-colors text-right"
                    >
                      <Database className="h-4 w-4 text-[var(--accent)]" />
                      <span>پشتیبان‌گیری داده‌ها</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-[var(--border)]">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[var(--semantic-danger)] hover:bg-[var(--semantic-danger)]/15 transition-colors text-right font-semibold"
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

      {/* 2. TOP HEADER BAR: Liquid Glass with Prismatic Top Rim */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-[28px] shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 sm:px-6">
          {/* Right Header Area: Greeting + Subtitle */}
          <div className="flex items-center gap-3">
            {/* Mobile-only logo */}
            <div className="md:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--accent)] shadow-md border border-[var(--border-strong)]">
              <CalendarClock className="h-5 w-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-black tracking-tight text-[var(--text-main)] flex items-center gap-1.5">
                  <span>{greeting}، {displayName}!</span>
                </h1>
                {isWorkingNow && (
                  <span className="badge-success hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--semantic-success)] animate-ping" />
                    حضور فعال
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-muted mt-0.5 flex items-center gap-2">
                <span>برنامه کاری و تقویم تردد شما در ماه جاری</span>
                <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-[var(--border-strong)]" />
                <span className="hidden sm:inline font-mono text-[var(--accent)]">
                  {weekdayName}، {toPersianDigits(todayStr)}
                </span>
              </p>
            </div>
          </div>

          {/* Left Header Area: Search pill, Notification Bell, Live Time & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Pill Input with Liquid Glass */}
            <div className="relative hidden sm:block w-52 md:w-64">
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="جستجو در ترددها و روزها..."
                className="liquid-input w-full rounded-full pr-10 pl-8 py-2 text-xs text-[var(--text-main)] placeholder:text-muted shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange?.('')}
                  aria-label="پاک کردن جستجو"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted hover:text-[var(--text-main)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Notification Bell Circle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotificationToast(!showNotificationToast)}
                title="اعلان‌ها"
                aria-label="اعلان‌های سامانه"
                aria-expanded={showNotificationToast}
                className="liquid-pill-btn relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center text-[var(--text-main)]"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--accent)] ring-2 ring-[var(--bg)]" />
              </button>

              {/* Notification Popover */}
              {showNotificationToast && (
                <div
                  role="region"
                  aria-label="پنجره اعلان‌ها"
                  className="absolute left-0 mt-2 w-72 sm:w-80 rounded-[24px] liquid-glass-modal p-3.5 shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-2">
                    <span className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
                      اعلان‌های سامانه
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNotificationToast(false)}
                      aria-label="بستن اعلان‌ها"
                      className="text-muted hover:text-[var(--text-main)]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-2xl liquid-glass-subtle p-3 border border-[var(--border)]">
                      <span className="font-semibold text-[var(--accent)] block text-xs">
                        تقویم شمسی هوشمند فعال است
                      </span>
                      <p className="text-[11px] text-muted mt-1 leading-relaxed">
                        کلیه تعطیلات رسمی ایران به همراه جزئیات حضور و مرخصی‌ها در تقویم پیشخوان لحاظ شده‌اند.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Clock Pill */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] backdrop-blur-md px-3.5 py-1.5 font-mono text-xs shadow-inner">
              <span className="h-2 w-2 rounded-full bg-[var(--semantic-success)] animate-pulse shadow-sm" />
              <span className="font-bold text-[var(--accent)] tracking-wider">
                {toPersianDigits(liveTime)}
              </span>
            </div>

            {/* Storage Mode Icon Button */}
            {onOpenStorageMode && (
              <button
                type="button"
                onClick={onOpenStorageMode}
                className={`liquid-pill-btn flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center ${
                  storageMode === 'cloud_encrypted'
                    ? 'border-[var(--accent)] bg-[var(--surface-2)] text-[var(--accent)]'
                    : 'text-muted'
                }`}
                title={storageMode === 'cloud_encrypted' ? 'فضای ابری رمزنگاری‌شده فعال است' : 'ذخیره در مرورگر'}
                aria-label={storageMode === 'cloud_encrypted' ? 'تنظیمات فضای ابری رمزنگاری‌شده' : 'تنظیمات حالت ذخیره‌سازی'}
              >
                {storageMode === 'cloud_encrypted' ? (
                  <Lock className="h-4 w-4 text-[var(--accent)]" />
                ) : (
                  <HardDrive className="h-4 w-4 text-muted" />
                )}
              </button>
            )}

            {/* Mobile User Profile Button */}
            {user && (
              <div className="md:hidden relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-label={`منوی حساب کاربری: ${displayName}`}
                  aria-expanded={isUserMenuOpen}
                  className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--accent)] font-bold text-xs border border-[var(--border-strong)] ring-1 ring-[var(--border)]"
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
