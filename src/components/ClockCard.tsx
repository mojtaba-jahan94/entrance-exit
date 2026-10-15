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
  TrendingUp,
  Hourglass,
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
  enableEffects?: boolean;
}

export const ClockCard: React.FC<ClockCardProps> = ({
  todayRecord,
  config,
  onCheckIn,
  onCheckOut,
  onResetToday,
  onOpenEdit,
  enableEffects = true,
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
      if (enableEffects) {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
        });
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-[#D1D5DB] bg-white p-5 sm:p-7 shadow-sm transition-all">
      {/* Subtle Scandinavian corner accents */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#F5F0E6] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#F5F0E6] blur-2xl" />

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Side: Status & Policy Information */}
        <div className="w-full md:w-auto flex-1 space-y-3 text-center md:text-right">
          {/* Shift Policy Badge */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F0E6] px-3 py-1 text-[11px] sm:text-xs font-medium text-[#1F2933] border border-[#D1D5DB]">
              <Clock className="h-3.5 w-3.5 text-[#A68A64] shrink-0" />
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

            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F7F7F2] px-3 py-1 text-[11px] sm:text-xs font-medium text-[#6B7280] border border-[#D1D5DB]">
              <Coffee className="h-3 w-3 text-[#A68A64] shrink-0" />
              <span>
                {isThursday
                  ? 'موظفی ۴ ساعت'
                  : `موظفی ۸.۵ ساعت (با کسر ${toPersianDigits(config.defaultBreakMinutes || 30)} د ناهار)`}
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#1F2933] flex items-center justify-center md:justify-start gap-2">
              <span>میز کار و ثبت حضور امروز</span>
              {todayRecord?.isHoliday && (
                <span className="text-[11px] sm:text-xs font-normal px-2.5 py-0.5 rounded-full bg-rose-50 text-[#B91C1C] border border-rose-200">
                  {todayRecord.holidayTitle || 'تعطیل'}
                </span>
              )}
            </h2>

            {/* Subtext description based on state */}
            {!isCheckedIn && !isCheckedOut && (
              <p className="mt-1 text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                هنوز ورود امروز را ثبت نکرده‌اید. ساعت مجاز ورود شما از <strong>{toPersianDigits(config.flexStartTimeMin || '08:30')}</strong> تا <strong>{toPersianDigits(config.flexStartTimeMax || '09:30')}</strong> بدون تاخیر محاسبه می‌شود.
              </p>
            )}

            {isCheckedIn && (
              <div className="mt-1 space-y-1">
                <p className="text-xs sm:text-sm text-[#2E6F40] flex items-center justify-center md:justify-start gap-1.5 font-medium">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E6F40] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2E6F40]"></span>
                  </span>
                  <span>
                    در حال کار — ورود در ساعت <strong className="font-mono text-[#1F2933] text-sm sm:text-base font-bold">{toPersianDigits(todayRecord?.checkIn || '')}</strong> ثبت گردیده است.
                  </span>
                </p>

                {/* Target Departure notification */}
                {targetDepartureTime && (
                  <p className="text-[11px] sm:text-xs text-[#6B7280] flex items-center justify-center md:justify-start gap-1 flex-wrap">
                    <Hourglass className="h-3.5 w-3.5 text-[#A68A64] shrink-0" />
                    <span>ساعت تکمیل موظفی امروز: </span>
                    <strong className="font-mono text-[#1F2933] font-bold text-xs sm:text-sm">
                      {toPersianDigits(targetDepartureTime)}
                    </strong>
                    <span className="text-[#6B7280]">
                      ({isThursday ? `${toPersianDigits(formatMinutesToTimeString(requiredPresenceMins))} ساعت حضور` : '۸.۵ ساعت با کسر نیم ساعت ناهار'})
                    </span>
                  </p>
                )}
              </div>
            )}

            {isCheckedOut && (
              <p className="mt-1 text-xs sm:text-sm text-[#2E6F40] flex items-center justify-center md:justify-start gap-1.5 font-medium">
                <CheckCircle className="h-4 w-4 text-[#2E6F40] shrink-0" />
                <span>شیفت کاری امروز با موفقیت به پایان رسید و محاسبه شد. خسته نباشید!</span>
              </p>
            )}
          </div>

          {/* Today Metrics Badges */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-center sm:text-right">
            {todayRecord?.checkIn && (
              <div className="rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-3 py-1.5 text-xs text-[#6B7280]">
                <span>ورود: </span>
                <span className="font-mono font-bold text-[#1F2933]">{toPersianDigits(todayRecord.checkIn)}</span>
              </div>
            )}

            {todayRecord?.checkOut && (
              <div className="rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-3 py-1.5 text-xs text-[#6B7280]">
                <span>خروج: </span>
                <span className="font-mono font-bold text-[#1F2933]">{toPersianDigits(todayRecord.checkOut)}</span>
              </div>
            )}

            {todayRecord && todayRecord.workedMinutes > 0 && (
              <div className="rounded-xl border border-[#2E6F40]/25 bg-[#2E6F40]/10 px-3 py-1.5 text-xs text-[#2E6F40] col-span-2 sm:col-span-1">
                <span>کارکرد خالص: </span>
                <strong className="font-bold">{formatMinutesToPersianReadable(todayRecord.workedMinutes)}</strong>
              </div>
            )}

            {todayRecord && todayRecord.delayMinutes > 0 && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-[#B91C1C] flex items-center justify-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>تاخیر: </span>
                <strong className="font-bold">{toPersianDigits(todayRecord.delayMinutes)} د</strong>
              </div>
            )}

            {todayRecord && todayRecord.earlyLeaveMinutes > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-[#D97706]">
                <span>تعجیل: </span>
                <strong className="font-bold">{toPersianDigits(todayRecord.earlyLeaveMinutes)} د</strong>
              </div>
            )}

            {todayRecord && todayRecord.leaveMinutes !== undefined && todayRecord.leaveMinutes > 0 && (
              <div className="rounded-xl border border-[#A68A64]/30 bg-[#F5F0E6] px-3 py-1.5 text-xs text-[#A68A64] flex items-center justify-center gap-1">
                <Coffee className="h-3.5 w-3.5 shrink-0" />
                <span>مرخصی: </span>
                <strong className="font-bold">{formatMinutesToPersianReadable(todayRecord.leaveMinutes)}</strong>
              </div>
            )}

            {todayRecord && (todayRecord.overtimeMinutes > 0 || todayRecord.holidayOvertimeMinutes > 0) && (
              <div className="rounded-xl border border-[#A68A64]/30 bg-[#F5F0E6] px-3 py-1.5 text-xs text-[#A68A64] flex items-center justify-center gap-1 col-span-2 sm:col-span-1">
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
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-[#B91C1C]">
                <span>کسر کار: </span>
                <strong className="font-bold">{toPersianDigits(todayRecord.deficitMinutes)} د</strong>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Primary Action Buttons & Scandinavian Timepiece */}
        <div className="flex flex-col items-center justify-center gap-3 w-full md:w-auto">
          {/* State 1: Ready to Check In */}
          {!isCheckedIn && !isCheckedOut && (
            <div className="flex flex-col items-center gap-2.5 w-full md:w-72">
              <button
                onClick={handleCheckInClick}
                className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-[#2E6F40] hover:bg-[#255833] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#2E6F40]/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <LogIn className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
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
                    className="text-[11px] text-[#6B7280] hover:text-[#A68A64] transition-colors flex items-center justify-center gap-1 mx-auto"
                  >
                    <Clock className="h-3 w-3" />
                    <span>ثبت با ساعتی به جز زمان اکنون</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-[#F7F7F2] p-2 border border-[#D1D5DB] text-xs">
                    <span className="text-[#6B7280]">ساعت ورود:</span>
                    <input
                      type="time"
                      value={customInTime}
                      onChange={(e) => setCustomInTime(e.target.value)}
                      className="rounded-lg bg-white px-2 py-1 font-mono text-[#1F2933] text-xs border border-[#D1D5DB] text-center focus:outline-none focus:border-[#A68A64]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomTime(false)}
                      className="text-[#6B7280] hover:text-[#1F2933] px-1"
                    >
                      لغو
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* State 2: Currently Checked In (Live Timepiece & Progress) */}
          {isCheckedIn && (
            <div className="flex flex-col items-center gap-3 w-full md:w-80">
              {/* Scandinavian Timepiece Container */}
              <div
                className={`w-full rounded-2xl border p-4 text-center transition-all ${
                  isOvertimeLive
                    ? 'border-[#A68A64]/40 bg-[#F5F0E6]'
                    : 'border-[#D1D5DB] bg-[#F7F7F2]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span
                    className={`flex items-center gap-1.5 ${
                      isOvertimeLive ? 'text-[#A68A64]' : 'text-[#2E6F40]'
                    }`}
                  >
                    <Timer className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                    {isOvertimeLive ? 'زمان اضافه کاری زنده' : 'مدت حضور زنده'}
                  </span>
                  <span className="font-mono text-[11px] text-[#6B7280]">
                    {toPersianDigits(shiftProgressPercent)}٪ موظفی
                  </span>
                </div>

                {/* Big Bold Timepiece Display */}
                <div
                  className={`font-mono text-3xl sm:text-4xl font-black tracking-wider dir-ltr text-center tabular-nums ${
                    isOvertimeLive ? 'text-[#A68A64]' : 'text-[#1F2933]'
                  }`}
                >
                  {formatElapsed(elapsedSeconds)}
                </div>

                {/* Progress Bar with Warm Wood */}
                <div className="mt-2.5 h-2 w-full rounded-full bg-[#E5E7EB] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      isOvertimeLive ? 'bg-[#A68A64]' : 'bg-[#2E6F40]'
                    }`}
                    style={{ width: `${shiftProgressPercent}%` }}
                  />
                </div>

                {/* Notice text */}
                <div className="mt-2 text-[11px] text-[#6B7280]">
                  {isOvertimeLive ? (
                    <span className="text-[#A68A64] font-semibold flex items-center justify-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      موظفی کامل شد! اضافه کار: +{formatElapsed(overtimeLiveSecs)}
                    </span>
                  ) : (
                    <span>
                      {formatElapsed(remainingLiveSecs)} تا پایان حضور موظفی امروز
                    </span>
                  )}
                </div>
              </div>

              {/* Break / Lunch Selector */}
              <div className="w-full rounded-2xl bg-[#F7F7F2] p-2.5 border border-[#D1D5DB] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#1F2933]">
                  <span className="flex items-center gap-1.5 font-medium text-[#6B7280]">
                    <Coffee className="h-3.5 w-3.5 text-[#A68A64]" />
                    استراحت و ناهار:
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="180"
                      value={breakMinutesInput}
                      onChange={(e) => setBreakMinutesInput(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-14 rounded-lg bg-white px-2 py-0.5 text-center font-mono text-[#1F2933] text-xs border border-[#D1D5DB] focus:outline-none focus:border-[#A68A64]"
                    />
                    <span className="text-[#6B7280]">دقیقه</span>
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                <div className="grid grid-cols-4 gap-1">
                  {[0, 15, 30, 45].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBreakMinutesInput(preset)}
                      className={`rounded-lg py-1 text-[10px] font-medium transition-colors ${
                        breakMinutesInput === preset
                          ? 'bg-[#A68A64] text-white font-bold'
                          : 'bg-white text-[#6B7280] hover:text-[#1F2933] border border-[#D1D5DB]'
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
                className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-[#B91C1C] hover:bg-[#991B1B] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#B91C1C]/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <LogOut className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                <span>ثبت پایان کار و خروج</span>
              </button>
            </div>
          )}

          {/* State 3: Already Completed Today */}
          {isCheckedOut && (
            <div className="flex flex-col items-center gap-2.5 w-full md:w-64">
              <div className="flex items-center gap-2 text-[#2E6F40] font-bold text-sm bg-[#2E6F40]/10 px-4 py-2 rounded-2xl border border-[#2E6F40]/20">
                <CheckCircle className="h-5 w-5 text-[#2E6F40]" />
                <span>شیفت امروز ثبت و نهایی شد</span>
              </div>

              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={onOpenEdit}
                  className="flex-1 rounded-xl border border-[#D1D5DB] bg-white hover:bg-[#F5F0E6] px-3 py-2 text-xs font-semibold text-[#1F2933] transition-all text-center shadow-sm"
                >
                  ویرایش اطلاعات
                </button>
                <button
                  onClick={onResetToday}
                  className="rounded-xl border border-[#D1D5DB] bg-white hover:bg-rose-50 hover:text-[#B91C1C] px-3 py-2 text-xs font-medium text-[#6B7280] transition-all shadow-sm"
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

export default ClockCard;
