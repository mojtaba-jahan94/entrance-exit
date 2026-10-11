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
  X,
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
    <div className="rounded-2xl border border-white/10 bg-[#09090d] p-5 sm:p-7 text-white transition-all">
      {/* Table Header Controls */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5">
        {/* Row 1: Month/Year Nav + View Switcher + Record Count */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Month & Year Selectors */}
          <div className="flex items-center rounded-xl bg-black/60 border border-white/10 p-1">
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors"
              title="ماه بعد"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Month Select */}
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
              className="bg-transparent px-2.5 py-1 text-xs sm:text-sm font-semibold text-white focus:outline-none cursor-pointer"
            >
              {PERSIAN_MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1} className="bg-[#09090d] text-white">
                  {name}
                </option>
              ))}
            </select>

            {/* Year Select */}
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
              className="bg-transparent px-1.5 py-1 text-xs sm:text-sm font-mono font-medium text-white/70 focus:outline-none cursor-pointer"
            >
              {[1402, 1403, 1404, 1405, 1406].map((yr) => (
                <option key={yr} value={yr} className="bg-[#09090d] text-white">
                  {toPersianDigits(yr)}
                </option>
              ))}
            </select>

            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors"
              title="ماه قبل"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Action CTAs: Excel, Print, Add */}
          <div className="flex items-center gap-2">
            {/* View switcher */}
            <div className="hidden sm:flex items-center rounded-xl bg-black/60 border border-white/10 p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                }`}
                title="نمایش جدولی"
              >
                <TableIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'cards' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                }`}
                title="نمایش کارتی"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-mono transition-all"
              title="خروجی اکسل کارنامه ماه جاری"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">اکسل</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:border-white/25 text-xs font-mono transition-all"
              title="چاپ کارنامه"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">چاپ</span>
            </button>

            <button
              onClick={() => onAddNewForDate('')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#eca8d6] hover:bg-[#f3c2e4] text-black text-xs font-mono font-semibold transition-all shadow-md shadow-[#eca8d6]/10"
              title="ثبت دستی تردد جدید"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>ثبت جدید</span>
            </button>
          </div>
        </div>

        {/* Row 2: Search + Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در تاریخ یا یادداشت..."
              className="w-full rounded-xl border border-white/10 bg-black/60 pl-8 pr-9 py-1.5 text-xs font-mono text-white placeholder:text-white/30 focus:border-[#eca8d6] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono no-scrollbar">
            {[
              { id: 'all', label: 'همه روزها' },
              { id: 'delays', label: 'تاخیر/تعجیل' },
              { id: 'overtime', label: 'اضافه‌کاری' },
              { id: 'thursdays', label: 'پنج‌شنبه‌ها' },
              { id: 'leaves', label: 'مرخصی‌ها' },
              { id: 'holidays', label: 'تعطیلات' },
            ].map((f) => {
              const isActive = filterType === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all shrink-0 ${
                    isActive
                      ? 'bg-white text-black font-semibold'
                      : 'border border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/20'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* VIEW 1: Cards View (Mobile Friendly) */}
      {viewMode === 'cards' && (
        <div className="mt-5 space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="py-16 text-center text-white/40 font-mono text-xs">
              هیچ رکوردی منطبق با این فیلتر ثبت نشده است.
            </div>
          ) : (
            filteredRecords.map((r) => {
              const weekdayName = PERSIAN_WEEKDAY_NAMES[r.dayOfWeek] || '';
              return (
                <div
                  key={r.id || r.date}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-all hover:border-white/20 hover:bg-white/[0.04]"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-semibold text-white">{weekdayName}</span>
                      <span className="font-mono text-xs text-white/60">{toPersianDigits(r.date)}</span>
                    </div>

                    <div>
                      {r.status === 'present' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          حاضر
                        </span>
                      )}
                      {r.status === 'in_progress' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#eca8d6]/10 text-[#eca8d6] border border-[#eca8d6]/30">
                          در حال کار
                        </span>
                      )}
                      {r.status === 'leave' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          مرخصی
                        </span>
                      )}
                      {r.status === 'absent' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          غایب
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center bg-black/40 p-2.5 rounded-lg border border-white/5 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-white/40 block">ورود</span>
                      <span className="font-semibold text-white">{r.checkIn ? toPersianDigits(r.checkIn) : '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 block">خروج</span>
                      <span className="font-semibold text-white">{r.checkOut ? toPersianDigits(r.checkOut) : '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 block">کارکرد مفید</span>
                      <span className="font-semibold text-[#eca8d6]">
                        {r.workedMinutes > 0 ? toPersianDigits(formatMinutesToTimeString(r.workedMinutes)) : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-white/5 text-xs font-mono">
                    <span className="text-[10px] text-white/30">#{r.id?.slice(-6) || '—'}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEditRecord(r)}
                        className="px-3 py-1 rounded-lg border border-white/10 text-white/80 hover:text-white hover:border-white/30 transition-all"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => onDeleteRecord(r.id)}
                        className="px-3 py-1 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-all"
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
        <div className="mt-5 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-right text-xs">
            <thead className="bg-white/[0.02] text-white/40 border-b border-white/10 font-mono text-[10px] tracking-wider uppercase">
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
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-16 text-center text-white/40 font-mono">
                    هیچ رکوردی برای نمایش وجود ندارد.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const weekdayName = PERSIAN_WEEKDAY_NAMES[r.dayOfWeek] || '';
                  const isLate = r.delayMinutes > 0;
                  const hasOT = r.overtimeMinutes > 0 || r.holidayOvertimeMinutes > 0;

                  return (
                    <tr key={r.id || r.date} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 font-medium text-white">{toPersianDigits(r.date)}</td>
                      <td className="py-3 px-3 text-white/60">{weekdayName}</td>
                      <td className="py-3 px-3 text-center">
                        {r.status === 'present' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            حاضر
                          </span>
                        )}
                        {r.status === 'in_progress' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#eca8d6]/10 text-[#eca8d6] border border-[#eca8d6]/30">
                            در حال کار
                          </span>
                        )}
                        {r.status === 'leave' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            مرخصی
                          </span>
                        )}
                        {r.status === 'absent' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            غایب
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-white">{r.checkIn ? toPersianDigits(r.checkIn) : '—'}</td>
                      <td className="py-3 px-3 text-center text-white">{r.checkOut ? toPersianDigits(r.checkOut) : '—'}</td>
                      <td className="py-3 px-3 text-center text-white/50">{r.targetCheckOut ? toPersianDigits(r.targetCheckOut) : '—'}</td>
                      <td className="py-3 px-3 text-center text-white/50">{r.breakMinutes > 0 ? `${toPersianDigits(r.breakMinutes)}د` : '—'}</td>
                      <td className="py-3 px-3 text-center font-semibold text-[#eca8d6]">
                        {r.workedMinutes > 0 ? toPersianDigits(formatMinutesToTimeString(r.workedMinutes)) : '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isLate ? (
                          <span className="text-rose-400 bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 rounded text-[10px]">
                            {toPersianDigits(r.delayMinutes)}د
                          </span>
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {hasOT ? (
                          <span className="text-[#eca8d6] bg-[#eca8d6]/10 border border-[#eca8d6]/30 px-1.5 py-0.5 rounded text-[10px]">
                            +{toPersianDigits(formatMinutesToTimeString(r.overtimeMinutes + r.holidayOvertimeMinutes))}
                          </span>
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {r.deficitMinutes > 0 ? (
                          <span className="text-rose-400 bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 rounded text-[10px]">
                            -{toPersianDigits(r.deficitMinutes)}د
                          </span>
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {r.netBalanceMinutes > 0 ? (
                          <span className="text-[#eca8d6]">+{toPersianDigits(formatMinutesToTimeString(r.netBalanceMinutes))}</span>
                        ) : r.netBalanceMinutes < 0 ? (
                          <span className="text-rose-400">-{toPersianDigits(formatMinutesToTimeString(Math.abs(r.netBalanceMinutes)))}</span>
                        ) : (
                          <span className="text-white/30">۰</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-white/50 text-[11px] truncate max-w-[120px]">{r.note || '—'}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEditRecord(r)}
                            className="p-1 rounded text-white/50 hover:text-white hover:bg-white/[0.05]"
                            title="ویرایش"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(r.id)}
                            className="p-1 rounded text-rose-400 hover:bg-rose-500/10"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
