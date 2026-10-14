import React, { useState, useEffect } from 'react';
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
  Activity,
  Zap,
} from 'lucide-react';
import { AttendanceRecord, ShiftConfig, MonthlyStats } from '../types';
import {
  toPersianDigits,
  formatMinutesToTimeString,
  formatMinutesToPersianReadable,
  parseJalaliDate,
  getJalaliWeekdayName,
  getTodayJalaliString,
  timeStringToMinutes,
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

  // Live timer tick every second for smooth live clock and real-time progress
  const [liveNow, setLiveNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = getTodayJalaliString();
  const monthPrefix = `${selectedYear}/${selectedMonth < 10 ? '0' + selectedMonth : selectedMonth}/`;
  const monthRecords = records
    .filter((r) => r.date.startsWith(monthPrefix))
    .sort((a, b) => a.date.localeCompare(b.date));

  const standardDailyNet = Math.max(
    60,
    (config.requiredDailyMinutes || 510) - (config.defaultBreakMinutes || 30)
  ); // 480 mins (8 hours)

  // Compute daily credited work metrics with live real-time calculation for today
  const chartItems = monthRecords.map((r) => {
    const isToday = r.date === todayStr;
    const isCurrentlyWorking = isToday && Boolean(r.checkIn && !r.checkOut);
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

    let physicalWorked = 0;
    let liveOvertime = 0;
    let liveDeficit = 0;
    let remainingMinutesToTarget = 0;
    let targetExitTimeStr = '';

    if (isCurrentlyWorking && r.checkIn) {
      // Dynamic live presence calculation for today
      const inMins = timeStringToMinutes(r.checkIn);
      const curMins = liveNow.getHours() * 60 + liveNow.getMinutes();
      const rawPresenceLive = Math.max(0, curMins - inMins);

      // Auto lunch deduction if shift is over 4 hours and not Thursday/Holiday
      const breakMins = isThu || isHol ? 0 : (r.breakMinutes !== undefined ? r.breakMinutes : (config.defaultBreakMinutes ?? 30));
      const effectiveBreak = rawPresenceLive > 240 ? breakMins : 0;
      physicalWorked = Math.max(0, rawPresenceLive - effectiveBreak);

      const effectiveTotal = physicalWorked + (r.leaveMinutes || 0);
      if (effectiveTotal > requiredNet) {
        liveOvertime = effectiveTotal - requiredNet;
      } else if (effectiveTotal < requiredNet) {
        liveDeficit = requiredNet - effectiveTotal;
      }

      remainingMinutesToTarget = Math.max(0, requiredNet - effectiveTotal);
      const totalPlannedBreak = requiredNet > 240 ? breakMins : 0;
      const targetExitMinutes = inMins + requiredNet + totalPlannedBreak - (r.leaveMinutes || 0);
      targetExitTimeStr = r.targetCheckOut || formatMinutesToTimeString(targetExitMinutes);
    } else {
      physicalWorked = isLeave ? 0 : r.workedMinutes;
    }

    const leaveMinutes = r.leaveMinutes || (isLeave ? requiredNet : 0);
    const totalCreditMinutes = isLeave ? requiredNet : (physicalWorked + (r.leaveMinutes || 0));

    // Determine bar color and style
    let barColor = 'from-indigo-600 to-cyan-400';
    if (isCurrentlyWorking) {
      barColor = 'from-cyan-500 via-teal-400 to-emerald-400';
    } else if (isLeave) {
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
      isToday,
      isCurrentlyWorking,
      isLeave,
      isThu,
      isFri,
      isHol,
      requiredNet,
      physicalWorked,
      leaveMinutes,
      totalCreditMinutes,
      barColor,
      liveOvertime,
      liveDeficit,
      remainingMinutesToTarget,
      targetExitTimeStr,
    };
  });

  const isAnyWorkingToday = chartItems.some((i) => i.isCurrentlyWorking);

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
        {/* Header with Clean Status & Minimal Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 mb-3 gap-2.5">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white">روند کارکرد روزانه این ماه</h3>
                {isAnyWorkingToday && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400" />
                    </span>
                    <span>شیفت زنده امروز</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                ساعات کارکرد خالص و موثر روزانه در مقایسه با سقف موظفی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] sm:text-[11px] text-slate-400 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              تکمیل موظفی
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              اضافه کار
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              کسر کار
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              مرخصی
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
            <div className="min-w-[420px] pt-4">
              {/* Bars Canvas Area */}
              <div className="relative h-44 sm:h-52 w-full">
                {/* Standard Target Line (8 hours) */}
                <div
                  className="absolute left-0 right-0 border-b border-dashed border-cyan-500/25 z-10 pointer-events-none flex items-center justify-end px-1"
                  style={{ bottom: `${standardTargetPercent}%` }}
                >
                  <span className="text-[9px] font-mono text-cyan-400/70 select-none">
                    موظفی عادی: {toPersianDigits((standardDailyNet / 60).toFixed(0))}س
                  </span>
                </div>

                {/* Thursday Target Line (4 hours) */}
                {config.thursdayStatus === 'half_day' && (
                  <div
                    className="absolute left-0 right-0 border-b border-dotted border-amber-500/25 z-10 pointer-events-none flex items-center justify-start px-1"
                    style={{ bottom: `${thursdayTargetPercent}%` }}
                  >
                    <span className="text-[9px] font-mono text-amber-400/70 select-none">
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
                        {/* Unified & Structured Floating Tooltip on Hover */}
                        {hoveredRecord?.date === r.date && (
                          <div className="absolute -top-36 sm:-top-40 left-1/2 -translate-x-1/2 z-40 w-52 rounded-xl border border-slate-700/80 bg-slate-950/95 p-2.5 text-xs shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 pointer-events-none space-y-1.5">
                            {/* Card Header: Date & Status Badge */}
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-[11px]">
                              <span className="font-bold text-white font-mono flex items-center gap-1">
                                {item.isCurrentlyWorking && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                )}
                                روز {toPersianDigits(jd)} <span className="text-slate-400 font-normal">({weekdayName})</span>
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  item.isCurrentlyWorking
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                                    : item.isLeave
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                                    : item.isHol
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                                    : r.status === 'present'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {item.isCurrentlyWorking
                                  ? 'در حال کار'
                                  : item.isLeave
                                  ? 'مرخصی'
                                  : item.isHol
                                  ? (item.isFri ? 'جمعه' : 'تعطیل')
                                  : r.status === 'present'
                                  ? 'حاضر'
                                  : 'ثبت‌شده'}
                              </span>
                            </div>

                            {/* Key-Value Details */}
                            <div className="space-y-1 text-[11px]">
                              {/* 1. Time In & Time Out */}
                              <div className="flex items-center justify-between text-slate-300">
                                <span className="text-slate-400">ورود / خروج:</span>
                                <span className="font-mono text-white font-medium">
                                  {r.checkIn ? toPersianDigits(r.checkIn) : '—'}
                                  {' تا '}
                                  {item.isCurrentlyWorking
                                    ? (item.targetExitTimeStr ? `${toPersianDigits(item.targetExitTimeStr)} (هدف)` : 'اکنون')
                                    : (r.checkOut ? toPersianDigits(r.checkOut) : '—')}
                                </span>
                              </div>

                              {/* 2. Effective / Worked Time */}
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">
                                  {item.isCurrentlyWorking ? 'کارکرد تا اکنون:' : 'کارکرد موثر:'}
                                </span>
                                <span className="font-mono font-bold text-cyan-300">
                                  {item.isLeave
                                    ? formatMinutesToPersianReadable(item.totalCreditMinutes)
                                    : item.physicalWorked > 0
                                    ? formatMinutesToPersianReadable(item.physicalWorked)
                                    : '۰ دقیقه'}
                                </span>
                              </div>

                              {/* 3. Hourly Leave if any */}
                              {!item.isLeave && item.leaveMinutes > 0 && (
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-slate-400">مرخصی ساعتی:</span>
                                  <span className="font-mono font-bold text-amber-300">
                                    {formatMinutesToPersianReadable(item.leaveMinutes)}
                                  </span>
                                </div>
                              )}

                              {/* 4. Delay or Early Departure if any */}
                              {(r.delayMinutes > 0 || r.earlyLeaveMinutes > 0) && !item.isCurrentlyWorking && (
                                <div className="flex items-center justify-between text-[10px] text-rose-300/90">
                                  <span className="text-slate-400">کسورات زمانی:</span>
                                  <span className="font-mono">
                                    {r.delayMinutes > 0 && `تاخیر: ${toPersianDigits(r.delayMinutes)}د`}
                                    {r.delayMinutes > 0 && r.earlyLeaveMinutes > 0 && ' | '}
                                    {r.earlyLeaveMinutes > 0 && `تعجیل: ${toPersianDigits(r.earlyLeaveMinutes)}د`}
                                  </span>
                                </div>
                              )}

                              {/* 5. Balance / Result Row */}
                              <div className="border-t border-slate-800/80 pt-1 flex items-center justify-between font-bold">
                                <span className="text-slate-400 text-[10px]">وضعیت تراز:</span>
                                {item.isCurrentlyWorking ? (
                                  item.remainingMinutesToTarget > 0 ? (
                                    <span className="text-amber-300 font-mono text-[10px]">
                                      {formatMinutesToPersianReadable(item.remainingMinutesToTarget)} تا موظفی
                                    </span>
                                  ) : (
                                    <span className="text-emerald-400 font-mono text-[10px]">
                                      +{formatMinutesToPersianReadable(item.liveOvertime)} اضافه کار
                                    </span>
                                  )
                                ) : r.overtimeMinutes > 0 ? (
                                  <span className="text-emerald-400 font-mono text-[10px]">
                                    +{formatMinutesToPersianReadable(r.overtimeMinutes)} اضافه کار
                                  </span>
                                ) : r.deficitMinutes > 0 ? (
                                  <span className="text-rose-400 font-mono text-[10px]">
                                    -{formatMinutesToPersianReadable(r.deficitMinutes)} کسر کار
                                  </span>
                                ) : item.isLeave ? (
                                  <span className="text-amber-400 font-mono text-[10px]">
                                    مرخصی کامل
                                  </span>
                                ) : item.isHol ? (
                                  <span className="text-purple-300 font-mono text-[10px]">
                                    روز تعطیل
                                  </span>
                                ) : (
                                  <span className="text-cyan-400 font-mono text-[10px]">
                                    تکمیل موظفی
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Bar Pillar with Dynamic Live Glow */}
                        <div
                          className={`w-full max-w-[20px] rounded-t-md bg-gradient-to-t ${item.barColor} transition-all duration-300 group-hover:brightness-125 shadow-sm ${
                            item.isCurrentlyWorking
                              ? 'ring-2 ring-cyan-400 shadow-md shadow-cyan-500/30 relative overflow-hidden min-h-[6px]'
                              : ''
                          }`}
                          style={{ height: `${item.isCurrentlyWorking ? Math.max(4, heightPercent) : heightPercent}%` }}
                        >
                          {/* Top neon cap for live bar */}
                          {item.isCurrentlyWorking && (
                            <div className="absolute top-0 inset-x-0 h-0.5 bg-white/90 rounded-t-md shadow-[0_0_6px_#22d3ee]" />
                          )}
                          {/* Live shimmer reflection effect */}
                          {item.isCurrentlyWorking && (
                            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-cyan-300/20 to-transparent animate-pulse" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day Labels Row */}
              <div className="flex items-center justify-between gap-1 sm:gap-2 px-1 mt-2 pt-1.5 border-t border-slate-800/60">
                {chartItems.map((item) => {
                  const { jd } = parseJalaliDate(item.record.date);
                  return (
                    <div
                      key={`lbl_${item.record.id || item.record.date}`}
                      className="flex-1 text-center font-mono text-[9px] sm:text-[10px]"
                    >
                      {item.isToday ? (
                        <span className="inline-flex items-center justify-center px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40 shadow-sm text-[8px] sm:text-[9px]">
                          {toPersianDigits(jd)}
                        </span>
                      ) : (
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
                      )}
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
          {isAnyWorkingToday && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              شیفت فعال
            </span>
          )}
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
