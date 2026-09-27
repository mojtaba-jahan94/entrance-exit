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

  return (
    <div className="space-y-4">
      {/* 4 Bento Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. کارکرد مفید ماه */}
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
            <span className="text-xs text-slate-400">ساعت از {toPersianDigits(requiredHours)} موظفی</span>
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

        {/* 2. تراز اضافه کاری و کارکرد خالص */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-md transition-all hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">تراز اضافه کار ماه</span>
            <div className={`rounded-xl p-2 border ${
              isNetPositive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              <Scale className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono ${
              isNetPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isNetPositive ? '+' : '-'}{toPersianDigits(netBalanceHours)}
            </span>
            <span className="text-xs text-slate-400">
              ساعت {isNetPositive ? 'تراز مازاد (بستانکار)' : 'کسری کلی'}
            </span>
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
            <span className="text-xs font-medium text-slate-400">تاخیر بعد از ۰۹:۳۰ و تعجیل</span>
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
            <span>تعجیل: {toPersianDigits(stats.totalEarlyLeaveMinutes)} د</span>
            <span>کل کسر کار: {toPersianDigits(Math.round(stats.totalDeficitMinutes / 60))} س</span>
          </div>
        </div>

        {/* 4. کاردکس مرخصی (روز و ساعت) */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-md transition-all hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">مانده مرخصی (سهمیه ۲.۵ روز)</span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
              <Coffee className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              {toPersianDigits(stats.remainingLeaveDays)}
            </span>
            <span className="text-xs text-slate-300 font-semibold">روز</span>
            <span className="text-xs text-slate-400 font-mono">
              ({toPersianDigits(stats.remainingLeaveHours.toFixed(1))} س باقیمانده)
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span>مصرف: {toPersianDigits(stats.totalLeaveDays)} روز ({toPersianDigits(stats.totalLeaveHours.toFixed(1))} س)</span>
            <span className="text-emerald-400 font-medium">
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

