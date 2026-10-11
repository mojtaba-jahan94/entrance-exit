import React, { useState } from 'react';
import {
  Coffee,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  Sparkles,
  ChevronLeft,
  Filter,
} from 'lucide-react';
import { LeaveRecord, LeaveType } from '../types';
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
    <div className="space-y-4 text-white">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#09090d] p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-32 bg-[#eca8d6]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest text-[#eca8d6] bg-[#eca8d6]/10 border border-[#eca8d6]/20 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eca8d6] animate-pulse" />
              <span>03 // LEAVE & ABSENCE ENGINE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
              کاردکس سهمیه و مرخصی‌ها | <span className="text-[#eca8d6] font-medium">{selectedMonthName}</span>
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              محاسبه مکانیزه مرخصی روزانه، ساعتی و استعلاجی بر پایه استانداردهای قانون کار و شناوری شیفت
            </p>
          </div>

          <button
            onClick={onOpenAddModal}
            className="flex items-center justify-center gap-2 rounded-full bg-[#eca8d6] hover:bg-[#e491cc] text-[#050507] px-5 py-3 text-xs font-bold tracking-wide transition-all shadow-[0_0_25px_rgba(236,168,214,0.3)] active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>ثبت درخواست مرخصی</span>
          </button>
        </div>
      </div>

      {/* 2. Quota Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Monthly Legal Quota */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#09090d] p-5 shadow-xl group hover:border-[#eca8d6]/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
              01 // سهمیه قانونی ماه
            </span>
            <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-zinc-400">
              <Calendar className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-light text-white font-mono tracking-tight">
              {toPersianDigits(monthlyQuotaDays)}
            </span>
            <span className="text-xs text-zinc-400 font-mono">روز کاری</span>
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-2 pt-2 border-t border-white/5">
            معادل {toPersianDigits(monthlyQuotaHours)} ساعت موظفی مصوب
          </p>
        </div>

        {/* Card 2: Used Quota */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#09090d] p-5 shadow-xl group hover:border-amber-400/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
              02 // مصرف‌شده تاکنون
            </span>
            <div className="w-7 h-7 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-300">
              <Coffee className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-light text-amber-300 font-mono tracking-tight">
              {toPersianDigits(usedDays)}
            </span>
            <span className="text-xs text-zinc-400 font-mono">روز</span>
          </div>
          <p className="text-xs text-amber-400/80 font-mono mt-2 pt-2 border-t border-white/5">
            {formatMinutesToPersianReadable(totalUsedMinutes)} کسر از سهمیه
          </p>
        </div>

        {/* Card 3: Remaining Balance */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#09090d] p-5 shadow-xl group hover:border-emerald-400/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
              03 // باقیمانده مجاز
            </span>
            <div className="w-7 h-7 rounded-full bg-emerald-400/10 flex items-center justify-center text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-light text-emerald-400 font-mono tracking-tight">
              {toPersianDigits(remainingDays)}
            </span>
            <span className="text-xs text-zinc-400 font-mono">روز</span>
          </div>
          <p className="text-xs text-emerald-400/80 font-mono mt-2 pt-2 border-t border-white/5">
            {formatMinutesToPersianReadable(remainingMinutes)} قابل استفاده
          </p>
        </div>
      </div>

      {/* 3. High-Tech Consumption Gauge */}
      <div className="rounded-3xl border border-white/10 bg-[#09090d] p-5 shadow-xl space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400 uppercase tracking-wider">
            درصد اشغال سهمیه مرخصی ماه ({selectedMonthName})
          </span>
          <span className="text-[#eca8d6] font-bold text-sm">
            {toPersianDigits(usedPercent)}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              usedPercent > 80
                ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                : 'bg-gradient-to-r from-[#eca8d6] to-[#c597eb] shadow-[0_0_10px_rgba(236,168,214,0.5)]'
            }`}
            style={{ width: `${usedPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-1">
          <span>۰٪ شروع دوره</span>
          <span>{toPersianDigits(usedDays)} روز مصرف شده از {toPersianDigits(monthlyQuotaDays)} روز سهمیه</span>
          <span>۱۰۰٪ تکمیل سقف</span>
        </div>
      </div>

      {/* 4. Leaves History Matrix */}
      <div className="rounded-3xl border border-white/10 bg-[#09090d] p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#eca8d6] animate-pulse" />
            <h3 className="text-sm font-medium text-white font-mono tracking-wide">
              سوابق درخواست‌های ثبت‌شده ({toPersianDigits(leaves.length)} رکورد)
            </h3>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
            {[
              { id: 'all', label: 'همه موارد' },
              { id: 'hourly', label: 'ساعتی' },
              { id: 'daily', label: 'روزانه' },
              { id: 'half_day', label: 'نیم‌روز' },
              { id: 'sick', label: 'استعلاجی' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-full font-mono text-xs transition-all ${
                  filterType === f.id
                    ? 'bg-[#eca8d6] text-[#050507] font-bold shadow-[0_0_12px_rgba(236,168,214,0.3)]'
                    : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Records List */}
        <div className="space-y-2.5">
          {filteredLeaves.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500 font-mono">
              هیچ مرخصی‌ای با این فیلتر برای این بازه یافت نشد.
            </div>
          ) : (
            filteredLeaves.map((l) => {
              const durMinutes = getLeaveDurationMinutes(l, 480);
              const weekday = getJalaliWeekdayName(l.date);
              return (
                <div
                  key={l.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0c0d14] hover:bg-[#11121c] p-4 transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#eca8d6] shrink-0 group-hover:border-[#eca8d6]/30 transition-colors">
                      <Coffee className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-white tracking-wider">
                          {toPersianDigits(l.date)}
                        </span>
                        <span className="text-[11px] text-zinc-500">({weekday})</span>
                        <span className="rounded-full bg-[#eca8d6]/10 border border-[#eca8d6]/20 px-2 py-0.5 text-[10px] font-mono text-[#eca8d6]">
                          {l.type === 'hourly'
                            ? `ساعتی (${formatMinutesToPersianReadable(durMinutes)})`
                            : l.type === 'half_day'
                            ? 'نیم‌روز (۴ ساعت)'
                            : l.type === 'sick'
                            ? 'استعلاجی'
                            : 'روزانه کامل'}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-1 truncate">
                        {l.startTime && l.endTime && (
                          <span className="font-mono text-zinc-300 ml-2 bg-white/5 px-1.5 py-0.5 rounded">
                            {toPersianDigits(l.startTime)} الی {toPersianDigits(l.endTime)}
                          </span>
                        )}
                        <span>{l.reason || 'بدون توضیح'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <div className="text-left font-mono">
                      <span className="text-sm font-bold text-[#eca8d6]">
                        {formatMinutesToTimeString(durMinutes)}
                      </span>
                      <span className="text-[10px] text-zinc-500 block">مدت کسر سهمیه</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditLeave(l)}
                        className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="ویرایش مرخصی"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteLeave(l.id)}
                        className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="حذف مرخصی"
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
