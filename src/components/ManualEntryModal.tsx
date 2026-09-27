import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, FileText, Check, AlertCircle } from 'lucide-react';
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

  const dateStr = formatJalaliDate(year, month, day);
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
    }
  }, [initialRecord, isOpen, isThursday]);

  if (!isOpen) return null;

  // Live calculation for preview
  const inMins = checkIn ? timeStringToMinutes(checkIn) : 0;
  const outMins = checkOut ? timeStringToMinutes(checkOut) : 0;
  const rawPresence = Math.max(0, outMins - inMins);
  const netWorked = Math.max(0, rawPresence - breakMinutes);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialRecord ? 'ویرایش تردد' : 'ثبت تردد دستی جدید'}
              </h3>
              <p className="text-xs text-slate-400">
                تاریخ انتخاب‌شده: {weekdayName}، {toPersianDigits(dateStr)}
              </p>
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
          {/* Jalali Date Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              تاریخ شمسی
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Day */}
              <select
                value={day}
                onChange={(e) => setDay(parseInt(e.target.value, 10))}
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-white focus:border-indigo-500 focus:outline-none"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    روز {toPersianDigits(d)}
                  </option>
                ))}
              </select>

              {/* Month */}
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-white focus:border-indigo-500 focus:outline-none"
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
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-white focus:border-indigo-500 focus:outline-none font-mono"
              >
                {[1402, 1403, 1404, 1405, 1406].map((yr) => (
                  <option key={yr} value={yr}>
                    {toPersianDigits(yr)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Check-In & Check-Out */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ساعت ورود
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-mono text-white focus:border-indigo-500 focus:outline-none text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ساعت خروج
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-mono text-white focus:border-indigo-500 focus:outline-none text-center"
                />
              </div>
            </div>
          </div>

          {/* Break and Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                مدت استراحت / ناهار (دقیقه)
              </label>
              <input
                type="number"
                min="0"
                max="240"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 focus:outline-none text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                وضعیت روز
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DayStatus)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-white focus:border-indigo-500 focus:outline-none"
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              یادداشت یا علت تاخیر / اضافه کاری
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثال: حضور در جلسه، ماموریت، تاخیر با هماهنگی..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Live Calculation Preview Banner */}
          {checkIn && checkOut && (
            <div className="flex items-center justify-between rounded-xl bg-slate-950 p-2.5 border border-slate-800 text-[11px] text-slate-300">
              <span>
                کل حضور: <strong className="font-mono text-white">{toPersianDigits(Math.floor(rawPresence / 60))}س و {toPersianDigits(rawPresence % 60)}د</strong>
              </span>
              <span>
                کسر ناهار: <strong className="font-mono text-amber-400">{toPersianDigits(breakMinutes)}د</strong>
              </span>
              <span>
                کارکرد مفید خالص: <strong className="font-mono text-emerald-400 font-bold">{toPersianDigits(Math.floor(netWorked / 60))}س و {toPersianDigits(netWorked % 60)}د</strong>
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
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
              <span>ذخیره و محاسبه</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
