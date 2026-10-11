import React from 'react';
import {
  Clock,
  TrendingUp,
  AlertCircle,
  Coffee,
  CalendarCheck2,
  Hourglass,
  Zap,
  Scale,
  CheckCircle2,
  Activity,
  Layers,
} from 'lucide-react';
import { MonthlyStats } from '../types';
import {
  toPersianDigits,
  formatMinutesToTimeString,
  formatMinutesToPersianReadable,
} from '../utils/jalali';

interface StatsCardsProps {
  stats: MonthlyStats;
  monthName: string;
  year: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, monthName, year }) => {
  const workedHours = (stats.totalWorkedMinutes / 60).toFixed(1);
  const requiredHours = (stats.totalRequiredMinutes / 60).toFixed(1);
  const totalMonthHours = stats.totalMonthRequiredMinutes
    ? (stats.totalMonthRequiredMinutes / 60).toFixed(1)
    : requiredHours;

  const totalOvertimeMins = stats.totalOvertimeMinutes + stats.totalHolidayOvertimeMinutes;
  const totalOvertimeHours = (totalOvertimeMins / 60).toFixed(1);

  const netBalanceHours = (Math.abs(stats.netBalanceMinutes) / 60).toFixed(1);
  const isNetPositive = stats.netBalanceMinutes > 0;
  const isNetZero = stats.netBalanceMinutes === 0;

  const deficitHours = (stats.totalDeficitMinutes / 60).toFixed(1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 01: موظفی ماهانه */}
      <div className="group relative rounded-2xl border border-white/10 bg-[#09090d] p-5 sm:p-6 transition-all duration-300 hover:border-white/20 hover:bg-[#0c0c12] flex flex-col justify-between overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#eca8d6] to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono text-[#eca8d6] uppercase tracking-wider">
              01 // OBLIGATION
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-white/50 bg-white/[0.04] border border-white/10">
              {toPersianDigits(stats.workingDaysCount || 0)} روز کاری
            </span>
          </div>

          <div className="text-[11px] font-mono tracking-widest text-white/40 uppercase mb-1">
            ساعت موظف ({monthName})
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl sm:text-4xl font-light text-white font-mono tracking-tight tabular-nums">
              {toPersianDigits(requiredHours)}
            </span>
            <span className="text-xs text-white/40 font-mono">ساعت تا امروز</span>
          </div>
        </div>

        <div className="space-y-1.5 pt-3 border-t border-white/10">
          <div className="flex justify-between text-[11px] font-mono text-white/50">
            <span>نرخ تکمیل:</span>
            <span className="text-[#eca8d6] font-semibold">{toPersianDigits(stats.completionRate)}%</span>
          </div>
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#eca8d6] rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card 02: کارکرد خالص */}
      <div className="group relative rounded-2xl border border-white/10 bg-[#09090d] p-5 sm:p-6 transition-all duration-300 hover:border-white/20 hover:bg-[#0c0c12] flex flex-col justify-between overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#c597eb] to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono text-[#c597eb] uppercase tracking-wider">
              02 // WORKED EFFORT
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-white/50 bg-white/[0.04] border border-white/10">
              {toPersianDigits(stats.presentDaysCount)} روز حضور
            </span>
          </div>

          <div className="text-[11px] font-mono tracking-widest text-white/40 uppercase mb-1">
            کارکرد موثر ثبت‌شده
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl sm:text-4xl font-light text-white font-mono tracking-tight tabular-nums">
              {toPersianDigits(workedHours)}
            </span>
            <span className="text-xs text-white/40 font-mono">ساعت کار مفید</span>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10 text-[11px] font-mono text-white/50 flex justify-between">
          <span>میانگین روزانه:</span>
          <span className="text-white">
            {stats.presentDaysCount > 0
              ? toPersianDigits((stats.totalWorkedMinutes / stats.presentDaysCount / 60).toFixed(1))
              : '۰'} ساعت
          </span>
        </div>
      </div>

      {/* Card 03: تراز زمانی ماه */}
      <div className="group relative rounded-2xl border border-white/10 bg-[#09090d] p-5 sm:p-6 transition-all duration-300 hover:border-white/20 hover:bg-[#0c0c12] flex flex-col justify-between overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#79cdf9] to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono text-[#79cdf9] uppercase tracking-wider">
              03 // TIME BALANCE
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                isNetPositive
                  ? 'border-[#eca8d6]/30 text-[#eca8d6] bg-[#eca8d6]/10'
                  : isNetZero
                  ? 'border-white/10 text-white/60 bg-white/[0.04]'
                  : 'border-rose-500/30 text-rose-400 bg-rose-500/10'
              }`}
            >
              {isNetPositive ? 'مازاد مثبت' : isNetZero ? 'تراز دقیق' : 'کسر کار'}
            </span>
          </div>

          <div className="text-[11px] font-mono tracking-widest text-white/40 uppercase mb-1">
            تراز اضافه/کسر کار
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span
              className={`text-3xl sm:text-4xl font-light font-mono tracking-tight tabular-nums ${
                isNetPositive ? 'text-[#eca8d6]' : isNetZero ? 'text-white' : 'text-rose-400'
              }`}
            >
              {isNetPositive ? `+${toPersianDigits(netBalanceHours)}` : isNetZero ? '۰.۰' : `-${toPersianDigits(netBalanceHours)}`}
            </span>
            <span className="text-xs text-white/40 font-mono">ساعت تراز</span>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10 text-[11px] font-mono text-white/50 flex justify-between">
          <span>اضافه‌کاری / کسرکار:</span>
          <span className="text-white">
            <span className="text-[#eca8d6]">+{toPersianDigits(totalOvertimeHours)}</span> / <span className="text-rose-400">-{toPersianDigits(deficitHours)}</span>
          </span>
        </div>
      </div>

      {/* Card 04: روزهای حضور و مانده مرخصی */}
      <div className="group relative rounded-2xl border border-white/10 bg-[#09090d] p-5 sm:p-6 transition-all duration-300 hover:border-white/20 hover:bg-[#0c0c12] flex flex-col justify-between overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
              04 // PRESENCE & LEAVE
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-white/50 bg-white/[0.04] border border-white/10">
              کل {toPersianDigits(stats.monthTotalDays || 30)} روز
            </span>
          </div>

          <div className="text-[11px] font-mono tracking-widest text-white/40 uppercase mb-1">
            وضعیت حضور و مرخصی
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl sm:text-4xl font-light text-white font-mono tracking-tight tabular-nums">
              {toPersianDigits(stats.presentDaysCount)}
            </span>
            <span className="text-xs text-white/40 font-mono">روز حضور فیزیکی</span>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10 text-[11px] font-mono text-white/50 flex justify-between">
          <span>مانده سهمیه مرخصی:</span>
          <span className="text-emerald-400 font-medium">
            {toPersianDigits(stats.remainingLeaveDays)} روز ({toPersianDigits(stats.remainingLeaveHours)} ساعت)
          </span>
        </div>
      </div>
    </div>
  );
};
