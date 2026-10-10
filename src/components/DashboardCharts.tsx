import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Clock,
  Calendar,
  Coffee,
  CheckCircle2,
  BarChart3,
  Award,
  Zap,
  Scale,
  Sparkles,
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
  // Chart Range Mode: 'recent' (minimal focused 10 days) vs 'month' (full month)
  const [chartMode, setChartMode] = useState<'recent' | 'month'>('recent');
  const [hoveredRecord, setHoveredRecord] = useState<AttendanceRecord | null>(null);

  // Live timer tick for real-time progress on today's active shift
  const [liveNow, setLiveNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = getTodayJalaliString();
  const monthPrefix = `${selectedYear}/${selectedMonth < 10 ? '0' + selectedMonth : selectedMonth}/`;

  const standardDailyNet = Math.max(
    60,
    (config.requiredDailyMinutes || 510) - (config.defaultBreakMinutes || 30)
  ); // 480 mins (8 hours)

  // Compute daily metrics with live real-time calculation for today
  const allMonthItems = useMemo(() => {
    const monthRecords = records
      .filter((r) => r.date.startsWith(monthPrefix))
      .sort((a, b) => a.date.localeCompare(b.date));

    return monthRecords.map((r) => {
      const isToday = r.date === todayStr;
      const isCurrentlyWorking = isToday && Boolean(r.checkIn && !r.checkOut);
      const isLeave = r.status === 'leave';
      const isThu = r.dayOfWeek === 5;
      const isFri = r.dayOfWeek === 6;
      const isHol = isFri || Boolean(r.isHoliday);

      const requiredNet = isHol
        ? 0
        : isThu
        ? config.thursdayStatus === 'half_day'
          ? config.thursdayMinutes || 240
          : config.thursdayStatus === 'off'
          ? 0
          : standardDailyNet
        : standardDailyNet;

      let physicalWorked = 0;
      let liveOvertime = 0;
      let liveDeficit = 0;

      if (isCurrentlyWorking && r.checkIn) {
        const inMins = timeStringToMinutes(r.checkIn);
        const curMins = liveNow.getHours() * 60 + liveNow.getMinutes();
        const rawPresenceLive = Math.max(0, curMins - inMins);
        const breakMins =
          isThu || isHol
            ? 0
            : r.breakMinutes !== undefined
            ? r.breakMinutes
            : config.defaultBreakMinutes ?? 30;
        const effectiveBreak = rawPresenceLive > 240 ? breakMins : 0;
        physicalWorked = Math.max(0, rawPresenceLive - effectiveBreak);

        const effectiveTotal = physicalWorked + (r.leaveMinutes || 0);
        if (effectiveTotal > requiredNet) {
          liveOvertime = effectiveTotal - requiredNet;
        } else if (effectiveTotal < requiredNet) {
          liveDeficit = requiredNet - effectiveTotal;
        }
      } else {
        physicalWorked = isLeave ? 0 : r.workedMinutes;
      }

      const totalCreditMinutes = isLeave ? requiredNet : physicalWorked + (r.leaveMinutes || 0);

      // Clean, minimalist color classes
      let barBgClass = 'bg-indigo-500/80 hover:bg-indigo-400';
      if (isCurrentlyWorking) {
        barBgClass = 'bg-cyan-400 hover:bg-cyan-300 ring-2 ring-cyan-400/50 shadow-md shadow-cyan-500/20';
      } else if (isLeave) {
        barBgClass = 'bg-amber-400/80 hover:bg-amber-300';
      } else if (isHol) {
        barBgClass = r.workedMinutes > 0 ? 'bg-purple-500/80' : 'bg-slate-700/50';
      } else if (r.overtimeMinutes > 0) {
        barBgClass = 'bg-emerald-500/85 hover:bg-emerald-400';
      } else if (r.deficitMinutes > 0) {
        barBgClass = 'bg-rose-400/80 hover:bg-rose-300';
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
        totalCreditMinutes,
        barBgClass,
        liveOvertime,
        liveDeficit,
      };
    });
  }, [records, monthPrefix, todayStr, config, standardDailyNet, liveNow]);

  // Filter items based on chartMode (minimal recent days vs full month)
  const displayItems = useMemo(() => {
    if (chartMode === 'recent') {
      // Focus on last 10 working or active days for a spacious, minimal look
      const withActivity = allMonthItems.filter(
        (i) => i.totalCreditMinutes > 0 || i.isCurrentlyWorking || i.isToday
      );
      if (withActivity.length > 0) {
        return withActivity.slice(-10);
      }
      return allMonthItems.slice(-10);
    }
    return allMonthItems;
  }, [allMonthItems, chartMode]);

  // Maximum scale (at least 10 hours = 600m)
  const maxCreditMinutes = Math.max(
    600,
    ...displayItems.map((item) => item.totalCreditMinutes)
  );

  const standardTargetPercent = (standardDailyNet / maxCreditMinutes) * 100;
  const completionPercent = Math.min(100, Math.max(0, Math.round(stats.completionRate)));

  // Punctuality rate
  const workingRecords = allMonthItems.filter(
    (i) => i.record.status === 'present' || (i.record.status === 'in_progress' && i.record.checkIn)
  );
  const onTimeDays = workingRecords.filter((i) => i.record.delayMinutes === 0).length;
  const punctualityPct =
    workingRecords.length > 0 ? Math.round((onTimeDays / workingRecords.length) * 100) : 100;

  return (
    <div className="space-y-4">
      {/* 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. MINIMALIST BAR CHART (Spans 2 columns on lg) */}
        <div className="lg:col-span-2 rounded-2xl glass-panel p-4 sm:p-5 shadow-xl flex flex-col justify-between">
          {/* Header & Minimal Controls */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-indigo-500/15 p-2 text-[var(--accent-color)] border border-indigo-500/25">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white">روند کارکرد روزانه</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-300 mt-0.5">
                  ساعات کارکرد نسبت به موظفی ۸ ساعت
                </p>
              </div>
            </div>

            {/* Mode Switcher (Recent Days vs Full Month) */}
            <div className="flex items-center gap-1 rounded-xl glass-pill p-1 text-[11px]">
              <button
                type="button"
                onClick={() => setChartMode('recent')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  chartMode === 'recent'
                    ? 'bg-[var(--accent-color)] text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                روزهای اخیر
              </button>
              <button
                type="button"
                onClick={() => setChartMode('month')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  chartMode === 'month'
                    ? 'bg-[var(--accent-color)] text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                کل ماه
              </button>
            </div>
          </div>

          {/* Minimalist Canvas */}
          <div className="pt-2 pb-1">
            {displayItems.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center text-xs text-slate-400 h-44 gap-2">
                <Calendar className="h-6 w-6 text-slate-500" />
                <span>هنوز ترددی در این ماه ثبت نشده است.</span>
              </div>
            ) : (
              <div>
                {/* Bars Chart Area */}
                <div className="relative h-44 sm:h-48 w-full">
                  {/* Subtle 8-Hour Target Line */}
                  <div
                    className="absolute left-0 right-0 border-b border-dashed border-indigo-400/30 z-10 pointer-events-none flex items-center justify-end px-2"
                    style={{ bottom: `${standardTargetPercent}%` }}
                  >
                    <span className="text-[9px] font-mono text-indigo-300/80 bg-[#161a28]/80 px-1 rounded select-none">
                      موظفی استاندارد: {toPersianDigits((standardDailyNet / 60).toFixed(0))}س
                    </span>
                  </div>

                  {/* Minimal Bars */}
                  <div className="absolute inset-0 flex items-end justify-between gap-1.5 sm:gap-3 px-2">
                    {displayItems.map((item) => {
                      const r = item.record;
                      const { jd } = parseJalaliDate(r.date);
                      const weekdayName = getJalaliWeekdayName(r.date);
                      const heightPercent =
                        item.isHol && item.totalCreditMinutes === 0
                          ? 4
                          : Math.min(100, Math.max(6, (item.totalCreditMinutes / maxCreditMinutes) * 100));

                      return (
                        <div
                          key={r.id || r.date}
                          className="flex-1 h-full flex flex-col items-center justify-end group relative cursor-pointer"
                          onMouseEnter={() => setHoveredRecord(r)}
                          onMouseLeave={() => setHoveredRecord(null)}
                        >
                          {/* Compact 2-Line Minimal Hover Tooltip */}
                          {hoveredRecord?.date === r.date && (
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-40 whitespace-nowrap rounded-xl border border-white/[0.1] bg-[#1a2030] px-2.5 py-1.5 text-xs shadow-xl backdrop-blur-md pointer-events-none text-center">
                              <div className="text-[10px] text-slate-300 font-medium">
                                {weekdayName} {toPersianDigits(jd)}
                              </div>
                              <div className="text-[11px] font-mono font-bold text-cyan-300 mt-0.5">
                                {item.isCurrentlyWorking
                                  ? `${formatMinutesToPersianReadable(item.physicalWorked)} (در حال کار)`
                                  : item.isLeave
                                  ? 'مرخصی'
                                  : item.totalCreditMinutes > 0
                                  ? formatMinutesToPersianReadable(item.totalCreditMinutes)
                                  : 'بدون کارکرد'}
                              </div>
                            </div>
                          )}

                          {/* Minimal Bar */}
                          <div
                            className={`w-full max-w-[28px] rounded-t-lg transition-all duration-200 ${item.barBgClass}`}
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Day Labels */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-3 px-2 mt-2 pt-2 border-t border-white/[0.06]">
                  {displayItems.map((item) => {
                    const { jd } = parseJalaliDate(item.record.date);
                    return (
                      <div
                        key={`lbl_${item.record.id || item.record.date}`}
                        className="flex-1 text-center font-mono text-[10px]"
                      >
                        {item.isToday ? (
                          <span className="inline-block px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/30">
                            {toPersianDigits(jd)}
                          </span>
                        ) : (
                          <span
                            className={
                              item.isFri
                                ? 'text-rose-400 font-medium'
                                : item.isThu
                                ? 'text-indigo-300 font-medium'
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

          {/* Minimal Bottom Legend */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-white/[0.04]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              حضور موظف
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              اضافه کار
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              مرخصی
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              کسر کار
            </span>
          </div>
        </div>

        {/* 2. MINIMALIST MONTH SUMMARY CARD (1 column on lg) */}
        <div className="rounded-2xl glass-panel p-4 sm:p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-cyan-500/15 p-2 text-cyan-300 border border-cyan-500/25">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">خلاصه پیشرفت ماه</h3>
                  <p className="text-[10px] text-slate-400">تحقق موظفی و انضباط</p>
                </div>
              </div>
            </div>

            {/* Clean Progress Indicator */}
            <div className="space-y-2 mb-5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-300 font-medium">تحقق موظفی ماهانه</span>
                <span className="text-2xl font-black font-mono text-cyan-400">
                  {toPersianDigits(completionPercent)}%
                </span>
              </div>
              {/* Minimal Slim Progress Bar */}
              <div className="h-2.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500 ease-out"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>کارکرد: {toPersianDigits((stats.totalWorkedMinutes / 60).toFixed(1))}س</span>
                <span>هدف: {toPersianDigits((stats.totalRequiredMinutes / 60).toFixed(1))}س</span>
              </div>
            </div>

            {/* 3 Key Minimal Metrics */}
            <div className="space-y-2.5 border-t border-white/[0.06] pt-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" />
                  مجموع کارکرد موثر:
                </span>
                <span className="font-mono font-bold text-white">
                  {formatMinutesToPersianReadable(stats.totalWorkedMinutes)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-emerald-400" />
                  اضافه کاری ماه:
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  +{formatMinutesToPersianReadable(stats.totalOvertimeMinutes + stats.totalHolidayOvertimeMinutes)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Coffee className="h-3.5 w-3.5 text-amber-400" />
                  مرخصی استفاده‌شده:
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {toPersianDigits(stats.totalLeaveDays.toFixed(1))} روز
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-cyan-400" />
                  انضباط ورود به‌موقع:
                </span>
                <span className="font-mono font-bold text-cyan-300">
                  {toPersianDigits(punctualityPct)}%
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] text-[10px] text-slate-400 text-center">
            تراز کل ماه: {stats.netBalanceMinutes >= 0 ? '+' : '-'}
            {formatMinutesToPersianReadable(Math.abs(stats.netBalanceMinutes))}
          </div>
        </div>
      </div>
    </div>
  );
};
