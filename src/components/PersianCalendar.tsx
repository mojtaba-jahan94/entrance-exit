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

  // Available year choices for quick selector
  const availableYears = [1401, 1402, 1403, 1404, 1405, 1406];

  // Grid of cells for current selected month
  const calendarCells = useMemo(() => {
    return getJalaliMonthGrid(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // Lookup dictionary of attendance records by date
  const recordsByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const r of records) {
      map.set(r.date, r);
    }
    return map;
  }, [records]);

  // Lookup dictionary of leaves by date
  const leavesByDate = useMemo(() => {
    const map = new Map<string, LeaveRecord[]>();
    for (const l of leaves) {
      const existing = map.get(l.date) || [];
      existing.push(l);
      map.set(l.date, existing);
    }
    return map;
  }, [leaves]);

  // Summary counts for this month
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

  // Record and Leaves for currently selected day
  const selectedDayRecord = recordsByDate.get(selectedDate) || null;
  const selectedDayLeaves = leavesByDate.get(selectedDate) || [];
  const selectedDayHoliday = getHolidayForDate(selectedDate);
  const selectedDayWeekday = getJalaliWeekdayName(selectedDate);

  // Navigate month
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

  // Navigate day in Scheduled sidebar
  const handleShiftSelectedDay = (offsetDays: number) => {
    const parsed = parseJalaliDate(selectedDate);
    // Find in calendarCells or shift
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
    // Fallback if not in grid
    const newD = Math.max(1, Math.min(30, parsed.jd + offsetDays));
    setSelectedDate(formatJalaliDate(parsed.jy, parsed.jm, newD));
  };

  const standardDailyNet = Math.max(
    60,
    (config.requiredDailyMinutes || 510) - (config.defaultBreakMinutes || 30)
  );

  return (
    <div className="w-full space-y-4">
      {/* Outer Card: Matte Deep Charcoal/Navy Container matching screenshot */}
      <div className="relative overflow-hidden rounded-[26px] sm:rounded-[32px] border border-white/[0.08] bg-[#141824]/90 p-3 sm:p-6 backdrop-blur-2xl shadow-2xl transition-all">
        {/* Glow ambient background accents */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />

        {/* Top Header Bar: Month/Year Selector, Chevrons, Today Button & Month Badges */}
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-4 mb-4">
          {/* Left / Title & Selectors */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-md shadow-blue-500/25">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>

              {/* Month Dropdown */}
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
                  className="appearance-none cursor-pointer rounded-2xl border border-white/[0.08] bg-[#1b2030] px-3.5 py-2 pl-8 text-sm sm:text-base font-bold text-white shadow-inner hover:border-blue-500/50 hover:bg-[#20273b] transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  {PERSIAN_MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx + 1} className="bg-[#181d2a] text-white">
                      {name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Year Dropdown */}
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
                  className="appearance-none cursor-pointer rounded-2xl border border-white/[0.08] bg-[#1b2030] px-3 py-2 pl-7 text-sm sm:text-base font-bold font-mono text-white shadow-inner hover:border-blue-500/50 hover:bg-[#20273b] transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y} className="bg-[#181d2a] text-white">
                      {toPersianDigits(y)}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Prev / Next Chevrons Pill */}
            <div className="flex items-center gap-1 rounded-2xl border border-white/[0.08] bg-[#1b2030] p-1 shadow-inner">
              <button
                onClick={handlePrevMonth}
                title="ماه قبل"
                className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={handleGoToToday}
                className="px-2.5 py-1 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl transition-all"
              >
                امروز
              </button>
              <button
                onClick={handleNextMonth}
                title="ماه بعد"
                className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Month Stats Summary Badges */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-[#1a1f2e] px-2.5 py-1.5 text-slate-300 shrink-0">
              <Briefcase className="h-3.5 w-3.5 text-blue-400" />
              <span>کاری:</span>
              <span className="font-bold font-mono text-white">
                {toPersianDigits(monthStatsSummary.workingDaysCount)} روز
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-rose-300 shrink-0">
              <Sun className="h-3.5 w-3.5 text-rose-400" />
              <span>تعطیلات رسمی:</span>
              <span className="font-bold font-mono text-rose-200">
                {toPersianDigits(monthStatsSummary.holidaysCount)} روز
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-emerald-300 shrink-0">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>کارکرد:</span>
              <span className="font-bold font-mono text-emerald-200">
                {toPersianDigits(monthStatsSummary.totalWorkedHours)} س
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid + Side Panel Layout (Just like the user's reference image!) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Calendar Grid Section: Left 8-9 cols */}
          <div className="lg:col-span-8 xl:col-span-8 flex flex-col justify-between">
            {/* Weekday Names Header (7 Columns) */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center text-xs font-semibold">
              {PERSIAN_WEEKDAY_NAMES.map((name, i) => {
                const isFri = i === 6;
                const isThu = i === 5;
                return (
                  <div
                    key={name}
                    className={`py-2 px-1 rounded-xl transition-colors ${
                      isFri
                        ? 'text-rose-400 bg-rose-500/10 font-bold border border-rose-500/20'
                        : isThu && config.thursdayStatus === 'half_day'
                        ? 'text-amber-400 bg-amber-500/5'
                        : 'text-slate-400 bg-white/[0.02]'
                    }`}
                  >
                    <span>{name}</span>
                    {isFri && <span className="block text-[9px] font-normal text-rose-400/80">تعطیل</span>}
                  </div>
                );
              })}
            </div>

            {/* Days Grid Cells (7 columns x 5 or 6 rows) */}
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
                    className={`group relative flex flex-col justify-between min-h-[78px] sm:min-h-[96px] p-1.5 sm:p-2.5 rounded-2xl cursor-pointer transition-all duration-200 select-none ${
                      cell.isCurrentMonth ? '' : 'opacity-30 hover:opacity-70'
                    } ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#2f68fd] to-[#1e4cd6] text-white shadow-xl shadow-blue-600/35 ring-2 ring-blue-400 scale-[1.02] z-20'
                        : cell.isToday
                        ? 'bg-[#1e2538] border-2 border-cyan-400/80 hover:bg-[#232b40] shadow-md'
                        : cell.isHoliday
                        ? 'bg-[#181d2c]/80 border border-rose-500/20 hover:bg-[#1e2336] hover:border-rose-400/40'
                        : 'bg-[#171b28] border border-white/[0.05] hover:bg-[#1e2336] hover:border-white/[0.15]'
                    }`}
                  >
                    {/* Top Row: Day Number + Status / Today Badge */}
                    <div className="flex items-start justify-between">
                      <span
                        className={`text-sm sm:text-base font-black font-mono tracking-tight ${
                          isSelected
                            ? 'text-white'
                            : cell.isHoliday
                            ? 'text-rose-400'
                            : 'text-slate-100'
                        }`}
                      >
                        {toPersianDigits(cell.jd)}
                      </span>

                      {/* Small Quick Status Indicator / Today Ring */}
                      <div className="flex items-center gap-1">
                        {cell.isToday && !isSelected && (
                          <span className="h-2 w-2 rounded-full bg-cyan-400 ring-2 ring-cyan-400/40 animate-pulse" />
                        )}
                        {isWorkingLive && (
                          <span
                            className="h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/40 animate-ping"
                            title="در حال کار"
                          />
                        )}
                        {/* Quick hover add button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenManualEntryForDate(cell.dateStr);
                          }}
                          title="ثبت تردد برای این روز"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-lg bg-white/20 hover:bg-white/40 text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: Holiday Pill or Status Pill */}
                    <div className="my-1 space-y-1">
                      {/* Holiday Badge */}
                      {cell.isHoliday && cell.holidayTitle && (
                        <div
                          className={`truncate text-[9px] sm:text-[10px] font-semibold px-1 py-0.5 rounded-lg ${
                            isSelected
                              ? 'bg-rose-500/30 text-rose-100 border border-rose-300/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                          }`}
                          title={cell.holidayTitle}
                        >
                          {cell.holidayTitle}
                        </div>
                      )}

                      {/* Attendance Work Hours Pill */}
                      {rec && rec.workedMinutes > 0 && (
                        <div
                          className={`flex items-center justify-between text-[9px] sm:text-[10px] font-mono px-1 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-white/20 text-white font-bold'
                              : 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
                          }`}
                        >
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            <span>{toPersianDigits(formatMinutesToTimeString(rec.workedMinutes))}</span>
                          </span>
                          {rec.overtimeMinutes > 0 && (
                            <span className="text-emerald-300 font-bold text-[8px] sm:text-[9px]">
                              +{toPersianDigits(Math.round(rec.overtimeMinutes / 60))}س
                            </span>
                          )}
                        </div>
                      )}

                      {/* Leave Pill */}
                      {dayLeaves.length > 0 && (
                        <div
                          className={`truncate text-[9px] sm:text-[10px] font-semibold px-1 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-amber-400/30 text-amber-100'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                          }`}
                          title="مرخصی ثبت شده"
                        >
                          🏖️ مرخصی
                        </div>
                      )}
                    </div>

                    {/* Bottom Status Dots Row */}
                    <div className="flex items-center gap-1 text-[9px]">
                      {rec?.checkIn && (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isSelected
                              ? 'bg-white'
                              : rec.checkOut
                              ? 'bg-emerald-400'
                              : 'bg-cyan-400 animate-pulse'
                          }`}
                        />
                      )}
                      {rec?.deficitMinutes ? (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isSelected ? 'bg-rose-200' : 'bg-rose-400'
                          }`}
                          title={`کسر کار: ${toPersianDigits(rec.deficitMinutes)}د`}
                        />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: "Scheduled" / روز و رویدادهای انتخاب شده (Exactly matching the right card in screenshot!) */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col justify-between rounded-3xl border border-white/[0.08] bg-[#161a27] p-4 sm:p-5 shadow-xl">
            {/* Header: Scheduled + Date + Day Chevrons */}
            <div>
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs uppercase tracking-wider font-bold text-blue-400">
                      برنامه و کارکرد
                    </span>
                    {selectedDate === todayStr && (
                      <span className="rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.2 border border-cyan-500/30">
                        امروز
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                    {selectedDayWeekday}، {toPersianDigits(selectedDate)}
                  </h3>
                </div>

                {/* Day navigation arrows */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleShiftSelectedDay(-1)}
                    title="روز قبل"
                    className="p-1.5 rounded-xl border border-white/[0.06] bg-[#1d2233] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleShiftSelectedDay(1)}
                    title="روز بعد"
                    className="p-1.5 rounded-xl border border-white/[0.06] bg-[#1d2233] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Holiday Banner if selected day is holiday */}
              {selectedDayHoliday.isHoliday && (
                <div className="mb-4 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/20 via-rose-500/10 to-transparent p-3 text-rose-200">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-rose-500/30 text-rose-300">
                      <Sun className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-rose-300 block">تعطیل رسمی تقویم</span>
                      <span className="text-xs sm:text-sm font-bold text-white">{selectedDayHoliday.title}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cards matching the color top bars from the screenshot! */}
              <div className="space-y-3">
                {/* 1. Orange Bar: Check-In & Check-Out Times */}
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#1a2030] p-3.5 transition-all hover:border-orange-500/30">
                  {/* Top orange accent strip */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-400" />
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-orange-400" />
                      تردد و ساعات حضور
                    </span>
                    <span className="text-[10px] text-orange-300 font-mono">
                      {selectedDayRecord?.status === 'in_progress' ? 'حضور زنده' : 'ثبت ساعت'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono text-center">
                    <div className="rounded-xl bg-[#141824] border border-white/[0.06] p-2">
                      <span className="text-[10px] text-slate-400 block mb-0.5">ساعت ورود</span>
                      <span className="text-sm sm:text-base font-bold text-emerald-400">
                        {selectedDayRecord?.checkIn
                          ? toPersianDigits(selectedDayRecord.checkIn)
                          : 'ثبت‌نشده'}
                      </span>
                    </div>
                    <div className="rounded-xl bg-[#141824] border border-white/[0.06] p-2">
                      <span className="text-[10px] text-slate-400 block mb-0.5">ساعت خروج</span>
                      <span className="text-sm sm:text-base font-bold text-rose-400">
                        {selectedDayRecord?.checkOut
                          ? toPersianDigits(selectedDayRecord.checkOut)
                          : selectedDayRecord?.checkIn
                          ? 'در حال کار'
                          : 'ثبت‌نشده'}
                      </span>
                    </div>
                  </div>

                  {selectedDayRecord?.targetCheckOut && !selectedDayRecord?.checkOut && (
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between bg-white/[0.02] px-2 py-1 rounded-lg">
                      <span>خروج پیشنهادی استاندارد:</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {toPersianDigits(selectedDayRecord.targetCheckOut)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Lime Green Bar: Effective Worked Hours & Daily Progress */}
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#1a2030] p-3.5 transition-all hover:border-lime-500/30">
                  {/* Top lime accent strip */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-lime-500 to-emerald-400" />
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-lime-400" />
                      کارکرد موثر روز
                    </span>
                    <span className="font-mono font-bold text-lime-400 text-xs">
                      {selectedDayRecord?.workedMinutes
                        ? toPersianDigits(formatMinutesToTimeString(selectedDayRecord.workedMinutes))
                        : '۰:۰۰'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {selectedDayRecord && (
                    <div className="space-y-1 mt-2">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>تحقق شیفت موظف:</span>
                        <span className="font-mono text-lime-300">
                          {toPersianDigits(
                            Math.min(
                              100,
                              Math.round(
                                (selectedDayRecord.workedMinutes / Math.max(1, standardDailyNet)) * 100
                              )
                            )
                          )}
                          ٪
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#121622] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-lime-500 to-emerald-400 transition-all duration-500"
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

                  {selectedDayRecord?.breakMinutes ? (
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>مدت کسر استراحت ناهار:</span>
                      <span className="font-mono text-slate-300">
                        {toPersianDigits(selectedDayRecord.breakMinutes)} دقیقه
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* 3. Electric Blue Bar: Overtime, Deficit & Balance */}
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#1a2030] p-3.5 transition-all hover:border-blue-500/30">
                  {/* Top electric blue strip */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-blue-400" />
                      اضافه‌کار و تراز
                    </span>
                    <span className="text-[10px] font-mono text-blue-300">
                      تراز:{' '}
                      {selectedDayRecord
                        ? toPersianDigits(
                            formatMinutesToTimeString(selectedDayRecord.netBalanceMinutes, true)
                          )
                        : '۰'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="rounded-xl bg-[#141824] p-2 border border-white/[0.04]">
                      <span className="text-[10px] text-slate-400 block">اضافه کاری</span>
                      <span className="font-bold text-cyan-400">
                        {selectedDayRecord?.overtimeMinutes
                          ? toPersianDigits(
                              formatMinutesToTimeString(selectedDayRecord.overtimeMinutes)
                            )
                          : '۰:۰۰'}
                      </span>
                    </div>
                    <div className="rounded-xl bg-[#141824] p-2 border border-white/[0.04]">
                      <span className="text-[10px] text-slate-400 block">کسر کار</span>
                      <span className="font-bold text-rose-400">
                        {selectedDayRecord?.deficitMinutes
                          ? toPersianDigits(
                              formatMinutesToTimeString(selectedDayRecord.deficitMinutes)
                            )
                          : '۰:۰۰'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Leaves & Notes */}
                {(selectedDayLeaves.length > 0 || selectedDayRecord?.note) && (
                  <div className="rounded-2xl border border-white/[0.06] bg-[#1a2030] p-3.5 space-y-2">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Coffee className="h-3.5 w-3.5" />
                      مرخصی‌ها و یادداشت روز
                    </span>
                    {selectedDayLeaves.map((l) => (
                      <div
                        key={l.id}
                        className="rounded-xl bg-[#141824] p-2 text-xs border border-amber-500/20 text-slate-200"
                      >
                        <div className="flex justify-between font-semibold">
                          <span>{l.type === 'hourly' ? 'مرخصی ساعتی' : 'مرخصی روزانه'}</span>
                          <span className="font-mono text-amber-400">
                            {toPersianDigits(l.hours)} ساعت
                          </span>
                        </div>
                        {l.reason && <p className="text-[10px] text-slate-400 mt-0.5">{l.reason}</p>}
                      </div>
                    ))}
                    {selectedDayRecord?.note && (
                      <p className="text-[11px] text-slate-300 bg-[#141824] p-2 rounded-xl italic">
                        {selectedDayRecord.note}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons at the bottom of the sidebar */}
            <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-2">
              <button
                onClick={() => onOpenManualEntryForDate(selectedDate)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
              >
                <Edit3 className="h-4 w-4" />
                <span>{selectedDayRecord ? 'ویرایش تردد این روز' : 'ثبت تردد برای این روز'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onOpenLeaveForDate(selectedDate)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold py-2 px-3 text-xs transition-all active:scale-[0.98]"
                >
                  <Coffee className="h-3.5 w-3.5" />
                  <span>ثبت مرخصی</span>
                </button>

                {selectedDayRecord && (
                  <button
                    onClick={() => onDeleteRecord(selectedDayRecord.id)}
                    className="flex items-center justify-center gap-1.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold py-2 px-3 text-xs transition-all active:scale-[0.98]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>حذف تردد</span>
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
