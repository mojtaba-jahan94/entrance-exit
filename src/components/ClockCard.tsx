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
      setBreakMinutesInput(isThursday ? 0 : config.defaultBreakMinutes ?? 30);
    }
  }, [todayRecord?.breakMinutes, isThursday, config.defaultBreakMinutes]);

  // Live timer tick if checked in
  useEffect(() => {
    if (!isCheckedIn || !todayRecord?.checkIn) {
      setElapsedSeconds(0);
      return;
    }

    const checkInMins = timeStringToMinutes(todayRecord.checkIn);
    const updateElapsed = () => {
      const now = new Date();
      const curMins = now.getHours() * 60 + now.getMinutes();
      const curSecs = now.getSeconds();
      const totalSecs = Math.max(0, (curMins - checkInMins) * 60 + curSecs);
      setElapsedSeconds(totalSecs);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [isCheckedIn, todayRecord?.checkIn]);

  const formatElapsed = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const hStr = hours < 10 ? `0${hours}` : `${hours}`;
    const mStr = mins < 10 ? `0${mins}` : `${mins}`;
    const sStr = secs < 10 ? `0${secs}` : `${secs}`;
    return `${toPersianDigits(hStr)}:${toPersianDigits(mStr)}:${toPersianDigits(sStr)}`;
  };

  // Target checkout calculation
  const requiredPresenceMins = isThursday
    ? (config.thursdayMinutes || 240)
    : (config.requiredDailyMinutes || 510);

  const targetDepartureTime = React.useMemo(() => {
    if (!todayRecord?.checkIn) return null;
    const inMins = timeStringToMinutes(todayRecord.checkIn);
    return formatMinutesToTimeString(inMins + requiredPresenceMins);
  }, [todayRecord?.checkIn, requiredPresenceMins]);

  // Shift progress (0 - 100%) and overtime tracking
  const targetTotalSecs = requiredPresenceMins * 60;
  const shiftProgressPercent = Math.min(
    100,
    targetTotalSecs > 0 ? Math.round((elapsedSeconds / targetTotalSecs) * 100) : 0
  );
  const isOvertimeLive = elapsedSeconds > targetTotalSecs;
  const remainingLiveSecs = Math.max(0, targetTotalSecs - elapsedSeconds);
  const overtimeLiveSecs = Math.max(0, elapsedSeconds - targetTotalSecs);

  const handleCheckInClick = () => {
    const curTime = showCustomTime && customInTime ? customInTime : getCurrentTimeString(false);
    onCheckIn(curTime);
    setShowCustomTime(false);
  };

  const handleCheckOutClick = () => {
    const curTime = getCurrentTimeString(false);
    onCheckOut(curTime, breakMinutesInput);

    // Fire micro celebration confetti
    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="group relative rounded-2xl border border-black/[0.08] bg-white p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-300 hover:border-black/[0.16] hover:bg-[#fafaf8]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Shift status and editorial information */}
        <div className="flex-1 space-y-4">
          {/* Top Pill Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-widest font-mono text-black/50 bg-black/[0.04] border border-black/[0.06] uppercase">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCheckedIn
                    ? 'bg-emerald-500 shadow-[0_0_6px_#4ade80] animate-pulse'
                    : 'bg-black/30'
                }`}
              />
              {isCheckedIn ? 'LIVE ATTENDANCE // شیفت فعال' : isCheckedOut ? 'COMPLETED // شیفت تکمیل‌شده' : 'STANDBY // در انتظار ثبت ورود'}
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-sans text-black/45 bg-black/[0.03] border border-black/[0.06]">
              <Clock className="h-3 w-3 text-black/40" />
              {isThursday
                ? `پنج‌شنبه: ${toPersianDigits('۴:۰۰')} ساعت`
                : `بازه مجاز ورود: ${toPersianDigits(config.flexStartTimeMin || '08:30')} تا ${toPersianDigits(config.flexStartTimeMax || '09:30')}`}
            </span>

            {todayRecord?.isHoliday && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-sans text-rose-600 bg-rose-50 border border-rose-200">
                {todayRecord.holidayTitle || 'تعطیل رسمی'}
              </span>
            )}
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-[#111] tracking-tight leading-tight">
              میز کار و ثبت برخط تردد امروز
            </h2>

            {!isCheckedIn && !isCheckedOut && (
              <p className="mt-1.5 text-xs sm:text-sm text-black/45 leading-relaxed max-w-xl">
                آماده ثبت ورود برای شیفت روز جاری. ساعات موظفی کاری بر اساس شیفت شناور محاسبه خواهد شد.
              </p>
            )}

            {isCheckedIn && (
              <div className="mt-2 space-y-1">
                <p className="text-xs sm:text-sm text-black/60 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    ورود ثبت‌شده: <strong className="font-mono text-[#111] font-semibold">{toPersianDigits(todayRecord?.checkIn || '')}</strong>
                  </span>
                  {targetDepartureTime && (
                    <span className="text-black/45 font-mono text-xs">
                      • زمان اتمام موظفی: <strong className="text-[#111]">{toPersianDigits(targetDepartureTime)}</strong>
                    </span>
                  )}
                </p>
              </div>
            )}

            {isCheckedOut && (
              <p className="mt-1.5 text-xs sm:text-sm text-emerald-700 flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>شیفت کاری امروز با موفقیت ثبت شد و محاسبات نهایی در کارنامه درج گردید.</span>
              </p>
            )}
          </div>

          {/* Live Progress Bar if Checked In */}
          {isCheckedIn && (
            <div className="pt-2 max-w-lg">
              <div className="flex items-center justify-between text-[11px] font-mono text-black/40 mb-1.5">
                <span>پیشرفت ساعات موظفی شیفت</span>
                <span className="font-medium text-[#111]">{toPersianDigits(shiftProgressPercent)}٪</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-black/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isOvertimeLive ? 'bg-indigo-600' : 'bg-[#111]'
                  }`}
                  style={{ width: `${shiftProgressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Metrics summary badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {todayRecord?.checkIn && (
              <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] px-3 py-1.5 text-xs text-black/60 font-mono">
                <span className="text-black/40">ورود: </span>
                <span className="font-bold text-[#111]">{toPersianDigits(todayRecord.checkIn)}</span>
              </div>
            )}

            {todayRecord?.checkOut && (
              <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] px-3 py-1.5 text-xs text-black/60 font-mono">
                <span className="text-black/40">خروج: </span>
                <span className="font-bold text-[#111]">{toPersianDigits(todayRecord.checkOut)}</span>
              </div>
            )}

            {todayRecord && todayRecord.workedMinutes > 0 && (
              <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] px-3 py-1.5 text-xs text-black/70">
                <span className="text-black/40">کارکرد خالص: </span>
                <strong className="font-medium text-[#111] font-mono">
                  {formatMinutesToPersianReadable(todayRecord.workedMinutes)}
                </strong>
              </div>
            )}

            {todayRecord && todayRecord.delayMinutes > 0 && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-700 flex items-center gap-1 font-mono">
                <AlertTriangle className="h-3 w-3" />
                <span>تاخیر: </span>
                <strong>{toPersianDigits(todayRecord.delayMinutes)} د</strong>
              </div>
            )}

            {todayRecord && (todayRecord.overtimeMinutes > 0 || todayRecord.holidayOvertimeMinutes > 0) && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800 flex items-center gap-1 font-mono">
                <TrendingUp className="h-3 w-3" />
                <span>اضافه کار: </span>
                <strong>
                  {formatMinutesToPersianReadable(
                    todayRecord.overtimeMinutes + todayRecord.holidayOvertimeMinutes
                  )}
                </strong>
              </div>
            )}

            {todayRecord && todayRecord.deficitMinutes > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 font-mono">
                <span>کسر کار: </span>
                <strong>{toPersianDigits(todayRecord.deficitMinutes)} د</strong>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Stopwatch box or Action Button */}
        <div className="w-full lg:w-80 flex flex-col items-center gap-3">
          {/* State 1: Ready to Check In */}
          {!isCheckedIn && !isCheckedOut && (
            <div className="w-full space-y-3">
              <button
                onClick={handleCheckInClick}
                className="w-full py-4 px-6 rounded-xl bg-[#111] text-white hover:bg-[#2c2c2c] transition-all duration-200 text-sm font-medium tracking-wide flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98]"
              >
                <LogIn className="h-4 w-4" />
                <span>ثبت ورود امروز</span>
              </button>

              {/* Custom In Time toggle */}
              <div className="text-center">
                {!showCustomTime ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomTime(true);
                      setCustomInTime(getCurrentTimeString(false));
                    }}
                    className="text-[11px] text-black/40 hover:text-black transition-colors inline-flex items-center gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    <span>ثبت دستی ساعت ورود</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-black/[0.03] border border-black/[0.08] text-xs">
                    <span className="text-black/50">ساعت ورود:</span>
                    <input
                      type="time"
                      value={customInTime}
                      onChange={(e) => setCustomInTime(e.target.value)}
                      className="rounded-lg bg-white px-2 py-1 font-mono text-[#111] text-xs border border-black/10 text-center flex-1 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomTime(false)}
                      className="text-black/40 hover:text-black px-1"
                    >
                      لغو
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* State 2: Checked In (Timer Display & Checkout) */}
          {isCheckedIn && (
            <div className="w-full space-y-3">
              {/* Minimalist Live Stopwatch Box */}
              <div className="rounded-2xl border border-black/[0.08] bg-black/[0.02] p-4 text-center">
                <div className="flex items-center justify-between text-xs text-black/50 font-mono mb-1">
                  <span className="flex items-center gap-1.5">
                    <Timer className="h-3 w-3 text-black/40" />
                    <span>{isOvertimeLive ? 'اضافه کار زنده' : 'حضور زنده امروز'}</span>
                  </span>
                  <span>{toPersianDigits(shiftProgressPercent)}٪</span>
                </div>

                <div className="text-3xl sm:text-4xl font-light font-mono text-[#111] tracking-tight dir-ltr my-1">
                  {formatElapsed(elapsedSeconds)}
                </div>

                <div className="text-[11px] text-black/45 font-mono mt-1">
                  {isOvertimeLive ? (
                    <span className="text-emerald-700 font-medium">
                      موظفی تکمیل شد (+{formatElapsed(overtimeLiveSecs)} مازاد)
                    </span>
                  ) : (
                    <span>{formatElapsed(remainingLiveSecs)} تا اتمام موظفی</span>
                  )}
                </div>
              </div>

              {/* Lunch / Break Selector */}
              <div className="p-2.5 rounded-xl border border-black/[0.06] bg-black/[0.02] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-black/60 flex items-center gap-1.5">
                    <Coffee className="h-3 w-3 text-black/40" />
                    <span>کسر استراحت و ناهار:</span>
                  </span>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      min="0"
                      max="180"
                      value={breakMinutesInput}
                      onChange={(e) => setBreakMinutesInput(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-12 rounded-lg bg-white border border-black/10 px-1.5 py-0.5 text-center text-xs focus:outline-none"
                    />
                    <span className="text-black/40 text-[11px]">دقیقه</span>
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-4 gap-1">
                  {[0, 15, 30, 45].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBreakMinutesInput(preset)}
                      className={`py-1 rounded-lg text-[10px] font-mono transition-all ${
                        breakMinutesInput === preset
                          ? 'bg-[#111] text-white font-medium'
                          : 'bg-white border border-black/10 text-black/60 hover:text-black'
                      }`}
                    >
                      {preset === 0 ? '۰ د' : `${toPersianDigits(preset)} د`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Check Out Button */}
              <button
                onClick={handleCheckOutClick}
                className="w-full py-3.5 px-6 rounded-xl bg-[#111] text-white hover:bg-[#2c2c2c] transition-all text-sm font-medium tracking-wide flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4" />
                <span>ثبت پایان کار و خروج</span>
              </button>
            </div>
          )}

          {/* State 3: Completed Today */}
          {isCheckedOut && (
            <div className="w-full space-y-2.5 text-center">
              <div className="py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                شیفت امروز نهایی شد
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenEdit}
                  className="flex-1 py-2 px-3 rounded-xl border border-black/10 text-black/70 hover:text-black hover:bg-black/[0.04] text-xs font-medium transition-all"
                >
                  ویرایش
                </button>
                <button
                  onClick={onResetToday}
                  className="py-2 px-3 rounded-xl border border-black/10 text-black/50 hover:text-rose-600 hover:border-rose-300 text-xs transition-all"
                  title="بازنشانی ثبت امروز"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
