import React, { useState, useEffect } from 'react';
import {
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  Award,
} from 'lucide-react';
import { AttendanceRecord, ShiftConfig, MonthlyStats } from '../types';
import {
  toPersianDigits,
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
      } else {
        liveDeficit = requiredNet - effectiveTotal;
      }

      remainingMinutesToTarget = Math.max(0, requiredNet - effectiveTotal);
      const targetExitMins = inMins + requiredNet + effectiveBreak;
      const tH = Math.floor(targetExitMins / 60);
      const tM = targetExitMins % 60;
      targetExitTimeStr = `${tH < 10 ? '0' + tH : tH}:${tM < 10 ? '0' + tM : tM}`;
    } else {
      physicalWorked = isLeave ? 0 : r.workedMinutes;
    }

    const leaveMinutes = r.leaveMinutes || (isLeave ? requiredNet : 0);
    const totalCreditMinutes = isLeave ? requiredNet : (physicalWorked + (r.leaveMinutes || 0));

    // Determine bar color and style using Nordic palette
    let barColor = 'from-[#A68A64] to-[#8F7553]';
    if (isCurrentlyWorking) {
      barColor = 'from-[#2E6F40] to-[#A68A64]';
    } else if (isLeave) {
      barColor = 'from-[#D97706] to-[#B45309]';
    } else if (isHol) {
      if (r.workedMinutes > 0) {
        barColor = 'from-[#A68A64] to-[#2E6F40]';
      } else {
        barColor = 'from-[#D1D5DB] to-[#9CA3AF]';
      }
    } else if (r.overtimeMinutes > 0) {
      barColor = 'from-[#2E6F40] to-[#255833]';
    } else if (r.deficitMinutes > 0) {
      barColor = 'from-[#B91C1C] to-[#991B1B]';
    } else if (isThu && totalCreditMinutes >= requiredNet) {
      barColor = 'from-[#A68A64] to-[#8F7553]';
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

  // Maximum scale for daily chart
  const maxCreditMinutes = Math.max(
    600,
    ...chartItems.map((item) => item.totalCreditMinutes)
  );

  // Target lines relative to maxCreditMinutes
  const standardTargetPercent = (standardDailyNet / maxCreditMinutes) * 100;
  const thursdayTargetPercent = (240 / maxCreditMinutes) * 100;

  // Donut completion percentage
  const completionPercent = Math.min(100, Math.max(0, stats.completionRate));

  // Punctuality rate
  const workingRecords = monthRecords.filter(
    (r) => r.status === 'present' || (r.status === 'in_progress' && r.checkIn)
  );
  const onTimeDays = workingRecords.filter((r) => r.delayMinutes === 0).length;
  const punctualityPct =
    workingRecords.length > 0 ? Math.round((onTimeDays / workingRecords.length) * 100) : 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* 1. Daily Work Hours Bar Chart (Span 2 cols on lg) */}
      <div className="lg:col-span-2 rounded-[28px] border border-[#D1D5DB] bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
        {/* Header with Clean Status & Minimal Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D1D5DB] pb-3.5 mb-3.5 gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-[#F5F0E6] p-2 text-[#A68A64] border border-[#A68A64]/30">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-[#1F2933]">روند کارکرد روزانه این ماه</h3>
                {isAnyWorkingToday && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2E6F40]/10 border border-[#2E6F40]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#2E6F40]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E6F40] opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#2E6F40]" />
                    </span>
                    <span>شیفت فعال امروز</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-[#6B7280] mt-0.5">
                ساعات کارکرد خالص و موثر روزانه در مقایسه با سقف موظفی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] sm:text-[11px] text-[#6B7280] flex-wrap">
            <span className="flex items-center gap-1 text-[#1F2933]">
              <span className="h-2 w-2 rounded-full bg-[#A68A64]" />
              موظفی
            </span>
            <span className="flex items-center gap-1 text-[#2E6F40]">
              <span className="h-2 w-2 rounded-full bg-[#2E6F40]" />
              اضافه کار
            </span>
            <span className="flex items-center gap-1 text-[#B91C1C]">
              <span className="h-2 w-2 rounded-full bg-[#B91C1C]" />
              کسر کار
            </span>
            <span className="flex items-center gap-1 text-[#D97706]">
              <span className="h-2 w-2 rounded-full bg-[#D97706]" />
              مرخصی
            </span>
          </div>
        </div>

        {/* The Bar Chart Canvas */}
        <div className="pt-2 pb-1 overflow-x-auto no-scrollbar">
          {chartItems.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center text-xs text-[#6B7280] h-48 gap-2">
              <Calendar className="h-6 w-6 text-[#D1D5DB]" />
              <span>هنوز ترددی در این ماه ثبت نشده است.</span>
            </div>
          ) : (
            <div className="min-w-[420px] pt-4">
              {/* Bars Canvas Area */}
              <div className="relative h-44 sm:h-52 w-full">
                {/* Standard Target Line (8 hours) */}
                <div
                  className="absolute left-0 right-0 border-b border-dashed border-[#A68A64]/40 z-10 pointer-events-none flex items-center justify-end px-1"
                  style={{ bottom: `${standardTargetPercent}%` }}
                >
                  <span className="text-[9px] font-mono text-[#A68A64] select-none font-bold">
                    موظفی عادی: {toPersianDigits((standardDailyNet / 60).toFixed(0))}س
                  </span>
                </div>

                {/* Thursday Target Line (4 hours) */}
                {config.thursdayStatus === 'half_day' && (
                  <div
                    className="absolute left-0 right-0 border-b border-dotted border-[#D97706]/40 z-10 pointer-events-none flex items-center justify-start px-1"
                    style={{ bottom: `${thursdayTargetPercent}%` }}
                  >
                    <span className="text-[9px] font-mono text-[#D97706] select-none font-bold">
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
                        {/* Unified Nordic Tooltip on Hover */}
                        {hoveredRecord?.date === r.date && (
                          <div className="absolute -top-36 sm:-top-40 left-1/2 -translate-x-1/2 z-40 w-52 rounded-2xl border border-[#D1D5DB] bg-[#1F2933] text-[#F7F7F2] p-3 text-xs shadow-2xl pointer-events-none space-y-1.5">
                            {/* Card Header: Date & Status Badge */}
                            <div className="flex items-center justify-between border-b border-white/10 pb-1 text-[11px]">
                              <span className="font-bold text-white font-mono flex items-center gap-1">
                                {item.isCurrentlyWorking && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#2E6F40] animate-pulse" />
                                )}
                                روز {toPersianDigits(jd)} <span className="text-[#D1D5DB] font-normal">({weekdayName})</span>
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.isCurrentlyWorking
                                    ? 'bg-[#2E6F40]/30 text-white'
                                    : item.isLeave
                                    ? 'bg-[#D97706]/30 text-[#FBBF24]'
                                    : item.isHol
                                    ? 'bg-purple-900/40 text-purple-200'
                                    : r.status === 'present'
                                    ? 'bg-[#2E6F40]/30 text-emerald-200'
                                    : 'bg-white/10 text-[#D1D5DB]'
                                }`}
                              >
                                {item.isCurrentlyWorking
                                  ? 'حضور زنده'
                                  : item.isLeave
                                  ? 'مرخصی'
                                  : item.isHol
                                  ? 'تعطیل'
                                  : 'حاضر'}
                              </span>
                            </div>

                            {/* Details */}
                            <div className="space-y-1 text-[10px]">
                              <div className="flex items-center justify-between text-[#D1D5DB]">
                                <span>کارکرد موثر:</span>
                                <span className="font-mono font-bold text-white">
                                  {formatMinutesToPersianReadable(item.totalCreditMinutes)}
                                </span>
                              </div>

                              {r.checkIn && (
                                <div className="flex items-center justify-between text-[#D1D5DB]">
                                  <span>ساعت تردد:</span>
                                  <span className="font-mono text-white">
                                    {toPersianDigits(r.checkIn)} تا {r.checkOut ? toPersianDigits(r.checkOut) : 'اکنون'}
                                  </span>
                                </div>
                              )}

                              {/* Balance Row */}
                              <div className="border-t border-white/10 pt-1 flex items-center justify-between font-bold">
                                <span className="text-[#D1D5DB] text-[10px]">وضعیت تراز:</span>
                                {item.isCurrentlyWorking ? (
                                  item.remainingMinutesToTarget > 0 ? (
                                    <span className="text-[#FBBF24] font-mono text-[10px]">
                                      {formatMinutesToPersianReadable(item.remainingMinutesToTarget)} تا موظفی
                                    </span>
                                  ) : (
                                    <span className="text-emerald-300 font-mono text-[10px]">
                                      +{formatMinutesToPersianReadable(item.liveOvertime)} اضافه کار
                                    </span>
                                  )
                                ) : r.overtimeMinutes > 0 ? (
                                  <span className="text-emerald-300 font-mono text-[10px]">
                                    +{formatMinutesToPersianReadable(r.overtimeMinutes)} اضافه کار
                                  </span>
                                ) : r.deficitMinutes > 0 ? (
                                  <span className="text-rose-300 font-mono text-[10px]">
                                    -{formatMinutesToPersianReadable(r.deficitMinutes)} کسر کار
                                  </span>
                                ) : item.isLeave ? (
                                  <span className="text-amber-300 font-mono text-[10px]">مرخصی کامل</span>
                                ) : (
                                  <span className="text-[#A68A64] font-mono text-[10px]">تکمیل موظفی</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Bar Pillar */}
                        <div
                          className={`w-full max-w-[20px] rounded-t-md bg-gradient-to-t ${item.barColor} transition-all duration-300 group-hover:brightness-110 shadow-sm ${
                            item.isCurrentlyWorking
                              ? 'ring-2 ring-[#2E6F40] shadow-md relative overflow-hidden min-h-[6px]'
                              : ''
                          }`}
                          style={{ height: `${item.isCurrentlyWorking ? Math.max(4, heightPercent) : heightPercent}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day Labels Row */}
              <div className="flex items-center justify-between gap-1 sm:gap-2 px-1 mt-2 pt-2 border-t border-[#D1D5DB]/60">
                {chartItems.map((item) => {
                  const { jd } = parseJalaliDate(item.record.date);
                  return (
                    <div
                      key={`lbl_${item.record.id || item.record.date}`}
                      className="flex-1 text-center font-mono text-[9px] sm:text-[10px]"
                    >
                      {item.isToday ? (
                        <span className="inline-flex items-center justify-center px-1 py-0.5 rounded bg-[#A68A64] text-white font-bold shadow-sm text-[8px] sm:text-[9px]">
                          {toPersianDigits(jd)}
                        </span>
                      ) : (
                        <span
                          className={
                            item.isFri
                              ? 'text-[#B91C1C] font-bold'
                              : item.isThu
                              ? 'text-[#A68A64] font-medium'
                              : 'text-[#6B7280]'
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
      <div className="rounded-[28px] border border-[#D1D5DB] bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-[#D1D5DB] pb-3.5 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-[#F5F0E6] p-2 text-[#A68A64] border border-[#A68A64]/30">
              <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#1F2933]">توزیع وضعیت روزها</h3>
              <p className="text-[10px] text-[#6B7280]">تحلیل نرخ حضور و انضباط ماه</p>
            </div>
          </div>
          {isAnyWorkingToday && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#2E6F40]/10 border border-[#2E6F40]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#2E6F40]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2E6F40] animate-ping" />
              شیفت فعال
            </span>
          )}
        </div>

        {/* Visual Donut Ring in Warm Wood */}
        <div className="flex items-center justify-center my-3 relative">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            {/* Background Track */}
            <path
              className="text-[#E5E7EB]"
              strokeWidth="3.6"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {/* Completion Ring */}
            <path
              className="text-[#A68A64] transition-all duration-1000 ease-out"
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
            <span className="text-xl sm:text-2xl font-black text-[#1F2933] font-mono tabular-nums">
              {toPersianDigits(completionPercent)}%
            </span>
            <span className="text-[10px] text-[#6B7280]">تکمیل موظفی</span>
          </div>
        </div>

        {/* Stats breakdown list */}
        <div className="space-y-2.5 pt-3 border-t border-[#D1D5DB] text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[#1F2933]">
              <span className="h-2 w-2 rounded-full bg-[#2E6F40]" />
              روزهای حضور موثر:
            </span>
            <span className="font-mono font-bold text-[#2E6F40]">
              {toPersianDigits(stats.presentDaysCount)} روز
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[#1F2933]">
              <span className="h-2 w-2 rounded-full bg-[#D97706]" />
              مرخصی استفاده‌شده:
            </span>
            <span className="font-mono font-bold text-[#D97706]">
              {toPersianDigits(stats.totalLeaveDays.toFixed(1))} روز ({toPersianDigits(stats.totalLeaveHours.toFixed(1))}س)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[#1F2933]">
              <Award className="h-3.5 w-3.5 text-[#A68A64]" />
              شاخص خوش‌قولی ورود:
            </span>
            <span className="font-mono font-bold text-[#A68A64]">
              {toPersianDigits(punctualityPct)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
