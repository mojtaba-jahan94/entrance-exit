import React, { useState } from 'react';
import {
  X,
  Coffee,
  Plus,
  Trash2,
  Clock,
  Edit2,
  Sunrise,
  Sunset,
} from 'lucide-react';
import { LeaveRecord, LeaveType, AttendanceRecord, ShiftConfig } from '../types';
import {
  getCurrentJalaliDate,
  formatJalaliDate,
  parseJalaliDate,
  PERSIAN_MONTH_NAMES,
  toPersianDigits,
  timeStringToMinutes,
  formatMinutesToTimeString,
  formatMinutesToPersianReadable,
} from '../utils/jalali';
import { getLeaveDurationMinutes } from '../utils/calculator';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaves: LeaveRecord[];
  onAddLeave: (leave: Omit<LeaveRecord, 'id' | 'createdAt'>) => void;
  onUpdateLeave: (leave: LeaveRecord) => void;
  onDeleteLeave: (id: string) => void;
  monthlyQuotaHours: number;
  monthlyQuotaDays?: number;
  todayRecord?: AttendanceRecord | null;
  shiftConfig?: ShiftConfig;
}

export const LeaveModal: React.FC<LeaveModalProps> = ({
  isOpen,
  onClose,
  leaves,
  onAddLeave,
  onUpdateLeave,
  onDeleteLeave,
  monthlyQuotaHours,
  monthlyQuotaDays = 2.5,
  todayRecord,
  shiftConfig,
}) => {
  const { jy: curY, jm: curM, jd: curD } = getCurrentJalaliDate();

  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);

  const [day, setDay] = useState<number>(curD);
  const [month, setMonth] = useState<number>(curM);
  const [year, setYear] = useState<number>(curY);
  const [type, setType] = useState<LeaveType>('hourly');

  // Clock-based duration state (hours and minutes)
  const [durationHours, setDurationHours] = useState<number>(1);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [startTime, setStartTime] = useState<string>('08:30');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [reason, setReason] = useState<string>('');

  if (!isOpen) return null;

  // Exact clock calculation of total used and remaining minutes
  const totalUsedMinutes = leaves.reduce(
    (sum, l) => sum + getLeaveDurationMinutes(l, 480),
    0
  );
  const quotaTotalMinutes = monthlyQuotaHours * 60;
  const remainingMinutes = Math.max(0, quotaTotalMinutes - totalUsedMinutes);

  const standardDayMinutes = 8 * 60; // 480 mins
  const usedDays = (totalUsedMinutes / standardDayMinutes).toFixed(1);
  const remainingDays = (remainingMinutes / standardDayMinutes).toFixed(1);

  // Quick preset handlers for hourly leaves based on actual attendance
  const handleApplyPreset = (preset: 'arrival' | 'departure' | 'midday') => {
    setType('hourly');
    if (preset === 'arrival') {
      let s = shiftConfig?.isFlexibleShift
        ? (shiftConfig?.flexStartTimeMax || '09:30')
        : (shiftConfig?.startTime || '08:30');
      let e = todayRecord?.checkIn || '10:30';

      let sMins = timeStringToMinutes(s);
      let eMins = timeStringToMinutes(e);

      if (eMins <= sMins) {
        s = shiftConfig?.flexStartTimeMin || '08:30';
        sMins = timeStringToMinutes(s);
      }
      if (eMins <= sMins) {
        eMins = sMins + 60;
        e = formatMinutesToTimeString(eMins);
      }

      const diff = Math.max(15, eMins - sMins);
      setStartTime(s);
      setEndTime(e);
      setDurationHours(Math.floor(diff / 60));
      setDurationMinutes(diff % 60);
      if (!reason) setReason('مرخصی ساعتی اول وقت (پوشش تاخیر ورود)');
    } else if (preset === 'departure') {
      const s = todayRecord?.checkOut || '15:30';
      const e =
        todayRecord?.targetCheckOut ||
        shiftConfig?.flexDepartureMin ||
        '17:00';
      let sMins = timeStringToMinutes(s);
      let eMins = timeStringToMinutes(e);
      if (eMins <= sMins) {
        eMins = sMins + 90;
      }
      const diff = Math.max(15, eMins - sMins);
      setStartTime(s);
      setEndTime(formatMinutesToTimeString(eMins));
      setDurationHours(Math.floor(diff / 60));
      setDurationMinutes(diff % 60);
      if (!reason) setReason('مرخصی ساعتی آخر وقت (پوشش تعجیل خروج)');
    } else {
      setStartTime('12:00');
      setEndTime('13:30');
      setDurationHours(1);
      setDurationMinutes(30);
      if (!reason) setReason('مرخصی ساعتی میان‌روزی');
    }
  };

  // Clock-aware time inputs: updates duration based on start and end
  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    if (!val) return;
    const sMins = timeStringToMinutes(val);
    const totalDurationMins = durationHours * 60 + durationMinutes;

    if (totalDurationMins > 0) {
      // Shift endTime to preserve chosen duration
      const newEndMins = (sMins + totalDurationMins) % 1440;
      setEndTime(formatMinutesToTimeString(newEndMins));
    } else if (endTime) {
      const eMins = timeStringToMinutes(endTime);
      if (eMins > sMins) {
        const diff = eMins - sMins;
        setDurationHours(Math.floor(diff / 60));
        setDurationMinutes(diff % 60);
      }
    }
  };

  const handleEndTimeChange = (val: string) => {
    setEndTime(val);
    if (!val || !startTime) return;
    const sMins = timeStringToMinutes(startTime);
    const eMins = timeStringToMinutes(val);
    if (eMins > sMins) {
      const diff = eMins - sMins;
      setDurationHours(Math.floor(diff / 60));
      setDurationMinutes(diff % 60);
    }
  };

  // Direct duration change: updates endTime based on startTime + duration
  const handleDurationChange = (newHours: number, newMinutes: number) => {
    const h = Math.max(0, Math.min(8, newHours));
    const m = Math.max(0, Math.min(59, newMinutes));
    setDurationHours(h);
    setDurationMinutes(m);

    const totalMins = h * 60 + m;
    if (totalMins > 0 && startTime) {
      const sMins = timeStringToMinutes(startTime);
      const newEndMins = (sMins + totalMins) % 1440;
      setEndTime(formatMinutesToTimeString(newEndMins));
    }
  };

  const handleStartEdit = (leave: LeaveRecord) => {
    const { jy, jm, jd } = parseJalaliDate(leave.date);
    setYear(jy);
    setMonth(jm);
    setDay(jd);
    setType(leave.type);

    if (leave.type === 'hourly') {
      const s = leave.startTime || '08:30';
      setStartTime(s);
      let e = leave.endTime;
      let totalMins = 0;
      if (s && e) {
        totalMins = Math.max(0, timeStringToMinutes(e) - timeStringToMinutes(s));
      } else if (leave.minutes) {
        totalMins = leave.minutes;
      } else if (leave.hours) {
        totalMins = Math.round(leave.hours * 60);
      }
      if (!e && totalMins > 0) {
        e = formatMinutesToTimeString(timeStringToMinutes(s) + totalMins);
      }
      setEndTime(e || '10:00');
      setDurationHours(Math.floor(totalMins / 60));
      setDurationMinutes(totalMins % 60);
    } else {
      setDurationHours(leave.type === 'half_day' ? 4 : 8);
      setDurationMinutes(0);
    }

    setReason(leave.reason);
    setEditingLeaveId(leave.id);
    setIsAdding(true);
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingLeaveId(null);
    setReason('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateStr = formatJalaliDate(year, month, day);

    let totalLeaveMinutes = 0;
    let leaveHours = 0;

    if (type === 'daily' || type === 'sick' || type === 'unpaid') {
      totalLeaveMinutes = 8 * 60;
      leaveHours = 8;
    } else if (type === 'half_day') {
      totalLeaveMinutes = 4 * 60;
      leaveHours = 4;
    } else {
      totalLeaveMinutes = durationHours * 60 + durationMinutes;
      if (totalLeaveMinutes <= 0) totalLeaveMinutes = 30; // minimum fallback
      leaveHours = Number((totalLeaveMinutes / 60).toFixed(2));
    }

    const payload = {
      date: dateStr,
      type,
      hours: leaveHours,
      minutes: totalLeaveMinutes,
      startTime: type === 'hourly' ? startTime : undefined,
      endTime: type === 'hourly' ? endTime : undefined,
      reason: reason.trim() || 'درخواست مرخصی',
      approved: true,
    };

    if (editingLeaveId) {
      const existing = leaves.find((l) => l.id === editingLeaveId);
      onUpdateLeave({
        ...payload,
        id: editingLeaveId,
        createdAt: existing?.createdAt || new Date().toISOString(),
      });
    } else {
      onAddLeave(payload);
    }

    setIsAdding(false);
    setEditingLeaveId(null);
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
              <p className="text-[11px] sm:text-xs text-slate-400">سهمیه قانونی: ۲.۵ روز (۲۰ ساعت) در هر ماه</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quota Summary Cards (Clock-aware Persian Duration) */}
        <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2 sm:gap-3 text-center shrink-0">
          <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950/70 p-2 sm:p-3">
            <span className="text-[10px] sm:text-[11px] text-slate-400 block mb-0.5 sm:mb-1">سهمیه ماهانه</span>
            <div className="font-mono text-sm sm:text-base font-bold text-white">
              {toPersianDigits(monthlyQuotaDays)} روز
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono mt-0.5">
              ({toPersianDigits(monthlyQuotaHours)} ساعت)
            </div>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950/70 p-2 sm:p-3">
            <span className="text-[10px] sm:text-[11px] text-slate-400 block mb-0.5 sm:mb-1">استفاده شده</span>
            <div className="font-mono text-sm sm:text-base font-bold text-amber-400">
              {toPersianDigits(usedDays)} روز
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate" title={formatMinutesToPersianReadable(totalUsedMinutes)}>
              ({formatMinutesToPersianReadable(totalUsedMinutes)})
            </div>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950/70 p-2 sm:p-3">
            <span className="text-[10px] sm:text-[11px] text-slate-400 block mb-0.5 sm:mb-1">مانده باقیمانده</span>
            <div className="font-mono text-sm sm:text-base font-bold text-emerald-400">
              {toPersianDigits(remainingDays)} روز
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate" title={formatMinutesToPersianReadable(remainingMinutes)}>
              ({formatMinutesToPersianReadable(remainingMinutes)})
            </div>
          </div>
        </div>

        {/* Toggle / Header for Form */}
        {!isAdding ? (
          <div className="mt-3.5 flex items-center justify-between shrink-0">
            <h4 className="text-xs font-bold text-slate-300">سوابق مرخصی ثبت‌شده در این ماه</h4>
            <button
              onClick={() => {
                setEditingLeaveId(null);
                setIsAdding(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>ثبت درخواست مرخصی</span>
            </button>
          </div>
        ) : (
          /* Add / Edit Form */
          <form
            onSubmit={handleSubmit}
            className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/90 p-3 sm:p-4 space-y-3 shrink-0 overflow-y-auto max-h-80"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                {editingLeaveId ? <Edit2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {editingLeaveId ? 'ویرایش مرخصی انتخاب‌شده' : 'فرم ثبت مرخصی جدید'}
              </span>
              <button
                type="button"
                onClick={handleCancelForm}
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
                    <option key={d} value={d}>
                      روز {toPersianDigits(d)}
                    </option>
                  ))}
                </select>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white"
                >
                  {PERSIAN_MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white font-mono"
                >
                  {[1402, 1403, 1404, 1405, 1406].map((yr) => (
                    <option key={yr} value={yr}>
                      {toPersianDigits(yr)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type & Live Duration Preview */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">نوع مرخصی</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as LeaveType)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white"
                >
                  <option value="hourly">مرخصی ساعتی (پاس ساعتی)</option>
                  <option value="half_day">نیم‌روز (۴ ساعت)</option>
                  <option value="daily">روزانه کامل (۱ روز = ۸ ساعت)</option>
                  <option value="sick">استعلاجی</option>
                  <option value="unpaid">بدون حقوق</option>
                </select>
              </div>

              {type === 'hourly' ? (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">مدت زمان (منطق ساعت)</label>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-amber-300 font-bold flex items-center justify-between">
                    <span className="truncate">{formatMinutesToPersianReadable(durationHours * 60 + durationMinutes)}</span>
                    <span className="font-mono text-[11px] text-slate-400 shrink-0">
                      ({formatMinutesToTimeString(durationHours * 60 + durationMinutes)})
                    </span>
                  </div>
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

            {/* Smart Hourly Presets & Time Bounds (Entry & Exit Aware) */}
            {type === 'hourly' && (
              <div className="rounded-2xl bg-slate-900/90 p-3 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    تنظیم بازه و مدت زمان با منطق ساعت:
                  </span>
                  <span className="text-[10px] text-amber-400 font-medium">کسر مستقیم از تاخیر/تعجیل</span>
                </div>

                {/* Quick Presets based on checkIn / checkOut */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('arrival')}
                    className="flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-850 px-2 py-1.5 text-[11px] text-slate-200 hover:text-white hover:border-amber-500/60 hover:bg-amber-500/10 transition-all text-center font-medium"
                    title="پوشش تاخیر ورود از اول وقت تا زمان ورود شما"
                  >
                    <Sunrise className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>اول وقت (تاخیر)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('departure')}
                    className="flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-850 px-2 py-1.5 text-[11px] text-slate-200 hover:text-white hover:border-rose-500/60 hover:bg-rose-500/10 transition-all text-center font-medium"
                    title="پوشش تعجیل خروج از زمان خروج شما تا پایان شیفت"
                  >
                    <Sunset className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                    <span>آخر وقت (تعجیل)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('midday')}
                    className="flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-850 px-2 py-1.5 text-[11px] text-slate-200 hover:text-white hover:border-cyan-500/60 hover:bg-cyan-500/10 transition-all text-center font-medium"
                    title="مرخصی در طول شیفت کاری"
                  >
                    <Coffee className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>بین روز (پاس)</span>
                  </button>
                </div>

                {/* Start and End Time Inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">از ساعت (شروع مرخصی)</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-mono text-white text-center focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">تا ساعت (پایان مرخصی)</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-mono text-white text-center focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Exact Clock Duration: Hours and Minutes Pickers */}
                <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>مدت زمان دقیق (ساعت و دقیقه):</span>
                    <span className="font-mono text-amber-300 font-bold text-xs">
                      {formatMinutesToPersianReadable(durationHours * 60 + durationMinutes)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">ساعت (۰ تا ۸)</label>
                      <input
                        type="number"
                        min="0"
                        max="8"
                        value={durationHours}
                        onChange={(e) => handleDurationChange(parseInt(e.target.value, 10) || 0, durationMinutes)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white text-center font-mono focus:border-amber-500 focus:outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">دقیقه (۰ تا ۵۹)</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        step="5"
                        value={durationMinutes}
                        onChange={(e) => handleDurationChange(durationHours, parseInt(e.target.value, 10) || 0)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white text-center font-mono focus:border-amber-500 focus:outline-none font-bold"
                      />
                    </div>
                  </div>
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

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelForm}
                className="flex-1 rounded-xl border border-slate-800 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-850 transition-colors"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition-colors"
              >
                {editingLeaveId ? 'ذخیره تغییرات مرخصی' : 'ثبت قطعی مرخصی'}
              </button>
            </div>
          </form>
        )}

        {/* Leaves List */}
        <div className="mt-3 overflow-y-auto space-y-2 flex-1 pr-1">
          {leaves.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              هنوز مرخصی‌ای برای این دوره ثبت نشده است.
            </div>
          ) : (
            leaves.map((l) => {
              const durMinutes = getLeaveDurationMinutes(l, 480);
              return (
                <div
                  key={l.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5 text-xs hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="rounded-lg bg-amber-500/10 p-1.5 text-amber-400 shrink-0">
                      <Coffee className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 font-medium text-slate-200">
                        <span className="font-mono text-xs">{toPersianDigits(l.date)}</span>
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 shrink-0">
                          {l.type === 'hourly'
                            ? `ساعتی (${formatMinutesToPersianReadable(durMinutes)})`
                            : l.type === 'half_day'
                            ? 'نیم‌روز (۴ ساعت)'
                            : l.type === 'sick'
                            ? 'استعلاجی'
                            : l.type === 'unpaid'
                            ? 'بدون حقوق'
                            : 'روزانه کامل (۱ روز)'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 truncate">
                        {l.startTime && l.endTime && (
                          <span className="font-mono text-amber-300/90 text-[10px]">
                            از {toPersianDigits(l.startTime)} تا {toPersianDigits(l.endTime)}
                          </span>
                        )}
                        <span className="truncate">{l.reason}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <span className="font-mono text-amber-400 font-bold text-xs sm:text-sm">
                      {formatMinutesToTimeString(durMinutes)}
                    </span>
                    {/* Edit button */}
                    <button
                      onClick={() => handleStartEdit(l)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                      title="ویرایش مرخصی"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={() => onDeleteLeave(l.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="حذف مرخصی"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
