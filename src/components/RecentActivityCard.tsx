import React from 'react';
import {
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Coffee,
  Calendar,
  ChevronLeft,
} from 'lucide-react';
import { AttendanceRecord } from '../types';
import {
  toPersianDigits,
  getJalaliWeekdayName,
  formatMinutesToPersianReadable,
  formatMinutesToTimeString,
} from '../utils/jalali';

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
    <div className="rounded-[28px] sm:rounded-[32px] bg-[#1a0f2b]/75 border border-white/10 backdrop-blur-2xl p-4 sm:p-5 shadow-2xl transition-all">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-violet-600/20 p-2 text-violet-300 border border-violet-400/30">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white">آخرین وضعیت ترددهای ثبت‌شده</h3>
            <p className="text-[10px] sm:text-xs text-slate-300">مرور سریع روزهای کاری اخیر</p>
          </div>
        </div>

        <button
          onClick={onNavigateToTimesheet}
          className="flex items-center gap-1 text-xs text-[var(--accent-color)] hover:underline font-semibold group transition-all"
        >
          <span>مشاهده کل ترددها</span>
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="divide-y divide-white/[0.05]">
        {recentRecords.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            هنوز رکوردی برای نمایش وجود ندارد.
          </div>
        ) : (
          recentRecords.map((r) => {
            const weekday = getJalaliWeekdayName(r.date);
            return (
              <div
                key={r.id || r.date}
                onClick={() => onEditRecord(r)}
                className="py-2.5 sm:py-3 flex items-center justify-between gap-2 hover:bg-white/[0.04] px-2 rounded-xl transition-colors cursor-pointer group"
              >
                {/* Date & Weekday */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs sm:text-sm font-bold text-white group-hover:text-[var(--accent-color)] transition-colors">
                      {toPersianDigits(r.date)}
                    </span>
                    <span className="text-[10px] text-slate-400">{weekday}</span>
                  </div>
                </div>

                {/* Times (Check In / Check Out) */}
                <div className="flex items-center gap-2 font-mono text-xs">
                  <div className="glass-pill px-2.5 py-1 text-emerald-400 text-center">
                    <span className="text-[9px] text-slate-400 block">ورود</span>
                    <span>{r.checkIn ? toPersianDigits(r.checkIn) : '--:--'}</span>
                  </div>
                  <span className="text-slate-500">-</span>
                  <div className="glass-pill px-2.5 py-1 text-rose-400 text-center">
                    <span className="text-[9px] text-slate-400 block">خروج</span>
                    <span>{r.checkOut ? toPersianDigits(r.checkOut) : '--:--'}</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {r.status === 'present' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" />
                      <span className="hidden xs:inline">حاضر</span>
                    </span>
                  )}
                  {r.status === 'leave' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
                      <Coffee className="h-3 w-3" />
                      مرخصی
                    </span>
                  )}
                  {r.delayMinutes > 0 && (
                    <span className="rounded-lg bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-300 border border-rose-500/20">
                      تاخیر: {toPersianDigits(r.delayMinutes)}د
                    </span>
                  )}
                  {r.leaveMinutes !== undefined && r.leaveMinutes > 0 && (
                    <span className="rounded-lg bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-300 border border-amber-500/20">
                      مرخصی: {r.leaveMinutes >= 60 ? toPersianDigits(formatMinutesToTimeString(r.leaveMinutes)) : `${toPersianDigits(r.leaveMinutes)}د`}
                    </span>
                  )}
                  {r.overtimeMinutes > 0 && (
                    <span className="rounded-lg bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/20">
                      + اضافه کار
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
