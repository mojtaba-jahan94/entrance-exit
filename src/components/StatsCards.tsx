import React from 'react';
import {
  Clock,
  TrendingUp,
  AlertCircle,
  Coffee,
  Scale,
  Banknote,
} from 'lucide-react';
import { MonthlyStats } from '../types';
import {
  toPersianDigits,
  formatMinutesToTimeString,
  formatMinutesToPersianReadable,
} from '../utils/jalali';
import { LiquidGlassCard } from './LiquidGlassCard';

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
    <div className="space-y-2.5 sm:space-y-3">
      {/* Bento Grid: 2 columns on mobile, 4 columns on large screens (Secondary priority) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* 1. کارکرد مفید ماه (Blue/Cyan Sheen) */}
        <LiquidGlassCard
          glowColor="rgba(59, 130, 246, 0.22)"
          className="rounded-[22px] p-3.5 sm:p-4 flex flex-col justify-between"
        >
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-100 truncate">کارکرد ماه {monthName}</span>
            <div className="rounded-xl bg-blue-500/20 p-1.5 text-cyan-300 border border-blue-400/30 backdrop-blur-md shrink-0 shadow-sm shadow-blue-500/20">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
              {toPersianDigits(workedHours)}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-200 font-medium truncate">
              ساعت از {toPersianDigits(requiredHours)}
            </span>
          </div>

          {/* Progress Bar & Sub-row */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-200 mb-1 font-semibold">
              <span>تحقق موظفی</span>
              <span className="font-bold text-cyan-300 font-mono">{toPersianDigits(stats.completionRate)}٪</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden p-0.5 border border-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700 shadow-sm shadow-cyan-400/40"
                style={{ width: `${Math.min(100, stats.completionRate)}%` }}
              />
            </div>
            {stats.totalMonthRequiredMinutes && (
              <div className="mt-2 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-300 border-t border-white/10 pt-1.5 font-medium">
                <span>کل موظفی تقویمی:</span>
                <span className="font-mono text-white font-semibold">{toPersianDigits(totalMonthHours)} ساعت</span>
              </div>
            )}
          </div>
        </LiquidGlassCard>

        {/* 2. تراز اضافه کاری و کارکرد خالص (Lime/Emerald Sheen) */}
        <LiquidGlassCard
          glowColor="rgba(16, 185, 129, 0.22)"
          className="rounded-[22px] p-3.5 sm:p-4 flex flex-col justify-between"
        >
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-100 truncate">تراز اضافه کار</span>
            <div
              className={`rounded-xl p-1.5 border shrink-0 backdrop-blur-md shadow-sm ${
                isNetPositive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/35 shadow-emerald-500/20'
                  : isNetZero
                  ? 'bg-white/10 text-white/70 border-white/20'
                  : 'bg-rose-500/20 text-rose-300 border-rose-400/35 shadow-rose-500/20'
              }`}
            >
              <Scale className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-1 sm:gap-1.5">
            <span
              className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                isNetPositive ? 'text-emerald-300' : isNetZero ? 'text-white' : 'text-rose-300'
              }`}
            >
              {isNetPositive ? '+' : stats.netBalanceMinutes < 0 ? '-' : ''}{toPersianDigits(netBalanceHours)}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-200 font-medium truncate">
              {isNetPositive ? 'ساعت مازاد' : isNetZero ? 'ساعت (سر‌به‌سر)' : 'ساعت کسری'}
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] sm:text-xs text-slate-200 border-t border-white/10 pt-2">
            <span className="flex items-center gap-1.5 truncate text-emerald-300 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 shadow-sm shadow-emerald-400" />
              اضافه: {toPersianDigits(totalOvertimeHours)}س
            </span>
            <span
              className={`flex items-center gap-1.5 truncate font-bold ${
                hasDeficit ? 'text-rose-300' : 'text-slate-300 font-medium'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  hasDeficit ? 'bg-rose-400 shadow-sm shadow-rose-400' : 'bg-slate-400'
                }`}
              />
              کسر کار: {toPersianDigits(deficitHours)}س
            </span>
          </div>
        </LiquidGlassCard>

        {/* 3. تاخیر و تعجیل (Amber/Orange Sheen) */}
        <LiquidGlassCard
          glowColor="rgba(245, 158, 11, 0.22)"
          className="rounded-[22px] p-3.5 sm:p-4 flex flex-col justify-between"
        >
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-100 truncate">تاخیر و تعجیل</span>
            <div
              className={`rounded-xl p-1.5 border shrink-0 backdrop-blur-md shadow-sm ${
                hasDelayOrEarly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/35 shadow-amber-500/20'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/35 shadow-emerald-500/20'
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-1 sm:gap-1.5">
            <span
              className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                hasDelayOrEarly ? 'text-amber-300' : 'text-emerald-300'
              }`}
            >
              {toPersianDigits(totalDelayAndEarlyMins)}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-200 font-medium truncate">
              {hasDelayOrEarly ? 'دقیقه مجموع' : 'دقیقه (بدون تاخیر)'}
            </span>
            {totalDelayAndEarlyMins >= 60 && (
              <span
                className="text-[11px] text-slate-300 font-mono font-medium truncate"
                title={formatMinutesToPersianReadable(totalDelayAndEarlyMins)}
              >
                ({toPersianDigits(formatMinutesToTimeString(totalDelayAndEarlyMins))})
              </span>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] sm:text-xs text-slate-200 border-t border-white/10 pt-2">
            <span
              className={`truncate ${stats.totalDelayMinutes > 0 ? 'text-amber-300 font-bold' : 'text-slate-300 font-medium'}`}
            >
              تاخیر: {toPersianDigits(stats.totalDelayMinutes)}د
            </span>
            <span
              className={`truncate ${stats.totalEarlyLeaveMinutes > 0 ? 'text-amber-300 font-bold' : 'text-slate-300 font-medium'}`}
            >
              تعجیل: {toPersianDigits(stats.totalEarlyLeaveMinutes)}د
            </span>
          </div>
        </LiquidGlassCard>

        {/* 4. کاردکس مرخصی (Fuchsia/Pink Sheen) */}
        <LiquidGlassCard
          glowColor="rgba(217, 70, 239, 0.22)"
          className="rounded-[22px] p-3.5 sm:p-4 flex flex-col justify-between"
        >
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-purple-500 via-pink-400 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-100 truncate">مانده مرخصی</span>
            <div className="rounded-xl bg-fuchsia-500/20 p-1.5 text-fuchsia-300 border border-fuchsia-400/35 backdrop-blur-md shrink-0 shadow-sm shadow-fuchsia-500/20">
              <Coffee className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-fuchsia-300 font-mono tracking-tight">
              {toPersianDigits(stats.remainingLeaveDays.toFixed(1))}
            </span>
            <span className="text-[11px] sm:text-xs text-white font-bold">روز</span>
            <span
              className="text-[11px] text-slate-300 font-mono font-medium truncate"
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

          <div className="mt-2.5 flex items-center justify-between text-[11px] sm:text-xs text-slate-200 border-t border-white/10 pt-2 font-medium">
            <span className="truncate">مصرف: {toPersianDigits(stats.totalLeaveDays.toFixed(1))} روز</span>
            <span className="text-emerald-300 font-bold truncate">
              حضور: {toPersianDigits(stats.presentDaysCount)} روز
            </span>
          </div>
        </LiquidGlassCard>
      </div>

      {/* Optional Financial Summary Banner if salary estimate active */}
      {stats.estimatedOvertimePay !== undefined && stats.estimatedOvertimePay > 0 && (
        <LiquidGlassCard
          variant="subtle"
          className="rounded-[24px] p-4 flex items-center justify-between border-emerald-400/30 text-xs shadow-lg"
        >
          <div className="flex items-center gap-2.5 text-emerald-300 font-medium">
            <div className="rounded-xl bg-emerald-500/20 p-1.5 border border-emerald-400/30">
              <Banknote className="h-4 w-4" />
            </div>
            <span>برآورد ارزش ریالی اضافه کاری این ماه (بر اساس نرخ تنظیمی شما):</span>
          </div>
          <div className="font-mono text-base font-black text-emerald-300">
            {toPersianDigits(stats.estimatedOvertimePay.toLocaleString())} تومان
          </div>
        </LiquidGlassCard>
      )}
    </div>
  );
};
