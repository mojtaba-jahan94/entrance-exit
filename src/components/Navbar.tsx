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
  Cloud,
  Check,
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
import { ActiveTab } from '../types';
export type { ActiveTab };

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
  const { user, logout, storageMode } = useAuth();
  const [liveTime, setLiveTime] = useState<string>(getCurrentTimeString(true));
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const displayName = user?.displayName || user?.username || 'کاربر سیستم';

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'پیشخوان',
      tag: '01',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: 'timesheet' as ActiveTab,
      label: 'کارنامه',
      tag: '02',
      icon: <TableIcon className="h-4 w-4" />,
    },
    {
      id: 'leaves' as ActiveTab,
      label: 'مرخصی',
      tag: '03',
      icon: <Coffee className="h-4 w-4" />,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'گزارشات',
      tag: '04',
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'تنظیمات',
      tag: '05',
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 transition-all select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* 1. Brand Logo (COMPUTE 11 style) */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-2.5 group focus:outline-none text-right"
            title="COMPUTE 11 - سامانه هوشمند حضور و تردد"
          >
            <div className="flex items-baseline gap-2">
              <span className="font-display tracking-tight text-xl sm:text-2xl font-bold text-white group-hover:text-[#eca8d6] transition-colors">
                COMPUTE<span className="text-[#eca8d6]">.11</span>
              </span>
              <span className="font-mono text-[9px] text-[#eca8d6] border border-[#eca8d6]/30 px-1.5 py-0.5 rounded uppercase">
                ATTENDANCE
              </span>
            </div>
          </button>

          {/* Live Pulse Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-[11px] font-mono text-white/70">
            <span
              className={`w-2 h-2 rounded-full ${
                isWorkingNow
                  ? 'bg-[#eca8d6] animate-pulse shadow-[0_0_8px_#eca8d6]'
                  : 'bg-emerald-500 shadow-[0_0_8px_#4ade80]'
              }`}
            />
            <span className="text-[#eca8d6] font-semibold">{isWorkingNow ? 'LIVE PUNCH' : 'STANDBY'}</span>
            <span className="text-white/30">/</span>
            <span>{toPersianDigits(liveTime)}</span>
          </div>
        </div>

        {/* 2. Middle Navigation Links with active highlight */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative px-3.5 py-2 rounded-full text-xs font-mono transition-all duration-300 flex items-center gap-2 group ${
                  isActive
                    ? 'text-white font-semibold bg-white/[0.08] border border-white/15'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <span className={`text-[10px] ${isActive ? 'text-[#eca8d6]' : 'text-white/30'}`}>
                  {item.tag}
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 left-3 right-3 h-0.5 bg-[#eca8d6] rounded-full shadow-[0_0_8px_#eca8d6]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* 3. Action Buttons & Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick Search */}
          {onSearchChange && (
            <div className="relative hidden xl:block w-40">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="جستجو در روزها..."
                className="w-full bg-black/60 border border-white/10 rounded-full px-3 py-1.5 text-xs font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-[#eca8d6] text-right"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* Quick Punch Button (Deploy Agent Style CTA) */}
          <button
            onClick={onOpenManualEntry}
            className="flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full bg-white hover:bg-white/90 text-black text-xs font-mono font-semibold shadow-lg shadow-white/10 transition-all active:scale-95"
            title="ثبت سریع تردد جدید"
          >
            <Plus className="h-3.5 w-3.5 text-black" />
            <span>ثبت تردد</span>
          </button>

          {/* Dedicated Settings Button */}
          <button
            onClick={() => onTabChange('settings')}
            className={`hidden sm:flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
              activeTab === 'settings'
                ? 'border-[#eca8d6] bg-[#eca8d6]/10 text-[#eca8d6]'
                : 'border-white/10 text-white/70 hover:text-white hover:border-white/30 hover:bg-white/[0.04]'
            }`}
            title="تنظیمات سیستم"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Theme Selector */}
          <div className="hidden sm:block">
            <ThemeSelector currentTheme={currentTheme} onSelectTheme={onSelectTheme} />
          </div>

          {/* User Profile Dropdown */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white font-mono text-xs font-bold hover:border-[#eca8d6] transition-all"
                title={`حساب: ${displayName}`}
              >
                {displayName.charAt(0).toUpperCase()}
              </button>

              {isUserMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-[#09090d] border border-white/15 shadow-2xl p-2.5 z-50 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <p className="font-bold text-white truncate">{displayName}</p>
                    <p className="text-white/40 font-mono text-[10px] truncate dir-ltr text-right">
                      @{user.username}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{storageMode === 'cloud_encrypted' ? 'فضای ابری فعال' : 'ذخیره‌سازی محلی'}</span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onTabChange('settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors text-right"
                    >
                      <Settings className="h-3.5 w-3.5 text-[#eca8d6]" />
                      <span>تنظیمات سیستم و قوانین کار</span>
                    </button>

                    {onOpenChangePassword && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenChangePassword();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors text-right"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-[#eca8d6]" />
                        <span>تغییر کلمه عبور</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenBackup();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors text-right"
                    >
                      <Database className="h-3.5 w-3.5 text-[#eca8d6]" />
                      <span>پشتیبان‌گیری و بازیابی داده‌ها</span>
                    </button>

                    <div className="pt-1 mt-1 border-t border-white/10">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors text-right"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>خروج از حساب</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-full border border-white/10 text-white/70 hover:text-white"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/95 px-4 py-4 space-y-2 animate-in fade-in duration-200">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-mono ${
                  isActive
                    ? 'bg-white text-black font-semibold'
                    : 'text-white/70 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] text-white/40">{item.tag}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
