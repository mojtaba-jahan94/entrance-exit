import React from 'react';
import {
  Clock,
  Scale,
  AlertCircle,
  Coffee,
  Banknote,
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

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, monthName, year: _year }) => {
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. کارکرد مفید ماه (Warm Wood Accent) */}
        <div className="relative overflow-hidden rounded-[24px] border border-[#D1D5DB] bg-white p-4 sm:p-5 shadow-sm transition-all hover:border-[#A68A64] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#6B7280] truncate">
              کارکرد ماه {monthName}
            </span>
            <div className="rounded-xl bg-[#F5F0E6] p-2 text-[#A68A64] border border-[#A68A64]/30 shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-1 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#1F2933] font-mono tabular-nums">
              {toPersianDigits(workedHours)}
            </span>
            <span className="text-[10px] sm:text-xs text-[#6B7280] truncate">
              ساعت از {toPersianDigits(requiredHours)}
            </span>
          </div>

          {/* Progress Bar & Sub-row */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#6B7280] mb-1">
              <span>تحقق موظفی</span>
              <span className="font-bold text-[#A68A64] font-mono">{toPersianDigits(stats.completionRate)}٪</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#F7F7F2] border border-[#D1D5DB]/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#A68A64] transition-all duration-500"
                style={{ width: `${Math.min(100, stats.completionRate)}%` }}
              />
            </div>
            {stats.totalMonthRequiredMinutes && (
              <div className="mt-2 flex items-center justify-between text-[10px] text-[#6B7280] border-t border-[#D1D5DB]/60 pt-1.5">
                <span>کل موظفی تقویمی:</span>
                <span className="font-mono text-[#1F2933] font-medium">{toPersianDigits(totalMonthHours)} ساعت</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. تراز اضافه کاری و کارکرد خالص (Semantic Green / Red / Neutral) */}
        <div className="relative overflow-hidden rounded-[24px] border border-[#D1D5DB] bg-white p-4 sm:p-5 shadow-sm transition-all hover:border-[#A68A64] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#6B7280] truncate">تراز کارکرد</span>
            <div
              className={`rounded-xl p-2 border shrink-0 ${
                isNetPositive
                  ? 'bg-emerald-50 text-[#2E6F40] border-[#2E6F40]/30'
                  : isNetZero
                  ? 'bg-[#F7F7F2] text-[#6B7280] border-[#D1D5DB]'
                  : 'bg-rose-50 text-[#B91C1C] border-rose-200'
              }`}
            >
              <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-1 sm:gap-2">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tabular-nums ${
                isNetPositive ? 'text-[#2E6F40]' : isNetZero ? 'text-[#1F2933]' : 'text-[#B91C1C]'
              }`}
            >
              {isNetPositive ? '+' : stats.netBalanceMinutes < 0 ? '-' : ''}
              {toPersianDigits(netBalanceHours)}
            </span>
            <span className="text-[10px] sm:text-xs text-[#6B7280] truncate">
              {isNetPositive ? 'ساعت مازاد' : isNetZero ? 'ساعت (سر‌به‌سر)' : 'ساعت کسری'}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px] sm:text-xs text-[#6B7280] border-t border-[#D1D5DB]/60 pt-2">
            <span className="flex items-center gap-1 truncate text-[#2E6F40] font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2E6F40] shrink-0" />
              اضافه: {toPersianDigits(totalOvertimeHours)}س
            </span>
            <span
              className={`flex items-center gap-1 truncate font-medium ${
                hasDeficit ? 'text-[#B91C1C]' : 'text-[#6B7280]'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  hasDeficit ? 'bg-[#B91C1C]' : 'bg-[#D1D5DB]'
                }`}
              />
              کسر کار: {toPersianDigits(deficitHours)}س
            </span>
          </div>
        </div>

        {/* 3. تاخیر و تعجیل (Semantic Amber / Green) */}
        <div className="relative overflow-hidden rounded-[24px] border border-[#D1D5DB] bg-white p-4 sm:p-5 shadow-sm transition-all hover:border-[#A68A64] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#6B7280] truncate">تاخیر و تعجیل</span>
            <div
              className={`rounded-xl p-2 border shrink-0 ${
                hasDelayOrEarly
                  ? 'bg-amber-50 text-[#D97706] border-amber-200'
                  : 'bg-emerald-50 text-[#2E6F40] border-[#2E6F40]/30'
              }`}
            >
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-1 sm:gap-2">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tabular-nums ${
                hasDelayOrEarly ? 'text-[#D97706]' : 'text-[#2E6F40]'
              }`}
            >
              {toPersianDigits(totalDelayAndEarlyMins)}
            </span>
            <span className="text-[10px] sm:text-xs text-[#6B7280] truncate">
              {hasDelayOrEarly ? 'دقیقه مجموع' : 'دقیقه (بدون تاخیر)'}
            </span>
            {totalDelayAndEarlyMins >= 60 && (
              <span
                className="text-[10px] sm:text-xs text-[#6B7280] font-mono truncate"
                title={formatMinutesToPersianReadable(totalDelayAndEarlyMins)}
              >
                ({toPersianDigits(formatMinutesToTimeString(totalDelayAndEarlyMins))})
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px] sm:text-xs text-[#6B7280] border-t border-[#D1D5DB]/60 pt-2">
            <span
              className={`truncate ${
                stats.totalDelayMinutes > 0 ? 'text-[#D97706] font-medium' : 'text-[#6B7280]'
              }`}
            >
              تاخیر: {toPersianDigits(stats.totalDelayMinutes)}د
            </span>
            <span
              className={`truncate ${
                stats.totalEarlyLeaveMinutes > 0 ? 'text-[#D97706] font-medium' : 'text-[#6B7280]'
              }`}
            >
              تعجیل: {toPersianDigits(stats.totalEarlyLeaveMinutes)}د
            </span>
          </div>
        </div>

        {/* 4. کاردکس مرخصی (Warm Wood Coffee) */}
        <div className="relative overflow-hidden rounded-[24px] border border-[#D1D5DB] bg-white p-4 sm:p-5 shadow-sm transition-all hover:border-[#A68A64] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#6B7280] truncate">مانده مرخصی</span>
            <div className="rounded-xl bg-[#F5F0E6] p-2 text-[#A68A64] border border-[#A68A64]/30 shrink-0">
              <Coffee className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#1F2933] font-mono tabular-nums">
              {toPersianDigits(stats.remainingLeaveDays.toFixed(1))}
            </span>
            <span className="text-[10px] sm:text-xs text-[#6B7280] font-semibold">روز</span>
            <span
              className="text-[9px] sm:text-xs text-[#6B7280] font-mono truncate"
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

          <div className="mt-3 flex items-center justify-between text-[10px] sm:text-xs text-[#6B7280] border-t border-[#D1D5DB]/60 pt-2">
            <span className="truncate">مصرف: {toPersianDigits(stats.totalLeaveDays.toFixed(1))} روز</span>
            <span className="text-[#2E6F40] font-medium truncate">
              حضور: {toPersianDigits(stats.presentDaysCount)} روز
            </span>
          </div>
        </div>
      </div>

      {/* Optional Financial Summary Banner in Warm Wood Tint */}
      {stats.estimatedOvertimePay !== undefined && stats.estimatedOvertimePay > 0 && (
        <div className="flex items-center justify-between rounded-2xl bg-[#F5F0E6] p-3.5 border border-[#A68A64]/30 text-xs text-[#1F2933] shadow-sm">
          <div className="flex items-center gap-2 text-[#1F2933]">
            <Banknote className="h-4 w-4 text-[#A68A64]" />
            <span className="font-medium">برآورد ارزش اضافه کاری این ماه (بر اساس نرخ تنظیمی شما):</span>
          </div>
          <div className="font-mono text-sm sm:text-base font-bold text-[#2E6F40]">
            {toPersianDigits(stats.estimatedOvertimePay.toLocaleString())} تومان
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsCards;
