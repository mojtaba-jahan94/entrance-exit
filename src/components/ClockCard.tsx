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
import { LiquidGlassCard } from './LiquidGlassCard';
import {
  getCurrentTimeString,
  toPersianDigits,
  timeStringToMinutes,
  formatMinutesToPersianReadable,
  formatMinutesToTimeString,
} from '../utils/jalali';
import { useVisualEffects, isReducedMotionPreferred } from '../utils/uiSettings';

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
  const effectsMode = useVisualEffects();
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

    // Fire micro celebration confetti only when visual effects is 'high' and reduced motion is disabled
    if (effectsMode === 'high' && !isReducedMotionPreferred()) {
      try {
        confetti({
          particleCount: 35,
          spread: 50,
          ticks: 120, // Short duration
          origin: { y: 0.65 },
          disableForReducedMotion: true,
        });
      } catch {
        // ignore
      }
    }
  };

  return (
    <LiquidGlassCard className="rounded-[32px] p-5 sm:p-7 shadow-2xl">
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
        {/* Left Side: Status & Timer Information */}
        <div className="w-full md:w-auto flex-1 space-y-3 sm:space-y-4 text-center md:text-right">
          {/* Shift Policy Badge */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.1] px-3.5 py-1 text-[11px] sm:text-xs font-medium text-white/90 border border-white/20 backdrop-blur-md shadow-sm">
              <Clock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              {isThursday ? (
                <span>
                  شیفت پنج‌شنبه: <strong>{toPersianDigits('۴:۰۰')} ساعت حضور</strong> (بدون کسر ناهار)
                </span>
              ) : (
                <span>
                  ورود شناور: {toPersianDigits(config.flexStartTimeMin || '08:30')} الی {toPersianDigits(config.flexStartTimeMax || '09:30')} | خروج: {toPersianDigits(config.flexDepartureMin || '17:00')} الی {toPersianDigits(config.flexDepartureMax || '18:00')}
                </span>
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3.5 py-1 text-[11px] sm:text-xs font-semibold text-blue-200 border border-blue-400/30 backdrop-blur-md">
              <Coffee className="h-3 w-3 text-amber-400 shrink-0" />
              <span>
                {isThursday
                  ? 'موظفی ۴ ساعت'
                  : `حضور موظفی ۸.۵ ساعت (با کسر ${toPersianDigits(config.defaultBreakMinutes || 30)} د ناهار)`}
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white/95 flex items-center justify-center md:justify-start gap-2.5">
              <span>میز کار و تردد امروز شما</span>
              {todayRecord?.isHoliday && (
                <span className="text-[11px] sm:text-xs font-semibold px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/40 backdrop-blur-md">
                  {todayRecord.holidayTitle || 'تعطیل'}
                </span>
              )}
            </h2>

            {/* Subtext description based on state */}
            {!isCheckedIn && !isCheckedOut && (
              <p className="mt-1.5 text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                هنوز ورود امروز را ثبت نکرده‌اید. ساعت مجاز ورود شما از <strong className="text-white">{toPersianDigits(config.flexStartTimeMin || '08:30')}</strong> تا <strong className="text-white">{toPersianDigits(config.flexStartTimeMax || '09:30')}</strong> بدون تاخیر است.
              </p>
            )}

            {isCheckedIn && (
              <div className="mt-1.5 space-y-1">
                <p className="text-xs sm:text-sm text-emerald-300 font-medium flex items-center justify-center md:justify-start gap-2">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-sm shadow-emerald-400"></span>
                  </span>
                  <span>
                    در حال کار — ورود در ساعت <strong className="font-mono text-white text-sm sm:text-base">{toPersianDigits(todayRecord?.checkIn || '')}</strong> ثبت شده است.
                  </span>
                </p>

                {/* Target Departure notification */}
                {targetDepartureTime && (
                  <p className="text-xs text-slate-100 font-medium flex items-center justify-center md:justify-start gap-1.5 flex-wrap">
                    <Hourglass className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>ساعت تکمیل موظفی امروز: </span>
                    <strong className="font-mono text-cyan-300 font-bold text-xs sm:text-sm">
                      {toPersianDigits(targetDepartureTime)}
                    </strong>
                    <span className="text-slate-200 font-medium">
                      ({isThursday ? `${toPersianDigits(formatMinutesToTimeString(requiredPresenceMins))} ساعت حضور` : '۸.۵ ساعت حضور با نیم ساعت ناهار'})
                    </span>
                  </p>
                )}
              </div>
            )}

            {isCheckedOut && (
              <p className="mt-1.5 text-xs sm:text-sm text-cyan-300 font-medium flex items-center justify-center md:justify-start gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>شیفت کاری امروز با موفقیت به پایان رسید و محاسبه شد. خسته نباشید!</span>
              </p>
            )}
          </div>

          {/* Today Metrics Badges */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-center sm:text-right">
            {todayRecord?.checkIn && (
              <div className="rounded-full border border-white/20 bg-white/[0.08] backdrop-blur-md px-3 py-1.5 text-xs text-white">
                <span className="text-slate-200 font-medium">ورود: </span>
                <span className="font-mono font-bold text-white">{toPersianDigits(todayRecord.checkIn)}</span>
              </div>
            )}

            {todayRecord?.checkOut && (
              <div className="rounded-full border border-white/20 bg-white/[0.08] backdrop-blur-md px-3 py-1.5 text-xs text-white">
                <span className="text-slate-200 font-medium">خروج: </span>
                <span className="font-mono font-bold text-white">{toPersianDigits(todayRecord.checkOut)}</span>
              </div>
            )}

            {todayRecord && todayRecord.workedMinutes > 0 && (
              <div className="rounded-full border border-emerald-400/30 bg-emerald-500/15 backdrop-blur-md px-3 py-1.5 text-xs text-emerald-300 col-span-2 sm:col-span-1">
                <span>کارکرد خالص: </span>
                <strong className="font-bold">{formatMinutesToPersianReadable(todayRecord.workedMinutes)}</strong>
              </div>
            )}

            {todayRecord && todayRecord.delayMinutes > 0 && (
              <div className="rounded-full border border-rose-400/30 bg-rose-500/15 backdrop-blur-md px-3 py-1.5 text-xs text-rose-300 flex items-center justify-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>تاخیر: </span>
                <strong className="font-bold">{toPersianDigits(todayRecord.delayMinutes)} د</strong>
              </div>
            )}

            {todayRecord && todayRecord.earlyLeaveMinutes > 0 && (
              <div className="rounded-full border border-amber-400/30 bg-amber-500/15 backdrop-blur-md px-3 py-1.5 text-xs text-amber-300">
                <span>تعجیل: </span>
                <strong className="font-bold">{toPersianDigits(todayRecord.earlyLeaveMinutes)} د</strong>
              </div>
            )}

            {todayRecord && todayRecord.leaveMinutes !== undefined && todayRecord.leaveMinutes > 0 && (
              <div className="rounded-full border border-amber-400/30 bg-amber-500/15 backdrop-blur-md px-3 py-1.5 text-xs text-amber-300 flex items-center justify-center gap-1">
                <Coffee className="h-3.5 w-3.5 shrink-0" />
                <span>مرخصی: </span>
                <strong className="font-bold">{formatMinutesToPersianReadable(todayRecord.leaveMinutes)}</strong>
              </div>
            )}

            {todayRecord && (todayRecord.overtimeMinutes > 0 || todayRecord.holidayOvertimeMinutes > 0) && (
              <div className="rounded-full border border-indigo-400/30 bg-indigo-500/15 backdrop-blur-md px-3 py-1.5 text-xs text-indigo-300 flex items-center justify-center gap-1 col-span-2 sm:col-span-1">
                <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                <span>اضافه کار: </span>
                <strong className="font-bold">
                  {formatMinutesToPersianReadable(
                    todayRecord.overtimeMinutes + todayRecord.holidayOvertimeMinutes
                  )}
                </strong>
              </div>
            )}

            {todayRecord && todayRecord.deficitMinutes > 0 && (
              <div className="rounded-full border border-rose-400/30 bg-rose-500/15 backdrop-blur-md px-3 py-1.5 text-xs text-rose-300">
                <span>کسر کار: </span>
                <strong className="font-bold">{toPersianDigits(todayRecord.deficitMinutes)} د</strong>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Primary Action Buttons & Live Timer */}
        <div className="flex flex-col items-center justify-center gap-3 w-full md:w-auto">
          {/* State 1: Ready to Check In */}
          {!isCheckedIn && !isCheckedOut && (
            <div className="flex flex-col items-center gap-3 w-full md:w-72">
              <button
                onClick={handleCheckInClick}
                className="group relative flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-emerald-500/90 via-teal-500/90 to-cyan-500/90 px-6 py-4 text-base font-bold text-white shadow-xl shadow-emerald-500/30 border border-white/40 backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.96]"
              >
                <LogIn className="h-6 w-6 transition-transform group-hover:-translate-x-1" />
                <span>ثبت ورود امروز</span>
              </button>

              {/* Custom In Time Toggle */}
              <div className="w-full text-center">
                {!showCustomTime ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomTime(true);
                      setCustomInTime(getCurrentTimeString(false));
                    }}
                    className="text-xs text-slate-200 hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto font-medium"
                  >
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    <span>ثبت با ساعتی به جز زمان اکنون</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 rounded-2xl liquid-glass-subtle p-2 border border-white/20 text-xs">
                    <span className="text-slate-200 font-medium">ساعت ورود:</span>
                    <input
                      type="time"
                      value={customInTime}
                      onChange={(e) => setCustomInTime(e.target.value)}
                      className="rounded-xl liquid-input px-2.5 py-1 font-mono text-white text-xs border border-white/25 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomTime(false)}
                      className="text-slate-300 hover:text-white px-1.5 font-medium"
                    >
                      لغو
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* State 2: Currently Checked In (Live Working Timer & Progress) */}
          {isCheckedIn && (
            <div className="flex flex-col items-center gap-3 w-full md:w-80">
              {/* Working Stopwatch Box */}
              <div
                className={`w-full rounded-[24px] border p-4 text-center transition-all liquid-glass-subtle ${
                  isOvertimeLive
                    ? 'border-indigo-400/40 bg-indigo-950/40 shadow-lg shadow-indigo-500/20'
                    : 'border-emerald-400/40 bg-emerald-950/30 shadow-lg shadow-emerald-500/20'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span
                    className={`flex items-center gap-1.5 ${
                      isOvertimeLive ? 'text-indigo-300 font-bold' : 'text-emerald-300 font-bold'
                    }`}
                  >
                    <Timer className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                    {isOvertimeLive ? 'زمان اضافه کاری زنده' : 'مدت حضور زنده'}
                  </span>
                  <span className="font-mono text-xs text-slate-200 font-semibold">
                    {toPersianDigits(shiftProgressPercent)}٪ شیفت
                  </span>
                </div>

                <div
                  className={`font-mono text-3xl sm:text-4xl font-black tracking-wider dir-ltr text-center py-0.5 ${
                    isOvertimeLive ? 'text-indigo-200' : 'text-emerald-200'
                  }`}
                >
                  {formatElapsed(elapsedSeconds)}
                </div>

                {/* Live Progress Bar */}
                <div className="mt-2.5 h-2 w-full rounded-full bg-white/15 overflow-hidden p-0.5 border border-white/15">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 shadow-sm ${
                      isOvertimeLive
                        ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400'
                        : 'bg-gradient-to-r from-teal-400 to-emerald-400'
                    }`}
                    style={{ width: `${shiftProgressPercent}%` }}
                  />
                </div>

                {/* Overtime or Remaining Time Notice */}
                <div className="mt-2 text-xs text-slate-100 font-medium">
                  {isOvertimeLive ? (
                    <span className="text-indigo-300 font-bold flex items-center justify-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                      موظفی کامل شد! اضافه کار: +{formatElapsed(overtimeLiveSecs)}
                    </span>
                  ) : (
                    <span>
                      {formatElapsed(remainingLiveSecs)} تا پایان حضور موظفی
                    </span>
                  )}
                </div>
              </div>

              {/* Break / Lunch Selector */}
              <div className="w-full rounded-[22px] liquid-glass-subtle p-3 border border-white/20 space-y-2">
                <div className="flex items-center justify-between text-xs text-white">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Coffee className="h-3.5 w-3.5 text-amber-400" />
                    استراحت و ناهار:
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="180"
                      value={breakMinutesInput}
                      onChange={(e) => setBreakMinutesInput(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-14 rounded-xl liquid-input px-2 py-0.5 text-center font-mono text-white text-xs border border-white/25 focus:outline-none focus:border-cyan-400 font-bold"
                    />
                    <span className="text-slate-200 font-medium">دقیقه</span>
                  </div>
                </div>

                {/* Quick Preset Buttons for Lunch */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 15, 30, 45].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBreakMinutesInput(preset)}
                      className={`rounded-xl py-1 text-xs transition-all ${
                        breakMinutesInput === preset
                          ? 'bg-amber-400/25 text-amber-200 border border-amber-400/40 font-bold shadow-sm'
                          : 'bg-white/[0.08] text-slate-200 hover:text-white border border-white/15 font-medium'
                      }`}
                    >
                      {preset === 0 ? 'بدون ناهار' : `${toPersianDigits(preset)} د`}
                      {preset === 30 && ' (پیش‌فرض)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Check Out Button */}
              <button
                onClick={handleCheckOutClick}
                className="group relative flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-rose-500/90 via-pink-600/90 to-amber-600/90 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-rose-500/30 border border-white/40 backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.96]"
              >
                <LogOut className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                <span>ثبت پایان کار و خروج</span>
              </button>
            </div>
          )}

          {/* State 3: Already Completed Today */}
          {isCheckedOut && (
            <div className="flex flex-col items-center gap-3 w-full md:w-64">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span>شیفت امروز ثبت و نهایی شد</span>
              </div>

              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={onOpenEdit}
                  className="liquid-pill-btn flex-1 px-4 py-2 text-xs font-semibold"
                >
                  ویرایش اطلاعات
                </button>
                <button
                  onClick={onResetToday}
                  className="liquid-pill-btn-danger px-3.5 py-2 text-xs"
                  title="بازنشانی ثبت امروز"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </LiquidGlassCard>
  );
};

