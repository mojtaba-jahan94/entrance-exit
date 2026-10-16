import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import { APP_THEMES, AppTheme, ThemeConfig } from '../utils/theme';

interface ThemeSelectorProps {
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const activeThemeObj = APP_THEMES.find((t) => t.id === currentTheme) || APP_THEMES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Theme Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-2xl border border-[#D1D5DB] bg-white hover:bg-[#F7F7F2] px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-[#1F2933] transition-all shadow-sm"
        title="تغییر تم و رنگ‌بندی برنامه"
      >
        <div
          className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-sm"
          style={{ backgroundColor: activeThemeObj.previewAccent }}
        />
        <Palette className="h-4 w-4 text-[#A68A64]" />
        <span className="hidden md:inline text-[11px] font-medium">تم</span>
      </button>

      {/* Theme Picker Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-[#D1D5DB] bg-white p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-[#1F2933]">
          <div className="flex items-center justify-between border-b border-[#D1D5DB] pb-2 mb-2 px-1">
            <span className="text-xs font-bold text-[#1F2933] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#A68A64]" />
              انتخاب تم و پالت رنگی
            </span>
            <span className="text-[10px] text-[#6B7280] font-mono">
              {APP_THEMES.length} پالت مدرن
            </span>
          </div>

          <div className="space-y-1.5">
            {APP_THEMES.map((theme: ThemeConfig) => {
              const isActive = theme.id === currentTheme;
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    onSelectTheme(theme.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-right transition-all border ${
                    isActive
                      ? 'border-[#A68A64] bg-[#F5F0E6] shadow-sm'
                      : 'border-transparent hover:bg-[#F7F7F2] text-[#6B7280] hover:text-[#1F2933]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Swatch Bubble */}
                    <div
                      className="h-6 w-6 rounded-lg border border-[#D1D5DB] shadow-inner shrink-0 flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${theme.previewBg} 0%, ${theme.previewCard} 50%, ${theme.previewAccent} 100%)`,
                      }}
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: theme.previewAccent }}
                      />
                    </div>

                    <div className="min-w-0 text-right">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#1F2933] truncate">
                          {theme.persianName}
                        </span>
                        {!theme.isDark && (
                          <span className="rounded bg-[#F5F0E6] border border-[#A68A64]/30 px-1 py-0.2 text-[9px] font-semibold text-[#A68A64]">
                            روشن
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#6B7280] truncate max-w-[190px]">
                        {theme.description}
                      </p>
                    </div>
                  </div>

                  {isActive && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#A68A64] text-white">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
