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
    <div className="rounded-2xl border border-black/[0.08] bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Table Header Controls */}
      <div className="flex flex-col gap-4 border-b border-black/[0.06] pb-4">
        {/* Row 1: Month/Year Nav + View Switcher + Record Count */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Month & Year Selectors */}
          <div className="flex items-center rounded-xl bg-black/[0.02] border border-black/10 p-1">
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-black/50 hover:text-black hover:bg-black/[0.04] transition-colors"
              title="ماه بعد"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Month Select */}
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
              className="bg-transparent px-2.5 py-1 text-xs sm:text-sm font-semibold text-[#111] focus:outline-none cursor-pointer"
            >
              {PERSIAN_MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1} className="bg-white text-[#111]">
                  {name}
                </option>
              ))}
            </select>

            {/* Year Select */}
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
              className="bg-transparent px-1.5 py-1 text-xs sm:text-sm font-mono font-medium text-black/70 focus:outline-none cursor-pointer"
            >
              {[1402, 1403, 1404, 1405, 1406].map((yr) => (
                <option key={yr} value={yr} className="bg-white text-[#111]">
                  {toPersianDigits(yr)}
                </option>
              ))}
            </select>

            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-black/50 hover:text-black hover:bg-black/[0.04] transition-colors"
              title="ماه قبل"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Right side: View Switcher (Cards vs Table) & Actions */}
          <div className="flex items-center gap-2">
            {/* View Mode Switcher Button */}
            <button
              onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
              className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white hover:bg-black/[0.02] px-3 py-1.5 text-xs font-medium text-black/70 hover:text-black transition-all"
              title="تغییر نحوه نمایش"
            >
              {viewMode === 'cards' ? (
                <>
                  <TableIcon className="h-3.5 w-3.5 text-black/60" />
                  <span>جدول</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="h-3.5 w-3.5 text-black/60" />
                  <span>کارت‌ها</span>
                </>
              )}
            </button>

            {/* Export Excel */}
            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 rounded-xl bg-[#111] text-white hover:bg-[#2c2c2c] px-3.5 py-1.5 text-xs font-medium tracking-wide shadow-xs transition-all"
              title="دانلود فایل اکسل"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>اکسل</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 rounded-xl border border-black/10 bg-white hover:bg-black/[0.02] text-black/70 hover:text-black px-3 py-1.5 text-xs font-medium transition-all"
              title="چاپ یا ذخیره PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">چاپ</span>
            </button>
          </div>
        </div>

        {/* Row 2: Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs no-scrollbar">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-all ${
              filterType === 'all'
                ? 'bg-[#111] text-white font-medium shadow-xs'
                : 'border border-black/10 bg-white text-black/60 hover:text-black hover:bg-black/[0.02]'
            }`}
          >
            همه روزها ({toPersianDigits(monthRecords.length)})
          </button>
          <button
            onClick={() => setFilterType('delays')}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-all ${
              filterType === 'delays'
                ? 'bg-[#111] text-white font-medium shadow-xs'
                : 'border border-black/10 bg-white text-black/60 hover:text-black hover:bg-black/[0.02]'
            }`}
          >
            تاخیر / تعجیل
          </button>
          <button
            onClick={() => setFilterType('overtime')}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-all ${
              filterType === 'overtime'
                ? 'bg-[#111] text-white font-medium shadow-xs'
                : 'border border-black/10 bg-white text-black/60 hover:text-black hover:bg-black/[0.02]'
            }`}
          >
            اضافه کاری
          </button>
          <button
            onClick={() => setFilterType('thursdays')}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-all ${
              filterType === 'thursdays'
                ? 'bg-[#111] text-white font-medium shadow-xs'
                : 'border border-black/10 bg-white text-black/60 hover:text-black hover:bg-black/[0.02]'
            }`}
          >
            پنج‌شنبه‌ها
          </button>
          <button
            onClick={() => setFilterType('leaves')}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-all ${
              filterType === 'leaves'
                ? 'bg-[#111] text-white font-medium shadow-xs'
                : 'border border-black/10 bg-white text-black/60 hover:text-black hover:bg-black/[0.02]'
            }`}
          >
            مرخصی‌ها
          </button>
        </div>
      </div>

      {/* VIEW 1: Cards View */}
      {viewMode === 'cards' && (
        <div className="mt-4 space-y-2.5">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-black/40 bg-black/[0.01] rounded-2xl border border-black/[0.06] font-mono text-xs">
              <Calendar className="h-8 w-8 text-black/25 mx-auto mb-2" />
              <span>هیچ رکوردی برای این فیلتر ثبت نشده است.</span>
            </div>
          ) : (
            filteredRecords.map((r) => {
              const weekdayName = PERSIAN_WEEKDAY_NAMES[r.dayOfWeek] || '';
              const isLate = r.delayMinutes > 0;
              const hasOT = r.overtimeMinutes > 0 || r.holidayOvertimeMinutes > 0;

              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-black/[0.07] bg-white hover:bg-[#fafaf8] p-4 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between border-b border-black/[0.05] pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#111]">
                        {weekdayName}
                      </span>
                      <span className="font-mono text-xs text-black/60">
                        {toPersianDigits(r.date)}
                      </span>
                    </div>

                    <div>
                      {r.status === 'present' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-800 border border-emerald-200">
                          حاضر
                        </span>
                      )}
                      {r.status === 'in_progress' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-mono font-medium text-blue-800 border border-blue-200">
                          در حال کار
                        </span>
                      )}
                      {r.status === 'leave' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-800 border border-amber-200">
                          مرخصی
                        </span>
                      )}
                      {r.status === 'absent' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-mono font-medium text-rose-800 border border-rose-200">
                          غایب
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Punches Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center bg-black/[0.02] p-2.5 rounded-xl border border-black/[0.05] text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-black/40 block mb-0.5">ورود</span>
                      <span className="font-bold text-[#111]">
                        {r.checkIn ? toPersianDigits(r.checkIn) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-black/40 block mb-0.5">خروج</span>
                      <span className="font-bold text-[#111]">
                        {r.checkOut ? toPersianDigits(r.checkOut) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-black/40 block mb-0.5">کارکرد</span>
                      <span className="font-bold text-[#111]">
                        {r.workedMinutes > 0
                          ? toPersianDigits(formatMinutesToTimeString(r.workedMinutes))
                          : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between border-t border-black/[0.05] pt-2 mt-2">
                    <span className="text-[10px] text-black/40 font-mono">
                      #{r.id.slice(-6)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditRecord(r)}
                        className="px-2.5 py-1 rounded-lg border border-black/10 hover:bg-black/[0.04] text-[#111] text-xs font-medium transition-colors"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => onDeleteRecord(r.id)}
                        className="px-2.5 py-1 rounded-lg border border-black/10 hover:bg-rose-50 hover:border-rose-200 text-rose-600 text-xs font-medium transition-colors"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: Desktop Full Table View */}
      {viewMode === 'table' && (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-black/[0.08]">
          <table className="w-full text-right text-xs">
            <thead className="bg-black/[0.02] text-black/45 border-b border-black/[0.06] font-mono text-[10px] tracking-wider uppercase">
              <tr>
                <th className="py-3 px-3 font-medium">تاریخ / DATE</th>
                <th className="py-3 px-3 font-medium">روز / DAY</th>
                <th className="py-3 px-3 font-medium text-center">وضعیت</th>
                <th className="py-3 px-3 font-medium text-center">ورود</th>
                <th className="py-3 px-3 font-medium text-center">خروج</th>
                <th className="py-3 px-3 font-medium text-center">خروج هدف</th>
                <th className="py-3 px-3 font-medium text-center">ناهار</th>
                <th className="py-3 px-3 font-medium text-center">کارکرد مفید</th>
                <th className="py-3 px-3 font-medium text-center">تاخیر</th>
                <th className="py-3 px-3 font-medium text-center">اضافه کاری</th>
                <th className="py-3 px-3 font-medium text-center">کسر کار</th>
                <th className="py-3 px-3 font-medium text-center">تراز</th>
                <th className="py-3 px-4 font-medium">یادداشت</th>
                <th className="py-3 px-3 font-medium text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-black/40 font-mono">
                    هیچ رکوردی برای نمایش وجود ندارد.
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
                      className="hover:bg-black/[0.02] transition-colors"
                    >
                      {/* Date */}
                      <td className="py-3 px-3 font-mono font-medium text-[#111]">
                        {toPersianDigits(r.date)}
                      </td>

                      {/* Weekday */}
                      <td className="py-3 px-3 text-black/70">
                        {weekdayName}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3 text-center">
                        {r.status === 'present' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-800 border border-emerald-200">
                            حاضر
                          </span>
                        )}
                        {r.status === 'in_progress' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-mono font-medium text-blue-800 border border-blue-200">
                            در حال کار
                          </span>
                        )}
                        {r.status === 'leave' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-800 border border-amber-200">
                            مرخصی
                          </span>
                        )}
                        {r.status === 'absent' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-mono font-medium text-rose-800 border border-rose-200">
                            غایب
                          </span>
                        )}
                      </td>

                      {/* Check In */}
                      <td className="py-3 px-3 text-center font-mono font-medium text-[#111]">
                        {r.checkIn ? toPersianDigits(r.checkIn) : '-'}
                      </td>

                      {/* Check Out */}
                      <td className="py-3 px-3 text-center font-mono font-medium text-[#111]">
                        {r.checkOut ? toPersianDigits(r.checkOut) : '-'}
                      </td>

                      {/* Target Check Out */}
                      <td className="py-3 px-3 text-center font-mono text-black/50">
                        {r.targetCheckOut ? toPersianDigits(r.targetCheckOut) : '-'}
                      </td>

                      {/* Break */}
                      <td className="py-3 px-3 text-center text-black/50 font-mono">
                        {r.breakMinutes > 0 ? `${toPersianDigits(r.breakMinutes)} د` : '-'}
                      </td>

                      {/* Worked Time */}
                      <td className="py-3 px-3 text-center font-mono font-semibold text-[#111]">
                        {r.workedMinutes > 0 ? toPersianDigits(formatMinutesToTimeString(r.workedMinutes)) : '-'}
                      </td>

                      {/* Delay */}
                      <td className="py-3 px-3 text-center font-mono">
                        {isLate ? (
                          <span className="text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded text-[10px]">
                            {toPersianDigits(r.delayMinutes)} د
                          </span>
                        ) : (
                          <span className="text-black/30">-</span>
                        )}
                      </td>

                      {/* Overtime */}
                      <td className="py-3 px-3 text-center font-mono">
                        {hasOT ? (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">
                            +{toPersianDigits(formatMinutesToTimeString(r.overtimeMinutes + r.holidayOvertimeMinutes))}
                          </span>
                        ) : (
                          <span className="text-black/30">-</span>
                        )}
                      </td>

                      {/* Deficit */}
                      <td className="py-3 px-3 text-center font-mono">
                        {r.deficitMinutes > 0 ? (
                          <span className="text-amber-800">
                            {toPersianDigits(r.deficitMinutes)} د
                          </span>
                        ) : (
                          <span className="text-black/30">-</span>
                        )}
                      </td>

                      {/* Net Balance */}
                      <td className="py-3 px-3 text-center font-mono font-semibold">
                        {r.netBalanceMinutes > 0 ? (
                          <span className="text-emerald-700">
                            +{toPersianDigits(formatMinutesToTimeString(r.netBalanceMinutes))}
                          </span>
                        ) : r.netBalanceMinutes < 0 ? (
                          <span className="text-rose-600">
                            -{toPersianDigits(formatMinutesToTimeString(Math.abs(r.netBalanceMinutes)))}
                          </span>
                        ) : (
                          <span className="text-black/30">۰</span>
                        )}
                      </td>

                      {/* Note */}
                      <td className="py-3 px-4 text-black/50 max-w-xs truncate text-[11px]">
                        {r.note || '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEditRecord(r)}
                            className="p-1 rounded-lg text-black/40 hover:text-black hover:bg-black/[0.04] transition-colors"
                            title="ویرایش"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(r.id)}
                            className="p-1 rounded-lg text-black/40 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="حذف"
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
              <tfoot className="bg-black/[0.02] border-t-2 border-black/[0.08] font-mono text-xs text-[#111]">
                <tr>
                  <td colSpan={7} className="py-3 px-4 text-left font-medium">
                    مجموع اقلام:
                  </td>
                  <td className="py-3 px-3 text-center font-bold">
                    {toPersianDigits((visibleTotals.worked / 60).toFixed(1))} س
                  </td>
                  <td className="py-3 px-3 text-center text-rose-700">
                    {toPersianDigits(visibleTotals.delay)} د
                  </td>
                  <td className="py-3 px-3 text-center text-emerald-700 font-bold">
                    {toPersianDigits((visibleTotals.overtime / 60).toFixed(1))} س
                  </td>
                  <td className="py-3 px-3 text-center text-amber-800">
                    {toPersianDigits(visibleTotals.deficit)} د
                  </td>
                  <td className="py-3 px-3 text-center font-bold">
                    {visibleTotals.balance >= 0 ? '+' : '-'}
                    {toPersianDigits((Math.abs(visibleTotals.balance) / 60).toFixed(1))} س
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
