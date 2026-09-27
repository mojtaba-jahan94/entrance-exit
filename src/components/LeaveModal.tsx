import React, { useState } from 'react';
import { X, Coffee, Plus, Trash2, Calendar, Clock, CheckCircle, SunMedium, AlertCircle } from 'lucide-react';
import { LeaveRecord, LeaveType } from '../types';
import {
  getCurrentJalaliDate,
  formatJalaliDate,
  PERSIAN_MONTH_NAMES,
  toPersianDigits,
} from '../utils/jalali';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaves: LeaveRecord[];
  onAddLeave: (leave: Omit<LeaveRecord, 'id' | 'createdAt'>) => void;
  onDeleteLeave: (id: string) => void;
  monthlyQuotaHours: number;
  monthlyQuotaDays?: number;
}

export const LeaveModal: React.FC<LeaveModalProps> = ({
  isOpen,
  onClose,
  leaves,
  onAddLeave,
  onDeleteLeave,
  monthlyQuotaHours,
  monthlyQuotaDays = 2.5,
}) => {
  const { jy: curY, jm: curM, jd: curD } = getCurrentJalaliDate();

  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [day, setDay] = useState<number>(curD);
  const [month, setMonth] = useState<number>(curM);
  const [year, setYear] = useState<number>(curY);
  const [type, setType] = useState<LeaveType>('hourly');
  const [hours, setHours] = useState<number>(2);
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [reason, setReason] = useState<string>('');

  if (!isOpen) return null;

  const totalUsedHours = leaves.reduce((sum, l) => sum + (l.hours || 0), 0);
  const remainingHours = Math.max(0, monthlyQuotaHours - totalUsedHours);

  const standardDayHours = 8;
  const usedDays = (totalUsedHours / standardDayHours).toFixed(1);
  const remainingDays = (remainingHours / standardDayHours).toFixed(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateStr = formatJalaliDate(year, month, day);

    let leaveHours = Number(hours);
    if (type === 'daily' || type === 'sick' || type === 'unpaid') {
      leaveHours = 8;
    } else if (type === 'half_day') {
      leaveHours = 4;
    }

    onAddLeave({
      date: dateStr,
      type,
      hours: leaveHours,
      startTime: type === 'hourly' ? startTime : undefined,
      endTime: type === 'hourly' ? endTime : undefined,
      reason: reason.trim() || 'درخواست مرخصی',
      approved: true,
    });

    setIsAdding(false);
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">مدیریت و کاردکس مرخصی‌ها</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">سهمیه قانونی: ۲.۵ روز (۲۰ ساعت) در ماه</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quota Summary Cards (Days & Hours) */}
        <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2 sm:gap-3 text-center shrink-0">
          <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950/70 p-2 sm:p-3">
            <span className="text-[10px] sm:text-[11px] text-slate-400 block mb-0.5 sm:mb-1">سهمیه ماهانه</span>
            <div className="font-mono text-sm sm:text-base font-bold text-white">
              {toPersianDigits(monthlyQuotaDays)} روز
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono mt-0.5">
              ({toPersianDigits(monthlyQuotaHours)} س)
            </div>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950/70 p-2 sm:p-3">
            <span className="text-[10px] sm:text-[11px] text-slate-400 block mb-0.5 sm:mb-1">استفاده شده</span>
            <div className="font-mono text-sm sm:text-base font-bold text-amber-400">
              {toPersianDigits(usedDays)} روز
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono mt-0.5">
              ({toPersianDigits(totalUsedHours.toFixed(1))} س)
            </div>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950/70 p-2 sm:p-3">
            <span className="text-[10px] sm:text-[11px] text-slate-400 block mb-0.5 sm:mb-1">مانده باقیمانده</span>
            <div className="font-mono text-sm sm:text-base font-bold text-emerald-400">
              {toPersianDigits(remainingDays)} روز
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono mt-0.5">
              ({toPersianDigits(remainingHours.toFixed(1))} س)
            </div>
          </div>
        </div>

        {/* Toggle Add Form Button */}
        {!isAdding ? (
          <div className="mt-4 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300">سوابق مرخصی ثبت‌شده در این ماه</h4>
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>ثبت درخواست مرخصی</span>
            </button>
          </div>
        ) : (
          /* Add Form */
          <form onSubmit={handleSubmit} className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                فرم ثبت مرخصی جدید
              </span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                انصراف
              </button>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">تاریخ مرخصی</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={day}
                  onChange={(e) => setDay(parseInt(e.target.value, 10))}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>روز {toPersianDigits(d)}</option>
                  ))}
                </select>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white"
                >
                  {PERSIAN_MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white font-mono"
                >
                  {[1402, 1403, 1404, 1405, 1406].map((yr) => (
                    <option key={yr} value={yr}>{toPersianDigits(yr)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type & Hours */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">نوع مرخصی</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as LeaveType)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white"
                >
                  <option value="hourly">ساعتی (پاس ساعتی)</option>
                  <option value="half_day">نیم‌روز (۴ ساعت)</option>
                  <option value="daily">روزانه کامل (۱ روز = ۸ ساعت)</option>
                  <option value="sick">استعلاجی</option>
                  <option value="unpaid">بدون حقوق</option>
                </select>
              </div>

              {type === 'hourly' ? (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">مدت زمان (ساعت)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="8"
                    value={hours}
                    onChange={(e) => setHours(parseFloat(e.target.value) || 1)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs font-mono text-white text-center"
                  />
                </div>
              ) : type === 'half_day' ? (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">معادل کسر از سهمیه</label>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-2 py-1.5 text-xs text-amber-300 text-center font-bold">
                    ۰.۵ روز (۴ ساعت)
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">معادل کسر از سهمیه</label>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-2 py-1.5 text-xs text-amber-300 text-center font-bold">
                    ۱ روز کامل (۸ ساعت)
                  </div>
                </div>
              )}
            </div>

            {/* Hourly start & end */}
            {type === 'hourly' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">از ساعت</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-2 py-1 text-xs font-mono text-white text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">تا ساعت</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-2 py-1 text-xs font-mono text-white text-center"
                  />
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">علت مرخصی</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="علت درخواست یا امور اداری/شخصی..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-2.5 text-xs font-bold text-slate-950 transition-all shadow-md"
            >
              ثبت و کسر از سهمیه مرخصی
            </button>
          </form>
        )}

        {/* Leaves List */}
        <div className="mt-3 max-h-56 overflow-y-auto space-y-2 flex-1 pr-1">
          {leaves.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              هنوز مرخصی‌ای برای این دوره ثبت نشده است.
            </div>
          ) : (
            leaves.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-amber-500/10 p-1.5 text-amber-400">
                    <Coffee className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-medium text-slate-200">
                      <span>{toPersianDigits(l.date)}</span>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                        {l.type === 'hourly'
                          ? `ساعتی (${toPersianDigits(l.hours)} ساعت)`
                          : l.type === 'half_day'
                          ? 'نیم‌روز (۴ ساعت)'
                          : l.type === 'sick'
                          ? 'استعلاجی'
                          : l.type === 'unpaid'
                          ? 'بدون حقوق'
                          : 'روزانه کامل (۱ روز)'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{l.reason}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-amber-400 font-bold">
                    {toPersianDigits(l.hours)} س
                  </span>
                  <button
                    onClick={() => onDeleteLeave(l.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="حذف مرخصی"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

