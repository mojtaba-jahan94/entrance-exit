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
    <div className="relative font-sans" ref={dropdownRef}>
      {/* Theme Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 px-3 py-1.5 text-xs font-mono text-zinc-300 hover:text-white transition-all shadow-sm"
        title="تغییر تم و پالت طراحی"
      >
        <div
          className="h-2.5 w-2.5 rounded-full border border-white/30 shadow-[0_0_8px_rgba(236,168,214,0.4)]"
          style={{ backgroundColor: activeThemeObj.previewAccent }}
        />
        <Palette className="h-3.5 w-3.5 text-zinc-400" />
        <span className="hidden md:inline text-[11px]">تم</span>
      </button>

      {/* Theme Picker Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-3xl border border-white/10 bg-[#09090d]/95 p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5 px-1 font-mono">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#eca8d6]" />
              پالت‌های طراحی و رنگ
            </span>
            <span className="text-[10px] text-zinc-500">
              {APP_THEMES.length} تم موجود
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
                  className={`w-full flex items-center justify-between p-2 rounded-2xl text-right transition-all border ${
                    isActive
                      ? 'border-[#eca8d6]/40 bg-[#eca8d6]/10 shadow-[0_0_15px_rgba(236,168,214,0.15)]'
                      : 'border-transparent hover:bg-white/5 hover:border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Swatch Bubble */}
                    <div
                      className="h-6 w-6 rounded-lg border border-white/20 shadow-xs shrink-0 flex items-center justify-center"
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
                        <span className="text-xs font-semibold text-white truncate">
                          {theme.persianName}
                        </span>
                        {theme.id === 'compute' && (
                          <span className="rounded-full bg-[#eca8d6]/20 border border-[#eca8d6]/30 px-1.5 py-0.2 text-[9px] font-mono text-[#eca8d6]">
                            اصلی
                          </span>
                        )}
                        {!theme.isDark && (
                          <span className="rounded bg-white/10 px-1 py-0.2 text-[9px] font-mono text-zinc-400">
                            روشن
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate max-w-[190px] font-mono">
                        {theme.description}
                      </p>
                    </div>
                  </div>

                  {isActive && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eca8d6] text-[#050507]">
                      <Check className="h-3 w-3 stroke-[3]" />
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
