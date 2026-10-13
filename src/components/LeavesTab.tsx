import React, { useState } from 'react';
import {
  Coffee,
  Plus,
  Trash2,
  Edit2,
  Calendar,
} from 'lucide-react';
import { LeaveRecord } from '../types';
import {
  toPersianDigits,
  formatMinutesToPersianReadable,
  formatMinutesToTimeString,
  getJalaliWeekdayName,
} from '../utils/jalali';
import { getLeaveDurationMinutes } from '../utils/calculator';
import { LiquidGlassCard } from './LiquidGlassCard';

interface LeavesTabProps {
  leaves: LeaveRecord[];
  onOpenAddModal: () => void;
  onEditLeave: (leave: LeaveRecord) => void;
  onDeleteLeave: (id: string) => void;
  monthlyQuotaHours: number;
  monthlyQuotaDays?: number;
  selectedMonthName: string;
}

export const LeavesTab: React.FC<LeavesTabProps> = ({
  leaves,
  onOpenAddModal,
  onEditLeave,
  onDeleteLeave,
  monthlyQuotaHours,
  monthlyQuotaDays = 2.5,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const approvedLeaves = leaves.filter((l) => l.approved !== false);
  const totalUsedMinutes = approvedLeaves.reduce(
    (sum, l) => sum + getLeaveDurationMinutes(l, 480),
    0
  );
  const quotaTotalMinutes = monthlyQuotaHours * 60;
  const remainingMinutes = Math.max(0, quotaTotalMinutes - totalUsedMinutes);

  const standardDayMinutes = 8 * 60;
  const usedDays = (totalUsedMinutes / standardDayMinutes).toFixed(1);
  const remainingDays = (remainingMinutes / standardDayMinutes).toFixed(1);
  const usedPercent = Math.min(100, Math.round((totalUsedMinutes / quotaTotalMinutes) * 100));

  const filteredLeaves = leaves.filter((l) => {
    if (filterType === 'all') return true;
    return l.type === filterType;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header Banner & Action */}
      <LiquidGlassCard
        className="rounded-[28px] sm:rounded-[34px] p-4 sm:p-6 shadow-2xl"
        sheenColor="rgba(245, 158, 11, 0.18)"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="rounded-2xl bg-amber-500/20 p-3 text-amber-300 border border-amber-400/30 shadow-inner">
              <Coffee className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-white/95">کاردکس و مدیریت جامع مرخصی‌ها</h2>
              <p className="text-xs sm:text-sm text-white/60 mt-0.5">
                محاسبه دقیق مرخصی‌های روزانه، ساعتی و استعلاجی بر اساس استانداردهای قانون کار
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAddModal}
            className="liquid-pill-btn-primary px-5 py-2.5 text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>ثبت درخواست مرخصی جدید</span>
          </button>
        </div>
      </LiquidGlassCard>

      {/* 2. Quota Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Monthly Quota */}
        <LiquidGlassCard
          className="rounded-[28px] p-5 shadow-xl"
          sheenColor="rgba(99, 102, 241, 0.15)"
        >
          <span className="text-xs text-white/60 block mb-1">سهمیه قانونی ماه جاری</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white/95 font-mono">
              {toPersianDigits(monthlyQuotaDays)}
            </span>
            <span className="text-xs text-white/70">روز کاری</span>
          </div>
          <p className="text-xs text-white/50 font-mono mt-1">
            معادل {toPersianDigits(monthlyQuotaHours)} ساعت کار مفید
          </p>
        </LiquidGlassCard>

        {/* Used Leaves */}
        <LiquidGlassCard
          className="rounded-[28px] p-5 shadow-xl"
          sheenColor="rgba(245, 158, 11, 0.15)"
        >
          <span className="text-xs text-white/60 block mb-1">استفاده شده تا کنون</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
              {toPersianDigits(usedDays)}
            </span>
            <span className="text-xs text-amber-200">روز</span>
          </div>
          <p className="text-xs text-amber-300/80 font-mono mt-1">
            ({formatMinutesToPersianReadable(totalUsedMinutes)})
          </p>
        </LiquidGlassCard>

        {/* Remaining Leaves */}
        <LiquidGlassCard
          className="rounded-[28px] p-5 shadow-xl"
          sheenColor="rgba(16, 185, 129, 0.15)"
        >
          <span className="text-xs text-white/60 block mb-1">مانده باقیمانده سهمیه</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
              {toPersianDigits(remainingDays)}
            </span>
            <span className="text-xs text-emerald-200">روز</span>
          </div>
          <p className="text-xs text-emerald-300/80 font-mono mt-1">
            ({formatMinutesToPersianReadable(remainingMinutes)})
          </p>
        </LiquidGlassCard>
      </div>

      {/* 3. Progress Bar */}
      <LiquidGlassCard
        className="rounded-[28px] p-5 shadow-xl"
        sheenColor="rgba(245, 158, 11, 0.12)"
      >
        <div className="flex items-center justify-between text-xs mb-2.5">
          <span className="text-white/80 font-medium">میزان مصرف سهمیه مرخصی این دوره</span>
          <span className="font-mono font-bold text-amber-300">{toPersianDigits(usedPercent)}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-white/[0.08] p-0.5 border border-white/10 overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 shadow-md ${
              usedPercent > 80
                ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                : usedPercent > 50
                ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                : 'bg-gradient-to-r from-emerald-400 to-cyan-400'
            }`}
            style={{ width: `${usedPercent}%` }}
          />
        </div>
      </LiquidGlassCard>

      {/* 4. Filter Chips & Leaves List */}
      <LiquidGlassCard
        className="rounded-[32px] p-4 sm:p-6 shadow-2xl space-y-4"
        sheenColor="rgba(245, 158, 11, 0.12)"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-4">
          <h3 className="text-sm sm:text-base font-bold text-white/95 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-300" />
            <span>سوابق مرخصی‌های ثبت‌شده ({toPersianDigits(leaves.length)} مورد)</span>
          </h3>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
            {[
              { id: 'all', label: 'همه مرخصی‌ها' },
              { id: 'hourly', label: 'ساعتی' },
              { id: 'daily', label: 'روزانه' },
              { id: 'half_day', label: 'نیم‌روز' },
              { id: 'sick', label: 'استعلاجی' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3.5 py-1.5 rounded-full shrink-0 transition-all font-semibold ${
                  filterType === f.id
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40 shadow-sm'
                    : 'liquid-pill-btn text-white/70 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List of Leaves */}
        <div className="space-y-3">
          {filteredLeaves.length === 0 ? (
            <div className="py-12 text-center text-xs sm:text-sm text-white/40">
              مرخصی‌ای با این فیلتر ثبت نشده است.
            </div>
          ) : (
            filteredLeaves.map((l) => {
              const durMinutes = getLeaveDurationMinutes(l, 480);
              const weekday = getJalaliWeekdayName(l.date);
              return (
                <div
                  key={l.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-md p-3.5 sm:p-4 hover:bg-white/[0.07] hover:border-white/25 transition-all shadow-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="rounded-2xl bg-amber-500/20 p-2.5 text-amber-300 shrink-0 border border-amber-400/30 shadow-inner">
                      <Coffee className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs sm:text-sm font-bold text-white/95">
                          {toPersianDigits(l.date)}
                        </span>
                        <span className="text-[11px] text-white/60">({weekday})</span>
                        <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[10px] text-amber-300 font-semibold border border-white/15">
                          {l.type === 'hourly'
                            ? `ساعتی (${formatMinutesToPersianReadable(durMinutes)})`
                            : l.type === 'half_day'
                            ? 'نیم‌روز (۴ ساعت)'
                            : l.type === 'sick'
                            ? 'استعلاجی'
                            : l.type === 'unpaid'
                            ? 'بدون حقوق'
                            : 'روزانه کامل (۱ روز)'}
                        </span>
                      </div>
                      <div className="text-xs text-white/60 mt-1 flex items-center gap-2 truncate">
                        {l.startTime && l.endTime && (
                          <span className="font-mono text-amber-300 font-semibold bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-400/30 text-[11px]">
                            از {toPersianDigits(l.startTime)} تا {toPersianDigits(l.endTime)}
                          </span>
                        )}
                        <span className="truncate">{l.reason}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                    <div className="text-left font-mono">
                      <span className="text-sm sm:text-base font-bold text-amber-300">
                        {formatMinutesToTimeString(durMinutes)}
                      </span>
                      <span className="text-[10px] text-white/50 block">مدت معادل</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditLeave(l)}
                        className="p-2 rounded-xl text-white/60 hover:text-indigo-300 hover:bg-white/10 transition-colors"
                        title="ویرایش مرخصی"
                        aria-label="ویرایش مرخصی"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteLeave(l.id)}
                        className="p-2 rounded-xl text-white/60 hover:text-rose-400 hover:bg-white/10 transition-colors"
                        title="حذف مرخصی"
                        aria-label="حذف مرخصی"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </LiquidGlassCard>
    </div>
  );
};
