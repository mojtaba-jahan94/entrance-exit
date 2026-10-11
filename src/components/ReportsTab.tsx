import React from 'react';
import {
  TrendingUp,
  Clock,
  Calendar,
  AlertTriangle,
  Coffee,
  CheckCircle2,
  Banknote,
  Scale,
  Award,
  Zap,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { AttendanceRecord, ShiftConfig, MonthlyStats } from '../types';
import {
  toPersianDigits,
  formatMinutesToTimeString,
  formatMinutesToPersianReadable,
} from '../utils/jalali';

interface ReportsTabProps {
  stats: MonthlyStats;
  records: AttendanceRecord[];
  config: ShiftConfig;
  selectedMonthName: string;
  selectedYear: number;
  onExportExcel: () => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  stats,
  records,
  config,
  selectedMonthName,
  selectedYear,
  onExportExcel,
}) => {
  const isNetPositive = stats.netBalanceMinutes >= 0;

  const avgWorkedDaily =
    stats.presentDaysCount > 0
      ? Math.round(stats.totalWorkedMinutes / stats.presentDaysCount)
      : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Banner & Print/Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-widest text-black/45 bg-black/[0.04] border border-black/[0.06] uppercase">
            <span>FINANCIAL & TIME REPORT // گزارش جامع</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-light text-[#111] tracking-tight">
            گزارش تحلیلی و مالی | {selectedMonthName} {toPersianDigits(selectedYear)}
          </h2>
          <p className="text-xs sm:text-sm text-black/45 leading-relaxed">
            خلاصه کارکرد موظفی، اضافه کاری، انضباط تردد و برآورد ساعات مفید کاری
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 rounded-xl bg-[#111] hover:bg-[#2c2c2c] text-white px-3.5 py-2 text-xs font-medium tracking-wide shadow-xs transition-all"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>خروجی اکسل</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white hover:bg-black/[0.02] text-black/70 hover:text-black px-3.5 py-2 text-xs font-medium transition-all"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>چاپ گزارش</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-mono tracking-widest text-black/40 uppercase block mb-1">
            کارکرد موثر ماه
          </span>
          <div className="text-2xl sm:text-3xl font-light text-[#111] font-mono">
            {formatMinutesToPersianReadable(stats.totalWorkedMinutes)}
          </div>
          <span className="text-xs text-black/40 font-mono block mt-1">
            از {formatMinutesToPersianReadable(stats.totalRequiredMinutes)} موظفی
          </span>
        </div>

        <div className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-mono tracking-widest text-black/40 uppercase block mb-1">
            تراز خالص کارکرد
          </span>
          <div
            className={`text-2xl sm:text-3xl font-light font-mono ${
              isNetPositive ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {isNetPositive ? '+' : '-'}
            {formatMinutesToPersianReadable(Math.abs(stats.netBalanceMinutes))}
          </div>
          <span className="text-xs text-black/40 block mt-1">
            {isNetPositive ? 'مازاد اضافه کاری' : 'کسر کار بیش از اضافه کار'}
          </span>
        </div>

        <div className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-mono tracking-widest text-black/40 uppercase block mb-1">
            مجموع اضافه کاری
          </span>
          <div className="text-2xl sm:text-3xl font-light text-[#111] font-mono">
            {formatMinutesToPersianReadable(stats.totalOvertimeMinutes + stats.totalHolidayOvertimeMinutes)}
          </div>
          <span className="text-xs text-black/40 font-mono block mt-1">
            عادی: {toPersianDigits(formatMinutesToTimeString(stats.totalOvertimeMinutes))} | تعطیل:{' '}
            {toPersianDigits(formatMinutesToTimeString(stats.totalHolidayOvertimeMinutes))}
          </span>
        </div>

        <div className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-mono tracking-widest text-black/40 uppercase block mb-1">
            تاخیر و تعجیل
          </span>
          <div className="text-2xl sm:text-3xl font-light text-[#111] font-mono">
            {toPersianDigits(stats.totalDelayMinutes + stats.totalEarlyLeaveMinutes)} دقیقه
          </div>
          <span className="text-xs text-black/40 font-mono block mt-1">
            تاخیر ورود: {toPersianDigits(stats.totalDelayMinutes)}د | تعجیل: {toPersianDigits(stats.totalEarlyLeaveMinutes)}د
          </span>
        </div>
      </div>

      {/* 3. Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Time Details Table */}
        <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
          <h3 className="text-sm font-semibold text-[#111] border-b border-black/[0.06] pb-2.5 flex items-center gap-2">
            <Clock className="h-4 w-4 text-black/40" />
            <span>جزئیات محاسبات زمانی</span>
          </h3>

          <div className="divide-y divide-black/[0.04] text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-black/60">کل روزهای تقویمی ماه:</span>
              <span className="font-mono font-medium text-[#111]">
                {toPersianDigits(records.length || 30)} روز
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-black/60">روزهای ثبت‌شده:</span>
              <span className="font-mono font-medium text-[#111]">
                {toPersianDigits(stats.presentDaysCount + stats.absentDaysCount + (stats.leaveDaysCount || 0))} روز
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-black/60">روزهای حضور موثر:</span>
              <span className="font-mono font-medium text-emerald-700">
                {toPersianDigits(stats.presentDaysCount)} روز
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-black/60">روزهای غیبت یا ثبت‌نشده:</span>
              <span className="font-mono font-medium text-rose-600">
                {toPersianDigits(stats.absentDaysCount)} روز
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-black/60">میانگین حضور در روزهای کاری:</span>
              <span className="font-mono font-medium text-[#111]">
                {formatMinutesToPersianReadable(avgWorkedDaily)}
              </span>
            </div>
          </div>
        </div>

        {/* Attendance Discipline & Leaves Table */}
        <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
          <h3 className="text-sm font-semibold text-[#111] border-b border-black/[0.06] pb-2.5 flex items-center gap-2">
            <Award className="h-4 w-4 text-black/40" />
            <span>انضباط تردد و کاردکس مرخصی</span>
          </h3>

          <div className="divide-y divide-black/[0.04] text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-black/60">کل کسر کار ماهانه:</span>
              <span className="font-mono font-medium text-amber-800">
                {formatMinutesToPersianReadable(stats.totalDeficitMinutes)}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-black/60">کل مرخصی استفاده‌شده:</span>
              <span className="font-mono font-medium text-[#111]">
                {formatMinutesToPersianReadable(stats.totalLeaveMinutes)} ({toPersianDigits(stats.totalLeaveDays.toFixed(1))} روز)
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-black/60">درصد تحقق کل موظفی:</span>
              <span className="font-mono font-bold text-[#111]">
                {toPersianDigits(stats.completionRate)}٪
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-black/60">وضعیت انضباط زمانی:</span>
              <span className="font-medium text-emerald-700">
                {stats.totalDelayMinutes === 0 ? 'عالی و بدون تاخیر' : `${toPersianDigits(stats.totalDelayMinutes)} دقیقه تاخیر مجموع`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
