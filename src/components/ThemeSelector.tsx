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
        className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white/70 hover:bg-white hover:border-black/20 px-2.5 py-1.5 text-xs font-medium text-black/70 hover:text-black transition-all shadow-sm"
        title="تغییر تم و رنگ‌بندی برنامه"
      >
        <div
          className="h-3 w-3 rounded-full border border-black/20 shadow-sm"
          style={{ backgroundColor: activeThemeObj.previewAccent }}
        />
        <Palette className="h-3.5 w-3.5 text-black/50" />
        <span className="hidden md:inline text-[11px] font-medium">تم</span>
      </button>

      {/* Theme Picker Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl border border-black/10 bg-white/95 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.1)] backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-black/[0.06] pb-2 mb-2 px-1">
            <span className="text-xs font-bold text-[#111] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-black/60" />
              انتخاب تم و پالت رنگی
            </span>
            <span className="text-[10px] text-black/40 font-mono">
              {APP_THEMES.length} پالت
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
                      ? 'border-black/20 bg-black/[0.05] shadow-xs'
                      : 'border-transparent hover:bg-black/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Swatch Bubble */}
                    <div
                      className="h-6 w-6 rounded-lg border border-black/15 shadow-xs shrink-0 flex items-center justify-center"
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
                        <span className="text-xs font-semibold text-[#111] truncate">
                          {theme.persianName}
                        </span>
                        {!theme.isDark && (
                          <span className="rounded bg-black/[0.06] px-1 py-0.2 text-[9px] font-mono font-medium text-black/60">
                            روشن
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-black/45 truncate max-w-[190px]">
                        {theme.description}
                      </p>
                    </div>
                  </div>

                  {isActive && (
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#111] text-white">
                      <Check className="h-2.5 w-2.5" />
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
