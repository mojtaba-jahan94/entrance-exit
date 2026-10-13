import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ShiftConfig } from '../types';
import { DEFAULT_SHIFT_CONFIG } from '../utils/calculator';
import {
  toPersianDigits,
  toEnglishDigits,
  formatMinutesToTimeString,
} from '../utils/jalali';
import {
  getStoredUISettings,
  saveStoredUISettings,
  VisualEffectsSetting,
  resolveEffectiveEffects,
  UISettings,
} from '../utils/uiSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ShiftConfig;
  onSaveConfig: (newConfig: ShiftConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<ShiftConfig>(config);
  const [overtimeMultiplierStr, setOvertimeMultiplierStr] = useState<string>(
    config.overtimeMultiplier !== undefined ? String(config.overtimeMultiplier) : '1.4'
  );
  const [holidayMultiplierStr, setHolidayMultiplierStr] = useState<string>(
    config.holidayMultiplier !== undefined ? String(config.holidayMultiplier) : '1.8'
  );
  const [activeTab, setActiveTab] = useState<'shift' | 'thursday' | 'leave' | 'finance' | 'effects'>('shift');
  const [uiSettings, setUiSettings] = useState<UISettings>(getStoredUISettings);

  const handleVisualEffectsChange = (mode: VisualEffectsSetting) => {
    const updated = { ...uiSettings, visualEffects: mode };
    setUiSettings(updated);
    saveStoredUISettings(updated);
  };

  useEffect(() => {
    if (isOpen) {
      setFormData(config);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-[32px] border border-white/20 liquid-glass-modal p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/15 pb-3 sm:pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="rounded-2xl bg-indigo-500/20 p-2.5 text-indigo-300 border border-indigo-400/30 shadow-inner">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white/95">تنظیمات و شخصی‌سازی قوانین کار</h3>
              <p className="text-[11px] sm:text-xs text-white/60">سفارشی‌سازی شیفت شناور، ناهار، پنج‌شنبه و مرخصی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/60 hover:bg-white/15 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 border-b border-white/10 pt-3 pb-2.5 text-xs overflow-x-auto whitespace-nowrap shrink-0 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('shift')}
            className={`px-3.5 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              activeTab === 'shift'
                ? 'liquid-pill-btn-primary shadow-md'
                : 'liquid-pill-btn text-white/70'
            }`}
          >
            شیفت روزهای عادی
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('thursday')}
            className={`px-3.5 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              activeTab === 'thursday'
                ? 'liquid-pill-btn-primary shadow-md'
                : 'liquid-pill-btn text-white/70'
            }`}
          >
            پنج‌شنبه‌ها (۴.۵س)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leave')}
            className={`px-3.5 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              activeTab === 'leave'
                ? 'liquid-pill-btn-primary shadow-md'
                : 'liquid-pill-btn text-white/70'
            }`}
          >
            سهمیه مرخصی (۲.۵ روز)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('finance')}
            className={`px-3.5 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              activeTab === 'finance'
                ? 'liquid-pill-btn-primary shadow-md'
                : 'liquid-pill-btn text-white/70'
            }`}
          >
            ضرایب و مالی
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('effects')}
            className={`px-3.5 py-1.5 rounded-full font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
              activeTab === 'effects'
                ? 'liquid-pill-btn-primary shadow-md'
                : 'liquid-pill-btn text-white/70'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>افکت‌های بصری</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* TAB 1: SHIFT */}
          {activeTab === 'shift' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-indigo-400/30 bg-indigo-500/15 p-3.5 text-xs text-indigo-200 backdrop-blur-md shadow-inner">
                <span className="font-bold">قوانین شیفت شما:</span> ورود بین <strong>۰۸:۳۰ تا ۰۹:۳۰</strong> بدون تاخیر است. خروج متناظر بین <strong>۱۷:۰۰ تا ۱۸:۰۰</strong> به میزان <strong>۸ ساعت و نیم حضور</strong> می‌باشد که <strong>نیم ساعت آن صرف ناهار</strong> شده و از ساعات خالص کارکرد کسر می‌شود (کارکرد خالص: ۸ ساعت).
              </div>

              {/* Toggle Flexible Shift */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
                <div>
                  <span className="text-xs font-bold text-white/95 block">فعال بودن شیفت شناور</span>
                  <span className="text-[11px] text-white/60">ورود در بازه تعیین‌شده تاخیر محاسبه نمی‌شود</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isFlexibleShift}
                  onChange={(e) => setFormData({ ...formData, isFlexibleShift: e.target.checked })}
                  className="h-5 w-5 accent-indigo-500 cursor-pointer rounded"
                />
              </div>

              {/* Flexible Start Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    شروع بازه ورود شناور
                  </label>
                  <input
                    type="time"
                    value={formData.flexStartTimeMin || '08:30'}
                    onChange={(e) => setFormData({ ...formData, flexStartTimeMin: e.target.value })}
                    className="liquid-input w-full px-3 py-2 text-sm font-mono text-white/95 text-center"
                  />
                  <span className="text-[10px] text-white/50 mt-1 block">پیش‌فرض: ۰۸:۳۰</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    پایان بازه ورود مجاز (شروع تاخیر)
                  </label>
                  <input
                    type="time"
                    value={formData.flexStartTimeMax || '09:30'}
                    onChange={(e) => setFormData({ ...formData, flexStartTimeMax: e.target.value })}
                    className="liquid-input w-full px-3 py-2 text-sm font-mono text-white/95 text-center"
                  />
                  <span className="text-[10px] text-white/50 mt-1 block">پیش‌فرض: ۰۹:۳۰</span>
                </div>
              </div>

              {/* Flexible Departure Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    حداقل ساعت خروج (ورود ۰۸:۳۰)
                  </label>
                  <input
                    type="time"
                    value={formData.flexDepartureMin || '17:00'}
                    onChange={(e) => setFormData({ ...formData, flexDepartureMin: e.target.value })}
                    className="liquid-input w-full px-3 py-2 text-sm font-mono text-white/95 text-center"
                  />
                  <span className="text-[10px] text-white/50 mt-1 block">پیش‌فرض: ۱۷:۰۰</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    حداکثر ساعت خروج (ورود ۰۹:۳۰)
                  </label>
                  <input
                    type="time"
                    value={formData.flexDepartureMax || '18:00'}
                    onChange={(e) => setFormData({ ...formData, flexDepartureMax: e.target.value })}
                    className="liquid-input w-full px-3 py-2 text-sm font-mono text-white/95 text-center"
                  />
                  <span className="text-[10px] text-white/50 mt-1 block">پیش‌فرض: ۱۸:۰۰</span>
                </div>
              </div>

              {/* Total Presence and Lunch Break */}
              <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-3">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
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
                      className="liquid-input w-full px-3 py-2 text-xs font-mono text-white/95 text-center"
                    />
                    <span className="text-xs text-white/60">دقیقه</span>
                  </div>
                  <span className="text-[10px] text-white/50 mt-1 block">
                    معادل ۸ ساعت و ۳۰ دقیقه حضور فیزیکی
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
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
                      className="liquid-input w-full px-3 py-2 text-xs font-mono text-white/95 text-center"
                    />
                    <span className="text-xs text-white/60">دقیقه</span>
                  </div>
                  <span className="text-[10px] text-emerald-300 mt-1 block">
                    کارکرد خالص محاسبه شده: ۸ ساعت در روز
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: THURSDAY */}
          {activeTab === 'thursday' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/15 p-3.5 text-xs text-cyan-200 backdrop-blur-md shadow-inner">
                <span className="font-bold">قانون پنج‌شنبه‌ها:</span> مدت حضور الزامی پنج‌شنبه‌ها به صورت استاندارد برابر با <strong>۴ ساعت</strong> (۲۴۰ دقیقه) است و تایم ناهار کسر نمی‌گردد.
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  وضعیت روزهای پنج‌شنبه
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thursdayStatus: 'half_day' })}
                    className={`rounded-2xl border py-2.5 text-xs font-semibold transition-all backdrop-blur-md ${
                      formData.thursdayStatus === 'half_day'
                        ? 'border-cyan-400/50 bg-cyan-500/25 text-cyan-200 shadow-md'
                        : 'border-white/10 bg-white/[0.04] text-white/70 hover:text-white'
                    }`}
                  >
                    نیمه‌وقت (۴ ساعت)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thursdayStatus: 'off' })}
                    className={`rounded-2xl border py-2.5 text-xs font-semibold transition-all backdrop-blur-md ${
                      formData.thursdayStatus === 'off'
                        ? 'border-cyan-400/50 bg-cyan-500/25 text-cyan-200 shadow-md'
                        : 'border-white/10 bg-white/[0.04] text-white/70 hover:text-white'
                    }`}
                  >
                    تعطیل کامل
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thursdayStatus: 'full_day' })}
                    className={`rounded-2xl border py-2.5 text-xs font-semibold transition-all backdrop-blur-md ${
                      formData.thursdayStatus === 'full_day'
                        ? 'border-cyan-400/50 bg-cyan-500/25 text-cyan-200 shadow-md'
                        : 'border-white/10 bg-white/[0.04] text-white/70 hover:text-white'
                    }`}
                  >
                    روز کاری کامل
                  </button>
                </div>
              </div>

              {formData.thursdayStatus === 'half_day' && (
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
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
                      className="liquid-input w-32 px-3 py-2 text-xs font-mono text-white/95 text-center"
                    />
                    <span className="text-xs text-white/60">
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
              <div className="rounded-2xl border border-amber-400/30 bg-amber-500/15 p-3.5 text-xs text-amber-200 backdrop-blur-md shadow-inner">
                <span className="font-bold">سهمیه مرخصی ماهانه:</span> شما ماهانه دارای <strong>۲.۵ روز حق مرخصی</strong> استحقاقی هستید که با توجه به شیفت ۸ ساعته خالص، معادل <strong>۲۰ ساعت کاری</strong> در ماه محاسبه می‌شود.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
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
                    className="liquid-input w-full px-3 py-2 text-sm font-mono text-white/95 text-center"
                  />
                  <span className="text-[10px] text-white/50 mt-1 block">پیش‌فرض: ۲.۵ روز در ماه</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    معادل سهمیه مرخصی به ساعت
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={Math.round((formData.monthlyLeaveDays || 2.5) * 8)}
                    className="liquid-input w-full px-3 py-2 text-sm font-mono text-amber-300 text-center cursor-not-allowed opacity-80"
                  />
                  <span className="text-[10px] text-white/50 mt-1 block">
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
                  <label className="block text-xs font-semibold text-white/80 mb-1">
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
                    className="liquid-input w-full px-3 py-2 text-xs font-mono text-white/95 text-center"
                  />
                  <span className="text-[10px] text-white/50 mt-0.5 block">
                    قانون کار: ۱.۴ برابر (بدون محدودیت سقف)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
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
                    className="liquid-input w-full px-3 py-2 text-xs font-mono text-white/95 text-center"
                  />
                  <span className="text-[10px] text-white/50 mt-0.5 block">
                    قانون کار: ۱.۸ تا ۲ برابر (بدون محدودیت سقف)
                  </span>
                </div>
              </div>

              {/* Optional Hourly Wage for Estimation */}
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-white/80">
                    نرخ دستمزد ساعتی تخمینی (اختیاری - تومان)
                  </label>
                  {formData.hourlyRateToman ? (
                    <span className="text-[11px] text-emerald-300 font-bold font-mono">
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
                    className="liquid-input w-full px-3 py-2 text-xs font-mono text-white/95 text-center tracking-wider"
                  />
                  {formData.hourlyRateToman ? (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, hourlyRateToman: 0 })}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-rose-400 text-xs p-1"
                      title="پاک کردن"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
                <div className="flex items-center justify-between text-[10px] text-white/50 mt-1.5">
                  <span>امکان وارد کردن هر عدد دلخواه (بدون اجبار به عدد رند)</span>
                  {formData.hourlyRateToman ? (
                    <span className="text-indigo-300 font-medium font-mono">
                      معادل دقیقه: {toPersianDigits(Math.round(formData.hourlyRateToman / 60).toLocaleString())} ت
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: VISUAL EFFECTS */}
          {activeTab === 'effects' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-indigo-400/30 bg-indigo-500/15 p-3.5 text-xs text-indigo-200 backdrop-blur-md shadow-inner">
                <span className="font-bold">تنظیم مصرف منابع و پویانمایی:</span> در حالت «کم»، انیمیشن حباب‌های پس‌زمینه، فیلتر نویز، دنبال‌کردن ماوس و کانفتی خاموش شده و بلور تا سقف ۱۲px کاهش می‌یابد تا دستگاه‌های ضعیف روان کار کنند.
              </div>

              <div className="space-y-3">
                <div
                  onClick={() => handleVisualEffectsChange('auto')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    uiSettings.visualEffects === 'auto'
                      ? 'border-indigo-400 bg-indigo-500/20 shadow-md text-white'
                      : 'border-white/10 bg-white/[0.04] hover:border-white/20 text-white/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">خودکار (پیش‌فرض)</span>
                    {uiSettings.visualEffects === 'auto' && <Check className="w-4 h-4 text-indigo-300" />}
                  </div>
                  <p className="text-[11px] text-white/60">
                    تشخیص خودکار بر اساس قدرت سخت‌افزار (رم و پردازنده) یا ترجیح کاهش حرکت در سیستم عامل
                  </p>
                </div>

                <div
                  onClick={() => handleVisualEffectsChange('high')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    uiSettings.visualEffects === 'high'
                      ? 'border-indigo-400 bg-indigo-500/20 shadow-md text-white'
                      : 'border-white/10 bg-white/[0.04] hover:border-white/20 text-white/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">کامل (High Effects)</span>
                    {uiSettings.visualEffects === 'high' && <Check className="w-4 h-4 text-indigo-300" />}
                  </div>
                  <p className="text-[11px] text-white/60">
                    انیمیشن‌های روان پس‌زمینه، افکت بازتاب مایع شیشه روی ماوس و کانفتی شادباش پایان شیفت
                  </p>
                </div>

                <div
                  onClick={() => handleVisualEffectsChange('low')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    uiSettings.visualEffects === 'low'
                      ? 'border-indigo-400 bg-indigo-500/20 shadow-md text-white'
                      : 'border-white/10 bg-white/[0.04] hover:border-white/20 text-white/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">کم (Low Effects)</span>
                    {uiSettings.visualEffects === 'low' && <Check className="w-4 h-4 text-indigo-300" />}
                  </div>
                  <p className="text-[11px] text-white/60">
                    بدون حرکت حباب‌ها، بدون افکت ماوس، بدون کانفتی، بلور حداکثر ۱۲px (حداقل مصرف باتری و رم)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="liquid-pill-btn flex items-center gap-1.5 px-3 py-2 text-xs text-white/60 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>پیش‌فرض‌های محل کار</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="liquid-pill-btn px-4 py-2 text-xs font-semibold"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="liquid-pill-btn-primary flex items-center gap-1.5 px-5 py-2 text-xs font-bold"
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
