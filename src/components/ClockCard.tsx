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
  const [breakMinutesInput, setBreakMinutesInput] = useState<number>(30);

  const isCheckedIn = Boolean(todayRecord && todayRecord.checkIn && !todayRecord.checkOut);
  const isCheckedOut = Boolean(todayRecord && todayRecord.checkIn && todayRecord.checkOut);

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

  const handleCheckInClick = () => {
    const curTime = getCurrentTimeString(false);
    onCheckIn(curTime);
  };

  const handleCheckOutClick = () => {
    const curTime = getCurrentTimeString(false);
    onCheckOut(curTime, breakMinutesInput);

    // Fire micro celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 shadow-2xl backdrop-blur-xl">
      {/* Background soft ambient glows */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Side: Status & Timer Information */}
        <div className="w-full md:w-auto flex-1 space-y-3 text-center md:text-right">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-3.5 py-1 text-xs font-medium text-slate-300 border border-slate-700/60">
            <Clock className="h-3.5 w-3.5 text-indigo-400" />
            <span>شیفت موظفی: {toPersianDigits(config.startTime)} الی {toPersianDigits(config.endTime)}</span>
            <span className="text-slate-500">|</span>
            <span>فرجه مجاز: {toPersianDigits(config.graceMinutes)} دقیقه</span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center md:justify-start gap-2.5">
              <span>میز کار امروز شما</span>
              {todayRecord?.isHoliday && (
                <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  {todayRecord.holidayTitle || 'تعطیل'}
                </span>
              )}
            </h2>

            {/* Subtext description based on state */}
            {!isCheckedIn && !isCheckedOut && (
              <p className="mt-1 text-sm text-slate-400">
                هنوز ورود امروز را ثبت نکرده‌اید. با کلیک روی دکمه زیر، ورود خود را در ساعت جاری ثبت کنید.
              </p>
            )}

            {isCheckedIn && (
              <p className="mt-1 text-sm text-emerald-400 flex items-center justify-center md:justify-start gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>در حال کار — ورود در ساعت <strong className="font-mono text-white text-base">{toPersianDigits(todayRecord?.checkIn || '')}</strong> ثبت شده است.</span>
              </p>
            )}

            {isCheckedOut && (
              <p className="mt-1 text-sm text-cyan-300 flex items-center justify-center md:justify-start gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>شیفت کاری امروز با موفقیت به پایان رسید. خسته نباشید!</span>
              </p>
            )}
          </div>

          {/* Today Metrics Badges */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-1">
            {todayRecord?.checkIn && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300">
                <span className="text-slate-400">ورود: </span>
                <span className="font-mono font-bold text-white">{toPersianDigits(todayRecord.checkIn)}</span>
              </div>
            )}

            {todayRecord?.checkOut && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300">
                <span className="text-slate-400">خروج: </span>
                <span className="font-mono font-bold text-white">{toPersianDigits(todayRecord.checkOut)}</span>
              </div>
            )}

            {todayRecord && todayRecord.workedMinutes > 0 && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
                <span>کارکرد مفید: </span>
                <strong className="font-bold">{formatMinutesToPersianReadable(todayRecord.workedMinutes)}</strong>
              </div>
            )}

            {todayRecord && todayRecord.delayMinutes > 0 && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>تاخیر: </span>
                <strong className="font-bold">{toPersianDigits(todayRecord.delayMinutes)} دقیقه</strong>
              </div>
            )}

            {todayRecord && todayRecord.overtimeMinutes > 0 && (
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300">
                <span>اضافه کار: </span>
                <strong className="font-bold">{formatMinutesToPersianReadable(todayRecord.overtimeMinutes)}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Primary Action Buttons & Live Timer */}
        <div className="flex flex-col items-center justify-center gap-3 w-full md:w-auto">
          {/* State 1: Ready to Check In */}
          {!isCheckedIn && !isCheckedOut && (
            <button
              onClick={handleCheckInClick}
              className="group relative flex w-full md:w-64 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-base font-bold text-white shadow-xl shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.03] hover:shadow-emerald-500/40 active:scale-[0.98]"
            >
              <LogIn className="h-6 w-6 transition-transform group-hover:-translate-x-1" />
              <span>ثبت ورود امروز</span>
            </button>
          )}

          {/* State 2: Currently Checked In (Live Working Timer) */}
          {isCheckedIn && (
            <div className="flex flex-col items-center gap-3 w-full md:w-72">
              {/* Working Stopwatch Box */}
              <div className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 text-center shadow-inner">
                <span className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5 mb-1">
                  <Timer className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                  زمان کارکرد زنده
                </span>
                <div className="font-mono text-3xl font-black tracking-wider text-emerald-200 dir-ltr text-center">
                  {formatElapsed(elapsedSeconds)}
                </div>
              </div>

              {/* Break input */}
              <div className="flex items-center justify-between w-full px-2 text-xs text-slate-300 bg-slate-900/60 rounded-xl py-1.5 border border-slate-800">
                <span className="flex items-center gap-1">
                  <Coffee className="h-3.5 w-3.5 text-amber-400" />
                  مدت استراحت/ناهار:
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
                  <span>دقیقه</span>
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
