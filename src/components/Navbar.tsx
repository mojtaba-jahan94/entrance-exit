import React, { useState, useEffect, useRef } from 'react';
import {
  CalendarClock,
  LayoutDashboard,
  Table as TableIcon,
  Coffee,
  TrendingUp,
  Plus,
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
  Menu,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const todayStr = getTodayJalaliString();
  const weekdayName = getJalaliWeekdayName(todayStr);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(getCurrentTimeString(true));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.displayName || user?.username || 'کاربر سامانه';

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'پیشخوان',
      enLabel: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: 'timesheet' as ActiveTab,
      label: 'کارنامه تردد',
      enLabel: 'Timesheet',
      icon: <TableIcon className="h-4 w-4" />,
    },
    {
      id: 'leaves' as ActiveTab,
      label: 'مرخصی‌ها',
      enLabel: 'Leaves',
      icon: <Coffee className="h-4 w-4" />,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'گزارشات آماری',
      enLabel: 'Reports',
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ];

  return (
    <header className="fixed top-3 inset-x-0 z-50 flex justify-center px-3 sm:px-4 pointer-events-none select-none">
      <div className="pointer-events-auto w-full max-w-5xl">
        {/* Floating Frosted Capsule Nav */}
        <nav
          className="flex items-center justify-between px-3.5 sm:px-5 py-2.5 rounded-2xl border border-black/[0.08] backdrop-blur-xl bg-[#F5F4F0]/85 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.06),_0_2px_8px_rgba(0,0,0,0.04)]"
          style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
        >
          {/* 1. Left Side: Brand Logo & Live Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onTabChange('dashboard')}
              className="flex items-center gap-2.5 group focus:outline-none"
              title="سامانه مدیریت تردد ایجنتیک"
            >
              <div className="w-8 h-8 rounded-xl bg-[#111] text-white flex items-center justify-center font-mono text-xs font-bold shadow-sm transition-transform group-hover:scale-105 active:scale-95">
                <CalendarClock className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col text-right">
                <span className="font-mono text-[11px] sm:text-xs font-bold tracking-[0.22em] text-[#111] uppercase">
                  AGENTIC
                </span>
                <span className="text-[9px] text-black/40 font-mono tracking-wider -mt-0.5 hidden xs:inline">
                  تردد و شیفت
                </span>
              </div>
            </button>

            {/* Live Status indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/[0.04] border border-black/[0.05] text-[10px] font-mono text-black/60">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isWorkingNow
                    ? 'bg-emerald-500 shadow-[0_0_8px_#4ade80] animate-pulse'
                    : 'bg-black/30'
                }`}
              />
              <span>{isWorkingNow ? 'حاضر در شیفت' : toPersianDigits(liveTime)}</span>
            </div>
          </div>

          {/* 2. Middle: Navigation Links in Clean Agentic Style */}
          <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-black/[0.03] border border-black/[0.05]">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#111] text-white shadow-sm'
                      : 'text-black/60 hover:text-black hover:bg-black/[0.04]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* 3. Right Side Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Search Button */}
            {onSearchChange && (
              <div className="relative hidden xl:block w-40">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="جستجو در روزها..."
                  className="w-full bg-white/70 border border-black/10 rounded-xl px-2.5 py-1.5 text-[11px] text-[#111] placeholder:text-black/30 focus:outline-none focus:border-black/30 focus:bg-white transition-all text-right"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}

            {/* Manual Entry ("START BUILDING" style CTA from reference site) */}
            <button
              onClick={onOpenManualEntry}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#111] text-white text-[11px] font-medium tracking-wide hover:bg-[#2c2c2c] active:scale-95 transition-all shadow-sm"
              title="ثبت دستی تردد جدید"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>ثبت تردد</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 text-black/60 hover:text-black hover:bg-black/[0.04] hover:border-black/20 transition-all"
              title="تنظیمات شیفت"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Theme Selector */}
            <div className="hidden sm:block">
              <ThemeSelector currentTheme={currentTheme} onSelectTheme={onSelectTheme} />
            </div>

            {/* User Dropdown */}
            {user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-black/10 text-[#111] font-mono text-xs font-bold hover:border-black/25 transition-all shadow-sm"
                  title={`حساب: ${displayName}`}
                >
                  {displayName.charAt(0).toUpperCase()}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute left-0 mt-2 w-60 rounded-2xl bg-white/95 border border-black/10 shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-2 z-50 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-black/[0.06] mb-1">
                      <p className="font-bold text-[#111] truncate">{displayName}</p>
                      <p className="text-black/40 font-mono text-[10px] truncate dir-ltr text-right">
                        @{user.username}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>سیستم همگام و فعال</span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      {onOpenStorageMode && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenStorageMode();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-black/70 hover:text-black hover:bg-black/[0.04] transition-colors text-right"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-black/50" />
                          <span>فضای ابری و امنیت</span>
                        </button>
                      )}

                      {onOpenChangePassword && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenChangePassword();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-black/70 hover:text-black hover:bg-black/[0.04] transition-colors text-right"
                        >
                          <KeyRound className="h-3.5 w-3.5 text-black/50" />
                          <span>تغییر رمز عبور</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenBackup();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-black/70 hover:text-black hover:bg-black/[0.04] transition-colors text-right"
                      >
                        <Database className="h-3.5 w-3.5 text-black/50" />
                        <span>پشتیبان‌گیری داده‌ها</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenSettings();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-black/70 hover:text-black hover:bg-black/[0.04] transition-colors text-right"
                      >
                        <Settings className="h-3.5 w-3.5 text-black/50" />
                        <span>تنظیمات شیفت کاری</span>
                      </button>
                    </div>

                    <div className="pt-1 mt-1 border-t border-black/[0.06]">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-right font-medium"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>خروج از حساب</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 text-black/70 hover:bg-black/[0.04] transition-colors"
              aria-label="باز کردن منو"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Menu (Mirroring the reference mobile drawer) */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-2 rounded-2xl border border-black/[0.08] backdrop-blur-xl bg-[#F5F4F0]/95 shadow-[0_12px_32px_rgba(0,0,0,0.08)] p-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#111] text-white shadow-sm'
                        : 'text-black/70 hover:bg-black/[0.04]'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-black/10 text-black/70"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>تنظیمات</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenBackup();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-black/10 text-black/70"
                >
                  <Database className="h-3.5 w-3.5" />
                  <span>پشتیبان</span>
                </button>
              </div>

              <span className="font-mono text-[10px] text-black/40">
                {weekdayName}، {toPersianDigits(todayStr)}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
