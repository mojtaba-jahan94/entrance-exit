import React, { useState } from 'react';
import {
  TrendingUp,
  Clock,
  Calendar,
  AlertTriangle,
  Coffee,
  CheckCircle2,
  PieChart as PieChartIcon,
  BarChart3,
  Award,
  Sparkles,
} from 'lucide-react';
import { AttendanceRecord, ShiftConfig, MonthlyStats } from '../types';
import {
  toPersianDigits,
  formatMinutesToTimeString,
  formatMinutesToPersianReadable,
  parseJalaliDate,
} from '../utils/jalali';

interface DashboardChartsProps {
  records: AttendanceRecord[];
  stats: MonthlyStats;
  config: ShiftConfig;
  selectedYear: number;
  selectedMonth: number;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  records,
  stats,
  config,
  selectedYear,
  selectedMonth,
}) => {
  const [hoveredRecord, setHoveredRecord] = useState<AttendanceRecord | null>(null);

  const monthPrefix = `${selectedYear}/${selectedMonth < 10 ? '0' + selectedMonth : selectedMonth}/`;
  const monthRecords = records
    .filter((r) => r.date.startsWith(monthPrefix))
    .sort((a, b) => a.date.localeCompare(b.date));

  // If few records in this month, take the last 14 available records
  const displayRecords = monthRecords.length > 0 ? monthRecords : records.slice(0, 14);

  // Maximum scale for daily chart (in minutes, max of 10 hours or highest worked)
  const maxWorkedMinutes = Math.max(
    600, // 10 hours
    ...displayRecords.map((r) => r.workedMinutes + (r.leaveMinutes || 0))
  );

  const standardDailyNet = Math.max(
    60,
    (config.requiredDailyMinutes || 510) - (config.defaultBreakMinutes || 30)
  );

  // Calculation for Donut Chart
  const totalDays = Math.max(
    1,
    stats.presentDaysCount + stats.absentDaysCount + stats.leaveDaysCount
  );
  const presentPct = Math.round((stats.presentDaysCount / totalDays) * 100);
  const leavePct = Math.round((stats.leaveDaysCount / totalDays) * 100);
  const absentPct = Math.max(0, 100 - presentPct - leavePct);

  // Punctuality rate: days present without delay
  const onTimeDays = monthRecords.filter(
    (r) => (r.status === 'present' || r.status === 'in_progress') && r.delayMinutes === 0
  ).length;
  const punctualityPct =
    stats.presentDaysCount > 0 ? Math.round((onTimeDays / stats.presentDaysCount) * 100) : 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* 1. Daily Work Hours Bar Chart (Span 2 cols on lg) */}
      <div className="lg:col-span-2 rounded-2xl sm:rounded-3xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">روند کارکرد روزانه این ماه</h3>
              <p className="text-[10px] sm:text-xs text-slate-400">
                ساعات حضور در مقایسه با موظفی استاندارد (۸ ساعت)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] sm:text-xs">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              تکمیل / اضافه کار
            </span>
            <span className="flex items-center gap-1 text-indigo-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              عادی
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              مرخصی
            </span>
          </div>
        </div>

        {/* The Bar Chart Canvas */}
        <div className="relative pt-4 pb-2">
          {/* Target line: 8 hours */}
          <div
            className="absolute left-0 right-0 border-b border-dashed border-cyan-400/40 z-10 pointer-events-none flex items-center justify-end px-2"
            style={{
              bottom: `${(standardDailyNet / maxWorkedMinutes) * 100}%`,
            }}
          >
            <span className="text-[9px] font-mono text-cyan-300 bg-slate-950/90 px-1.5 py-0.5 rounded border border-cyan-500/30">
              موظفی: ۸س
            </span>
          </div>

          {/* Bars Container */}
          <div className="flex items-end justify-between gap-1 sm:gap-2 h-44 sm:h-52 px-1">
            {displayRecords.length === 0 ? (
              <div className="w-full flex items-center justify-center text-xs text-slate-500 h-full">
                هنوز ترددی در این ماه ثبت نشده است.
              </div>
            ) : (
              displayRecords.map((r) => {
                const { jd } = parseJalaliDate(r.date);
                const totalEffective = r.workedMinutes + (r.leaveMinutes || 0);
                const heightPercent = Math.min(100, Math.max(6, (totalEffective / maxWorkedMinutes) * 100));

                let barColor = 'from-indigo-600 to-indigo-400';
                if (r.status === 'leave') {
                  barColor = 'from-amber-600 to-amber-400';
                } else if (r.overtimeMinutes > 0) {
                  barColor = 'from-emerald-600 to-emerald-400';
                } else if (r.deficitMinutes > 0) {
                  barColor = 'from-rose-600 to-rose-400';
                } else if (r.isHoliday) {
                  barColor = 'from-slate-700 to-slate-600';
                }

                return (
                  <div
                    key={r.id || r.date}
                    className="flex-1 flex flex-col items-center group relative cursor-pointer"
                    onMouseEnter={() => setHoveredRecord(r)}
                    onMouseLeave={() => setHoveredRecord(null)}
                  >
                    {/* Tooltip on Hover */}
                    {hoveredRecord?.date === r.date && (
                      <div className="absolute -top-16 z-30 min-w-[120px] rounded-xl border border-slate-700 bg-slate-950/95 p-2 text-center text-[10px] shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 pointer-events-none">
                        <div className="font-bold text-white mb-0.5 font-mono">
                          روز {toPersianDigits(jd)} ({toPersianDigits(r.date)})
                        </div>
                        <div className="text-emerald-400 font-semibold">
                          کارکرد: {formatMinutesToPersianReadable(r.workedMinutes)}
                        </div>
                        {r.leaveMinutes !== undefined && r.leaveMinutes > 0 && (
                          <div className="text-amber-400">
                            مرخصی: {formatMinutesToPersianReadable(r.leaveMinutes)}
                          </div>
                        )}
                        {r.delayMinutes > 0 && (
                          <div className="text-rose-400">
                            تاخیر: {toPersianDigits(r.delayMinutes)} دقیقه
                          </div>
                        )}
                        {r.overtimeMinutes > 0 && (
                          <div className="text-indigo-400">
                            اضافه کار: {formatMinutesToPersianReadable(r.overtimeMinutes)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bar Pillar */}
                    <div
                      className={`w-full max-w-[24px] rounded-t-lg bg-gradient-to-t ${barColor} transition-all duration-300 group-hover:brightness-125 shadow-md`}
                      style={{ height: `${heightPercent}%` }}
                    />

                    {/* Day label */}
                    <span className="mt-1 text-[9px] sm:text-[10px] text-slate-400 font-mono">
                      {toPersianDigits(jd)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 2. Donut & Performance Ratio Column */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20">
              <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">توزیع وضعیت روزها</h3>
              <p className="text-[10px] text-slate-400">تحلیل نرخ حضور و انضباط ماه</p>
            </div>
          </div>
        </div>

        {/* Visual Donut Ring */}
        <div className="flex items-center justify-center my-3 relative">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            {/* Background Track */}
            <path
              className="text-slate-800/70"
              strokeWidth="3.8"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {/* Present segment (Emerald) */}
            <path
              className="text-emerald-500 transition-all duration-1000 ease-out"
              strokeDasharray={`${presentPct}, 100`}
              strokeWidth="4"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {/* Leave segment (Amber) */}
            {leavePct > 0 && (
              <path
                className="text-amber-400 transition-all duration-1000 ease-out"
                strokeDasharray={`${leavePct}, 100`}
                strokeDashoffset={`${-presentPct}`}
                strokeWidth="4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            )}
          </svg>

          {/* Center Info in Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {toPersianDigits(stats.completionRate)}%
            </span>
            <span className="text-[10px] text-slate-400">تکمیل موظفی</span>
          </div>
        </div>

        {/* Stats breakdown list */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              روزهای حضور موثر:
            </span>
            <span className="font-mono font-bold text-emerald-400">
              {toPersianDigits(stats.presentDaysCount)} روز ({toPersianDigits(presentPct)}%)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              مرخصی ثبت‌شده:
            </span>
            <span className="font-mono font-bold text-amber-400">
              {toPersianDigits(stats.totalLeaveDays)} روز ({toPersianDigits(leavePct)}%)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Award className="h-3.5 w-3.5 text-indigo-400" />
              شاخص خوش‌قولی ورود:
            </span>
            <span className="font-mono font-bold text-indigo-300">
              {toPersianDigits(punctualityPct)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
