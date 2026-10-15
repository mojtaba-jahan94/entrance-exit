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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#D1D5DB] p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#F5F0E6] p-3 text-[#A68A64] border border-[#A68A64]/30 shadow-sm">
            <Coffee className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-[#1F2933]">کاردکس و مدیریت جامع مرخصی‌ها</h2>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
              محاسبه دقیق مرخصی‌های روزانه، ساعتی و استعلاجی بر اساس استانداردهای قانون کار
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#A68A64] hover:bg-[#8F7553] text-white font-bold px-4 py-2.5 text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>ثبت درخواست مرخصی جدید</span>
        </button>
      </div>

      {/* 2. Quota Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Monthly Quota */}
        <div className="rounded-2xl border border-[#D1D5DB] bg-white p-4.5 shadow-sm">
          <span className="text-xs text-[#6B7280] block mb-1">سهمیه قانونی ماه جاری</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#1F2933] font-mono">
              {toPersianDigits(monthlyQuotaDays)}
            </span>
            <span className="text-xs text-[#6B7280]">روز کاری</span>
          </div>
          <p className="text-xs text-[#6B7280] font-mono mt-1">
            معادل {toPersianDigits(monthlyQuotaHours)} ساعت کار مفید
          </p>
        </div>

        {/* Used Leaves */}
        <div className="rounded-2xl border border-[#D1D5DB] bg-white p-4.5 shadow-sm">
          <span className="text-xs text-[#6B7280] block mb-1">استفاده شده تا کنون</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#D97706] font-mono">
              {toPersianDigits(usedDays)}
            </span>
            <span className="text-xs text-[#D97706]">روز</span>
          </div>
          <p className="text-xs text-[#D97706]/90 font-mono mt-1">
            ({formatMinutesToPersianReadable(totalUsedMinutes)})
          </p>
        </div>

        {/* Remaining Leaves */}
        <div className="rounded-2xl border border-[#D1D5DB] bg-white p-4.5 shadow-sm">
          <span className="text-xs text-[#6B7280] block mb-1">مانده باقی‌مانده سهمیه</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#2E6F40] font-mono">
              {toPersianDigits(remainingDays)}
            </span>
            <span className="text-xs text-[#2E6F40]">روز</span>
          </div>
          <p className="text-xs text-[#2E6F40]/90 font-mono mt-1">
            ({formatMinutesToPersianReadable(remainingMinutes)})
          </p>
        </div>
      </div>

      {/* 3. Progress Bar */}
      <div className="rounded-2xl border border-[#D1D5DB] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-[#1F2933] font-medium">میزان مصرف سهمیه مرخصی این دوره</span>
          <span className="font-mono font-bold text-[#A68A64]">{toPersianDigits(usedPercent)}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-[#E5E7EB] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              usedPercent > 80 ? 'bg-[#B91C1C]' : usedPercent > 50 ? 'bg-[#D97706]' : 'bg-[#2E6F40]'
            }`}
            style={{ width: `${usedPercent}%` }}
          />
        </div>
      </div>

      {/* 4. Filter Chips & Leaves List */}
      <div className="rounded-2xl sm:rounded-3xl border border-[#D1D5DB] bg-white p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D1D5DB] pb-3">
          <h3 className="text-sm sm:text-base font-bold text-[#1F2933] flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#A68A64]" />
            <span>سوابق مرخصی‌های ثبت‌شده ({toPersianDigits(leaves.length)} مورد)</span>
          </h3>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
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
                className={`px-3 py-1.5 rounded-xl shrink-0 transition-all font-medium ${
                  filterType === f.id
                    ? 'bg-[#A68A64] text-white font-bold shadow-sm'
                    : 'bg-[#F7F7F2] text-[#6B7280] hover:text-[#1F2933] border border-[#D1D5DB]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List of Leaves */}
        <div className="space-y-2.5">
          {filteredLeaves.length === 0 ? (
            <div className="py-12 text-center text-xs sm:text-sm text-[#6B7280]">
              مرخصی‌ای با این فیلتر ثبت نشده است.
            </div>
          ) : (
            filteredLeaves.map((l) => {
              const durMinutes = getLeaveDurationMinutes(l, 480);
              const weekday = getJalaliWeekdayName(l.date);
              return (
                <div
                  key={l.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#D1D5DB] bg-[#F7F7F2] p-3.5 sm:p-4 hover:border-[#A68A64]/50 hover:bg-[#F5F0E6]/30 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="rounded-xl bg-[#F5F0E6] p-2 text-[#A68A64] shrink-0 border border-[#A68A64]/20">
                      <Coffee className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs sm:text-sm font-bold text-[#1F2933]">
                          {toPersianDigits(l.date)}
                        </span>
                        <span className="text-[11px] text-[#6B7280]">({weekday})</span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-[#A68A64] font-medium border border-[#D1D5DB]">
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
                      <div className="text-xs text-[#6B7280] mt-1 flex items-center gap-2 truncate">
                        {l.startTime && l.endTime && (
                          <span className="font-mono text-[#A68A64] font-semibold bg-[#F5F0E6] px-1.5 py-0.5 rounded border border-[#A68A64]/20 text-[11px]">
                            از {toPersianDigits(l.startTime)} تا {toPersianDigits(l.endTime)}
                          </span>
                        )}
                        <span className="truncate">{l.reason}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#D1D5DB]">
                    <div className="text-left font-mono">
                      <span className="text-sm sm:text-base font-bold text-[#A68A64]">
                        {formatMinutesToTimeString(durMinutes)}
                      </span>
                      <span className="text-[10px] text-[#6B7280] block">مدت معادل</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditLeave(l)}
                        className="p-2 rounded-xl text-[#6B7280] hover:text-[#A68A64] hover:bg-white border border-transparent hover:border-[#D1D5DB] transition-colors"
                        title="ویرایش مرخصی"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteLeave(l.id)}
                        className="p-2 rounded-xl text-[#6B7280] hover:text-[#B91C1C] hover:bg-[#FEF2F2] border border-transparent hover:border-[#B91C1C]/20 transition-colors"
                        title="حذف مرخصی"
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
      </div>
    </div>
  );
};
