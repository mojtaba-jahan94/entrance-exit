import React, { useState } from 'react';
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
} from 'lucide-react';
import { ShiftConfig } from '../types';
import { DEFAULT_SHIFT_CONFIG } from '../utils/calculator';
import { toPersianDigits, timeStringToMinutes } from '../utils/jalali';

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
  const [activeTab, setActiveTab] = useState<'shift' | 'thursday' | 'leave' | 'finance'>('shift');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const leaveDays = Number(formData.monthlyLeaveDays) || 2.5;
    const standardDailyNet = Math.max(
      60,
      (formData.requiredDailyMinutes || 510) - (formData.defaultBreakMinutes || 30)
    );
    const quotaHours = Math.round(leaveDays * (standardDailyNet / 60));

    const updated: ShiftConfig = {
      ...formData,
      monthlyLeaveDays: leaveDays,
      monthlyLeaveQuotaHours: quotaHours,
    };

    onSaveConfig(updated);
    onClose();
  };

  const handleResetDefaults = () => {
    if (window.confirm('آیا مایل به بازنشانی تنظیمات به مقادیر پیش‌فرض محل کار (شناور ۸:۳۰ تا ۱۸:۰۰، ناهار ۳۰ دقیقه، پنج‌شنبه ۴.۵ ساعت و ۲.۵ روز مرخصی) هستید؟')) {
      setFormData(DEFAULT_SHIFT_CONFIG);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
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
                <span className="font-bold">قانون پنج‌شنبه‌ها:</span> مدت حضور الزامی پنج‌شنبه‌ها برابر با <strong>۴ ساعت و ۳۰ دقیقه</strong> (۲۷۰ دقیقه) است و تایم ناهار کسر نمی‌گردد.
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
                    نیمه‌وقت (۴.۵ ساعت)
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
                      value={formData.thursdayMinutes || 270}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          thursdayMinutes: Math.max(0, parseInt(e.target.value) || 270),
                        })
                      }
                      className="w-32 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white text-center focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">
                      معادل {toPersianDigits('۴:۳۰')} ساعت حضور موظفی
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
                    value={formData.monthlyLeaveDays || 2.5}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
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
                    type="number"
                    step="0.1"
                    min="1"
                    max="3"
                    value={formData.overtimeMultiplier || 1.4}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        overtimeMultiplier: parseFloat(e.target.value) || 1.4,
                      })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white text-center focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    قانون کار: ۱.۴ برابر
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ضریب اضافه کار تعطیلات
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="3"
                    value={formData.holidayMultiplier || 1.8}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        holidayMultiplier: parseFloat(e.target.value) || 1.8,
                      })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white text-center focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    قانون کار: ۱.۸ تا ۲ برابر
                  </span>
                </div>
              </div>

              {/* Optional Hourly Wage for Estimation */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  نرخ دستمزد ساعتی تخمینی (اختیاری - تومان)
                </label>
                <input
                  type="number"
                  step="5000"
                  min="0"
                  placeholder="مثال: ۸۰,۰۰۰ تومان"
                  value={formData.hourlyRateToman || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hourlyRateToman: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-mono text-white text-center focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  در صورت وارد کردن، تخمین مبلغ اضافه کاری ماه در داشبورد نمایش داده می‌شود.
                </span>
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

