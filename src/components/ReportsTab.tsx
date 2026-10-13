import React from 'react';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  Banknote,
  Scale,
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
import { LiquidGlassCard } from './LiquidGlassCard';

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
  config,
  selectedMonthName,
  selectedYear,
  onExportExcel,
}) => {
  const isNetPositive = stats.netBalanceMinutes >= 0;

  // Average daily presence among present days
  const avgWorkedDaily =
    stats.presentDaysCount > 0
      ? Math.round(stats.totalWorkedMinutes / stats.presentDaysCount)
      : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header Banner & Print/Export */}
      <LiquidGlassCard
        className="rounded-[28px] sm:rounded-[34px] p-4 sm:p-6 shadow-2xl"
        sheenColor="rgba(99, 102, 241, 0.18)"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="rounded-2xl bg-indigo-500/20 p-3 text-indigo-300 border border-indigo-400/30 shadow-inner">
              <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-white/95">
                گزارش جامع تحلیلی و مالی | {selectedMonthName} {toPersianDigits(selectedYear)}
              </h2>
              <p className="text-xs sm:text-sm text-white/60 mt-0.5">
                خلاصه ساعات کارکرد موظفی، اضافه کاری، انضباط تردد و برآورد مالی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportExcel}
              className="liquid-pill-btn px-4 py-2 text-xs font-semibold text-emerald-200 border-emerald-400/30 bg-emerald-500/20 shadow-md flex items-center gap-1.5"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>خروجی اکسل</span>
            </button>
            <button
              onClick={handlePrint}
              className="liquid-pill-btn px-4 py-2 text-xs font-semibold text-white/80 hover:text-white flex items-center gap-1.5"
            >
              <Printer className="h-4 w-4" />
              <span>چاپ گزارش</span>
            </button>
          </div>
        </div>
      </LiquidGlassCard>

      {/* 2. Key Metrics Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Worked */}
        <LiquidGlassCard
          className="rounded-[28px] p-5 shadow-xl"
          sheenColor="rgba(16, 185, 129, 0.15)"
        >
          <div className="flex items-center justify-between text-xs text-white/60 mb-2">
            <span>مجموع کارکرد موثر</span>
            <Clock className="h-4 w-4 text-emerald-300" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-white/95">
            {formatMinutesToPersianReadable(stats.totalWorkedMinutes)}
          </div>
          <span className="text-[11px] text-white/50 block mt-1 font-mono">
            از {formatMinutesToPersianReadable(stats.totalRequiredMinutes)} موظفی
          </span>
        </LiquidGlassCard>

        {/* Net Balance */}
        <LiquidGlassCard
          className="rounded-[28px] p-5 shadow-xl"
          sheenColor={isNetPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)'}
        >
          <div className="flex items-center justify-between text-xs text-white/60 mb-2">
            <span>تراز کارکرد (خالص)</span>
            <Scale className={`h-4 w-4 ${isNetPositive ? 'text-emerald-300' : 'text-rose-400'}`} />
          </div>
          <div
            className={`font-mono text-xl sm:text-2xl font-bold ${
              isNetPositive ? 'text-emerald-300' : 'text-rose-400'
            }`}
          >
            {isNetPositive ? '+' : '-'}
            {formatMinutesToPersianReadable(Math.abs(stats.netBalanceMinutes))}
          </div>
          <span className="text-[11px] text-white/50 block mt-1">
            {isNetPositive ? 'مازاد اضافه کاری بر کسر کار' : 'کسر کار بیشتر از اضافه کار'}
          </span>
        </LiquidGlassCard>

        {/* Overtime (Regular + Holiday) */}
        <LiquidGlassCard
          className="rounded-[28px] p-5 shadow-xl"
          sheenColor="rgba(59, 130, 246, 0.15)"
        >
          <div className="flex items-center justify-between text-xs text-white/60 mb-2">
            <span>مجموع اضافه کاری</span>
            <Zap className="h-4 w-4 text-cyan-300" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-cyan-300">
            {formatMinutesToPersianReadable(stats.totalOvertimeMinutes + stats.totalHolidayOvertimeMinutes)}
          </div>
          <span className="text-[11px] text-white/50 block mt-1 font-mono">
            عادی: {toPersianDigits(formatMinutesToTimeString(stats.totalOvertimeMinutes))} | تعطیل:{' '}
            {toPersianDigits(formatMinutesToTimeString(stats.totalHolidayOvertimeMinutes))}
          </span>
        </LiquidGlassCard>

        {/* Total Delays & Early Leaves */}
        <LiquidGlassCard
          className="rounded-[28px] p-5 shadow-xl"
          sheenColor="rgba(245, 158, 11, 0.15)"
        >
          <div className="flex items-center justify-between text-xs text-white/60 mb-2">
            <span>تاخیر و تعجیل</span>
            <AlertTriangle className="h-4 w-4 text-amber-300" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-amber-300">
            {toPersianDigits(stats.totalDelayMinutes + stats.totalEarlyLeaveMinutes)} دقیقه
          </div>
          <span className="text-[11px] text-white/50 block mt-1 font-mono">
            تاخیر ورود: {toPersianDigits(stats.totalDelayMinutes)}د | تعجیل خروج: {toPersianDigits(stats.totalEarlyLeaveMinutes)}د
          </span>
        </LiquidGlassCard>
      </div>

      {/* 3. Detailed Financial & Analytical Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Work Breakdown Table */}
        <LiquidGlassCard
          className="rounded-[30px] p-5 sm:p-6 shadow-2xl space-y-4"
          sheenColor="rgba(6, 182, 212, 0.12)"
        >
          <h3 className="text-sm font-bold text-white/95 border-b border-white/15 pb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-300" />
            <span>جزئیات محاسبات زمانی ماه</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-white/[0.06]">
              <span className="text-white/60">ساعات موظفی کل ماه:</span>
              <span className="font-mono font-bold text-white/95">
                {formatMinutesToPersianReadable(stats.totalRequiredMinutes)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/[0.06]">
              <span className="text-white/60">ساعات کارکرد واقعی موثر:</span>
              <span className="font-mono font-bold text-emerald-300">
                {formatMinutesToPersianReadable(stats.totalWorkedMinutes)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/[0.06]">
              <span className="text-white/60">میانگین کارکرد در روزهای حضور:</span>
              <span className="font-mono font-bold text-cyan-300">
                {formatMinutesToPersianReadable(avgWorkedDaily)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/[0.06]">
              <span className="text-white/60">مرخصی‌های استفاده‌شده:</span>
              <span className="font-mono font-bold text-amber-300">
                {toPersianDigits(stats.totalLeaveDays)} روز ({toPersianDigits(stats.totalLeaveHours)} ساعت)
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-white/60">درصد تحقق موظفی ماهانه:</span>
              <span className="font-mono font-bold text-indigo-300 text-sm">
                {toPersianDigits(stats.completionRate)}%
              </span>
            </div>
          </div>
        </LiquidGlassCard>

        {/* Financial & Wage Estimation */}
        <LiquidGlassCard
          className="rounded-[30px] p-5 sm:p-6 shadow-2xl space-y-4 flex flex-col justify-between"
          sheenColor="rgba(16, 185, 129, 0.12)"
        >
          <div>
            <h3 className="text-sm font-bold text-white/95 border-b border-white/15 pb-3 flex items-center gap-2">
              <Banknote className="h-4 w-4 text-emerald-300" />
              <span>برآورد ریالی اضافه کاری و دستمزد</span>
            </h3>

            {config.hourlyRateToman && config.hourlyRateToman > 0 ? (
              <div className="space-y-3 pt-2 text-xs">
                <div className="rounded-2xl bg-emerald-500/15 border border-emerald-400/30 p-4 text-center shadow-inner">
                  <span className="text-[11px] text-emerald-200 block mb-1">
                    مبلغ برآوردی اضافه کار این ماه
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
                    {toPersianDigits(stats.estimatedOvertimePay?.toLocaleString() || '۰')}
                    <span className="text-xs font-normal text-emerald-200 mr-1.5">تومان</span>
                  </div>
                </div>

                <div className="space-y-2 text-white/60 text-xs">
                  <div className="flex items-center justify-between">
                    <span>نرخ دستمزد ساعتی پایه:</span>
                    <span className="font-mono text-white/95">
                      {toPersianDigits(config.hourlyRateToman.toLocaleString())} تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ضریب اضافه کار عادی ({toPersianDigits(config.overtimeMultiplier || 1.4)}x):</span>
                    <span className="font-mono text-indigo-300 font-semibold">
                      {toPersianDigits(
                        Math.round(
                          (stats.totalOvertimeMinutes / 60) *
                            config.hourlyRateToman *
                            (config.overtimeMultiplier || 1.4)
                        ).toLocaleString()
                      )}{' '}
                      تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ضریب اضافه کار تعطیلات ({toPersianDigits(config.holidayMultiplier || 1.8)}x):</span>
                    <span className="font-mono text-cyan-300 font-semibold">
                      {toPersianDigits(
                        Math.round(
                          (stats.totalHolidayOvertimeMinutes / 60) *
                            config.hourlyRateToman *
                            (config.holidayMultiplier || 1.8)
                        ).toLocaleString()
                      )}{' '}
                      تومان
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-white/50 space-y-2">
                <p>نرخ ساعتی در تنظیمات شیفت ثبت نشده است.</p>
                <p className="text-[11px] text-white/40">
                  برای مشاهده محاسبات ریالی، در بخش تنظیمات نرخ ساعتی پایه را وارد کنید.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-white/10 text-[11px] text-white/40">
            * مبالغ فوق صرفاً برآورد کارگاهی بر اساس ضرایب قانون کار بوده و ملاک نهایی فیش حقوقی می‌باشد.
          </div>
        </LiquidGlassCard>
      </div>
    </div>
  );
};
