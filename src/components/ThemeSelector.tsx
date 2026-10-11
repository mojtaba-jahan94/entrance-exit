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
        className="liquid-pill-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
        title="تغییر تم و رنگ‌بندی برنامه"
      >
        <div
          className="h-3 w-3 rounded-full border border-white/30 shadow-sm"
          style={{ backgroundColor: activeThemeObj.previewAccent }}
        />
        <Palette className="h-3.5 w-3.5 text-white/80" />
        <span className="hidden md:inline text-[11px] font-medium text-white/90">تم</span>
      </button>

      {/* Theme Picker Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2.5 w-72 sm:w-80 rounded-[28px] border border-white/20 liquid-glass-modal p-3.5 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-white/15 pb-2.5 mb-2 px-1">
            <span className="text-xs font-bold text-white/95 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              انتخاب تم و پالت رنگی
            </span>
            <span className="text-[10px] text-white/50 font-mono">
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
                  className={`w-full flex items-center justify-between p-2 rounded-2xl text-right transition-all border backdrop-blur-md ${
                    isActive
                      ? 'border-white/30 bg-white/[0.12] shadow-sm'
                      : 'border-transparent hover:bg-white/[0.07] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Swatch Bubble */}
                    <div
                      className="h-6 w-6 rounded-xl border border-white/30 shadow-inner shrink-0 flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${theme.previewBg} 0%, ${theme.previewCard} 50%, ${theme.previewAccent} 100%)`,
                      }}
                    >
                      <div
                        className="h-2 w-2 rounded-full shadow-sm"
                        style={{ backgroundColor: theme.previewAccent }}
                      />
                    </div>

                    <div className="min-w-0 text-right">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white/95 truncate">
                          {theme.persianName}
                        </span>
                        {!theme.isDark && (
                          <span className="rounded-full bg-amber-500/25 border border-amber-400/30 px-1.5 py-0.2 text-[9px] font-semibold text-amber-200">
                            روشن
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-white/60 truncate max-w-[190px]">
                        {theme.description}
                      </p>
                    </div>
                  </div>

                  {isActive && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm">
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
