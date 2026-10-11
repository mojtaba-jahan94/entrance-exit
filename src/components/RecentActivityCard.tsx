import React from 'react';
import {
  Clock,
  CheckCircle2,
  Coffee,
  ChevronLeft,
} from 'lucide-react';
import { AttendanceRecord } from '../types';
import {
  toPersianDigits,
  getJalaliWeekdayName,
  formatMinutesToTimeString,
} from '../utils/jalali';
import { LiquidGlassCard } from './LiquidGlassCard';

interface RecentActivityCardProps {
  records: AttendanceRecord[];
  onNavigateToTimesheet: () => void;
  onEditRecord: (record: AttendanceRecord) => void;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  records,
  onNavigateToTimesheet,
  onEditRecord,
}) => {
  // Sort descending by date and take the top 5
  const recentRecords = [...records]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <LiquidGlassCard
      className="rounded-[28px] sm:rounded-[32px] p-4 sm:p-5 shadow-xl"
      sheenColor="rgba(99, 102, 241, 0.14)"
    >
      <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-2xl bg-indigo-500/20 p-2.5 text-indigo-300 border border-indigo-400/30 shadow-inner">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white/95">آخرین وضعیت ترددهای ثبت‌شده</h3>
            <p className="text-[10px] sm:text-xs text-white/60">مرور سریع روزهای کاری اخیر</p>
          </div>
        </div>

        <button
          onClick={onNavigateToTimesheet}
          className="liquid-pill-btn px-3 py-1.5 text-xs text-indigo-200 hover:text-white group"
        >
          <span>مشاهده کل ترددها</span>
          <ChevronLeft className="h-3.5 w-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="divide-y divide-white/[0.08]">
        {recentRecords.length === 0 ? (
          <div className="py-8 text-center text-xs text-white/40">
            هنوز رکوردی برای نمایش وجود ندارد.
          </div>
        ) : (
          recentRecords.map((r) => {
            const weekday = getJalaliWeekdayName(r.date);
            return (
              <div
                key={r.id || r.date}
                onClick={() => onEditRecord(r)}
                className="py-2.5 sm:py-3 flex items-center justify-between gap-2 hover:bg-white/[0.06] px-2.5 rounded-2xl transition-all cursor-pointer group"
              >
                {/* Date & Weekday */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs sm:text-sm font-bold text-white/95 group-hover:text-indigo-300 transition-colors">
                      {toPersianDigits(r.date)}
                    </span>
                    <span className="text-[10px] text-white/60">{weekday}</span>
                  </div>
                </div>

                {/* Times (Check In / Check Out) */}
                <div className="flex items-center gap-2 font-mono text-xs">
                  <div className="bg-white/[0.05] border border-white/15 px-2.5 py-1 rounded-xl text-emerald-300 text-center shadow-inner">
                    <span className="text-[9px] text-white/50 block">ورود</span>
                    <span>{r.checkIn ? toPersianDigits(r.checkIn) : '--:--'}</span>
                  </div>
                  <span className="text-white/30">-</span>
                  <div className="bg-white/[0.05] border border-white/15 px-2.5 py-1 rounded-xl text-rose-300 text-center shadow-inner">
                    <span className="text-[9px] text-white/50 block">خروج</span>
                    <span>{r.checkOut ? toPersianDigits(r.checkOut) : '--:--'}</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {r.status === 'present' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-400/30">
                      <CheckCircle2 className="h-3 w-3" />
                      <span className="hidden xs:inline">حاضر</span>
                    </span>
                  )}
                  {r.status === 'leave' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-400/30">
                      <Coffee className="h-3 w-3" />
                      مرخصی
                    </span>
                  )}
                  {r.delayMinutes > 0 && (
                    <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300 border border-rose-400/30">
                      تاخیر: {toPersianDigits(r.delayMinutes)}د
                    </span>
                  )}
                  {r.leaveMinutes !== undefined && r.leaveMinutes > 0 && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-400/30">
                      مرخصی: {r.leaveMinutes >= 60 ? toPersianDigits(formatMinutesToTimeString(r.leaveMinutes)) : `${toPersianDigits(r.leaveMinutes)}د`}
                    </span>
                  )}
                  {r.overtimeMinutes > 0 && (
                    <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-400/30">
                      + اضافه کار
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </LiquidGlassCard>
  );
};
