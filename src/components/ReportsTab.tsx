import React from 'react';
import {
  TrendingUp,
  Clock,
  Calendar,
  AlertTriangle,
  Coffee,
  CheckCircle2,
  Banknote,
  Scale,
  Award,
  Zap,
  Printer,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { AttendanceRecord, ShiftConfig, MonthlyStats } from '../types';
import {
  toPersianDigits,
  formatMinutesToTimeString,
  formatMinutesToPersianReadable,
} from '../utils/jalali';

interface ReportsTabProps {
  stats: MonthlyStats;
  records: AttendanceRecord[];
  config: ShiftConfig;
  selectedMonthName: string;
  selectedYear: number;
  onExportExcel: () => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  stats,
  records,
  config,
  selectedMonthName,
  selectedYear,
  onExportExcel,
}) => {
  const isNetPositive = stats.netBalanceMinutes >= 0;

  const avgWorkedDaily =
    stats.presentDaysCount > 0
      ? Math.round(stats.totalWorkedMinutes / stats.presentDaysCount)
      : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 text-white">
      {/* 1. Header Banner & Actions */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#09090d] p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-32 bg-[#eca8d6]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest text-[#eca8d6] bg-[#eca8d6]/10 border border-[#eca8d6]/20 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eca8d6] animate-pulse" />
              <span>04 // PAYROLL & ATTENDANCE AUDIT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
              گزارش تحلیلی و کارکرد | <span className="text-[#eca8d6] font-medium">{selectedMonthName} {toPersianDigits(selectedYear)}</span>
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              محاسبه مکانیزه کارکرد موظفی، اضافه کار، انضباط زمانی، کسر کار و برآورد ساعات مفید اداری
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onExportExcel}
              className="flex items-center gap-2 rounded-full bg-[#eca8d6] hover:bg-[#e491cc] text-[#050507] px-4 py-2.5 text-xs font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(236,168,214,0.3)] active:scale-95"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>خروجی اکسل</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white px-4 py-2.5 text-xs font-mono transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>چاپ گزارش</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Effective Worked */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#09090d] p-5 shadow-xl group hover:border-[#eca8d6]/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
              01 // کارکرد موثر ماه
            </span>
            <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-zinc-400">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-light text-white font-mono tracking-tight">
            {formatMinutesToPersianReadable(stats.totalWorkedMinutes)}
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-2 pt-2 border-t border-white/5">
            از کل موظفی: {formatMinutesToPersianReadable(stats.totalRequiredMinutes)}
          </p>
        </div>

        {/* Card 2: Net Balance */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#09090d] p-5 shadow-xl group hover:border-[#eca8d6]/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
              02 // تراز خالص کارکرد
            </span>
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                isNetPositive
                  ? 'bg-emerald-400/10 text-emerald-400'
                  : 'bg-rose-400/10 text-rose-400'
              }`}
            >
              {isNetPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownLeft className="h-3.5 w-3.5" />
              )}
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-light font-mono tracking-tight ${
              isNetPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isNetPositive ? '+' : '-'}
            {formatMinutesToPersianReadable(Math.abs(stats.netBalanceMinutes))}
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-2 pt-2 border-t border-white/5">
            {isNetPositive ? 'مازاد مثبت اضافه کاری' : 'کسر کار بیش از اضافه کار'}
          </p>
        </div>

        {/* Card 3: Overtime Breakdown */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#09090d] p-5 shadow-xl group hover:border-[#eca8d6]/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
              03 // اضافه کاری تجمیعی
            </span>
            <div className="w-7 h-7 rounded-full bg-[#eca8d6]/10 flex items-center justify-center text-[#eca8d6]">
              <Zap className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-light text-[#eca8d6] font-mono tracking-tight">
            {formatMinutesToPersianReadable(stats.totalOvertimeMinutes + stats.totalHolidayOvertimeMinutes)}
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-2 pt-2 border-t border-white/5">
            عادی: {toPersianDigits(formatMinutesToTimeString(stats.totalOvertimeMinutes))} | تعطیل: {toPersianDigits(formatMinutesToTimeString(stats.totalHolidayOvertimeMinutes))}
          </p>
        </div>

        {/* Card 4: Delays & Early Departures */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#09090d] p-5 shadow-xl group hover:border-amber-400/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
              04 // تاخیر و تعجیل
            </span>
            <div className="w-7 h-7 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-light text-amber-300 font-mono tracking-tight">
            {toPersianDigits(stats.totalDelayMinutes + stats.totalEarlyLeaveMinutes)} دقیقه
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-2 pt-2 border-t border-white/5">
            تاخیر: {toPersianDigits(stats.totalDelayMinutes)}د | تعجیل: {toPersianDigits(stats.totalEarlyLeaveMinutes)}د
          </p>
        </div>
      </div>

      {/* 3. Detailed Audit Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Time Details Table */}
        <div className="rounded-3xl border border-white/10 bg-[#09090d] p-5 sm:p-6 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#eca8d6]" />
              <h3 className="text-sm font-semibold text-white font-mono">
                جزئیات و محاسبات زمانی کارکرد
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">TIME AUDIT</span>
          </div>

          <div className="divide-y divide-white/5 text-xs font-mono">
            <div className="py-3 flex justify-between items-center">
              <span className="text-zinc-400">کل روزهای تقویمی ماه:</span>
              <span className="font-bold text-white">
                {toPersianDigits(records.length || 30)} روز
              </span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-zinc-400">روزهای کاری رسمی (غیرتعطیل):</span>
              <span className="font-bold text-white">
                {toPersianDigits(stats.workingDaysCount || 0)} روز کاری
              </span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-zinc-400">روزهای دارای ثبت تردد:</span>
              <span className="font-bold text-white">
                {toPersianDigits(stats.presentDaysCount + stats.absentDaysCount + (stats.leaveDaysCount || 0))} روز
              </span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-zinc-400">روزهای حضور موثر:</span>
              <span className="font-bold text-emerald-400">
                {toPersianDigits(stats.presentDaysCount)} روز
              </span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-zinc-400">روزهای غیبت یا ثبت‌نشده:</span>
              <span className="font-bold text-rose-400">
                {toPersianDigits(stats.absentDaysCount)} روز
              </span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-zinc-400">میانگین حضور در روزهای کاری:</span>
              <span className="font-bold text-[#eca8d6]">
                {formatMinutesToPersianReadable(avgWorkedDaily)}
              </span>
            </div>
          </div>
        </div>

        {/* Attendance Discipline & Leaves Table */}
        <div className="rounded-3xl border border-white/10 bg-[#09090d] p-5 sm:p-6 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-[#eca8d6]" />
              <h3 className="text-sm font-semibold text-white font-mono">
                شاخص‌های انضباط اداری و مرخصی
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">DISCIPLINE MATRIX</span>
          </div>

          <div className="divide-y divide-white/5 text-xs font-mono">
            <div className="py-3 flex justify-between items-center">
              <span className="text-zinc-400">کل کسر کار محاسبه‌شده:</span>
              <span className="font-bold text-amber-300">
                {formatMinutesToPersianReadable(stats.totalDeficitMinutes)}
              </span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-zinc-400">کل مرخصی مصرف‌شده:</span>
              <span className="font-bold text-white">
                {formatMinutesToPersianReadable(stats.totalLeaveMinutes)} ({toPersianDigits(stats.totalLeaveDays.toFixed(1))} روز)
              </span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-zinc-400">درصد تحقق کل تعهد ماهانه:</span>
              <span className="font-bold text-[#eca8d6] text-sm">
                {toPersianDigits(stats.completionRate)}٪
              </span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-zinc-400">انضباط ورود و خروج:</span>
              <span className={`font-bold ${stats.totalDelayMinutes === 0 ? 'text-emerald-400' : 'text-amber-300'}`}>
                {stats.totalDelayMinutes === 0 ? 'کاملاً منظم و بدون تاخیر' : `${toPersianDigits(stats.totalDelayMinutes)} دقیقه تاخیر ورود`}
              </span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-zinc-400">وضعیت اضافه کاری تعطیلات:</span>
              <span className="font-bold text-purple-300">
                {toPersianDigits(formatMinutesToTimeString(stats.totalHolidayOvertimeMinutes))} با ضریب تعطیل کاری
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
