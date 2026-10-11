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

  const availableYears = [1402, 1403, 1404, 1405, 1406];

  // Records and leaves maps
  const recordsByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    records.forEach((r) => map.set(r.date, r));
    return map;
  }, [records]);

  const leavesByDate = useMemo(() => {
    const map = new Map<string, LeaveRecord[]>();
    leaves.forEach((l) => {
      const existing = map.get(l.date) || [];
      map.set(l.date, [...existing, l]);
    });
    return map;
  }, [leaves]);

  // Calendar cells
  const calendarCells = useMemo(() => {
    return getJalaliMonthGrid(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // Month Statistics Summary
  const monthStatsSummary = useMemo(() => {
    let workingDaysCount = 0;
    let holidaysCount = 0;
    let totalWorkedMinutes = 0;

    calendarCells.forEach((c) => {
      if (!c.isCurrentMonth) return;
      if (c.isHoliday) {
        holidaysCount++;
      } else {
        workingDaysCount++;
      }
      const rec = recordsByDate.get(c.dateStr);
      if (rec && rec.workedMinutes) {
        totalWorkedMinutes += rec.workedMinutes;
      }
    });

    return {
      workingDaysCount,
      holidaysCount,
      totalWorkedHours: (totalWorkedMinutes / 60).toFixed(1),
    };
  }, [calendarCells, recordsByDate]);

  // Selected Day Details
  const selectedDayCell = useMemo(() => {
    return calendarCells.find((c) => c.dateStr === selectedDate) || {
      jy: selectedYear,
      jm: selectedMonth,
      jd: 1,
      dateStr: selectedDate,
      isCurrentMonth: true,
      isToday: selectedDate === todayStr,
      isHoliday: false,
    };
  }, [calendarCells, selectedDate, selectedYear, selectedMonth, todayStr]);

  const selectedDayRecord = recordsByDate.get(selectedDate);
  const selectedDayLeaves = leavesByDate.get(selectedDate) || [];
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
      <div className="rounded-2xl border border-white/10 bg-[#09090d] p-5 sm:p-7 text-white transition-all">
        {/* Top Header Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4 mb-5">
          {/* Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-[#eca8d6]">
                <CalendarIcon className="h-4 w-4" />
              </div>

              {/* Month Dropdown */}
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
                  className="rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white focus:border-[#eca8d6] focus:outline-none cursor-pointer"
                >
                  {PERSIAN_MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx + 1} className="bg-[#09090d] text-white">
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
                  className="rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs sm:text-sm font-mono text-white/70 focus:border-[#eca8d6] focus:outline-none cursor-pointer"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y} className="bg-[#09090d] text-white">
                      {toPersianDigits(y)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prev / Next Chevrons Pill */}
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/60 p-0.5">
              <button
                onClick={handleNextMonth}
                title="ماه بعد"
                className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.04] transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={handleGoToToday}
                className="px-2.5 py-0.5 text-xs font-mono text-white/70 hover:text-white hover:bg-white/[0.04] rounded-lg transition-all"
              >
                امروز
              </button>
              <button
                onClick={handlePrevMonth}
                title="ماه قبل"
                className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.04] transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Month Stats Summary Badges */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-mono">
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1 text-white/60 shrink-0">
              <Briefcase className="h-3.5 w-3.5 text-[#eca8d6]" />
              <span>کاری:</span>
              <strong className="text-white">{toPersianDigits(monthStatsSummary.workingDaysCount)} روز</strong>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-rose-300 shrink-0">
              <Sun className="h-3.5 w-3.5 text-rose-400" />
              <span>تعطیلات:</span>
              <strong>{toPersianDigits(monthStatsSummary.holidaysCount)} روز</strong>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-300 shrink-0">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
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
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center text-xs font-mono">
              {PERSIAN_WEEKDAY_NAMES.map((name, i) => {
                const isFri = i === 6;
                const isThu = i === 5;
                return (
                  <div
                    key={name}
                    className={`py-2 px-1 rounded-xl transition-colors ${
                      isFri
                        ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                        : isThu
                        ? 'text-white/70 bg-white/[0.04]'
                        : 'text-white/40 bg-white/[0.02]'
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
                    className={`group relative flex flex-col justify-between min-h-[82px] sm:min-h-[96px] p-2.5 rounded-2xl cursor-pointer transition-all duration-200 select-none ${
                      cell.isCurrentMonth ? '' : 'opacity-25 hover:opacity-50'
                    } ${
                      isSelected
                        ? 'bg-white text-black font-semibold shadow-xl ring-2 ring-white/40 scale-[1.02] z-20'
                        : cell.isToday
                        ? 'bg-[#eca8d6]/10 border-2 border-[#eca8d6]'
                        : cell.isHoliday
                        ? 'bg-rose-500/[0.04] border border-rose-500/20 hover:bg-rose-500/[0.08]'
                        : 'bg-white/[0.02] border border-white/10 hover:border-white/25 hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Top Row: Day Number */}
                    <div className="flex items-start justify-between">
                      <span
                        className={`text-sm sm:text-base font-light font-mono ${
                          isSelected
                            ? 'text-black font-bold'
                            : cell.isHoliday
                            ? 'text-rose-400 font-medium'
                            : 'text-white'
                        }`}
                      >
                        {toPersianDigits(cell.jd)}
                      </span>

                      <div className="flex items-center gap-1">
                        {cell.isToday && !isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#eca8d6]" />
                        )}
                        {isWorkingLive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenManualEntryForDate(cell.dateStr);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-white/50 hover:text-white"
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
                            isSelected ? 'bg-black/10 text-rose-700' : 'bg-rose-500/15 text-rose-300'
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
                              ? 'bg-black/10 text-black font-bold'
                              : 'bg-white/[0.04] text-[#eca8d6]'
                          }`}
                        >
                          <span>{toPersianDigits(formatMinutesToTimeString(rec.workedMinutes))}</span>
                          {rec.overtimeMinutes > 0 && (
                            <span className={isSelected ? 'text-emerald-700' : 'text-emerald-400'}>
                              +{toPersianDigits(Math.round(rec.overtimeMinutes / 60))}س
                            </span>
                          )}
                        </div>
                      )}

                      {dayLeaves.length > 0 && (
                        <div
                          className={`truncate text-[9px] font-medium px-1 py-0.5 rounded-md ${
                            isSelected ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/15 text-amber-300'
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
                              ? 'bg-black'
                              : rec.checkOut
                              ? 'bg-emerald-400'
                              : 'bg-[#eca8d6] animate-pulse'
                          }`}
                        />
                      )}
                      {rec?.delayMinutes ? (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-rose-600' : 'bg-rose-400'}`} />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Scheduled Day Details */}
          <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl border border-white/10 bg-black/60 p-4 sm:p-5">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#eca8d6]">
                    <span>SCHEDULED NODE</span>
                    {selectedDate === todayStr && (
                      <span className="rounded-full bg-white text-black text-[9px] font-bold px-2 py-0.2">
                        امروز
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-white mt-0.5">
                    {selectedDayWeekday}، {toPersianDigits(selectedDate)}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleShiftSelectedDay(-1)}
                    className="p-1.5 rounded-xl border border-white/10 bg-white/[0.02] text-white/60 hover:text-white transition-all"
                    title="روز قبل"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleShiftSelectedDay(1)}
                    className="p-1.5 rounded-xl border border-white/10 bg-white/[0.02] text-white/60 hover:text-white transition-all"
                    title="روز بعد"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Holiday Alert */}
              {selectedDayCell.isHoliday && (
                <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300 font-mono flex items-center gap-2">
                  <Sun className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>
                    تعطیل رسمی:{' '}
                    {'holidayTitle' in selectedDayCell && selectedDayCell.holidayTitle
                      ? selectedDayCell.holidayTitle
                      : 'تعطیل هفتگی'}
                  </span>
                </div>
              )}

              {/* Day Punch Details */}
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                  <div className="flex justify-between text-white/60">
                    <span>وضعیت تردد:</span>
                    <span className="text-white font-medium">
                      {selectedDayRecord?.checkIn
                        ? selectedDayRecord.checkOut
                          ? 'حاضر و تکمیل'
                          : 'در حال کار'
                        : selectedDayLeaves.length > 0
                        ? 'مرخصی ثبت‌شده'
                        : selectedDayCell.isHoliday
                        ? 'تعطیل'
                        : 'ثبت‌نشده'}
                    </span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>ورود / خروج:</span>
                    <span className="text-white">
                      {selectedDayRecord?.checkIn ? toPersianDigits(selectedDayRecord.checkIn) : '—'} /{' '}
                      {selectedDayRecord?.checkOut ? toPersianDigits(selectedDayRecord.checkOut) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>کارکرد مفید:</span>
                    <span className="text-[#eca8d6] font-bold">
                      {selectedDayRecord?.workedMinutes
                        ? toPersianDigits(formatMinutesToTimeString(selectedDayRecord.workedMinutes))
                        : '۰ دقیقه'}
                    </span>
                  </div>
                  {selectedDayRecord?.overtimeMinutes ? (
                    <div className="flex justify-between text-emerald-400">
                      <span>اضافه‌کاری:</span>
                      <span>+{toPersianDigits(selectedDayRecord.overtimeMinutes)} دقیقه</span>
                    </div>
                  ) : null}
                  {selectedDayRecord?.deficitMinutes ? (
                    <div className="flex justify-between text-rose-400">
                      <span>کسر کار:</span>
                      <span>-{toPersianDigits(selectedDayRecord.deficitMinutes)} دقیقه</span>
                    </div>
                  ) : null}
                </div>

                {/* Leaves in this day */}
                {selectedDayLeaves.length > 0 && (
                  <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5">
                    <div className="text-amber-300 font-semibold text-[11px]">مرخصی‌های ثبت‌شده این روز:</div>
                    {selectedDayLeaves.map((l) => (
                      <div key={l.id} className="text-[11px] text-white/70 flex justify-between">
                        <span>{l.type === 'hourly' ? 'ساعتی' : 'روزانه'}: {l.reason || '—'}</span>
                        <span className="text-amber-300">{toPersianDigits(l.hours)} ساعت</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-2 pt-4 mt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => onOpenManualEntryForDate(selectedDate)}
                className="flex-1 py-2 rounded-xl text-xs font-mono font-medium bg-[#eca8d6] hover:bg-[#f3c2e4] text-black transition-all"
              >
                {selectedDayRecord ? 'ویرایش تردد' : 'ثبت تردد این روز'}
              </button>
              <button
                type="button"
                onClick={() => onOpenLeaveForDate(selectedDate)}
                className="px-3 py-2 rounded-xl text-xs font-mono border border-white/15 text-white/70 hover:text-white transition-all"
              >
                مرخصی
              </button>
              {selectedDayRecord && (
                <button
                  type="button"
                  onClick={() => onDeleteRecord(selectedDayRecord.id)}
                  className="px-2.5 py-2 rounded-xl text-xs font-mono border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="حذف تردد"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
