import React from 'react';
import {
  LayoutDashboard,
  Table as TableIcon,
  Calendar,
  Coffee,
  TrendingUp,
  Settings,
  Plus,
  CalendarClock,
  ShieldCheck,
  KeyRound,
  Database,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppTheme } from '../utils/theme';
import { ThemeSelector } from './ThemeSelector';

export type ActiveTab =
  | 'dashboard'
  | 'timesheet'
  | 'calendar'
  | 'leaves'
  | 'reports'
  | 'settings';

interface BottomCapsuleDockProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenManualEntry: () => void;
  onOpenSettings?: () => void;
  currentTheme?: AppTheme;
  onSelectTheme?: (theme: AppTheme) => void;
  onOpenBackup?: () => void;
  onOpenChangePassword?: () => void;
  onOpenStorageMode?: () => void;
  isWorkingNow?: boolean;
}

export const BottomCapsuleDock: React.FC<BottomCapsuleDockProps> = ({
  activeTab,
  onTabChange,
  onOpenManualEntry,
  onOpenSettings,
  currentTheme = 'nordic',
  onSelectTheme,
  onOpenBackup,
  onOpenChangePassword,
  onOpenStorageMode,
  isWorkingNow,
}) => {
  const { user, logout, dbStatus } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.displayName || user?.username || 'کاربر';

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'پیشخوان',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      id: 'timesheet' as ActiveTab,
      label: 'کارنامه',
      icon: <TableIcon className="h-5 w-5" />,
    },
    {
      id: 'calendar' as ActiveTab,
      label: 'تقویم',
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      id: 'leaves' as ActiveTab,
      label: 'مرخصی‌ها',
      icon: <Coffee className="h-5 w-5" />,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'گزارشات',
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'تنظیمات',
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <>
      {/* 1. DESKTOP VERTICAL RIGHT DOCK (Nordic Charcoal Surface #1F2933) */}
      <aside className="hidden md:flex fixed top-0 bottom-0 right-0 z-50 w-20 flex-col items-center justify-between py-5 px-2 bg-[#1F2933] border-l border-[#D1D5DB]/20 shadow-2xl">
        {/* Top: Brand Logo */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => onTabChange('dashboard')}
            className="group flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A68A64] hover:bg-[#8F7553] text-[#F7F7F2] shadow-lg shadow-[#A68A64]/30 ring-1 ring-white/20 transition-all hover:scale-105 active:scale-95"
            title="پیشخوان سامانه تردد"
          >
            <CalendarClock className="h-6 w-6 transition-transform group-hover:rotate-12 text-[#F7F7F2]" />
          </button>
        </div>

        {/* Middle Navigation Capsule */}
        <nav className="flex flex-col items-center gap-1.5 rounded-[26px] border border-white/10 bg-[#17202A] p-2 shadow-xl">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={item.label}
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#A68A64] text-white shadow-md shadow-[#A68A64]/40 font-bold scale-105'
                    : 'text-[#D1D5DB]/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.icon}

                {/* Desktop Tooltip */}
                <span className="pointer-events-none absolute right-14 whitespace-nowrap rounded-xl bg-[#1F2933] px-3 py-1.5 text-xs font-semibold text-[#F7F7F2] opacity-0 shadow-xl border border-[#D1D5DB]/20 transition-opacity group-hover:opacity-100 z-50">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Quick Add Entry Divider & Button */}
          <div className="my-1 h-px w-6 bg-white/10" />
          <button
            onClick={onOpenManualEntry}
            title="ثبت سریع تردد جدید"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2E6F40] hover:bg-[#255833] text-white shadow-md shadow-[#2E6F40]/30 transition-all hover:scale-105 active:scale-95 group relative"
          >
            <Plus className="h-5 w-5" />
            <span className="pointer-events-none absolute right-14 whitespace-nowrap rounded-xl bg-[#1F2933] px-3 py-1.5 text-xs font-semibold text-[#F7F7F2] opacity-0 shadow-xl border border-[#D1D5DB]/20 transition-opacity group-hover:opacity-100 z-50">
              ثبت تردد جدید
            </span>
          </button>
        </nav>

        {/* Bottom Utility Controls */}
        <div className="flex flex-col items-center gap-2.5">
          {/* Theme Selector */}
          {onSelectTheme && (
            <ThemeSelector currentTheme={currentTheme} onSelectTheme={onSelectTheme} />
          )}

          {/* User Profile Avatar with Menu */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                title={`حساب کاربری: ${displayName}`}
                className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-[#A68A64] text-white font-bold text-sm shadow-md ring-2 ring-white/20 hover:ring-[#A68A64] transition-all"
              >
                {displayName.charAt(0).toUpperCase()}
                <span
                  className={`absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border-2 border-[#1F2933] ${
                    isWorkingNow
                      ? 'bg-[#2E6F40] animate-pulse'
                      : dbStatus === 'connected'
                      ? 'bg-[#A68A64]'
                      : 'bg-[#D97706]'
                  }`}
                />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-14 bottom-0 w-64 rounded-2xl bg-[#FFFFFF] text-[#1F2933] border border-[#D1D5DB] shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-[#D1D5DB]">
                    <p className="font-bold text-[#1F2933] truncate text-sm">{displayName}</p>
                    <p className="text-[#6B7280] font-mono text-[11px] truncate dir-ltr text-right">
                      @{user.username}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#2E6F40]">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#2E6F40]" />
                      <span>اتصال فعال به سامانه</span>
                    </div>
                  </div>

                  <div className="py-1 space-y-0.5">
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
      </aside>

      {/* 2. MOBILE BOTTOM CAPSULE DOCK (Floating Nordic Capsule #1F2933) */}
      <nav
        aria-label="منوی ناوبری موبایل"
        className="md:hidden fixed bottom-3 left-3 right-3 z-50 flex items-center justify-around py-2 px-2.5 rounded-full bg-[#1F2933]/95 backdrop-blur-xl border border-white/10 shadow-2xl text-[#F7F7F2]"
      >
        {navItems.slice(0, 3).map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-white font-bold bg-[#A68A64] shadow-sm scale-105'
                  : 'text-[#D1D5DB]/75 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}

        {/* Center Quick Add Punch (+) */}
        <button
          onClick={onOpenManualEntry}
          className="flex flex-col items-center justify-center p-2 rounded-full bg-[#2E6F40] hover:bg-[#255833] text-white shadow-lg shadow-[#2E6F40]/30 active:scale-95 transition-all -translate-y-2 border-2 border-[#1F2933]"
          title="ثبت سریع تردد"
        >
          <Plus className="h-5 w-5" />
        </button>

        {navItems.slice(3).map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'settings' && onOpenSettings) {
                  onTabChange('settings');
                } else {
                  onTabChange(item.id);
                }
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-white font-bold bg-[#A68A64] shadow-sm scale-105'
                  : 'text-[#D1D5DB]/75 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default BottomCapsuleDock;
