import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Clock,
  Calendar,
  Coffee,
  Sliders,
  Smile,
  BarChart2,
  PieChart,
  ArrowUp,
  ChevronDown,
  Sparkles,
  Award,
  AlertTriangle,
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
} from '../utils/jalali';

interface DashboardChartsProps {
  records: AttendanceRecord[];
  stats: MonthlyStats;
  config: ShiftConfig;
  selectedYear: number;
  selectedMonth: number;
  onFilterClick?: () => void;
  onMonthClick?: () => void;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  records,
  stats,
  config,
  selectedYear,
  selectedMonth,
  onFilterClick,
  onMonthClick,
}) => {
  // General Stats Mode toggle: 'hours' (ساعات کارکرد) | 'records' (ترددها) | 'leaves' (مرخصی)
  const [statsMode, setStatsMode] = useState<'hours' | 'records' | 'leaves'>('hours');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const todayStr = getTodayJalaliString();
  const monthPrefix = `${selectedYear}/${selectedMonth < 10 ? '0' + selectedMonth : selectedMonth}/`;

  // Number of days in the selected Jalali month (1-6: 31 days, 7-11: 30 days, 12: 29/30)
  const monthDaysCount = useMemo(() => {
    if (selectedMonth <= 6) return 31;
    if (selectedMonth <= 11) return 30;
    return 29;
  }, [selectedMonth]);

  // Compute daily metrics from REAL records
  const dailyItems = useMemo(() => {
    const monthRecords = records
      .filter((r) => r.date.startsWith(monthPrefix))
      .sort((a, b) => a.date.localeCompare(b.date));

    const items = [];
    for (let day = 1; day <= monthDaysCount; day++) {
      const dayStr = day < 10 ? '0' + day : `${day}`;
      const dateStr = `${monthPrefix}${dayStr}`;
      const rec = monthRecords.find((r) => r.date === dateStr);
      const isToday = dateStr === todayStr;

      let workedHours = 0;
      let delayMinutes = 0;
      let isLeave = false;
      let isHoliday = false;

      if (rec) {
        workedHours = rec.workedMinutes > 0 ? rec.workedMinutes / 60 : 0;
        delayMinutes = rec.delayMinutes || 0;
        isLeave = rec.status === 'leave';
        isHoliday = Boolean(rec.isHoliday);
      }

      items.push({
        day,
        dateStr,
        rec,
        isToday,
        isLeave,
        isHoliday,
        workedHours,
        delayMinutes,
      });
    }
    return items;
  }, [records, monthPrefix, monthDaysCount, todayStr]);

  // Find index of today or default to the most recent day with activity
  const activeDayIndex = useMemo(() => {
    const todayIdx = dailyItems.findIndex((i) => i.isToday);
    if (todayIdx !== -1) return todayIdx;
    for (let i = dailyItems.length - 1; i >= 0; i--) {
      if (dailyItems[i].workedHours > 0 || dailyItems[i].isLeave) return i;
    }
    return 0;
  }, [dailyItems]);

  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
  const activeBarIndex = selectedDayIdx !== null ? selectedDayIdx : activeDayIndex;

  // Max scale for bar chart (usually ~10-12 hours)
  const maxWorkedHours = Math.max(
    10,
    ...dailyItems.map((item) => (statsMode === 'hours' ? item.workedHours : item.delayMinutes / 30))
  );

  // Calculations for donut charts
  const totalWorkedHrs = stats.totalWorkedMinutes / 60;
  const totalOvertimeHrs = (stats.totalOvertimeMinutes + stats.totalHolidayOvertimeMinutes) / 60;
  const totalLeaveHrs = stats.totalLeaveDays * 8;
  const sumWorkComponents = Math.max(1, totalWorkedHrs + totalOvertimeHrs + totalLeaveHrs);

  const regularPct = Math.round((totalWorkedHrs / sumWorkComponents) * 100) || 75;
  const overtimePct = Math.round((totalOvertimeHrs / sumWorkComponents) * 100) || 18;
  const leavePct = Math.max(0, 100 - regularPct - overtimePct);

  // Sentiments / Punctuality percentages
  const delayCount = records.filter(
    (r) => r.date.startsWith(monthPrefix) && (r.delayMinutes || 0) > 0
  ).length;
  const earlyLeaveCount = records.filter(
    (r) => r.date.startsWith(monthPrefix) && (r.earlyLeaveMinutes || 0) > 0
  ).length;
  const totalPresentDays = Math.max(1, stats.presentDaysCount || 1);
  const onTimeCount = Math.max(0, totalPresentDays - delayCount - earlyLeaveCount);

  const onTimePct = Math.min(100, Math.round((onTimeCount / totalPresentDays) * 100));
  const delayPct = Math.min(100 - onTimePct, Math.round((delayCount / totalPresentDays) * 100));
  const neutralPct = Math.max(0, 100 - onTimePct - delayPct);

  // Helper for donut chart SVG stroke offset
  const circumference = 2 * Math.PI * 34; // r=34

  const activeItem = dailyItems[activeBarIndex] || dailyItems[0];

  return (
    <div className="space-y-4">
      {/* 1. SECTION TITLE & FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>تحلیل کارکرد و تردد</span>
            <span className="text-xs font-mono font-normal text-purple-300/80 bg-white/[0.05] border border-white/10 px-2.5 py-0.5 rounded-full">
              Analytics
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            گزارش هوشمند شاخص‌های حضور، تردد، بازدهی و انضباط ماهانه
          </p>
        </div>

        {/* Toolbar Pill Buttons */}
        <div className="flex items-center gap-2">
          {onFilterClick && (
            <button
              onClick={onFilterClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-xs font-medium text-slate-300 hover:text-white transition-all backdrop-blur-xl"
            >
              <Sliders className="h-3.5 w-3.5 text-violet-400" />
              <span>فیلترها و قوانین</span>
            </button>
          )}

          {onMonthClick && (
            <button
              onClick={onMonthClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-xs font-medium text-slate-300 hover:text-white transition-all backdrop-blur-xl"
            >
              <Calendar className="h-3.5 w-3.5 text-violet-400" />
              <span>انتخاب ماه</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN ANALYTICS ROW: General stats (Left 8 cols) + Two Donut Cards (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ======================================================== */}
        {/* CARD A: GENERAL STATS (8 columns on lg) */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 rounded-[28px] bg-[#1a0f2b]/75 border border-white/10 backdrop-blur-2xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between">
          {/* Header & 3-way toggle pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-violet-600/20 border border-violet-400/30 flex items-center justify-center text-violet-300">
                <BarChart2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  آمار کارکرد و روند روزانه
                </h3>
                <span className="text-[10px] text-slate-400">
                  {statsMode === 'hours'
                    ? 'ساعات کارکرد واقعی ثبت‌شده در هر روز'
                    : statsMode === 'records'
                    ? 'تعداد روزهای حضور و تاخیرات'
                    : 'وضعیت مرخصی‌های استفاده‌شده'}
                </span>
              </div>
            </div>

            {/* Segmented Pill Switcher (ساعات کارکرد | ترددها | مرخصی) */}
            <div className="flex items-center gap-1 rounded-full bg-white/[0.05] border border-white/10 p-1 text-xs self-start sm:self-auto">
              <button
                onClick={() => setStatsMode('hours')}
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  statsMode === 'hours'
                    ? 'bg-[#291744] text-white font-bold shadow-md ring-1 ring-violet-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ساعات کارکرد
              </button>
              <button
                onClick={() => setStatsMode('records')}
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  statsMode === 'records'
                    ? 'bg-[#291744] text-white font-bold shadow-md ring-1 ring-violet-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                حضور و ترددها
              </button>
              <button
                onClick={() => setStatsMode('leaves')}
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  statsMode === 'leaves'
                    ? 'bg-[#291744] text-white font-bold shadow-md ring-1 ring-violet-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                مرخصی
              </button>
            </div>
          </div>

          {/* Body: Left metric numbers + Right vertical bar chart */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Metrics Box (~4 cols on md) */}
            <div className="md:col-span-4 flex flex-col justify-around gap-4">
              {/* Box 1 */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
                <span className="text-xs text-slate-400 block mb-1">
                  {statsMode === 'hours'
                    ? 'مجموع کارکرد ماه'
                    : statsMode === 'records'
                    ? 'روزهای حاضر'
                    : 'مرخصی استفاده‌شده'}
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black font-mono text-white tracking-tight">
                    {statsMode === 'hours'
                      ? `${toPersianDigits(totalWorkedHrs.toFixed(1))}س`
                      : statsMode === 'records'
                      ? `${toPersianDigits(stats.presentDaysCount)} روز`
                      : `${toPersianDigits(stats.totalLeaveDays.toFixed(1))} روز`}
                  </span>
                  <span className="flex items-center gap-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-400/30 px-2 py-0.5 text-[10px] font-mono font-bold">
                    <span>{toPersianDigits(Math.min(100, Math.round(stats.completionRate)))}٪</span>
                    <ArrowUp className="h-2.5 w-2.5" />
                  </span>
                </div>
              </div>

              {/* Box 2 */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
                <span className="text-xs text-slate-400 block mb-1">
                  {statsMode === 'hours'
                    ? 'میانگین روزانه کارکرد'
                    : statsMode === 'records'
                    ? 'روزهای تاخیر یا تعجیل'
                    : 'مانده مرخصی استحقاقی'}
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black font-mono text-white tracking-tight">
                    {statsMode === 'hours'
                      ? `${toPersianDigits((totalWorkedHrs / Math.max(1, stats.presentDaysCount)).toFixed(1))}س`
                      : statsMode === 'records'
                      ? `${toPersianDigits(delayCount + earlyLeaveCount)} روز`
                      : `${toPersianDigits(stats.remainingLeaveDays.toFixed(1))} روز`}
                  </span>
                  <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-mono font-bold">
                    <Zap className="h-2.5 w-2.5" />
                    <span>فعال</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Vertical Bar Chart with Active Glowing Purple Bar + Badge */}
            <div className="md:col-span-8 flex flex-col justify-end pt-2">
              {/* Bars Graphic Canvas */}
              <div className="relative h-44 sm:h-48 w-full flex items-end justify-between gap-1 sm:gap-1.5 px-1">
                {dailyItems.map((item, idx) => {
                  const isHighlighted = idx === activeBarIndex;
                  const isHovered = idx === hoveredIndex;

                  let val = 0;
                  if (statsMode === 'hours') {
                    val = item.workedHours;
                  } else if (statsMode === 'records') {
                    val = item.rec ? (item.delayMinutes > 0 ? 4 : 8) : 0;
                  } else {
                    val = item.isLeave ? 8 : 0;
                  }

                  const heightPct = val > 0 ? Math.min(100, Math.max(12, Math.round((val / maxWorkedHours) * 100))) : 4;

                  return (
                    <div
                      key={item.day}
                      onClick={() => setSelectedDayIdx(idx)}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="flex-1 h-full flex flex-col items-center justify-end group cursor-pointer relative"
                      title={`روز ${toPersianDigits(item.day)}: ${toPersianDigits(item.workedHours.toFixed(1))} ساعت کارکرد`}
                    >
                      {/* Floating pill badge on the highlighted bar */}
                      {(isHighlighted || isHovered) && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none animate-in zoom-in-75 duration-150">
                          <span className="rounded-md bg-violet-600 px-2 py-0.5 text-[10px] font-mono font-bold text-white shadow-lg shadow-violet-600/50 whitespace-nowrap">
                            {val > 0 ? `${toPersianDigits(val.toFixed(1))}س` : `روز ${toPersianDigits(item.day)}`}
                          </span>
                          <span className="h-1.5 w-1.5 -mt-0.5 rotate-45 bg-violet-600" />
                        </div>
                      )}

                      {/* Bar Tube */}
                      <div
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          isHighlighted
                            ? 'bg-violet-500 shadow-lg shadow-violet-600/60 ring-2 ring-violet-400/40'
                            : val > 0
                            ? 'bg-white/25 group-hover:bg-white/45'
                            : 'bg-white/[0.06]'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-axis date labels with REAL Persian Days */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400/80 pt-3 border-t border-white/[0.06] mt-2 px-1">
                <span>{toPersianDigits(1)}</span>
                <span>{toPersianDigits(5)}</span>
                <span>{toPersianDigits(10)}</span>
                <span>{toPersianDigits(15)}</span>
                <span>{toPersianDigits(20)}</span>
                <span>{toPersianDigits(25)}</span>
                <span>{toPersianDigits(monthDaysCount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUMN B: TWO STACKED DONUT CARDS (4 columns on lg) */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* 1. Platforms Donut Card: ترکیب ساعات کارکرد */}
          <div className="rounded-[28px] bg-[#1a0f2b]/75 border border-white/10 backdrop-blur-2xl p-5 shadow-2xl flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                <PieChart className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white">
                ترکیب ساعات کارکرد ماه
              </h3>
            </div>

            <div className="flex items-center justify-between gap-4">
              {/* Legend with percentages */}
              <div className="space-y-2 text-xs flex-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#38bdf8] shrink-0" />
                  <span className="text-slate-300 text-[11px] truncate">کارکرد موظف</span>
                  <span className="font-mono text-white font-bold mr-auto">
                    {toPersianDigits(regularPct)}٪
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#8b5cf6] shrink-0" />
                  <span className="text-slate-300 text-[11px] truncate">اضافه‌کار</span>
                  <span className="font-mono text-white font-bold mr-auto">
                    {toPersianDigits(overtimePct)}٪
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#6366f1] shrink-0" />
                  <span className="text-slate-300 text-[11px] truncate">مرخصی</span>
                  <span className="font-mono text-white font-bold mr-auto">
                    {toPersianDigits(leavePct)}٪
                  </span>
                </div>
              </div>

              {/* Modern SVG Donut Chart */}
              <div className="relative h-24 w-24 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  {/* Segment 1: Cyan (Regular) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="34"
                    fill="transparent"
                    stroke="#38bdf8"
                    strokeWidth="11"
                    strokeDasharray={`${(regularPct / 100) * circumference} ${circumference}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                  {/* Segment 2: Violet (Overtime) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="34"
                    fill="transparent"
                    stroke="#8b5cf6"
                    strokeWidth="11"
                    strokeDasharray={`${(overtimePct / 100) * circumference} ${circumference}`}
                    strokeDashoffset={`-${(regularPct / 100) * circumference}`}
                    strokeLinecap="round"
                  />
                  {/* Segment 3: Indigo (Leave) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="34"
                    fill="transparent"
                    stroke="#6366f1"
                    strokeWidth="11"
                    strokeDasharray={`${(leavePct / 100) * circumference} ${circumference}`}
                    strokeDashoffset={`-${((regularPct + overtimePct) / 100) * circumference}`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* 2. Sentiments Donut Card: شاخص انضباط تردد */}
          <div className="rounded-[28px] bg-[#1a0f2b]/75 border border-white/10 backdrop-blur-2xl p-5 shadow-2xl flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <Smile className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white">
                شاخص انضباط ورود و خروج
              </h3>
            </div>

            <div className="flex items-center justify-between gap-4">
              {/* Legend with percentages */}
              <div className="space-y-2 text-xs flex-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#10b981] shrink-0" />
                  <span className="text-slate-300 text-[11px] truncate">ورود به‌موقع</span>
                  <span className="font-mono text-white font-bold mr-auto">
                    {toPersianDigits(onTimePct)}٪
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#f43f5e] shrink-0" />
                  <span className="text-slate-300 text-[11px] truncate">تأخیر در ورود</span>
                  <span className="font-mono text-white font-bold mr-auto">
                    {toPersianDigits(delayPct)}٪
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#64748b] shrink-0" />
                  <span className="text-slate-300 text-[11px] truncate">تعجیل / کسر</span>
                  <span className="font-mono text-white font-bold mr-auto">
                    {toPersianDigits(neutralPct)}٪
                  </span>
                </div>
              </div>

              {/* Modern SVG Donut Chart */}
              <div className="relative h-24 w-24 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  {/* Segment 1: Mint (On-time) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="34"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="11"
                    strokeDasharray={`${(onTimePct / 100) * circumference} ${circumference}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                  {/* Segment 2: Rose (Delay) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="34"
                    fill="transparent"
                    stroke="#f43f5e"
                    strokeWidth="11"
                    strokeDasharray={`${(delayPct / 100) * circumference} ${circumference}`}
                    strokeDashoffset={`-${(onTimePct / 100) * circumference}`}
                    strokeLinecap="round"
                  />
                  {/* Segment 3: Slate (Neutral) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="34"
                    fill="transparent"
                    stroke="#64748b"
                    strokeWidth="11"
                    strokeDasharray={`${(neutralPct / 100) * circumference} ${circumference}`}
                    strokeDashoffset={`-${((onTimePct + delayPct) / 100) * circumference}`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
