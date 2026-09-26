import React from 'react';
import {
  Clock,
  TrendingUp,
  AlertCircle,
  Coffee,
  CalendarCheck2,
  Hourglass,
  Zap,
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. کل کارکرد مفید ماه */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-md transition-all hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">کارکرد مفید ماه {monthName}</span>
          <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-white font-mono">
            {toPersianDigits(workedHours)}
          </span>
          <span className="text-xs text-slate-400">ساعت از {toPersianDigits(requiredHours)} ساعت موظفی</span>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>درصد تحقق موظفی</span>
            <span className="font-bold text-indigo-400">{toPersianDigits(stats.completionRate)}٪</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${Math.min(100, stats.completionRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. اضافه کاری ماه */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-md transition-all hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">مجموع اضافه کاری</span>
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {toPersianDigits((totalOvertimeTotal / 60).toFixed(1))}
          </span>
          <span className="text-xs text-slate-400">ساعت اضافه کار</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            عادی: {toPersianDigits(overtimeHours)} س
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            تعطیلات: {toPersianDigits(holidayOvertimeHours)} س
          </span>
        </div>
      </div>

      {/* 3. تاخیر و کسر کار */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-md transition-all hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">مجموع تاخیر و کسر کار</span>
          <div className={`rounded-xl p-2 border ${
            stats.totalDelayMinutes > 0
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-2xl sm:text-3xl font-black font-mono ${
            stats.totalDelayMinutes > 0 ? 'text-rose-400' : 'text-slate-200'
          }`}>
            {toPersianDigits(stats.totalDelayMinutes)}
          </span>
          <span className="text-xs text-slate-400">دقیقه تاخیر ورود</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span>تعجیل: {toPersianDigits(stats.totalEarlyLeaveMinutes)} دقیقه</span>
          <span>کل کسری: {toPersianDigits(Math.round(stats.totalDeficitMinutes / 60))} ساعت</span>
        </div>
      </div>

      {/* 4. کاردکس مرخصی ماه */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-md transition-all hover:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">مانده مرخصی استحقاقی</span>
          <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
            <Coffee className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
            {toPersianDigits(stats.remainingLeaveHours.toFixed(1))}
          </span>
          <span className="text-xs text-slate-400">ساعت باقیمانده</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span>مصرف‌شده: {toPersianDigits(stats.totalLeaveHours.toFixed(1))} ساعت</span>
          <span className="text-emerald-400 font-medium">
            حضور: {toPersianDigits(stats.presentDaysCount)} روز
          </span>
        </div>
      </div>
    </div>
  );
};
