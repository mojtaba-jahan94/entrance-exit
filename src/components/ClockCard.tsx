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
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
      {/* Background soft ambient glows */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
        {/* Left Side: Status & Timer Information */}
        <div className="w-full md:w-auto flex-1 space-y-2.5 sm:space-y-3 text-center md:text-right">
          {/* Shift Policy Badge */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 px-2.5 sm:px-3.5 py-1 text-[11px] sm:text-xs font-medium text-slate-300 border border-slate-700/60">
              <Clock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
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

            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium text-indigo-300 border border-indigo-500/20">
              <Coffee className="h-3 w-3 text-amber-400 shrink-0" />
              <span>
                {isThursday
                  ? 'موظفی ۴ ساعت'
                  : `حضور موظفی ۸.۵ ساعت (با کسر ${toPersianDigits(config.defaultBreakMinutes || 30)} د ناهار)`}
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center justify-center md:justify-start gap-2">
              <span>میز کار و تردد امروز شما</span>
              {todayRecord?.isHoliday && (
                <span className="text-[11px] sm:text-xs font-normal px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  {todayRecord.holidayTitle || 'تعطیل'}
                </span>
              )}
            </h2>

            {/* Subtext description based on state */}
            {!isCheckedIn && !isCheckedOut && (
              <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
                هنوز ورود امروز را ثبت نکرده‌اید. ساعت مجاز ورود شما از <strong>{toPersianDigits(config.flexStartTimeMin || '08:30')}</strong> تا <strong>{toPersianDigits(config.flexStartTimeMax || '09:30')}</strong> بدون تاخیر است.
              </p>
            )}

            {isCheckedIn && (
              <div className="mt-1 space-y-1">
                <p className="text-xs sm:text-sm text-emerald-400 flex items-center justify-center md:justify-start gap-1.5">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>
                    در حال کار — ورود در ساعت <strong className="font-mono text-white text-sm sm:text-base">{toPersianDigits(todayRecord?.checkIn || '')}</strong> ثبت شده است.
                  </span>
                </p>

                {/* Target Departure notification */}
                {targetDepartureTime && (
                  <p className="text-[11px] sm:text-xs text-slate-300 flex items-center justify-center md:justify-start gap-1 flex-wrap">
                    <Hourglass className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>ساعت تکمیل موظفی امروز: </span>
                    <strong className="font-mono text-cyan-300 font-bold text-xs sm:text-sm">
                      {toPersianDigits(targetDepartureTime)}
                    </strong>
                    <span className="text-slate-400">
                      ({isThursday ? `${toPersianDigits(formatMinutesToTimeString(requiredPresenceMins))} ساعت حضور` : '۸.۵ ساعت حضور با نیم ساعت ناهار'})
                    </span>
                  </p>
                )}
              </div>
            )}

            {isCheckedOut && (
              <p className="mt-1 text-xs sm:text-sm text-cyan-300 flex items-center justify-center md:justify-start gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>شیفت کاری امروز با موفقیت به پایان رسید و محاسبه شد. خسته نباشید!</span>
              </p>
            )}
          </div>

          {/* Today Metrics Badges (Grid on mobile, flex on desktop) */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-center sm:text-right">
            {todayRecord?.checkIn && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-300">
                <span className="text-slate-400">ورود: </span>
                <span className="font-mono font-bold text-white">{toPersianDigits(todayRecord.checkIn)}</span>
              </div>
            )}

            {todayRecord?.checkOut && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-300">
                <span className="text-slate-400">خروج: </span>
                <span className="font-mono font-bold text-white">{toPersianDigits(todayRecord.checkOut)}</span>
              </div>
            )}

            {todayRecord && todayRecord.workedMinutes > 0 && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-300 col-span-2 sm:col-span-1">
                <span>کارکرد خالص: </span>
                <strong className="font-bold">{formatMinutesToPersianReadable(todayRecord.workedMinutes)}</strong>
              </div>
            )}

            {todayRecord && todayRecord.delayMinutes > 0 && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-300 flex items-center justify-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>تاخیر: </span>
                <strong className="font-bold">{toPersianDigits(todayRecord.delayMinutes)} د</strong>
              </div>
            )}

            {todayRecord && todayRecord.earlyLeaveMinutes > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-300">
                <span>تعجیل: </span>
                <strong className="font-bold">{toPersianDigits(todayRecord.earlyLeaveMinutes)} د</strong>
              </div>
            )}

            {todayRecord && todayRecord.leaveMinutes !== undefined && todayRecord.leaveMinutes > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-300 flex items-center justify-center gap-1">
                <Coffee className="h-3.5 w-3.5 shrink-0" />
                <span>مرخصی: </span>
                <strong className="font-bold">{formatMinutesToPersianReadable(todayRecord.leaveMinutes)}</strong>
              </div>
            )}

            {todayRecord && (todayRecord.overtimeMinutes > 0 || todayRecord.holidayOvertimeMinutes > 0) && (
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1.5 text-xs text-indigo-300 flex items-center justify-center gap-1 col-span-2 sm:col-span-1">
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
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-300">
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
            <div className="flex flex-col items-center gap-2.5 w-full md:w-72">
              <button
                onClick={handleCheckInClick}
                className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-base font-bold text-white shadow-xl shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.03] hover:shadow-emerald-500/40 active:scale-[0.98]"
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
                    className="text-[11px] text-slate-400 hover:text-indigo-400 transition-colors flex items-center justify-center gap-1 mx-auto"
                  >
                    <Clock className="h-3 w-3" />
                    <span>ثبت با ساعتی به جز زمان اکنون</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-slate-950 p-2 border border-slate-800 text-xs">
                    <span className="text-slate-400">ساعت ورود:</span>
                    <input
                      type="time"
                      value={customInTime}
                      onChange={(e) => setCustomInTime(e.target.value)}
                      className="rounded-lg bg-slate-900 px-2 py-1 font-mono text-white text-xs border border-slate-700 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomTime(false)}
                      className="text-slate-500 hover:text-white px-1"
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
                className={`w-full rounded-2xl border p-4 text-center shadow-inner transition-all ${
                  isOvertimeLive
                    ? 'border-indigo-500/40 bg-indigo-950/40'
                    : 'border-emerald-500/30 bg-emerald-950/30'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span
                    className={`flex items-center gap-1.5 ${
                      isOvertimeLive ? 'text-indigo-300' : 'text-emerald-400'
                    }`}
                  >
                    <Timer className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                    {isOvertimeLive ? 'زمان اضافه کاری زنده' : 'مدت حضور زنده'}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {toPersianDigits(shiftProgressPercent)}٪ شیفت
                  </span>
                </div>

                <div
                  className={`font-mono text-3xl font-black tracking-wider dir-ltr text-center ${
                    isOvertimeLive ? 'text-indigo-200' : 'text-emerald-200'
                  }`}
                >
                  {formatElapsed(elapsedSeconds)}
                </div>

                {/* Live Progress Bar */}
                <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      isOvertimeLive
                        ? 'bg-gradient-to-r from-emerald-400 to-indigo-400'
                        : 'bg-gradient-to-r from-teal-400 to-emerald-400'
                    }`}
                    style={{ width: `${shiftProgressPercent}%` }}
                  />
                </div>

                {/* Overtime or Remaining Time Notice */}
                <div className="mt-2 text-[11px] text-slate-300">
                  {isOvertimeLive ? (
                    <span className="text-indigo-300 font-semibold flex items-center justify-center gap-1">
                      <Sparkles className="h-3 w-3 text-indigo-400" />
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
              <div className="w-full rounded-2xl bg-slate-950/70 p-2.5 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-medium">
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
                      className="w-14 rounded-lg bg-slate-800 px-2 py-0.5 text-center font-mono text-white text-xs border border-slate-700 focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-slate-400">دقیقه</span>
                  </div>
                </div>

                {/* Quick Preset Buttons for Lunch */}
                <div className="grid grid-cols-4 gap-1">
                  {[0, 15, 30, 45].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBreakMinutesInput(preset)}
                      className={`rounded-lg py-1 text-[10px] font-medium transition-colors ${
                        breakMinutesInput === preset
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
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
                className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-rose-500/25 transition-all duration-200 hover:scale-[1.03] hover:shadow-rose-500/40 active:scale-[0.98]"
              >
                <LogOut className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                <span>ثبت پایان کار و خروج</span>
              </button>
            </div>
          )}

          {/* State 3: Already Completed Today */}
          {isCheckedOut && (
            <div className="flex flex-col items-center gap-2.5 w-full md:w-64">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle className="h-5 w-5" />
                <span>شیفت امروز ثبت و نهایی شد</span>
              </div>

              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={onOpenEdit}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-750 px-3 py-2 text-xs font-medium text-slate-200 transition-all text-center"
                >
                  ویرایش اطلاعات
                </button>
                <button
                  onClick={onResetToday}
                  className="rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-rose-900/40 hover:text-rose-300 px-3 py-2 text-xs font-medium text-slate-400 transition-all"
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

