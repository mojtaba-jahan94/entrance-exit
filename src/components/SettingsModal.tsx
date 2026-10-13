import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Check,
  RotateCcw,
  Sparkles,
  Sun,
  Moon,
  Laptop,
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
  ThemeMode,
  UISettings,
} from '../utils/uiSettings';
import { useFocusTrap } from '../utils/useFocusTrap';

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
  const modalRef = useFocusTrap(isOpen, onClose);
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

  const handleThemeModeChange = (mode: ThemeMode) => {
    const updated = { ...uiSettings, themeMode: mode };
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        className="relative w-full max-w-xl rounded-[32px] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 sm:pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="rounded-2xl bg-[var(--surface-2)] p-2.5 text-[var(--accent)] border border-[var(--border)] shadow-inner">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 id="settings-modal-title" className="text-sm sm:text-base font-bold text-text">تنظیمات و شخصی‌سازی قوانین کار</h3>
              <p className="text-[11px] sm:text-xs text-muted">سفارشی‌سازی شیفت شناور، ناهار، پنج‌شنبه و مرخصی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="بستن پنجره"
            className="rounded-full p-2 text-muted hover:bg-[var(--surface-2)] hover:text-text transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div
          role="tablist"
          aria-label="بخش‌های تنظیمات"
          className="flex items-center gap-2 border-b border-[var(--border)] pt-3 pb-2.5 text-xs overflow-x-auto whitespace-nowrap shrink-0 no-scrollbar"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'shift'}
            onClick={() => setActiveTab('shift')}
            className={`px-3.5 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              activeTab === 'shift'
                ? 'liquid-pill-btn-primary shadow-md'
                : 'liquid-pill-btn text-muted hover:text-text'
            }`}
          >
            شیفت روزهای عادی
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'thursday'}
            onClick={() => setActiveTab('thursday')}
            className={`px-3.5 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              activeTab === 'thursday'
                ? 'liquid-pill-btn-primary shadow-md'
                : 'liquid-pill-btn text-muted hover:text-text'
            }`}
          >
            پنج‌شنبه‌ها (۴.۵س)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'leave'}
            onClick={() => setActiveTab('leave')}
            className={`px-3.5 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              activeTab === 'leave'
                ? 'liquid-pill-btn-primary shadow-md'
                : 'liquid-pill-btn text-muted hover:text-text'
            }`}
          >
            سهمیه مرخصی (۲.۵ روز)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'finance'}
            onClick={() => setActiveTab('finance')}
            className={`px-3.5 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              activeTab === 'finance'
                ? 'liquid-pill-btn-primary shadow-md'
                : 'liquid-pill-btn text-muted hover:text-text'
            }`}
          >
            ضرایب و مالی
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'effects'}
            onClick={() => setActiveTab('effects')}
            className={`px-3.5 py-1.5 rounded-full font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
              activeTab === 'effects'
                ? 'liquid-pill-btn-primary shadow-md'
                : 'liquid-pill-btn text-muted hover:text-text'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>ظاهر و پویانمایی</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* TAB 1: SHIFT */}
          {activeTab === 'shift' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--semantic-info)]/30 bg-[var(--semantic-info)]/10 p-3.5 text-xs text-[var(--semantic-info)] backdrop-blur-md shadow-inner">
                <span className="font-bold">قوانین شیفت شما:</span> ورود بین <strong>۰۸:۳۰ تا ۰۹:۳۰</strong> بدون تاخیر است. خروج متناظر بین <strong>۱۷:۰۰ تا ۱۸:۰۰</strong> به میزان <strong>۸ ساعت و نیم حضور</strong> می‌باشد که <strong>نیم ساعت آن صرف ناهار</strong> شده و از ساعات خالص کارکرد کسر می‌شود (کارکرد خالص: ۸ ساعت).
              </div>

              {/* Toggle Flexible Shift */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] backdrop-blur-md">
                <div>
                  <span className="text-xs font-bold text-text block">فعال بودن شیفت شناور</span>
                  <span className="text-[11px] text-muted">ورود در بازه تعیین‌شده تاخیر محاسبه نمی‌شود</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isFlexibleShift}
                  onChange={(e) => setFormData({ ...formData, isFlexibleShift: e.target.checked })}
                  className="h-5 w-5 accent-[var(--accent)] cursor-pointer rounded"
                />
              </div>

              {/* Flexible Start Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    شروع بازه ورود شناور
                  </label>
                  <input
                    type="time"
                    value={formData.flexStartTimeMin || '08:30'}
                    onChange={(e) => setFormData({ ...formData, flexStartTimeMin: e.target.value })}
                    className="liquid-input w-full px-3 py-2 text-sm font-mono text-text text-center"
                  />
                  <span className="text-[10px] text-muted mt-1 block">پیش‌فرض: ۰۸:۳۰</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    پایان بازه ورود مجاز (شروع تاخیر)
                  </label>
                  <input
                    type="time"
                    value={formData.flexStartTimeMax || '09:30'}
                    onChange={(e) => setFormData({ ...formData, flexStartTimeMax: e.target.value })}
                    className="liquid-input w-full px-3 py-2 text-sm font-mono text-text text-center"
                  />
                  <span className="text-[10px] text-muted mt-1 block">پیش‌فرض: ۰۹:۳۰</span>
                </div>
              </div>

              {/* Flexible Departure Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    حداقل ساعت خروج (ورود ۰۸:۳۰)
                  </label>
                  <input
                    type="time"
                    value={formData.flexDepartureMin || '17:00'}
                    onChange={(e) => setFormData({ ...formData, flexDepartureMin: e.target.value })}
                    className="liquid-input w-full px-3 py-2 text-sm font-mono text-text text-center"
                  />
                  <span className="text-[10px] text-muted mt-1 block">پیش‌فرض: ۱۷:۰۰</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    حداکثر ساعت خروج (ورود ۰۹:۳۰)
                  </label>
                  <input
                    type="time"
                    value={formData.flexDepartureMax || '18:00'}
                    onChange={(e) => setFormData({ ...formData, flexDepartureMax: e.target.value })}
                    className="liquid-input w-full px-3 py-2 text-sm font-mono text-text text-center"
                  />
                  <span className="text-[10px] text-muted mt-1 block">پیش‌فرض: ۱۸:۰۰</span>
                </div>
              </div>

              {/* Total Presence and Lunch Break */}
              <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-3">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
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
                      className="liquid-input w-full px-3 py-2 text-xs font-mono text-text text-center"
                    />
                    <span className="text-xs text-muted">دقیقه</span>
                  </div>
                  <span className="text-[10px] text-muted mt-1 block">
                    معادل ۸ ساعت و ۳۰ دقیقه حضور فیزیکی
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
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
                      className="liquid-input w-full px-3 py-2 text-xs font-mono text-text text-center"
                    />
                    <span className="text-xs text-muted">دقیقه</span>
                  </div>
                  <span className="text-[10px] text-[var(--semantic-success)] mt-1 block">
                    کارکرد خالص محاسبه شده: ۸ ساعت در روز
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: THURSDAY */}
          {activeTab === 'thursday' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--semantic-info)]/30 bg-[var(--semantic-info)]/10 p-3.5 text-xs text-[var(--semantic-info)] backdrop-blur-md shadow-inner">
                <span className="font-bold">قانون پنج‌شنبه‌ها:</span> مدت حضور الزامی پنج‌شنبه‌ها به صورت استاندارد برابر با <strong>۴ ساعت</strong> (۲۴۰ دقیقه) است و تایم ناهار کسر نمی‌گردد.
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1.5">
                  وضعیت روزهای پنج‌شنبه
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thursdayStatus: 'half_day' })}
                    className={`rounded-2xl border py-2.5 text-xs font-semibold transition-all backdrop-blur-md ${
                      formData.thursdayStatus === 'half_day'
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)] shadow-md'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-muted hover:text-[var(--text-main)]'
                    }`}
                  >
                    نیمه‌وقت (۴ ساعت)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thursdayStatus: 'off' })}
                    className={`rounded-2xl border py-2.5 text-xs font-semibold transition-all backdrop-blur-md ${
                      formData.thursdayStatus === 'off'
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)] shadow-md'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-muted hover:text-[var(--text-main)]'
                    }`}
                  >
                    تعطیل کامل
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thursdayStatus: 'full_day' })}
                    className={`rounded-2xl border py-2.5 text-xs font-semibold transition-all backdrop-blur-md ${
                      formData.thursdayStatus === 'full_day'
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)] shadow-md'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-muted hover:text-[var(--text-main)]'
                    }`}
                  >
                    روز کاری کامل
                  </button>
                </div>
              </div>

              {formData.thursdayStatus === 'half_day' && (
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
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
                      className="liquid-input w-32 px-3 py-2 text-xs font-mono text-text text-center"
                    />
                    <span className="text-xs text-muted">
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
              <div className="rounded-2xl border border-[var(--semantic-warning)]/30 bg-[var(--semantic-warning)]/10 p-3.5 text-xs text-[var(--semantic-warning)] backdrop-blur-md shadow-inner">
                <span className="font-bold">سهمیه مرخصی ماهانه:</span> شما ماهانه دارای <strong>۲.۵ روز حق مرخصی</strong> استحقاقی هستید که با توجه به شیفت ۸ ساعته خالص، معادل <strong>۲۰ ساعت کاری</strong> در ماه محاسبه می‌شود.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
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
                    className="liquid-input w-full px-3 py-2 text-sm font-mono text-text text-center"
                  />
                  <span className="text-[10px] text-muted mt-1 block">پیش‌فرض: ۲.۵ روز در ماه</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    معادل سهمیه مرخصی به ساعت
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={Math.round((formData.monthlyLeaveDays || 2.5) * 8)}
                    className="liquid-input w-full px-3 py-2 text-sm font-mono text-[var(--accent)] text-center cursor-not-allowed opacity-80"
                  />
                  <span className="text-[10px] text-muted mt-1 block">
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
                  <label className="block text-xs font-semibold text-text mb-1">
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
                    className="liquid-input w-full px-3 py-2 text-xs font-mono text-text text-center"
                  />
                  <span className="text-[10px] text-muted mt-0.5 block">
                    قانون کار: ۱.۴ برابر (بدون محدودیت سقف)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
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
                    className="liquid-input w-full px-3 py-2 text-xs font-mono text-text text-center"
                  />
                  <span className="text-[10px] text-muted mt-0.5 block">
                    قانون کار: ۱.۸ تا ۲ برابر (بدون محدودیت سقف)
                  </span>
                </div>
              </div>

              {/* Optional Hourly Wage for Estimation */}
              <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] backdrop-blur-md">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-text">
                    نرخ دستمزد ساعتی تخمینی (اختیاری - تومان)
                  </label>
                  {formData.hourlyRateToman ? (
                    <span className="text-[11px] text-[var(--semantic-success)] font-bold font-mono">
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
                    className="liquid-input w-full px-3 py-2 text-xs font-mono text-text text-center tracking-wider"
                  />
                  {formData.hourlyRateToman ? (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, hourlyRateToman: 0 })}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-[var(--semantic-danger)] text-xs p-1"
                      title="پاک کردن"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted mt-1.5">
                  <span>امکان وارد کردن هر عدد دلخواه (بدون اجبار به عدد رند)</span>
                  {formData.hourlyRateToman ? (
                    <span className="text-[var(--accent)] font-medium font-mono">
                      معادل دقیقه: {toPersianDigits(Math.round(formData.hourlyRateToman / 60).toLocaleString())} ت
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: APPEARANCE & VISUAL EFFECTS */}
          {activeTab === 'effects' && (
            <div className="space-y-5">
              {/* Theme Mode Selector */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-text">
                  <span>حالت نمایش و تم برنامه (پالت نوردیک)</span>
                  <span className="text-[10px] text-muted font-mono">Nordic Palette</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleThemeModeChange('auto')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      uiSettings.themeMode === 'auto'
                        ? 'border-[var(--accent)] bg-[var(--accent)]/15 shadow-md text-text font-bold'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-muted hover:text-text hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <Laptop className="h-4 w-4" />
                    <span className="text-xs">خودکار</span>
                    <span className="text-[10px] text-muted">هماهنگ با سیستم</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeModeChange('dark')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      uiSettings.themeMode === 'dark'
                        ? 'border-[var(--accent)] bg-[var(--accent)]/15 shadow-md text-text font-bold'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-muted hover:text-text hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <Moon className="h-4 w-4" />
                    <span className="text-xs">حالت تیره</span>
                    <span className="text-[10px] text-muted">Nordic Charcoal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeModeChange('light')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      uiSettings.themeMode === 'light'
                        ? 'border-[var(--accent)] bg-[var(--accent)]/15 shadow-md text-text font-bold'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-muted hover:text-text hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <Sun className="h-4 w-4" />
                    <span className="text-xs">حالت روشن</span>
                    <span className="text-[10px] text-muted">Snow Cream</span>
                  </button>
                </div>
              </div>

              {/* Visual Effects Section */}
              <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--text-muted)] backdrop-blur-md">
                  <span className="font-bold text-[var(--text)]">تنظیم مصرف منابع و پویانمایی:</span> در حالت «کم»، انیمیشن حباب‌های پس‌زمینه، فیلتر نویز، دنبال‌کردن ماوس و کانفتی خاموش شده و بلور تا سقف ۱۲px کاهش می‌یابد تا دستگاه‌های ضعیف روان کار کنند.
                </div>

                <div className="space-y-2">
                  <div
                    onClick={() => handleVisualEffectsChange('auto')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      uiSettings.visualEffects === 'auto'
                        ? 'border-[var(--accent)] bg-[var(--accent)]/15 shadow-md text-text font-bold'
                        : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-strong)] text-muted hover:text-text'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold">خودکار (پیش‌فرض)</span>
                      {uiSettings.visualEffects === 'auto' && <Check className="w-4 h-4 text-[var(--accent)]" />}
                    </div>
                    <p className="text-[11px] text-muted">
                      تشخیص خودکار بر اساس قدرت سخت‌افزار یا ترجیح کاهش حرکت در سیستم عامل
                    </p>
                  </div>

                  <div
                    onClick={() => handleVisualEffectsChange('high')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      uiSettings.visualEffects === 'high'
                        ? 'border-[var(--accent)] bg-[var(--accent)]/15 shadow-md text-text font-bold'
                        : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-strong)] text-muted hover:text-text'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold">کامل (High Effects)</span>
                      {uiSettings.visualEffects === 'high' && <Check className="w-4 h-4 text-[var(--accent)]" />}
                    </div>
                    <p className="text-[11px] text-muted">
                      پویانمایی ملایم، بازتاب نوری کوارتز روی ماوس و کانفتی شادباش پایان شیفت
                    </p>
                  </div>

                  <div
                    onClick={() => handleVisualEffectsChange('low')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      uiSettings.visualEffects === 'low'
                        ? 'border-[var(--accent)] bg-[var(--accent)]/15 shadow-md text-text font-bold'
                        : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-strong)] text-muted hover:text-text'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold">کم (Low Effects)</span>
                      {uiSettings.visualEffects === 'low' && <Check className="w-4 h-4 text-[var(--accent)]" />}
                    </div>
                    <p className="text-[11px] text-muted">
                      حداقل مصرف باتری و منابع (بدون حرکت حباب‌ها و بدون بازتاب ماوس، بلور سبک)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="liquid-pill-btn flex items-center gap-1.5 px-3 py-2 text-xs text-muted hover:text-text"
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
