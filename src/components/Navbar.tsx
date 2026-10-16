import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  CalendarClock,
  LayoutDashboard,
  Table as TableIcon,
  Coffee,
  TrendingUp,
  PlusCircle,
  Database,
  Search,
  LogOut,
  KeyRound,
  ShieldCheck,
  HardDrive,
  Lock,
  X,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import {
  getCurrentTimeString,
  getTodayJalaliString,
  getJalaliWeekdayName,
  toPersianDigits,
} from '../utils/jalali';
import { useAuth } from '../context/AuthContext';

export type ActiveTab = 'dashboard' | 'timesheet' | 'leaves' | 'reports' | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenManualEntry: () => void;
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
  onOpenBackup,
  onOpenChangePassword,
  onOpenStorageMode,
  isWorkingNow,
  searchQuery = '',
  onSearchChange,
}) => {
  const { user, logout, dbStatus, storageMode, hasConflict, setIsConflictModalOpen } = useAuth();
  const [liveTime, setLiveTime] = useState<string>(getCurrentTimeString(true));
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const todayStr = useMemo(() => getTodayJalaliString(), []);
  const weekdayName = useMemo(() => getJalaliWeekdayName(todayStr), [todayStr]);

  // Live second clock update
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

  const displayName = user?.displayName || user?.username || 'همکار گرامی';

  // Dynamic header metadata based on activeTab
  const pageMeta = useMemo(() => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'پیشخوان و تقویم هوشمند',
          subtitle: `${weekdayName}، ${toPersianDigits(todayStr)}`,
          icon: <LayoutDashboard className="h-5 w-5" />,
        };
      case 'timesheet':
        return {
          title: 'کارنامه تردد ماهانه',
          subtitle: 'مشاهده، ویرایش و خروجی اکسل کارکرد',
          icon: <TableIcon className="h-5 w-5" />,
        };
      case 'leaves':
        return {
          title: 'مدیریت مرخصی‌ها',
          subtitle: 'کاردکس استحقاقی، استعلاجی و ساعتی',
          icon: <Coffee className="h-5 w-5" />,
        };
      case 'reports':
        return {
          title: 'گزارشات و تحلیل آماری',
          subtitle: 'شاخص‌های کلیدی، ساعات کاری و اضافه‌کار',
          icon: <TrendingUp className="h-5 w-5" />,
        };
      case 'settings':
        return {
          title: 'مرکز تنظیمات و پیکربندی',
          subtitle: 'قوانین کار، شیفت، مرخصی، مالی و شخصی‌سازی',
          icon: <Settings className="h-5 w-5" />,
        };
    }
  }, [activeTab, weekdayName, todayStr]);

  const isAnyMenuOpen = isUserMenuOpen;

  return (
    <header
      className={`sticky top-0 w-full border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-2xl shadow-sm print:hidden transition-all duration-200 ${
        isAnyMenuOpen ? 'z-50' : 'z-20'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6">
        {/* Right Header Area: Brand / Current Page Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onTabChange('dashboard')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--accent)] shadow-sm border border-[var(--border-strong)] transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
            title="سامانه مدیریت هوشمند تردد"
            aria-label="رفتن به پیشخوان"
          >
            <CalendarClock className="h-5 w-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-text flex items-center gap-1.5">
                <span>{pageMeta.title}</span>
              </h1>
              {isWorkingNow && (
                <span className="badge-success inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--semantic-success)] animate-ping" />
                  حضور فعال
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted mt-0.5 flex items-center gap-2 font-medium">
              <span>{pageMeta.subtitle}</span>
            </p>
          </div>
        </div>

        {/* Left Header Area: Search pill, Notification Bell, Live Time, Quick Add & User Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Search Pill Input */}
          <div className="relative hidden md:block w-48 lg:w-60">
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="جستجو در روزها و تردد..."
              className="liquid-input w-full rounded-full pr-9 pl-7 py-1.5 text-xs text-text placeholder:text-muted shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange?.('')}
                aria-label="پاک کردن جستجو"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Quick Manual Entry Add Button */}
          <button
            type="button"
            onClick={onOpenManualEntry}
            title="ثبت دستی تردد جدید"
            aria-label="ثبت دستی تردد جدید"
            className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-[var(--surface-2)] text-text hover:border-[var(--accent)] border border-[var(--border)] text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <PlusCircle className="h-4 w-4 text-[var(--accent)]" />
            <span className="hidden sm:inline">ثبت تردد</span>
          </button>



          {/* Live Digital Clock Pill */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 font-mono text-xs shadow-inner">
            <span className="h-2 w-2 rounded-full bg-[var(--semantic-success)] animate-pulse" />
            <span className="font-bold text-[var(--accent)] tracking-wider">
              {toPersianDigits(liveTime)}
            </span>
          </div>

          {/* Unresolved Conflict Indicator Badge */}
          {hasConflict && (
            <button
              type="button"
              onClick={() => setIsConflictModalOpen(true)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/50 hover:bg-amber-500/25 text-xs font-bold transition-all active:scale-95 shadow-sm animate-pulse cursor-pointer"
              title="تعارض در همگام‌سازی ابری؛ جهت بررسی و رفع تعارض کلیک کنید"
              aria-label="تعارض حل‌نشده در همگام‌سازی ابری"
            >
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="hidden sm:inline">تعارض حل‌نشده</span>
            </button>
          )}

          {/* Cloud Storage Mode Button */}
          {onOpenStorageMode && (
            <button
              type="button"
              onClick={onOpenStorageMode}
              className={`liquid-pill-btn flex h-9 w-9 items-center justify-center ${
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

          {/* User Profile Avatar with Dropdown */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                title={`حساب کاربری: ${displayName}`}
                aria-label={`حساب کاربری: ${displayName}`}
                aria-expanded={isUserMenuOpen}
                className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border-strong)] font-bold text-xs shadow-sm ring-1 ring-[var(--border)] hover:ring-[var(--focus)] transition-all"
              >
                {displayName.charAt(0).toUpperCase()}
                <span
                  className={`absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)] ${
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
                <div className="absolute left-0 mt-2 w-64 rounded-[26px] bg-[var(--surface)] border border-[var(--border-strong)] p-2.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 shadow-2xl max-h-[calc(100vh-5rem)] overflow-y-auto">
                  <div className="px-3 py-2 border-b border-[var(--border)]">
                    <p className="font-bold text-text truncate text-sm">{displayName}</p>
                    <p className="text-muted font-mono text-[11px] truncate dir-ltr text-right">
                      @{user.username}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[var(--semantic-success)]">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>اتصال امن به سامانه</span>
                    </div>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onTabChange('settings');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-muted hover:text-text hover:bg-[var(--surface-2)] transition-colors text-right font-medium"
                    >
                      <Settings className="h-4 w-4 text-[var(--accent)]" />
                      <span>تنظیمات سیستم و قوانین</span>
                    </button>

                    {onOpenStorageMode && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenStorageMode();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-muted hover:text-text hover:bg-[var(--surface-2)] transition-colors text-right"
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
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-muted hover:text-text hover:bg-[var(--surface-2)] transition-colors text-right"
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
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-muted hover:text-text hover:bg-[var(--surface-2)] transition-colors text-right"
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
      </div>
    </header>
  );
};
