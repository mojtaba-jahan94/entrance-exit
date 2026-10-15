import React, { useState, useEffect, useRef } from 'react';
import {
  CalendarClock,
  Search,
  Bell,
  LogOut,
  KeyRound,
  ShieldCheck,
  Database,
  Lock,
  HardDrive,
  X,
  Sparkles,
  Settings,
} from 'lucide-react';
import {
  getCurrentTimeString,
  getTodayJalaliString,
  getJalaliWeekdayName,
  toPersianDigits,
} from '../utils/jalali';
import { AppTheme } from '../utils/theme';
import { UserProfileInfo } from '../types';
import { ThemeSelector } from './ThemeSelector';
import { useAuth } from '../context/AuthContext';

export type ActiveTab =
  | 'dashboard'
  | 'timesheet'
  | 'calendar'
  | 'leaves'
  | 'reports'
  | 'settings';

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
  userProfile?: UserProfileInfo;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab: _activeTab,
  onTabChange: _onTabChange,
  currentTheme,
  onSelectTheme,
  onOpenManualEntry: _onOpenManualEntry,
  onOpenSettings: _onOpenSettings,
  onOpenBackup,
  onOpenChangePassword,
  onOpenStorageMode,
  isWorkingNow,
  searchQuery = '',
  onSearchChange,
  userProfile,
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

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'صبح بخیر';
    if (hour >= 12 && hour < 17) return 'ظهر بخیر';
    if (hour >= 17 && hour < 21) return 'عصر بخیر';
    return 'شب بخیر';
  }, []);

  const displayName = userProfile?.employeeName?.trim() || user?.displayName || user?.username || 'همکار گرامی';
  const roleTitle = userProfile?.roleTitle || 'کارشناس';
  const avatarBg = userProfile?.avatarColor || '#A68A64';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#D1D5DB] bg-white/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 sm:px-6">
        {/* Right Header Area: Greeting + Subtitle */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#A68A64] text-white shadow-md shadow-[#A68A64]/20">
            <CalendarClock className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-black tracking-tight text-[#1F2933] flex items-center gap-1.5">
                <span>{greeting}، {displayName}!</span>
              </h1>
              {isWorkingNow && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#2E6F40]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#2E6F40] border border-[#2E6F40]/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2E6F40] animate-ping" />
                  حضور فعال
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-[#6B7280] mt-0.5 flex items-center gap-2">
              <span>برنامه کاری و تقویم تردد شما</span>
              <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-[#D1D5DB]" />
              <span className="hidden sm:inline font-mono text-[#A68A64] font-medium">
                {weekdayName}، {toPersianDigits(todayStr)}
              </span>
            </p>
          </div>
        </div>

        {/* Left Header Area: Search pill, Notification Bell, Live Time, Theme & User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Pill Input */}
          <div className="relative hidden sm:block w-44 md:w-56">
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="جستجو در فعالیت‌ها..."
              className="w-full rounded-2xl border border-[#D1D5DB] bg-[#F7F7F2] pr-9 pl-8 py-2 text-xs text-[#1F2933] placeholder-[#6B7280] focus:border-[#A68A64] focus:outline-none focus:ring-2 focus:ring-[#A68A64]/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange?.('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1F2933]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Theme Selector */}
          <div className="hidden sm:block">
            <ThemeSelector currentTheme={currentTheme} onSelectTheme={onSelectTheme} />
          </div>

          {/* Notification Bell Circle */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationToast(!showNotificationToast)}
              title="اعلان‌ها"
              className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl border border-[#D1D5DB] bg-white hover:bg-[#F5F0E6] text-[#1F2933] transition-all shadow-sm"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-[#6B7280]" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#A68A64] ring-2 ring-white" />
            </button>

            {/* Notification Popover */}
            {showNotificationToast && (
              <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl border border-[#D1D5DB] bg-white p-3 shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-[#D1D5DB] pb-2 mb-2">
                  <span className="font-bold text-[#1F2933] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#A68A64]" />
                    اعلان‌های سامانه
                  </span>
                  <button
                    onClick={() => setShowNotificationToast(false)}
                    className="text-[#6B7280] hover:text-[#1F2933]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="rounded-xl bg-[#F5F0E6] p-2.5 border border-[#D1D5DB]">
                    <span className="font-semibold text-[#1F2933] block text-xs">
                      تم نوردیک و تقویم هوشمند فعال است
                    </span>
                    <p className="text-[11px] text-[#6B7280] mt-1 leading-relaxed">
                      کلیه محاسبات شیفت شناور، تعطیلات رسمی و مرخصی‌ها با استاندارد اسکاندیناوی آماده استفاده هستند.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Clock Pill */}
          <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-[#D1D5DB] bg-[#F7F7F2] px-3 py-1.5 font-mono text-xs shadow-inner">
            <span className="h-2 w-2 rounded-full bg-[#2E6F40] animate-pulse" />
            <span className="font-bold text-[#1F2933] tracking-wider">
              {toPersianDigits(liveTime)}
            </span>
          </div>

          {/* Storage Mode Icon Button */}
          {onOpenStorageMode && (
            <button
              onClick={onOpenStorageMode}
              className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl border transition-all ${
                storageMode === 'cloud_encrypted'
                  ? 'border-[#2E6F40]/30 bg-[#2E6F40]/10 text-[#2E6F40] hover:bg-[#2E6F40]/20'
                  : 'border-[#D1D5DB] bg-white text-[#6B7280] hover:text-[#1F2933] hover:bg-[#F5F0E6]'
              }`}
              title={storageMode === 'cloud_encrypted' ? 'فضای ابری رمزنگاری‌شده فعال است' : 'ذخیره در مرورگر'}
            >
              {storageMode === 'cloud_encrypted' ? (
                <Lock className="h-4 w-4 text-[#2E6F40]" />
              ) : (
                <HardDrive className="h-4 w-4 text-[#6B7280]" />
              )}
            </button>
          )}

          {/* User Profile Button with Menu */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl text-white font-bold text-xs sm:text-sm ring-1 ring-black/10 shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: avatarBg }}
                title={`حساب کاربری: ${displayName} (${roleTitle})`}
              >
                {displayName.charAt(0).toUpperCase()}
              </button>

              {isUserMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white border border-[#D1D5DB] shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-[#D1D5DB]">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-[#1F2933] truncate text-sm">{displayName}</p>
                      <span className="shrink-0 text-[10px] font-medium bg-[#F5F0E6] text-[#A68A64] px-2 py-0.5 rounded-full border border-[#A68A64]/30">
                        {roleTitle}
                      </span>
                    </div>
                    <p className="text-[#6B7280] font-mono text-[11px] truncate dir-ltr text-right mt-0.5">
                      @{user.username}
                    </p>
                  </div>
                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        _onTabChange('settings');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#1F2933] hover:bg-[#F5F0E6] transition-colors text-right"
                    >
                      <Settings className="h-4 w-4 text-[#A68A64]" />
                      <span>تنظیمات سامانه</span>
                    </button>
                    {onOpenStorageMode && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenStorageMode();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#1F2933] hover:bg-[#F5F0E6] transition-colors text-right"
                      >
                        <ShieldCheck className="h-4 w-4 text-[#A68A64]" />
                        <span>فضای ابری و امنیت</span>
                      </button>
                    )}
                    {onOpenChangePassword && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenChangePassword();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#1F2933] hover:bg-[#F5F0E6] transition-colors text-right"
                      >
                        <KeyRound className="h-4 w-4 text-[#6B7280]" />
                        <span>تغییر رمز عبور</span>
                      </button>
                    )}
                    {onOpenBackup && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenBackup();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#1F2933] hover:bg-[#F5F0E6] transition-colors text-right"
                      >
                        <Database className="h-4 w-4 text-[#6B7280]" />
                        <span>پشتیبان‌گیری داده‌ها</span>
                      </button>
                    )}
                  </div>
                  <div className="pt-1 border-t border-[#D1D5DB]">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#B91C1C] hover:bg-rose-50 transition-colors text-right font-semibold"
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

export default Navbar;
