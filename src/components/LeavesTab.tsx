import React, { useState } from 'react';
import {
  Coffee,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Filter,
} from 'lucide-react';
import { LeaveRecord, LeaveType, ShiftConfig, AttendanceRecord } from '../types';
import {
  toPersianDigits,
  formatMinutesToPersianReadable,
  formatMinutesToTimeString,
  getJalaliWeekdayName,
} from '../utils/jalali';
import { getLeaveDurationMinutes } from '../utils/calculator';

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
  selectedMonthName,
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
    <div className="space-y-4">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-widest text-black/45 bg-black/[0.04] border border-black/[0.06] uppercase">
            <span>LEAVE MANAGEMENT // مدیریت مرخصی</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-light text-[#111] tracking-tight">
            کاردکس و سوابق مرخصی‌ها
          </h2>
          <p className="text-xs sm:text-sm text-black/45 leading-relaxed">
            محاسبه دقیق مرخصی‌های روزانه، ساعتی و استعلاجی بر پایه استانداردهای قانون کار
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#111] hover:bg-[#2c2c2c] text-white px-4 py-2.5 text-xs font-medium tracking-wide shadow-xs transition-all active:scale-[0.98] shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>ثبت درخواست مرخصی</span>
        </button>
      </div>

      {/* 2. Quota Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-mono tracking-widest text-black/40 uppercase block mb-1">
            سهمیه قانونی ماه
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-light text-[#111] font-mono">
              {toPersianDigits(monthlyQuotaDays)}
            </span>
            <span className="text-xs text-black/40">روز کاری</span>
          </div>
          <p className="text-xs text-black/45 font-mono mt-1">
            معادل {toPersianDigits(monthlyQuotaHours)} ساعت کار موظفی
          </p>
        </div>

        <div className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-mono tracking-widest text-black/40 uppercase block mb-1">
            استفاده شده تاکنون
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-light text-amber-800 font-mono">
              {toPersianDigits(usedDays)}
            </span>
            <span className="text-xs text-black/40">روز</span>
          </div>
          <p className="text-xs text-amber-700 font-mono mt-1">
            ({formatMinutesToPersianReadable(totalUsedMinutes)})
          </p>
        </div>

        <div className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-mono tracking-widest text-black/40 uppercase block mb-1">
            مانده سهمیه باقیمانده
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-light text-emerald-700 font-mono">
              {toPersianDigits(remainingDays)}
            </span>
            <span className="text-xs text-black/40">روز</span>
          </div>
          <p className="text-xs text-emerald-700 font-mono mt-1">
            ({formatMinutesToPersianReadable(remainingMinutes)})
          </p>
        </div>
      </div>

      {/* 3. Progress Bar */}
      <div className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between text-xs mb-2 font-mono">
          <span className="text-black/60">میزان مصرف سهمیه مرخصی این دوره</span>
          <span className="font-bold text-[#111]">{toPersianDigits(usedPercent)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-black/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              usedPercent > 80 ? 'bg-rose-500' : 'bg-[#111]'
            }`}
            style={{ width: `${usedPercent}%` }}
          />
        </div>
      </div>

      {/* 4. Leaves List */}
      <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] pb-3">
          <h3 className="text-sm font-semibold text-[#111] flex items-center gap-2">
            <Calendar className="h-4 w-4 text-black/40" />
            <span>سوابق مرخصی‌های ثبت‌شده ({toPersianDigits(leaves.length)} مورد)</span>
          </h3>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
            {[
              { id: 'all', label: 'همه' },
              { id: 'hourly', label: 'ساعتی' },
              { id: 'daily', label: 'روزانه' },
              { id: 'half_day', label: 'نیم‌روز' },
              { id: 'sick', label: 'استعلاجی' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-all ${
                  filterType === f.id
                    ? 'bg-[#111] text-white font-medium shadow-xs'
                    : 'border border-black/10 bg-white text-black/60 hover:text-black hover:bg-black/[0.02]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {filteredLeaves.length === 0 ? (
            <div className="py-12 text-center text-xs text-black/40 font-mono">
              هیچ مرخصی‌ای با این فیلتر ثبت نشده است.
            </div>
          ) : (
            filteredLeaves.map((l) => {
              const durMinutes = getLeaveDurationMinutes(l, 480);
              const weekday = getJalaliWeekdayName(l.date);
              return (
                <div
                  key={l.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-black/[0.07] bg-white hover:bg-[#fafaf8] p-3.5 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg border border-black/10 bg-black/[0.02] flex items-center justify-center text-black/60 shrink-0">
                      <Coffee className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#111]">
                          {toPersianDigits(l.date)}
                        </span>
                        <span className="text-[11px] text-black/40">({weekday})</span>
                        <span className="rounded bg-black/[0.04] px-1.5 py-0.5 text-[10px] font-mono text-black/70">
                          {l.type === 'hourly'
                            ? `ساعتی (${formatMinutesToPersianReadable(durMinutes)})`
                            : l.type === 'half_day'
                            ? 'نیم‌روز (۴ ساعت)'
                            : l.type === 'sick'
                            ? 'استعلاجی'
                            : 'روزانه کامل'}
                        </span>
                      </div>
                      <div className="text-xs text-black/50 mt-1 truncate">
                        {l.startTime && l.endTime && (
                          <span className="font-mono text-black/70 ml-2">
                            از {toPersianDigits(l.startTime)} تا {toPersianDigits(l.endTime)}
                          </span>
                        )}
                        <span>{l.reason || 'بدون توضیح'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/[0.05]">
                    <div className="text-left font-mono">
                      <span className="text-sm font-semibold text-[#111]">
                        {formatMinutesToTimeString(durMinutes)}
                      </span>
                      <span className="text-[10px] text-black/40 block">مدت کسر</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditLeave(l)}
                        className="p-1.5 rounded-lg text-black/40 hover:text-black hover:bg-black/[0.04] transition-colors"
                        title="ویرایش"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteLeave(l.id)}
                        className="p-1.5 rounded-lg text-black/40 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
