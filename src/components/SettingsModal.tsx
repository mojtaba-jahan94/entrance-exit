import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Clock,
  ShieldCheck,
  Check,
  RotateCcw,
  Coffee,
  Calendar,
  Banknote,
  Sparkles,
  Palette,
  LayoutDashboard,
  TrendingUp,
  Sun,
  Moon,
  Layers,
  Sliders,
  Eye,
} from 'lucide-react';
import { ShiftConfig } from '../types';
import { DEFAULT_SHIFT_CONFIG } from '../utils/calculator';
import {
  toPersianDigits,
  toEnglishDigits,
  timeStringToMinutes,
  formatMinutesToTimeString,
} from '../utils/jalali';
import { APP_THEMES, AppTheme, ThemeConfig } from '../utils/theme';
import {
  UISettings,
  getStoredUISettings,
  saveStoredUISettings,
  GlassBlurLevel,
  AccentColor,
  LayoutDensity,
  DashboardViewMode,
} from '../utils/uiSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ShiftConfig;
  onSaveConfig: (newConfig: ShiftConfig) => void;
  currentTheme?: AppTheme;
  onSelectTheme?: (theme: AppTheme) => void;
  uiSettings?: UISettings;
  onUpdateUISettings?: (settings: UISettings) => void;
  dashboardView?: DashboardViewMode;
  onSelectDashboardView?: (view: DashboardViewMode) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  currentTheme = 'obsidian',
  onSelectTheme,
  uiSettings,
  onUpdateUISettings,
  dashboardView = 'full',
  onSelectDashboardView,
}) => {
  const [formData, setFormData] = useState<ShiftConfig>(config);
  const [localUiSettings, setLocalUiSettings] = useState<UISettings>(uiSettings || getStoredUISettings());
  const [overtimeMultiplierStr, setOvertimeMultiplierStr] = useState<string>(
    config.overtimeMultiplier !== undefined ? String(config.overtimeMultiplier) : '1.4'
  );
  const [holidayMultiplierStr, setHolidayMultiplierStr] = useState<string>(
    config.holidayMultiplier !== undefined ? String(config.holidayMultiplier) : '1.8'
  );
  const [activeTab, setActiveTab] = useState<'shift' | 'thursday' | 'leave' | 'finance' | 'ui'>('shift');

  useEffect(() => {
    if (isOpen) {
      setFormData(config);
      setLocalUiSettings(uiSettings || getStoredUISettings());
      setOvertimeMultiplierStr(
        config.overtimeMultiplier !== undefined ? String(config.overtimeMultiplier) : '1.4'
      );
      setHolidayMultiplierStr(
        config.holidayMultiplier !== undefined ? String(config.holidayMultiplier) : '1.8'
      );
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const leaveDays = Number(formData.monthlyLeaveDays) || 2.5;
    const standardDailyNet = Math.max(
      60,
      (formData.requiredDailyMinutes || 510) - (formData.defaultBreakMinutes || 30)
    );
    const quotaHours = Math.round(leaveDays * (standardDailyNet / 60));

    const parsedOt = parseFloat(toEnglishDigits(overtimeMultiplierStr));
    const otMultiplier = !isNaN(parsedOt) && parsedOt > 0 ? parsedOt : 1.4;

    const parsedHol = parseFloat(toEnglishDigits(holidayMultiplierStr));
    const holMultiplier = !isNaN(parsedHol) && parsedHol > 0 ? parsedHol : 1.8;

    const updated: ShiftConfig = {
      ...formData,
      overtimeMultiplier: otMultiplier,
      holidayMultiplier: holMultiplier,
      monthlyLeaveDays: leaveDays,
      monthlyLeaveQuotaHours: quotaHours,
    };

    onSaveConfig(updated);
    onClose();
  };

  const handleResetDefaults = () => {
    if (window.confirm('آیا مایل به بازنشانی تنظیمات به مقادیر پیش‌فرض محل کار (شناور ۸:۳۰ تا ۱۸:۰۰، ناهار ۳۰ دقیقه، پنج‌شنبه ۴.۵ ساعت و ۲.۵ روز مرخصی) هستید؟')) {
      setFormData(DEFAULT_SHIFT_CONFIG);
      setOvertimeMultiplierStr(String(DEFAULT_SHIFT_CONFIG.overtimeMultiplier));
      setHolidayMultiplierStr(String(DEFAULT_SHIFT_CONFIG.holidayMultiplier));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-[28px] sm:rounded-[32px] glass-panel p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-white/[0.15]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">تنظیمات و شخصی‌سازی قوانین کار</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">سفارشی‌سازی شیفت شناور، ناهار، پنج‌شنبه و مرخصی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Buttons (Smooth Horizontal Scroll on mobile) */}
        <div className="flex items-center gap-1.5 border-b border-slate-800 pt-2.5 pb-2 text-xs overflow-x-auto whitespace-nowrap shrink-0 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('shift')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all ${
              activeTab === 'shift'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            شیفت روزهای عادی
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('thursday')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all ${
              activeTab === 'thursday'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            پنج‌شنبه‌ها (۴.۵س)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leave')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all ${
              activeTab === 'leave'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            سهمیه مرخصی (۲.۵ روز)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('finance')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all ${
              activeTab === 'finance'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ضرایب و مالی
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ui')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all flex items-center gap-1.5 ${
              activeTab === 'ui'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            <span>قالب و ظاهر (UI)</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* TAB 1: SHIFT */}
          {activeTab === 'shift' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-3 text-xs text-indigo-300">
                <span className="font-bold">قوانین شیفت شما:</span> ورود بین <strong>۰۸:۳۰ تا ۰۹:۳۰</strong> بدون تاخیر است. خروج متناظر بین <strong>۱۷:۰۰ تا ۱۸:۰۰</strong> به میزان <strong>۸ ساعت و نیم حضور</strong> می‌باشد که <strong>نیم ساعت آن صرف ناهار</strong> شده و از ساعات خالص کارکرد کسر می‌شود (کارکرد خالص: ۸ ساعت).
              </div>

              {/* Toggle Flexible Shift */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-white block">فعال بودن شیفت شناور</span>
                  <span className="text-[11px] text-slate-400">ورود در بازه تعیین‌شده تاخیر محاسبه نمی‌شود</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isFlexibleShift}
                  onChange={(e) => setFormData({ ...formData, isFlexibleShift: e.target.checked })}
                  className="h-5 w-5 accent-indigo-600 cursor-pointer rounded"
                />
              </div>

              {/* Flexible Start Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    شروع بازه ورود شناور
                  </label>
                  <input
                    type="time"
                    value={formData.flexStartTimeMin || '08:30'}
                    onChange={(e) => setFormData({ ...formData, flexStartTimeMin: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-mono text-white text-center focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">پیش‌فرض: ۰۸:۳۰</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    پایان بازه ورود مجاز (شروع تاخیر)
                  </label>
                  <input
                    type="time"
                    value={formData.flexStartTimeMax || '09:30'}
                    onChange={(e) => setFormData({ ...formData, flexStartTimeMax: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-mono text-white text-center focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">پیش‌فرض: ۰۹:۳۰</span>
                </div>
              </div>

              {/* Flexible Departure Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    حداقل ساعت خروج (ورود ۰۸:۳۰)
                  </label>
                  <input
                    type="time"
                    value={formData.flexDepartureMin || '17:00'}
                    onChange={(e) => setFormData({ ...formData, flexDepartureMin: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-mono text-white text-center focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">پیش‌فرض: ۱۷:۰۰</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    حداکثر ساعت خروج (ورود ۰۹:۳۰)
                  </label>
                  <input
                    type="time"
                    value={formData.flexDepartureMax || '18:00'}
                    onChange={(e) => setFormData({ ...formData, flexDepartureMax: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-mono text-white text-center focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">پیش‌فرض: ۱۸:۰۰</span>
                </div>
              </div>

              {/* Total Presence and Lunch Break */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    مدت کل حضور الزامی روزانه
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="300"
                      max="720"
                      value={formData.requiredDailyMinutes || 510}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requiredDailyMinutes: Math.max(0, parseInt(e.target.value) || 510),
                        })
                      }
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white text-center focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">دقیقه</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    معادل ۸ ساعت و ۳۰ دقیقه حضور فیزیکی
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    کسر خودکار تایم ناهار / استراحت
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={formData.defaultBreakMinutes ?? 30}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          defaultBreakMinutes: Math.max(0, parseInt(e.target.value) || 0),
                        })
                      }
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white text-center focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">دقیقه</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-1 block">
                    کارکرد خالص محاسبه شده: ۸ ساعت در روز
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: THURSDAY */}
          {activeTab === 'thursday' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-xs text-cyan-300">
                <span className="font-bold">قانون پنج‌شنبه‌ها:</span> مدت حضور الزامی پنج‌شنبه‌ها به صورت استاندارد برابر با <strong>۴ ساعت</strong> (۲۴۰ دقیقه) است و تایم ناهار کسر نمی‌گردد.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  وضعیت روزهای پنج‌شنبه
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thursdayStatus: 'half_day' })}
                    className={`rounded-xl border py-2.5 text-xs font-medium transition-all ${
                      formData.thursdayStatus === 'half_day'
                        ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 font-bold shadow-md'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    نیمه‌وقت (۴ ساعت)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thursdayStatus: 'off' })}
                    className={`rounded-xl border py-2.5 text-xs font-medium transition-all ${
                      formData.thursdayStatus === 'off'
                        ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 font-bold shadow-md'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    تعطیل کامل
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thursdayStatus: 'full_day' })}
                    className={`rounded-xl border py-2.5 text-xs font-medium transition-all ${
                      formData.thursdayStatus === 'full_day'
                        ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 font-bold shadow-md'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    روز کاری کامل
                  </button>
                </div>
              </div>

              {formData.thursdayStatus === 'half_day' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    مدت حضور پنج‌شنبه (دقیقه)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="60"
                      max="480"
                      value={formData.thursdayMinutes || 240}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          thursdayMinutes: Math.max(0, parseInt(e.target.value) || 240),
                        })
                      }
                      className="w-32 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white text-center focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">
                      معادل {toPersianDigits(formatMinutesToTimeString(formData.thursdayMinutes || 240))} ساعت حضور موظفی
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LEAVES */}
          {activeTab === 'leave' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-3 text-xs text-amber-300">
                <span className="font-bold">سهمیه مرخصی ماهانه:</span> شما ماهانه دارای <strong>۲.۵ روز حق مرخصی</strong> استحقاقی هستید که با توجه به شیفت ۸ ساعته خالص، معادل <strong>۲۰ ساعت کاری</strong> در ماه محاسبه می‌شود.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    سهمیه مرخصی ماهانه (بر حسب روز)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.monthlyLeaveDays ?? 2.5}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        monthlyLeaveDays: val,
                        monthlyLeaveQuotaHours: Math.round(val * 8),
                      });
                    }}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-mono text-white text-center focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">پیش‌فرض: ۲.۵ روز در ماه</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    معادل سهمیه مرخصی به ساعت
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={Math.round((formData.monthlyLeaveDays || 2.5) * 8)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm font-mono text-amber-300 text-center cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    (۲.۵ روز × ۸ ساعت کار = ۲۰ ساعت)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FINANCE & MULTIPLIERS */}
          {activeTab === 'finance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ضریب اضافه کاری عادی
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="1.4"
                    value={overtimeMultiplierStr}
                    onChange={(e) => {
                      const cleanStr = toEnglishDigits(e.target.value)
                        .replace(/[/٫,]/g, '.')
                        .replace(/[^0-9.]/g, '');
                      const parts = cleanStr.split('.');
                      const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleanStr;
                      setOvertimeMultiplierStr(formatted);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const cur = parseFloat(toEnglishDigits(overtimeMultiplierStr)) || 1.4;
                        setOvertimeMultiplierStr((Math.round((cur + 0.1) * 10) / 10).toString());
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const cur = parseFloat(toEnglishDigits(overtimeMultiplierStr)) || 1.4;
                        const next = Math.max(0.1, Math.round((cur - 0.1) * 10) / 10);
                        setOvertimeMultiplierStr(next.toString());
                      }
                    }}
                    onBlur={() => {
                      const trimmed = toEnglishDigits(overtimeMultiplierStr.trim());
                      if (!trimmed || isNaN(parseFloat(trimmed))) {
                        setOvertimeMultiplierStr('1.4');
                      } else {
                        const parsed = parseFloat(trimmed);
                        if (parsed > 0) {
                          setOvertimeMultiplierStr(String(parsed));
                        } else {
                          setOvertimeMultiplierStr('1.4');
                        }
                      }
                    }}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white text-center focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    قانون کار: ۱.۴ برابر (بدون محدودیت سقف)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ضریب اضافه کار تعطیلات
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="1.8"
                    value={holidayMultiplierStr}
                    onChange={(e) => {
                      const cleanStr = toEnglishDigits(e.target.value)
                        .replace(/[/٫,]/g, '.')
                        .replace(/[^0-9.]/g, '');
                      const parts = cleanStr.split('.');
                      const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleanStr;
                      setHolidayMultiplierStr(formatted);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const cur = parseFloat(toEnglishDigits(holidayMultiplierStr)) || 1.8;
                        setHolidayMultiplierStr((Math.round((cur + 0.1) * 10) / 10).toString());
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const cur = parseFloat(toEnglishDigits(holidayMultiplierStr)) || 1.8;
                        const next = Math.max(0.1, Math.round((cur - 0.1) * 10) / 10);
                        setHolidayMultiplierStr(next.toString());
                      }
                    }}
                    onBlur={() => {
                      const trimmed = toEnglishDigits(holidayMultiplierStr.trim());
                      if (!trimmed || isNaN(parseFloat(trimmed))) {
                        setHolidayMultiplierStr('1.8');
                      } else {
                        const parsed = parseFloat(trimmed);
                        if (parsed > 0) {
                          setHolidayMultiplierStr(String(parsed));
                        } else {
                          setHolidayMultiplierStr('1.8');
                        }
                      }
                    }}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white text-center focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    قانون کار: ۱.۸ تا ۲ برابر (بدون محدودیت سقف)
                  </span>
                </div>
              </div>

              {/* Optional Hourly Wage for Estimation */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    نرخ دستمزد ساعتی تخمینی (اختیاری - تومان)
                  </label>
                  {formData.hourlyRateToman ? (
                    <span className="text-[11px] text-emerald-400 font-bold font-mono">
                      {toPersianDigits(formData.hourlyRateToman.toLocaleString())} تومان
                    </span>
                  ) : null}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="مثال: ۸۳,۴۵۰ تومان (هر رقم دلخواه بدون محدودیت)"
                    value={
                      formData.hourlyRateToman
                        ? formData.hourlyRateToman.toLocaleString('en-US')
                        : ''
                    }
                    onChange={(e) => {
                      const cleanStr = toEnglishDigits(e.target.value).replace(/[^0-9]/g, '');
                      const val = cleanStr ? parseInt(cleanStr, 10) : 0;
                      setFormData({
                        ...formData,
                        hourlyRateToman: val,
                      });
                    }}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-mono text-white text-center focus:border-indigo-500 focus:outline-none tracking-wider"
                  />
                  {formData.hourlyRateToman ? (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, hourlyRateToman: 0 })}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-rose-400 text-xs p-1"
                      title="پاک کردن"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                  <span>امکان وارد کردن هر عدد دلخواه (بدون اجبار به عدد رند)</span>
                  {formData.hourlyRateToman ? (
                    <span className="text-indigo-400 font-medium font-mono">
                      معادل دقیقه: {toPersianDigits(Math.round(formData.hourlyRateToman / 60).toLocaleString())} ت
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: UI & THEMES */}
          {activeTab === 'ui' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/[0.08] glass-subcard p-3 text-xs text-slate-200">
                <span className="font-bold flex items-center gap-1.5 mb-1 text-[var(--accent-color)]">
                  <Palette className="h-4 w-4" />
                  تنظیمات پیشرفته تم شیشه‌ای و ظاهر برنامه (UI)
                </span>
                این بخش به شما امکان کنترل کامل روی میزان شفافیت شیشه، پالت رنگی، چیدمان و ویجت‌های داشبورد را می‌دهد.
              </div>

              {/* 1. Theme Mode: Dark Glass vs Light Glass */}
              <div className="glass-subcard p-3 rounded-2xl border border-white/[0.08] space-y-2">
                <label className="block text-xs font-semibold text-slate-200">
                  قالب ظاهری پایه (روشن / تیره)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...localUiSettings, isLightMode: false };
                      setLocalUiSettings(updated);
                      saveStoredUISettings(updated);
                      onUpdateUISettings?.(updated);
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      !localUiSettings.isLightMode
                        ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/20 text-white shadow-md'
                        : 'glass-pill text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon className="h-4 w-4 text-[var(--accent-color)]" />
                    <span>تم شیشه‌ای شب (تیره)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...localUiSettings, isLightMode: true };
                      setLocalUiSettings(updated);
                      saveStoredUISettings(updated);
                      onUpdateUISettings?.(updated);
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      localUiSettings.isLightMode
                        ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/20 text-white shadow-md'
                        : 'glass-pill text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sun className="h-4 w-4 text-amber-400" />
                    <span>تم کریستالی عاجی (روشن)</span>
                  </button>
                </div>
              </div>

              {/* 2. Accent Color Palette */}
              <div className="glass-subcard p-3 rounded-2xl border border-white/[0.08] space-y-2">
                <label className="block text-xs font-semibold text-slate-200">
                  پالت رنگی تاکیدی (Accent Color)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'indigo', name: 'نیلی مدرن', color: '#3b82f6' },
                    { id: 'emerald', name: 'زمردی', color: '#10b981' },
                    { id: 'cyan', name: 'فیروزه‌ای', color: '#06b6d4' },
                    { id: 'amber', name: 'کهربایی', color: '#f59e0b' },
                    { id: 'rose', name: 'رز متالیک', color: '#f43f5e' },
                    { id: 'purple', name: 'بنفش سایبر', color: '#8b5cf6' },
                  ].map((acc) => {
                    const isSelected = localUiSettings.accentColor === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          const updated: UISettings = { ...localUiSettings, accentColor: acc.id as AccentColor };
                          setLocalUiSettings(updated);
                          saveStoredUISettings(updated);
                          onUpdateUISettings?.(updated);
                        }}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-white/40 bg-white/[0.12] ring-2 ring-white/30 shadow-lg'
                            : 'glass-pill text-slate-300 hover:bg-white/[0.08]'
                        }`}
                      >
                        <div
                          className="h-5 w-5 rounded-full shadow-inner border border-white/30"
                          style={{ backgroundColor: acc.color }}
                        />
                        <span className="text-[10px] font-medium">{acc.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Glass Blur & Density Level */}
              <div className="glass-subcard p-3 rounded-2xl border border-white/[0.08] space-y-2">
                <label className="block text-xs font-semibold text-slate-200">
                  میزان بلور و جلوه مات شیشه (Glass Blur Intensity)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'heavy', title: 'بلور عمیق (۳۲px)', desc: 'مات، نرم و فوق‌العاده لوکس' },
                    { id: 'balanced', title: 'متعادل (۲۰px)', desc: 'استاندارد شیشه‌ای مدرن' },
                    { id: 'subtle', title: 'سبک شفاف (۱۰px)', desc: 'کریستالی با شفافیت بالا' },
                  ].map((level) => {
                    const isSelected = localUiSettings.glassBlur === level.id;
                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => {
                          const updated: UISettings = { ...localUiSettings, glassBlur: level.id as GlassBlurLevel };
                          setLocalUiSettings(updated);
                          saveStoredUISettings(updated);
                          onUpdateUISettings?.(updated);
                        }}
                        className={`flex flex-col items-start p-2.5 rounded-xl border text-right transition-all ${
                          isSelected
                            ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/20 text-white shadow-md'
                            : 'glass-pill text-slate-300 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold text-white mb-0.5">{level.title}</span>
                        <span className="text-[10px] text-slate-400 leading-tight">{level.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Layout Density (Comfortable vs Compact) */}
              <div className="glass-subcard p-3 rounded-2xl border border-white/[0.08] space-y-2">
                <label className="block text-xs font-semibold text-slate-200">
                  تراکم چیدمان و فاصله‌ها (Layout Density)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const updated: UISettings = { ...localUiSettings, layoutDensity: 'comfortable' };
                      setLocalUiSettings(updated);
                      saveStoredUISettings(updated);
                      onUpdateUISettings?.(updated);
                    }}
                    className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all ${
                      localUiSettings.layoutDensity === 'comfortable'
                        ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/20 text-white font-bold shadow-md'
                        : 'glass-pill text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>استاندارد و جادار (پیش‌فرض)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updated: UISettings = { ...localUiSettings, layoutDensity: 'compact' };
                      setLocalUiSettings(updated);
                      saveStoredUISettings(updated);
                      onUpdateUISettings?.(updated);
                    }}
                    className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all ${
                      localUiSettings.layoutDensity === 'compact'
                        ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/20 text-white font-bold shadow-md'
                        : 'glass-pill text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>فشرده و متمرکز (Compact)</span>
                  </button>
                </div>
              </div>

              {/* 5. Default Dashboard View */}
              {onSelectDashboardView && (
                <div className="glass-subcard p-3 rounded-2xl border border-white/[0.08] space-y-2">
                  <label className="block text-xs font-semibold text-slate-200">
                    نمای پیش‌فرض صفحه پیشخوان
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const updated: UISettings = { ...localUiSettings, defaultDashboardView: 'full' };
                        setLocalUiSettings(updated);
                        saveStoredUISettings(updated);
                        onUpdateUISettings?.(updated);
                        onSelectDashboardView('full');
                      }}
                      className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all ${
                        dashboardView === 'full'
                          ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/20 text-white font-bold'
                          : 'glass-pill text-slate-400 hover:text-white'
                      }`}
                    >
                      <LayoutDashboard className="h-3.5 w-3.5 text-cyan-400" />
                      <span>پیشخوان جامع</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const updated: UISettings = { ...localUiSettings, defaultDashboardView: 'calendar' };
                        setLocalUiSettings(updated);
                        saveStoredUISettings(updated);
                        onUpdateUISettings?.(updated);
                        onSelectDashboardView('calendar');
                      }}
                      className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all ${
                        dashboardView === 'calendar'
                          ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/20 text-white font-bold'
                          : 'glass-pill text-slate-400 hover:text-white'
                      }`}
                    >
                      <Calendar className="h-3.5 w-3.5 text-blue-400" />
                      <span>تقویم شمسی</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const updated: UISettings = { ...localUiSettings, defaultDashboardView: 'charts' };
                        setLocalUiSettings(updated);
                        saveStoredUISettings(updated);
                        onUpdateUISettings?.(updated);
                        onSelectDashboardView('charts');
                      }}
                      className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all ${
                        dashboardView === 'charts'
                          ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/20 text-white font-bold'
                          : 'glass-pill text-slate-400 hover:text-white'
                      }`}
                    >
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      <span>نمودارهای آماری</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 6. Dashboard Widget Visibility Controls */}
              <div className="glass-subcard p-3 rounded-2xl border border-white/[0.08] space-y-2.5">
                <label className="block text-xs font-semibold text-slate-200">
                  کنترل نمایش ویجت‌های پیشخوان (Dashboard Widgets)
                </label>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between p-2 rounded-xl glass-pill cursor-pointer">
                    <span className="text-slate-200">نمایش کارت‌های خلاصه آماری ماه جاری (KPI)</span>
                    <input
                      type="checkbox"
                      checked={localUiSettings.showStatsWidget}
                      onChange={(e) => {
                        const updated = { ...localUiSettings, showStatsWidget: e.target.checked };
                        setLocalUiSettings(updated);
                        saveStoredUISettings(updated);
                        onUpdateUISettings?.(updated);
                      }}
                      className="h-4 w-4 accent-[var(--accent-color)] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl glass-pill cursor-pointer">
                    <span className="text-slate-200">نمایش نمودار تحلیلی روند کارکرد روزانه</span>
                    <input
                      type="checkbox"
                      checked={localUiSettings.showChartsWidget}
                      onChange={(e) => {
                        const updated = { ...localUiSettings, showChartsWidget: e.target.checked };
                        setLocalUiSettings(updated);
                        saveStoredUISettings(updated);
                        onUpdateUISettings?.(updated);
                      }}
                      className="h-4 w-4 accent-[var(--accent-color)] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl glass-pill cursor-pointer">
                    <span className="text-slate-200">نمایش جدول آخرین ترددهای ثبت‌شده</span>
                    <input
                      type="checkbox"
                      checked={localUiSettings.showRecentActivityWidget}
                      onChange={(e) => {
                        const updated = { ...localUiSettings, showRecentActivityWidget: e.target.checked };
                        setLocalUiSettings(updated);
                        saveStoredUISettings(updated);
                        onUpdateUISettings?.(updated);
                      }}
                      className="h-4 w-4 accent-[var(--accent-color)] cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>پیش‌فرض‌های محل کار</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition-all"
              >
                <Check className="h-4 w-4" />
                <span>ذخیره و اعمال تنظیمات</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

