import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Clock,
  Coffee,
  Plus,
  Edit3,
  Trash2,
  Briefcase,
  Sun,
  Flame,
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
  parseJalaliDate,
  getJalaliWeekdayName,
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
  const availableYears = useMemo(
    () => [selectedYear - 3, selectedYear - 2, selectedYear - 1, selectedYear, selectedYear + 1, selectedYear + 2],
    [selectedYear]
  );

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

      const r = recordsByDate.get(cell.dateStr);
      if (r && r.workedMinutes > 0) {
        recordedDaysCount++;
        totalWorkedMinutes += r.workedMinutes;
      }
    }

    return {
      workingDaysCount,
      holidaysCount,
      recordedDaysCount,
      totalWorkedHours: (totalWorkedMinutes / 60).toFixed(1),
    };
  }, [calendarCells, recordsByDate]);

  // Information about currently selected day
  const selectedDayRecord = recordsByDate.get(selectedDate);
  const selectedDayLeaves = leavesByDate.get(selectedDate) || [];
  const selectedDayHoliday = useMemo(() => getHolidayForDate(selectedDate), [selectedDate]);
  const selectedDayWeekday = useMemo(() => getJalaliWeekdayName(selectedDate), [selectedDate]);

  // Month navigation (RTL: right is past, left is future)
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
      {/* Outer Card: Nordic White Container with subtle border */}
      <div className="relative overflow-hidden rounded-[28px] border border-[#D1D5DB] bg-white p-4 sm:p-6 shadow-sm transition-all text-[#1F2933]">
        {/* Top Header Bar: Month/Year Selector, Chevrons, Today Button & Month Badges */}
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between border-b border-[#D1D5DB] pb-4 mb-4">
          {/* Left / Title & Selectors */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#A68A64] text-white shadow-sm">
                <CalendarIcon className="h-5 w-5" />
              </div>

              {/* Month Dropdown */}
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
                  className="appearance-none cursor-pointer rounded-2xl border border-[#D1D5DB] bg-[#F7F7F2] px-3.5 py-2 pl-8 text-sm sm:text-base font-bold text-[#1F2933] hover:border-[#A68A64] transition-all focus:outline-none focus:ring-2 focus:ring-[#A68A64]/20"
                >
                  {PERSIAN_MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx + 1} className="bg-white text-[#1F2933]">
                      {name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B7280]">
                  <ChevronLeft className="h-4 w-4 -rotate-90" />
                </div>
              </div>

              {/* Year Dropdown */}
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
                  className="appearance-none cursor-pointer rounded-2xl border border-[#D1D5DB] bg-[#F7F7F2] px-3 py-2 pl-7 text-sm sm:text-base font-bold font-mono text-[#A68A64] hover:border-[#A68A64] transition-all focus:outline-none focus:ring-2 focus:ring-[#A68A64]/20"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y} className="bg-white text-[#1F2933]">
                      {toPersianDigits(y)}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[#6B7280]">
                  <ChevronLeft className="h-4 w-4 -rotate-90" />
                </div>
              </div>
            </div>

            {/* Prev / Next Chevrons & Today Pill */}
            <div className="flex items-center gap-1 rounded-2xl border border-[#D1D5DB] bg-[#F7F7F2] p-1 shadow-sm">
              <button
                onClick={handlePrevMonth}
                title="ماه قبل"
                className="rounded-xl p-1.5 text-[#6B7280] hover:text-[#1F2933] hover:bg-white transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={handleGoToToday}
                className="px-2.5 py-1 text-xs font-bold text-[#A68A64] hover:bg-[#F5F0E6] rounded-xl transition-all"
              >
                امروز
              </button>
              <button
                onClick={handleNextMonth}
                title="ماه بعد"
                className="rounded-xl p-1.5 text-[#6B7280] hover:text-[#1F2933] hover:bg-white transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Month Stats Summary Badges */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5 rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-2.5 py-1.5 text-[#6B7280] shrink-0">
              <Briefcase className="h-3.5 w-3.5 text-[#A68A64]" />
              <span>کاری:</span>
              <span className="font-bold font-mono text-[#1F2933]">
                {toPersianDigits(monthStatsSummary.workingDaysCount)} روز
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[#B91C1C] shrink-0">
              <Sun className="h-3.5 w-3.5 text-[#B91C1C]" />
              <span>تعطیلات رسمی:</span>
              <span className="font-bold font-mono">
                {toPersianDigits(monthStatsSummary.holidaysCount)} روز
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[#2E6F40] shrink-0">
              <Clock className="h-3.5 w-3.5 text-[#2E6F40]" />
              <span>کارکرد:</span>
              <span className="font-bold font-mono">
                {toPersianDigits(monthStatsSummary.totalWorkedHours)} س
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid + Side Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Calendar Grid Section: Left 8 cols */}
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
                        ? 'text-[#B91C1C] bg-rose-50 font-bold border border-rose-200'
                        : isThu && config.thursdayStatus === 'half_day'
                        ? 'text-[#A68A64] bg-[#F5F0E6] border border-[#A68A64]/30'
                        : 'text-[#6B7280] bg-[#F7F7F2]'
                    }`}
                  >
                    <span>{name}</span>
                    {isFri && <span className="block text-[9px] font-normal text-[#B91C1C]/80">تعطیل</span>}
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
                    className={`group relative flex flex-col justify-between min-h-[82px] sm:min-h-[100px] p-2 sm:p-2.5 rounded-2xl cursor-pointer transition-all duration-200 select-none ${
                      cell.isCurrentMonth ? '' : 'opacity-35 hover:opacity-70'
                    } ${
                      isSelected
                        ? 'bg-[#A68A64] text-white shadow-lg ring-2 ring-[#8F7553] scale-[1.02] z-20'
                        : cell.isToday
                        ? 'bg-[#F5F0E6] border-2 border-[#A68A64] shadow-sm'
                        : cell.isHoliday
                        ? 'bg-rose-50/50 border border-rose-200 hover:bg-rose-50'
                        : 'bg-white border border-[#D1D5DB] hover:bg-[#F5F0E6]/50 hover:border-[#A68A64]'
                    }`}
                  >
                    {/* Top Row: Day Number + Status / Today Badge */}
                    <div className="flex items-start justify-between">
                      <span
                        className={`text-sm sm:text-base font-black font-mono tracking-tight tabular-nums ${
                          isSelected
                            ? 'text-white'
                            : cell.isHoliday
                            ? 'text-[#B91C1C]'
                            : 'text-[#1F2933]'
                        }`}
                      >
                        {toPersianDigits(cell.jd)}
                      </span>

                      {/* Small Quick Status Indicator / Today Ring */}
                      <div className="flex items-center gap-1">
                        {cell.isToday && !isSelected && (
                          <span className="h-2 w-2 rounded-full bg-[#A68A64] ring-2 ring-[#A68A64]/40 animate-pulse" />
                        )}
                        {isWorkingLive && (
                          <span
                            className="h-2 w-2 rounded-full bg-[#2E6F40] ring-2 ring-[#2E6F40]/40 animate-ping"
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
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-lg bg-black/10 hover:bg-black/20 text-[#1F2933]"
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
                              ? 'bg-white/20 text-white'
                              : 'bg-rose-100 text-[#B91C1C] border border-rose-200'
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
                              ? 'bg-white/25 text-white font-bold'
                              : 'bg-emerald-50 text-[#2E6F40] border border-emerald-200 font-bold'
                          }`}
                        >
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            <span>{toPersianDigits(formatMinutesToTimeString(rec.workedMinutes))}</span>
                          </span>
                          {rec.overtimeMinutes > 0 && (
                            <span className="text-[#2E6F40] font-black text-[8px] sm:text-[9px]">
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
                              ? 'bg-white/20 text-white'
                              : 'bg-amber-50 text-[#D97706] border border-amber-200'
                          }`}
                          title="مرخصی ثبت شده"
                        >
                          مرخصی
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
                              ? 'bg-[#2E6F40]'
                              : 'bg-[#A68A64] animate-pulse'
                          }`}
                        />
                      )}
                      {rec?.deficitMinutes ? (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-[#B91C1C]'
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

          {/* Right Panel: روز و رویدادهای انتخاب شده */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col justify-between rounded-3xl border border-[#D1D5DB] bg-[#F7F7F2] p-4 sm:p-5 shadow-sm">
            {/* Header: Date + Day Chevrons */}
            <div>
              <div className="flex items-center justify-between border-b border-[#D1D5DB] pb-3 mb-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs uppercase tracking-wider font-bold text-[#A68A64]">
                      برنامه و کارکرد روزانه
                    </span>
                    {selectedDate === todayStr && (
                      <span className="rounded-full bg-[#A68A64]/15 text-[#A68A64] text-[10px] font-bold px-2 py-0.5 border border-[#A68A64]/30">
                        امروز
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1F2933] mt-0.5">
                    {selectedDayWeekday}، {toPersianDigits(selectedDate)}
                  </h3>
                </div>

                {/* Day navigation arrows */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleShiftSelectedDay(-1)}
                    title="روز قبل"
                    className="p-1.5 rounded-xl border border-[#D1D5DB] bg-white text-[#6B7280] hover:text-[#1F2933] hover:bg-[#F5F0E6] transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleShiftSelectedDay(1)}
                    title="روز بعد"
                    className="p-1.5 rounded-xl border border-[#D1D5DB] bg-white text-[#6B7280] hover:text-[#1F2933] hover:bg-[#F5F0E6] transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Holiday Banner if selected day is holiday */}
              {selectedDayHoliday.isHoliday && (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[#B91C1C]">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-rose-100 text-[#B91C1C]">
                      <Sun className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold block">تعطیل رسمی تقویم</span>
                      <span className="text-xs sm:text-sm font-bold text-[#1F2933]">{selectedDayHoliday.title}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-cards */}
              <div className="space-y-3">
                {/* 1. Check-In & Check-Out Times */}
                <div className="relative overflow-hidden rounded-2xl border border-[#D1D5DB] bg-white p-3.5 shadow-sm">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#A68A64]" />
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-[#1F2933] flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-[#A68A64]" />
                      تردد و ساعات حضور
                    </span>
                    <span className="text-[10px] text-[#6B7280] font-mono">
                      {selectedDayRecord?.status === 'in_progress' ? 'حضور زنده' : 'ثبت ساعت'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono text-center">
                    <div className="rounded-xl bg-[#F7F7F2] border border-[#D1D5DB] p-2">
                      <span className="text-[10px] text-[#6B7280] block mb-0.5">ساعت ورود</span>
                      <span className="text-sm sm:text-base font-bold text-[#2E6F40]">
                        {selectedDayRecord?.checkIn
                          ? toPersianDigits(selectedDayRecord.checkIn)
                          : 'ثبت‌نشده'}
                      </span>
                    </div>
                    <div className="rounded-xl bg-[#F7F7F2] border border-[#D1D5DB] p-2">
                      <span className="text-[10px] text-[#6B7280] block mb-0.5">ساعت خروج</span>
                      <span className="text-sm sm:text-base font-bold text-[#B91C1C]">
                        {selectedDayRecord?.checkOut
                          ? toPersianDigits(selectedDayRecord.checkOut)
                          : selectedDayRecord?.checkIn
                          ? 'در حال کار'
                          : 'ثبت‌نشده'}
                      </span>
                    </div>
                  </div>

                  {selectedDayRecord?.targetCheckOut && !selectedDayRecord?.checkOut && (
                    <div className="mt-2 text-[11px] text-[#6B7280] flex items-center justify-between bg-[#F7F7F2] px-2.5 py-1 rounded-lg border border-[#D1D5DB]/60">
                      <span>خروج پیشنهادی استاندارد:</span>
                      <span className="font-mono text-[#1F2933] font-bold">
                        {toPersianDigits(selectedDayRecord.targetCheckOut)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Effective Worked Hours & Daily Progress */}
                <div className="relative overflow-hidden rounded-2xl border border-[#D1D5DB] bg-white p-3.5 shadow-sm">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#2E6F40]" />
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-[#1F2933] flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-[#2E6F40]" />
                      کارکرد موثر روز
                    </span>
                    <span className="font-mono font-bold text-[#2E6F40] text-xs">
                      {selectedDayRecord?.workedMinutes
                        ? toPersianDigits(formatMinutesToTimeString(selectedDayRecord.workedMinutes))
                        : '۰:۰۰'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {selectedDayRecord && (
                    <div className="space-y-1 mt-2">
                      <div className="flex justify-between text-[10px] text-[#6B7280]">
                        <span>تحقق شیفت موظف:</span>
                        <span className="font-mono text-[#2E6F40] font-bold">
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
                      <div className="h-2 w-full rounded-full bg-[#E5E7EB] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#2E6F40] transition-all duration-500"
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
                    <div className="mt-2 text-[10px] text-[#6B7280] flex items-center justify-between">
                      <span>مدت کسر استراحت ناهار:</span>
                      <span className="font-mono text-[#1F2933]">
                        {toPersianDigits(selectedDayRecord.breakMinutes)} دقیقه
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* 3. Overtime, Deficit & Balance */}
                <div className="relative overflow-hidden rounded-2xl border border-[#D1D5DB] bg-white p-3.5 shadow-sm">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#A68A64]" />
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-[#1F2933] flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-[#A68A64]" />
                      اضافه‌کار و تراز
                    </span>
                    <span className="text-[10px] font-mono text-[#6B7280]">
                      تراز:{' '}
                      {selectedDayRecord
                        ? toPersianDigits(
                            formatMinutesToTimeString(selectedDayRecord.netBalanceMinutes, true)
                          )
                        : '۰'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="rounded-xl bg-[#F7F7F2] p-2 border border-[#D1D5DB]">
                      <span className="text-[10px] text-[#6B7280] block">اضافه کاری</span>
                      <span className="font-bold text-[#2E6F40]">
                        {selectedDayRecord?.overtimeMinutes
                          ? toPersianDigits(
                              formatMinutesToTimeString(selectedDayRecord.overtimeMinutes)
                            )
                          : '۰:۰۰'}
                      </span>
                    </div>
                    <div className="rounded-xl bg-[#F7F7F2] p-2 border border-[#D1D5DB]">
                      <span className="text-[10px] text-[#6B7280] block">کسر کار</span>
                      <span className="font-bold text-[#B91C1C]">
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
                  <div className="rounded-2xl border border-[#D1D5DB] bg-white p-3.5 space-y-2">
                    <span className="text-xs font-bold text-[#D97706] flex items-center gap-1.5">
                      <Coffee className="h-3.5 w-3.5" />
                      مرخصی‌ها و یادداشت روز
                    </span>
                    {selectedDayLeaves.map((l) => (
                      <div
                        key={l.id}
                        className="rounded-xl bg-amber-50 p-2 text-xs border border-amber-200 text-[#1F2933]"
                      >
                        <div className="flex justify-between font-semibold">
                          <span>{l.type === 'hourly' ? 'مرخصی ساعتی' : 'مرخصی روزانه'}</span>
                          <span className="font-mono text-[#D97706]">
                            {toPersianDigits(l.hours)} ساعت
                          </span>
                        </div>
                        {l.reason && <p className="text-[10px] text-[#6B7280] mt-0.5">{l.reason}</p>}
                      </div>
                    ))}
                    {selectedDayRecord?.note && (
                      <p className="text-[11px] text-[#6B7280] bg-[#F7F7F2] p-2 rounded-xl italic border border-[#D1D5DB]">
                        {selectedDayRecord.note}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons at the bottom of the sidebar */}
            <div className="mt-4 pt-3 border-t border-[#D1D5DB] space-y-2">
              <button
                onClick={() => onOpenManualEntryForDate(selectedDate)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#A68A64] hover:bg-[#8F7553] text-white font-bold py-2.5 px-4 text-xs shadow-md shadow-[#A68A64]/20 transition-all active:scale-[0.98]"
              >
                <Edit3 className="h-4 w-4" />
                <span>{selectedDayRecord ? 'ویرایش تردد این روز' : 'ثبت تردد برای این روز'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onOpenLeaveForDate(selectedDate)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#A68A64]/30 bg-[#F5F0E6] hover:bg-[#A68A64]/20 text-[#A68A64] font-semibold py-2 px-3 text-xs transition-all active:scale-[0.98]"
                >
                  <Coffee className="h-3.5 w-3.5" />
                  <span>ثبت مرخصی</span>
                </button>

                {selectedDayRecord && (
                  <button
                    onClick={() => onDeleteRecord(selectedDayRecord.id)}
                    className="flex items-center justify-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[#B91C1C] font-semibold py-2 px-3 text-xs transition-all active:scale-[0.98]"
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

export default PersianCalendar;
