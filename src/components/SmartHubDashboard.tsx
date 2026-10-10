import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Plus,
  Bell,
  MessageSquare,
  Settings,
  Calendar,
  Sparkles,
  Wifi,
  Wind,
  Lamp,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Users,
  ShieldCheck,
  Check,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AttendanceRecord, ShiftConfig, MonthlyStats, LeaveRecord } from '../types';
import {
  getCurrentTimeString,
  toPersianDigits,
  timeStringToMinutes,
  formatMinutesToPersianReadable,
  formatMinutesToTimeString,
  parseJalaliDate,
  getJalaliWeekdayName,
  getTodayJalaliString,
} from '../utils/jalali';

interface SmartHubDashboardProps {
  todayRecord: AttendanceRecord | null;
  records: AttendanceRecord[];
  stats: MonthlyStats;
  config: ShiftConfig;
  leaves: LeaveRecord[];
  selectedYear: number;
  selectedMonth: number;
  selectedMonthName: string;
  userName?: string;
  onCheckIn: (time: string) => void;
  onCheckOut: (time: string, breakMinutes: number) => void;
  onResetToday: () => void;
  onOpenManualEntry: () => void;
  onOpenLeaveModal: () => void;
  onOpenSettings: () => void;
  onSwitchToCalendar: () => void;
}

