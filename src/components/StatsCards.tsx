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
  const hasDeficit = stats.totalDeficitMinutes > 0;

  const totalDelayAndEarlyMins = stats.totalDelayMinutes + stats.totalEarlyLeaveMinutes;
  const hasDelayOrEarly = totalDelayAndEarlyMins > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. کارکرد مفید ماه */}
      <div className="group relative rounded-2xl border border-black/[0.07] bg-white p-5 sm:p-6 transition-all duration-300 hover:border-black/[0.16] hover:bg-[#fafaf8] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl border border-black/10 bg-black/[0.02] flex items-center justify-center text-black/70">
              <Clock className="h-4 w-4" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider text-black/45 bg-black/[0.04]">
              {toPersianDigits(stats.completionRate)}٪ موظفی
            </span>
          </div>

          <div className="text-[11px] font-mono tracking-widest text-black/40 uppercase mb-1">
            کارکرد ماه {monthName}
          </div>

          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-3xl font-light text-[#111] font-mono tracking-tight">
              {toPersianDigits(workedHours)}
            </span>
            <span className="text-xs text-black/40 font-mono">
              / {toPersianDigits(requiredHours)} ساعت
            </span>
          </div>

          <div className="w-full h-1 bg-black/[0.06] rounded-full overflow-hidden my-3">
            <div
              className="h-full bg-[#111] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.completionRate)}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-black/45 leading-relaxed pt-2 border-t border-black/[0.05]">
          کل موظفی تقویمی ماه: <span className="font-mono font-medium text-[#111]">{toPersianDigits(totalMonthHours)} ساعت</span>
        </p>
      </div>

      {/* 2. تراز اضافه کاری و کارکرد خالص */}
      <div className="group relative rounded-2xl border border-black/[0.07] bg-white p-5 sm:p-6 transition-all duration-300 hover:border-black/[0.16] hover:bg-[#fafaf8] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl border border-black/10 bg-black/[0.02] flex items-center justify-center text-black/70">
              <Scale className="h-4 w-4" />
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider ${
                isNetPositive
                  ? 'text-emerald-700 bg-emerald-50'
                  : isNetZero
                  ? 'text-black/50 bg-black/[0.04]'
                  : 'text-rose-700 bg-rose-50'
              }`}
            >
              {isNetPositive ? '+ مثبت' : isNetZero ? 'سر‌به‌سر' : '- منفی'}
            </span>
          </div>

          <div className="text-[11px] font-mono tracking-widest text-black/40 uppercase mb-1">
            تراز اضافه کار
          </div>

          <div className="flex items-baseline gap-1.5 mb-2">
            <span
              className={`text-3xl font-light font-mono tracking-tight ${
                isNetPositive ? 'text-emerald-700' : isNetZero ? 'text-[#111]' : 'text-rose-600'
              }`}
            >
              {isNetPositive ? '+' : stats.netBalanceMinutes < 0 ? '-' : ''}
              {toPersianDigits(netBalanceHours)}
            </span>
            <span className="text-xs text-black/40 font-mono">
              ساعت خالص
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-black/45 pt-3 border-t border-black/[0.05]">
          <span className="flex items-center gap-1 font-mono text-emerald-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            اضافه: {toPersianDigits(totalOvertimeHours)}س
          </span>
          <span className="flex items-center gap-1 font-mono text-black/50">
            کسری: {toPersianDigits(deficitHours)}س
          </span>
        </div>
      </div>

      {/* 3. انضباط تردد (تاخیر و تعجیل) */}
      <div className="group relative rounded-2xl border border-black/[0.07] bg-white p-5 sm:p-6 transition-all duration-300 hover:border-black/[0.16] hover:bg-[#fafaf8] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl border border-black/10 bg-black/[0.02] flex items-center justify-center text-black/70">
              <AlertCircle className="h-4 w-4" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider text-black/45 bg-black/[0.04]">
              {hasDelayOrEarly ? `${toPersianDigits(totalDelayAndEarlyMins)} د مجموع` : 'انضباط کامل'}
            </span>
          </div>

          <div className="text-[11px] font-mono tracking-widest text-black/40 uppercase mb-1">
            تاخیر و تعجیل
          </div>

          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-3xl font-light text-[#111] font-mono tracking-tight">
              {toPersianDigits(stats.totalDelayMinutes)}
            </span>
            <span className="text-xs text-black/40 font-mono">
              دقیقه تاخیر
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-black/45 pt-3 border-t border-black/[0.05]">
          <span>تعجیل در خروج:</span>
          <span className="font-mono font-medium text-[#111]">
            {toPersianDigits(stats.totalEarlyLeaveMinutes)} دقیقه
          </span>
        </div>
      </div>

      {/* 4. روزهای حاضر و مرخصی */}
      <div className="group relative rounded-2xl border border-black/[0.07] bg-white p-5 sm:p-6 transition-all duration-300 hover:border-black/[0.16] hover:bg-[#fafaf8] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl border border-black/10 bg-black/[0.02] flex items-center justify-center text-black/70">
              <CalendarCheck2 className="h-4 w-4" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider text-black/45 bg-black/[0.04]">
              {toPersianDigits(stats.presentDaysCount + (stats.leaveDaysCount || 0))} روز ثبت‌شده
            </span>
          </div>

          <div className="text-[11px] font-mono tracking-widest text-black/40 uppercase mb-1">
            روزهای حضور
          </div>

          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-3xl font-light text-[#111] font-mono tracking-tight">
              {toPersianDigits(stats.presentDaysCount)}
            </span>
            <span className="text-xs text-black/40 font-mono">
              روز حاضر در محل کار
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-black/45 pt-3 border-t border-black/[0.05]">
          <span>مرخصی استفاده‌شده:</span>
          <span className="font-mono font-medium text-[#111]">
            {toPersianDigits((stats.totalLeaveMinutes / 60).toFixed(1))} ساعت
          </span>
        </div>
      </div>
    </div>
  );
};
