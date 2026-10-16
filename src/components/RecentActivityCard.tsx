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
      sheenColor="rgba(166, 138, 100, 0.12)"
    >
      <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-2xl bg-surface-2 p-2.5 text-accent border border-border shadow-inner">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-text">آخرین وضعیت ترددهای ثبت‌شده</h3>
            <p className="text-[10px] sm:text-xs text-muted">مرور سریع روزهای کاری اخیر</p>
          </div>
        </div>

        <button
          onClick={onNavigateToTimesheet}
          className="liquid-pill-btn px-3 py-1.5 text-xs text-accent group"
        >
          <span>مشاهده کل ترددها</span>
          <ChevronLeft className="h-3.5 w-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="divide-y divide-border">
        {recentRecords.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted">
            هنوز رکوردی برای نمایش وجود ندارد.
          </div>
        ) : (
          recentRecords.map((r) => {
            const weekday = getJalaliWeekdayName(r.date);
            return (
              <div
                key={r.id || r.date}
                onClick={() => onEditRecord(r)}
                className="py-2.5 sm:py-3 flex items-center justify-between gap-2 hover:bg-surface-2 px-2.5 rounded-2xl transition-all cursor-pointer group"
              >
                {/* Date & Weekday */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs sm:text-sm font-bold text-text group-hover:text-accent transition-colors">
                      {toPersianDigits(r.date)}
                    </span>
                    <span className="text-[10px] text-muted">{weekday}</span>
                  </div>
                </div>

                {/* Times (Check In / Check Out) */}
                <div className="flex items-center gap-2 font-mono text-xs">
                  <div className="bg-surface-2 border border-border px-2.5 py-1 rounded-xl text-semantic-success text-center shadow-inner">
                    <span className="text-[9px] text-muted block">ورود</span>
                    <span>{r.checkIn ? toPersianDigits(r.checkIn) : '--:--'}</span>
                  </div>
                  <span className="text-muted">-</span>
                  <div className="bg-surface-2 border border-border px-2.5 py-1 rounded-xl text-semantic-danger text-center shadow-inner">
                    <span className="text-[9px] text-muted block">خروج</span>
                    <span>{r.checkOut ? toPersianDigits(r.checkOut) : '--:--'}</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {r.status === 'present' && (
                    <span className="inline-flex items-center gap-1 rounded-full badge-success px-2.5 py-0.5 text-[10px] font-semibold">
                      <CheckCircle2 className="h-3 w-3" />
                      <span className="hidden xs:inline">حاضر</span>
                    </span>
                  )}
                  {r.status === 'leave' && (
                    <span className="inline-flex items-center gap-1 rounded-full badge-warning px-2.5 py-0.5 text-[10px] font-semibold">
                      <Coffee className="h-3 w-3" />
                      مرخصی
                    </span>
                  )}
                  {r.delayMinutes > 0 && (
                    <span className="rounded-full badge-danger px-2 py-0.5 text-[10px] font-semibold">
                      تاخیر: {toPersianDigits(r.delayMinutes)}د
                    </span>
                  )}
                  {r.leaveMinutes !== undefined && r.leaveMinutes > 0 && (
                    <span className="rounded-full badge-warning px-2 py-0.5 text-[10px] font-semibold">
                      مرخصی: {r.leaveMinutes >= 60 ? toPersianDigits(formatMinutesToTimeString(r.leaveMinutes)) : `${toPersianDigits(r.leaveMinutes)}د`}
                    </span>
                  )}
                  {r.overtimeMinutes > 0 && (
                    <span className="rounded-full badge-info px-2 py-0.5 text-[10px] font-semibold">
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
