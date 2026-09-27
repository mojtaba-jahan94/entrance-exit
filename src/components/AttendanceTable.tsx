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
} from 'lucide-react';
import { AttendanceRecord, ShiftConfig } from '../types';
import {
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEKDAY_NAMES,
  toPersianDigits,
  formatMinutesToTimeString,
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
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl">
      {/* Table Header Controls */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        {/* Month & Year Selectors with Navigation */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
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
              className="bg-transparent px-3 py-1.5 text-sm font-bold text-white focus:outline-none cursor-pointer"
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
              className="bg-transparent px-2 py-1.5 text-sm font-bold text-indigo-400 focus:outline-none cursor-pointer font-mono"
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

          <span className="text-xs text-slate-400 px-2 hidden sm:inline">
            روزهای ثبت‌شده: <strong className="text-white font-mono">{toPersianDigits(monthRecords.length)}</strong>
          </span>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/50 p-1 rounded-2xl border border-slate-800/80 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            همه روزها
          </button>
          <button
            onClick={() => setFilterType('delays')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterType === 'delays'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            تاخیر / تعجیل
          </button>
          <button
            onClick={() => setFilterType('overtime')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterType === 'overtime'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            اضافه کاری
          </button>
          <button
            onClick={() => setFilterType('thursdays')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterType === 'thursdays'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                : 'text-slate-400 hover:text-cyan-400'
            }`}
          >
            پنج‌شنبه‌ها
          </button>
          <button
            onClick={() => setFilterType('leaves')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterType === 'leaves'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            مرخصی‌ها
          </button>
        </div>

        {/* Export & Print Buttons */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="دانلود فایل اکسل کارکرد"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>خروجی اکسل</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-2 text-xs font-semibold transition-all"
            title="چاپ کارکرد یا ذخیره PDF"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">چاپ / PDF</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
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
                      <span className={r.dayOfWeek === 6 ? 'text-rose-400 font-bold' : r.dayOfWeek === 5 ? 'text-cyan-400 font-medium' : ''}>
                        {weekdayName}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center">
                      {r.status === 'present' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          حاضر
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
                        <span className="text-amber-400">
                          {toPersianDigits(r.deficitMinutes)} د
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
                  {toPersianDigits(visibleTotals.deficit)} د
                </td>
                <td className="py-3.5 px-3 text-center font-mono font-black">
                  <span className={visibleTotals.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
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
    </div>
  );
};

