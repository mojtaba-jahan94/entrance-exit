import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Clock,
  Sparkles,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Edit3,
  Trash2,
  Briefcase,
  Sun,
  Flame,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  CalendarCheck,
  Zap,
} from 'lucide-react';
import { AttendanceRecord, ShiftConfig, LeaveRecord } from '../types';
import {
  toPersianDigits,
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEKDAY_NAMES,
  getJalaliMonthGrid,
  getHolidayForDate,
  getTodayJalaliString,
  formatJalaliDate,
  formatMinutesToTimeString,
  formatMinutesToPersianReadable,
  timeStringToMinutes,
  parseJalaliDate,
  getJalaliWeekdayName,
  JalaliCalendarCell,
} from '../utils/jalali';

interface PersianCalendarProps {
  records: AttendanceRecord[];
  leaves: LeaveRecord[];
  config: ShiftConfig;
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onOpenManualEntryForDate: (dateStr: string) => void;
  onOpenLeaveForDate: (dateStr: string) => void;
  onDeleteRecord: (id: string) => void;
}

export const PersianCalendar: React.FC<PersianCalendarProps> = ({
  records,
  leaves,
  config,
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  onOpenManualEntryForDate,
  onOpenLeaveForDate,
  onDeleteRecord,
}) => {
  const todayStr = useMemo(() => getTodayJalaliString(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const availableYears = [1401, 1402, 1403, 1404, 1405, 1406];

  const calendarCells = useMemo(() => {
    return getJalaliMonthGrid(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const r of records) {
      map.set(r.date, r);
    }
    return map;
  }, [records]);

  const leavesByDate = useMemo(() => {
    const map = new Map<string, LeaveRecord[]>();
    for (const l of leaves) {
      const existing = map.get(l.date) || [];
      existing.push(l);
      map.set(l.date, existing);
    }
    return map;
  }, [leaves]);

  const monthStatsSummary = useMemo(() => {
    let workingDaysCount = 0;
    let holidaysCount = 0;
    let recordedDaysCount = 0;
    let totalWorkedMinutes = 0;

    for (const cell of calendarCells) {
      if (!cell.isCurrentMonth) continue;
      if (cell.isHoliday) {
        holidaysCount++;
      } else {
        workingDaysCount++;
      }

      const rec = recordsByDate.get(cell.dateStr);
      if (rec && rec.workedMinutes > 0) {
        recordedDaysCount++;
        totalWorkedMinutes += rec.workedMinutes;
      }
    }

    return {
      workingDaysCount,
      holidaysCount,
      recordedDaysCount,
      totalWorkedHours: (totalWorkedMinutes / 60).toFixed(1),
    };
  }, [calendarCells, recordsByDate]);

  const selectedDayRecord = recordsByDate.get(selectedDate) || null;
  const selectedDayLeaves = leavesByDate.get(selectedDate) || [];
  const selectedDayHoliday = getHolidayForDate(selectedDate);
  const selectedDayWeekday = getJalaliWeekdayName(selectedDate);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      onYearChange(selectedYear - 1);
      onMonthChange(12);
    } else {
      onMonthChange(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      onYearChange(selectedYear + 1);
      onMonthChange(1);
    } else {
      onMonthChange(selectedMonth + 1);
    }
  };

  const handleGoToToday = () => {
    const parsed = parseJalaliDate(todayStr);
    onYearChange(parsed.jy);
    onMonthChange(parsed.jm);
    setSelectedDate(todayStr);
  };

  const handleShiftSelectedDay = (offsetDays: number) => {
    const parsed = parseJalaliDate(selectedDate);
    const currentIndex = calendarCells.findIndex((c) => c.dateStr === selectedDate);
    if (currentIndex !== -1) {
      const targetIndex = currentIndex + offsetDays;
      if (targetIndex >= 0 && targetIndex < calendarCells.length) {
        const target = calendarCells[targetIndex];
        setSelectedDate(target.dateStr);
        if (!target.isCurrentMonth) {
          onYearChange(target.jy);
          onMonthChange(target.jm);
        }
        return;
      }
    }
    const newD = Math.max(1, Math.min(30, parsed.jd + offsetDays));
    setSelectedDate(formatJalaliDate(parsed.jy, parsed.jm, newD));
  };

  const standardDailyNet = Math.max(
    60,
    (config.requiredDailyMinutes || 510) - (config.defaultBreakMinutes || 30)
  );

  return (
    <div className="w-full space-y-4">
      <div className="rounded-2xl border border-black/[0.08] bg-white p-4 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all">
        {/* Top Header Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-black/[0.06] pb-4 mb-4">
          {/* Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl border border-black/10 bg-black/[0.02] flex items-center justify-center text-black/70">
                <CalendarIcon className="h-4 w-4" />
              </div>

              {/* Month Dropdown */}
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
                  className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#111] hover:border-black/25 transition-all focus:outline-none cursor-pointer"
                >
                  {PERSIAN_MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Dropdown */}
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
                  className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs sm:text-sm font-mono text-black/70 hover:border-black/25 transition-all focus:outline-none cursor-pointer"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {toPersianDigits(y)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prev / Next Chevrons Pill */}
            <div className="flex items-center gap-1 rounded-xl border border-black/10 bg-black/[0.02] p-0.5">
              <button
                onClick={handleNextMonth}
                title="ماه بعد"
                className="p-1 rounded-lg text-black/50 hover:text-black hover:bg-black/[0.04] transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={handleGoToToday}
                className="px-2 py-0.5 text-xs font-medium text-black/70 hover:text-black hover:bg-black/[0.04] rounded-lg transition-all"
              >
                امروز
              </button>
              <button
                onClick={handlePrevMonth}
                title="ماه قبل"
                className="p-1 rounded-lg text-black/50 hover:text-black hover:bg-black/[0.04] transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Month Stats Summary Badges */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-mono">
            <div className="flex items-center gap-1.5 rounded-xl border border-black/[0.06] bg-black/[0.02] px-2.5 py-1 text-black/60 shrink-0">
              <Briefcase className="h-3.5 w-3.5 text-black/40" />
              <span>کاری:</span>
              <strong className="text-[#111]">
                {toPersianDigits(monthStatsSummary.workingDaysCount)} روز
              </strong>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1 text-rose-800 shrink-0">
              <Sun className="h-3.5 w-3.5 text-rose-600" />
              <span>تعطیلات:</span>
              <strong>{toPersianDigits(monthStatsSummary.holidaysCount)} روز</strong>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-800 shrink-0">
              <Clock className="h-3.5 w-3.5 text-emerald-600" />
              <span>کارکرد:</span>
              <strong>{toPersianDigits(monthStatsSummary.totalWorkedHours)} س</strong>
            </div>
          </div>
        </div>

        {/* Main Grid + Side Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Calendar Grid Section */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            {/* Weekday Names Header */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center text-xs font-medium">
              {PERSIAN_WEEKDAY_NAMES.map((name, i) => {
                const isFri = i === 6;
                const isThu = i === 5;
                return (
                  <div
                    key={name}
                    className={`py-2 px-1 rounded-xl transition-colors font-mono ${
                      isFri
                        ? 'text-rose-600 bg-rose-50 border border-rose-200'
                        : isThu
                        ? 'text-black/70 bg-black/[0.02]'
                        : 'text-black/50 bg-black/[0.02]'
                    }`}
                  >
                    <span>{name}</span>
                  </div>
                );
              })}
            </div>

            {/* Days Grid Cells */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 auto-rows-fr">
              {calendarCells.map((cell) => {
                const isSelected = cell.dateStr === selectedDate;
                const rec = recordsByDate.get(cell.dateStr);
                const dayLeaves = leavesByDate.get(cell.dateStr) || [];
                const isWorkingLive = cell.isToday && rec?.checkIn && !rec?.checkOut;

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    onDoubleClick={() => onOpenManualEntryForDate(cell.dateStr)}
                    className={`group relative flex flex-col justify-between min-h-[80px] sm:min-h-[96px] p-2 rounded-2xl cursor-pointer transition-all duration-200 select-none ${
                      cell.isCurrentMonth ? '' : 'opacity-25 hover:opacity-60'
                    } ${
                      isSelected
                        ? 'bg-[#111] text-white shadow-md ring-2 ring-black/20 scale-[1.02] z-20'
                        : cell.isToday
                        ? 'bg-black/[0.03] border-2 border-[#111] hover:bg-black/[0.05]'
                        : cell.isHoliday
                        ? 'bg-rose-50/40 border border-rose-200/60 hover:bg-rose-50'
                        : 'bg-white border border-black/[0.07] hover:border-black/20 hover:bg-[#fafaf8]'
                    }`}
                  >
                    {/* Top Row: Day Number */}
                    <div className="flex items-start justify-between">
                      <span
                        className={`text-sm sm:text-base font-light font-mono ${
                          isSelected
                            ? 'text-white font-medium'
                            : cell.isHoliday
                            ? 'text-rose-600 font-medium'
                            : 'text-[#111]'
                        }`}
                      >
                        {toPersianDigits(cell.jd)}
                      </span>

                      <div className="flex items-center gap-1">
                        {cell.isToday && !isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#111]" />
                        )}
                        {isWorkingLive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenManualEntryForDate(cell.dateStr);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-lg text-black/50 hover:text-black"
                          title="ثبت تردد"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: Badges */}
                    <div className="my-1 space-y-1">
                      {cell.isHoliday && cell.holidayTitle && (
                        <div
                          className={`truncate text-[9px] font-medium px-1 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-rose-100/70 text-rose-800'
                          }`}
                          title={cell.holidayTitle}
                        >
                          {cell.holidayTitle}
                        </div>
                      )}

                      {rec && rec.workedMinutes > 0 && (
                        <div
                          className={`flex items-center justify-between text-[9px] font-mono px-1 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-white/20 text-white font-medium'
                              : 'bg-black/[0.04] text-[#111]'
                          }`}
                        >
                          <span>{toPersianDigits(formatMinutesToTimeString(rec.workedMinutes))}</span>
                          {rec.overtimeMinutes > 0 && (
                            <span className={isSelected ? 'text-emerald-200' : 'text-emerald-700'}>
                              +{toPersianDigits(Math.round(rec.overtimeMinutes / 60))}س
                            </span>
                          )}
                        </div>
                      )}

                      {dayLeaves.length > 0 && (
                        <div
                          className={`truncate text-[9px] font-medium px-1 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-amber-400/30 text-amber-100'
                              : 'bg-amber-100/70 text-amber-800'
                          }`}
                        >
                          مرخصی
                        </div>
                      )}
                    </div>

                    {/* Bottom Status Dot */}
                    <div className="flex items-center gap-1 text-[9px]">
                      {rec?.checkIn && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected
                              ? 'bg-white'
                              : rec.checkOut
                              ? 'bg-emerald-500'
                              : 'bg-blue-500 animate-pulse'
                          }`}
                        />
                      )}
                      {rec?.delayMinutes ? (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-rose-300' : 'bg-rose-500'
                          }`}
                        />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Scheduled Day Details */}
          <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl border border-black/[0.08] bg-[#FAF9F7] p-4 sm:p-5">
            <div>
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 mb-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-black/40">
                    <span>SCHEDULED</span>
                    {selectedDate === todayStr && (
                      <span className="rounded-full bg-black/[0.06] text-[#111] text-[9px] font-bold px-2 py-0.2">
                        امروز
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-[#111] mt-0.5">
                    {selectedDayWeekday}، {toPersianDigits(selectedDate)}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleShiftSelectedDay(-1)}
                    className="p-1.5 rounded-xl border border-black/10 bg-white text-black/60 hover:text-black transition-all"
                    title="روز قبل"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleShiftSelectedDay(1)}
                    className="p-1.5 rounded-xl border border-black/10 bg-white text-black/60 hover:text-black transition-all"
                    title="روز بعد"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Holiday Alert */}
              {selectedDayHoliday.isHoliday && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 text-xs">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-semibold block">تعطیل رسمی</span>
                      <span>{selectedDayHoliday.title}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Cards for Selected Day */}
              <div className="space-y-3">
                {/* 1. Punches Card */}
                <div className="rounded-xl border border-black/[0.07] bg-white p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#111] flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-black/40" />
                      تردد و ساعات حضور
                    </span>
                    <span className="text-[10px] text-black/40 font-mono">
                      {selectedDayRecord?.status === 'in_progress' ? 'حضور زنده' : 'ثبت‌شده'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono text-center text-xs">
                    <div className="rounded-lg bg-black/[0.02] border border-black/[0.05] p-2">
                      <span className="text-[10px] text-black/40 block mb-0.5">ساعت ورود</span>
                      <strong className="text-[#111]">
                        {selectedDayRecord?.checkIn
                          ? toPersianDigits(selectedDayRecord.checkIn)
                          : '--:--'}
                      </strong>
                    </div>
                    <div className="rounded-lg bg-black/[0.02] border border-black/[0.05] p-2">
                      <span className="text-[10px] text-black/40 block mb-0.5">ساعت خروج</span>
                      <strong className="text-[#111]">
                        {selectedDayRecord?.checkOut
                          ? toPersianDigits(selectedDayRecord.checkOut)
                          : selectedDayRecord?.checkIn
                          ? 'در حال کار'
                          : '--:--'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 2. Effective Worked Hours */}
                <div className="rounded-xl border border-black/[0.07] bg-white p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#111] flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-black/40" />
                      کارکرد روزانه
                    </span>
                    <span className="font-mono font-bold text-[#111]">
                      {selectedDayRecord?.workedMinutes
                        ? toPersianDigits(formatMinutesToTimeString(selectedDayRecord.workedMinutes))
                        : '۰:۰۰'}
                    </span>
                  </div>

                  {selectedDayRecord && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-black/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#111] transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (selectedDayRecord.workedMinutes / Math.max(1, standardDailyNet)) * 100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Overtime & Deficit */}
                <div className="rounded-xl border border-black/[0.07] bg-white p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#111] flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-black/40" />
                      اضافه‌کار و کسر کار
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="rounded-lg bg-black/[0.02] p-2 border border-black/[0.05] text-center">
                      <span className="text-[10px] text-black/40 block">اضافه کاری</span>
                      <strong className="text-emerald-700">
                        {selectedDayRecord?.overtimeMinutes
                          ? `+${toPersianDigits(formatMinutesToTimeString(selectedDayRecord.overtimeMinutes))}`
                          : '۰:۰۰'}
                      </strong>
                    </div>
                    <div className="rounded-lg bg-black/[0.02] p-2 border border-black/[0.05] text-center">
                      <span className="text-[10px] text-black/40 block">کسر کار</span>
                      <strong className="text-rose-600">
                        {selectedDayRecord?.deficitMinutes
                          ? `-${toPersianDigits(formatMinutesToTimeString(selectedDayRecord.deficitMinutes))}`
                          : '۰:۰۰'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 4. Leaves & Notes */}
                {(selectedDayLeaves.length > 0 || selectedDayRecord?.note) && (
                  <div className="rounded-xl border border-black/[0.07] bg-white p-3.5 space-y-2 text-xs">
                    <span className="font-semibold text-black/70 flex items-center gap-1.5">
                      <Coffee className="h-3.5 w-3.5 text-black/40" />
                      مرخصی و توضیحات
                    </span>
                    {selectedDayLeaves.map((l) => (
                      <div
                        key={l.id}
                        className="rounded-lg bg-amber-50 p-2 border border-amber-200 text-amber-800 font-mono text-[11px]"
                      >
                        {l.type === 'hourly' ? 'مرخصی ساعتی: ' : 'مرخصی روزانه: '}
                        <strong>{toPersianDigits(l.hours)} ساعت</strong>
                      </div>
                    ))}
                    {selectedDayRecord?.note && (
                      <p className="text-black/60 bg-black/[0.02] p-2 rounded-lg italic text-[11px]">
                        {selectedDayRecord.note}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-black/[0.06] space-y-2">
              <button
                onClick={() => onOpenManualEntryForDate(selectedDate)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#111] text-white hover:bg-[#2c2c2c] transition-all text-xs font-medium tracking-wide flex items-center justify-center gap-2 shadow-xs"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{selectedDayRecord ? 'ویرایش تردد این روز' : 'ثبت تردد برای این روز'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onOpenLeaveForDate(selectedDate)}
                  className="py-2 px-3 rounded-xl border border-black/10 bg-white hover:bg-black/[0.03] text-black/70 text-xs font-medium transition-all flex items-center justify-center gap-1"
                >
                  <Coffee className="h-3.5 w-3.5" />
                  <span>ثبت مرخصی</span>
                </button>

                {selectedDayRecord && (
                  <button
                    onClick={() => onDeleteRecord(selectedDayRecord.id)}
                    className="py-2 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium transition-all flex items-center justify-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>حذف</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
