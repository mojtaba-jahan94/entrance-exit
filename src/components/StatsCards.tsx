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
  Banknote,
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
    <div className="space-y-3 sm:space-y-4">
      {/* Bento Grid: 2 columns on mobile, 4 columns on large screens */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* 1. کارکرد مفید ماه (Blue Top Accent) */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#161a27] p-3.5 sm:p-5 shadow-xl backdrop-blur-xl transition-all hover:border-blue-500/40 flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-400" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">کارکرد ماه {monthName}</span>
            <div className="rounded-xl bg-blue-500/10 p-1.5 sm:p-2 text-blue-400 border border-blue-500/20 shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>

          <div className="mt-2 sm:mt-3 flex items-baseline gap-1 sm:gap-2">
            <span className="text-xl sm:text-3xl font-black text-white font-mono">
              {toPersianDigits(workedHours)}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 truncate">
              ساعت از {toPersianDigits(requiredHours)}
            </span>
          </div>

          {/* Progress Bar & Sub-row */}
          <div className="mt-2 sm:mt-3">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 mb-1">
              <span>تحقق موظفی</span>
              <span className="font-bold text-blue-400 font-mono">{toPersianDigits(stats.completionRate)}٪</span>
            </div>
            <div className="h-1.5 sm:h-2 w-full rounded-full bg-[#111520] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500"
                style={{ width: `${Math.min(100, stats.completionRate)}%` }}
              />
            </div>
            {stats.totalMonthRequiredMinutes && (
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-white/[0.06] pt-1.5">
                <span>کل موظفی تقویمی:</span>
                <span className="font-mono text-slate-400 font-medium">{toPersianDigits(totalMonthHours)} ساعت</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. تراز اضافه کاری و کارکرد خالص (Lime/Emerald Top Accent) */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#161a27] p-3.5 sm:p-5 shadow-xl backdrop-blur-xl transition-all hover:border-lime-500/40 flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-lime-500 to-emerald-400" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">تراز اضافه کار</span>
            <div className={`rounded-xl p-1.5 sm:p-2 border shrink-0 ${
              isNetPositive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : isNetZero
                ? 'bg-white/[0.05] text-slate-400 border-white/[0.08]'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>

          <div className="mt-2 sm:mt-3 flex items-baseline gap-1 sm:gap-2">
            <span className={`text-xl sm:text-3xl font-black font-mono ${
              isNetPositive ? 'text-emerald-400' : isNetZero ? 'text-slate-200' : 'text-rose-400'
            }`}>
              {isNetPositive ? '+' : stats.netBalanceMinutes < 0 ? '-' : ''}{toPersianDigits(netBalanceHours)}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 truncate">
              {isNetPositive ? 'ساعت مازاد' : isNetZero ? 'ساعت (سر‌به‌سر)' : 'ساعت کسری'}
            </span>
          </div>

          <div className="mt-2 sm:mt-3 flex items-center justify-between text-[10px] sm:text-xs text-slate-400 border-t border-white/[0.06] pt-2">
            <span className="flex items-center gap-1 truncate text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
              اضافه: {toPersianDigits(totalOvertimeHours)}س
            </span>
            <span className={`flex items-center gap-1 truncate font-medium ${hasDeficit ? 'text-rose-400' : 'text-slate-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${hasDeficit ? 'bg-rose-400' : 'bg-slate-500'}`} />
              کسر کار: {toPersianDigits(deficitHours)}س
            </span>
          </div>
        </div>

        {/* 3. تاخیر و تعجیل (Orange/Amber Top Accent) */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#161a27] p-3.5 sm:p-5 shadow-xl backdrop-blur-xl transition-all hover:border-orange-500/40 flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-400" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">تاخیر و تعجیل</span>
            <div className={`rounded-xl p-1.5 sm:p-2 border shrink-0 ${
              hasDelayOrEarly
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>

          <div className="mt-2 sm:mt-3 flex items-baseline gap-1 sm:gap-2">
            <span className={`text-xl sm:text-3xl font-black font-mono ${
              hasDelayOrEarly ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {toPersianDigits(totalDelayAndEarlyMins)}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 truncate">
              {hasDelayOrEarly ? 'دقیقه مجموع' : 'دقیقه (بدون تاخیر)'}
            </span>
            {totalDelayAndEarlyMins >= 60 && (
              <span className="text-[10px] sm:text-xs text-slate-500 font-mono truncate" title={formatMinutesToPersianReadable(totalDelayAndEarlyMins)}>
                ({toPersianDigits(formatMinutesToTimeString(totalDelayAndEarlyMins))})
              </span>
            )}
          </div>

          <div className="mt-2 sm:mt-3 flex items-center justify-between text-[10px] sm:text-xs text-slate-400 border-t border-white/[0.06] pt-2">
            <span className={`truncate ${stats.totalDelayMinutes > 0 ? 'text-amber-300 font-medium' : 'text-slate-400'}`}>
              تاخیر: {toPersianDigits(stats.totalDelayMinutes)}د
            </span>
            <span className={`truncate ${stats.totalEarlyLeaveMinutes > 0 ? 'text-amber-300 font-medium' : 'text-slate-400'}`}>
              تعجیل: {toPersianDigits(stats.totalEarlyLeaveMinutes)}د
            </span>
          </div>
        </div>

        {/* 4. کاردکس مرخصی (Purple/Pink Top Accent) */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#161a27] p-3.5 sm:p-5 shadow-xl backdrop-blur-xl transition-all hover:border-purple-500/40 flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">مانده مرخصی</span>
            <div className="rounded-xl bg-purple-500/10 p-1.5 sm:p-2 text-purple-400 border border-purple-500/20 shrink-0">
              <Coffee className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>

          <div className="mt-2 sm:mt-3 flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-xl sm:text-3xl font-black text-purple-300 font-mono">
              {toPersianDigits(stats.remainingLeaveDays.toFixed(1))}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-300 font-semibold">روز</span>
            <span
              className="text-[9px] sm:text-xs text-slate-400 font-mono truncate"
              title={
                stats.remainingLeaveMinutes !== undefined
                  ? formatMinutesToPersianReadable(stats.remainingLeaveMinutes)
                  : `${toPersianDigits(stats.remainingLeaveHours.toFixed(1))} ساعت`
              }
            >
              (
              {stats.remainingLeaveMinutes !== undefined
                ? toPersianDigits(formatMinutesToTimeString(stats.remainingLeaveMinutes))
                : toPersianDigits(stats.remainingLeaveHours.toFixed(1))}
              )
            </span>
          </div>

          <div className="mt-2 sm:mt-3 flex items-center justify-between text-[10px] sm:text-xs text-slate-400 border-t border-white/[0.06] pt-2">
            <span className="truncate">مصرف: {toPersianDigits(stats.totalLeaveDays.toFixed(1))} روز</span>
            <span className="text-emerald-400 font-medium truncate">
              حضور: {toPersianDigits(stats.presentDaysCount)} روز
            </span>
          </div>
        </div>
      </div>

      {/* Optional Financial Summary Banner if salary estimate active */}
      {stats.estimatedOvertimePay !== undefined && stats.estimatedOvertimePay > 0 && (
        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 p-3.5 border border-emerald-500/20 text-xs">
          <div className="flex items-center gap-2 text-emerald-300">
            <Banknote className="h-4 w-4" />
            <span>برآورد ارزش ریالی اضافه کاری این ماه (بر اساس نرخ تنظیمی شما):</span>
          </div>
          <div className="font-mono text-base font-bold text-emerald-400">
            {toPersianDigits(stats.estimatedOvertimePay.toLocaleString())} تومان
          </div>
        </div>
      )}
    </div>
  );
};

