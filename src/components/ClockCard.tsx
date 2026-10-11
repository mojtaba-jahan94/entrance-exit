import React, { useState, useEffect } from 'react';
import {
  LogIn,
  LogOut,
  Clock,
  AlertTriangle,
  CheckCircle,
  Timer,
  Sparkles,
  Coffee,
  RotateCcw,
  CalendarCheck,
  TrendingUp,
  Hourglass,
  Sliders,
  ChevronDown,
  Activity,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AttendanceRecord, ShiftConfig } from '../types';
import {
  getCurrentTimeString,
  toPersianDigits,
  timeStringToMinutes,
  formatMinutesToPersianReadable,
  formatMinutesToTimeString,
} from '../utils/jalali';

interface ClockCardProps {
  todayRecord: AttendanceRecord | null;
  config: ShiftConfig;
  onCheckIn: (time: string) => void;
  onCheckOut: (time: string, breakMinutes: number) => void;
  onResetToday: () => void;
  onOpenEdit: () => void;
}

export const ClockCard: React.FC<ClockCardProps> = ({
  todayRecord,
  config,
  onCheckIn,
  onCheckOut,
  onResetToday,
  onOpenEdit,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [customInTime, setCustomInTime] = useState<string>('');
  const [showCustomTime, setShowCustomTime] = useState<boolean>(false);

  const isThursday = todayRecord?.dayOfWeek === 5;
  const defaultBreak = isThursday ? 0 : config.defaultBreakMinutes ?? 30;
  const [breakMinutesInput, setBreakMinutesInput] = useState<number>(defaultBreak);

  const isCheckedIn = Boolean(todayRecord && todayRecord.checkIn && !todayRecord.checkOut);
  const isCheckedOut = Boolean(todayRecord && todayRecord.checkIn && todayRecord.checkOut);

  // Sync default break if day changes or config updates
  useEffect(() => {
    if (todayRecord?.breakMinutes !== undefined && todayRecord.breakMinutes > 0) {
      setBreakMinutesInput(todayRecord.breakMinutes);
    } else {
      setBreakMinutesInput(defaultBreak);
    }
  }, [todayRecord, defaultBreak]);

  // Live timer tick when checked in
  useEffect(() => {
    let interval: any = null;
    if (isCheckedIn && todayRecord?.checkIn) {
      const calcElapsed = () => {
        const checkInMins = timeStringToMinutes(todayRecord.checkIn!);
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const currentSecs = now.getSeconds();
        const totalNowSecs = currentMins * 60 + currentSecs;
        const inSecs = checkInMins * 60;
        setElapsedSeconds(Math.max(0, totalNowSecs - inSecs));
      };

      calcElapsed();
      interval = setInterval(calcElapsed, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCheckedIn, todayRecord?.checkIn]);

  const handlePunchInNow = () => {
    const time = getCurrentTimeString(false);
    onCheckIn(time);
  };

  const handleCustomPunchIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInTime) {
      onCheckIn(customInTime);
      setShowCustomTime(false);
      setCustomInTime('');
    }
  };

  const handlePunchOutNow = () => {
    const time = getCurrentTimeString(false);
    onCheckOut(time, breakMinutesInput);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {}
  };

  // Required presence
  const requiredPresence =
    isThursday && config.thursdayStatus === 'half_day'
      ? config.thursdayMinutes || 240
      : config.requiredDailyMinutes || 510;

  const currentWorkedMinutes = isCheckedIn
    ? Math.max(0, Math.floor(elapsedSeconds / 60) - breakMinutesInput)
    : isCheckedOut
    ? todayRecord?.workedMinutes || 0
    : 0;

  const progressPercent = Math.min(
    100,
    Math.round((currentWorkedMinutes / Math.max(1, requiredPresence - breakMinutesInput)) * 100)
  );

  return (
    <div className="relative rounded-2xl border border-white/10 bg-[#09090d] p-6 sm:p-8 overflow-hidden transition-all duration-300 hover:border-white/20">
      {/* Background Matrix Lines */}
      <div className="absolute inset-0 bg-grid-compute pointer-events-none opacity-40" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#eca8d6] uppercase tracking-wider">01 // REAL-TIME ATTENDANCE NODE</span>
          <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-mono text-white/70">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isCheckedIn
                  ? 'bg-[#eca8d6] animate-pulse shadow-[0_0_8px_#eca8d6]'
                  : isCheckedOut
                  ? 'bg-emerald-400'
                  : 'bg-white/40'
              }`}
            />
            <span>
              {isCheckedIn
                ? 'حاضر در شیفت کاری'
                : isCheckedOut
                ? 'شیفت امروز پایان یافت'
                : 'در انتظار ثبت ورود'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-white/50">
          <Clock className="w-3.5 h-3.5 text-[#eca8d6]" />
          <span>شیفت: {config.startTime} الی {config.endTime}</span>
        </div>
      </div>

      {/* Main Grid: Clock Readout & Action Controls */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Big Tabular Clock Readout */}
        <div className="lg:col-span-7 space-y-4">
          <div className="text-[11px] font-mono text-white/40 uppercase tracking-widest">
            {isCheckedIn ? 'زمان سپری‌شده از ورود:' : 'ساعت رسمی تردد:'}
          </div>

          <div className="flex items-baseline gap-3">
            {isCheckedIn ? (
              <div className="font-display text-5xl sm:text-6xl md:text-7xl font-light text-white tracking-tight font-mono tabular-nums">
                {toPersianDigits(
                  `${String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0')}:${String(
                    Math.floor((elapsedSeconds % 3600) / 60)
                  ).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`
                )}
              </div>
            ) : isCheckedOut ? (
              <div className="font-display text-5xl sm:text-6xl md:text-7xl font-light text-white tracking-tight font-mono tabular-nums">
                {toPersianDigits(formatMinutesToTimeString(todayRecord?.workedMinutes || 0))}
                <span className="text-xl sm:text-2xl text-white/40 font-sans mr-2">کارکرد خالص</span>
              </div>
            ) : (
              <div className="font-display text-5xl sm:text-6xl md:text-7xl font-light text-white tracking-tight font-mono tabular-nums">
                {toPersianDigits(getCurrentTimeString(false))}
              </div>
            )}
          </div>

          {/* Progress Bar & Sub-indicators */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-mono text-white/50">
              <span>درصد تکمیل ساعات موظف امروز:</span>
              <span className="text-[#eca8d6] font-semibold">{toPersianDigits(progressPercent)}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#eca8d6] to-[#c597eb] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap gap-3 pt-2 text-xs font-mono">
            {todayRecord?.checkIn && (
              <div className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/80">
                <span className="text-white/40">ورود: </span>
                <span className="text-white font-medium">{toPersianDigits(todayRecord.checkIn)}</span>
              </div>
            )}
            {todayRecord?.targetCheckOut && (
              <div className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/80">
                <span className="text-white/40">خروج موظف پیشنهادی: </span>
                <span className="text-[#eca8d6] font-medium">{toPersianDigits(todayRecord.targetCheckOut)}</span>
              </div>
            )}
            {todayRecord?.checkOut && (
              <div className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/80">
                <span className="text-white/40">خروج ثبت‌شده: </span>
                <span className="text-emerald-400 font-medium">{toPersianDigits(todayRecord.checkOut)}</span>
              </div>
            )}
            <div className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/80">
              <span className="text-white/40">استراحت/ناهار: </span>
              <span className="text-white font-medium">{toPersianDigits(breakMinutesInput)} دقیقه</span>
            </div>
          </div>
        </div>

        {/* Right Column: High-Impact Action Controls */}
        <div className="lg:col-span-5 space-y-4 lg:border-r lg:border-white/10 lg:pr-8">
          {/* State 1: Not Checked In */}
          {!isCheckedIn && !isCheckedOut && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handlePunchInNow}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-white hover:bg-white/90 text-black font-mono font-semibold text-sm shadow-xl shadow-white/10 transition-all active:scale-95"
              >
                <LogIn className="w-4 h-4 text-black" />
                <span>ثبت ورود زنده (ساعت جاری)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCustomTime(!showCustomTime)}
                className="w-full py-2.5 text-xs font-mono text-white/60 hover:text-white transition-colors"
              >
                {showCustomTime ? 'انصراف' : 'ورود با ساعت دستی...'}
              </button>

              {showCustomTime && (
                <form onSubmit={handleCustomPunchIn} className="flex gap-2 animate-in fade-in pt-2">
                  <input
                    type="time"
                    value={customInTime}
                    onChange={(e) => setCustomInTime(e.target.value)}
                    className="flex-1 rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs font-mono text-white text-center focus:border-[#eca8d6] focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-mono bg-[#eca8d6] text-black font-semibold hover:bg-[#f3c2e4]"
                  >
                    ثبت
                  </button>
                </form>
              )}
            </div>
          )}

          {/* State 2: Checked In (In Progress) */}
          {isCheckedIn && (
            <div className="space-y-4">
              {/* Lunch Break Chips */}
              <div className="space-y-2">
                <label className="block text-xs font-mono text-white/60">مدت ناهار و استراحت (کسر از کارکرد):</label>
                <div className="flex gap-2">
                  {[0, 15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setBreakMinutesInput(mins)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-mono border transition-all ${
                        breakMinutesInput === mins
                          ? 'border-[#eca8d6] bg-[#eca8d6]/15 text-[#eca8d6] font-bold'
                          : 'border-white/10 bg-black/40 text-white/50 hover:text-white'
                      }`}
                    >
                      {toPersianDigits(mins)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Punch Out Action */}
              <button
                type="button"
                onClick={handlePunchOutNow}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-white hover:bg-white/90 text-black font-mono font-semibold text-sm shadow-xl shadow-white/10 transition-all active:scale-95"
              >
                <LogOut className="w-4 h-4 text-black" />
                <span>ثبت خروج و اتمام شیفت کاری</span>
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={onResetToday}
                  className="text-[11px] font-mono text-white/40 hover:text-rose-400 transition-colors"
                >
                  بازنشانی تردد امروز
                </button>
              </div>
            </div>
          )}

          {/* State 3: Checked Out (Finished) */}
          {isCheckedOut && (
            <div className="space-y-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>تردد امروز شما با موفقیت ثبت و محاسبه شد.</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                  <div className="text-white/40 text-[10px]">اضافه‌کاری:</div>
                  <div className="text-emerald-400 font-bold mt-0.5">
                    {toPersianDigits(formatMinutesToTimeString(todayRecord?.overtimeMinutes || 0))}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                  <div className="text-white/40 text-[10px]">کسرکار:</div>
                  <div className="text-rose-400 font-bold mt-0.5">
                    {toPersianDigits(formatMinutesToTimeString(todayRecord?.deficitMinutes || 0))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onOpenEdit}
                  className="flex-1 py-2 rounded-xl text-xs font-mono border border-white/15 text-white/80 hover:text-white hover:bg-white/[0.04]"
                >
                  ویرایش دستی
                </button>
                <button
                  type="button"
                  onClick={onResetToday}
                  className="px-3 py-2 rounded-xl text-xs font-mono border border-rose-500/20 text-rose-400 hover:bg-rose-500/10"
                >
                  بازنشانی
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