export const SmartHubDashboard: React.FC<SmartHubDashboardProps> = ({
  todayRecord,
  records,
  stats,
  config,
  leaves,
  selectedYear,
  selectedMonth,
  selectedMonthName,
  userName = 'همکار گرامی',
  onCheckIn,
  onCheckOut,
  onResetToday,
  onOpenManualEntry,
  onOpenLeaveModal,
  onOpenSettings,
  onSwitchToCalendar,
}) => {
  // Real-time second tick
  const [liveNow, setLiveNow] = useState<Date>(() => new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);

  // Quick switch toggle states (matching the green toggle switches in the screenshot)
  const [shiftToggle, setShiftToggle] = useState<boolean>(true);
  const [wifiToggle, setWifiToggle] = useState<boolean>(true);
  const [leaveToggle, setLeaveToggle] = useState<boolean>(true);

  // Synchronize live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = getTodayJalaliString();
  const isCheckedIn = Boolean(todayRecord && todayRecord.checkIn && !todayRecord.checkOut);
  const isCheckedOut = Boolean(todayRecord && todayRecord.checkIn && todayRecord.checkOut);
  const isThursday = todayRecord?.dayOfWeek === 5;
  const standardDailyNet = Math.max(
    60,
    (config.requiredDailyMinutes || 510) - (config.defaultBreakMinutes || 30)
  ); // 480 mins (8 hours)

  // Calculate live elapsed seconds if working
  useEffect(() => {
    if (!isCheckedIn || !todayRecord?.checkIn) {
      setElapsedSeconds(0);
      return;
    }

    const checkInMins = timeStringToMinutes(todayRecord.checkIn);
    const update = () => {
      const now = new Date();
      const curMins = now.getHours() * 60 + now.getMinutes();
      const curSecs = now.getSeconds();
      const totalSecs = Math.max(0, (curMins - checkInMins) * 60 + curSecs);
      setElapsedSeconds(totalSecs);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isCheckedIn, todayRecord?.checkIn]);

  // Format elapsed time string
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedHoursFormatted = useMemo(() => {
    const h = Math.floor(elapsedSeconds / 3600);
    const m = Math.floor((elapsedSeconds % 3600) / 60);
    const s = elapsedSeconds % 60;
    return `${toPersianDigits(h < 10 ? '0' + h : h)}:${toPersianDigits(m < 10 ? '0' + m : m)}:${toPersianDigits(s < 10 ? '0' + s : s)}`;
  }, [elapsedSeconds]);

  // Target required minutes today
  const targetRequiredMinutes = isThursday
    ? (config.thursdayMinutes || 240)
    : standardDailyNet;

  // Calculate current completion percentage for the radial dial
  const presenceWorkedMinutes = isCheckedIn
    ? Math.max(0, elapsedMinutes - (elapsedMinutes > 240 ? (config.defaultBreakMinutes || 30) : 0))
    : todayRecord?.workedMinutes || 0;

  const dailyProgressPercent = Math.min(
    100,
    Math.max(0, Math.round((presenceWorkedMinutes / targetRequiredMinutes) * 100))
  );

  // Friendly time greeting
  const greeting = useMemo(() => {
    const hour = liveNow.getHours();
    if (hour >= 5 && hour < 12) return 'صبح بخیر';
    if (hour >= 12 && hour < 17) return 'ظهر بخیر';
    if (hour >= 17 && hour < 21) return 'عصر بخیر';
    return 'شب بخیر';
  }, [liveNow]);

  // Punch actions
  const handleQuickCheckIn = () => {
    const curTime = getCurrentTimeString(false);
    onCheckIn(curTime);
  };

  const handleQuickCheckOut = () => {
    const curTime = getCurrentTimeString(false);
    const breakM = isThursday ? 0 : (config.defaultBreakMinutes ?? 30);
    onCheckOut(curTime, breakM);
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  // Matrix Block Chart calculations (for all days of current month, 1 to 30 or 31)
  const monthDaysCount = selectedMonth <= 6 ? 31 : selectedMonth <= 11 ? 30 : 29;
  const monthPrefix = `${selectedYear}/${selectedMonth < 10 ? '0' + selectedMonth : selectedMonth}/`;

  const matrixChartDays = useMemo(() => {
    const monthRecs = records.filter((r) => r.date.startsWith(monthPrefix));
    const daysArray = [];

    for (let day = 1; day <= monthDaysCount; day++) {
      const dayStr = `${monthPrefix}${day < 10 ? '0' + day : day}`;
      const rec = monthRecs.find((r) => r.date === dayStr);
      const isToday = dayStr === todayStr;
      const isDayActive = isToday && isCheckedIn;

      let workedHours = 0;
      if (isDayActive) {
        workedHours = presenceWorkedMinutes / 60;
      } else if (rec) {
        workedHours = (rec.workedMinutes + (rec.leaveMinutes || 0)) / 60;
      }

      // Max 10 vertical blocks (each block represents ~1 hour, max 10h)
      const blocksLit = Math.min(10, Math.round(workedHours));

      daysArray.push({
        dayNumber: day,
        dateStr: dayStr,
        record: rec,
        isToday,
        isDayActive,
        workedHours,
        blocksLit,
        hasOvertime: rec ? rec.overtimeMinutes > 0 : false,
        hasDeficit: rec ? rec.deficitMinutes > 0 : false,
        isLeave: rec?.status === 'leave',
      });
    }

    return daysArray;
  }, [records, monthPrefix, monthDaysCount, todayStr, isCheckedIn, presenceWorkedMinutes]);

  // Leave quota progress
  const totalLeaveQuotaHours = config.monthlyLeaveQuotaHours || 20;
  const usedLeaveHours = stats.totalLeaveHours || 0;
  const remainingLeaveHours = Math.max(0, totalLeaveQuotaHours - usedLeaveHours);
  const leaveUsagePercent = Math.min(
    100,
    Math.round((usedLeaveHours / totalLeaveQuotaHours) * 100)
  );

  return (
    <div className="relative w-full rounded-[32px] sm:rounded-[36px] border border-white/[0.12] bg-[#0c0f18]/90 backdrop-blur-3xl shadow-2xl overflow-hidden p-3 sm:p-6 text-white font-sans">
      {/* Background Ambient Atmospheric Lighting (Sunset Lamp glow on left + twilight blue on right, exactly like screenshot!) */}
      <div className="pointer-events-none absolute -top-24 -left-12 h-[550px] w-[550px] rounded-full bg-gradient-to-tr from-amber-500/25 via-orange-600/15 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute top-10 left-[22%] h-[420px] w-[420px] rounded-full bg-amber-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -top-32 -right-20 h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-blue-600/20 via-cyan-500/10 to-transparent blur-3xl" />

      {/* Main 2-Column Split: Hero Showcase (Left) vs Smart Hub Cards (Right) */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* ========================================================= */}
        {/* LEFT COLUMN: HERO SHOWCASE (Greeting, Radial Arc Dial, Lamp) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5 sm:p-7 backdrop-blur-2xl relative overflow-hidden shadow-xl min-h-[580px]">
          {/* Subtle Warm Backlight Behind Hero Lamp */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[340px] w-[340px] rounded-full bg-gradient-to-tr from-amber-500/20 via-orange-500/15 to-transparent blur-2xl" />

          {/* Top: Header Greeting ("Good Morning, Alex" style) */}
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {greeting}، {userName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300/80 mt-1.5 leading-relaxed font-light max-w-sm">
              مدیریت و پایش زنده کارکرد، تردد هوشمند و ثبت ساعات کاری در یک نگاه
            </p>
          </div>

          {/* Centerpiece: ILLUMINATED RADIAL ARC DIAL & LAMP */}
          <div className="relative my-auto py-4 flex flex-col items-center justify-center z-10">
            {/* The Arc Graduation Gauge (matching 10%, 20%, 40%, 60%, 80%, 100% in image!) */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              {/* Radial Arc SVG with Graduation Marks */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 200 200">
                {/* Arc Track (Semi-circle arc 220 degrees) */}
                <circle
                  cx="100"
                  cy="100"
                  r="86"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="2.5"
                  strokeDasharray="420"
                  strokeDashoffset="120"
                  strokeLinecap="round"
                />

                {/* Lit Progress Arc */}
                <circle
                  cx="100"
                  cy="100"
                  r="86"
                  fill="none"
                  stroke="url(#warmGradient)"
                  strokeWidth="4"
                  strokeDasharray="420"
                  strokeDashoffset={420 - (dailyProgressPercent / 100) * 300}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />

                <defs>
                  <linearGradient id="warmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="60%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#fde047" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Arc Dial Labels (10%, 20%, 40%, 60%, 80%, 100%) */}
              <div className="absolute inset-0 pointer-events-none text-[9px] sm:text-[10px] font-mono font-semibold text-slate-400">
                <span className="absolute bottom-8 left-10">۱۰٪</span>
                <span className="absolute top-28 left-4">۲۵٪</span>
                <span className="absolute top-10 left-12">۴۰٪</span>
                <span className="absolute top-4 left-1/2 -translate-x-1/2 text-amber-300 font-bold">۶۰٪</span>
                <span className="absolute top-10 right-12">۸۰٪</span>
                <span className="absolute top-28 right-4 text-emerald-400 font-bold">۱۰۰٪</span>
              </div>

              {/* Lamp / Dial Center Silhouette & Glow */}
              <div className="relative flex flex-col items-center justify-center text-center">
                {/* Glowing Lamp Icon / Cone Light */}
                <div className="relative mb-2 flex items-center justify-center">
                  <div className="absolute -top-6 h-16 w-24 bg-gradient-to-b from-amber-400/40 via-amber-300/10 to-transparent blur-md rounded-t-full pointer-events-none" />
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-b from-amber-400/20 to-amber-600/10 border border-amber-400/30 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Lamp className="h-7 w-7 text-amber-300 animate-pulse" />
                  </div>
                </div>

                {/* Big Percentage Display (e.g. 40% in screenshot!) */}
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white drop-shadow-md">
                  {toPersianDigits(dailyProgressPercent)}%
                </div>
                <div className="text-[11px] text-slate-300/80 font-medium mt-0.5">
                  تحقق موظفی امروز
                </div>

                {/* Live Counter or Punch Status */}
                <div className="mt-2 text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                  {isCheckedIn ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>حضور: {elapsedHoursFormatted}</span>
                    </>
                  ) : isCheckedOut ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>پایان شیفت امروز</span>
                    </>
                  ) : (
                    <span>ورود ثبت نشده</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Button under Lamp */}
            <div className="mt-2 flex items-center gap-2">
              {!isCheckedIn && !isCheckedOut && (
                <button
                  onClick={handleQuickCheckIn}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95"
                >
                  <Clock className="h-4 w-4" />
                  <span>ثبت ورود سریع امروز</span>
                </button>
              )}

              {isCheckedIn && (
                <button
                  onClick={handleQuickCheckOut}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition-all hover:scale-105 active:scale-95"
                >
                  <Clock className="h-4 w-4" />
                  <span>ثبت خروج و پایان کار</span>
                </button>
              )}

              {isCheckedOut && (
                <button
                  onClick={onResetToday}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-300 hover:text-white text-xs transition-all border border-white/10"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>بازنشانی امروز</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Left: Glass Pill Card (Smart Family Hub style in screenshot) */}
          <div className="relative z-10 flex items-center justify-between rounded-2xl border border-white/[0.1] bg-white/[0.06] p-3 backdrop-blur-xl shadow-lg">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Users className="h-3.5 w-3.5 text-amber-400" />
                <span>مرکز حضور و شیفت کاری</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                ورود شناور ۰۸:۳۰ تا ۰۹:۳۰ • ۳۰دقیقه ناهار
              </p>
            </div>

            {/* Circular Avatars with Glass Edge */}
            <div className="flex items-center -space-x-1.5 space-x-reverse">
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/20 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                ع
              </div>
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 border border-white/20 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                م
              </div>
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 border border-white/20 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                س
              </div>
              <div className="h-7 w-7 rounded-full bg-white/[0.1] border border-white/20 flex items-center justify-center text-[9px] text-slate-300 font-mono">
                +۴
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: SMART HUB CARDS & MATRIX EQUALIZER CHART */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4 sm:space-y-5">
          {/* Top Actions Bar (Message, Bell, + Add Punch button from screenshot!) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>پیشخوان هوشمند کارکرد</span>
              </span>
              <span className="hidden sm:inline-block text-[11px] text-slate-500 font-mono">
                | {selectedMonthName} {toPersianDigits(selectedYear)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Calendar Toggle Button */}
              <button
                onClick={onSwitchToCalendar}
                title="نمایش تقویم کامل شمسی"
                className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-all shadow-sm"
              >
                <Calendar className="h-4 w-4" />
              </button>

              {/* Settings Button */}
              <button
                onClick={onOpenSettings}
                title="تنظیمات شیفت و سیستم"
                className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-all shadow-sm"
              >
                <Settings className="h-4 w-4" />
              </button>

              {/* Add Device Style: + ثبت تردد جدید Glass Pill */}
              <button
                onClick={onOpenManualEntry}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-white/[0.15] bg-white/[0.08] hover:bg-white/[0.15] text-xs font-semibold text-white shadow-lg backdrop-blur-xl transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>ثبت تردد</span>
              </button>
            </div>
          </div>

          {/* Row of 3 Frosted Glass Cards (Air Conditioner, Wi-Fi, Smart Lamp positions) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            {/* CARD 1: Air Conditioner position -> شیفت کاری و حضور */}
            <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-2xl shadow-xl flex flex-col justify-between transition-all hover:border-white/[0.15] relative overflow-hidden group">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">شیفت کاری</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">شناور ۰۸:۳۰ تا ۱۸:۰۰</p>
                </div>
                {/* Glowing Green Switch (from screenshot!) */}
                <button
                  type="button"
                  onClick={() => setShiftToggle(!shiftToggle)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                    shiftToggle ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                      shiftToggle ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Clean Metric Display */}
              <div className="my-3 flex items-baseline justify-between">
                <div>
                  <span className="text-xl sm:text-2xl font-black font-mono text-white">
                    {toPersianDigits('۸.۵')}
                  </span>
                  <span className="text-[10px] text-slate-400 mr-1">ساعت موظف</span>
                </div>
                <Wind className="h-5 w-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              </div>

              <div className="pt-2 border-t border-white/[0.06] text-[10px] text-slate-400 flex items-center justify-between">
                <span>ناهار: ۳۰د کسر</span>
                <span className="text-emerald-400 font-medium">خالص ۸س</span>
              </div>
            </div>

            {/* CARD 2: Wi-Fi position -> تراز و اضافه کاری */}
            <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-2xl shadow-xl flex flex-col justify-between transition-all hover:border-white/[0.15] relative overflow-hidden group">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">تراز اضافه کار</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">انضباط و کارکرد</p>
                </div>
                {/* Glowing Green Switch */}
                <button
                  type="button"
                  onClick={() => setWifiToggle(!wifiToggle)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                    wifiToggle ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                      wifiToggle ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Clean Metric Display (like 850 Mbps in screenshot) */}
              <div className="my-3 flex items-baseline justify-between">
                <div>
                  <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                    +{toPersianDigits(Math.round(stats.totalOvertimeMinutes / 60))}
                  </span>
                  <span className="text-[10px] text-slate-400 mr-1">ساعت مازاد</span>
                </div>
                <Wifi className="h-5 w-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
              </div>

              <div className="pt-2 border-t border-white/[0.06] text-[10px] text-slate-400 flex items-center justify-between">
                <span>انضباط ورود:</span>
                <span className="text-cyan-400 font-bold font-mono">۹۵٪</span>
              </div>
            </div>

            {/* CARD 3: Smart Lamp position -> سهمیه مرخصی با اسلایدر */}
            <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-2xl shadow-xl flex flex-col justify-between transition-all hover:border-white/[0.15] relative overflow-hidden group">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">سهمیه مرخصی</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">۲.۵ روز در ماه</p>
                </div>
                {/* Glowing Green Switch */}
                <button
                  type="button"
                  onClick={() => setLeaveToggle(!leaveToggle)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                    leaveToggle ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                      leaveToggle ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Horizontal Slider Pill (like 66% in screenshot!) */}
              <div className="my-3 flex items-center justify-between gap-2">
                <div className="h-5 flex-1 rounded-full bg-slate-800/80 p-0.5 flex items-center">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.5)] transition-all duration-500"
                    style={{ width: `${Math.max(15, 100 - leaveUsagePercent)}%` }}
                  />
                </div>
                <span className="text-xs font-bold font-mono text-amber-300 shrink-0">
                  {toPersianDigits(Math.round(100 - leaveUsagePercent))}%
                </span>
              </div>

              <div className="pt-2 border-t border-white/[0.06] text-[10px] text-slate-400 flex items-center justify-between">
                <span>مانده:</span>
                <span className="text-amber-300 font-bold font-mono">
                  {toPersianDigits(stats.remainingLeaveDays.toFixed(1))} روز
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* BOTTOM WIDE CARD: ENERGY USAGE STYLE MATRIX EQUALIZER CHART */}
          {/* ========================================================= */}
          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.04] p-4 sm:p-5 backdrop-blur-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
            {/* Card Header ("Energy Usage" position in screenshot!) */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-3">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>کارکرد روزانه و ماهانه</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (پایش روز به روز بر حسب ساعات موثر)
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  پایش زنده و هوشمند کارکرد شما در ماه {selectedMonthName}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onSwitchToCalendar}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                  title="تنظیمات بیشتر"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Big Stat (matching 12.8 kWh in screenshot!) */}
            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                {toPersianDigits((stats.totalWorkedMinutes / 60).toFixed(1))}
              </span>
              <span className="text-xs text-slate-400 font-medium">ساعت کارکرد کل ماه</span>
              <span className="text-[10px] text-slate-500 font-mono">
                / {toPersianDigits((stats.totalRequiredMinutes / 60).toFixed(0))}س موظفی
              </span>
            </div>

            {/* THE EXACT MATRIX EQUALIZER BLOCK CHART (From Screenshot!) */}
            <div className="relative pt-1 overflow-x-auto no-scrollbar">
              <div className="min-w-[480px]">
                {/* 10 Vertical Rows of Matrix Blocks per Day Column */}
                <div className="flex items-end justify-between gap-1 sm:gap-1.5 h-36 px-1">
                  {matrixChartDays.map((d, index) => {
                    const isHovered = hoveredDayIndex === index;

                    return (
                      <div
                        key={d.dateStr}
                        className="flex-1 flex flex-col items-center justify-end gap-1 group cursor-pointer relative h-full"
                        onMouseEnter={() => setHoveredDayIndex(index)}
                        onMouseLeave={() => setHoveredDayIndex(null)}
                      >
                        {/* Hover Tooltip */}
                        {isHovered && (
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-40 whitespace-nowrap rounded-xl border border-white/20 bg-[#161b28]/95 px-2.5 py-1 text-xs shadow-2xl backdrop-blur-xl pointer-events-none text-center animate-in fade-in zoom-in-95">
                            <div className="text-[10px] text-slate-300 font-medium">
                              روز {toPersianDigits(d.dayNumber)} {selectedMonthName}
                            </div>
                            <div className="text-[11px] font-mono font-bold text-amber-300">
                              {d.isDayActive
                                ? 'در حال کار'
                                : d.isLeave
                                ? 'مرخصی'
                                : d.workedHours > 0
                                ? `${toPersianDigits(d.workedHours.toFixed(1))} ساعت`
                                : 'بدون کارکرد'}
                            </div>
                          </div>
                        )}

                        {/* 10 Vertical Stacked Square Matrix Blocks (Equalizer blocks!) */}
                        <div className="w-full flex flex-col-reverse gap-1 items-center">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((blockLevel) => {
                            const isLit = blockLevel <= d.blocksLit;
                            const isTargetLine = blockLevel === 8;

                            return (
                              <div
                                key={blockLevel}
                                className={`w-full max-w-[10px] h-2 sm:h-2.5 rounded-[2px] transition-all duration-200 ${
                                  isLit
                                    ? d.isDayActive
                                      ? 'bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse'
                                      : d.hasOvertime && blockLevel > 8
                                      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                                      : 'bg-amber-400/90 shadow-[0_0_5px_rgba(251,191,36,0.4)]'
                                    : isTargetLine
                                    ? 'bg-white/[0.08] border-b border-indigo-400/40'
                                    : 'bg-white/[0.04]'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Day Numbers Along Bottom (01, 02, ... 30 in screenshot!) */}
                <div className="flex items-center justify-between gap-1 sm:gap-1.5 px-1 mt-2 pt-2 border-t border-white/[0.08]">
                  {matrixChartDays.map((d) => (
                    <div
                      key={`lbl_${d.dateStr}`}
                      className="flex-1 text-center font-mono text-[8px] sm:text-[9px]"
                    >
                      {d.isToday ? (
                        <span className="inline-block px-1 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40">
                          {toPersianDigits(d.dayNumber < 10 ? '0' + d.dayNumber : d.dayNumber)}
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          {toPersianDigits(d.dayNumber < 10 ? '0' + d.dayNumber : d.dayNumber)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
