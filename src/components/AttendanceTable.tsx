import React, { useState, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Edit2,
  Trash2,
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  MinusCircle,
  LayoutGrid,
  Table as TableIcon,
  Coffee,
  TrendingUp,
  TrendingDown,
  Minus,
  CalendarOff,
} from 'lucide-react';
import { AttendanceRecord, ShiftConfig } from '../types';
import { LiquidGlassCard } from './LiquidGlassCard';
import {
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEKDAY_NAMES,
  toPersianDigits,
  formatMinutesToTimeString,
  formatMinutesToPersianReadable,
  getTodayJalaliString,
} from '../utils/jalali';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  selectedYear: number;
  selectedMonth: number;
  config: ShiftConfig;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: string) => void;
  onAddNewForDate: (date: string) => void;
  onExportExcel: () => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  selectedYear,
  selectedMonth,
  config: _config,
  onYearChange,
  onMonthChange,
  onEditRecord,
  onDeleteRecord,
  onAddNewForDate,
  onExportExcel,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, _setSearchQuery] = useState<string>('');
  const todayStr = getTodayJalaliString();

  // 1. Reactive matchMedia listener for mobile card/table view switching
  const [userViewOverride, setUserViewOverride] = useState<'cards' | 'table' | null>(null);
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateMatches = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobileScreen(e.matches);
    };

    updateMatches(mediaQuery);
    const listener = (e: MediaQueryListEvent) => updateMatches(e);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const activeViewMode = userViewOverride ?? (isMobileScreen ? 'cards' : 'table');

  // 2. Horizontal scroll guide shadows for table view
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);

  const checkTableScroll = () => {
    const el = tableScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const currentScroll = Math.abs(el.scrollLeft);
    setCanScrollLeft(maxScroll > 10 && currentScroll < maxScroll - 4);
    setCanScrollRight(currentScroll > 4);
  };

  const monthPrefix = `${selectedYear}/${selectedMonth < 10 ? '0' + selectedMonth : selectedMonth}/`;

  // Filter records for this month
  const monthRecords = records
    .filter((r) => r.date.startsWith(monthPrefix))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Apply quick filters
  const filteredRecords = monthRecords.filter((r) => {
    if (searchQuery.trim()) {
      const matchNote = r.note && r.note.includes(searchQuery.trim());
      const matchDate = r.date.includes(searchQuery.trim());
      if (!matchNote && !matchDate) return false;
    }

    if (filterType === 'delays') {
      return r.delayMinutes > 0 || r.earlyLeaveMinutes > 0;
    }
    if (filterType === 'overtime') {
      return r.overtimeMinutes > 0 || r.holidayOvertimeMinutes > 0;
    }
    if (filterType === 'thursdays') {
      return r.dayOfWeek === 5;
    }
    if (filterType === 'leaves') {
      return r.status === 'leave';
    }
    if (filterType === 'holidays') {
      return r.isHoliday;
    }
    return true;
  });

  useEffect(() => {
    checkTableScroll();
    window.addEventListener('resize', checkTableScroll);
    return () => window.removeEventListener('resize', checkTableScroll);
  }, [filteredRecords.length, activeViewMode]);

  // Calculate visible totals for both table and cards footer
  const visibleTotals = filteredRecords.reduce(
    (acc, r) => {
      acc.worked += r.workedMinutes;
      acc.delay += r.delayMinutes;
      acc.early += r.earlyLeaveMinutes;
      acc.overtime += r.overtimeMinutes + r.holidayOvertimeMinutes;
      acc.deficit += r.deficitMinutes;
      acc.balance += r.netBalanceMinutes;
      return acc;
    },
    { worked: 0, delay: 0, early: 0, overtime: 0, deficit: 0, balance: 0 }
  );

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

  const handlePrint = () => {
    window.print();
  };

  const monthName = PERSIAN_MONTH_NAMES[selectedMonth - 1] || '';

  // Render distinct status badge with text and icon (no color-only semantics)
  const renderStatusBadge = (r: AttendanceRecord) => {
    const todayStr = getTodayJalaliString();
    const isIncompletePastDay = Boolean(r.checkIn && !r.checkOut && r.date < todayStr);

    if (isIncompletePastDay) {
      return (
        <span
          className="inline-flex items-center gap-1 rounded-full badge-warning border border-[var(--semantic-warning)]/60 px-2 py-0.5 text-xs font-bold text-[var(--semantic-warning)]"
          title="تردد ناقص: ورود ثبت شده اما خروج ثبت نشده است. لطفاً برای تصحیح، ردیف را ویرایش کنید."
        >
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>ناقص</span>
        </span>
      );
    }

    if (r.status === 'present') {
      if (r.dayOfWeek === 5) {
        return (
          <span className="inline-flex items-center gap-1 rounded-full badge-info px-2 py-0.5 text-xs font-semibold">
            <Clock className="h-3 w-3 shrink-0" />
            <span>پنج‌شنبه نیمه‌وقت</span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 rounded-full badge-success px-2 py-0.5 text-xs font-semibold">
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          <span>حاضر عادی</span>
        </span>
      );
    }
    if (r.status === 'in_progress') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full badge-accent px-2 py-0.5 text-xs font-semibold">
          <Clock className="h-3 w-3 animate-pulse shrink-0" />
          <span>در حال کار</span>
        </span>
      );
    }
    if (r.status === 'leave') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full badge-warning px-2 py-0.5 text-xs font-semibold">
          <Coffee className="h-3 w-3 shrink-0" />
          <span>مرخصی</span>
        </span>
      );
    }
    if (r.status === 'absent') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full badge-danger px-2 py-0.5 text-xs font-semibold">
          <MinusCircle className="h-3 w-3 shrink-0" />
          <span>غایب / بدون ثبت</span>
        </span>
      );
    }
    if (r.isHoliday || r.status === 'holiday' || r.status === 'weekend') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full badge-danger px-2 py-0.5 text-xs font-semibold">
          <CalendarOff className="h-3 w-3 shrink-0" />
          <span>{r.holidayTitle || (r.dayOfWeek === 6 ? 'جمعه (تعطیل)' : 'تعطیل رسمی')}</span>
        </span>
      );
    }
    if (r.dayOfWeek === 5) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full badge-info px-2 py-0.5 text-xs font-semibold">
          <Clock className="h-3 w-3 shrink-0" />
          <span>پنج‌شنبه نیمه‌وقت (بدون ثبت)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full badge-neutral px-2 py-0.5 text-xs font-medium">
        <Minus className="h-3 w-3 shrink-0" />
        <span>بدون ثبت</span>
      </span>
    );
  };

  // Render net balance with <bdi dir="ltr">, sign, and icon
  const renderBalance = (balanceMins: number) => {
    if (balanceMins > 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md badge-success px-1.5 py-0.5 text-xs font-bold font-mono">
          <TrendingUp className="h-3 w-3 shrink-0" />
          <bdi dir="ltr">+{toPersianDigits(formatMinutesToTimeString(balanceMins))}</bdi>
        </span>
      );
    }
    if (balanceMins < 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md badge-danger px-1.5 py-0.5 text-xs font-bold font-mono">
          <TrendingDown className="h-3 w-3 shrink-0" />
          <bdi dir="ltr">-{toPersianDigits(formatMinutesToTimeString(Math.abs(balanceMins)))}</bdi>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-muted font-medium text-xs font-mono">
        <Minus className="h-3 w-3 shrink-0" />
        <bdi dir="ltr">۰</bdi>
      </span>
    );
  };

  return (
    <LiquidGlassCard className="rounded-[32px] p-4 sm:p-6 shadow-2xl">
      {/* Table Header Controls */}
      <div className="flex flex-col gap-3.5 border-b border-[var(--border)] pb-4">
        {/* Print-Only Title */}
        <div className="hidden print:block text-center border-b border-black pb-2 mb-2">
          <h2 className="text-base font-bold text-black">
            گزارش تردد ماهانه: {monthName} {toPersianDigits(selectedYear)}
          </h2>
        </div>

        {/* Row 1: Month/Year Nav + View Switcher + Record Count */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          {/* Month & Year Selectors */}
          <div className="flex items-center rounded-full bg-[var(--surface-2)] border border-[var(--border)] backdrop-blur-md p-1 shadow-inner">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-full text-muted hover:text-text hover:bg-[var(--surface)] transition-colors"
              title="ماه قبل"
              aria-label="ماه قبل"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Month Select */}
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
              className="bg-transparent px-2.5 py-1 text-xs sm:text-sm font-bold text-text focus:outline-none cursor-pointer"
              aria-label="انتخاب ماه"
            >
              {PERSIAN_MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1} className="bg-bg text-text">
                  {name}
                </option>
              ))}
            </select>

            {/* Year Select */}
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
              className="bg-transparent px-1.5 py-1 text-xs sm:text-sm font-bold text-accent focus:outline-none cursor-pointer font-mono"
              aria-label="انتخاب سال"
            >
              {[1402, 1403, 1404, 1405, 1406].map((yr) => (
                <option key={yr} value={yr} className="bg-bg text-text">
                  {toPersianDigits(yr)}
                </option>
              ))}
            </select>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-full text-muted hover:text-text hover:bg-surface-2 transition-colors"
              title="ماه بعد"
              aria-label="ماه بعد"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Right side: View Switcher (Cards vs Table) & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* View Mode Switcher Button */}
            <button
              onClick={() => setUserViewOverride(activeViewMode === 'cards' ? 'table' : 'cards')}
              className="liquid-pill-btn px-3 py-1.5 text-xs flex items-center"
              title="تغییر نحوه نمایش"
              aria-label="تغییر نمای نمایش به کارتی یا جدولی"
            >
              {activeViewMode === 'cards' ? (
                <>
                  <TableIcon className="h-3.5 w-3.5 text-accent ml-1.5" />
                  <span className="text-[11px] sm:text-xs">نمای جدولی</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="h-3.5 w-3.5 text-accent ml-1.5" />
                  <span className="text-[11px] sm:text-xs">نمای کارتی</span>
                </>
              )}
            </button>

            {/* Export Excel */}
            <button
              onClick={onExportExcel}
              className="liquid-pill-btn px-3 py-1.5 text-xs text-semantic-success shadow-sm"
              title="دانلود اکسل"
              aria-label="خروجی فایل اکسل"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 ml-1" />
              <span className="hidden xs:inline text-[11px] sm:text-xs">اکسل</span>
            </button>

            {/* Print / PDF */}
            <button
              onClick={handlePrint}
              className="liquid-pill-btn px-3 py-1.5 text-xs"
              title="چاپ یا ذخیره PDF"
              aria-label="چاپ گزارش"
            >
              <Printer className="h-3.5 w-3.5 ml-1" />
              <span className="hidden sm:inline text-xs">چاپ</span>
            </button>
          </div>
        </div>

        {/* Row 2: Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full text-xs no-scrollbar print:hidden">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-full shrink-0 transition-all font-semibold ${
              filterType === 'all'
                ? 'liquid-pill-btn-primary shadow-md'
                : 'liquid-pill-btn text-muted'
            }`}
          >
            همه روزها ({toPersianDigits(monthRecords.length)})
          </button>
          <button
            onClick={() => setFilterType('delays')}
            className={`px-3.5 py-1.5 rounded-full shrink-0 transition-all font-semibold ${
              filterType === 'delays'
                ? 'badge-danger shadow-sm'
                : 'liquid-pill-btn text-muted hover:text-semantic-danger'
            }`}
          >
            تاخیر / تعجیل
          </button>
          <button
            onClick={() => setFilterType('overtime')}
            className={`px-3.5 py-1.5 rounded-full shrink-0 transition-all font-semibold ${
              filterType === 'overtime'
                ? 'badge-info shadow-sm'
                : 'liquid-pill-btn text-muted hover:text-semantic-info'
            }`}
          >
            اضافه کاری
          </button>
          <button
            onClick={() => setFilterType('thursdays')}
            className={`px-3.5 py-1.5 rounded-full shrink-0 transition-all font-semibold ${
              filterType === 'thursdays'
                ? 'badge-accent shadow-sm'
                : 'liquid-pill-btn text-muted hover:text-accent'
            }`}
          >
            پنج‌شنبه‌ها
          </button>
          <button
            onClick={() => setFilterType('leaves')}
            className={`px-3.5 py-1.5 rounded-full shrink-0 transition-all font-semibold ${
              filterType === 'leaves'
                ? 'badge-warning shadow-sm'
                : 'liquid-pill-btn text-muted hover:text-semantic-warning'
            }`}
          >
            مرخصی‌ها
          </button>
        </div>
      </div>

      {/* 5. Empty State (ماه بدون داده با پیام فارسی و دکمه ثبت تردد) */}
      {monthRecords.length === 0 ? (
        <div className="my-8 py-12 px-4 text-center bg-surface-2 backdrop-blur-md rounded-2xl border border-border flex flex-col items-center justify-center gap-3">
          <div className="rounded-2xl bg-surface p-3 text-accent border border-border">
            <Calendar className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-text">
              هیچ ترددی برای {monthName} {toPersianDigits(selectedYear)} ثبت نشده است
            </h4>
            <p className="text-xs text-muted">
              می‌توانید با دکمه زیر تردد اولین روز کاری این ماه را به سادگی ثبت کنید.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onAddNewForDate(`${monthPrefix}01`)}
            className="liquid-pill-btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-bold shadow-md active:scale-95 transition-all mt-1 print:hidden"
          >
            <Plus className="h-4 w-4" />
            <span>ثبت تردد</span>
          </button>
        </div>
      ) : (
        <>
          {/* VIEW 1: Cards View */}
          {activeViewMode === 'cards' && (
            <div className="mt-4 space-y-3">
              {filteredRecords.length === 0 ? (
                <div className="py-10 text-center text-muted bg-surface-2 backdrop-blur-md rounded-2xl border border-border">
                  <Calendar className="h-8 w-8 text-muted mx-auto mb-2 opacity-60" />
                  <span className="text-xs">هیچ ترددی مطابق این فیلتر یافت نشد.</span>
                </div>
              ) : (
                filteredRecords.map((r) => {
                  const weekdayName = PERSIAN_WEEKDAY_NAMES[r.dayOfWeek] || '';
                  const isLate = r.delayMinutes > 0;
                  const hasOT = r.overtimeMinutes > 0 || r.holidayOvertimeMinutes > 0;
                  const isIncompletePastDay = Boolean(r.checkIn && !r.checkOut && r.date < todayStr);

                  return (
                    <div
                      key={r.id}
                      className={`rounded-2xl border p-3.5 transition-all shadow-md backdrop-blur-md ${
                        isIncompletePastDay
                          ? 'border-semantic-warning/60 bg-semantic-warning/10'
                          : r.isHoliday
                          ? 'border-semantic-danger/35 bg-semantic-danger/10'
                          : 'border-border bg-surface hover:bg-surface-2 hover:border-border-strong'
                      }`}
                    >
                      {/* Top row: Date + Weekday + Status Badge */}
                      <div className="flex items-center justify-between border-b border-border pb-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold ${
                              r.dayOfWeek === 6
                                ? 'text-semantic-danger'
                                : r.dayOfWeek === 5
                                ? 'text-accent'
                                : 'text-text'
                            }`}
                          >
                            {weekdayName}
                          </span>
                          <span className="font-mono text-xs font-semibold text-text">
                            {toPersianDigits(r.date)}
                          </span>
                        </div>

                        {/* Status Badge with Text + Icon */}
                        <div>{renderStatusBadge(r)}</div>
                      </div>

                      {/* Middle Grid: Check In, Check Out, Net Worked */}
                      <div className="grid grid-cols-3 gap-2 text-center bg-surface-2 p-2.5 rounded-xl border border-border text-xs">
                        <div>
                          <span className="text-xs text-muted font-medium block mb-0.5">ورود</span>
                          <span className="font-mono font-bold text-text text-xs">
                            {r.checkIn ? toPersianDigits(r.checkIn) : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-muted font-medium block mb-0.5">خروج</span>
                          <span className="font-mono font-bold text-text text-xs">
                            {r.checkOut ? toPersianDigits(r.checkOut) : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-muted font-medium block mb-0.5">کارکرد خالص</span>
                          <span className="font-mono font-black text-semantic-success text-xs">
                            {r.workedMinutes > 0
                              ? toPersianDigits(formatMinutesToTimeString(r.workedMinutes))
                              : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Badges row: Special labels */}
                      {(isLate ||
                        hasOT ||
                        r.deficitMinutes > 0 ||
                        r.earlyLeaveMinutes > 0 ||
                        r.breakMinutes > 0 ||
                        (r.leaveMinutes !== undefined && r.leaveMinutes > 0)) && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-xs font-medium">
                          {r.targetCheckOut && (
                            <span className="rounded-lg badge-neutral px-2 py-0.5 font-mono">
                              خروج هدف: {toPersianDigits(r.targetCheckOut)}
                            </span>
                          )}
                          {r.leaveMinutes !== undefined && r.leaveMinutes > 0 && (
                            <span
                              className="rounded-lg badge-warning px-2 py-0.5 font-semibold inline-flex items-center gap-1"
                              title={`مرخصی ساعتی: ${formatMinutesToPersianReadable(r.leaveMinutes)}`}
                            >
                              <Coffee className="h-3 w-3 shrink-0" />
                              <span>مرخصی: {r.leaveMinutes >= 60 ? toPersianDigits(formatMinutesToTimeString(r.leaveMinutes)) : `${toPersianDigits(r.leaveMinutes)}د`}</span>
                            </span>
                          )}
                          {r.breakMinutes > 0 && (
                            <span className="rounded-lg badge-neutral px-2 py-0.5">
                              ناهار: {toPersianDigits(r.breakMinutes)}د
                            </span>
                          )}
                          {isLate && (
                            <span className="rounded-lg badge-danger px-2 py-0.5 font-bold inline-flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span>تاخیر: {toPersianDigits(r.delayMinutes)}د</span>
                            </span>
                          )}
                          {r.earlyLeaveMinutes > 0 && (
                            <span className="rounded-lg badge-warning px-2 py-0.5 font-bold">
                              تعجیل: {toPersianDigits(r.earlyLeaveMinutes)}د
                            </span>
                          )}
                          {hasOT && (
                            <span className="rounded-lg badge-info px-2 py-0.5 font-bold inline-flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 shrink-0" />
                              <span>اضافه کار: {toPersianDigits(formatMinutesToTimeString(r.overtimeMinutes + r.holidayOvertimeMinutes))}</span>
                            </span>
                          )}
                          {r.deficitMinutes > 0 && (
                            <span className="rounded-lg badge-danger px-2 py-0.5 font-bold inline-flex items-center gap-1">
                              <MinusCircle className="h-3 w-3 shrink-0" />
                              <span>کسر کار: {toPersianDigits(r.deficitMinutes)}د</span>
                            </span>
                          )}
                          {r.netBalanceMinutes !== 0 && (
                            <div>{renderBalance(r.netBalanceMinutes)}</div>
                          )}
                        </div>
                      )}

                      {/* Note row */}
                      {r.note && (
                        <p className="mt-2 text-xs text-text bg-surface-2 p-2.5 rounded-lg border border-border font-medium">
                          📝 {r.note}
                        </p>
                      )}

                      {/* Actions footer */}
                      <div className="flex items-center justify-between border-t border-border pt-2 mt-2.5 print:hidden">
                        <span className="text-xs text-muted font-mono font-medium">
                          #{r.id.slice(-6)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onEditRecord(r)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface text-accent text-xs font-medium border border-border transition-colors"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>ویرایش</span>
                          </button>
                          <button
                            onClick={() => onDeleteRecord(r.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-semantic-danger/20 text-semantic-danger text-xs font-medium border border-border transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* 6. Footer in Mobile Cards View */}
              {filteredRecords.length > 0 && (
                <div className="rounded-2xl border border-border bg-surface-2 backdrop-blur-md p-4 shadow-xl text-xs space-y-2.5 mt-3">
                  <div className="font-bold text-text flex items-center justify-between border-b border-border pb-2">
                    <span className="text-xs">جمع کل ماهانه اقلام نمایش‌داده‌شده:</span>
                    <span className="text-semantic-success font-mono text-sm font-black">
                      {toPersianDigits((visibleTotals.worked / 60).toFixed(1))} ساعت کار خالص
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                    <div>
                      <span className="text-muted block mb-0.5">اضافه کاری</span>
                      <span className="font-bold text-semantic-info font-mono text-xs">
                        {toPersianDigits((visibleTotals.overtime / 60).toFixed(1))} س
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block mb-0.5">تاخیر و تعجیل</span>
                      <span className="font-bold text-semantic-danger font-mono text-xs">
                        {toPersianDigits(visibleTotals.delay + visibleTotals.early)} د
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block mb-0.5">تراز ماهانه</span>
                      <div className="flex justify-center">{renderBalance(visibleTotals.balance)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: Desktop Full Table View with Sticky Headers & Sticky Date */}
          {activeViewMode === 'table' && (
            <div className="relative mt-4">
              {/* Left/Right scroll guide shadows */}
              {canScrollLeft && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-bg/90 to-transparent z-30 flex items-center justify-start pl-1 text-accent"
                >
                  <ChevronLeft className="h-4 w-4 animate-pulse" />
                </div>
              )}
              {canScrollRight && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute right-24 top-0 bottom-0 w-8 bg-gradient-to-l from-bg/90 to-transparent z-30 flex items-center justify-end pr-1 text-accent"
                >
                  <ChevronRight className="h-4 w-4 animate-pulse" />
                </div>
              )}

              <div
                ref={tableScrollRef}
                onScroll={checkTableScroll}
                className="max-h-[calc(100vh-14rem)] min-h-[360px] overflow-auto rounded-2xl border border-border bg-surface backdrop-blur-md shadow-xl"
              >
                <table className="w-full text-right text-xs border-collapse">
                  <thead className="bg-bg text-text border-b border-border sticky top-0 z-20 shadow-md">
                    <tr>
                      {/* Sticky Date Column Header (Completely Opaque) */}
                      <th className="py-3.5 px-3 font-bold text-text sticky right-0 top-0 z-30 bg-bg border-l border-border shadow-sm">
                        تاریخ
                      </th>
                      <th className="py-3.5 px-3 font-bold text-text">روز</th>
                      <th className="py-3.5 px-3 font-bold text-center text-text">وضعیت</th>
                      <th className="py-3.5 px-3 font-bold text-center text-text">ورود</th>
                      <th className="py-3.5 px-3 font-bold text-center text-text">خروج</th>
                      <th className="py-3.5 px-3 font-bold text-center text-text">خروج هدف</th>
                      <th className="py-3.5 px-3 font-bold text-center text-text">ناهار</th>
                      <th className="py-3.5 px-3 font-bold text-center text-text">کارکرد مفید</th>
                      <th className="py-3.5 px-3 font-bold text-center text-text">تاخیر</th>
                      <th className="py-3.5 px-3 font-bold text-center text-text">اضافه کاری</th>
                      <th className="py-3.5 px-3 font-bold text-center text-text">کسر کار</th>
                      <th className="py-3.5 px-3 font-bold text-center text-text">تراز روز</th>
                      <th className="py-3.5 px-4 font-bold text-text">یادداشت</th>
                      <th className="py-3.5 px-3 font-bold text-center text-text print:hidden">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="py-12 text-center text-muted">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Calendar className="h-8 w-8 text-muted opacity-60" />
                            <span>هیچ ترددی مطابق این فیلتر یافت نشد.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((r) => {
                        const weekdayName = PERSIAN_WEEKDAY_NAMES[r.dayOfWeek] || '';
                        const isLate = r.delayMinutes > 0;
                        const hasOT = r.overtimeMinutes > 0 || r.holidayOvertimeMinutes > 0;
                        const isIncompletePastDay = Boolean(r.checkIn && !r.checkOut && r.date < todayStr);

                        return (
                          <tr
                            key={r.id}
                            className={`transition-colors hover:bg-surface-2 ${
                              isIncompletePastDay
                                ? 'bg-semantic-warning/10 border-r-4 border-r-semantic-warning'
                                : r.isHoliday
                                ? 'bg-semantic-danger/10'
                                : ''
                            }`}
                          >
                            {/* Sticky Date Column Body (Completely Opaque) */}
                            <td className="py-3 px-3 font-mono font-medium text-text sticky right-0 z-10 bg-bg border-l border-border shadow-sm">
                              {toPersianDigits(r.date)}
                            </td>

                            {/* Weekday */}
                            <td className="py-3 px-3 font-medium">
                              <span
                                className={
                                  r.dayOfWeek === 6
                                    ? 'text-semantic-danger font-bold'
                                    : r.dayOfWeek === 5
                                    ? 'text-accent font-semibold'
                                    : 'text-text'
                                }
                              >
                                {weekdayName}
                              </span>
                            </td>

                            {/* Status Badge */}
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                {renderStatusBadge(r)}
                                {r.leaveMinutes !== undefined && r.leaveMinutes > 0 && (
                                  <span
                                    className="inline-flex items-center gap-1 rounded-full badge-warning px-2 py-0.5 text-xs font-semibold"
                                    title={`مرخصی ساعتی: ${formatMinutesToPersianReadable(r.leaveMinutes)}`}
                                  >
                                    <Coffee className="h-3 w-3 shrink-0" />
                                    <span>{r.leaveMinutes >= 60 ? toPersianDigits(formatMinutesToTimeString(r.leaveMinutes)) : `${toPersianDigits(r.leaveMinutes)}د`}</span>
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Check In */}
                            <td className="py-3 px-3 text-center font-mono font-semibold text-text">
                              {r.checkIn ? toPersianDigits(r.checkIn) : '-'}
                            </td>

                            {/* Check Out */}
                            <td className="py-3 px-3 text-center font-mono font-semibold text-text">
                              {r.checkOut ? toPersianDigits(r.checkOut) : '-'}
                            </td>

                            {/* Target Check Out */}
                            <td className="py-3 px-3 text-center font-mono text-accent font-semibold">
                              {r.targetCheckOut ? toPersianDigits(r.targetCheckOut) : '-'}
                            </td>

                            {/* Break */}
                            <td className="py-3 px-3 text-center text-muted font-mono font-medium">
                              {r.breakMinutes > 0 ? `${toPersianDigits(r.breakMinutes)} د` : '-'}
                            </td>

                            {/* Worked Time */}
                            <td className="py-3 px-3 text-center font-mono font-bold text-text">
                              {r.workedMinutes > 0 ? (
                                <span className="text-semantic-success">
                                  {toPersianDigits(formatMinutesToTimeString(r.workedMinutes))}
                                </span>
                              ) : (
                                <span className="text-muted font-medium">-</span>
                              )}
                            </td>

                            {/* Delay */}
                            <td className="py-3 px-3 text-center font-mono">
                              {isLate ? (
                                <span className="inline-flex items-center gap-1 rounded-md badge-danger px-1.5 py-0.5 font-bold">
                                  <AlertTriangle className="h-3 w-3 shrink-0" />
                                  <span>{toPersianDigits(r.delayMinutes)} د</span>
                                </span>
                              ) : (
                                <span className="text-muted font-medium">-</span>
                              )}
                            </td>

                            {/* Overtime */}
                            <td className="py-3 px-3 text-center font-mono">
                              {hasOT ? (
                                <span className="inline-flex items-center gap-1 rounded-md badge-info px-1.5 py-0.5 font-bold">
                                  <TrendingUp className="h-3 w-3 shrink-0" />
                                  <span>
                                    {toPersianDigits(
                                      formatMinutesToTimeString(r.overtimeMinutes + r.holidayOvertimeMinutes)
                                    )}
                                    {r.holidayOvertimeMinutes > 0 && ' (ت)'}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-muted font-medium">-</span>
                              )}
                            </td>

                            {/* Deficit */}
                            <td className="py-3 px-3 text-center font-mono">
                              {r.deficitMinutes > 0 ? (
                                <span
                                  className="inline-flex items-center gap-1 badge-warning px-1.5 py-0.5 rounded-md font-semibold"
                                  title={formatMinutesToPersianReadable(r.deficitMinutes)}
                                >
                                  <MinusCircle className="h-3 w-3 shrink-0" />
                                  <span>
                                    {r.deficitMinutes >= 60
                                      ? `${toPersianDigits(formatMinutesToTimeString(r.deficitMinutes))} س`
                                      : `${toPersianDigits(r.deficitMinutes)} د`}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-muted font-medium">-</span>
                              )}
                            </td>

                            {/* Net Balance with <bdi dir="ltr"> and icon */}
                            <td className="py-3 px-3 text-center font-mono font-bold">
                              {renderBalance(r.netBalanceMinutes)}
                            </td>

                            {/* Note */}
                            <td className="py-3 px-4 text-text max-w-xs truncate text-xs font-medium">
                              {r.note || '-'}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-3 text-center print:hidden">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => onEditRecord(r)}
                                  className="p-1 rounded-lg text-muted hover:text-accent hover:bg-surface-2 transition-colors"
                                  title="ویرایش تردد"
                                  aria-label="ویرایش تردد"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => onDeleteRecord(r.id)}
                                  className="p-1 rounded-lg text-muted hover:text-semantic-danger hover:bg-surface-2 transition-colors"
                                  title="حذف تردد"
                                  aria-label="حذف تردد"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {/* Table Summary Footer */}
                  {filteredRecords.length > 0 && (
                    <tfoot className="bg-surface-2 font-semibold text-text border-t-2 border-border-strong backdrop-blur-md">
                      <tr>
                        <td colSpan={7} className="py-3.5 px-4 text-left font-bold text-text sticky right-0 z-10 bg-bg border-l border-border">
                          مجموع اقلام جدول:
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono text-semantic-success font-bold">
                          {toPersianDigits((visibleTotals.worked / 60).toFixed(1))} س
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono text-semantic-danger">
                          {toPersianDigits(visibleTotals.delay)} د
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono text-semantic-info font-bold">
                          {toPersianDigits((visibleTotals.overtime / 60).toFixed(1))} س
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono text-semantic-warning">
                          {visibleTotals.deficit >= 60
                            ? `${toPersianDigits((visibleTotals.deficit / 60).toFixed(1))} س`
                            : `${toPersianDigits(visibleTotals.deficit)} د`}
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono font-black">
                          {renderBalance(visibleTotals.balance)}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </LiquidGlassCard>
  );
};
