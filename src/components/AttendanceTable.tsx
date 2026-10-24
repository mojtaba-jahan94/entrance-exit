import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Search,
  Check,
} from 'lucide-react';
import { AttendanceRecord, ShiftConfig, LeaveRecord } from '../types';
import { LiquidGlassCard } from './LiquidGlassCard';
import {
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEKDAY_NAMES,
  toPersianDigits,
  formatMinutesToTimeString,
  formatMinutesToPersianReadable,
  getTodayJalaliString,
} from '../utils/jalali';
import { buildFullMonthRows, FullMonthDayRow } from '../utils/exportEngine';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  leaves?: LeaveRecord[];
  searchQuery?: string;
  selectedYear: number;
  selectedMonth: number;
  config: ShiftConfig;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: string) => void;
  onAddNewForDate: (date: string) => void;
  onExportExcel: () => void;
  onOpenReportModal?: () => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  leaves = [],
  searchQuery = '',
  selectedYear,
  selectedMonth,
  config,
  onYearChange,
  onMonthChange,
  onEditRecord,
  onDeleteRecord,
  onAddNewForDate,
  onExportExcel,
  onOpenReportModal,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [viewScope, setViewScope] = useState<'all_month' | 'logged_only'>('all_month');
  const [localSearch, setLocalSearch] = useState<string>('');
  const todayStr = getTodayJalaliString();

  // Dynamic available years list guaranteeing selectedYear is present
  const availableYears = useMemo(() => {
    const minYear = Math.min(1400, selectedYear - 2);
    const maxYear = Math.max(1410, selectedYear + 2);
    const years: number[] = [];
    for (let y = minYear; y <= maxYear; y++) {
      years.push(y);
    }
    return years;
  }, [selectedYear]);

  // Reactive matchMedia listener for mobile card/table view switching
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

  // Horizontal scroll indicator state
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);

  const checkTableScroll = () => {
    const el = tableScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const currentScroll = Math.abs(el.scrollLeft);
    setCanScrollLeft(maxScroll > 10 && currentScroll < maxScroll - 6);
    setCanScrollRight(currentScroll > 6);
  };

  const monthPrefix = `${selectedYear}/${selectedMonth < 10 ? '0' + selectedMonth : selectedMonth}/`;

  // Raw records strictly for this month
  const rawMonthRecords = useMemo(() => {
    return records
      .filter((r) => r.date.startsWith(monthPrefix))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [records, monthPrefix]);

  // Continuous Full-Month 1-to-N rows
  const fullMonthRows = useMemo(() => {
    return buildFullMonthRows(records, leaves, config, selectedYear, selectedMonth);
  }, [records, leaves, config, selectedYear, selectedMonth]);

  // Base list depending on viewScope
  const baseItems = useMemo(() => {
    if (viewScope === 'logged_only') {
      // Find full row corresponding to each record so data is consistent
      return fullMonthRows.filter((r) => {
        return rawMonthRecords.some((rec) => rec.date === r.date);
      });
    }
    return fullMonthRows;
  }, [viewScope, fullMonthRows, rawMonthRecords]);

  // Combine parent search query and local search
  const effectiveSearch = (searchQuery || localSearch).trim().toLowerCase();

  // Apply quick filters and search filter
  const filteredItems = useMemo(() => {
    return baseItems.filter((r) => {
      // Search filter
      if (effectiveSearch) {
        const matchNote = r.note && r.note.toLowerCase().includes(effectiveSearch);
        const matchLeave = r.leaveDescription && r.leaveDescription.toLowerCase().includes(effectiveSearch);
        const matchDate = r.date.includes(effectiveSearch);
        const matchStatus = r.status.toLowerCase().includes(effectiveSearch);
        if (!matchNote && !matchDate && !matchStatus && !matchLeave) return false;
      }

      // Quick category filters
      if (filterType === 'delays') {
        return r.delayMinutes > 0 || r.earlyLeaveMinutes > 0;
      }
      if (filterType === 'overtime') {
        return r.overtimeMinutes > 0 || r.holidayOvertimeMinutes > 0;
      }
      if (filterType === 'thursdays') {
        return r.weekdayIndex === 5;
      }
      if (filterType === 'leaves') {
        return r.statusType === 'leave';
      }
      if (filterType === 'holidays') {
        return r.isHoliday;
      }
      if (filterType === 'incomplete') {
        return Boolean(r.checkIn && !r.checkOut && r.date < todayStr);
      }
      return true;
    });
  }, [baseItems, effectiveSearch, filterType, todayStr]);

  useEffect(() => {
    checkTableScroll();
    window.addEventListener('resize', checkTableScroll);
    return () => window.removeEventListener('resize', checkTableScroll);
  }, [filteredItems.length, activeViewMode]);

  // Filter counts
  const delaysCount = useMemo(
    () => baseItems.filter((r) => r.delayMinutes > 0 || r.earlyLeaveMinutes > 0).length,
    [baseItems]
  );
  const overtimeCount = useMemo(
    () => baseItems.filter((r) => r.overtimeMinutes > 0 || r.holidayOvertimeMinutes > 0).length,
    [baseItems]
  );
  const thursdaysCount = useMemo(
    () => baseItems.filter((r) => r.weekdayIndex === 5).length,
    [baseItems]
  );
  const leavesCount = useMemo(
    () => baseItems.filter((r) => r.statusType === 'leave').length,
    [baseItems]
  );
  const holidaysCount = useMemo(
    () => baseItems.filter((r) => r.isHoliday).length,
    [baseItems]
  );
  const incompleteCount = useMemo(
    () => baseItems.filter((r) => r.checkIn && !r.checkOut && r.date < todayStr).length,
    [baseItems]
  );

  // Column totals of filtered items
  const visibleTotals = useMemo(() => {
    return filteredItems.reduce(
      (acc, r) => {
        acc.worked += r.workedMinutes;
        acc.delay += r.delayMinutes;
        acc.early += r.earlyLeaveMinutes;
        acc.normalOT += r.overtimeMinutes;
        acc.holidayOT += r.holidayOvertimeMinutes;
        acc.deficit += r.deficitMinutes;
        acc.balance += r.netBalanceMinutes;
        acc.breakMins += r.breakMinutes;
        if (r.statusType === 'present' || r.checkIn) acc.presentDays++;
        if (r.statusType === 'leave') acc.leaveDays++;
        return acc;
      },
      {
        worked: 0,
        delay: 0,
        early: 0,
        normalOT: 0,
        holidayOT: 0,
        deficit: 0,
        balance: 0,
        breakMins: 0,
        presentDays: 0,
        leaveDays: 0,
      }
    );
  }, [filteredItems]);

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
    if (onOpenReportModal) {
      onOpenReportModal();
    } else {
      window.print();
    }
  };

  const monthName = PERSIAN_MONTH_NAMES[selectedMonth - 1] || '';

  // Render status badge with icon and readable text
  const renderStatusBadge = (r: FullMonthDayRow) => {
    const isIncompletePastDay = Boolean(r.checkIn && !r.checkOut && r.date < todayStr);

    if (isIncompletePastDay) {
      return (
        <span
          className="inline-flex items-center gap-1 rounded-full badge-warning border border-[var(--semantic-warning)]/60 px-2 py-0.5 text-xs font-bold text-[var(--semantic-warning)]"
          title="تردد ناقص: ورود ثبت شده اما خروج ثبت نشده است"
        >
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>ناقص</span>
        </span>
      );
    }

    if (r.statusType === 'present' || r.checkIn) {
      if (r.weekdayIndex === 5) {
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

    if (r.statusType === 'in_progress') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full badge-accent px-2 py-0.5 text-xs font-semibold">
          <Clock className="h-3 w-3 animate-pulse shrink-0" />
          <span>در حال کار</span>
        </span>
      );
    }

    if (r.statusType === 'leave') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full badge-warning px-2 py-0.5 text-xs font-semibold">
          <Coffee className="h-3 w-3 shrink-0" />
          <span>{r.status}</span>
        </span>
      );
    }

    if (r.isFriday) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full badge-danger px-2 py-0.5 text-xs font-semibold">
          <CalendarOff className="h-3 w-3 shrink-0" />
          <span>جمعه (تعطیل)</span>
        </span>
      );
    }

    if (r.isHoliday) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full badge-danger px-2 py-0.5 text-xs font-semibold">
          <CalendarOff className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[110px]">{r.status}</span>
        </span>
      );
    }

    if (r.statusType === 'absent') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full badge-danger px-2 py-0.5 text-xs font-semibold">
          <MinusCircle className="h-3 w-3 shrink-0" />
          <span>غایب</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full badge-neutral px-2 py-0.5 text-xs font-medium text-muted">
        <Minus className="h-3 w-3 shrink-0" />
        <span>بدون ثبت</span>
      </span>
    );
  };

  // Render net balance with LTR numbers, signs, and icons
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
    <LiquidGlassCard className="rounded-[28px] sm:rounded-[36px] p-3.5 sm:p-6 shadow-2xl border border-[var(--border)]">
      {/* 1. Header Toolbar & Controls */}
      <div className="flex flex-col gap-3.5 border-b border-[var(--border)] pb-4">
        {/* Row 1: Month/Year Nav + Scope Toggle + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          {/* Month & Year Selectors */}
          <div className="flex items-center rounded-full bg-[var(--surface-2)] border border-[var(--border)] backdrop-blur-md p-1 shadow-inner">
            <button
              type="button"
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
              className="bg-transparent px-2 py-1 text-xs sm:text-sm font-bold text-text focus:outline-none cursor-pointer"
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
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-bg text-text">
                  {toPersianDigits(yr)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-full text-muted hover:text-text hover:bg-surface-2 transition-colors"
              title="ماه بعد"
              aria-label="ماه بعد"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Scope Toggle: All Month Days vs Logged Only */}
          <div className="flex items-center rounded-full bg-[var(--surface-2)] border border-[var(--border)] p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewScope('all_month')}
              className={`px-3 py-1 rounded-full font-semibold transition-all ${
                viewScope === 'all_month'
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                  : 'text-muted hover:text-text'
              }`}
              title="نمایش کل روزهای تقویم ماه به همراه روزهای تعطیل و ثبت‌نشده"
            >
              کل ماه ({toPersianDigits(fullMonthRows.length)})
            </button>
            <button
              type="button"
              onClick={() => setViewScope('logged_only')}
              className={`px-3 py-1 rounded-full font-semibold transition-all ${
                viewScope === 'logged_only'
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                  : 'text-muted hover:text-text'
              }`}
              title="فقط روزهایی که در این ماه تردد برای آن‌ها ثبت شده است"
            >
              فقط ثبت‌شده‌ها ({toPersianDigits(rawMonthRecords.length)})
            </button>
          </div>

          {/* Right Side: View Switcher & Export/Print Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 mr-auto">
            {/* View Mode Switcher Button */}
            <button
              type="button"
              onClick={() => setUserViewOverride(activeViewMode === 'cards' ? 'table' : 'cards')}
              className="liquid-pill-btn px-3 py-1.5 text-xs flex items-center"
              title="تغییر نحوه نمایش بین کارتی و جدولی"
              aria-label="تغییر نمای نمایش"
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
              type="button"
              onClick={onExportExcel}
              className="liquid-pill-btn px-3 py-1.5 text-xs text-semantic-success shadow-sm flex items-center gap-1"
              title="دانلود فایل اکسل کامل دو برگه‌ای کارنامه"
              aria-label="خروجی فایل اکسل"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 ml-1" />
              <span className="hidden xs:inline text-[11px] sm:text-xs font-semibold">اکسل</span>
            </button>

            {/* Print / PDF Official Report */}
            <button
              type="button"
              onClick={handlePrint}
              className="liquid-pill-btn-primary px-3.5 py-1.5 text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
              title="پیش‌نمایش، چاپ و ذخیره PDF رسمی کارنامه با تمام اطلاعات"
              aria-label="چاپ و خروجی PDF"
            >
              <Printer className="h-3.5 w-3.5 ml-1" />
              <span>چاپ و خروجی PDF</span>
            </button>
          </div>
        </div>

        {/* Row 2: Search Input & Category Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-full shrink-0 transition-all font-semibold ${
                filterType === 'all'
                  ? 'liquid-pill-btn-primary shadow-sm'
                  : 'liquid-pill-btn text-muted'
              }`}
            >
              همه ({toPersianDigits(baseItems.length)})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('delays')}
              className={`px-3 py-1 rounded-full shrink-0 transition-all font-semibold ${
                filterType === 'delays'
                  ? 'badge-danger shadow-sm'
                  : 'liquid-pill-btn text-muted hover:text-semantic-danger'
              }`}
            >
              تاخیر/تعجیل ({toPersianDigits(delaysCount)})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('overtime')}
              className={`px-3 py-1 rounded-full shrink-0 transition-all font-semibold ${
                filterType === 'overtime'
                  ? 'badge-info shadow-sm'
                  : 'liquid-pill-btn text-muted hover:text-semantic-info'
              }`}
            >
              اضافه کار ({toPersianDigits(overtimeCount)})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('thursdays')}
              className={`px-3 py-1 rounded-full shrink-0 transition-all font-semibold ${
                filterType === 'thursdays'
                  ? 'badge-accent shadow-sm'
                  : 'liquid-pill-btn text-muted hover:text-accent'
              }`}
            >
              پنج‌شنبه‌ها ({toPersianDigits(thursdaysCount)})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('leaves')}
              className={`px-3 py-1 rounded-full shrink-0 transition-all font-semibold ${
                filterType === 'leaves'
                  ? 'badge-warning shadow-sm'
                  : 'liquid-pill-btn text-muted hover:text-semantic-warning'
              }`}
            >
              مرخصی‌ها ({toPersianDigits(leavesCount)})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('holidays')}
              className={`px-3 py-1 rounded-full shrink-0 transition-all font-semibold ${
                filterType === 'holidays'
                  ? 'badge-danger shadow-sm'
                  : 'liquid-pill-btn text-muted hover:text-semantic-danger'
              }`}
            >
              تعطیلات ({toPersianDigits(holidaysCount)})
            </button>
            {incompleteCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterType('incomplete')}
                className={`px-3 py-1 rounded-full shrink-0 transition-all font-bold animate-pulse ${
                  filterType === 'incomplete'
                    ? 'badge-warning shadow-sm'
                    : 'liquid-pill-btn text-semantic-warning'
                }`}
              >
                ناقص ({toPersianDigits(incompleteCount)})
              </button>
            )}
          </div>

          {/* Quick Search */}
          <div className="flex items-center rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-1 text-xs w-full sm:w-56 mr-auto">
            <Search className="h-3.5 w-3.5 text-muted ml-1.5 shrink-0" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="جستجو در یادداشت یا تاریخ..."
              className="bg-transparent text-xs text-text placeholder:text-muted focus:outline-none w-full"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="text-muted hover:text-text text-xs mr-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Viewport: Empty State or Table / Card Views */}
      {filteredItems.length === 0 ? (
        <div className="my-8 py-12 px-4 text-center bg-surface-2 backdrop-blur-md rounded-2xl border border-border flex flex-col items-center justify-center gap-3">
          <div className="rounded-2xl bg-surface p-3 text-accent border border-border">
            <Calendar className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-text">
              هیچ آیتمی برای {monthName} {toPersianDigits(selectedYear)} یافت نشد
            </h4>
            <p className="text-xs text-muted">
              می‌توانید فیلتر انتخابی را تغییر داده یا تردد روز جدیدی را ثبت فرمایید.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onAddNewForDate(`${monthPrefix}01`)}
            className="liquid-pill-btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-bold shadow-md active:scale-95 transition-all mt-1 print:hidden"
          >
            <Plus className="h-4 w-4" />
            <span>ثبت تردد جدید</span>
          </button>
        </div>
      ) : (
        <>
          {/* VIEW 1: Mobile Cards View */}
          {activeViewMode === 'cards' && (
            <div className="mt-4 space-y-3">
              {filteredItems.map((r) => {
                const isLate = r.delayMinutes > 0;
                const hasOT = r.overtimeMinutes > 0 || r.holidayOvertimeMinutes > 0;
                const isIncompletePastDay = Boolean(r.checkIn && !r.checkOut && r.date < todayStr);
                const matchingRecord = rawMonthRecords.find((rec) => rec.date === r.date);

                return (
                  <div
                    key={r.date}
                    className={`rounded-2xl border p-3.5 transition-all shadow-md backdrop-blur-md ${
                      isIncompletePastDay
                        ? 'border-semantic-warning/60 bg-semantic-warning/10'
                        : r.isHoliday
                        ? 'border-semantic-danger/35 bg-semantic-danger/10'
                        : 'border-border bg-surface hover:bg-surface-2'
                    }`}
                  >
                    {/* Top Row: Date + Weekday + Status Badge */}
                    <div className="flex items-center justify-between border-b border-border pb-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            r.weekdayIndex === 6
                              ? 'text-semantic-danger'
                              : r.weekdayIndex === 5
                              ? 'text-accent'
                              : 'text-text'
                          }`}
                        >
                          {r.weekdayName}
                        </span>
                        <span className="font-mono text-xs font-semibold text-text">
                          {toPersianDigits(r.date)}
                        </span>
                      </div>
                      <div>{renderStatusBadge(r)}</div>
                    </div>

                    {/* Middle Grid: Check In, Check Out, Net Worked */}
                    <div className="grid grid-cols-3 gap-2 text-center bg-surface-2 p-2.5 rounded-xl border border-border text-xs">
                      <div>
                        <span className="text-[11px] text-muted font-medium block mb-0.5">ورود</span>
                        <span className="font-mono font-bold text-text text-xs">
                          {r.checkIn ? toPersianDigits(r.checkIn) : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted font-medium block mb-0.5">خروج</span>
                        <span className="font-mono font-bold text-text text-xs">
                          {r.checkOut ? toPersianDigits(r.checkOut) : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted font-medium block mb-0.5">کارکرد خالص</span>
                        <span className="font-mono font-black text-semantic-success text-xs">
                          {r.workedMinutes > 0
                            ? toPersianDigits(formatMinutesToTimeString(r.workedMinutes))
                            : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Special labels & badges */}
                    {(isLate ||
                      hasOT ||
                      r.deficitMinutes > 0 ||
                      r.earlyLeaveMinutes > 0 ||
                      r.breakMinutes > 0 ||
                      r.targetCheckOut ||
                      r.leaveDescription) && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-xs font-medium">
                        {r.targetCheckOut && (
                          <span className="rounded-lg badge-neutral px-2 py-0.5 font-mono">
                            خروج هدف: {toPersianDigits(r.targetCheckOut)}
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
                        {r.overtimeMinutes > 0 && (
                          <span className="rounded-lg badge-info px-2 py-0.5 font-bold inline-flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 shrink-0" />
                            <span>عادی: {toPersianDigits(formatMinutesToTimeString(r.overtimeMinutes))}</span>
                          </span>
                        )}
                        {r.holidayOvertimeMinutes > 0 && (
                          <span className="rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2 py-0.5 font-bold inline-flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 shrink-0" />
                            <span>تعطیل: {toPersianDigits(formatMinutesToTimeString(r.holidayOvertimeMinutes))}</span>
                          </span>
                        )}
                        {r.deficitMinutes > 0 && (
                          <span className="rounded-lg badge-danger px-2 py-0.5 font-bold inline-flex items-center gap-1">
                            <MinusCircle className="h-3 w-3 shrink-0" />
                            <span>کسر کار: {toPersianDigits(r.deficitMinutes)}د</span>
                          </span>
                        )}
                        {r.netBalanceMinutes !== 0 && <div>{renderBalance(r.netBalanceMinutes)}</div>}
                      </div>
                    )}

                    {/* Description & Note */}
                    {(r.leaveDescription || r.note) && (
                      <div className="mt-2 text-xs text-text bg-surface-2 p-2 rounded-lg border border-border">
                        {r.leaveDescription && (
                          <span className="font-bold text-accent ml-1.5 block">
                            📌 {r.leaveDescription}
                          </span>
                        )}
                        {r.note && <p className="text-text font-medium">📝 {r.note}</p>}
                      </div>
                    )}

                    {/* Actions footer */}
                    <div className="flex items-center justify-between border-t border-border pt-2 mt-2.5 print:hidden">
                      <span className="text-xs text-muted font-mono font-medium">
                        روز {toPersianDigits(r.dayNumber)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {matchingRecord ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onEditRecord(matchingRecord)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface text-accent text-xs font-medium border border-border transition-colors"
                            >
                              <Edit2 className="h-3 w-3" />
                              <span>ویرایش</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteRecord(matchingRecord.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-semantic-danger/20 text-semantic-danger text-xs font-medium border border-border transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>حذف</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAddNewForDate(r.date)}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-accent/15 hover:bg-accent/25 text-accent text-xs font-bold border border-accent/30 transition-all"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>ثبت تردد</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Mobile Cards Footer Summary */}
              <div className="rounded-2xl border border-border bg-surface-2 backdrop-blur-md p-4 shadow-xl text-xs space-y-2.5 mt-3">
                <div className="font-bold text-text flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs">جمع کل ماهانه ({toPersianDigits(filteredItems.length)} روز):</span>
                  <span className="text-semantic-success font-mono text-sm font-black">
                    {toPersianDigits((visibleTotals.worked / 60).toFixed(1))} ساعت کار مفید
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                  <div>
                    <span className="text-muted block mb-0.5">اضافه کار کل</span>
                    <span className="font-bold text-semantic-info font-mono text-xs">
                      {toPersianDigits(((visibleTotals.normalOT + visibleTotals.holidayOT) / 60).toFixed(1))} س
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block mb-0.5">تاخیر و تعجیل</span>
                    <span className="font-bold text-semantic-danger font-mono text-xs">
                      {toPersianDigits(visibleTotals.delay + visibleTotals.early)} د
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block mb-0.5">تراز خالص</span>
                    <div className="flex justify-center">{renderBalance(visibleTotals.balance)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: Desktop Full Table View (Clean, High-Contrast ERP Grid) */}
          {activeViewMode === 'table' && (
            <div className="relative mt-4">
              {/* Subtle edge shadows if overflowing */}
              {canScrollLeft && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[var(--surface)] to-transparent z-20"
                />
              )}
              {canScrollRight && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[var(--surface)] to-transparent z-20"
                />
              )}

              <div
                ref={tableScrollRef}
                onScroll={checkTableScroll}
                className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md shadow-xl"
              >
                <table className="w-full text-right text-xs border-collapse min-w-[1100px]">
                  <thead className="bg-[var(--surface-2)] text-text border-b border-[var(--border)] sticky top-0 z-20 shadow-sm">
                    <tr>
                      <th className="py-3 px-2 text-center font-bold text-muted w-10">ردیف</th>
                      <th className="py-3 px-2.5 text-center font-bold text-text w-24">تاریخ</th>
                      <th className="py-3 px-2.5 text-center font-bold text-text w-20">روز</th>
                      <th className="py-3 px-3 text-center font-bold text-text w-32">وضعیت</th>
                      <th className="py-3 px-2 text-center font-bold text-text w-16">ورود</th>
                      <th className="py-3 px-2 text-center font-bold text-text w-16">خروج</th>
                      <th className="py-3 px-2 text-center font-bold text-accent w-20">خروج هدف</th>
                      <th className="py-3 px-2 text-center font-bold text-muted w-14">ناهار</th>
                      <th className="py-3 px-2.5 text-center font-bold text-semantic-success w-24">کارکرد مفید</th>
                      <th className="py-3 px-2 text-center font-bold text-semantic-danger w-16">تاخیر</th>
                      <th className="py-3 px-2 text-center font-bold text-amber-500 w-16">تعجیل</th>
                      <th className="py-3 px-2.5 text-center font-bold text-semantic-info w-20">اضافه عادی</th>
                      <th className="py-3 px-2.5 text-center font-bold text-purple-400 w-20">اضافه تعطیل</th>
                      <th className="py-3 px-2 text-center font-bold text-semantic-warning w-16">کسر کار</th>
                      <th className="py-3 px-2.5 text-center font-bold text-text w-24">تراز روز</th>
                      <th className="py-3 px-3 text-right font-bold text-text min-w-[200px]">یادداشت و مرخصی</th>
                      <th className="py-3 px-3 text-center font-bold text-text w-24 print:hidden">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]/70">
                    {filteredItems.map((r) => {
                      const isLate = r.delayMinutes > 0;
                      const isIncompletePastDay = Boolean(r.checkIn && !r.checkOut && r.date < todayStr);
                      const matchingRecord = rawMonthRecords.find((rec) => rec.date === r.date);

                      return (
                        <tr
                          key={r.date}
                          className={`transition-colors hover:bg-[var(--surface-2)]/60 ${
                            isIncompletePastDay
                              ? 'bg-semantic-warning/10 border-r-4 border-r-semantic-warning'
                              : r.isFriday
                              ? 'bg-[var(--surface-2)]/40 font-medium'
                              : r.isHoliday
                              ? 'bg-semantic-danger/10 font-medium'
                              : !matchingRecord
                              ? 'opacity-85'
                              : ''
                          }`}
                        >
                          {/* ردیف */}
                          <td className="py-2.5 px-2 text-center font-mono text-[11px] text-muted">
                            {toPersianDigits(r.dayNumber)}
                          </td>

                          {/* تاریخ */}
                          <td className="py-2.5 px-2.5 text-center font-mono font-medium text-text">
                            {toPersianDigits(r.date)}
                          </td>

                          {/* روز هفته */}
                          <td className="py-2.5 px-2.5 text-center font-medium">
                            <span
                              className={
                                r.weekdayIndex === 6
                                  ? 'text-semantic-danger font-bold'
                                  : r.weekdayIndex === 5
                                  ? 'text-accent font-semibold'
                                  : 'text-text'
                              }
                            >
                              {r.weekdayName}
                            </span>
                          </td>

                          {/* وضعیت */}
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center">
                              {renderStatusBadge(r)}
                            </div>
                          </td>

                          {/* ساعت ورود */}
                          <td className="py-2.5 px-2 text-center font-mono font-semibold text-text">
                            {r.checkIn ? toPersianDigits(r.checkIn) : '-'}
                          </td>

                          {/* ساعت خروج */}
                          <td className="py-2.5 px-2 text-center font-mono font-semibold text-text">
                            {r.checkOut ? toPersianDigits(r.checkOut) : '-'}
                          </td>

                          {/* خروج هدف */}
                          <td className="py-2.5 px-2 text-center font-mono font-semibold text-accent">
                            {r.targetCheckOut ? toPersianDigits(r.targetCheckOut) : '-'}
                          </td>

                          {/* ناهار */}
                          <td className="py-2.5 px-2 text-center font-mono text-muted">
                            {r.breakMinutes > 0 ? `${toPersianDigits(r.breakMinutes)} د` : '-'}
                          </td>

                          {/* کارکرد خالص */}
                          <td className="py-2.5 px-2.5 text-center font-mono font-bold">
                            {r.workedMinutes > 0 ? (
                              <span className="text-semantic-success">
                                {toPersianDigits(formatMinutesToTimeString(r.workedMinutes))}
                              </span>
                            ) : (
                              <span className="text-muted font-normal">-</span>
                            )}
                          </td>

                          {/* تاخیر */}
                          <td className="py-2.5 px-2 text-center font-mono">
                            {isLate ? (
                              <span className="inline-flex items-center gap-0.5 rounded badge-danger px-1.5 py-0.5 font-bold text-[11px]">
                                <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                                <span>{toPersianDigits(r.delayMinutes)} د</span>
                              </span>
                            ) : (
                              <span className="text-muted font-normal">-</span>
                            )}
                          </td>

                          {/* تعجیل */}
                          <td className="py-2.5 px-2 text-center font-mono">
                            {r.earlyLeaveMinutes > 0 ? (
                              <span className="inline-flex items-center gap-0.5 rounded badge-warning px-1.5 py-0.5 font-bold text-[11px]">
                                <span>{toPersianDigits(r.earlyLeaveMinutes)} د</span>
                              </span>
                            ) : (
                              <span className="text-muted font-normal">-</span>
                            )}
                          </td>

                          {/* اضافه کار عادی */}
                          <td className="py-2.5 px-2.5 text-center font-mono">
                            {r.overtimeMinutes > 0 ? (
                              <span className="inline-flex items-center gap-0.5 rounded badge-info px-1.5 py-0.5 font-bold text-[11px]">
                                <TrendingUp className="h-2.5 w-2.5 shrink-0" />
                                <span>{toPersianDigits(formatMinutesToTimeString(r.overtimeMinutes))}</span>
                              </span>
                            ) : (
                              <span className="text-muted font-normal">-</span>
                            )}
                          </td>

                          {/* اضافه کار تعطیل */}
                          <td className="py-2.5 px-2.5 text-center font-mono">
                            {r.holidayOvertimeMinutes > 0 ? (
                              <span className="inline-flex items-center gap-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 font-bold text-[11px]">
                                <TrendingUp className="h-2.5 w-2.5 shrink-0" />
                                <span>{toPersianDigits(formatMinutesToTimeString(r.holidayOvertimeMinutes))}</span>
                              </span>
                            ) : (
                              <span className="text-muted font-normal">-</span>
                            )}
                          </td>

                          {/* کسر کار */}
                          <td className="py-2.5 px-2 text-center font-mono">
                            {r.deficitMinutes > 0 ? (
                              <span
                                className="inline-flex items-center gap-0.5 rounded badge-danger px-1.5 py-0.5 font-semibold text-[11px]"
                                title={formatMinutesToPersianReadable(r.deficitMinutes)}
                              >
                                <MinusCircle className="h-2.5 w-2.5 shrink-0" />
                                <span>
                                  {r.deficitMinutes >= 60
                                    ? `${toPersianDigits(formatMinutesToTimeString(r.deficitMinutes))} س`
                                    : `${toPersianDigits(r.deficitMinutes)} د`}
                                </span>
                              </span>
                            ) : (
                              <span className="text-muted font-normal">-</span>
                            )}
                          </td>

                          {/* تراز روز */}
                          <td className="py-2.5 px-2.5 text-center font-mono font-bold">
                            {renderBalance(r.netBalanceMinutes)}
                          </td>

                          {/* یادداشت و مرخصی - کامل و بدون کات شدن */}
                          <td className="py-2.5 px-3 text-right text-xs">
                            <div className="flex flex-col gap-0.5">
                              {r.leaveDescription && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-accent">
                                  <Coffee className="h-3 w-3 shrink-0" />
                                  <span>{r.leaveDescription}</span>
                                </span>
                              )}
                              {r.note ? (
                                <span className="text-text font-medium leading-relaxed">
                                  {r.note}
                                </span>
                              ) : !r.leaveDescription ? (
                                <span className="text-muted">-</span>
                              ) : null}
                            </div>
                          </td>

                          {/* عملیات */}
                          <td className="py-2.5 px-3 text-center print:hidden">
                            {matchingRecord ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onEditRecord(matchingRecord)}
                                  className="p-1 rounded-lg text-muted hover:text-accent hover:bg-[var(--surface)] transition-colors"
                                  title="ویرایش تردد"
                                  aria-label="ویرایش تردد"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteRecord(matchingRecord.id)}
                                  className="p-1 rounded-lg text-muted hover:text-semantic-danger hover:bg-[var(--surface)] transition-colors"
                                  title="حذف تردد"
                                  aria-label="حذف تردد"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onAddNewForDate(r.date)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-accent bg-accent/15 hover:bg-accent/25 border border-accent/30 transition-all"
                                title="ثبت تردد برای این روز"
                              >
                                <Plus className="h-3 w-3" />
                                <span>ثبت</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* 3. Table Summary Footer - Aligned 1-to-1 with headers */}
                  <tfoot className="bg-[var(--surface-2)] font-semibold text-text border-t-2 border-[var(--border-strong)] sticky bottom-0 z-10 backdrop-blur-xl">
                    <tr>
                      <td
                        colSpan={4}
                        className="py-3 px-3 text-center font-bold border-l border-[var(--border)]"
                      >
                        مجموع اقلام جدول ({toPersianDigits(filteredItems.length)} روز تقویمی)
                      </td>
                      <td
                        colSpan={3}
                        className="py-3 px-2 text-center font-mono text-xs text-muted border-l border-[var(--border)]"
                      >
                        {toPersianDigits(visibleTotals.presentDays)} روز حضور
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-xs text-muted border-l border-[var(--border)]">
                        {visibleTotals.breakMins > 0
                          ? `${toPersianDigits(visibleTotals.breakMins)}د`
                          : '-'}
                      </td>
                      <td className="py-3 px-2.5 text-center font-mono text-xs font-black text-semantic-success border-l border-[var(--border)]">
                        {toPersianDigits(formatMinutesToTimeString(visibleTotals.worked))}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-xs font-bold text-semantic-danger border-l border-[var(--border)]">
                        {visibleTotals.delay > 0 ? `${toPersianDigits(visibleTotals.delay)}د` : '۰'}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-xs font-bold text-amber-500 border-l border-[var(--border)]">
                        {visibleTotals.early > 0 ? `${toPersianDigits(visibleTotals.early)}د` : '۰'}
                      </td>
                      <td className="py-3 px-2.5 text-center font-mono text-xs font-bold text-semantic-info border-l border-[var(--border)]">
                        {visibleTotals.normalOT > 0
                          ? toPersianDigits(formatMinutesToTimeString(visibleTotals.normalOT))
                          : '۰'}
                      </td>
                      <td className="py-3 px-2.5 text-center font-mono text-xs font-bold text-purple-400 border-l border-[var(--border)]">
                        {visibleTotals.holidayOT > 0
                          ? toPersianDigits(formatMinutesToTimeString(visibleTotals.holidayOT))
                          : '۰'}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-xs font-bold text-semantic-warning border-l border-[var(--border)]">
                        {visibleTotals.deficit > 0
                          ? `${toPersianDigits(visibleTotals.deficit)}د`
                          : '۰'}
                      </td>
                      <td className="py-3 px-2.5 text-center font-mono text-xs font-black border-l border-[var(--border)]">
                        {renderBalance(visibleTotals.balance)}
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-muted">
                        مرخصی کل: {toPersianDigits(visibleTotals.leaveDays)} روز
                      </td>
                      <td className="py-3 px-3 text-center print:hidden"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </LiquidGlassCard>
  );
};
