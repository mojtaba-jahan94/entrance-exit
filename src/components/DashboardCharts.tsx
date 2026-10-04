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
  getJalaliWeekdayName,
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

  const standardDailyNet = Math.max(
    60,
    (config.requiredDailyMinutes || 510) - (config.defaultBreakMinutes || 30)
  ); // 480 mins (8 hours)

  // Compute daily credited work metrics without double-counting leave
  const chartItems = monthRecords.map((r) => {
    const isLeave = r.status === 'leave';
    const isThu = r.dayOfWeek === 5;
    const isFri = r.dayOfWeek === 6;
    const isHol = isFri || Boolean(r.isHoliday);

    const requiredNet = isHol
      ? 0
      : isThu
      ? (config.thursdayStatus === 'half_day'
          ? (config.thursdayMinutes || 240)
          : (config.thursdayStatus === 'off' ? 0 : standardDailyNet))
      : standardDailyNet;

    // Physical worked minutes (0 on full leave days)
    const physicalWorked = isLeave ? 0 : r.workedMinutes;
    // Leave minutes (covers the shift on full leave days or partial hourly leave)
    const leaveMinutes = r.leaveMinutes || (isLeave ? requiredNet : 0);
    // Total effective credited time: never double counts leave
    const totalCreditMinutes = isLeave ? requiredNet : (physicalWorked + (r.leaveMinutes || 0));

    // Determine bar color and style
    let barColor = 'from-indigo-600 to-cyan-400';
    if (isLeave) {
      barColor = 'from-amber-600 to-amber-400';
    } else if (isHol) {
      if (r.workedMinutes > 0) {
        barColor = 'from-purple-600 to-indigo-400';
      } else {
        barColor = 'from-slate-800 to-slate-700';
      }
    } else if (r.overtimeMinutes > 0) {
      barColor = 'from-emerald-600 to-teal-400';
    } else if (r.deficitMinutes > 0) {
      barColor = 'from-rose-600 to-rose-400';
    } else if (isThu && totalCreditMinutes >= requiredNet) {
      barColor = 'from-cyan-600 to-teal-400';
    }

    return {
      record: r,
      isLeave,
      isThu,
      isFri,
      isHol,
      requiredNet,
      physicalWorked,
      leaveMinutes,
      totalCreditMinutes,
      barColor,
    };
  });

  // Maximum scale for daily chart (in minutes, min 10 hours = 600m or highest credit)
  const maxCreditMinutes = Math.max(
    600,
    ...chartItems.map((item) => item.totalCreditMinutes)
  );

  // Target lines relative to maxCreditMinutes
  const standardTargetPercent = (standardDailyNet / maxCreditMinutes) * 100;
  const thursdayTargetPercent = (240 / maxCreditMinutes) * 100;

  // Donut completion percentage
  const completionPercent = Math.min(100, Math.max(0, stats.completionRate));

  // Punctuality rate: days present with 0 delay
  const workingRecords = monthRecords.filter(
    (r) => r.status === 'present' || (r.status === 'in_progress' && r.checkIn)
  );
  const onTimeDays = workingRecords.filter((r) => r.delayMinutes === 0).length;
  const punctualityPct =
    workingRecords.length > 0 ? Math.round((onTimeDays / workingRecords.length) * 100) : 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* 1. Daily Work Hours Bar Chart (Span 2 cols on lg) */}
      <div className="lg:col-span-2 rounded-2xl sm:rounded-3xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
        {/* Header & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 mb-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">روند کارکرد روزانه این ماه</h3>
              <p className="text-[10px] sm:text-xs text-slate-400">
                ساعات کارکرد خالص و موثر روزانه در مقایسه با سقف موظفی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] flex-wrap">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              اضافه کار
            </span>
            <span className="flex items-center gap-1 text-cyan-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              تکمیل موظفی
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              مرخصی
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              کسر کار
            </span>
          </div>
        </div>

        {/* The Bar Chart Canvas */}
        <div className="pt-2 pb-1 overflow-x-auto no-scrollbar">
          {chartItems.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center text-xs text-slate-500 h-48 gap-2">
              <Calendar className="h-6 w-6 text-slate-600" />
              <span>هنوز ترددی در این ماه ثبت نشده است.</span>
            </div>
          ) : (
            <div className="min-w-[420px]">
              {/* Bars Canvas Area */}
              <div className="relative h-44 sm:h-52 w-full">
                {/* Standard Target Line (8 hours) */}
                <div
                  className="absolute left-0 right-0 border-b border-dashed border-cyan-400/50 z-10 pointer-events-none flex items-center justify-end px-2"
                  style={{ bottom: `${standardTargetPercent}%` }}
                >
                  <span className="text-[9px] font-mono text-cyan-300 bg-slate-950/90 px-1.5 py-0.5 rounded border border-cyan-500/30 shadow-sm">
                    موظفی عادی: {toPersianDigits((standardDailyNet / 60).toFixed(0))}س
                  </span>
                </div>

                {/* Thursday Target Line (4 hours) */}
                {config.thursdayStatus === 'half_day' && (
                  <div
                    className="absolute left-0 right-0 border-b border-dotted border-amber-400/30 z-10 pointer-events-none flex items-center justify-start px-2"
                    style={{ bottom: `${thursdayTargetPercent}%` }}
                  >
                    <span className="text-[9px] font-mono text-amber-300/80 bg-slate-950/90 px-1.5 py-0.5 rounded border border-amber-500/20 shadow-sm">
                      پنج‌شنبه: {toPersianDigits(((config.thursdayMinutes || 240) / 60).toFixed(0))}س
                    </span>
                  </div>
                )}

                {/* Bars Row */}
                <div className="absolute inset-0 flex items-end justify-between gap-1 sm:gap-2 px-1">
                  {chartItems.map((item) => {
                    const r = item.record;
                    const { jd } = parseJalaliDate(r.date);
                    const weekdayName = getJalaliWeekdayName(r.date);
                    const heightPercent = item.isHol && item.totalCreditMinutes === 0
                      ? 3
                      : Math.min(100, Math.max(6, (item.totalCreditMinutes / maxCreditMinutes) * 100));

                    return (
                      <div
                        key={r.id || r.date}
                        className="flex-1 h-full flex items-end justify-center group relative cursor-pointer"
                        onMouseEnter={() => setHoveredRecord(r)}
                        onMouseLeave={() => setHoveredRecord(null)}
                      >
                        {/* Rich Floating Tooltip on Hover */}
                        {hoveredRecord?.date === r.date && (
                          <div className="absolute -top-28 z-40 min-w-[150px] rounded-2xl border border-slate-700 bg-slate-950/95 p-2.5 text-center text-xs shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 pointer-events-none space-y-1">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-[11px]">
                              <span className="font-bold text-white font-mono">روز {toPersianDigits(jd)}</span>
                              <span className="text-slate-400">{weekdayName}</span>
                            </div>

                            {item.isLeave ? (
                              <div className="text-amber-400 font-bold text-[11px] pt-0.5">
                                مرخصی: {formatMinutesToPersianReadable(item.totalCreditMinutes)}
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400">کارکرد خالص:</span>
                                <span className="font-mono font-bold text-emerald-400">
                                  {item.physicalWorked > 0 ? toPersianDigits(formatMinutesToTimeString(item.physicalWorked)) : '-'}
                                </span>
                              </div>
                            )}

                            {!item.isLeave && item.leaveMinutes > 0 && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-amber-400">مرخصی ساعتی:</span>
                                <span className="font-mono font-bold text-amber-300">
                                  {toPersianDigits(formatMinutesToTimeString(item.leaveMinutes))}
                                </span>
                              </div>
                            )}

                            {r.delayMinutes > 0 && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-rose-400">تاخیر ورود:</span>
                                <span className="font-mono font-bold text-rose-300">
                                  {toPersianDigits(r.delayMinutes)}د
                                </span>
                              </div>
                            )}

                            {r.earlyLeaveMinutes > 0 && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-amber-400">تعجیل خروج:</span>
                                <span className="font-mono font-bold text-amber-300">
                                  {toPersianDigits(r.earlyLeaveMinutes)}د
                                </span>
                              </div>
                            )}

                            {r.overtimeMinutes > 0 && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-emerald-400">اضافه کار:</span>
                                <span className="font-mono font-bold text-emerald-300">
                                  +{toPersianDigits(formatMinutesToTimeString(r.overtimeMinutes))}
                                </span>
                              </div>
                            )}

                            {r.deficitMinutes > 0 && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-rose-400">کسر کار:</span>
                                <span className="font-mono font-bold text-rose-300">
                                  -{toPersianDigits(formatMinutesToTimeString(r.deficitMinutes))}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Bar Pillar */}
                        <div
                          className={`w-full max-w-[20px] rounded-t-md bg-gradient-to-t ${item.barColor} transition-all duration-300 group-hover:brightness-125 shadow-sm`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day Labels Row (Cleanly placed below the chart coordinate space) */}
              <div className="flex items-center justify-between gap-1 sm:gap-2 px-1 mt-2 pt-1.5 border-t border-slate-800/60">
                {chartItems.map((item) => {
                  const { jd } = parseJalaliDate(item.record.date);
                  return (
                    <div
                      key={`lbl_${item.record.id || item.record.date}`}
                      className="flex-1 text-center font-mono text-[9px] sm:text-[10px]"
                    >
                      <span
                        className={
                          item.isFri
                            ? 'text-rose-400 font-bold'
                            : item.isThu
                            ? 'text-cyan-400 font-medium'
                            : 'text-slate-400'
                        }
                      >
                        {toPersianDigits(jd)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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

        {/* Visual Donut Ring synchronized with Completion Rate */}
        <div className="flex items-center justify-center my-3 relative">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            {/* Background Track */}
            <path
              className="text-slate-800/70"
              strokeWidth="3.6"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {/* Completion Ring */}
            <path
              className="text-cyan-400 transition-all duration-1000 ease-out"
              strokeDasharray={`${completionPercent}, 100`}
              strokeWidth="3.8"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>

          {/* Center Info in Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {toPersianDigits(completionPercent)}%
            </span>
            <span className="text-[10px] text-slate-400">تکمیل موظفی</span>
          </div>
        </div>

        {/* Stats breakdown list */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              روزهای حضور موثر:
            </span>
            <span className="font-mono font-bold text-emerald-400">
              {toPersianDigits(stats.presentDaysCount)} روز
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              مرخصی استفاده‌شده:
            </span>
            <span className="font-mono font-bold text-amber-400">
              {toPersianDigits(stats.totalLeaveDays.toFixed(1))} روز ({toPersianDigits(stats.totalLeaveHours.toFixed(1))}س)
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
