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
  const overtimeHours = (stats.totalOvertimeMinutes / 60).toFixed(1);
  const holidayOvertimeHours = (stats.totalHolidayOvertimeMinutes / 60).toFixed(1);
  const totalOvertimeTotal = stats.totalOvertimeMinutes + stats.totalHolidayOvertimeMinutes;

  const netBalanceHours = (Math.abs(stats.netBalanceMinutes) / 60).toFixed(1);
  const isNetPositive = stats.netBalanceMinutes >= 0;
  const deficitHours = (stats.totalDeficitMinutes / 60).toFixed(1);
  const totalOvertimeHours = ((stats.totalOvertimeMinutes + stats.totalHolidayOvertimeMinutes) / 60).toFixed(1);
  const hasDeficit = stats.totalDeficitMinutes > 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Bento Grid: 2 columns on mobile, 4 columns on large screens */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* 1. کارکرد مفید ماه */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/60 p-3 sm:p-5 shadow-lg backdrop-blur-md transition-all hover:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">کارکرد ماه {monthName}</span>
            <div className="rounded-lg sm:rounded-xl bg-indigo-500/10 p-1.5 sm:p-2 text-indigo-400 border border-indigo-500/20 shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>

          <div className="mt-2 sm:mt-3 flex items-baseline gap-1 sm:gap-2">
            <span className="text-xl sm:text-3xl font-black text-white font-mono">
              {toPersianDigits(workedHours)}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 truncate">ساعت از {toPersianDigits(requiredHours)}</span>
          </div>

          {/* Progress Bar */}
          <div className="mt-2 sm:mt-3">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 mb-1">
              <span>تحقق موظفی</span>
              <span className="font-bold text-indigo-400 font-mono">{toPersianDigits(stats.completionRate)}٪</span>
            </div>
            <div className="h-1.5 sm:h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${Math.min(100, stats.completionRate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. تراز اضافه کاری و کارکرد خالص */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/60 p-3 sm:p-5 shadow-lg backdrop-blur-md transition-all hover:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">تراز اضافه کار</span>
            <div className={`rounded-lg sm:rounded-xl p-1.5 sm:p-2 border shrink-0 ${
              isNetPositive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>

          <div className="mt-2 sm:mt-3 flex items-baseline gap-1 sm:gap-2">
            <span className={`text-xl sm:text-3xl font-black font-mono ${
              isNetPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isNetPositive ? '+' : '-'}{toPersianDigits(netBalanceHours)}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 truncate">
              ساعت {isNetPositive ? 'مازاد' : 'کسری'}
            </span>
          </div>

          <div className="mt-2 sm:mt-3 flex items-center justify-between text-[10px] sm:text-xs text-slate-400 border-t border-slate-800/80 pt-2">
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

        {/* 3. کسر کار و تاخیر */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/60 p-3 sm:p-5 shadow-lg backdrop-blur-md transition-all hover:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">کسر کار و تاخیر</span>
            <div className={`rounded-lg sm:rounded-xl p-1.5 sm:p-2 border shrink-0 ${
              hasDeficit || stats.totalDelayMinutes > 0
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>

          <div className="mt-2 sm:mt-3 flex items-baseline gap-1 sm:gap-2">
            <span className={`text-xl sm:text-3xl font-black font-mono ${
              hasDeficit ? 'text-rose-400' : stats.totalDelayMinutes > 0 ? 'text-amber-400' : 'text-slate-200'
            }`}>
              {hasDeficit
                ? toPersianDigits(deficitHours)
                : toPersianDigits(stats.totalDelayMinutes)}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 truncate">
              {hasDeficit ? 'ساعت کسر کار' : 'دقیقه تاخیر'}
            </span>
            {hasDeficit && (
              <span className="text-[10px] sm:text-xs text-slate-500 font-mono truncate" title={formatMinutesToPersianReadable(stats.totalDeficitMinutes)}>
                ({toPersianDigits(formatMinutesToTimeString(stats.totalDeficitMinutes))})
              </span>
            )}
          </div>

          <div className="mt-2 sm:mt-3 flex items-center justify-between text-[10px] sm:text-xs text-slate-400 border-t border-slate-800/80 pt-2">
            <span className="truncate">تاخیر: {toPersianDigits(stats.totalDelayMinutes)}د</span>
            <span className="truncate">تعجیل: {toPersianDigits(stats.totalEarlyLeaveMinutes)}د</span>
            <span className={`truncate font-semibold ${hasDeficit ? 'text-rose-300' : 'text-slate-400'}`}>
              کسری: {hasDeficit ? `${toPersianDigits(deficitHours)}س` : '۰'}
            </span>
          </div>
        </div>

        {/* 4. کاردکس مرخصی */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/60 p-3 sm:p-5 shadow-lg backdrop-blur-md transition-all hover:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400 truncate">مانده مرخصی</span>
            <div className="rounded-lg sm:rounded-xl bg-amber-500/10 p-1.5 sm:p-2 text-amber-400 border border-amber-500/20 shrink-0">
              <Coffee className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>

          <div className="mt-2 sm:mt-3 flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-xl sm:text-3xl font-black text-amber-400 font-mono">
              {toPersianDigits(stats.remainingLeaveDays)}
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

          <div className="mt-2 sm:mt-3 flex items-center justify-between text-[10px] sm:text-xs text-slate-400 border-t border-slate-800/80 pt-2">
            <span className="truncate">مصرف: {toPersianDigits(stats.totalLeaveDays)} روز</span>
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

