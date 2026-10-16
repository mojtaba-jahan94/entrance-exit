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
  formatMinutesToTimeString,
  formatMinutesToPersianReadable,
  parseJalaliDate,
  getJalaliWeekdayName,
  getTodayJalaliString,
  timeStringToMinutes,
} from '../utils/jalali';
import { LiquidGlassCard } from './LiquidGlassCard';

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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

    // Determine bar color and style using Nordic tokens and subtle vertical gradients
    let barColor = 'bg-gradient-to-t from-accent/70 to-accent';
    if (isCurrentlyWorking) {
      barColor = 'bg-gradient-to-t from-semantic-info/80 to-semantic-info';
    } else if (isLeave) {
      barColor = 'bg-gradient-to-t from-semantic-warning/80 to-semantic-warning';
    } else if (isHol) {
      if (r.workedMinutes > 0) {
        barColor = 'bg-gradient-to-t from-semantic-info/80 to-semantic-info';
      } else {
        barColor = 'bg-surface-2';
      }
    } else if (r.overtimeMinutes > 0) {
      barColor = 'bg-gradient-to-t from-semantic-success/80 to-semantic-success';
    } else if (r.deficitMinutes > 0) {
      barColor = 'bg-gradient-to-t from-semantic-danger/80 to-semantic-danger';
    } else if (isThu && totalCreditMinutes >= requiredNet) {
      barColor = 'bg-gradient-to-t from-accent/80 to-accent';
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
      <LiquidGlassCard
        className="lg:col-span-2 rounded-[28px] sm:rounded-[34px] p-4 sm:p-6 shadow-2xl flex flex-col justify-between"
        sheenColor="rgba(166, 138, 100, 0.12)"
      >
        {/* Header with Clean Status & Minimal Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 mb-3 gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-2xl bg-surface-2 p-2.5 text-accent border border-border shadow-inner">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-text">روند کارکرد روزانه این ماه</h3>
                {isAnyWorkingToday && (
                  <span className="inline-flex items-center gap-1.5 rounded-full badge-info px-2.5 py-0.5 text-[10px] font-bold shadow-sm">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-semantic-info opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-semantic-info" />
                    </span>
                    <span>شیفت زنده امروز</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-muted mt-0.5">
                ساعات کارکرد خالص و موثر روزانه در مقایسه با سقف موظفی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] sm:text-[11px] text-muted flex-wrap">
            <span className="flex items-center gap-1 text-muted">
              <span className="h-2 w-2 rounded-full bg-accent" />
              تکمیل موظفی
            </span>
            <span className="flex items-center gap-1 text-semantic-success font-medium">
              <span className="h-2 w-2 rounded-full bg-semantic-success" />
              اضافه کار
            </span>
            <span className="flex items-center gap-1 text-semantic-danger font-medium">
              <span className="h-2 w-2 rounded-full bg-semantic-danger" />
              کسر کار
            </span>
            <span className="flex items-center gap-1 text-semantic-warning font-medium">
              <span className="h-2 w-2 rounded-full bg-semantic-warning" />
              مرخصی
            </span>
          </div>
        </div>

        {/* Modernized Bar Chart Canvas with Responsive Wrapper */}
        {chartItems.length === 0 ? (
          <div className="w-full h-64 sm:h-80 p-4 rounded-2xl bg-surface-2/30 border border-border/40 flex flex-col items-center justify-center text-xs text-muted gap-2">
            <Calendar className="h-6 w-6 text-muted opacity-60" />
            <span>هنوز ترددی در این ماه ثبت نشده است.</span>
          </div>
        ) : (
          <div
            className="w-full h-64 sm:h-80 p-3 sm:p-4 rounded-2xl bg-surface-2/20 border border-border/40 flex flex-col justify-between relative mt-2"
            role="region"
            aria-label="نمودار میله‌ای کارکرد روزانه ماه"
          >
            {/* Screen Reader Accessible Table Summary */}
            <table className="sr-only">
              <caption>خلاصه آماری کارکرد و حضور روزانه ماه</caption>
              <thead>
                <tr>
                  <th scope="col">تاریخ</th>
                  <th scope="col">روز</th>
                  <th scope="col">وضعیت</th>
                  <th scope="col">کارکرد خالص</th>
                  <th scope="col">اضافه کار</th>
                  <th scope="col">کسر کار</th>
                </tr>
              </thead>
              <tbody>
                {chartItems.map((item) => (
                  <tr key={`sr_${item.record.id || item.record.date}`}>
                    <td>{toPersianDigits(item.record.date)}</td>
                    <td>{getJalaliWeekdayName(item.record.date)}</td>
                    <td>
                      {item.isCurrentlyWorking
                        ? 'در حال کار'
                        : item.isLeave
                        ? 'مرخصی'
                        : item.isHol
                        ? (item.isFri ? 'جمعه' : 'تعطیل')
                        : item.record.status === 'present'
                        ? 'حاضر'
                        : 'بدون ثبت'}
                    </td>
                    <td>{formatMinutesToPersianReadable(item.physicalWorked)}</td>
                    <td>{toPersianDigits(item.record.overtimeMinutes)} دقیقه</td>
                    <td>{toPersianDigits(item.record.deficitMinutes)} دقیقه</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Bars Canvas Area with subtle dashed horizontal grid lines (vertical=false) */}
            <div className="relative flex-1 w-full flex flex-col justify-end overflow-visible">
              {/* Subtle Horizontal Grid Lines with low opacity dashed stroke (vertical=false) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                <line x1="0" y1="20%" x2="100%" y2="20%" stroke="currentColor" strokeDasharray="3 3" className="text-border/30" strokeWidth="1" />
                <line x1="0" y1="40%" x2="100%" y2="40%" stroke="currentColor" strokeDasharray="3 3" className="text-border/30" strokeWidth="1" />
                <line x1="0" y1="60%" x2="100%" y2="60%" stroke="currentColor" strokeDasharray="3 3" className="text-border/30" strokeWidth="1" />
                <line x1="0" y1="80%" x2="100%" y2="80%" stroke="currentColor" strokeDasharray="3 3" className="text-border/30" strokeWidth="1" />
              </svg>

              {/* Standard Target Line (8 hours) */}
              <div
                className="absolute left-0 right-0 border-b border-dashed border-accent/60 z-10 pointer-events-none flex items-center justify-end px-2"
                style={{ bottom: `${standardTargetPercent}%` }}
              >
                <span className="text-[9px] font-mono text-accent select-none font-semibold bg-surface/90 px-1.5 py-0.5 rounded shadow-xs">
                  موظفی عادی: {toPersianDigits((standardDailyNet / 60).toFixed(0))}س
                </span>
              </div>

              {/* Thursday Target Line (4 hours) */}
              {config.thursdayStatus === 'half_day' && (
                <div
                  className="absolute left-0 right-0 border-b border-dashed border-semantic-warning/50 z-10 pointer-events-none flex items-center justify-start px-2"
                  style={{ bottom: `${thursdayTargetPercent}%` }}
                >
                  <span className="text-[9px] font-mono text-semantic-warning select-none font-semibold bg-surface/90 px-1.5 py-0.5 rounded shadow-xs">
                    پنج‌شنبه: {toPersianDigits(((config.thursdayMinutes || 240) / 60).toFixed(0))}س
                  </span>
                </div>
              )}

              {/* Bars Row */}
              <div className="absolute inset-0 flex items-end justify-between gap-0.5 sm:gap-1.5 md:gap-2 px-1">
                {chartItems.map((item, index) => {
                  const r = item.record;
                  const parsed = parseJalaliDate(r.date);
                  const jd = parsed ? parsed.jd : 1;
                  const weekdayName = getJalaliWeekdayName(r.date);
                  const heightPercent = item.isHol && item.totalCreditMinutes === 0
                    ? 3
                    : Math.min(100, Math.max(6, (item.totalCreditMinutes / maxCreditMinutes) * 100));

                  const isNearRight = index < 4;
                  const isNearLeft = index > chartItems.length - 5;
                  const tooltipPosClass = isNearRight
                    ? 'right-0'
                    : isNearLeft
                    ? 'left-0'
                    : 'left-1/2 -translate-x-1/2';

                  return (
                    <div
                      key={r.id || r.date}
                      className="flex-1 h-full flex items-end justify-center group relative cursor-pointer"
                      onMouseEnter={() => {
                        setHoveredRecord(r);
                        setHoveredIndex(index);
                      }}
                      onMouseLeave={() => {
                        setHoveredRecord(null);
                        setHoveredIndex(null);
                      }}
                    >
                      {/* Styled Floating Tooltip: rounded-lg, clean padding, subtle border, readable contrast */}
                      {hoveredIndex === index && (
                        <div className={`absolute -top-36 sm:-top-40 ${tooltipPosClass} z-40 w-56 rounded-lg border border-border/80 bg-surface/95 backdrop-blur-xl p-3 text-xs shadow-2xl animate-in fade-in zoom-in-95 pointer-events-none space-y-1.5`}>
                          {/* Card Header: Date & Status Badge */}
                          <div className="flex items-center justify-between border-b border-border pb-1.5 text-[11px]">
                            <span className="font-bold text-text font-mono flex items-center gap-1">
                              {item.isCurrentlyWorking && (
                                <span className="h-1.5 w-1.5 rounded-full bg-semantic-info animate-pulse" />
                              )}
                              روز {toPersianDigits(jd)} <span className="text-muted font-normal">({weekdayName})</span>
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                item.isCurrentlyWorking
                                  ? 'badge-info'
                                  : item.isLeave
                                  ? 'badge-warning'
                                  : item.isHol
                                  ? 'badge-neutral'
                                  : r.status === 'present'
                                  ? 'badge-success'
                                  : 'badge-neutral'
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
                            <div className="flex items-center justify-between text-text">
                              <span className="text-muted">ورود / خروج:</span>
                              <span className="font-mono text-text font-medium">
                                {r.checkIn ? toPersianDigits(r.checkIn) : '—'}
                                {' تا '}
                                {item.isCurrentlyWorking
                                  ? (item.targetExitTimeStr ? `${toPersianDigits(item.targetExitTimeStr)} (هدف)` : 'اکنون')
                                  : (r.checkOut ? toPersianDigits(r.checkOut) : '—')}
                              </span>
                            </div>

                            {/* 2. Effective / Worked Time */}
                            <div className="flex items-center justify-between">
                              <span className="text-muted">
                                {item.isCurrentlyWorking ? 'کارکرد تا اکنون:' : 'کارکرد موثر:'}
                              </span>
                              <span className="font-mono font-bold text-semantic-success">
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
                                <span className="text-muted">مرخصی ساعتی:</span>
                                <span className="font-mono font-bold text-semantic-warning">
                                  {formatMinutesToPersianReadable(item.leaveMinutes)}
                                </span>
                              </div>
                            )}

                            {/* 4. Delay or Early Departure if any */}
                            {(r.delayMinutes > 0 || r.earlyLeaveMinutes > 0) && !item.isCurrentlyWorking && (
                              <div className="flex items-center justify-between text-[10px] text-semantic-danger font-medium">
                                <span className="text-muted">کسورات زمانی:</span>
                                <span className="font-mono">
                                  {r.delayMinutes > 0 && `تاخیر: ${toPersianDigits(r.delayMinutes)}د`}
                                  {r.delayMinutes > 0 && r.earlyLeaveMinutes > 0 && ' | '}
                                  {r.earlyLeaveMinutes > 0 && `تعجیل: ${toPersianDigits(r.earlyLeaveMinutes)}د`}
                                </span>
                              </div>
                            )}

                            {/* 5. Balance / Result Row */}
                            <div className="border-t border-border pt-1 flex items-center justify-between font-bold">
                              <span className="text-muted text-[10px]">وضعیت تراز:</span>
                              {item.isCurrentlyWorking ? (
                                item.remainingMinutesToTarget > 0 ? (
                                  <span className="text-semantic-warning font-mono text-[10px]">
                                    {formatMinutesToPersianReadable(item.remainingMinutesToTarget)} تا موظفی
                                  </span>
                                ) : (
                                  <span className="text-semantic-success font-mono text-[10px]">
                                    <bdi dir="ltr">+{formatMinutesToPersianReadable(item.liveOvertime)}</bdi> اضافه کار
                                  </span>
                                )
                              ) : r.overtimeMinutes > 0 ? (
                                <span className="text-semantic-success font-mono text-[10px]">
                                  <bdi dir="ltr">+{formatMinutesToPersianReadable(r.overtimeMinutes)}</bdi> اضافه کار
                                </span>
                              ) : r.deficitMinutes > 0 ? (
                                <span className="text-semantic-danger font-mono text-[10px]">
                                  <bdi dir="ltr">-{formatMinutesToPersianReadable(r.deficitMinutes)}</bdi> کسر کار
                                </span>
                              ) : item.isLeave ? (
                                <span className="text-semantic-warning font-mono text-[10px]">
                                  مرخصی کامل
                                </span>
                              ) : item.isHol ? (
                                <span className="text-muted font-mono text-[10px]">
                                  روز تعطیل
                                </span>
                              ) : (
                                <span className="text-accent font-mono text-[10px]">
                                  تکمیل موظفی
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bar Pillar: rounded-t-[6px] top corners with smooth transition */}
                      <div
                        className={`w-full max-w-[20px] rounded-t-[6px] ${item.barColor} transition-all duration-300 hover:brightness-110 shadow-sm ${
                          item.isCurrentlyWorking
                            ? 'ring-2 ring-semantic-info relative overflow-hidden min-h-[6px]'
                            : ''
                        }`}
                        style={{ height: `${item.isCurrentlyWorking ? Math.max(4, heightPercent) : heightPercent}%` }}
                      >
                        {/* Top cap for live bar */}
                        {item.isCurrentlyWorking && (
                          <div className="absolute top-0 inset-x-0 h-0.5 bg-accent rounded-t-[6px]" />
                        )}
                        {/* Live shimmer reflection effect */}
                        {item.isCurrentlyWorking && (
                          <div className="absolute inset-0 bg-[var(--surface-2)] animate-pulse" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* XAxis Day Labels Row: concise day numbers, small font size (fontSize: 11/12), no heavy axis/tick lines */}
            <div className="flex items-center justify-between gap-0.5 sm:gap-1.5 md:gap-2 px-1 pt-2 border-t border-border/30">
              {chartItems.map((item) => {
                const parsed = parseJalaliDate(item.record.date);
                const jd = parsed ? parsed.jd : 1;
                return (
                  <div
                    key={`lbl_${item.record.id || item.record.date}`}
                    className="flex-1 text-center font-mono text-[9px] sm:text-xs"
                  >
                    {item.isToday ? (
                      <span className="inline-flex items-center justify-center px-1 py-0.5 rounded badge-accent font-bold shadow-sm text-[8px] sm:text-[10px]">
                        {toPersianDigits(jd)}
                      </span>
                    ) : (
                      <span
                        className={
                          item.isFri
                            ? 'text-semantic-danger font-bold'
                            : item.isThu
                            ? 'text-accent font-medium'
                            : 'text-muted'
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
      </LiquidGlassCard>

      {/* 2. Donut & Performance Ratio Column */}
      <LiquidGlassCard
        className="rounded-[28px] sm:rounded-[34px] p-4 sm:p-6 shadow-2xl flex flex-col justify-between"
        sheenColor="rgba(166, 138, 100, 0.12)"
      >
        <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-2xl bg-surface-2 p-2.5 text-accent border border-border shadow-inner">
              <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-text">توزیع وضعیت روزها</h3>
              <p className="text-[10px] text-muted">تحلیل نرخ حضور و انضباط ماه</p>
            </div>
          </div>
          {isAnyWorkingToday && (
            <span className="inline-flex items-center gap-1.5 rounded-full badge-info px-2.5 py-0.5 text-[10px] font-bold shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-semantic-info animate-ping" />
              شیفت فعال
            </span>
          )}
        </div>

        {/* Visual Donut Ring synchronized with Completion Rate */}
        <div className="flex items-center justify-center my-3 relative">
          <svg className="w-32 h-32 transform -rotate-90 drop-shadow-sm" viewBox="0 0 36 36">
            {/* Background Track */}
            <path
              className="text-border"
              strokeWidth="3.6"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {/* Completion Ring */}
            <path
              className="text-accent transition-all duration-1000 ease-out"
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
            <span className="text-xl sm:text-2xl font-black text-text font-mono">
              {toPersianDigits(completionPercent)}%
            </span>
            <span className="text-[10px] text-muted">تکمیل موظفی</span>
          </div>
        </div>

        {/* Stats breakdown list */}
        <div className="space-y-2.5 pt-2 border-t border-border text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="h-2 w-2 rounded-full bg-semantic-success" />
              روزهای حضور موثر:
            </span>
            <span className="font-mono font-bold text-semantic-success">
              {toPersianDigits(stats.presentDaysCount)} روز
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="h-2 w-2 rounded-full bg-semantic-warning" />
              مرخصی استفاده‌شده:
            </span>
            <span className="font-mono font-bold text-semantic-warning">
              {toPersianDigits(stats.totalLeaveDays.toFixed(1))} روز ({toPersianDigits(stats.totalLeaveHours.toFixed(1))}س)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted">
              <Award className="h-3.5 w-3.5 text-accent" />
              شاخص خوش‌قولی ورود:
            </span>
            <span className="font-mono font-bold text-accent">
              {toPersianDigits(punctualityPct)}%
            </span>
          </div>
        </div>
      </LiquidGlassCard>
    </div>
  );
};
