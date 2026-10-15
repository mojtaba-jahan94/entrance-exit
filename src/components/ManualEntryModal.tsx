import React, { useState, useEffect } from 'react';
import { X, Calendar, Check, AlertCircle } from 'lucide-react';
import { AttendanceRecord, DayStatus } from '../types';
import {
  getCurrentJalaliDate,
  formatJalaliDate,
  parseJalaliDate,
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEKDAY_NAMES,
  getJalaliWeekdayIndex,
  toPersianDigits,
  timeStringToMinutes,
  getDaysInJalaliMonth,
} from '../utils/jalali';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recordData: Partial<AttendanceRecord>) => void;
  initialRecord?: AttendanceRecord | null;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRecord,
}) => {
  const { jy: curY, jm: curM, jd: curD } = getCurrentJalaliDate();

  const [year, setYear] = useState<number>(curY);
  const [month, setMonth] = useState<number>(curM);
  const [day, setDay] = useState<number>(curD);

  const [checkIn, setCheckIn] = useState<string>('08:30');
  const [checkOut, setCheckOut] = useState<string>('17:00');
  const [breakMinutes, setBreakMinutes] = useState<number>(30);
  const [status, setStatus] = useState<DayStatus>('present');
  const [note, setNote] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const maxDays = getDaysInJalaliMonth(year, month);
  const availableYears = [curY - 3, curY - 2, curY - 1, curY, curY + 1, curY + 2, curY + 3];

  useEffect(() => {
    if (day > maxDays) {
      setDay(maxDays);
    }
  }, [year, month, maxDays, day]);

  const dateStr = formatJalaliDate(year, month, Math.min(day, maxDays));
  const weekdayIdx = getJalaliWeekdayIndex(dateStr);
  const weekdayName = PERSIAN_WEEKDAY_NAMES[weekdayIdx] || '';
  const isThursday = weekdayIdx === 5;

  useEffect(() => {
    if (initialRecord) {
      const parsed = parseJalaliDate(initialRecord.date);
      setYear(parsed.jy);
      setMonth(parsed.jm);
      setDay(parsed.jd);
      setCheckIn(initialRecord.checkIn || '');
      setCheckOut(initialRecord.checkOut || '');
      setBreakMinutes(initialRecord.breakMinutes !== undefined ? initialRecord.breakMinutes : 30);
      setStatus(initialRecord.status || 'present');
      setNote(initialRecord.note || '');
      setValidationError(null);
    } else {
      const today = getCurrentJalaliDate();
      setYear(today.jy);
      setMonth(today.jm);
      setDay(today.jd);
      setCheckIn('08:30');
      setCheckOut(isThursday ? '13:00' : '17:00');
      setBreakMinutes(isThursday ? 0 : 30);
      setStatus('present');
      setNote('');
      setValidationError(null);
    }
  }, [initialRecord, isOpen, isThursday]);

  if (!isOpen) return null;

  // Live calculation for preview
  const inMins = checkIn ? timeStringToMinutes(checkIn) : 0;
  const outMins = checkOut ? timeStringToMinutes(checkOut) : 0;
  const isTimeOrderInvalid = Boolean(checkIn && checkOut && outMins <= inMins);
  const rawPresence = Math.max(0, outMins - inMins);
  const netWorked = Math.max(0, rawPresence - breakMinutes);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (checkIn && checkOut && timeStringToMinutes(checkOut) <= timeStringToMinutes(checkIn)) {
      setValidationError('ساعت خروج باید بعد از ساعت ورود باشد.');
      return;
    }

    setValidationError(null);
    onSave({
      id: initialRecord?.id,
      date: dateStr,
      checkIn: checkIn ? checkIn.trim() : null,
      checkOut: checkOut ? checkOut.trim() : null,
      breakMinutes: Number(breakMinutes) || 0,
      status,
      note: note.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2933]/60 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#D1D5DB] bg-white p-5 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D1D5DB] pb-3 sm:pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="rounded-2xl bg-[#F5F0E6] p-2 text-[#A68A64] border border-[#A68A64]/30">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1F2933]">
                {initialRecord ? 'ویرایش تردد' : 'ثبت تردد جدید'}
              </h3>
              <p className="text-[11px] sm:text-xs text-[#6B7280]">
                تاریخ انتخاب‌شده: {weekdayName}، {toPersianDigits(dateStr)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-[#6B7280] hover:bg-[#F7F7F2] hover:text-[#1F2933] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body with Smooth Scroll */}
        <form onSubmit={handleSubmit} className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 overflow-y-auto pr-0.5">
          {/* Jalali Date Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2933] mb-1.5">
              تاریخ شمسی
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Day */}
              <select
                value={day}
                onChange={(e) => setDay(parseInt(e.target.value, 10))}
                className="rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-3 py-2 text-xs font-medium text-[#1F2933] focus:border-[#A68A64] focus:ring-1 focus:ring-[#A68A64] focus:outline-none"
              >
                {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    روز {toPersianDigits(d)}
                  </option>
                ))}
              </select>

              {/* Month */}
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                className="rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-3 py-2 text-xs font-medium text-[#1F2933] focus:border-[#A68A64] focus:ring-1 focus:ring-[#A68A64] focus:outline-none"
              >
                {PERSIAN_MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Year */}
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-3 py-2 text-xs font-medium text-[#1F2933] focus:border-[#A68A64] focus:ring-1 focus:ring-[#A68A64] focus:outline-none font-mono"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {toPersianDigits(yr)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Validation Error Banner */}
          {(validationError || isTimeOrderInvalid) && (
            <div className="flex items-center gap-2 rounded-2xl bg-[#FEF2F2] border border-[#B91C1C]/30 p-2.5 text-xs text-[#B91C1C]">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#B91C1C]" />
              <span>{validationError || 'هشدار: ساعت خروج نمی‌تواند قبل از ساعت ورود یا همزمان با آن باشد.'}</span>
            </div>
          )}

          {/* Time Check-In & Check-Out */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1F2933] mb-1.5">
                ساعت ورود
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={checkIn}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    setValidationError(null);
                  }}
                  className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-3 py-2 text-sm font-mono text-[#1F2933] focus:border-[#A68A64] focus:ring-1 focus:ring-[#A68A64] focus:outline-none text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2933] mb-1.5">
                ساعت خروج
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={checkOut}
                  onChange={(e) => {
                    setCheckOut(e.target.value);
                    setValidationError(null);
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-sm font-mono focus:outline-none text-center ${
                    isTimeOrderInvalid
                      ? 'border-[#B91C1C] bg-[#FEF2F2] text-[#B91C1C]'
                      : 'border-[#D1D5DB] bg-[#F7F7F2] text-[#1F2933] focus:border-[#A68A64] focus:ring-1 focus:ring-[#A68A64]'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Break and Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1F2933] mb-1.5">
                مدت استراحت / ناهار (دقیقه)
              </label>
              <input
                type="number"
                min="0"
                max="240"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-3 py-2 text-xs font-mono text-[#1F2933] focus:border-[#A68A64] focus:ring-1 focus:ring-[#A68A64] focus:outline-none text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2933] mb-1.5">
                وضعیت روز
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DayStatus)}
                className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-3 py-2 text-xs font-medium text-[#1F2933] focus:border-[#A68A64] focus:ring-1 focus:ring-[#A68A64] focus:outline-none"
              >
                <option value="present">حاضر عادی</option>
                <option value="leave">مرخصی</option>
                <option value="absent">غیبت</option>
                <option value="holiday">تعطیل رسمی</option>
                <option value="weekend">جمعه / تعطیل هفتگی</option>
              </select>
            </div>
          </div>

          {/* Note / Description */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2933] mb-1.5">
              یادداشت یا علت تاخیر / اضافه کاری
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثال: حضور در جلسه، ماموریت، تاخیر با هماهنگی..."
              className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] p-2.5 text-xs text-[#1F2933] placeholder:text-[#6B7280]/60 focus:border-[#A68A64] focus:ring-1 focus:ring-[#A68A64] focus:outline-none resize-none"
            />
          </div>

          {/* Live Calculation Preview Banner */}
          {checkIn && checkOut && (
            <div className="flex items-center justify-between rounded-2xl bg-[#F5F0E6] p-3 border border-[#A68A64]/20 text-[11px] text-[#1F2933]">
              <span>
                کل حضور: <strong className="font-mono text-[#1F2933]">{toPersianDigits(Math.floor(rawPresence / 60))}س و {toPersianDigits(rawPresence % 60)}د</strong>
              </span>
              <span>
                کسر ناهار: <strong className="font-mono text-[#D97706]">{toPersianDigits(breakMinutes)}د</strong>
              </span>
              <span>
                کارکرد مفید خالص: <strong className="font-mono text-[#2E6F40] font-bold">{toPersianDigits(Math.floor(netWorked / 60))}س و {toPersianDigits(netWorked % 60)}د</strong>
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D1D5DB]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-[#D1D5DB] bg-white px-4 py-2.5 text-xs font-semibold text-[#6B7280] hover:bg-[#F7F7F2] hover:text-[#1F2933] transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-2xl bg-[#A68A64] hover:bg-[#8F7553] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all active:scale-[0.98]"
            >
              <Check className="h-4 w-4" />
              <span>ذخیره تردد</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
