import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  Search,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import { AttendanceRecord, ShiftConfig } from '../types';
import {
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEKDAY_NAMES,
  toPersianDigits,
  formatMinutesToTimeString,
  formatMinutesToPersianReadable,
} from '../utils/jalali';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  selectedYear: number;
  selectedMonth: number;
  config?: ShiftConfig;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: string) => void;
  onAddNewForDate?: (date: string) => void;
  onExportExcel: () => void;
  initialViewMode?: 'table' | 'card' | 'cards';
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
  onAddNewForDate: _onAddNewForDate,
  onExportExcel,
  initialViewMode,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    if (initialViewMode === 'card' || initialViewMode === 'cards') return 'cards';
    if (initialViewMode === 'table') return 'table';
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'table';
  });

  React.useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode === 'card' || initialViewMode === 'cards' ? 'cards' : 'table');
    }
  }, [initialViewMode]);

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

  // Calculate visible totals for the footer
  const visibleTotals = filteredRecords.reduce(
    (acc, r) => {
      acc.worked += r.workedMinutes;
      acc.delay += r.delayMinutes;
      acc.overtime += r.overtimeMinutes + r.holidayOvertimeMinutes;
      acc.deficit += r.deficitMinutes;
      acc.balance += r.netBalanceMinutes;
      return acc;
    },
    { worked: 0, delay: 0, overtime: 0, deficit: 0, balance: 0 }
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

  return (
    <div className="rounded-[28px] border border-[#D1D5DB] bg-white p-4 sm:p-6 shadow-sm text-[#1F2933]">
      {/* Table Header Controls */}
      <div className="flex flex-col gap-3.5 border-b border-[#D1D5DB] pb-4">
        {/* Row 1: Month/Year Nav + View Switcher + Record Count */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Month & Year Selectors */}
          <div className="flex items-center rounded-2xl bg-[#F7F7F2] border border-[#D1D5DB] p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl text-[#6B7280] hover:text-[#1F2933] hover:bg-white transition-colors"
              title="ماه قبل"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Month Select */}
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
              className="bg-transparent px-2.5 py-1 text-xs sm:text-sm font-bold text-[#1F2933] focus:outline-none cursor-pointer"
            >
              {PERSIAN_MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1} className="bg-white text-[#1F2933]">
                  {name}
                </option>
              ))}
            </select>

            {/* Year Select */}
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
              className="bg-transparent px-1.5 py-1 text-xs sm:text-sm font-bold text-[#A68A64] focus:outline-none cursor-pointer font-mono"
            >
              {[selectedYear - 3, selectedYear - 2, selectedYear - 1, selectedYear, selectedYear + 1, selectedYear + 2].map((yr) => (
                <option key={yr} value={yr} className="bg-white text-[#1F2933]">
                  {toPersianDigits(yr)}
                </option>
              ))}
            </select>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl text-[#6B7280] hover:text-[#1F2933] hover:bg-white transition-colors"
              title="ماه بعد"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Right side: View Switcher (Cards vs Table) & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* View Mode Switcher Button */}
            <button
              onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
              className="flex items-center gap-1.5 rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] hover:bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1F2933] transition-all"
              title="تغییر نحوه نمایش"
            >
              {viewMode === 'cards' ? (
                <>
                  <TableIcon className="h-3.5 w-3.5 text-[#A68A64]" />
                  <span className="text-[11px] sm:text-xs">نمای جدولی</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="h-3.5 w-3.5 text-[#A68A64]" />
                  <span className="text-[11px] sm:text-xs">نمای کارتی</span>
                </>
              )}
            </button>

            {/* Export Excel */}
            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 rounded-xl bg-[#2E6F40] hover:bg-[#255833] text-white px-2.5 sm:px-3 py-1.5 text-xs font-semibold shadow-sm transition-all"
              title="دانلود فایل اکسل کارکرد"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span className="hidden xs:inline text-[11px] sm:text-xs">اکسل</span>
            </button>

            {/* Print / PDF */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 rounded-xl border border-[#D1D5DB] bg-white hover:bg-[#F5F0E6] text-[#1F2933] px-2.5 py-1.5 text-xs font-semibold transition-all shadow-sm"
              title="چاپ یا ذخیره PDF"
            >
              <Printer className="h-3.5 w-3.5 text-[#6B7280]" />
              <span className="hidden sm:inline text-xs">چاپ</span>
            </button>
          </div>
        </div>

        {/* Row 2: Filter Chips & Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs no-scrollbar">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl shrink-0 transition-all ${
                filterType === 'all'
                  ? 'bg-[#A68A64] text-white font-bold shadow-sm'
                  : 'bg-[#F7F7F2] text-[#6B7280] hover:text-[#1F2933] border border-[#D1D5DB]'
              }`}
            >
              همه روزها ({toPersianDigits(monthRecords.length)})
            </button>
            <button
              onClick={() => setFilterType('delays')}
              className={`px-3 py-1.5 rounded-xl shrink-0 transition-all ${
                filterType === 'delays'
                  ? 'bg-rose-50 text-[#B91C1C] border border-rose-200 font-bold'
                  : 'bg-[#F7F7F2] text-[#6B7280] hover:text-[#B91C1C] border border-[#D1D5DB]'
              }`}
            >
              تاخیر / تعجیل
            </button>
            <button
              onClick={() => setFilterType('overtime')}
              className={`px-3 py-1.5 rounded-xl shrink-0 transition-all ${
                filterType === 'overtime'
                  ? 'bg-emerald-50 text-[#2E6F40] border border-emerald-200 font-bold'
                  : 'bg-[#F7F7F2] text-[#6B7280] hover:text-[#2E6F40] border border-[#D1D5DB]'
              }`}
            >
              اضافه کاری
            </button>
            <button
              onClick={() => setFilterType('thursdays')}
              className={`px-3 py-1.5 rounded-xl shrink-0 transition-all ${
                filterType === 'thursdays'
                  ? 'bg-[#F5F0E6] text-[#A68A64] border border-[#A68A64]/40 font-bold'
                  : 'bg-[#F7F7F2] text-[#6B7280] hover:text-[#A68A64] border border-[#D1D5DB]'
              }`}
            >
              پنج‌شنبه‌ها
            </button>
            <button
              onClick={() => setFilterType('leaves')}
              className={`px-3 py-1.5 rounded-xl shrink-0 transition-all ${
                filterType === 'leaves'
                  ? 'bg-amber-50 text-[#D97706] border border-amber-200 font-bold'
                  : 'bg-[#F7F7F2] text-[#6B7280] hover:text-[#D97706] border border-[#D1D5DB]'
              }`}
            >
              مرخصی‌ها
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative flex items-center shrink-0">
            <Search className="absolute right-2.5 h-3.5 w-3.5 text-[#6B7280] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در یادداشت یا تاریخ..."
              className="w-full sm:w-48 bg-[#F7F7F2] border border-[#D1D5DB] rounded-xl pr-8 pl-3 py-1 text-xs text-[#1F2933] placeholder-[#6B7280] focus:outline-none focus:border-[#A68A64] focus:ring-1 focus:ring-[#A68A64] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* VIEW 1: Cards View */}
      {viewMode === 'cards' && (
        <div className="mt-4 space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-[#6B7280] bg-[#F7F7F2] rounded-2xl border border-[#D1D5DB]">
              <Calendar className="h-8 w-8 text-[#A68A64] mx-auto mb-2 opacity-60" />
              <span className="text-xs">هیچ ترددی برای این فیلتر یا تاریخ ثبت نشده است.</span>
            </div>
          ) : (
            filteredRecords.map((r) => {
              const weekdayName = PERSIAN_WEEKDAY_NAMES[r.dayOfWeek] || '';
              const isLate = r.delayMinutes > 0;
              const hasOT = r.overtimeMinutes > 0 || r.holidayOvertimeMinutes > 0;

              return (
                <div
                  key={r.id}
                  className={`rounded-2xl border p-4 transition-all shadow-sm ${
                    r.isHoliday
                      ? 'border-rose-200 bg-rose-50/40'
                      : 'border-[#D1D5DB] bg-white hover:border-[#A68A64]'
                  }`}
                >
                  {/* Top row: Date + Weekday + Status */}
                  <div className="flex items-center justify-between border-b border-[#D1D5DB]/70 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          r.dayOfWeek === 6
                            ? 'text-[#B91C1C]'
                            : r.dayOfWeek === 5
                            ? 'text-[#A68A64]'
                            : 'text-[#1F2933]'
                        }`}
                      >
                        {weekdayName}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#1F2933] tabular-nums">
                        {toPersianDigits(r.date)}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {r.status === 'present' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-[#2E6F40] border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          حاضر
                        </span>
                      )}
                      {r.status === 'in_progress' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#2E6F40]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#2E6F40] border border-[#2E6F40]/25">
                          <Clock className="h-3 w-3 animate-pulse" />
                          در حال کار
                        </span>
                      )}
                      {r.status === 'leave' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-[#D97706] border border-amber-200">
                          مرخصی
                        </span>
                      )}
                      {r.status === 'absent' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-[#B91C1C] border border-rose-200">
                          غایب
                        </span>
                      )}
                      {(r.status === 'holiday' || r.status === 'weekend') && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F7F7F2] px-2.5 py-0.5 text-[10px] font-semibold text-[#6B7280] border border-[#D1D5DB]">
                          {r.holidayTitle || (r.dayOfWeek === 6 ? 'جمعه' : 'تعطیل')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Grid: Check In, Check Out, Net Worked */}
                  <div className="grid grid-cols-3 gap-2 text-center bg-[#F7F7F2] p-2.5 rounded-xl border border-[#D1D5DB] text-xs">
                    <div>
                      <span className="text-[10px] text-[#6B7280] block mb-0.5">ورود</span>
                      <span className="font-mono font-bold text-[#1F2933] text-xs">
                        {r.checkIn ? toPersianDigits(r.checkIn) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B7280] block mb-0.5">خروج</span>
                      <span className="font-mono font-bold text-[#1F2933] text-xs">
                        {r.checkOut ? toPersianDigits(r.checkOut) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B7280] block mb-0.5">کارکرد خالص</span>
                      <span className="font-mono font-bold text-[#2E6F40] text-xs">
                        {r.workedMinutes > 0
                          ? toPersianDigits(formatMinutesToTimeString(r.workedMinutes))
                          : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Badges row: Delays, Overtime, Deficit, Target Departure, Leave */}
                  {(isLate ||
                    hasOT ||
                    r.deficitMinutes > 0 ||
                    r.earlyLeaveMinutes > 0 ||
                    r.breakMinutes > 0 ||
                    (r.leaveMinutes !== undefined && r.leaveMinutes > 0)) && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[10px]">
                      {r.targetCheckOut && (
                        <span className="rounded-lg bg-[#F7F7F2] px-2 py-0.5 text-[#6B7280] border border-[#D1D5DB] font-mono">
                          خروج هدف: {toPersianDigits(r.targetCheckOut)}
                        </span>
                      )}
                      {r.leaveMinutes !== undefined && r.leaveMinutes > 0 && (
                        <span
                          className="rounded-lg bg-amber-50 px-2 py-0.5 text-[#D97706] font-bold border border-amber-200"
                          title={`مرخصی ساعتی: ${formatMinutesToPersianReadable(r.leaveMinutes)}`}
                        >
                          مرخصی: {r.leaveMinutes >= 60 ? toPersianDigits(formatMinutesToTimeString(r.leaveMinutes)) : `${toPersianDigits(r.leaveMinutes)}د`}
                        </span>
                      )}
                      {r.breakMinutes > 0 && (
                        <span className="rounded-lg bg-[#F7F7F2] px-2 py-0.5 text-[#6B7280] border border-[#D1D5DB]">
                          ناهار: {toPersianDigits(r.breakMinutes)}د
                        </span>
                      )}
                      {isLate && (
                        <span className="rounded-lg bg-rose-50 px-2 py-0.5 text-[#B91C1C] font-bold border border-rose-200">
                          تاخیر: {toPersianDigits(r.delayMinutes)}د
                        </span>
                      )}
                      {r.earlyLeaveMinutes > 0 && (
                        <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[#D97706] font-bold border border-amber-200">
                          تعجیل: {toPersianDigits(r.earlyLeaveMinutes)}د
                        </span>
                      )}
                      {hasOT && (
                        <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[#2E6F40] font-bold border border-emerald-200">
                          اضافه کار:{' '}
                          {toPersianDigits(
                            formatMinutesToTimeString(r.overtimeMinutes + r.holidayOvertimeMinutes)
                          )}
                          {r.holidayOvertimeMinutes > 0 && ' (ت)'}
                        </span>
                      )}
                      {r.deficitMinutes > 0 && (
                        <span className="rounded-lg bg-rose-50 px-2 py-0.5 text-[#B91C1C] font-bold border border-rose-200">
                          کسر کار: {toPersianDigits(r.deficitMinutes)}د
                        </span>
                      )}
                      {r.netBalanceMinutes !== 0 && (
                        <span
                          className={`rounded-lg px-2 py-0.5 font-bold font-mono ${
                            r.netBalanceMinutes > 0
                              ? 'bg-emerald-50 text-[#2E6F40] border border-emerald-200'
                              : 'bg-rose-50 text-[#B91C1C] border border-rose-200'
                          }`}
                        >
                          تراز:{' '}
                          {r.netBalanceMinutes > 0 ? '+' : '-'}
                          {toPersianDigits(
                            formatMinutesToTimeString(Math.abs(r.netBalanceMinutes))
                          )}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Note row */}
                  {r.note && (
                    <p className="mt-2 text-[11px] text-[#6B7280] bg-[#F7F7F2] p-2 rounded-lg border border-[#D1D5DB]">
                      📝 {r.note}
                    </p>
                  )}

                  {/* Actions footer */}
                  <div className="flex items-center justify-between border-t border-[#D1D5DB] pt-2 mt-2.5">
                    <span className="text-[10px] text-[#6B7280] font-mono">
                      #{r.id.slice(-6)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditRecord(r)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#F5F0E6] text-[#A68A64] text-xs font-semibold border border-[#D1D5DB] transition-colors"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>ویرایش</span>
                      </button>
                      <button
                        onClick={() => onDeleteRecord(r.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-[#B91C1C] text-xs font-semibold border border-[#D1D5DB] hover:border-rose-200 transition-colors"
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

          {/* Mobile Totals Footer Card */}
          {filteredRecords.length > 0 && (
            <div className="rounded-2xl border border-[#A68A64]/30 bg-[#F5F0E6] p-4 shadow-sm text-xs space-y-2 text-[#1F2933]">
              <div className="font-bold flex items-center justify-between">
                <span>جمع کل روزهای نمایش‌داده‌شده:</span>
                <span className="text-[#2E6F40] font-mono text-sm font-black">
                  {toPersianDigits((visibleTotals.worked / 60).toFixed(1))} ساعت کار مفید
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-2 border-t border-[#D1D5DB]">
                <div>
                  <span className="text-[#6B7280] block">اضافه کاری</span>
                  <span className="font-bold text-[#2E6F40] font-mono">
                    {toPersianDigits((visibleTotals.overtime / 60).toFixed(1))} س
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block">تاخیر ورود</span>
                  <span className="font-bold text-[#B91C1C] font-mono">
                    {toPersianDigits(visibleTotals.delay)} د
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block">تراز نهایی</span>
                  <span
                    className={`font-black font-mono ${
                      visibleTotals.balance >= 0 ? 'text-[#2E6F40]' : 'text-[#B91C1C]'
                    }`}
                  >
                    {visibleTotals.balance >= 0 ? '+' : '-'}
                    {toPersianDigits((Math.abs(visibleTotals.balance) / 60).toFixed(1))} س
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Desktop Full Table View */}
      {viewMode === 'table' && (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[#D1D5DB]">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#F5F0E6] text-[#1F2933] border-b border-[#D1D5DB]">
              <tr>
                <th className="py-3.5 px-3 font-bold">تاریخ</th>
                <th className="py-3.5 px-3 font-bold">روز</th>
                <th className="py-3.5 px-3 font-bold text-center">وضعیت</th>
                <th className="py-3.5 px-3 font-bold text-center">ورود</th>
                <th className="py-3.5 px-3 font-bold text-center">خروج</th>
                <th className="py-3.5 px-3 font-bold text-center">خروج هدف</th>
                <th className="py-3.5 px-3 font-bold text-center">ناهار</th>
                <th className="py-3.5 px-3 font-bold text-center">کارکرد مفید</th>
                <th className="py-3.5 px-3 font-bold text-center">تاخیر</th>
                <th className="py-3.5 px-3 font-bold text-center">اضافه کاری</th>
                <th className="py-3.5 px-3 font-bold text-center">کسر کار</th>
                <th className="py-3.5 px-3 font-bold text-center">تراز روز</th>
                <th className="py-3.5 px-4 font-bold">یادداشت</th>
                <th className="py-3.5 px-3 font-bold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1D5DB]/70">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-[#6B7280]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Calendar className="h-8 w-8 text-[#A68A64] opacity-50" />
                      <span>هیچ ترددی برای این ماه یا فیلتر انتخابی ثبت نشده است.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const weekdayName = PERSIAN_WEEKDAY_NAMES[r.dayOfWeek] || '';
                  const isLate = r.delayMinutes > 0;
                  const hasOT = r.overtimeMinutes > 0 || r.holidayOvertimeMinutes > 0;

                  return (
                    <tr
                      key={r.id}
                      className={`transition-colors hover:bg-[#F5F0E6]/50 ${
                        r.isHoliday ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      {/* Date */}
                      <td className="py-3 px-3 font-mono font-medium text-[#1F2933] tabular-nums">
                        {toPersianDigits(r.date)}
                      </td>

                      {/* Weekday */}
                      <td className="py-3 px-3 text-[#1F2933]">
                        <span
                          className={
                            r.dayOfWeek === 6
                              ? 'text-[#B91C1C] font-bold'
                              : r.dayOfWeek === 5
                              ? 'text-[#A68A64] font-semibold'
                              : ''
                          }
                        >
                          {weekdayName}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {r.status === 'present' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-[#2E6F40] border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              حاضر
                            </span>
                          )}
                          {r.leaveMinutes !== undefined && r.leaveMinutes > 0 && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-[#D97706] border border-amber-200"
                              title={`مرخصی ساعتی: ${formatMinutesToPersianReadable(r.leaveMinutes)}`}
                            >
                              مرخصی {r.leaveMinutes >= 60 ? toPersianDigits(formatMinutesToTimeString(r.leaveMinutes)) : `${toPersianDigits(r.leaveMinutes)}د`}
                            </span>
                          )}
                          {r.status === 'in_progress' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#2E6F40]/10 px-2 py-0.5 text-[11px] font-bold text-[#2E6F40] border border-[#2E6F40]/25">
                              <Clock className="h-3 w-3 animate-pulse" />
                              در حال کار
                            </span>
                          )}
                          {r.status === 'leave' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-[#D97706] border border-amber-200">
                              مرخصی
                            </span>
                          )}
                          {r.status === 'absent' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-[#B91C1C] border border-rose-200">
                              غایب
                            </span>
                          )}
                          {(r.status === 'holiday' || r.status === 'weekend') && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#F7F7F2] px-2 py-0.5 text-[11px] font-semibold text-[#6B7280] border border-[#D1D5DB]">
                              {r.holidayTitle || (r.dayOfWeek === 6 ? 'جمعه' : 'تعطیل')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Check In */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-[#1F2933]">
                        {r.checkIn ? toPersianDigits(r.checkIn) : '-'}
                      </td>

                      {/* Check Out */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-[#1F2933]">
                        {r.checkOut ? toPersianDigits(r.checkOut) : '-'}
                      </td>

                      {/* Target Check Out */}
                      <td className="py-3 px-3 text-center font-mono text-[#6B7280]">
                        {r.targetCheckOut ? toPersianDigits(r.targetCheckOut) : '-'}
                      </td>

                      {/* Break */}
                      <td className="py-3 px-3 text-center text-[#6B7280] font-mono">
                        {r.breakMinutes > 0 ? `${toPersianDigits(r.breakMinutes)} د` : '-'}
                      </td>

                      {/* Worked Time */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-[#2E6F40]">
                        {r.workedMinutes > 0 ? (
                          <span>
                            {toPersianDigits(formatMinutesToTimeString(r.workedMinutes))}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Delay */}
                      <td className="py-3 px-3 text-center font-mono">
                        {isLate ? (
                          <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[#B91C1C] font-bold border border-rose-200">
                            {toPersianDigits(r.delayMinutes)} د
                          </span>
                        ) : (
                          <span className="text-[#D1D5DB]">-</span>
                        )}
                      </td>

                      {/* Overtime */}
                      <td className="py-3 px-3 text-center font-mono">
                        {hasOT ? (
                          <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[#2E6F40] font-bold border border-emerald-200">
                            {toPersianDigits(
                              formatMinutesToTimeString(r.overtimeMinutes + r.holidayOvertimeMinutes)
                            )}
                            {r.holidayOvertimeMinutes > 0 && ' (ت)'}
                          </span>
                        ) : (
                          <span className="text-[#D1D5DB]">-</span>
                        )}
                      </td>

                      {/* Deficit */}
                      <td className="py-3 px-3 text-center font-mono">
                        {r.deficitMinutes > 0 ? (
                          <span
                            className="text-[#B91C1C] font-bold"
                            title={formatMinutesToPersianReadable(r.deficitMinutes)}
                          >
                            {r.deficitMinutes >= 60
                              ? `${toPersianDigits(formatMinutesToTimeString(r.deficitMinutes))} س`
                              : `${toPersianDigits(r.deficitMinutes)} د`}
                          </span>
                        ) : (
                          <span className="text-[#D1D5DB]">-</span>
                        )}
                      </td>

                      {/* Net Balance */}
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {r.netBalanceMinutes > 0 ? (
                          <span className="text-[#2E6F40]">
                            +{toPersianDigits(formatMinutesToTimeString(r.netBalanceMinutes))}
                          </span>
                        ) : r.netBalanceMinutes < 0 ? (
                          <span className="text-[#B91C1C]">
                            -{toPersianDigits(formatMinutesToTimeString(Math.abs(r.netBalanceMinutes)))}
                          </span>
                        ) : (
                          <span className="text-[#6B7280]">۰</span>
                        )}
                      </td>

                      {/* Note */}
                      <td className="py-3 px-4 text-[#6B7280] max-w-xs truncate text-[11px]">
                        {r.note || '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEditRecord(r)}
                            className="p-1 rounded-lg text-[#6B7280] hover:text-[#A68A64] hover:bg-[#F5F0E6] transition-colors"
                            title="ویرایش تردد"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(r.id)}
                            className="p-1 rounded-lg text-[#6B7280] hover:text-[#B91C1C] hover:bg-rose-50 transition-colors"
                            title="حذف تردد"
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
              <tfoot className="bg-[#F7F7F2] font-semibold text-[#1F2933] border-t-2 border-[#D1D5DB]">
                <tr>
                  <td colSpan={7} className="py-3.5 px-4 text-left font-bold text-[#1F2933]">
                    مجموع اقلام جدول:
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono text-[#2E6F40] font-bold">
                    {toPersianDigits((visibleTotals.worked / 60).toFixed(1))} س
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono text-[#B91C1C]">
                    {toPersianDigits(visibleTotals.delay)} د
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono text-[#2E6F40] font-bold">
                    {toPersianDigits((visibleTotals.overtime / 60).toFixed(1))} س
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono text-[#D97706]">
                    {visibleTotals.deficit >= 60
                      ? `${toPersianDigits((visibleTotals.deficit / 60).toFixed(1))} س`
                      : `${toPersianDigits(visibleTotals.deficit)} د`}
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-black">
                    <span
                      className={
                        visibleTotals.balance >= 0 ? 'text-[#2E6F40]' : 'text-[#B91C1C]'
                      }
                    >
                      {visibleTotals.balance >= 0 ? '+' : '-'}
                      {toPersianDigits((Math.abs(visibleTotals.balance) / 60).toFixed(1))} س
                    </span>
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceTable;
