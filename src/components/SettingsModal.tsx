import React, { useState } from 'react';
import { X, Settings, Clock, ShieldCheck, Check, RotateCcw } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Calculate required daily minutes from start & end time
    const startMins = timeStringToMinutes(formData.startTime);
    const endMins = timeStringToMinutes(formData.endTime);
    const dailyMins = Math.max(0, endMins - startMins);

    const updated: ShiftConfig = {
      ...formData,
      requiredDailyMinutes: dailyMins > 0 ? dailyMins : 510,
    };

    onSaveConfig(updated);
    onClose();
  };

  const handleResetDefaults = () => {
    if (window.confirm('آیا مایل به بازنشانی تنظیمات به مقادیر پیش‌فرض هستید؟')) {
      setFormData(DEFAULT_SHIFT_CONFIG);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تنظیمات قوانین شیفت و کارکرد</h3>
              <p className="text-xs text-slate-400">سفارشی‌سازی ساعات موظفی، فرجه تاخیر و تعطیلات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Shift Start & End */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ساعت شروع موظفی
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-mono text-white focus:border-indigo-500 focus:outline-none text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ساعت پایان موظفی
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-mono text-white focus:border-indigo-500 focus:outline-none text-center"
              />
            </div>
          </div>

          {/* Grace Period (فرجه تاخیر مجاز) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              فرجه مجاز تاخیر در ورود (شناوری)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="60"
                value={formData.graceMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, graceMinutes: Math.max(0, parseInt(e.target.value) || 0) })
                }
                className="w-24 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white text-center focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400">
                دقیقه (ورود تا این دقایق پس از شروع شیفت، تاخیر محسوب نخواهد شد)
              </span>
            </div>
          </div>

          {/* Thursday Configuration */}
          <div className="border-t border-slate-800/80 pt-3">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              وضعیت کاری روزهای پنج‌شنبه
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, thursdayStatus: 'half_day' })}
                className={`rounded-xl border py-2 text-xs font-medium transition-all ${
                  formData.thursdayStatus === 'half_day'
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                نیمه‌وقت (۴ ساعت)
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, thursdayStatus: 'off' })}
                className={`rounded-xl border py-2 text-xs font-medium transition-all ${
                  formData.thursdayStatus === 'off'
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                تعطیل کامل
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, thursdayStatus: 'full_day' })}
                className={`rounded-xl border py-2 text-xs font-medium transition-all ${
                  formData.thursdayStatus === 'full_day'
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                روز کاری کامل
              </button>
            </div>
          </div>

          {/* Monthly Leave Quota & Multipliers */}
          <div className="grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                سهمیه مرخصی ماهانه (ساعت)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={formData.monthlyLeaveQuotaHours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    monthlyLeaveQuotaHours: Math.max(0, parseInt(e.target.value) || 0),
                  })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white text-center focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                معادل ۲.۵ روز (۲۰ ساعت) در ماه
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ضریب اضافه کاری عادی
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="3"
                value={formData.overtimeMultiplier}
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
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>پیش‌فرض‌ها</span>
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
                <span>ذخیره تنظیمات</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
