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
    <div className="rounded-[28px] border border-[#D1D5DB] bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#D1D5DB] pb-3.5 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-[#F5F0E6] p-2 text-[#A68A64] border border-[#A68A64]/30">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#1F2933]">آخرین وضعیت ترددهای ثبت‌شده</h3>
            <p className="text-[10px] sm:text-xs text-[#6B7280]">مرور سریع روزهای کاری اخیر</p>
          </div>
        </div>

        <button
          onClick={onNavigateToTimesheet}
          className="flex items-center gap-1 text-xs text-[#A68A64] hover:text-[#8F7553] font-semibold group transition-all"
        >
          <span>مشاهده کل ترددها</span>
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="divide-y divide-[#D1D5DB]/60">
        {recentRecords.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#6B7280]">
            هنوز رکوردی برای نمایش وجود ندارد.
          </div>
        ) : (
          recentRecords.map((r) => {
            const weekday = getJalaliWeekdayName(r.date);
            return (
              <div
                key={r.id || r.date}
                onClick={() => onEditRecord(r)}
                className="py-2.5 sm:py-3 flex items-center justify-between gap-2 hover:bg-[#F5F0E6]/50 px-2 rounded-xl transition-colors cursor-pointer group"
              >
                {/* Date & Weekday */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs sm:text-sm font-bold text-[#1F2933] group-hover:text-[#A68A64] transition-colors tabular-nums">
                      {toPersianDigits(r.date)}
                    </span>
                    <span className="text-[10px] text-[#6B7280]">{weekday}</span>
                  </div>
                </div>

                {/* Times (Check In / Check Out) */}
                <div className="flex items-center gap-2 font-mono text-xs">
                  <div className="bg-[#F7F7F2] border border-[#D1D5DB] px-2.5 py-1 rounded-lg text-[#2E6F40] text-center font-bold">
                    <span className="text-[9px] text-[#6B7280] block font-normal">ورود</span>
                    <span>{r.checkIn ? toPersianDigits(r.checkIn) : '--:--'}</span>
                  </div>
                  <span className="text-[#D1D5DB] font-bold">-</span>
                  <div className="bg-[#F7F7F2] border border-[#D1D5DB] px-2.5 py-1 rounded-lg text-[#B91C1C] text-center font-bold">
                    <span className="text-[9px] text-[#6B7280] block font-normal">خروج</span>
                    <span>{r.checkOut ? toPersianDigits(r.checkOut) : '--:--'}</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {r.status === 'present' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-[#2E6F40] border border-[#2E6F40]/30">
                      <CheckCircle2 className="h-3 w-3" />
                      <span className="hidden xs:inline">حاضر</span>
                    </span>
                  )}
                  {r.status === 'leave' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E6] px-2.5 py-0.5 text-[10px] font-semibold text-[#A68A64] border border-[#A68A64]/30">
                      <Coffee className="h-3 w-3" />
                      مرخصی
                    </span>
                  )}
                  {r.delayMinutes > 0 && (
                    <span className="rounded-lg bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-[#B91C1C] border border-rose-200">
                      تاخیر: {toPersianDigits(r.delayMinutes)}د
                    </span>
                  )}
                  {r.leaveMinutes !== undefined && r.leaveMinutes > 0 && (
                    <span className="rounded-lg bg-[#F5F0E6] px-2 py-0.5 text-[10px] font-medium text-[#A68A64] border border-[#A68A64]/30">
                      مرخصی: {r.leaveMinutes >= 60 ? toPersianDigits(formatMinutesToTimeString(r.leaveMinutes)) : `${toPersianDigits(r.leaveMinutes)}د`}
                    </span>
                  )}
                  {r.overtimeMinutes > 0 && (
                    <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-[#2E6F40] border border-[#2E6F40]/30">
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

export default RecentActivityCard;
