import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Filter,
  Edit2,
  Trash2,
  Clock,
  AlertCircle,
  Plus,
  CheckCircle2,
  AlertTriangle,
  MinusCircle,
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
  config,
  onYearChange,
  onMonthChange,
  onEditRecord,
  onDeleteRecord,
  onAddNewForDate,
  onExportExcel,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'table'
  );

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

  const monthName = PERSIAN_MONTH_NAMES[selectedMonth - 1] || '';

  return (
    <div className="rounded-[26px] sm:rounded-[32px] border border-white/[0.08] bg-[#141824]/90 p-4 sm:p-6 shadow-2xl backdrop-blur-2xl">
      {/* Table Header Controls */}
      <div className="flex flex-col gap-3.5 border-b border-slate-800/80 pb-4">
        {/* Row 1: Month/Year Nav + View Switcher + Record Count */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Month & Year Selectors */}
          <div className="flex items-center rounded-2xl bg-slate-950/70 border border-slate-800 p-1">
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="ماه بعد"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Month Select */}
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
              className="bg-transparent px-2.5 py-1 text-xs sm:text-sm font-bold text-white focus:outline-none cursor-pointer"
            >
              {PERSIAN_MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1} className="bg-slate-900 text-white">
                  {name}
                </option>
              ))}
            </select>

            {/* Year Select */}
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
              className="bg-transparent px-1.5 py-1 text-xs sm:text-sm font-bold text-indigo-400 focus:outline-none cursor-pointer font-mono"
            >
              {[1402, 1403, 1404, 1405, 1406].map((yr) => (
                <option key={yr} value={yr} className="bg-slate-900 text-white">
                  {toPersianDigits(yr)}
                </option>
              ))}
            </select>

            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="ماه قبل"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Right side: View Switcher (Cards vs Table) & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* View Mode Switcher Button */}
            <button
              onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:bg-slate-850 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-all"
              title="تغییر نحوه نمایش"
            >
              {viewMode === 'cards' ? (
                <>
                  <TableIcon className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="text-[11px] sm:text-xs">نمای جدولی</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-[11px] sm:text-xs">نمای کارتی</span>
                </>
              )}
            </button>

            {/* Export Excel */}
            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 sm:px-3 py-1.5 text-xs font-semibold shadow-sm transition-all"
              title="دانلود اکسل"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span className="hidden xs:inline text-[11px] sm:text-xs">اکسل</span>
            </button>

            {/* Print / PDF */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1.5 text-xs font-semibold transition-all"
              title="چاپ یا ذخیره PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">چاپ</span>
            </button>
          </div>
        </div>

        {/* Row 2: Smooth Horizontal Scrollable Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs no-scrollbar">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition-all ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'bg-slate-950/50 text-slate-400 hover:text-white border border-slate-800/80'
            }`}
          >
            همه روزها ({toPersianDigits(monthRecords.length)})
          </button>
          <button
            onClick={() => setFilterType('delays')}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition-all ${
              filterType === 'delays'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
                : 'bg-slate-950/50 text-slate-400 hover:text-rose-400 border border-slate-800/80'
            }`}
          >
            تاخیر / تعجیل
          </button>
          <button
            onClick={() => setFilterType('overtime')}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition-all ${
              filterType === 'overtime'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'bg-slate-950/50 text-slate-400 hover:text-emerald-400 border border-slate-800/80'
            }`}
          >
            اضافه کاری
          </button>
          <button
            onClick={() => setFilterType('thursdays')}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition-all ${
              filterType === 'thursdays'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                : 'bg-slate-950/50 text-slate-400 hover:text-cyan-400 border border-slate-800/80'
            }`}
          >
            پنج‌شنبه‌ها
          </button>
          <button
            onClick={() => setFilterType('leaves')}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition-all ${
              filterType === 'leaves'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                : 'bg-slate-950/50 text-slate-400 hover:text-amber-400 border border-slate-800/80'
            }`}
          >
            مرخصی‌ها
          </button>
        </div>
      </div>

      {/* VIEW 1: Mobile Cards View */}
      {viewMode === 'cards' && (
        <div className="mt-4 space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="py-10 text-center text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800">
              <Calendar className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <span className="text-xs">هیچ ترددی برای این فیلتر ثبت نشده است.</span>
            </div>
          ) : (
            filteredRecords.map((r) => {
              const weekdayName = PERSIAN_WEEKDAY_NAMES[r.dayOfWeek] || '';
              const isLate = r.delayMinutes > 0;
              const hasOT = r.overtimeMinutes > 0 || r.holidayOvertimeMinutes > 0;

              return (
                <div
                  key={r.id}
                  className={`rounded-2xl border p-3.5 transition-all shadow-md ${
                    r.isHoliday
                      ? 'border-rose-900/40 bg-rose-950/20'
                      : 'border-slate-800/90 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  {/* Top row: Date + Weekday + Status */}
                  <div className="flex items-center justify-between border-b border-slate-800/70 pb-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          r.dayOfWeek === 6
                            ? 'text-rose-400'
                            : r.dayOfWeek === 5
                            ? 'text-cyan-400'
                            : 'text-slate-200'
                        }`}
                      >
                        {weekdayName}
                      </span>
                      <span className="font-mono text-xs font-semibold text-white">
                        {toPersianDigits(r.date)}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {r.status === 'present' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/25">
                          <CheckCircle2 className="h-3 w-3" />
                          حاضر
                        </span>
                      )}
                      {r.status === 'in_progress' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/25">
                          <Clock className="h-3 w-3 animate-pulse" />
                          در حال کار
                        </span>
                      )}
                      {r.status === 'leave' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/25">
                          مرخصی
                        </span>
                      )}
                      {r.status === 'absent' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-400 border border-rose-500/25">
                          غایب
                        </span>
                      )}
                      {(r.status === 'holiday' || r.status === 'weekend') && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700">
                          {r.holidayTitle || (r.dayOfWeek === 6 ? 'جمعه' : 'تعطیل')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Grid: Check In, Check Out, Net Worked, Break */}
                  <div className="grid grid-cols-3 gap-2 text-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-850 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">ورود</span>
                      <span className="font-mono font-bold text-white text-xs">
                        {r.checkIn ? toPersianDigits(r.checkIn) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">خروج</span>
                      <span className="font-mono font-bold text-white text-xs">
                        {r.checkOut ? toPersianDigits(r.checkOut) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">کارکرد خالص</span>
                      <span className="font-mono font-black text-emerald-400 text-xs">
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
                        <span className="rounded-lg bg-slate-900 px-2 py-0.5 text-cyan-300 border border-slate-800 font-mono">
                          خروج هدف: {toPersianDigits(r.targetCheckOut)}
                        </span>
                      )}
                      {r.leaveMinutes !== undefined && r.leaveMinutes > 0 && (
                        <span
                          className="rounded-lg bg-amber-500/20 px-2 py-0.5 text-amber-300 font-semibold border border-amber-500/30"
                          title={`مرخصی ساعتی: ${formatMinutesToPersianReadable(r.leaveMinutes)}`}
                        >
                          مرخصی: {r.leaveMinutes >= 60 ? toPersianDigits(formatMinutesToTimeString(r.leaveMinutes)) : `${toPersianDigits(r.leaveMinutes)}د`}
                        </span>
                      )}
                      {r.breakMinutes > 0 && (
                        <span className="rounded-lg bg-slate-900 px-2 py-0.5 text-slate-300 border border-slate-800">
                          ناهار: {toPersianDigits(r.breakMinutes)}د
                        </span>
                      )}
                      {isLate && (
                        <span className="rounded-lg bg-rose-500/15 px-2 py-0.5 text-rose-300 font-semibold border border-rose-500/25">
                          تاخیر: {toPersianDigits(r.delayMinutes)}د
                        </span>
                      )}
                      {r.earlyLeaveMinutes > 0 && (
                        <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-amber-300 font-semibold border border-amber-500/25">
                          تعجیل: {toPersianDigits(r.earlyLeaveMinutes)}د
                        </span>
                      )}
                      {hasOT && (
                        <span className="rounded-lg bg-indigo-500/15 px-2 py-0.5 text-indigo-300 font-semibold border border-indigo-500/25">
                          اضافه کار:{' '}
                          {toPersianDigits(
                            formatMinutesToTimeString(r.overtimeMinutes + r.holidayOvertimeMinutes)
                          )}
                          {r.holidayOvertimeMinutes > 0 && ' (ت)'}
                        </span>
                      )}
                      {r.deficitMinutes > 0 && (
                        <span className="rounded-lg bg-rose-500/15 px-2 py-0.5 text-rose-300 border border-rose-500/25">
                          کسر کار: {toPersianDigits(r.deficitMinutes)}د
                        </span>
                      )}
                      {r.netBalanceMinutes !== 0 && (
                        <span
                          className={`rounded-lg px-2 py-0.5 font-bold font-mono ${
                            r.netBalanceMinutes > 0
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
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
                    <p className="mt-2 text-[11px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
                      📝 {r.note}
                    </p>
                  )}

                  {/* Actions footer */}
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 mt-2.5">
                    <span className="text-[10px] text-slate-500 font-mono">
                      #{r.id.slice(-6)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditRecord(r)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 text-xs font-medium border border-slate-800 transition-colors"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>ویرایش</span>
                      </button>
                      <button
                        onClick={() => onDeleteRecord(r.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-rose-400 text-xs font-medium border border-slate-800 hover:border-rose-900/40 transition-colors"
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
            <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 to-slate-900 p-3.5 shadow-lg text-xs space-y-2">
              <div className="font-bold text-white flex items-center justify-between">
                <span>جمع کل روزهای نمایش‌داده‌شده:</span>
                <span className="text-emerald-400 font-mono text-sm">
                  {toPersianDigits((visibleTotals.worked / 60).toFixed(1))} ساعت کار مفید
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1 border-t border-slate-800/80">
                <div>
                  <span className="text-slate-400 block">اضافه کاری</span>
                  <span className="font-bold text-indigo-300 font-mono">
                    {toPersianDigits((visibleTotals.overtime / 60).toFixed(1))} س
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">تاخیر ورود</span>
                  <span className="font-bold text-rose-400 font-mono">
                    {toPersianDigits(visibleTotals.delay)} د
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">تراز نهایی</span>
                  <span
                    className={`font-black font-mono ${
                      visibleTotals.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
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
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-800/80">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-3 font-semibold">تاریخ</th>
                <th className="py-3.5 px-3 font-semibold">روز</th>
                <th className="py-3.5 px-3 font-semibold text-center">وضعیت</th>
                <th className="py-3.5 px-3 font-semibold text-center">ورود</th>
                <th className="py-3.5 px-3 font-semibold text-center">خروج</th>
                <th className="py-3.5 px-3 font-semibold text-center">خروج هدف</th>
                <th className="py-3.5 px-3 font-semibold text-center">ناهار</th>
                <th className="py-3.5 px-3 font-semibold text-center">کارکرد مفید</th>
                <th className="py-3.5 px-3 font-semibold text-center">تاخیر</th>
                <th className="py-3.5 px-3 font-semibold text-center">اضافه کاری</th>
                <th className="py-3.5 px-3 font-semibold text-center">کسر کار</th>
                <th className="py-3.5 px-3 font-semibold text-center">تراز روز</th>
                <th className="py-3.5 px-4 font-semibold">یادداشت</th>
                <th className="py-3.5 px-3 font-semibold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Calendar className="h-8 w-8 text-slate-600" />
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
                      className={`transition-colors hover:bg-slate-800/40 ${
                        r.isHoliday ? 'bg-rose-950/15' : ''
                      }`}
                    >
                      {/* Date */}
                      <td className="py-3 px-3 font-mono font-medium text-slate-200">
                        {toPersianDigits(r.date)}
                      </td>

                      {/* Weekday */}
                      <td className="py-3 px-3 text-slate-300">
                        <span
                          className={
                            r.dayOfWeek === 6
                              ? 'text-rose-400 font-bold'
                              : r.dayOfWeek === 5
                              ? 'text-cyan-400 font-medium'
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
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" />
                              حاضر
                            </span>
                          )}
                          {r.leaveMinutes !== undefined && r.leaveMinutes > 0 && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20"
                              title={`مرخصی ساعتی ثبت شده: ${formatMinutesToPersianReadable(r.leaveMinutes)}`}
                            >
                              مرخصی {r.leaveMinutes >= 60 ? toPersianDigits(formatMinutesToTimeString(r.leaveMinutes)) : `${toPersianDigits(r.leaveMinutes)}د`}
                            </span>
                          )}
                          {r.status === 'in_progress' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-400 border border-cyan-500/20">
                              <Clock className="h-3 w-3 animate-pulse" />
                              در حال کار
                            </span>
                          )}
                          {r.status === 'leave' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/20">
                              مرخصی
                            </span>
                          )}
                          {r.status === 'absent' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-400 border border-rose-500/20">
                              غایب
                            </span>
                          )}
                          {(r.status === 'holiday' || r.status === 'weekend') && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400 border border-slate-700">
                              {r.holidayTitle || (r.dayOfWeek === 6 ? 'جمعه' : 'تعطیل')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Check In */}
                      <td className="py-3 px-3 text-center font-mono font-semibold text-slate-200">
                        {r.checkIn ? toPersianDigits(r.checkIn) : '-'}
                      </td>

                      {/* Check Out */}
                      <td className="py-3 px-3 text-center font-mono font-semibold text-slate-200">
                        {r.checkOut ? toPersianDigits(r.checkOut) : '-'}
                      </td>

                      {/* Target Check Out */}
                      <td className="py-3 px-3 text-center font-mono text-cyan-300">
                        {r.targetCheckOut ? toPersianDigits(r.targetCheckOut) : '-'}
                      </td>

                      {/* Break */}
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {r.breakMinutes > 0 ? `${toPersianDigits(r.breakMinutes)} د` : '-'}
                      </td>

                      {/* Worked Time */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-white">
                        {r.workedMinutes > 0 ? (
                          <span className="text-emerald-300">
                            {toPersianDigits(formatMinutesToTimeString(r.workedMinutes))}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Delay */}
                      <td className="py-3 px-3 text-center font-mono">
                        {isLate ? (
                          <span className="rounded-md bg-rose-500/10 px-1.5 py-0.5 text-rose-400 font-bold border border-rose-500/20">
                            {toPersianDigits(r.delayMinutes)} د
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Overtime */}
                      <td className="py-3 px-3 text-center font-mono">
                        {hasOT ? (
                          <span className="rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-indigo-300 font-bold border border-indigo-500/20">
                            {toPersianDigits(
                              formatMinutesToTimeString(r.overtimeMinutes + r.holidayOvertimeMinutes)
                            )}
                            {r.holidayOvertimeMinutes > 0 && ' (ت)'}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Deficit */}
                      <td className="py-3 px-3 text-center font-mono">
                        {r.deficitMinutes > 0 ? (
                          <span
                            className="text-amber-400"
                            title={formatMinutesToPersianReadable(r.deficitMinutes)}
                          >
                            {r.deficitMinutes >= 60
                              ? `${toPersianDigits(formatMinutesToTimeString(r.deficitMinutes))} س`
                              : `${toPersianDigits(r.deficitMinutes)} د`}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Net Balance */}
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {r.netBalanceMinutes > 0 ? (
                          <span className="text-emerald-400">
                            +{toPersianDigits(formatMinutesToTimeString(r.netBalanceMinutes))}
                          </span>
                        ) : r.netBalanceMinutes < 0 ? (
                          <span className="text-rose-400">
                            -{toPersianDigits(formatMinutesToTimeString(Math.abs(r.netBalanceMinutes)))}
                          </span>
                        ) : (
                          <span className="text-slate-600">۰</span>
                        )}
                      </td>

                      {/* Note */}
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate text-[11px]">
                        {r.note || '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEditRecord(r)}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                            title="ویرایش تردد"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(r.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
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
              <tfoot className="bg-slate-950 font-semibold text-slate-300 border-t-2 border-slate-800">
                <tr>
                  <td colSpan={7} className="py-3.5 px-4 text-left font-bold text-white">
                    مجموع اقلام جدول:
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono text-emerald-300 font-bold">
                    {toPersianDigits((visibleTotals.worked / 60).toFixed(1))} س
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono text-rose-300">
                    {toPersianDigits(visibleTotals.delay)} د
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono text-indigo-300 font-bold">
                    {toPersianDigits((visibleTotals.overtime / 60).toFixed(1))} س
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono text-amber-300">
                    {visibleTotals.deficit >= 60
                      ? `${toPersianDigits((visibleTotals.deficit / 60).toFixed(1))} س`
                      : `${toPersianDigits(visibleTotals.deficit)} د`}
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-black">
                    <span
                      className={
                        visibleTotals.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
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

