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
import { LiquidGlassCard } from './LiquidGlassCard';
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
    if (parsed) {
      onYearChange(parsed.jy);
      onMonthChange(parsed.jm);
      setSelectedDate(todayStr);
    }
  };

  // Navigate day in Scheduled sidebar
  const handleShiftSelectedDay = (offsetDays: number) => {
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
    const parsed = parseJalaliDate(selectedDate);
    if (parsed) {
      const newD = Math.max(1, Math.min(30, parsed.jd + offsetDays));
      setSelectedDate(formatJalaliDate(parsed.jy, parsed.jm, newD));
    }
  };

  const standardDailyNet = Math.max(
    60,
    (config.requiredDailyMinutes || 510) - (config.defaultBreakMinutes || 30)
  );

  return (
    <LiquidGlassCard className="w-full rounded-[32px] p-4 sm:p-6 shadow-2xl">
      {/* Top Header Bar: Month/Year Selector, Chevrons, Today Button & Month Badges */}
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4 mb-4">
          {/* Left / Title & Selectors */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-accent border border-border shadow-inner">
                <CalendarIcon className="h-5 w-5" />
              </div>

              {/* Month Dropdown */}
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
                  className="liquid-input appearance-none cursor-pointer rounded-2xl px-3.5 py-2 pl-8 text-sm sm:text-base font-bold text-text shadow-inner focus:outline-none"
                >
                  {PERSIAN_MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx + 1} className="bg-bg text-text">
                      {name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Year Dropdown */}
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
                  className="liquid-input appearance-none cursor-pointer rounded-2xl px-3 py-2 pl-7 text-sm sm:text-base font-bold font-mono text-text shadow-inner focus:outline-none"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y} className="bg-bg text-text">
                      {toPersianDigits(y)}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Prev / Next Chevrons Pill */}
            <div className="flex items-center gap-1 rounded-full border border-border bg-surface-2 p-1 shadow-inner backdrop-blur-md">
              <button
                onClick={handlePrevMonth}
                title="ماه قبل"
                aria-label="ماه قبل"
                className="rounded-full p-1.5 text-muted hover:text-text hover:bg-surface transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={handleGoToToday}
                aria-label="برو به امروز"
                className="px-3 py-1 text-xs font-bold text-accent hover:text-text hover:bg-surface rounded-full transition-all"
              >
                امروز
              </button>
              <button
                onClick={handleNextMonth}
                title="ماه بعد"
                aria-label="ماه بعد"
                className="rounded-full p-1.5 text-muted hover:text-text hover:bg-surface transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Month Stats Summary Badges */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5 rounded-full badge-neutral px-3 py-1.5 shrink-0 shadow-sm">
              <Briefcase className="h-3.5 w-3.5 text-accent" />
              <span>کاری:</span>
              <span className="font-bold font-mono text-text">
                {toPersianDigits(monthStatsSummary.workingDaysCount)} روز
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-full badge-danger px-3 py-1.5 shrink-0 shadow-sm">
              <Sun className="h-3.5 w-3.5" />
              <span>تعطیلات رسمی:</span>
              <span className="font-bold font-mono">
                {toPersianDigits(monthStatsSummary.holidaysCount)} روز
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl badge-success px-2.5 py-1.5 shrink-0">
              <Clock className="h-3.5 w-3.5" />
              <span>کارکرد:</span>
              <span className="font-bold font-mono">
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
                        ? 'text-semantic-danger bg-semantic-danger/10 font-bold border border-semantic-danger/25'
                        : isThu && config.thursdayStatus === 'half_day'
                        ? 'text-accent bg-surface-2 font-medium'
                        : 'text-muted bg-surface-2'
                    }`}
                  >
                    <span>{name}</span>
                    {isFri && <span className="block text-[9px] font-normal text-semantic-danger/80">تعطیل</span>}
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
                    role="button"
                    tabIndex={cell.isCurrentMonth ? 0 : -1}
                    aria-label={`روز ${toPersianDigits(cell.jd)} ${PERSIAN_MONTH_NAMES[selectedMonth - 1]}${cell.isHoliday ? '، تعطیل: ' + cell.holidayTitle : ''}${rec ? '، کارکرد: ' + toPersianDigits(formatMinutesToTimeString(rec.workedMinutes)) : ''}${rec?.deficitMinutes ? '، دارای کسری' : ''}${rec?.overtimeMinutes ? '، دارای اضافه کار' : ''}${cell.isToday ? '، امروز' : ''}`}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedDate(cell.dateStr);
                      }
                    }}
                    onDoubleClick={() => onOpenManualEntryForDate(cell.dateStr)}
                    className={`group relative flex flex-col justify-between min-h-[48px] sm:min-h-[90px] p-1.5 sm:p-3 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-200 select-none ${
                      cell.isCurrentMonth ? '' : 'opacity-30 hover:opacity-70'
                    } ${
                      isSelected
                        ? 'liquid-pill-btn-primary rounded-xl sm:rounded-2xl text-accent-contrast shadow-lg ring-2 ring-accent scale-[1.03] z-20'
                        : cell.isToday
                        ? 'rounded-xl sm:rounded-2xl border-2 border-accent bg-accent/15 backdrop-blur-md shadow-md'
                        : cell.isHoliday
                        ? 'rounded-xl sm:rounded-2xl border border-semantic-danger/30 bg-semantic-danger/10 backdrop-blur-md hover:bg-semantic-danger/20 hover:border-semantic-danger/40'
                        : 'rounded-xl sm:rounded-2xl border border-border bg-surface backdrop-blur-md hover:bg-surface-2 hover:border-border-strong'
                    }`}
                  >
                    {/* Top Row: Day Number + Status / Today Badge */}
                    <div className="flex items-start justify-between">
                      <span
                        className={`text-xs sm:text-base font-black font-mono tracking-tight ${
                          isSelected
                            ? 'text-accent-contrast'
                            : cell.isHoliday
                            ? 'text-semantic-danger'
                            : 'text-text'
                        }`}
                      >
                        {toPersianDigits(cell.jd)}
                      </span>

                      {/* Small Quick Status Indicator / Today Ring */}
                      <div className="flex items-center gap-1">
                        {cell.isToday && !isSelected && (
                          <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-accent ring-2 ring-accent/40 animate-pulse shadow-sm" />
                        )}
                        {isWorkingLive && (
                          <span
                            className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-semantic-info ring-2 ring-semantic-info/40 animate-ping shadow-sm"
                            title="در حال کار"
                          />
                        )}
                        {/* Quick hover add button (Desktop only) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenManualEntryForDate(cell.dateStr);
                          }}
                          title="ثبت تردد برای این روز"
                          aria-label={`ثبت تردد برای ${toPersianDigits(cell.jd)} ${PERSIAN_MONTH_NAMES[selectedMonth - 1]}`}
                          className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-lg bg-surface-2 hover:bg-surface text-text"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Mobile Status Dots Indicator */}
                    <div className="flex sm:hidden items-center justify-center gap-1 mt-1">
                      {rec?.checkIn && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
                          title="ورود ثبت شده"
                        />
                      )}
                      {rec?.checkOut && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"
                          title="خروج ثبت شده"
                        />
                      )}
                      {dayLeaves.length > 0 && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
                          title="مرخصی"
                        />
                      )}
                      {cell.isHoliday && !rec?.checkIn && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-rose-400/80 shrink-0"
                          title={cell.holidayTitle || 'تعطیل رسمی'}
                        />
                      )}
                    </div>

                    {/* Middle Row: Holiday Pill or Status Pill (Desktop only) */}
                    <div className="hidden sm:block my-1 space-y-1">
                      {/* Holiday Badge */}
                      {cell.isHoliday && cell.holidayTitle && (
                        <div
                          className="truncate text-[9px] sm:text-[10px] font-semibold px-1 py-0.5 rounded-lg badge-danger"
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
                              ? 'bg-accent-contrast/20 text-accent-contrast font-bold'
                              : 'badge-neutral'
                          }`}
                        >
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            <span>{toPersianDigits(formatMinutesToTimeString(rec.workedMinutes))}</span>
                          </span>
                          {rec.overtimeMinutes > 0 && (
                            <span className="text-semantic-success font-bold text-[8px] sm:text-[9px]">
                              +{toPersianDigits(Math.round(rec.overtimeMinutes / 60))}س
                            </span>
                          )}
                        </div>
                      )}

                      {/* Leave Pill */}
                      {dayLeaves.length > 0 && (
                        <div
                          className="truncate text-[9px] sm:text-[10px] font-semibold px-1 py-0.5 rounded-md badge-warning"
                          title="مرخصی ثبت شده"
                        >
                          🏖️ مرخصی
                        </div>
                      )}
                    </div>

                    {/* Bottom Status Row (Desktop only) */}
                    <div className="hidden sm:flex items-center gap-1 text-[8px] flex-wrap">
                      {rec?.checkIn && (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded font-sans leading-none ${
                            isSelected
                              ? 'bg-accent-contrast/20 text-accent-contrast font-bold'
                              : rec.checkOut
                              ? 'badge-success'
                              : 'badge-info animate-pulse'
                          }`}
                          title={rec.checkOut ? 'حضور کامل' : 'در حال کار'}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isSelected
                                ? 'bg-accent-contrast'
                                : rec.checkOut
                                ? 'bg-semantic-success'
                                : 'bg-semantic-info animate-pulse'
                            }`}
                          />
                          <span>{rec.checkOut ? 'حاضر' : 'در کار'}</span>
                        </span>
                      )}
                      {rec?.deficitMinutes ? (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded font-sans leading-none ${
                            isSelected
                              ? 'bg-accent-contrast/20 text-accent-contrast font-bold'
                              : 'badge-danger'
                          }`}
                          title={`کسر کار: ${toPersianDigits(rec.deficitMinutes)}د`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isSelected ? 'bg-accent-contrast' : 'bg-semantic-danger'
                            }`}
                          />
                          <span>کسری</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile-Only Selected Day Detail Card (Master-Detail Pattern) */}
            <div className="sm:hidden mt-4 p-4 rounded-xl border border-border bg-surface/90 backdrop-blur-md shadow-lg space-y-3 animate-in fade-in duration-200">
              {/* Header: Date + Status Badges */}
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-accent">جزئیات روز انتخاب‌شده</span>
                    {selectedDate === todayStr && (
                      <span className="rounded-full badge-accent text-[9px] font-bold px-1.5 py-0.2">
                        امروز
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-text mt-0.5">
                    {selectedDayWeekday}، {toPersianDigits(selectedDate)}
                  </h4>
                </div>

                {/* Status Pill Badge */}
                <div className="shrink-0">
                  {selectedDayHoliday.isHoliday ? (
                    <span className="badge-danger px-2 py-1 text-[10px] font-bold rounded-lg inline-flex items-center gap-1">
                      <Sun className="h-3 w-3" />
                      <span>{selectedDayHoliday.title || 'تعطیل'}</span>
                    </span>
                  ) : selectedDayRecord?.status === 'in_progress' ? (
                    <span className="badge-info px-2 py-1 text-[10px] font-bold rounded-lg inline-flex items-center gap-1 animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-semantic-info" />
                      <span>در حال کار</span>
                    </span>
                  ) : selectedDayRecord?.checkIn && selectedDayRecord?.checkOut ? (
                    <span className="badge-success px-2 py-1 text-[10px] font-bold rounded-lg inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-semantic-success" />
                      <span>حاضر</span>
                    </span>
                  ) : selectedDayLeaves.length > 0 ? (
                    <span className="badge-warning px-2 py-1 text-[10px] font-bold rounded-lg inline-flex items-center gap-1">
                      <Coffee className="h-3 w-3" />
                      <span>مرخصی</span>
                    </span>
                  ) : (
                    <span className="badge-neutral px-2 py-1 text-[10px] font-bold rounded-lg">
                      بدون تردد
                    </span>
                  )}
                </div>
              </div>

              {/* Entry & Exit Times Grid */}
              <div className="grid grid-cols-2 gap-2 text-center font-mono">
                <div className="rounded-xl bg-surface-2 border border-border p-2">
                  <span className="text-[10px] text-muted block mb-0.5 font-sans">ساعت ورود</span>
                  <span className="text-xs sm:text-sm font-bold text-semantic-success">
                    {selectedDayRecord?.checkIn
                      ? toPersianDigits(selectedDayRecord.checkIn)
                      : 'ثبت‌نشده'}
                  </span>
                </div>
                <div className="rounded-xl bg-surface-2 border border-border p-2">
                  <span className="text-[10px] text-muted block mb-0.5 font-sans">ساعت خروج</span>
                  <span className="text-xs sm:text-sm font-bold text-semantic-danger">
                    {selectedDayRecord?.checkOut
                      ? toPersianDigits(selectedDayRecord.checkOut)
                      : selectedDayRecord?.checkIn
                      ? 'در حال کار'
                      : 'ثبت‌نشده'}
                  </span>
                </div>
              </div>

              {/* Key Metrics Row (if record exists) */}
              {selectedDayRecord && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-surface-2/60 p-2 rounded-xl border border-border">
                  <div>
                    <span className="text-[9px] text-muted block font-sans">کارکرد مفید</span>
                    <span className="font-bold text-text">
                      {toPersianDigits(formatMinutesToTimeString(selectedDayRecord.workedMinutes))}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted block font-sans">اضافه‌کار</span>
                    <span className="font-bold text-semantic-success">
                      {selectedDayRecord.overtimeMinutes > 0
                        ? `+${toPersianDigits(formatMinutesToTimeString(selectedDayRecord.overtimeMinutes))}`
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted block font-sans">کسر کار</span>
                    <span className="font-bold text-semantic-danger">
                      {selectedDayRecord.deficitMinutes > 0
                        ? `-${toPersianDigits(formatMinutesToTimeString(selectedDayRecord.deficitMinutes))}`
                        : '—'}
                    </span>
                  </div>
                </div>
              )}

              {/* Leaves & Notes (if any) */}
              {selectedDayLeaves.length > 0 && (
                <div className="space-y-1 pt-1">
                  {selectedDayLeaves.map((l) => (
                    <div key={l.id} className="rounded-lg bg-surface-2 p-2 text-xs border border-border flex items-center justify-between">
                      <span className="text-semantic-warning flex items-center gap-1 font-semibold text-[11px]">
                        <Coffee className="h-3 w-3" />
                        <span>{l.type === 'hourly' ? 'مرخصی ساعتی' : 'مرخصی روزانه'}</span>
                      </span>
                      <span className="font-mono text-muted text-[10px]">
                        {toPersianDigits(l.hours)} ساعت
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {selectedDayRecord?.note && (
                <p className="text-[10px] text-muted bg-surface-2 p-2 rounded-lg italic border border-border">
                  {selectedDayRecord.note}
                </p>
              )}

              {/* Quick Action Buttons */}
              <div className="pt-2 border-t border-border flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenManualEntryForDate(selectedDate)}
                  className="liquid-pill-btn-primary flex-1 py-2 px-3 text-xs font-bold shadow-md flex items-center justify-center gap-1"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>{selectedDayRecord ? 'ویرایش تردد' : 'ثبت تردد'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenLeaveForDate(selectedDate)}
                  className="liquid-pill-btn py-2 px-3 text-xs text-semantic-warning flex items-center justify-center gap-1"
                >
                  <Coffee className="h-3.5 w-3.5" />
                  <span>مرخصی</span>
                </button>
                {selectedDayRecord && (
                  <button
                    type="button"
                    onClick={() => onDeleteRecord(selectedDayRecord.id)}
                    aria-label="حذف تردد این روز"
                    className="liquid-pill-btn-danger p-2 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: "Scheduled" / روز و رویدادهای انتخاب شده (Desktop / Tablet) */}
          <div className="hidden sm:flex lg:col-span-4 xl:col-span-4 flex-col justify-between rounded-[28px] liquid-glass-subtle p-4 sm:p-5 border border-[var(--border)] shadow-xl">
            {/* Header: Scheduled + Date + Day Chevrons */}
            <div>
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs uppercase tracking-wider font-bold text-accent">
                      برنامه و کارکرد
                    </span>
                    {selectedDate === todayStr && (
                      <span className="rounded-full badge-accent text-[10px] font-bold px-2 py-0.2">
                        امروز
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-text mt-0.5">
                    {selectedDayWeekday}، {toPersianDigits(selectedDate)}
                  </h3>
                </div>

                {/* Day navigation arrows */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleShiftSelectedDay(-1)}
                    title="روز قبل"
                    aria-label="روز قبل"
                    className="p-1.5 rounded-full border border-border bg-surface-2 text-muted hover:text-text hover:bg-surface transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleShiftSelectedDay(1)}
                    title="روز بعد"
                    aria-label="روز بعد"
                    className="p-1.5 rounded-full border border-border bg-surface-2 text-muted hover:text-text hover:bg-surface transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Holiday Banner if selected day is holiday */}
              {selectedDayHoliday.isHoliday && (
                <div className="mb-4 rounded-2xl border border-semantic-danger/35 bg-semantic-danger/10 p-3 text-semantic-danger">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-semantic-danger/20 text-semantic-danger border border-semantic-danger/30">
                      <Sun className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-semantic-danger block">تعطیل رسمی تقویم</span>
                      <span className="text-xs sm:text-sm font-bold text-text">{selectedDayHoliday.title}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cards matching the color top bars */}
              <div className="space-y-3">
                {/* 1. Warm Wood Bar: Check-In & Check-Out Times */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-3.5 transition-all">
                  <div className="absolute top-0 inset-x-0 h-1 bg-accent" />
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-text flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-accent" />
                      تردد و ساعات حضور
                    </span>
                    <span className="text-[10px] text-muted font-mono">
                      {selectedDayRecord?.status === 'in_progress' ? 'حضور زنده' : 'ثبت ساعت'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono text-center">
                    <div className="rounded-xl bg-surface-2 border border-border p-2">
                      <span className="text-[10px] text-muted block mb-0.5">ساعت ورود</span>
                      <span className="text-sm sm:text-base font-bold text-semantic-success">
                        {selectedDayRecord?.checkIn
                          ? toPersianDigits(selectedDayRecord.checkIn)
                          : 'ثبت‌نشده'}
                      </span>
                    </div>
                    <div className="rounded-xl bg-surface-2 border border-border p-2">
                      <span className="text-[10px] text-muted block mb-0.5">ساعت خروج</span>
                      <span className="text-sm sm:text-base font-bold text-semantic-danger">
                        {selectedDayRecord?.checkOut
                          ? toPersianDigits(selectedDayRecord.checkOut)
                          : selectedDayRecord?.checkIn
                          ? 'در حال کار'
                          : 'ثبت‌نشده'}
                      </span>
                    </div>
                  </div>

                  {selectedDayRecord?.targetCheckOut && !selectedDayRecord?.checkOut && (
                    <div className="mt-2 text-[11px] text-muted flex items-center justify-between bg-surface-2 px-2 py-1 rounded-xl border border-border">
                      <span>خروج پیشنهادی استاندارد:</span>
                      <span className="font-mono text-accent font-bold">
                        {toPersianDigits(selectedDayRecord.targetCheckOut)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Success Bar: Effective Worked Hours & Daily Progress */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-3.5 transition-all">
                  <div className="absolute top-0 inset-x-0 h-1 bg-semantic-success" />
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-text flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-semantic-success" />
                      کارکرد موثر روز
                    </span>
                    <span className="font-mono font-bold text-semantic-success text-xs">
                      {selectedDayRecord?.workedMinutes
                        ? toPersianDigits(formatMinutesToTimeString(selectedDayRecord.workedMinutes))
                        : '۰:۰۰'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {selectedDayRecord && (
                    <div className="space-y-1 mt-2">
                      <div className="flex justify-between text-[10px] text-muted">
                        <span>تحقق شیفت موظف:</span>
                        <span className="font-mono text-semantic-success">
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
                      <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden border border-border">
                        <div
                          className="h-full rounded-full bg-semantic-success transition-all duration-500"
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
                    <div className="mt-2 text-[10px] text-muted flex items-center justify-between">
                      <span>مدت کسر استراحت ناهار:</span>
                      <span className="font-mono text-text">
                        {toPersianDigits(selectedDayRecord.breakMinutes)} دقیقه
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* 3. Info Bar: Overtime, Deficit & Balance */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-3.5 transition-all">
                  <div className="absolute top-0 inset-x-0 h-1 bg-semantic-info" />
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-text flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-semantic-info" />
                      اضافه‌کار و تراز
                    </span>
                    <span className="text-[10px] font-mono text-muted">
                      تراز:{' '}
                      {selectedDayRecord
                        ? toPersianDigits(
                            formatMinutesToTimeString(selectedDayRecord.netBalanceMinutes, true)
                          )
                        : '۰'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="rounded-xl bg-surface-2 p-2 border border-border">
                      <span className="text-[10px] text-muted block">اضافه کاری</span>
                      <span className="font-bold text-semantic-info">
                        {selectedDayRecord?.overtimeMinutes
                          ? toPersianDigits(
                              formatMinutesToTimeString(selectedDayRecord.overtimeMinutes)
                            )
                          : '۰:۰۰'}
                      </span>
                    </div>
                    <div className="rounded-xl bg-surface-2 p-2 border border-border">
                      <span className="text-[10px] text-muted block">کسر کار</span>
                      <span className="font-bold text-semantic-danger">
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
                  <div className="rounded-2xl border border-border bg-surface p-3.5 space-y-2">
                    <span className="text-xs font-bold text-semantic-warning flex items-center gap-1.5">
                      <Coffee className="h-3.5 w-3.5" />
                      مرخصی‌ها و یادداشت روز
                    </span>
                    {selectedDayLeaves.map((l) => (
                      <div
                        key={l.id}
                        className="rounded-xl bg-surface-2 p-2 text-xs border border-border text-text"
                      >
                        <div className="flex justify-between font-semibold">
                          <span>{l.type === 'hourly' ? 'مرخصی ساعتی' : 'مرخصی روزانه'}</span>
                          <span className="font-mono text-semantic-warning">
                            {toPersianDigits(l.hours)} ساعت
                          </span>
                        </div>
                        {l.reason && <p className="text-[10px] text-muted mt-0.5">{l.reason}</p>}
                      </div>
                    ))}
                    {selectedDayRecord?.note && (
                      <p className="text-[11px] text-text bg-surface-2 p-2 rounded-xl italic border border-border">
                        {selectedDayRecord.note}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons at the bottom of the sidebar */}
            <div className="mt-4 pt-3 border-t border-border space-y-2">
              <button
                onClick={() => onOpenManualEntryForDate(selectedDate)}
                className="liquid-pill-btn-primary w-full py-2.5 px-4 text-xs font-bold shadow-lg"
              >
                <Edit3 className="h-4 w-4 ml-1.5" />
                <span>{selectedDayRecord ? 'ویرایش تردد این روز' : 'ثبت تردد برای این روز'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onOpenLeaveForDate(selectedDate)}
                  className="liquid-pill-btn py-2 px-3 text-xs text-semantic-warning"
                >
                  <Coffee className="h-3.5 w-3.5 ml-1" />
                  <span>ثبت مرخصی</span>
                </button>

                {selectedDayRecord && (
                  <button
                    onClick={() => onDeleteRecord(selectedDayRecord.id)}
                    className="liquid-pill-btn-danger py-2 px-3 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 ml-1" />
                    <span>حذف تردد</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </LiquidGlassCard>
  );
};
