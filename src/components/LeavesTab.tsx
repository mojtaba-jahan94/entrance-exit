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
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="rounded-2xl bg-[var(--surface-2)] p-3 text-[var(--accent)] border border-[var(--border)] shadow-inner">
              <Coffee className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-[var(--text-main)]">کاردکس و مدیریت جامع مرخصی‌ها</h2>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
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
        >
          <span className="text-xs text-muted block mb-1">سهمیه قانونی ماه جاری</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[var(--text-main)] font-mono">
              {toPersianDigits(monthlyQuotaDays)}
            </span>
            <span className="text-xs text-muted">روز کاری</span>
          </div>
          <p className="text-xs text-muted font-mono mt-1">
            معادل {toPersianDigits(monthlyQuotaHours)} ساعت کار مفید
          </p>
        </LiquidGlassCard>

        {/* Used Leaves */}
        <LiquidGlassCard
          className="rounded-[28px] p-5 shadow-xl"
        >
          <span className="text-xs text-muted block mb-1">استفاده شده تا کنون</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[var(--semantic-warning)] font-mono">
              {toPersianDigits(usedDays)}
            </span>
            <span className="text-xs text-[var(--semantic-warning)]">روز</span>
          </div>
          <p className="text-xs text-[var(--semantic-warning)] font-mono mt-1">
            ({formatMinutesToPersianReadable(totalUsedMinutes)})
          </p>
        </LiquidGlassCard>

        {/* Remaining Leaves */}
        <LiquidGlassCard
          className="rounded-[28px] p-5 shadow-xl"
        >
          <span className="text-xs text-muted block mb-1">مانده باقیمانده سهمیه</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[var(--semantic-success)] font-mono">
              {toPersianDigits(remainingDays)}
            </span>
            <span className="text-xs text-[var(--semantic-success)]">روز</span>
          </div>
          <p className="text-xs text-[var(--semantic-success)] font-mono mt-1">
            ({formatMinutesToPersianReadable(remainingMinutes)})
          </p>
        </LiquidGlassCard>
      </div>

      {/* 3. Progress Bar */}
      <LiquidGlassCard
        className="rounded-[28px] p-5 shadow-xl"
      >
        <div className="flex items-center justify-between text-xs mb-2.5">
          <span className="text-[var(--text-main)] font-medium">میزان مصرف سهمیه مرخصی این دوره</span>
          <span className="font-mono font-bold text-[var(--accent)]">{toPersianDigits(usedPercent)}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-[var(--surface-2)] p-0.5 border border-[var(--border)] overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 shadow-sm ${
              usedPercent > 80
                ? 'bg-[var(--semantic-danger)]'
                : usedPercent > 50
                ? 'bg-[var(--semantic-warning)]'
                : 'bg-[var(--semantic-success)]'
            }`}
            style={{ width: `${usedPercent}%` }}
          />
        </div>
      </LiquidGlassCard>

      {/* 4. Filter Chips & Leaves List */}
      <LiquidGlassCard
        className="rounded-[32px] p-4 sm:p-6 shadow-2xl space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <h3 className="text-sm sm:text-base font-bold text-[var(--text-main)] flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[var(--accent)]" />
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
                    ? 'bg-[var(--accent)] text-[var(--bg)] shadow-sm'
                    : 'liquid-pill-btn text-muted hover:text-[var(--text-main)]'
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
            <div className="py-12 text-center text-xs sm:text-sm text-muted">
              مرخصی‌ای با این فیلتر ثبت نشده است.
            </div>
          ) : (
            filteredLeaves.map((l) => {
              const durMinutes = getLeaveDurationMinutes(l, 480);
              const weekday = getJalaliWeekdayName(l.date);
              return (
                <div
                  key={l.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] backdrop-blur-md p-3.5 sm:p-4 hover:border-[var(--border-strong)] transition-all shadow-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="rounded-2xl bg-[var(--surface)] p-2.5 text-[var(--accent)] shrink-0 border border-[var(--border)] shadow-inner">
                      <Coffee className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs sm:text-sm font-bold text-[var(--text-main)]">
                          {toPersianDigits(l.date)}
                        </span>
                        <span className="text-[11px] text-muted">({weekday})</span>
                        <span className="badge-neutral text-[10px] px-2.5 py-0.5 rounded-full">
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
                      <div className="text-xs text-muted mt-1 flex items-center gap-2 truncate">
                        {l.startTime && l.endTime && (
                          <span className="badge-warning font-mono font-semibold text-[11px] px-2 py-0.5 rounded-lg">
                            از {toPersianDigits(l.startTime)} تا {toPersianDigits(l.endTime)}
                          </span>
                        )}
                        <span className="truncate">{l.reason}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
                    <div className="text-left font-mono">
                      <span className="text-sm sm:text-base font-bold text-[var(--semantic-warning)]">
                        {formatMinutesToTimeString(durMinutes)}
                      </span>
                      <span className="text-[10px] text-muted block">مدت معادل</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditLeave(l)}
                        className="p-2 rounded-xl text-muted hover:text-[var(--accent)] hover:bg-[var(--surface)] transition-colors"
                        title="ویرایش مرخصی"
                        aria-label="ویرایش مرخصی"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteLeave(l.id)}
                        className="p-2 rounded-xl text-muted hover:text-[var(--semantic-danger)] hover:bg-[var(--surface)] transition-colors"
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
