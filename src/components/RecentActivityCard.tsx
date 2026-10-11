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
    <div className="rounded-2xl border border-black/[0.08] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Top Header */}
      <div className="flex items-center justify-between p-5 border-b border-black/[0.06] bg-black/[0.01]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl border border-black/10 bg-black/[0.03] flex items-center justify-center text-black/70">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#111]">گزارش فعالیت و ترددهای اخیر</h3>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-black/40 font-mono tracking-wide">
              LIVE AUDIT TRAIL — مرور ۵ رکورد ثبتی اخیر
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToTimesheet}
          className="flex items-center gap-1 text-xs text-black/60 hover:text-black font-medium transition-colors"
        >
          <span>مشاهده کامل</span>
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Terminal Grid Headers */}
      <div className="hidden sm:grid grid-cols-12 px-5 py-2.5 bg-black/[0.02] border-b border-black/[0.06] text-[10px] font-mono tracking-widest text-black/40 uppercase">
        <div className="col-span-3">تاریخ و روز / DATE</div>
        <div className="col-span-4">ورود و خروج / PUNCHES</div>
        <div className="col-span-3">کارکرد مفید / DURATION</div>
        <div className="col-span-2 text-left">وضعیت / STATUS</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-black/[0.04]">
        {recentRecords.length === 0 ? (
          <div className="py-12 text-center text-xs text-black/40 font-mono">
            هیچ داده‌ای برای نمایش ثبت نشده است.
          </div>
        ) : (
          recentRecords.map((r) => {
            const weekday = getJalaliWeekdayName(r.date);
            const isCompleted = Boolean(r.checkIn && r.checkOut);
            const isCurrent = Boolean(r.checkIn && !r.checkOut);

            return (
              <div
                key={r.id || r.date}
                onClick={() => onEditRecord(r)}
                className="grid grid-cols-1 sm:grid-cols-12 px-5 py-3.5 items-center gap-2 sm:gap-0 hover:bg-black/[0.02] transition-colors cursor-pointer group"
              >
                {/* 1. Date & Weekday */}
                <div className="sm:col-span-3 flex items-center gap-2.5">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-semibold text-[#111]">
                      {toPersianDigits(r.date)}
                    </span>
                    <span className="text-[10px] text-black/40 font-sans">{weekday}</span>
                  </div>
                </div>

                {/* 2. Check In & Check Out with subtle progress */}
                <div className="sm:col-span-4 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-black/70">
                      ورود: <strong className="text-[#111]">{r.checkIn ? toPersianDigits(r.checkIn) : '--:--'}</strong>
                    </span>
                    <span className="text-black/30">|</span>
                    <span className="text-black/70">
                      خروج: <strong className="text-[#111]">{r.checkOut ? toPersianDigits(r.checkOut) : '--:--'}</strong>
                    </span>
                  </div>
                  {/* Thin Progress bar */}
                  <div className="w-36 h-1 bg-black/[0.06] rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full rounded-full ${
                        isCurrent ? 'bg-emerald-500' : 'bg-black/30'
                      }`}
                      style={{
                        width: isCompleted ? '100%' : isCurrent ? '60%' : '0%',
                      }}
                    />
                  </div>
                </div>

                {/* 3. Duration & Overtime / Delay */}
                <div className="sm:col-span-3 text-xs font-mono">
                  {r.workedMinutes > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[#111] font-medium">
                        {formatMinutesToPersianReadable(r.workedMinutes)}
                      </span>
                      {r.overtimeMinutes > 0 && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          +{toPersianDigits(r.overtimeMinutes)}د
                        </span>
                      )}
                    </div>
                  ) : r.status === 'leave' ? (
                    <span className="text-amber-700 text-xs">مرخصی استحقاقی</span>
                  ) : (
                    <span className="text-black/35 text-xs">در حال پردازش</span>
                  )}
                </div>

                {/* 4. Status Indicator */}
                <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-1.5 font-mono text-[11px]">
                  {r.status === 'present' && (
                    <span className="inline-flex items-center gap-1.5 text-black/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      حاضر
                    </span>
                  )}
                  {r.status === 'leave' && (
                    <span className="inline-flex items-center gap-1.5 text-amber-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      مرخصی
                    </span>
                  )}
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      در حال کار
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
