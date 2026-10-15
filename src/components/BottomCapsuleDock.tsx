import React from 'react';
import {
  LayoutDashboard,
  Table as TableIcon,
  Calendar,
  Coffee,
  TrendingUp,
  Settings,
  Plus,
} from 'lucide-react';

import { AppTheme } from '../utils/theme';

export type ActiveTab =
  | 'dashboard'
  | 'timesheet'
  | 'calendar'
  | 'leaves'
  | 'reports'
  | 'settings';

export interface BottomCapsuleDockProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenManualEntry: () => void;
  onOpenSettings?: () => void;
  isWorkingNow?: boolean;
  currentTheme?: AppTheme;
  onSelectTheme?: (theme: AppTheme) => void;
  onOpenBackup?: () => void;
  onOpenChangePassword?: () => void;
  onOpenStorageMode?: () => void;
}

export const BottomCapsuleDock: React.FC<BottomCapsuleDockProps> = ({
  activeTab,
  onTabChange,
  onOpenManualEntry,
  onOpenSettings,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'پیشخوان',
      icon: <LayoutDashboard className="h-4 w-4 sm:h-4.5 sm:w-4.5" />,
    },
    {
      id: 'timesheet' as ActiveTab,
      label: 'کارنامه',
      icon: <TableIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />,
    },
    {
      id: 'calendar' as ActiveTab,
      label: 'تقویم',
      icon: <Calendar className="h-4 w-4 sm:h-4.5 sm:w-4.5" />,
    },
    {
      id: 'leaves' as ActiveTab,
      label: 'مرخصی‌ها',
      icon: <Coffee className="h-4 w-4 sm:h-4.5 sm:w-4.5" />,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'گزارشات',
      icon: <TrendingUp className="h-4 w-4 sm:h-4.5 sm:w-4.5" />,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'تنظیمات',
      icon: <Settings className="h-4 w-4 sm:h-4.5 sm:w-4.5" />,
    },
  ];

  return (
    <nav
      aria-label="داک ناوبری شناور نوردیک"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-full bg-[#1F2933]/95 backdrop-blur-md border border-[#6B7280]/30 shadow-2xl text-[#F7F7F2] max-w-[96vw] select-none transition-all duration-300"
    >
      {/* Navigation Tab Pills */}
      {navItems.map((item) => {
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
            title={item.label}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-full transition-all duration-200 ${
              isActive
                ? 'bg-[#A68A64] text-white font-bold shadow-md shadow-[#A68A64]/30 scale-[1.02]'
                : 'text-[#D1D5DB]/80 hover:text-white hover:bg-white/10'
            }`}
          >
            {item.icon}
            <span
              className={`text-xs whitespace-nowrap transition-all ${
                isActive ? 'inline font-bold' : 'hidden md:inline font-medium'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}

      {/* Divider */}
      <div className="h-5 w-px bg-white/15 mx-0.5" />

      {/* Quick Add Manual Entry Button */}
      <button
        onClick={onOpenManualEntry}
        title="ثبت دستی تردد جدید"
        className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-[#2E6F40] hover:bg-[#255833] text-white shadow-md shadow-[#2E6F40]/30 transition-all font-bold text-xs shrink-0 active:scale-95"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline whitespace-nowrap">ثبت دستی</span>
      </button>
    </nav>
  );
};

export default BottomCapsuleDock;
