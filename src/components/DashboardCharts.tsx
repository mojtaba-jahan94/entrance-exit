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
  ); // 480 mins

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
      const inMins = timeStringToMinutes(r.checkIn);
      const curMins = liveNow.getHours() * 60 + liveNow.getMinutes();
      const rawPresenceLive = Math.max(0, curMins - inMins);

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

    let barColor = 'bg-[#111]';
    if (isCurrentlyWorking) {
      barColor = 'bg-emerald-500 animate-pulse';
    } else if (isLeave) {
      barColor = 'bg-amber-500';
    } else if (isHol) {
      barColor = r.workedMinutes > 0 ? 'bg-indigo-600' : 'bg-black/20';
    } else if (r.overtimeMinutes > 0) {
      barColor = 'bg-emerald-600';
    } else if (r.deficitMinutes > 0) {
      barColor = 'bg-rose-500';
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

  const maxCreditMinutes = Math.max(
    600,
    ...chartItems.map((item) => item.totalCreditMinutes)
  );

  const standardTargetPercent = (standardDailyNet / maxCreditMinutes) * 100;
  const completionPercent = Math.min(100, Math.max(0, stats.completionRate));

  const workingRecords = monthRecords.filter(
    (r) => r.status === 'present' || (r.status === 'in_progress' && r.checkIn)
  );
  const onTimeDays = workingRecords.filter((r) => r.delayMinutes === 0).length;
  const punctualityPct =
    workingRecords.length > 0 ? Math.round((onTimeDays / workingRecords.length) * 100) : 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Bar Chart */}
      <div className="lg:col-span-2 rounded-2xl border border-black/[0.08] bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/[0.06] pb-3 mb-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl border border-black/10 bg-black/[0.02] flex items-center justify-center text-black/70">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#111]">روند کارکرد روزانه</h3>
              <p className="text-[11px] text-black/40 font-mono">
                DAILY WORK DURATION & CAPACITY
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono text-black/50">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#111]" />
              عادی
            </span>
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              اضافه کار
            </span>
            <span className="flex items-center gap-1 text-rose-600">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              کسر کار
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              مرخصی
            </span>
          </div>
        </div>

        {/* Bar Chart Canvas */}
        <div className="pt-2 pb-1 overflow-x-auto no-scrollbar">
          {chartItems.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center text-xs text-black/40 h-48 gap-2 font-mono">
              <Calendar className="h-6 w-6 text-black/20" />
              <span>داده‌ای برای این ماه ثبت نشده است.</span>
            </div>
          ) : (
            <div className="min-w-[420px] pt-4">
              <div className="relative h-44 sm:h-52 w-full">
                {/* Standard Target Line */}
                <div
                  className="absolute left-0 right-0 border-b border-dashed border-black/20 z-10 pointer-events-none flex items-center justify-end px-1"
                  style={{ bottom: `${standardTargetPercent}%` }}
                >
                  <span className="text-[9px] font-mono text-black/40 select-none">
                    موظفی: {toPersianDigits((standardDailyNet / 60).toFixed(0))}س
                  </span>
                </div>

                {/* Bars Row */}
                <div className="absolute inset-0 flex items-end justify-between gap-1 sm:gap-2 px-1">
                  {chartItems.map((item) => {
                    const r = item.record;
                    const { jd } = parseJalaliDate(r.date);
                    const weekdayName = getJalaliWeekdayName(r.date);
                    const heightPercent = item.isHol && item.totalCreditMinutes === 0
                      ? 4
                      : Math.min(100, Math.max(6, (item.totalCreditMinutes / maxCreditMinutes) * 100));

                    return (
                      <div
                        key={r.id || r.date}
                        className="flex-1 h-full flex items-end justify-center group relative cursor-pointer"
                        onMouseEnter={() => setHoveredRecord(r)}
                        onMouseLeave={() => setHoveredRecord(null)}
                      >
                        {/* Tooltip on hover */}
                        {hoveredRecord?.date === r.date && (
                          <div className="absolute -top-32 left-1/2 -translate-x-1/2 z-40 w-48 rounded-xl border border-black/10 bg-white/95 p-2.5 text-xs shadow-xl backdrop-blur-md pointer-events-none space-y-1 text-[#111]">
                            <div className="flex items-center justify-between border-b border-black/[0.06] pb-1 text-[11px] font-mono">
                              <span className="font-semibold">
                                روز {toPersianDigits(jd)} ({weekdayName})
                              </span>
                              <span>{r.status}</span>
                            </div>
                            <div className="text-[11px] font-mono space-y-0.5 text-black/70">
                              <div>
                                کارکرد:{' '}
                                <strong>
                                  {formatMinutesToPersianReadable(item.totalCreditMinutes)}
                                </strong>
                              </div>
                              {r.checkIn && (
                                <div>
                                  ورود: {toPersianDigits(r.checkIn)} | خروج:{' '}
                                  {r.checkOut ? toPersianDigits(r.checkOut) : 'در حال کار'}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Pillar */}
                        <div
                          className={`w-full max-w-[18px] rounded-t-md ${item.barColor} transition-all duration-200 group-hover:opacity-80`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day Labels Row */}
              <div className="flex items-center justify-between gap-1 sm:gap-2 px-1 mt-2 pt-1.5 border-t border-black/[0.06]">
                {chartItems.map((item) => {
                  const { jd } = parseJalaliDate(item.record.date);
                  return (
                    <div
                      key={`lbl_${item.record.id || item.record.date}`}
                      className="flex-1 text-center font-mono text-[9px]"
                    >
                      <span
                        className={
                          item.isToday
                            ? 'bg-[#111] text-white px-1 py-0.5 rounded text-[8px] font-medium'
                            : 'text-black/40'
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

      {/* 2. Donut & Performance Ratio */}
      <div className="rounded-2xl border border-black/[0.08] bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl border border-black/10 bg-black/[0.02] flex items-center justify-center text-black/70">
              <PieChartIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#111]">شاخص‌های تحقق</h3>
              <p className="text-[10px] text-black/40 font-mono">COMPLETION METRICS</p>
            </div>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="flex items-center justify-center my-4 relative">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-black/[0.06]"
              strokeWidth="3.6"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-[#111] transition-all duration-1000 ease-out"
              strokeDasharray={`${completionPercent}, 100`}
              strokeWidth="3.8"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-light text-[#111] font-mono">
              {toPersianDigits(completionPercent)}%
            </span>
            <span className="text-[10px] text-black/40 font-mono uppercase">تحقق موظفی</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2.5 pt-3 border-t border-black/[0.06] text-xs">
          <div className="flex items-center justify-between">
            <span className="text-black/60">روزهای حضور موثر:</span>
            <span className="font-mono font-bold text-[#111]">
              {toPersianDigits(stats.presentDaysCount)} روز
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-black/60">مرخصی مصرف‌شده:</span>
            <span className="font-mono font-bold text-[#111]">
              {toPersianDigits(stats.totalLeaveHours.toFixed(1))} ساعت
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-black/60">نرخ ورود سروقت:</span>
            <span className="font-mono font-bold text-emerald-700">
              {toPersianDigits(punctualityPct)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
