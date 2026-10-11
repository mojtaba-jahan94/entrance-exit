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
  Sparkles,
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
  getJalaliWeekdayIndex,
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
  const approvedLeaves = leaves.filter((l) => l.approved !== false);
  const totalUsedMinutes = approvedLeaves.reduce(
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

  const handleDurationChange = (newHours: number, newMinutes: number) => {
    setDurationHours(newHours);
    setDurationMinutes(newMinutes);

    const totalDurationMins = newHours * 60 + newMinutes;
    if (startTime && totalDurationMins > 0) {
      const sMins = timeStringToMinutes(startTime);
      const newEndMins = (sMins + totalDurationMins) % 1440;
      setEndTime(formatMinutesToTimeString(newEndMins));
    }
  };

  const handleStartEdit = (leave: LeaveRecord) => {
    const parsed = parseJalaliDate(leave.date);
    setYear(parsed.jy);
    setMonth(parsed.jm);
    setDay(parsed.jd);
    setType(leave.type);

    if (leave.type === 'hourly') {
      const s = leave.startTime || '08:30';
      setStartTime(s);
      let e = leave.endTime;
      let totalMins = 0;
      if (leave.minutes) {
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

  const selectedDateStr = formatJalaliDate(year, month, day);
  const selectedWeekdayIdx = getJalaliWeekdayIndex(selectedDateStr);
  const isSelectedThursday = selectedWeekdayIdx === 5;
  const isThursdayHalfDay =
    isSelectedThursday &&
    (shiftConfig?.thursdayStatus === 'half_day' || !shiftConfig?.thursdayStatus);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateStr = formatJalaliDate(year, month, day);

    let totalLeaveMinutes = 0;
    let leaveHours = 0;

    if (type === 'daily' || type === 'sick' || type === 'unpaid') {
      if (isThursdayHalfDay) {
        totalLeaveMinutes = shiftConfig?.thursdayMinutes || 240;
        leaveHours = Number((totalLeaveMinutes / 60).toFixed(2));
      } else {
        totalLeaveMinutes = 8 * 60;
        leaveHours = 8;
      }
    } else if (type === 'half_day') {
      totalLeaveMinutes = 4 * 60;
      leaveHours = 4;
    } else {
      totalLeaveMinutes = durationHours * 60 + durationMinutes;
      if (totalLeaveMinutes <= 0) totalLeaveMinutes = 30;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#09090d] text-white p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#eca8d6]/10 flex items-center justify-center text-[#eca8d6] border border-[#eca8d6]/20">
              <Coffee className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-mono">
                مدیریت و ثبت مرخصی
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                سهمیه قانونی ماهانه: {toPersianDigits(monthlyQuotaDays)} روز ({toPersianDigits(monthlyQuotaHours)} ساعت)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quota Summary Cards */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 text-center shrink-0">
          <div className="rounded-2xl border border-white/10 bg-[#0c0d14] p-3">
            <span className="text-[10px] text-zinc-500 font-mono block mb-1">سهمیه مصوب</span>
            <div className="font-mono text-sm sm:text-base font-bold text-white">
              {toPersianDigits(monthlyQuotaDays)} روز
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
              ({toPersianDigits(monthlyQuotaHours)} ساعت)
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c0d14] p-3">
            <span className="text-[10px] text-zinc-500 font-mono block mb-1">مصرف شده</span>
            <div className="font-mono text-sm sm:text-base font-bold text-amber-300">
              {toPersianDigits(usedDays)} روز
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">
              ({formatMinutesToPersianReadable(totalUsedMinutes)})
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c0d14] p-3">
            <span className="text-[10px] text-zinc-500 font-mono block mb-1">مانده سهمیه</span>
            <div className="font-mono text-sm sm:text-base font-bold text-emerald-400">
              {toPersianDaysRemaining(remainingDays)} روز
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">
              ({formatMinutesToPersianReadable(remainingMinutes)})
            </div>
          </div>
        </div>

        {/* Toggle / Header for Form */}
        {!isAdding ? (
          <div className="mt-4 flex items-center justify-between shrink-0">
            <h4 className="text-xs font-mono text-zinc-400">سوابق مرخصی ثبت‌شده در این ماه</h4>
            <button
              onClick={() => {
                setEditingLeaveId(null);
                setIsAdding(true);
              }}
              className="flex items-center gap-1.5 rounded-full bg-[#eca8d6] hover:bg-[#e491cc] text-[#050507] px-4 py-2 text-xs font-bold transition-all shadow-[0_0_15px_rgba(236,168,214,0.3)] active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>ثبت درخواست مرخصی</span>
            </button>
          </div>
        ) : (
          /* Add / Edit Form */
          <form
            onSubmit={handleSubmit}
            className="mt-4 rounded-2xl border border-white/10 bg-[#0c0d14] p-4 space-y-3.5 shrink-0 overflow-y-auto max-h-80"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-xs font-bold text-[#eca8d6] flex items-center gap-1.5 font-mono">
                {editingLeaveId ? <Edit2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {editingLeaveId ? 'ویرایش مرخصی انتخابی' : 'فرم ثبت مرخصی جدید'}
              </span>
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-xs font-mono text-zinc-400 hover:text-white"
              >
                انصراف
              </button>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">تاریخ مرخصی</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={day}
                  onChange={(e) => setDay(parseInt(e.target.value, 10))}
                  className="rounded-xl border border-white/10 bg-[#111218] px-2.5 py-1.5 text-xs text-white focus:border-[#eca8d6] focus:outline-none"
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
                  className="rounded-xl border border-white/10 bg-[#111218] px-2.5 py-1.5 text-xs text-white focus:border-[#eca8d6] focus:outline-none"
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
                  className="rounded-xl border border-white/10 bg-[#111218] px-2.5 py-1.5 text-xs text-white font-mono focus:border-[#eca8d6] focus:outline-none"
                >
                  {[1402, 1403, 1404, 1405, 1406].map((yr) => (
                    <option key={yr} value={yr}>
                      {toPersianDigits(yr)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Thursday Helper Alert */}
            {isThursdayHalfDay && (
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/30 px-3 py-2 text-xs text-cyan-300 font-mono flex items-center justify-between">
                <span>روز انتخابی: <strong>پنج‌شنبه (شیفت موظفی نیمه‌وقت - ۴ ساعت)</strong></span>
                <span className="text-[11px] text-cyan-400">پوشش کامل بدون کسری</span>
              </div>
            )}

            {/* Type & Live Duration Preview */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">نوع مرخصی</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as LeaveType)}
                  className="w-full rounded-xl border border-white/10 bg-[#111218] px-2.5 py-1.5 text-xs text-white focus:border-[#eca8d6] focus:outline-none"
                >
                  <option value="hourly">مرخصی ساعتی (پاس ساعتی)</option>
                  <option value="half_day">نیم‌روز (۴ ساعت)</option>
                  <option value="daily">{isThursdayHalfDay ? 'روزانه پنج‌شنبه (۴ ساعت)' : 'روزانه کامل (۱ روز = ۸ ساعت)'}</option>
                  <option value="sick">استعلاجی</option>
                  <option value="unpaid">بدون حقوق</option>
                </select>
              </div>

              {type === 'hourly' ? (
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">مدت کسر (منطق ساعت)</label>
                  <div className="rounded-xl border border-white/10 bg-[#111218] px-2.5 py-1.5 text-xs text-[#eca8d6] font-bold flex items-center justify-between font-mono">
                    <span className="truncate">{formatMinutesToPersianReadable(durationHours * 60 + durationMinutes)}</span>
                    <span className="text-[11px] text-zinc-400 shrink-0">
                      ({formatMinutesToTimeString(durationHours * 60 + durationMinutes)})
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">معادل کسر از سهمیه</label>
                  <div className="rounded-xl border border-white/10 bg-[#111218] px-2.5 py-1.5 text-xs text-[#eca8d6] text-center font-bold font-mono">
                    {type === 'half_day' || isThursdayHalfDay ? '۰.۵ روز (۴ ساعت)' : '۱ روز کامل (۸ ساعت)'}
                  </div>
                </div>
              )}
            </div>

            {/* Smart Hourly Presets */}
            {type === 'hourly' && (
              <div className="rounded-2xl bg-[#111218] p-3 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-300 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#eca8d6]" />
                    پیش‌تنظیم‌های خودکار:
                  </span>
                  <span className="text-[10px] text-[#eca8d6] font-mono">کسر مستقیم از تاخیر/تعجیل</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('arrival')}
                    className="flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-zinc-300 hover:text-white hover:border-[#eca8d6]/40 hover:bg-[#eca8d6]/10 transition-all text-center"
                  >
                    <Sunrise className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>اول وقت</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('departure')}
                    className="flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-zinc-300 hover:text-white hover:border-[#eca8d6]/40 hover:bg-[#eca8d6]/10 transition-all text-center"
                  >
                    <Sunset className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                    <span>آخر وقت</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('midday')}
                    className="flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-zinc-300 hover:text-white hover:border-[#eca8d6]/40 hover:bg-[#eca8d6]/10 transition-all text-center"
                  >
                    <Coffee className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>بین روز</span>
                  </button>
                </div>

                {/* Start and End Time Inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">از ساعت (شروع)</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#0c0d14] px-2.5 py-1 text-xs font-mono text-white text-center focus:border-[#eca8d6] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">تا ساعت (پایان)</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#0c0d14] px-2.5 py-1 text-xs font-mono text-white text-center focus:border-[#eca8d6] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Exact Clock Duration: Hours and Minutes Pickers */}
                <div className="rounded-xl bg-[#0c0d14] border border-white/10 p-2.5 space-y-1.5 font-mono">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>مدت زمان دقیق:</span>
                    <span className="text-[#eca8d6] font-bold text-xs">
                      {formatMinutesToPersianReadable(durationHours * 60 + durationMinutes)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-0.5">ساعت (۰ تا ۸)</label>
                      <input
                        type="number"
                        min="0"
                        max="8"
                        value={durationHours}
                        onChange={(e) => handleDurationChange(parseInt(e.target.value, 10) || 0, durationMinutes)}
                        className="w-full rounded-lg border border-white/10 bg-[#111218] px-2 py-1 text-xs text-white text-center font-mono focus:border-[#eca8d6] focus:outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-0.5">دقیقه (۰ تا ۵۹)</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        step="5"
                        value={durationMinutes}
                        onChange={(e) => handleDurationChange(durationHours, parseInt(e.target.value, 10) || 0)}
                        className="w-full rounded-lg border border-white/10 bg-[#111218] px-2 py-1 text-xs text-white text-center font-mono focus:border-[#eca8d6] focus:outline-none font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">علت مرخصی</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="علت درخواست یا امور اداری/شخصی..."
                className="w-full rounded-xl border border-white/10 bg-[#111218] px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#eca8d6] font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelForm}
                className="flex-1 rounded-full border border-white/10 px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="flex-1 rounded-full bg-[#eca8d6] hover:bg-[#e491cc] px-4 py-2 text-xs font-bold text-[#050507] shadow-[0_0_15px_rgba(236,168,214,0.3)] transition-colors"
              >
                {editingLeaveId ? 'ذخیره تغییرات' : 'ثبت قطعی مرخصی'}
              </button>
            </div>
          </form>
        )}

        {/* Leaves List */}
        <div className="mt-4 overflow-y-auto space-y-2 flex-1 pr-1">
          {leaves.length === 0 ? (
            <div className="py-10 text-center text-xs text-zinc-500 font-mono">
              هنوز مرخصی‌ای برای این دوره ثبت نشده است.
            </div>
          ) : (
            leaves.map((l) => {
              const durMinutes = getLeaveDurationMinutes(l, 480);
              return (
                <div
                  key={l.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0c0d14] p-3 text-xs hover:border-[#eca8d6]/30 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#eca8d6] shrink-0">
                      <Coffee className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-mono text-white">
                        <span className="font-bold">{toPersianDigits(l.date)}</span>
                        <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-zinc-400 shrink-0">
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
                      <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2 truncate">
                        {l.startTime && l.endTime && (
                          <span className="font-mono text-[#eca8d6] text-[10px]">
                            {toPersianDigits(l.startTime)} تا {toPersianDigits(l.endTime)}
                          </span>
                        )}
                        <span className="truncate">{l.reason}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[#eca8d6] font-bold text-xs sm:text-sm">
                      {formatMinutesToTimeString(durMinutes)}
                    </span>
                    <button
                      onClick={() => handleStartEdit(l)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="ویرایش مرخصی"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteLeave(l.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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

function toPersianDaysRemaining(days: string): string {
  return toPersianDigits(days);
}
