import React, { useEffect, useState, useId } from 'react';
import {
  LayoutDashboard,
  Table as TableIcon,
  Coffee,
  TrendingUp,
  Settings,
} from 'lucide-react';
import { ActiveTab } from './Navbar';

interface BottomCapsuleDockProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
  settingsButtonRef: React.RefObject<HTMLButtonElement | null>;
}

interface DockItem {
  id: ActiveTab | 'settings';
  label: string;
  icon: React.ReactNode;
  isAction?: boolean;
}

export const BottomCapsuleDock: React.FC<BottomCapsuleDockProps> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  settingsButtonRef,
}) => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const dockId = useId();

  // Detect virtual keyboard on mobile via visualViewport
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      // If visual viewport height is significantly less than window.innerHeight, virtual keyboard is open
      const isKeyboard = vv.height < window.innerHeight * 0.78;
      setIsKeyboardOpen(isKeyboard);
    };

    vv.addEventListener('resize', handleResize);
    return () => vv.removeEventListener('resize', handleResize);
  }, []);

  const items: DockItem[] = [
    {
      id: 'dashboard',
      label: 'پیشخوان',
      icon: <LayoutDashboard className="h-5 w-5 shrink-0" />,
    },
    {
      id: 'timesheet',
      label: 'کارنامه',
      icon: <TableIcon className="h-5 w-5 shrink-0" />,
    },
    {
      id: 'leaves',
      label: 'مرخصی',
      icon: <Coffee className="h-5 w-5 shrink-0" />,
    },
    {
      id: 'reports',
      label: 'گزارشات',
      icon: <TrendingUp className="h-5 w-5 shrink-0" />,
    },
    {
      id: 'settings',
      label: 'تنظیمات',
      icon: <Settings className="h-5 w-5 shrink-0" />,
      isAction: true,
    },
  ];

  if (isKeyboardOpen) {
    // Hide dock when virtual keyboard is active to prevent obstructing text inputs
    return null;
  }

  return (
    <nav
      id={`capsule-dock-${dockId}`}
      aria-label="ناوبری اصلی کپسولی"
      className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 print:hidden transition-all duration-300 pointer-events-auto"
    >
      <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface)]/95 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 max-w-[calc(100vw-1.5rem)]">
        {items.map((item) => {
          if (item.isAction) {
            // Action button: opens SettingsModal
            return (
              <button
                key={item.id}
                ref={settingsButtonRef}
                type="button"
                onClick={onOpenSettings}
                aria-haspopup="dialog"
                aria-label="تنظیمات سیستم و قوانین کار"
                title="تنظیمات قوانین کار و شیفت"
                className="relative flex items-center justify-center min-w-[44px] min-h-[44px] h-11 px-2.5 sm:px-3 rounded-full text-muted hover:text-text hover:bg-[var(--surface-2)] transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
              >
                {item.icon}
                <span className="hidden sm:inline text-xs font-semibold mr-1.5">
                  {item.label}
                </span>
              </button>
            );
          }

          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id as ActiveTab)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              className={`relative flex items-center justify-center min-w-[44px] min-h-[44px] h-11 rounded-full transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--focus)] ${
                isActive
                  ? 'liquid-pill-btn-primary px-3.5 sm:px-4 shadow-lg scale-[1.02]'
                  : 'text-muted hover:text-text hover:bg-[var(--surface-2)] px-2.5 sm:px-3'
              }`}
            >
              {item.icon}
              {/* Show text label on active item always; on sm+ screens show on all */}
              <span
                className={`text-xs font-bold mr-1.5 whitespace-nowrap ${
                  isActive ? 'inline' : 'hidden sm:inline'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
