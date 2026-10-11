import React from 'react';
import {
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Coffee,
  Calendar,
  ChevronLeft,
  Activity,
  Terminal,
  Edit2,
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
    .slice(0, 6);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#09090d] overflow-hidden transition-all duration-300 hover:border-white/20">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between p-5 sm:p-6 border-b border-white/10 bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-[#eca8d6]">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#eca8d6] uppercase tracking-wider">
                03 // REAL-TIME AUDIT TRAIL
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#eca8d6] animate-pulse" />
            </div>
            <h3 className="text-sm font-semibold text-white mt-0.5">
              فید آخرین ترددهای ثبت‌شده در سامانه
            </h3>
          </div>
        </div>

        <button
          onClick={onNavigateToTimesheet}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-white/60 hover:text-white px-3 py-1.5 rounded-full border border-white/10 hover:border-white/25 transition-all"
        >
          <span>مشاهده کارنامه کامل ماه</span>
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Audit List */}
      {recentRecords.length === 0 ? (
        <div className="p-12 text-center text-white/40 font-mono text-xs">
          هیچ ثبتی در پایگاه داده یافت نشد.
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {recentRecords.map((rec) => {
            const weekday = getJalaliWeekdayName(rec.date);
            const isCompleted = Boolean(rec.checkIn && rec.checkOut);
            const isInProgress = Boolean(rec.checkIn && !rec.checkOut);
            const isLeave = rec.status === 'leave';
            const isAbsent = rec.status === 'absent';
            const hasOvertime = rec.overtimeMinutes > 0 || rec.holidayOvertimeMinutes > 0;
            const hasDeficit = rec.deficitMinutes > 0;

            return (
              <div
                key={rec.id || rec.date}
                className="flex flex-wrap items-center justify-between p-4 sm:px-6 hover:bg-white/[0.02] transition-colors gap-3"
              >
                {/* Date & Weekday */}
                <div className="flex items-center gap-3 min-w-[140px]">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isInProgress
                        ? 'bg-[#eca8d6] animate-pulse'
                        : isCompleted
                        ? 'bg-emerald-400'
                        : isLeave
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                  />
                  <div>
                    <div className="font-mono text-xs font-semibold text-white">
                      {toPersianDigits(rec.date)}
                    </div>
                    <div className="text-[11px] text-white/40">{weekday}</div>
                  </div>
                </div>

                {/* Clock In / Out */}
                <div className="flex items-center gap-6 text-xs font-mono">
                  <div>
                    <span className="text-white/40 text-[10px] block">ورود:</span>
                    <span className="text-white font-medium">
                      {rec.checkIn ? toPersianDigits(rec.checkIn) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px] block">خروج:</span>
                    <span className="text-white font-medium">
                      {rec.checkOut ? toPersianDigits(rec.checkOut) : isInProgress ? 'حاضر' : '—'}
                    </span>
                  </div>
                </div>

                {/* Worked Time & Balance */}
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <span className="text-white/40 text-[10px] block">کارکرد مفید:</span>
                    <span className="text-white font-medium">
                      {rec.workedMinutes > 0 ? toPersianDigits(formatMinutesToTimeString(rec.workedMinutes)) : '—'}
                    </span>
                  </div>

                  {/* Status Tag */}
                  <div>
                    {hasOvertime && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#eca8d6]/10 text-[#eca8d6] border border-[#eca8d6]/30">
                        +{toPersianDigits(rec.overtimeMinutes + rec.holidayOvertimeMinutes)}د اضافه‌کار
                      </span>
                    )}
                    {hasDeficit && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        -{toPersianDigits(rec.deficitMinutes)}د کسرکار
                      </span>
                    )}
                    {!hasOvertime && !hasDeficit && isCompleted && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.04] text-white/60 border border-white/10">
                        تراز دقیق
                      </span>
                    )}
                    {isLeave && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        مرخصی
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => onEditRecord(rec)}
                  className="p-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-all"
                  title="ویرایش تردد"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
