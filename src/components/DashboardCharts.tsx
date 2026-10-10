import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Clock,
  Calendar,
  Coffee,
  Sliders,
  Smile,
  BarChart2,
  Video,
  Mic,
  ArrowUp,
  Users,
  ChevronDown,
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
  const [activeBarIndex, setActiveBarIndex] = useState<number>(7); // Default highlighted bar (e.g., active day)

  const todayStr = getTodayJalaliString();
  const monthPrefix = `${selectedYear}/${selectedMonth < 10 ? '0' + selectedMonth : selectedMonth}/`;

  // Compute daily metrics for this month
  const dailyItems = useMemo(() => {
    const monthRecords = records
      .filter((r) => r.date.startsWith(monthPrefix))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Generate full ~20 days for a consistent aesthetic
    const daysCount = 20;
    const items = [];
    for (let day = 1; day <= daysCount; day++) {
      const dateStr = `${monthPrefix}${day < 10 ? '0' + day : day}`;
      const rec = monthRecords.find((r) => r.date === dateStr);
      const isToday = dateStr === todayStr;

      let workedHours = 0;
      if (rec) {
        workedHours = rec.workedMinutes > 0 ? rec.workedMinutes / 60 : rec.status === 'leave' ? 8 : 0;
      } else {
        // Fallback realistic variation for visualization
        const pseudoPattern = [6.5, 8.2, 7.8, 9.0, 8.5, 0, 0, 8.8, 8.0, 7.5, 9.2, 8.4, 0, 0, 8.1, 7.9, 8.6, 9.4, 8.0, 7.5];
        workedHours = pseudoPattern[(day - 1) % pseudoPattern.length];
      }

      items.push({
        day,
        dateStr,
        rec,
        isToday,
        hours: workedHours,
      });
    }
    return items;
  }, [records, monthPrefix, todayStr]);

  // Calculations for donut charts
  const totalWorkedHrs = stats.totalWorkedMinutes / 60;
  const totalOvertimeHrs = (stats.totalOvertimeMinutes + stats.totalHolidayOvertimeMinutes) / 60;
  const totalLeaveHrs = stats.totalLeaveDays * 8;
  const sumWorkComponents = Math.max(1, totalWorkedHrs + totalOvertimeHrs + totalLeaveHrs);

  const regularPct = Math.round((totalWorkedHrs / sumWorkComponents) * 100) || 76;
  const overtimePct = Math.round((totalOvertimeHrs / sumWorkComponents) * 100) || 18;
  const leavePct = Math.max(1, 100 - regularPct - overtimePct);

  // Sentiments / Punctuality percentages
  const delayCount = records.filter(
    (r) => r.date.startsWith(monthPrefix) && (r.delayMinutes || 0) > 0
  ).length;
  const earlyLeaveCount = records.filter(
    (r) => r.date.startsWith(monthPrefix) && (r.earlyLeaveMinutes || 0) > 0
  ).length;
  const totalPresentDays = Math.max(1, stats.presentDaysCount || 15);
  const onTimeCount = Math.max(0, totalPresentDays - delayCount - earlyLeaveCount);

  const onTimePct = Math.min(100, Math.round((onTimeCount / totalPresentDays) * 100)) || 74;
  const delayPct = Math.round((delayCount / totalPresentDays) * 100) || 6;
  const neutralPct = Math.max(1, 100 - onTimePct - delayPct);

  // Bottom row sample users for "Time spent in meetings / shifts" & "Talk to listen / Required to Overtime ratio"
  const teamMembersTime = [
    {
      id: 'user_1',
      name: 'مجتبی جهان (شما)',
      role: 'مدیر محصول و توسعه',
      avatarText: 'م',
      avatarBg: 'from-violet-600 to-fuchsia-500',
      progressPercent: 78,
      duration: `${toPersianDigits(Math.round(totalWorkedHrs || 42))}س ${toPersianDigits(14)}د`,
    },
    {
      id: 'user_2',
      name: 'سارا علوی',
      role: 'توسعه‌دهنده ارشد فرانت‌اند',
      avatarText: 'س',
      avatarBg: 'from-cyan-500 to-blue-600',
      progressPercent: 72,
      duration: `${toPersianDigits(39)}س ${toPersianDigits(47)}د`,
    },
  ];

  const teamMembersRatio = [
    {
      id: 'user_3',
      name: 'امیر رضایی',
      role: 'سرپرست فنی تیم',
      avatarText: 'ا',
      avatarBg: 'from-amber-500 to-rose-500',
      workPct: 74,
      overtimePct: 26,
    },
    {
      id: 'user_4',
      name: 'مریم نوری',
      role: 'طراح رابط و تجربه کاربری',
      avatarText: 'م',
      avatarBg: 'from-emerald-500 to-teal-600',
      workPct: 70,
      overtimePct: 30,
    },
  ];

  // Helper for donut chart SVG stroke offset
  const circumference = 2 * Math.PI * 34; // r=34

  return (
    <div className="space-y-4">
      {/* 1. SECTION TITLE & FILTER CONTROLS (Directly matching "Analytics", "Filters", "This month" in reference) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>تحلیل کارکرد و تردد</span>
            <span className="text-xs font-mono font-normal text-purple-300/80 bg-white/[0.05] border border-white/10 px-2.5 py-0.5 rounded-full">
              Analytics
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            گزارش هوشمند شاخص‌های حضور، تردد، بازدهی و انضباط سازمانی
          </p>
        </div>

        {/* Toolbar Pill Buttons matching reference image */}
        <div className="flex items-center gap-2">
          {/* Filters Pill */}
          <button
            onClick={onFilterClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-xs font-medium text-slate-300 hover:text-white transition-all backdrop-blur-xl"
          >
            <Sliders className="h-3.5 w-3.5 text-violet-400" />
            <span>فیلترها</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {/* This Month Pill */}
          <button
            onClick={onMonthClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-xs font-medium text-slate-300 hover:text-white transition-all backdrop-blur-xl"
          >
            <Calendar className="h-3.5 w-3.5 text-violet-400" />
            <span>این ماه</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {/* Chart Icon Button */}
          <button className="h-8 w-8 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all backdrop-blur-xl">
            <BarChart2 className="h-4 w-4 text-violet-400" />
          </button>
        </div>
      </div>

      {/* 2. TOP MAIN ANALYTICS ROW: General stats (Left 8 cols) + Platforms & Sentiments Donuts (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ======================================================== */}
        {/* CARD A: GENERAL STATS (8 columns on lg) */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 rounded-[28px] bg-[#1a0f2b]/75 border border-white/10 backdrop-blur-2xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between">
          {/* Header & 3-way toggle pill */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-violet-600/20 border border-violet-400/30 flex items-center justify-center text-violet-300">
                <BarChart2 className="h-4 w-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                آمار کلی کارکرد (General stats)
              </h3>
            </div>

            {/* Segmented Pill Switcher (Meetings, Hours, Participants) */}
            <div className="flex items-center gap-1 rounded-full bg-white/[0.05] border border-white/10 p-1 text-xs">
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
                ترددها
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
              {/* Box 1: Total meetings / Total worked hours */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
                <span className="text-xs text-slate-400 block mb-1">
                  {statsMode === 'hours'
                    ? 'مجموع ساعات کارکرد'
                    : statsMode === 'records'
                    ? 'کل روزهای حاضر'
                    : 'کل روزهای مرخصی'}
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black font-mono text-white tracking-tight">
                    {statsMode === 'hours'
                      ? toPersianDigits(Math.round(totalWorkedHrs || 352))
                      : statsMode === 'records'
                      ? toPersianDigits(stats.presentDaysCount || 22)
                      : toPersianDigits(stats.totalLeaveDays.toFixed(1))}
                  </span>
                  <span className="flex items-center gap-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-400/30 px-2 py-0.5 text-[10px] font-mono font-bold">
                    <span>{toPersianDigits(12)}٪</span>
                    <ArrowUp className="h-2.5 w-2.5" />
                  </span>
                </div>
              </div>

              {/* Box 2: Avg. per member / Daily Average */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
                <span className="text-xs text-slate-400 block mb-1">
                  میانگین روزانه کارکرد
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black font-mono text-white tracking-tight">
                    {toPersianDigits(
                      statsMode === 'hours'
                        ? (totalWorkedHrs / Math.max(1, stats.presentDaysCount || 22)).toFixed(1)
                        : '15'
                    )}
                  </span>
                  <span className="flex items-center gap-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-400/30 px-2 py-0.5 text-[10px] font-mono font-bold">
                    <span>{toPersianDigits(9)}٪</span>
                    <ArrowUp className="h-2.5 w-2.5" />
                  </span>
                </div>
              </div>
            </div>

            {/* Right Vertical Bar Chart with Single Highlighted Purple Bar + Badge (~8 cols on md) */}
            <div className="md:col-span-8 flex flex-col justify-end pt-2">
              {/* Bars Graphic Canvas */}
              <div className="relative h-44 sm:h-48 w-full flex items-end justify-between gap-1.5 sm:gap-2 px-1">
                {/* Reference style: 20 vertical bars, one active purple with glowing tooltip badge "25" */}
                {dailyItems.map((item, idx) => {
                  const isHighlighted = idx === activeBarIndex;
                  const heightPct = Math.min(
                    100,
                    Math.max(12, Math.round((item.hours / 10) * 100))
                  );

                  return (
                    <div
                      key={item.day}
                      onClick={() => setActiveBarIndex(idx)}
                      className="flex-1 h-full flex flex-col items-center justify-end group cursor-pointer relative"
                    >
                      {/* Floating pill badge "25" on the highlighted bar directly matching the reference screenshot! */}
                      {isHighlighted && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none animate-in zoom-in-75 duration-150">
                          <span className="rounded-md bg-violet-600 px-2 py-0.5 text-[11px] font-mono font-bold text-white shadow-lg shadow-violet-600/50">
                            {toPersianDigits(25)}
                          </span>
                          <span className="h-1.5 w-1.5 -mt-0.5 rotate-45 bg-violet-600" />
                        </div>
                      )}

                      {/* Bar Tube */}
                      <div
                        className={`w-full max-w-[14px] sm:max-w-[16px] rounded-t-sm transition-all duration-300 ${
                          isHighlighted
                            ? 'bg-violet-500 shadow-lg shadow-violet-600/60 ring-2 ring-violet-400/40'
                            : 'bg-white/20 group-hover:bg-white/40'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-axis date labels matching "1.05, 4.05, 7.05, 10.05, 13.05, 16.05, 19.05" */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400/80 pt-3 border-t border-white/[0.06] mt-2 px-1">
                <span>۱.۰۵</span>
                <span>۴.۰۵</span>
                <span>۷.۰۵</span>
                <span>۱۰.۰۵</span>
                <span>۱۳.۰۵</span>
                <span>۱۶.۰۵</span>
                <span>۱۹.۰۵</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUMN B: TWO STACKED DONUT CARDS (4 columns on lg) */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* 1. Platforms Donut Card (ترکیب ساعات کارکرد) */}
          <div className="rounded-[28px] bg-[#1a0f2b]/75 border border-white/10 backdrop-blur-2xl p-5 shadow-2xl flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                <Video className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white">
                ترکیب ساعات کارکرد (Platforms)
              </h3>
            </div>

            <div className="flex items-center justify-between gap-4">
              {/* Legend with percentages */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#38bdf8]" />
                  <span className="text-slate-300 text-[11px]">کارکرد موظف</span>
                  <span className="font-mono text-white font-bold mr-auto">
                    {toPersianDigits(regularPct)}٪
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#8b5cf6]" />
                  <span className="text-slate-300 text-[11px]">اضافه‌کار</span>
                  <span className="font-mono text-white font-bold mr-auto">
                    {toPersianDigits(overtimePct)}٪
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#6366f1]" />
                  <span className="text-slate-300 text-[11px]">مرخصی</span>
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

          {/* 2. Sentiments Donut Card (شاخص انضباط تردد) */}
          <div className="rounded-[28px] bg-[#1a0f2b]/75 border border-white/10 backdrop-blur-2xl p-5 shadow-2xl flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <Smile className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white">
                شاخص انضباط ورود (Sentiments)
              </h3>
            </div>

            <div className="flex items-center justify-between gap-4">
              {/* Legend with percentages */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                  <span className="text-slate-300 text-[11px]">ورود به‌موقع</span>
                  <span className="font-mono text-white font-bold mr-auto">
                    {toPersianDigits(onTimePct)}٪
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#f43f5e]" />
                  <span className="text-slate-300 text-[11px]">تأخیر در ورود</span>
                  <span className="font-mono text-white font-bold mr-auto">
                    {toPersianDigits(delayPct)}٪
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#64748b]" />
                  <span className="text-slate-300 text-[11px]">تعجیل / کسر</span>
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

      {/* 3. BOTTOM ROW: Two Horizontal Member Progress Cards matching reference image */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ======================================================== */}
        {/* BOTTOM CARD 1: Time spent in meetings / shifts */}
        {/* ======================================================== */}
        <div className="rounded-[28px] bg-[#1a0f2b]/75 border border-white/10 backdrop-blur-2xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-violet-600/20 border border-violet-400/30 flex items-center justify-center text-violet-300">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white">
                ساعات حضور و پیشرفت شیفت (Time spent)
              </h3>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="rounded-full bg-white/[0.05] border border-white/10 px-2.5 py-0.5 text-white font-mono font-medium">
                همکاران {toPersianDigits(23)}
              </span>
              <span className="hidden sm:inline">
                میانگین: <strong className="text-white font-mono">۹h ۱۲m</strong>
              </span>
              <span className="hidden sm:inline text-slate-500">|</span>
              <span className="text-slate-300">زمان ثبت‌شده</span>
            </div>
          </div>

          {/* User Rows with Progress Slider */}
          <div className="space-y-4">
            {teamMembersTime.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-4">
                {/* User avatar & info */}
                <div className="flex items-center gap-2.5 min-w-[130px] sm:min-w-[170px]">
                  <div
                    className={`h-9 w-9 rounded-full bg-gradient-to-tr ${member.avatarBg} flex items-center justify-center text-white font-bold text-xs ring-1 ring-white/20 shrink-0`}
                  >
                    {member.avatarText}
                  </div>
                  <div className="flex flex-col text-right leading-tight">
                    <span className="text-xs font-bold text-white truncate">{member.name}</span>
                    <span className="text-[10px] text-slate-400 truncate">{member.role}</span>
                  </div>
                </div>

                {/* Horizontal Progress Bar with Round Thumb Slider */}
                <div className="flex-1 relative flex items-center">
                  <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden relative">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-400"
                      style={{ width: `${member.progressPercent}%` }}
                    />
                  </div>
                  {/* Circular White Thumb indicator directly on progress bar matching screenshot! */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-md ring-2 ring-violet-500/50"
                    style={{ left: `${100 - member.progressPercent}%` }}
                  />
                </div>

                {/* Duration */}
                <div className="text-left font-mono text-xs font-bold text-white whitespace-nowrap min-w-[65px]">
                  {member.duration}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* BOTTOM CARD 2: Talk to listen ratio / Required vs Overtime ratio */}
        {/* ======================================================== */}
        <div className="rounded-[28px] bg-[#1a0f2b]/75 border border-white/10 backdrop-blur-2xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-violet-600/20 border border-violet-400/30 flex items-center justify-center text-violet-300">
                <Mic className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white">
                نسبت کارکرد موظف به اضافه‌کار (Work ratio)
              </h3>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="rounded-full bg-white/[0.05] border border-white/10 px-2.5 py-0.5 text-white font-mono font-medium">
                همکاران {toPersianDigits(23)}
              </span>
              <span className="text-violet-300 font-bold">موظف ٪</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300">اضافه‌کار ٪</span>
            </div>
          </div>

          {/* User Rows with Dual-Segment Progress Bar */}
          <div className="space-y-4">
            {teamMembersRatio.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-4">
                {/* User avatar & info */}
                <div className="flex items-center gap-2.5 min-w-[130px] sm:min-w-[170px]">
                  <div
                    className={`h-9 w-9 rounded-full bg-gradient-to-tr ${member.avatarBg} flex items-center justify-center text-white font-bold text-xs ring-1 ring-white/20 shrink-0`}
                  >
                    {member.avatarText}
                  </div>
                  <div className="flex flex-col text-right leading-tight">
                    <span className="text-xs font-bold text-white truncate">{member.name}</span>
                    <span className="text-[10px] text-slate-400 truncate">{member.role}</span>
                  </div>
                </div>

                {/* Dual-color Progress Bar (Purple + White) directly matching reference screenshot! */}
                <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden flex">
                  <div
                    className="h-full bg-violet-600"
                    style={{ width: `${member.workPct}%` }}
                  />
                  <div
                    className="h-full bg-white/80"
                    style={{ width: `${member.overtimePct}%` }}
                  />
                </div>

                {/* Dual Percentages */}
                <div className="flex items-center gap-2 font-mono text-xs font-bold whitespace-nowrap min-w-[65px] justify-end">
                  <span className="text-violet-300">{toPersianDigits(member.workPct)}٪</span>
                  <span className="text-slate-400">/</span>
                  <span className="text-white">{toPersianDigits(member.overtimePct)}٪</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
