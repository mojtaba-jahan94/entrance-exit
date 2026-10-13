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
        {/* 1. کارکرد مفید ماه */}
        <LiquidGlassCard
          glowColor="rgba(166, 138, 100, 0.08)"
          className="rounded-[22px] p-3.5 sm:p-4 flex flex-col justify-between"
        >
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text)] truncate">کارکرد ماه {monthName}</span>
            <div className="rounded-xl bg-[var(--accent)]/20 p-1.5 text-[var(--accent)] border border-[var(--accent)]/30 backdrop-blur-md shrink-0 shadow-sm">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-[var(--text)] font-mono tracking-tight">
              {toPersianDigits(workedHours)}
            </span>
            <span className="text-[11px] sm:text-xs text-[var(--text-muted)] font-medium truncate">
              ساعت از {toPersianDigits(requiredHours)}
            </span>
          </div>

          {/* Progress Bar & Sub-row */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-[var(--text-muted)] mb-1 font-semibold">
              <span>تحقق موظفی</span>
              <span className="font-bold text-[var(--accent)] font-mono">{toPersianDigits(stats.completionRate)}٪</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/15">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-700 shadow-sm"
                style={{ width: `${Math.min(100, stats.completionRate)}%` }}
              />
            </div>
            {stats.totalMonthRequiredMinutes && (
              <div className="mt-2 flex items-center justify-between text-[10px] sm:text-[11px] text-[var(--text-muted)] border-t border-white/10 pt-1.5 font-medium">
                <span>کل موظفی تقویمی:</span>
                <span className="font-mono text-[var(--text)] font-semibold">{toPersianDigits(totalMonthHours)} ساعت</span>
              </div>
            )}
          </div>
        </LiquidGlassCard>

        {/* 2. تراز اضافه کاری و کارکرد خالص */}
        <LiquidGlassCard
          glowColor="rgba(166, 138, 100, 0.08)"
          className="rounded-[22px] p-3.5 sm:p-4 flex flex-col justify-between"
        >
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text)] truncate">تراز اضافه کار</span>
            <div
              className={`rounded-xl p-1.5 border shrink-0 backdrop-blur-md shadow-sm ${
                isNetPositive
                  ? 'bg-[var(--semantic-success)]/20 text-[var(--semantic-success)] border-[var(--semantic-success)]/35'
                  : isNetZero
                  ? 'bg-white/10 text-[var(--text-muted)] border-white/20'
                  : 'bg-[var(--semantic-danger)]/20 text-[var(--semantic-danger)] border-[var(--semantic-danger)]/35'
              }`}
            >
              <Scale className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-1 sm:gap-1.5">
            <span
              className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                isNetPositive ? 'text-[var(--semantic-success)]' : isNetZero ? 'text-[var(--text)]' : 'text-[var(--semantic-danger)]'
              }`}
            >
              <bdi dir="ltr">
                {isNetPositive ? '+' : stats.netBalanceMinutes < 0 ? '-' : ''}{toPersianDigits(netBalanceHours)}
              </bdi>
            </span>
            <span className="text-[11px] sm:text-xs text-[var(--text-muted)] font-medium truncate">
              {isNetPositive ? 'ساعت مازاد' : isNetZero ? 'ساعت (سر‌به‌سر)' : 'ساعت کسری'}
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] sm:text-xs text-[var(--text-muted)] border-t border-white/10 pt-2">
            <span className="flex items-center gap-1.5 truncate text-[var(--semantic-success)] font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--semantic-success)] shrink-0 shadow-sm" />
              اضافه: {toPersianDigits(totalOvertimeHours)}س
            </span>
            <span
              className={`flex items-center gap-1.5 truncate font-bold ${
                hasDeficit ? 'text-[var(--semantic-danger)]' : 'text-[var(--text-muted)] font-medium'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  hasDeficit ? 'bg-[var(--semantic-danger)] shadow-sm' : 'bg-[var(--border-strong)]'
                }`}
              />
              کسر کار: {toPersianDigits(deficitHours)}س
            </span>
          </div>
        </LiquidGlassCard>

        {/* 3. تاخیر و تعجیل */}
        <LiquidGlassCard
          glowColor="rgba(166, 138, 100, 0.08)"
          className="rounded-[22px] p-3.5 sm:p-4 flex flex-col justify-between"
        >
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text)] truncate">تاخیر و تعجیل</span>
            <div
              className={`rounded-xl p-1.5 border shrink-0 backdrop-blur-md shadow-sm ${
                hasDelayOrEarly
                  ? 'bg-[var(--semantic-warning)]/20 text-[var(--semantic-warning)] border-[var(--semantic-warning)]/35'
                  : 'bg-[var(--semantic-success)]/20 text-[var(--semantic-success)] border-[var(--semantic-success)]/35'
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-1 sm:gap-1.5">
            <span
              className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                hasDelayOrEarly ? 'text-[var(--semantic-warning)]' : 'text-[var(--semantic-success)]'
              }`}
            >
              {toPersianDigits(totalDelayAndEarlyMins)}
            </span>
            <span className="text-[11px] sm:text-xs text-[var(--text-muted)] font-medium truncate">
              {hasDelayOrEarly ? 'دقیقه مجموع' : 'دقیقه (بدون تاخیر)'}
            </span>
            {totalDelayAndEarlyMins >= 60 && (
              <span
                className="text-[11px] text-[var(--text-muted)] font-mono font-medium truncate"
                title={formatMinutesToPersianReadable(totalDelayAndEarlyMins)}
              >
                ({toPersianDigits(formatMinutesToTimeString(totalDelayAndEarlyMins))})
              </span>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] sm:text-xs text-[var(--text-muted)] border-t border-white/10 pt-2">
            <span
              className={`truncate ${stats.totalDelayMinutes > 0 ? 'text-[var(--semantic-warning)] font-bold' : 'text-[var(--text-muted)] font-medium'}`}
            >
              تاخیر: {toPersianDigits(stats.totalDelayMinutes)}د
            </span>
            <span
              className={`truncate ${stats.totalEarlyLeaveMinutes > 0 ? 'text-[var(--semantic-warning)] font-bold' : 'text-[var(--text-muted)] font-medium'}`}
            >
              تعجیل: {toPersianDigits(stats.totalEarlyLeaveMinutes)}د
            </span>
          </div>
        </LiquidGlassCard>

        {/* 4. کاردکس مرخصی */}
        <LiquidGlassCard
          glowColor="rgba(166, 138, 100, 0.08)"
          className="rounded-[22px] p-3.5 sm:p-4 flex flex-col justify-between"
        >
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text)] truncate">مانده مرخصی</span>
            <div className="rounded-xl bg-[var(--accent)]/20 p-1.5 text-[var(--accent)] border border-[var(--accent)]/35 backdrop-blur-md shrink-0 shadow-sm">
              <Coffee className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-[var(--accent)] font-mono tracking-tight">
              {toPersianDigits(stats.remainingLeaveDays.toFixed(1))}
            </span>
            <span className="text-[11px] sm:text-xs text-[var(--text)] font-bold">روز</span>
            <span
              className="text-[11px] text-[var(--text-muted)] font-mono font-medium truncate"
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

          <div className="mt-2.5 flex items-center justify-between text-[11px] sm:text-xs text-[var(--text-muted)] border-t border-white/10 pt-2 font-medium">
            <span className="truncate">مصرف: {toPersianDigits(stats.totalLeaveDays.toFixed(1))} روز</span>
            <span className="text-[var(--semantic-success)] font-bold truncate">
              حضور: {toPersianDigits(stats.presentDaysCount)} روز
            </span>
          </div>
        </LiquidGlassCard>
      </div>

      {/* Optional Financial Summary Banner if salary estimate active */}
      {stats.estimatedOvertimePay !== undefined && stats.estimatedOvertimePay > 0 && (
        <LiquidGlassCard
          variant="subtle"
          className="rounded-[24px] p-4 flex items-center justify-between border-[var(--semantic-success)]/40 text-xs shadow-lg"
        >
          <div className="flex items-center gap-2.5 text-[var(--semantic-success)] font-medium">
            <div className="rounded-xl bg-[var(--semantic-success)]/20 p-1.5 border border-[var(--semantic-success)]/30">
              <Banknote className="h-4 w-4" />
            </div>
            <span>برآورد ارزش ریالی اضافه کاری این ماه (بر اساس نرخ تنظیمی شما):</span>
          </div>
          <div className="font-mono text-base font-black text-[var(--semantic-success)]">
            {toPersianDigits(stats.estimatedOvertimePay.toLocaleString())} تومان
          </div>
        </LiquidGlassCard>
      )}
    </div>
  );
};
