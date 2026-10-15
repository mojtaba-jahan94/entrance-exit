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
  getJalaliWeekdayIndex,
  getDaysInJalaliMonth,
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
  initialLeave?: LeaveRecord | null;
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
  initialLeave,
}) => {
  const { jy: curY, jm: curM, jd: curD } = getCurrentJalaliDate();

  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);

  const [day, setDay] = useState<number>(curD);
  const [month, setMonth] = useState<number>(curM);
  const [year, setYear] = useState<number>(curY);
  const [type, setType] = useState<LeaveType>('hourly');

  const maxDays = getDaysInJalaliMonth(year, month);
  const availableYears = [curY - 3, curY - 2, curY - 1, curY, curY + 1, curY + 2, curY + 3];

  React.useEffect(() => {
    if (day > maxDays) {
      setDay(maxDays);
    }
  }, [year, month, maxDays, day]);

  // Clock-based duration state (hours and minutes)
  const [durationHours, setDurationHours] = useState<number>(1);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [startTime, setStartTime] = useState<string>('08:30');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [reason, setReason] = useState<string>('');

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

  React.useEffect(() => {
    if (isOpen && initialLeave) {
      handleStartEdit(initialLeave);
    } else if (isOpen && !initialLeave) {
      setIsAdding(false);
      setEditingLeaveId(null);
    }
  }, [isOpen, initialLeave]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2933]/60 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-[#D1D5DB] bg-white p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D1D5DB] pb-3 sm:pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="rounded-2xl bg-[#F5F0E6] p-2 text-[#A68A64] border border-[#A68A64]/30">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1F2933]">مدیریت و کاردکس مرخصی‌ها</h3>
              <p className="text-[11px] sm:text-xs text-[#6B7280]">سهمیه قانونی: ۲.۵ روز (۲۰ ساعت) در هر ماه</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-[#6B7280] hover:bg-[#F7F7F2] hover:text-[#1F2933] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quota Summary Cards */}
        <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2 sm:gap-3 text-center shrink-0">
          <div className="rounded-2xl border border-[#D1D5DB] bg-[#F7F7F2] p-2.5 sm:p-3">
            <span className="text-[10px] sm:text-[11px] text-[#6B7280] block mb-0.5 sm:mb-1">سهمیه ماهانه</span>
            <div className="font-mono text-sm sm:text-base font-bold text-[#1F2933]">
              {toPersianDigits(monthlyQuotaDays)} روز
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#6B7280] font-mono mt-0.5">
              ({toPersianDigits(monthlyQuotaHours)} ساعت)
            </div>
          </div>

          <div className="rounded-2xl border border-[#D1D5DB] bg-[#F7F7F2] p-2.5 sm:p-3">
            <span className="text-[10px] sm:text-[11px] text-[#6B7280] block mb-0.5 sm:mb-1">استفاده شده</span>
            <div className="font-mono text-sm sm:text-base font-bold text-[#D97706]">
              {toPersianDigits(usedDays)} روز
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#6B7280] mt-0.5 truncate" title={formatMinutesToPersianReadable(totalUsedMinutes)}>
              ({formatMinutesToPersianReadable(totalUsedMinutes)})
            </div>
          </div>

          <div className="rounded-2xl border border-[#D1D5DB] bg-[#F7F7F2] p-2.5 sm:p-3">
            <span className="text-[10px] sm:text-[11px] text-[#6B7280] block mb-0.5 sm:mb-1">مانده باقی‌مانده</span>
            <div className="font-mono text-sm sm:text-base font-bold text-[#2E6F40]">
              {toPersianDigits(remainingDays)} روز
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#6B7280] mt-0.5 truncate" title={formatMinutesToPersianReadable(remainingMinutes)}>
              ({formatMinutesToPersianReadable(remainingMinutes)})
            </div>
          </div>
        </div>

        {/* Toggle / Header for Form */}
        {!isAdding ? (
          <div className="mt-3.5 flex items-center justify-between shrink-0">
            <h4 className="text-xs font-bold text-[#1F2933]">سوابق مرخصی ثبت‌شده در این ماه</h4>
            <button
              onClick={() => {
                setEditingLeaveId(null);
                setIsAdding(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[#A68A64] hover:bg-[#8F7553] text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>ثبت درخواست مرخصی</span>
            </button>
          </div>
        ) : (
          /* Add / Edit Form */
          <form
            onSubmit={handleSubmit}
            className="mt-3 rounded-2xl border border-[#D1D5DB] bg-[#F7F7F2] p-3 sm:p-4 space-y-3 shrink-0 overflow-y-auto max-h-80"
          >
            <div className="flex items-center justify-between border-b border-[#D1D5DB] pb-2">
              <span className="text-xs font-bold text-[#1F2933] flex items-center gap-1.5">
                {editingLeaveId ? <Edit2 className="h-3.5 w-3.5 text-[#A68A64]" /> : <Plus className="h-3.5 w-3.5 text-[#A68A64]" />}
                {editingLeaveId ? 'ویرایش مرخصی انتخاب‌شده' : 'فرم ثبت مرخصی جدید'}
              </span>
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-xs text-[#6B7280] hover:text-[#1F2933]"
              >
                انصراف
              </button>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[11px] font-semibold text-[#1F2933] mb-1">تاریخ مرخصی</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={day}
                  onChange={(e) => setDay(parseInt(e.target.value, 10))}
                  className="rounded-xl border border-[#D1D5DB] bg-white px-2 py-1.5 text-xs text-[#1F2933] focus:border-[#A68A64] focus:ring-1 focus:ring-[#A68A64] focus:outline-none"
                >
                  {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      روز {toPersianDigits(d)}
                    </option>
                  ))}
                </select>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                  className="rounded-xl border border-[#D1D5DB] bg-white px-2 py-1.5 text-xs text-[#1F2933] focus:border-[#A68A64] focus:ring-1 focus:ring-[#A68A64] focus:outline-none"
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
                  className="rounded-xl border border-[#D1D5DB] bg-white px-2 py-1.5 text-xs text-[#1F2933] font-mono focus:border-[#A68A64] focus:ring-1 focus:ring-[#A68A64] focus:outline-none"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {toPersianDigits(yr)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Thursday Helper Alert */}
            {isThursdayHalfDay && (
              <div className="rounded-xl border border-[#A68A64]/30 bg-[#F5F0E6] px-3 py-2 text-xs text-[#1F2933] flex items-center justify-between">
                <span>روز انتخابی: <strong>پنج‌شنبه (شیفت موظفی نیمه‌وقت - ۴ ساعت)</strong></span>
                <span className="text-[11px] text-[#A68A64] font-mono font-bold">پوشش کامل بدون کسری کار</span>
              </div>
            )}

            {/* Type & Live Duration Preview */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#1F2933] mb-1">نوع مرخصی</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as LeaveType)}
                  className="w-full rounded-xl border border-[#D1D5DB] bg-white px-2 py-1.5 text-xs text-[#1F2933] focus:border-[#A68A64] focus:ring-1 focus:ring-[#A68A64] focus:outline-none"
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
                  <label className="block text-[11px] font-semibold text-[#1F2933] mb-1">مدت زمان (منطق ساعت)</label>
                  <div className="rounded-xl border border-[#D1D5DB] bg-white px-2.5 py-1.5 text-xs text-[#1F2933] font-bold flex items-center justify-between">
                    <span className="truncate">{formatMinutesToPersianReadable(durationHours * 60 + durationMinutes)}</span>
                    <span className="font-mono text-[11px] text-[#6B7280] shrink-0">
                      ({formatMinutesToTimeString(durationHours * 60 + durationMinutes)})
                    </span>
                  </div>
                </div>
              ) : type === 'half_day' ? (
                <div>
                  <label className="block text-[11px] font-semibold text-[#1F2933] mb-1">معادل کسر از سهمیه</label>
                  <div className="rounded-xl border border-[#D1D5DB] bg-white px-2 py-1.5 text-xs text-[#D97706] text-center font-bold">
                    ۰.۵ روز (۴ ساعت{isThursdayHalfDay ? ' - کل پنج‌شنبه' : ''})
                  </div>
                </div>
              ) : isThursdayHalfDay ? (
                <div>
                  <label className="block text-[11px] font-semibold text-[#1F2933] mb-1">معادل کسر از سهمیه</label>
                  <div className="rounded-xl border border-[#D1D5DB] bg-white px-2 py-1.5 text-xs text-[#D97706] text-center font-bold">
                    ۰.۵ روز (۴ ساعت - کل پنج‌شنبه)
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-[#1F2933] mb-1">معادل کسر از سهمیه</label>
                  <div className="rounded-xl border border-[#D1D5DB] bg-white px-2 py-1.5 text-xs text-[#D97706] text-center font-bold">
                    ۱ روز کامل (۸ ساعت)
                  </div>
                </div>
              )}
            </div>

            {/* Smart Hourly Presets & Time Bounds */}
            {type === 'hourly' && (
              <div className="rounded-2xl bg-white p-3 border border-[#D1D5DB] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1F2933] flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#A68A64]" />
                    تنظیم بازه و مدت زمان با منطق ساعت:
                  </span>
                  <span className="text-[10px] text-[#A68A64] font-medium">کسر مستقیم از تاخیر/تعجیل</span>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('arrival')}
                    className="flex items-center justify-center gap-1 rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-2 py-1.5 text-[11px] text-[#1F2933] hover:text-[#1F2933] hover:border-[#A68A64] hover:bg-[#F5F0E6] transition-all text-center font-medium"
                    title="پوشش تاخیر ورود از اول وقت تا زمان ورود شما"
                  >
                    <Sunrise className="h-3.5 w-3.5 text-[#D97706] shrink-0" />
                    <span>اول وقت (تاخیر)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('departure')}
                    className="flex items-center justify-center gap-1 rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-2 py-1.5 text-[11px] text-[#1F2933] hover:text-[#1F2933] hover:border-[#B91C1C] hover:bg-[#FEF2F2] transition-all text-center font-medium"
                    title="پوشش تعجیل خروج از زمان خروج شما تا پایان شیفت"
                  >
                    <Sunset className="h-3.5 w-3.5 text-[#B91C1C] shrink-0" />
                    <span>آخر وقت (تعجیل)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('midday')}
                    className="flex items-center justify-center gap-1 rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-2 py-1.5 text-[11px] text-[#1F2933] hover:text-[#1F2933] hover:border-[#A68A64] hover:bg-[#F5F0E6] transition-all text-center font-medium"
                    title="مرخصی در طول شیفت کاری"
                  >
                    <Coffee className="h-3.5 w-3.5 text-[#A68A64] shrink-0" />
                    <span>بین روز (پاس)</span>
                  </button>
                </div>

                {/* Start and End Time Inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#6B7280] mb-0.5">از ساعت (شروع مرخصی)</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-2.5 py-1 text-xs font-mono text-[#1F2933] text-center focus:border-[#A68A64] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B7280] mb-0.5">تا ساعت (پایان مرخصی)</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-2.5 py-1 text-xs font-mono text-[#1F2933] text-center focus:border-[#A68A64] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Exact Clock Duration: Hours and Minutes Pickers */}
                <div className="rounded-xl bg-[#F7F7F2] border border-[#D1D5DB] p-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                    <span>مدت زمان دقیق (ساعت و دقیقه):</span>
                    <span className="font-mono text-[#1F2933] font-bold text-xs">
                      {formatMinutesToPersianReadable(durationHours * 60 + durationMinutes)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#6B7280] mb-0.5">ساعت (۰ تا ۸)</label>
                      <input
                        type="number"
                        min="0"
                        max="8"
                        value={durationHours}
                        onChange={(e) => handleDurationChange(parseInt(e.target.value, 10) || 0, durationMinutes)}
                        className="w-full rounded-lg border border-[#D1D5DB] bg-white px-2 py-1 text-xs text-[#1F2933] text-center font-mono focus:border-[#A68A64] focus:outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#6B7280] mb-0.5">دقیقه (۰ تا ۵۹)</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        step="5"
                        value={durationMinutes}
                        onChange={(e) => handleDurationChange(durationHours, parseInt(e.target.value, 10) || 0)}
                        className="w-full rounded-lg border border-[#D1D5DB] bg-white px-2 py-1 text-xs text-[#1F2933] text-center font-mono focus:border-[#A68A64] focus:outline-none font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-[11px] font-semibold text-[#1F2933] mb-1">علت مرخصی</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="علت درخواست یا امور اداری/شخصی..."
                className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs text-[#1F2933] placeholder:text-[#6B7280]/60 focus:outline-none focus:border-[#A68A64]"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelForm}
                className="flex-1 rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-xs font-medium text-[#6B7280] hover:text-[#1F2933] hover:bg-[#F7F7F2] transition-colors"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#A68A64] hover:bg-[#8F7553] px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors"
              >
                {editingLeaveId ? 'ذخیره تغییرات مرخصی' : 'ثبت قطعی مرخصی'}
              </button>
            </div>
          </form>
        )}

        {/* Leaves List */}
        <div className="mt-3 overflow-y-auto space-y-2 flex-1 pr-1">
          {leaves.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#6B7280]">
              هنوز مرخصی‌ای برای این دوره ثبت نشده است.
            </div>
          ) : (
            leaves.map((l) => {
              const durMinutes = getLeaveDurationMinutes(l, 480);
              return (
                <div
                  key={l.id}
                  className="flex items-center justify-between rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] p-2.5 text-xs hover:border-[#A68A64]/40 hover:bg-[#F5F0E6]/30 transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="rounded-lg bg-[#F5F0E6] p-1.5 text-[#A68A64] shrink-0 border border-[#A68A64]/20">
                      <Coffee className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 font-medium text-[#1F2933]">
                        <span className="font-mono text-xs">{toPersianDigits(l.date)}</span>
                        <span className="rounded-full bg-white border border-[#D1D5DB] px-2 py-0.5 text-[10px] text-[#6B7280] shrink-0">
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
                      <div className="text-[11px] text-[#6B7280] mt-0.5 flex items-center gap-2 truncate">
                        {l.startTime && l.endTime && (
                          <span className="font-mono text-[#A68A64] text-[10px] font-semibold">
                            از {toPersianDigits(l.startTime)} تا {toPersianDigits(l.endTime)}
                          </span>
                        )}
                        <span className="truncate">{l.reason}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <span className="font-mono text-[#A68A64] font-bold text-xs sm:text-sm">
                      {formatMinutesToTimeString(durMinutes)}
                    </span>
                    {/* Edit button */}
                    <button
                      onClick={() => handleStartEdit(l)}
                      className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#A68A64] hover:bg-white transition-colors"
                      title="ویرایش مرخصی"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={() => onDeleteLeave(l.id)}
                      className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors"
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
