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
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { AttendanceRecord, ShiftConfig, MonthlyStats } from '../types';
import {
  toPersianDigits,
  formatMinutesToTimeString,
  formatMinutesToPersianReadable,
  PERSIAN_MONTH_NAMES,
  getCurrentJalaliDate,
} from '../utils/jalali';
import { LiquidGlassCard } from './LiquidGlassCard';

interface ReportsTabProps {
  stats: MonthlyStats;
  records: AttendanceRecord[];
  config: ShiftConfig;
  selectedMonthName: string;
  selectedYear: number;
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onExportExcel: () => void;
  onOpenReportModal?: () => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  stats,
  config,
  selectedMonthName,
  selectedYear,
  selectedMonth,
  onMonthChange,
  onYearChange,
  onExportExcel,
  onOpenReportModal,
}) => {
  const isNetPositive = stats.netBalanceMinutes >= 0;

  // Dynamic available years list
  const availableYears = React.useMemo(() => {
    const curYear = getCurrentJalaliDate().jy;
    const minYear = Math.min(1400, selectedYear - 2, curYear - 2);
    const maxYear = Math.max(1410, selectedYear + 2, curYear + 2);
    const years: number[] = [];
    for (let y = minYear; y <= maxYear; y++) {
      years.push(y);
    }
    return years;
  }, [selectedYear]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      onMonthChange(12);
      onYearChange(selectedYear - 1);
    } else {
      onMonthChange(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      onMonthChange(1);
      onYearChange(selectedYear + 1);
    } else {
      onMonthChange(selectedMonth + 1);
    }
  };

  // Average daily presence among present days
  const avgWorkedDaily =
    stats.presentDaysCount > 0
      ? Math.round(stats.totalWorkedMinutes / stats.presentDaysCount)
      : 0;

  const handlePrint = () => {
    if (onOpenReportModal) {
      onOpenReportModal();
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header Banner & Print/Export */}
      <LiquidGlassCard
        className="rounded-[28px] sm:rounded-[34px] p-4 sm:p-6 shadow-2xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="rounded-2xl bg-[var(--surface-2)] p-3 text-[var(--accent)] border border-[var(--border)] shadow-inner">
              <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-bold text-[var(--text-main)]">
                  گزارش جامع تحلیلی و مالی | {selectedMonthName} {toPersianDigits(selectedYear)}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                خلاصه ساعات کارکرد موظفی، اضافه کاری، انضباط تردد و برآورد مالی
              </p>
            </div>
          </div>

          {/* Month Navigator & Export Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month & Year Selectors */}
            <div className="flex items-center rounded-full bg-[var(--surface-2)] border border-[var(--border)] backdrop-blur-md p-1 shadow-inner">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-full text-muted hover:text-text hover:bg-[var(--surface)] transition-colors"
                title="ماه قبل"
                aria-label="ماه قبل"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
                className="bg-transparent px-2.5 py-1 text-xs sm:text-sm font-bold text-text focus:outline-none cursor-pointer"
                aria-label="انتخاب ماه"
              >
                {PERSIAN_MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1} className="bg-bg text-text">
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
                className="bg-transparent px-1.5 py-1 text-xs sm:text-sm font-bold text-accent focus:outline-none cursor-pointer font-mono"
                aria-label="انتخاب سال"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr} className="bg-bg text-text">
                    {toPersianDigits(yr)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-full text-muted hover:text-text hover:bg-[var(--surface)] transition-colors"
                title="ماه بعد"
                aria-label="ماه بعد"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onExportExcel}
                className="badge-success px-3.5 py-2 text-xs font-semibold rounded-full shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                title="دریافت فایل اکسل کامل دو برگه"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>خروجی اکسل</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="liquid-pill-btn-primary px-3.5 py-2 text-xs font-bold rounded-full shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                title="پیش‌نمایش، چاپ و ذخیره PDF رسمی"
              >
                <Printer className="h-4 w-4" />
                <span>چاپ و خروجی PDF</span>
              </button>
            </div>
          </div>
        </div>
      </LiquidGlassCard>

      {/* 2. Key Metrics Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Worked */}
        <LiquidGlassCard
          className="rounded-[28px] p-5 shadow-xl"
        >
          <div className="flex items-center justify-between text-xs text-muted mb-2">
            <span>مجموع کارکرد موثر</span>
            <Clock className="h-4 w-4 text-[var(--semantic-success)]" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[var(--text-main)]">
            {formatMinutesToPersianReadable(stats.totalWorkedMinutes)}
          </div>
          <span className="text-[11px] text-muted block mt-1 font-mono">
            از {formatMinutesToPersianReadable(stats.totalRequiredMinutes)} موظفی
          </span>
        </LiquidGlassCard>

        {/* Net Balance */}
        <LiquidGlassCard
          className="rounded-[28px] p-5 shadow-xl"
        >
          <div className="flex items-center justify-between text-xs text-muted mb-2">
            <span>تراز کارکرد (خالص)</span>
            <Scale className={`h-4 w-4 ${isNetPositive ? 'text-[var(--semantic-success)]' : 'text-[var(--semantic-danger)]'}`} />
          </div>
          <div
            className={`font-mono text-xl sm:text-2xl font-bold ${
              isNetPositive ? 'text-[var(--semantic-success)]' : 'text-[var(--semantic-danger)]'
            }`}
          >
            {isNetPositive ? '+' : '-'}
            {formatMinutesToPersianReadable(Math.abs(stats.netBalanceMinutes))}
          </div>
          <span className="text-[11px] text-muted block mt-1">
            {isNetPositive ? 'مازاد اضافه کاری بر کسر کار' : 'کسر کار بیشتر از اضافه کار'}
          </span>
        </LiquidGlassCard>

        {/* Overtime (Regular + Holiday) */}
        <LiquidGlassCard
          className="rounded-[28px] p-5 shadow-xl"
        >
          <div className="flex items-center justify-between text-xs text-muted mb-2">
            <span>مجموع اضافه کاری</span>
            <Zap className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[var(--accent)]">
            {formatMinutesToPersianReadable(stats.totalOvertimeMinutes + stats.totalHolidayOvertimeMinutes)}
          </div>
          <span className="text-[11px] text-muted block mt-1 font-mono">
            عادی: {toPersianDigits(formatMinutesToTimeString(stats.totalOvertimeMinutes))} | تعطیل:{' '}
            {toPersianDigits(formatMinutesToTimeString(stats.totalHolidayOvertimeMinutes))}
          </span>
        </LiquidGlassCard>

        {/* Total Delays & Early Leaves */}
        <LiquidGlassCard
          className="rounded-[28px] p-5 shadow-xl"
        >
          <div className="flex items-center justify-between text-xs text-muted mb-2">
            <span>تاخیر و تعجیل</span>
            <AlertTriangle className="h-4 w-4 text-[var(--semantic-warning)]" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[var(--semantic-warning)]">
            {toPersianDigits(stats.totalDelayMinutes + stats.totalEarlyLeaveMinutes)} دقیقه
          </div>
          <span className="text-[11px] text-muted block mt-1 font-mono">
            تاخیر ورود: {toPersianDigits(stats.totalDelayMinutes)}د | تعجیل خروج: {toPersianDigits(stats.totalEarlyLeaveMinutes)}د
          </span>
        </LiquidGlassCard>
      </div>

      {/* 3. Detailed Financial & Analytical Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Work Breakdown Table */}
        <LiquidGlassCard
          className="rounded-[30px] p-5 sm:p-6 shadow-2xl space-y-4"
        >
          <h3 className="text-sm font-bold text-[var(--text-main)] border-b border-[var(--border)] pb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--accent)]" />
            <span>جزئیات محاسبات زمانی ماه</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-[var(--border)]">
              <span className="text-muted">ساعات موظفی کل ماه:</span>
              <span className="font-mono font-bold text-[var(--text-main)]">
                {formatMinutesToPersianReadable(stats.totalRequiredMinutes)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-[var(--border)]">
              <span className="text-muted">ساعات کارکرد واقعی موثر:</span>
              <span className="font-mono font-bold text-[var(--semantic-success)]">
                {formatMinutesToPersianReadable(stats.totalWorkedMinutes)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-[var(--border)]">
              <span className="text-muted">میانگین کارکرد در روزهای حضور:</span>
              <span className="font-mono font-bold text-[var(--accent)]">
                {formatMinutesToPersianReadable(avgWorkedDaily)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-[var(--border)]">
              <span className="text-muted">مرخصی‌های استفاده‌شده:</span>
              <span className="font-mono font-bold text-[var(--semantic-warning)]">
                {toPersianDigits(stats.totalLeaveDays)} روز ({toPersianDigits(stats.totalLeaveHours)} ساعت)
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-muted">درصد تحقق موظفی ماهانه:</span>
              <span className="font-mono font-bold text-[var(--accent)] text-sm">
                {toPersianDigits(stats.completionRate)}%
              </span>
            </div>
          </div>
        </LiquidGlassCard>

        {/* Financial & Wage Estimation */}
        <LiquidGlassCard
          className="rounded-[30px] p-5 sm:p-6 shadow-2xl space-y-4 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)] border-b border-[var(--border)] pb-3 flex items-center gap-2">
              <Banknote className="h-4 w-4 text-[var(--semantic-success)]" />
              <span>برآورد ریالی اضافه کاری و دستمزد</span>
            </h3>

            {config.hourlyRateToman && config.hourlyRateToman > 0 ? (
              <div className="space-y-3 pt-2 text-xs">
                <div className="rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] p-4 text-center shadow-inner">
                  <span className="text-[11px] text-muted block mb-1">
                    مبلغ برآوردی اضافه کار این ماه
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-[var(--semantic-success)] font-mono">
                    {toPersianDigits(stats.estimatedOvertimePay?.toLocaleString() || '۰')}
                    <span className="text-xs font-normal text-muted mr-1.5">تومان</span>
                  </div>
                </div>

                <div className="space-y-2 text-muted text-xs">
                  <div className="flex items-center justify-between">
                    <span>نرخ دستمزد ساعتی پایه:</span>
                    <span className="font-mono text-[var(--text-main)]">
                      {toPersianDigits(config.hourlyRateToman.toLocaleString())} تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ضریب اضافه کار عادی ({toPersianDigits(config.overtimeMultiplier || 1.4)}x):</span>
                    <span className="font-mono text-[var(--accent)] font-semibold">
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
                    <span className="font-mono text-[var(--accent)] font-semibold">
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
              <div className="py-8 text-center text-xs text-muted space-y-2">
                <p>نرخ ساعتی در تنظیمات شیفت ثبت نشده است.</p>
                <p className="text-[11px] text-muted">
                  برای مشاهده محاسبات ریالی، در بخش تنظیمات نرخ ساعتی پایه را وارد کنید.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[var(--border)] text-[11px] text-muted">
            * مبالغ فوق صرفاً برآورد کارگاهی بر اساس ضرایب قانون کار بوده و ملاک نهایی فیش حقوقی می‌باشد.
          </div>
        </LiquidGlassCard>
      </div>
    </div>
  );
};
