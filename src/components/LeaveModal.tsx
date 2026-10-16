import React, { useState, useEffect } from 'react';
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
} from '../utils/jalali';
import { getLeaveDurationMinutes } from '../utils/calculator';
import { useFocusTrap } from '../utils/useFocusTrap';

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
  editingLeave?: LeaveRecord | Partial<LeaveRecord> | null;
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
  editingLeave,
}) => {
  const modalRef = useFocusTrap(isOpen, onClose);
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
    const parsed = parseJalaliDate(leave.date) || getCurrentJalaliDate();
    setYear(parsed.jy);
    setMonth(parsed.jm);
    setDay(parsed.jd);
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

  // BUG-02: Synchronize modal form with passed editingLeave prop
  useEffect(() => {
    if (!isOpen) return;
    if (editingLeave) {
      if ('id' in editingLeave && editingLeave.id && 'reason' in editingLeave) {
        handleStartEdit(editingLeave as LeaveRecord);
      } else if (editingLeave.date) {
        const parsed = parseJalaliDate(editingLeave.date);
        if (parsed) {
          setYear(parsed.jy);
          setMonth(parsed.jm);
          setDay(parsed.jd);
        }
        setIsAdding(true);
        setEditingLeaveId(null);
        setReason('');
      }
    } else {
      setIsAdding(false);
      setEditingLeaveId(null);
    }
  }, [isOpen, editingLeave]);

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

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-modal-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-xl rounded-[32px] border border-[var(--border)] liquid-glass-modal p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 sm:pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="rounded-2xl bg-[var(--surface-2)] p-2.5 text-[var(--accent)] border border-[var(--border)] shadow-inner">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <h3 id="leave-modal-title" className="text-sm sm:text-base font-bold text-[var(--text-main)]">
                مدیریت و کاردکس مرخصی‌ها
              </h3>
              <p className="text-[11px] sm:text-xs text-muted">سهمیه قانونی: ۲.۵ روز (۲۰ ساعت) در هر ماه</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن پنجره مرخصی‌ها"
            className="rounded-full p-2 text-muted hover:bg-[var(--surface-2)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quota Summary Cards (Clock-aware Persian Duration) */}
        <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2 sm:gap-3 text-center shrink-0">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 sm:p-3 backdrop-blur-md shadow-sm">
            <span className="text-[10px] sm:text-[11px] text-muted block mb-0.5 sm:mb-1">سهمیه ماهانه</span>
            <div className="font-mono text-sm sm:text-base font-bold text-[var(--text-main)]">
              {toPersianDigits(monthlyQuotaDays)} روز
            </div>
            <div className="text-[10px] sm:text-[11px] text-muted font-mono mt-0.5">
              ({toPersianDigits(monthlyQuotaHours)} ساعت)
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 sm:p-3 backdrop-blur-md shadow-sm">
            <span className="text-[10px] sm:text-[11px] text-muted block mb-0.5 sm:mb-1">استفاده شده</span>
            <div className="font-mono text-sm sm:text-base font-bold text-[var(--semantic-warning)]">
              {toPersianDigits(usedDays)} روز
            </div>
            <div className="text-[10px] sm:text-[11px] text-[var(--semantic-warning)] mt-0.5 truncate" title={formatMinutesToPersianReadable(totalUsedMinutes)}>
              ({formatMinutesToPersianReadable(totalUsedMinutes)})
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 sm:p-3 backdrop-blur-md shadow-sm">
            <span className="text-[10px] sm:text-[11px] text-muted block mb-0.5 sm:mb-1">مانده باقیمانده</span>
            <div className="font-mono text-sm sm:text-base font-bold text-[var(--semantic-success)]">
              {toPersianDigits(remainingDays)} روز
            </div>
            <div className="text-[10px] sm:text-[11px] text-[var(--semantic-success)] mt-0.5 truncate" title={formatMinutesToPersianReadable(remainingMinutes)}>
              ({formatMinutesToPersianReadable(remainingMinutes)})
            </div>
          </div>
        </div>

        {/* Toggle / Header for Form */}
        {!isAdding ? (
          <div className="mt-3.5 flex items-center justify-between shrink-0">
            <h4 className="text-xs font-bold text-[var(--text-main)]">سوابق مرخصی ثبت‌شده در این ماه</h4>
            <button
              onClick={() => {
                setEditingLeaveId(null);
                setIsAdding(true);
              }}
              className="liquid-pill-btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-bold shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>ثبت درخواست مرخصی</span>
            </button>
          </div>
        ) : (
          /* Add / Edit Form */
          <form
            onSubmit={handleSubmit}
            className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] backdrop-blur-xl p-3 sm:p-4 space-y-3 shrink-0 overflow-y-auto max-h-80 shadow-inner"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span className="text-xs font-bold text-[var(--accent)] flex items-center gap-1.5">
                {editingLeaveId ? <Edit2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {editingLeaveId ? 'ویرایش مرخصی انتخاب‌شده' : 'فرم ثبت مرخصی جدید'}
              </span>
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-xs text-muted hover:text-[var(--text-main)]"
              >
                انصراف
              </button>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[11px] text-muted mb-1">تاریخ مرخصی</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={day}
                  onChange={(e) => setDay(parseInt(e.target.value, 10))}
                  className="liquid-input px-2.5 py-1.5 text-xs text-[var(--text-main)]"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d} className="bg-[var(--surface)] text-[var(--text-main)]">
                      روز {toPersianDigits(d)}
                    </option>
                  ))}
                </select>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                  className="liquid-input px-2.5 py-1.5 text-xs text-[var(--text-main)]"
                >
                  {PERSIAN_MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx + 1} className="bg-[var(--surface)] text-[var(--text-main)]">
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  className="liquid-input px-2.5 py-1.5 text-xs text-[var(--text-main)] font-mono"
                >
                  {[1402, 1403, 1404, 1405, 1406].map((yr) => (
                    <option key={yr} value={yr} className="bg-[var(--surface)] text-[var(--text-main)]">
                      {toPersianDigits(yr)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Thursday Helper Alert */}
            {isThursdayHalfDay && (
              <div className="rounded-xl border border-[var(--semantic-info)]/30 bg-[var(--semantic-info)]/10 px-3 py-2 text-xs text-[var(--semantic-info)] flex items-center justify-between">
                <span>روز انتخابی: <strong>پنج‌شنبه (شیفت موظفی نیمه‌وقت - ۴ ساعت)</strong></span>
                <span className="text-[11px] font-mono">پوشش کامل بدون کسری کار</span>
              </div>
            )}

            {/* Type & Live Duration Preview */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-muted mb-1">نوع مرخصی</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as LeaveType)}
                  className="liquid-input w-full px-2.5 py-1.5 text-xs text-[var(--text-main)]"
                >
                  <option value="hourly" className="bg-[var(--surface)] text-[var(--text-main)]">مرخصی ساعتی (پاس ساعتی)</option>
                  <option value="half_day" className="bg-[var(--surface)] text-[var(--text-main)]">نیم‌روز (۴ ساعت)</option>
                  <option value="daily" className="bg-[var(--surface)] text-[var(--text-main)]">{isThursdayHalfDay ? 'روزانه پنج‌شنبه (۴ ساعت)' : 'روزانه کامل (۱ روز = ۸ ساعت)'}</option>
                  <option value="sick" className="bg-[var(--surface)] text-[var(--text-main)]">استعلاجی</option>
                  <option value="unpaid" className="bg-[var(--surface)] text-[var(--text-main)]">بدون حقوق</option>
                </select>
              </div>

              {type === 'hourly' ? (
                <div>
                  <label className="block text-[11px] text-muted mb-1">مدت زمان (منطق ساعت)</label>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--semantic-warning)] font-bold flex items-center justify-between">
                    <span className="truncate">{formatMinutesToPersianReadable(durationHours * 60 + durationMinutes)}</span>
                    <span className="font-mono text-[11px] text-muted shrink-0">
                      ({formatMinutesToTimeString(durationHours * 60 + durationMinutes)})
                    </span>
                  </div>
                </div>
              ) : type === 'half_day' ? (
                <div>
                  <label className="block text-[11px] text-muted mb-1">معادل کسر از سهمیه</label>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--semantic-warning)] text-center font-bold">
                    ۰.۵ روز (۴ ساعت{isThursdayHalfDay ? ' - کل پنج‌شنبه' : ''})
                  </div>
                </div>
              ) : isThursdayHalfDay ? (
                <div>
                  <label className="block text-[11px] text-muted mb-1">معادل کسر از سهمیه</label>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--semantic-warning)] text-center font-bold">
                    ۰.۵ روز (۴ ساعت - کل پنج‌شنبه)
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] text-muted mb-1">معادل کسر از سهمیه</label>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--semantic-warning)] text-center font-bold">
                    ۱ روز کامل (۸ ساعت)
                  </div>
                </div>
              )}
            </div>

            {/* Smart Hourly Presets & Time Bounds (Entry & Exit Aware) */}
            {type === 'hourly' && (
              <div className="rounded-2xl bg-[var(--surface)] p-3 border border-[var(--border)] space-y-2.5 backdrop-blur-md shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[var(--semantic-warning)]" />
                    تنظیم بازه و مدت زمان با منطق ساعت:
                  </span>
                  <span className="text-[10px] text-[var(--semantic-warning)] font-medium">کسر مستقیم از تاخیر/تعجیل</span>
                </div>

                {/* Quick Presets based on checkIn / checkOut */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('arrival')}
                    className="liquid-pill-btn py-1.5 text-[11px] font-medium flex items-center justify-center gap-1 text-[var(--semantic-warning)]"
                    title="پوشش تاخیر ورود از اول وقت تا زمان ورود شما"
                  >
                    <Sunrise className="h-3.5 w-3.5 shrink-0" />
                    <span>اول وقت (تاخیر)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('departure')}
                    className="liquid-pill-btn py-1.5 text-[11px] font-medium flex items-center justify-center gap-1 text-[var(--semantic-danger)]"
                    title="پوشش تعجیل خروج از زمان خروج شما تا پایان شیفت"
                  >
                    <Sunset className="h-3.5 w-3.5 shrink-0" />
                    <span>آخر وقت (تعجیل)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('midday')}
                    className="liquid-pill-btn py-1.5 text-[11px] font-medium flex items-center justify-center gap-1 text-[var(--semantic-info)]"
                    title="مرخصی در طول شیفت کاری"
                  >
                    <Coffee className="h-3.5 w-3.5 shrink-0" />
                    <span>بین روز (پاس)</span>
                  </button>
                </div>

                {/* Start and End Time Inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-muted mb-0.5">از ساعت (شروع مرخصی)</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="liquid-input w-full px-2.5 py-1 text-xs font-mono text-[var(--text-main)] text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted mb-0.5">تا ساعت (پایان مرخصی)</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      className="liquid-input w-full px-2.5 py-1 text-xs font-mono text-[var(--text-main)] text-center"
                    />
                  </div>
                </div>

                {/* Exact Clock Duration: Hours and Minutes Pickers */}
                <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>مدت زمان دقیق (ساعت و دقیقه):</span>
                    <span className="font-mono text-[var(--semantic-warning)] font-bold text-xs">
                      {formatMinutesToPersianReadable(durationHours * 60 + durationMinutes)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-muted mb-0.5">ساعت (۰ تا ۸)</label>
                      <input
                        type="number"
                        min="0"
                        max="8"
                        value={durationHours}
                        onChange={(e) => handleDurationChange(parseInt(e.target.value, 10) || 0, durationMinutes)}
                        className="liquid-input w-full px-2 py-1 text-xs text-[var(--text-main)] text-center font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-muted mb-0.5">دقیقه (۰ تا ۵۹)</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        step="5"
                        value={durationMinutes}
                        onChange={(e) => handleDurationChange(durationHours, parseInt(e.target.value, 10) || 0)}
                        className="liquid-input w-full px-2 py-1 text-xs text-[var(--text-main)] text-center font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-[11px] text-muted mb-1">علت مرخصی</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="علت درخواست یا امور اداری/شخصی..."
                className="liquid-input w-full px-3 py-1.5 text-xs text-[var(--text-main)] placeholder:text-muted"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelForm}
                className="liquid-pill-btn flex-1 py-2 text-xs font-semibold"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="liquid-pill-btn-primary flex-1 py-2 text-xs font-bold"
              >
                {editingLeaveId ? 'ذخیره تغییرات مرخصی' : 'ثبت قطعی مرخصی'}
              </button>
            </div>
          </form>
        )}

        {/* Leaves List */}
        <div className="mt-3 overflow-y-auto space-y-2 flex-1 pr-1">
          {leaves.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted">
              هنوز مرخصی‌ای برای این دوره ثبت نشده است.
            </div>
          ) : (
            leaves.map((l) => {
              const durMinutes = getLeaveDurationMinutes(l, 480);
              return (
                <div
                  key={l.id}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] backdrop-blur-md p-2.5 sm:p-3 text-xs hover:border-[var(--border-strong)] transition-all shadow-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="rounded-xl bg-[var(--surface)] p-2 text-[var(--accent)] shrink-0 border border-[var(--border)]">
                      <Coffee className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 font-medium text-[var(--text-main)]">
                        <span className="font-mono text-xs">{toPersianDigits(l.date)}</span>
                        <span className="badge-neutral text-[10px] px-2 py-0.5 rounded-full shrink-0">
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
                      <div className="text-[11px] text-muted mt-0.5 flex items-center gap-2 truncate">
                        {l.startTime && l.endTime && (
                          <span className="badge-warning font-mono font-semibold text-[10px] px-1.5 py-0.5 rounded">
                            از {toPersianDigits(l.startTime)} تا {toPersianDigits(l.endTime)}
                          </span>
                        )}
                        <span className="truncate">{l.reason}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <span className="font-mono text-[var(--semantic-warning)] font-bold text-xs sm:text-sm">
                      {formatMinutesToTimeString(durMinutes)}
                    </span>
                    {/* Edit button */}
                    <button
                      onClick={() => handleStartEdit(l)}
                      className="p-1.5 rounded-xl text-muted hover:text-[var(--accent)] hover:bg-[var(--surface)] transition-colors"
                      title="ویرایش مرخصی"
                      aria-label="ویرایش مرخصی"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={() => onDeleteLeave(l.id)}
                      className="p-1.5 rounded-xl text-muted hover:text-[var(--semantic-danger)] hover:bg-[var(--surface)] transition-colors"
                      title="حذف مرخصی"
                      aria-label="حذف مرخصی"
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
