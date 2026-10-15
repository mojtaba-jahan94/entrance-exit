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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#D1D5DB] p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#F5F0E6] p-3 text-[#A68A64] border border-[#A68A64]/30 shadow-sm">
            <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-[#1F2933]">
              گزارش جامع تحلیلی و مالی | {selectedMonthName} {toPersianDigits(selectedYear)}
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
              خلاصه ساعات کارکرد موظفی، اضافه کاری، انضباط تردد و برآورد مالی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 rounded-xl bg-[#2E6F40] hover:bg-[#235833] text-white px-3.5 py-2 text-xs font-semibold shadow-sm transition-all"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>خروجی اکسل</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-[#D1D5DB] bg-white hover:bg-[#F7F7F2] text-[#1F2933] px-3.5 py-2 text-xs font-semibold shadow-sm transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>چاپ گزارش</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Worked */}
        <div className="rounded-2xl border border-[#D1D5DB] bg-white p-4.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#6B7280] mb-2">
            <span>مجموع کارکرد موثر</span>
            <Clock className="h-4 w-4 text-[#2E6F40]" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#1F2933]">
            {formatMinutesToPersianReadable(stats.totalWorkedMinutes)}
          </div>
          <span className="text-[11px] text-[#6B7280] block mt-1 font-mono">
            از {formatMinutesToPersianReadable(stats.totalRequiredMinutes)} موظفی
          </span>
        </div>

        {/* Net Balance */}
        <div className="rounded-2xl border border-[#D1D5DB] bg-white p-4.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#6B7280] mb-2">
            <span>تراز کارکرد (خالص)</span>
            <Scale className={`h-4 w-4 ${isNetPositive ? 'text-[#2E6F40]' : 'text-[#B91C1C]'}`} />
          </div>
          <div
            className={`font-mono text-xl sm:text-2xl font-bold ${
              isNetPositive ? 'text-[#2E6F40]' : 'text-[#B91C1C]'
            }`}
          >
            {isNetPositive ? '+' : '-'}
            {formatMinutesToPersianReadable(Math.abs(stats.netBalanceMinutes))}
          </div>
          <span className="text-[11px] text-[#6B7280] block mt-1">
            {isNetPositive ? 'مازاد اضافه کاری بر کسر کار' : 'کسر کار بیشتر از اضافه کار'}
          </span>
        </div>

        {/* Overtime (Regular + Holiday) */}
        <div className="rounded-2xl border border-[#D1D5DB] bg-white p-4.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#6B7280] mb-2">
            <span>مجموع اضافه کاری</span>
            <Zap className="h-4 w-4 text-[#A68A64]" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#1F2933]">
            {formatMinutesToPersianReadable(stats.totalOvertimeMinutes + stats.totalHolidayOvertimeMinutes)}
          </div>
          <span className="text-[11px] text-[#6B7280] block mt-1 font-mono">
            عادی: {toPersianDigits(formatMinutesToTimeString(stats.totalOvertimeMinutes))} | تعطیل:{' '}
            {toPersianDigits(formatMinutesToTimeString(stats.totalHolidayOvertimeMinutes))}
          </span>
        </div>

        {/* Total Delays & Early Leaves */}
        <div className="rounded-2xl border border-[#D1D5DB] bg-white p-4.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#6B7280] mb-2">
            <span>تاخیر و تعجیل</span>
            <AlertTriangle className="h-4 w-4 text-[#D97706]" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#D97706]">
            {toPersianDigits(stats.totalDelayMinutes + stats.totalEarlyLeaveMinutes)} دقیقه
          </div>
          <span className="text-[11px] text-[#6B7280] block mt-1 font-mono">
            تاخیر ورود: {toPersianDigits(stats.totalDelayMinutes)}د | تعجیل خروج: {toPersianDigits(stats.totalEarlyLeaveMinutes)}د
          </span>
        </div>
      </div>

      {/* 3. Detailed Financial & Analytical Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Work Breakdown Table */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#D1D5DB] bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-[#1F2933] border-b border-[#D1D5DB] pb-2.5 flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#A68A64]" />
            <span>جزئیات محاسبات زمانی ماه</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-[#D1D5DB]/60">
              <span className="text-[#6B7280]">ساعات موظفی کل ماه:</span>
              <span className="font-mono font-bold text-[#1F2933]">
                {formatMinutesToPersianReadable(stats.totalRequiredMinutes)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-[#D1D5DB]/60">
              <span className="text-[#6B7280]">ساعات کارکرد واقعی موثر:</span>
              <span className="font-mono font-bold text-[#2E6F40]">
                {formatMinutesToPersianReadable(stats.totalWorkedMinutes)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-[#D1D5DB]/60">
              <span className="text-[#6B7280]">میانگین کارکرد در روزهای حضور:</span>
              <span className="font-mono font-bold text-[#1F2933]">
                {formatMinutesToPersianReadable(avgWorkedDaily)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-[#D1D5DB]/60">
              <span className="text-[#6B7280]">مرخصی‌های استفاده‌شده:</span>
              <span className="font-mono font-bold text-[#D97706]">
                {toPersianDigits(stats.totalLeaveDays)} روز ({toPersianDigits(stats.totalLeaveHours)} ساعت)
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#6B7280]">درصد تحقق موظفی ماهانه:</span>
              <span className="font-mono font-bold text-[#A68A64] text-sm">
                {toPersianDigits(stats.completionRate)}%
              </span>
            </div>
          </div>
        </div>

        {/* Financial & Wage Estimation */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#D1D5DB] bg-white p-4 sm:p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#1F2933] border-b border-[#D1D5DB] pb-2.5 flex items-center gap-2">
              <Banknote className="h-4 w-4 text-[#2E6F40]" />
              <span>برآورد ریالی اضافه کاری و دستمزد</span>
            </h3>

            {config.hourlyRateToman && config.hourlyRateToman > 0 ? (
              <div className="space-y-3 pt-2 text-xs">
                <div className="rounded-2xl bg-[#F5F0E6] border border-[#A68A64]/30 p-4 text-center">
                  <span className="text-[11px] text-[#6B7280] block mb-1">
                    مبلغ برآوردی اضافه کار این ماه
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-[#2E6F40] font-mono">
                    {toPersianDigits(stats.estimatedOvertimePay?.toLocaleString() || '۰')}
                    <span className="text-xs font-normal text-[#6B7280] mr-1.5">تومان</span>
                  </div>
                </div>

                <div className="space-y-2 text-[#6B7280] text-xs">
                  <div className="flex items-center justify-between">
                    <span>نرخ دستمزد ساعتی پایه:</span>
                    <span className="font-mono text-[#1F2933]">
                      {toPersianDigits(config.hourlyRateToman.toLocaleString())} تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ضریب اضافه کار عادی ({toPersianDigits(config.overtimeMultiplier || 1.4)}x):</span>
                    <span className="font-mono text-[#1F2933]">
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
                    <span className="font-mono text-[#1F2933]">
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
              <div className="py-8 text-center text-xs text-[#6B7280] space-y-2">
                <p>نرخ ساعتی در تنظیمات شیفت ثبت نشده است.</p>
                <p className="text-[11px] text-[#6B7280]">
                  برای مشاهده محاسبات ریالی، در بخش تنظیمات نرخ ساعتی پایه را وارد کنید.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[#D1D5DB] text-[11px] text-[#6B7280]">
            * مبالغ فوق صرفاً برآورد کارگاهی بر اساس ضرایب قانون کار بوده و ملاک نهایی فیش حقوقی می‌باشد.
          </div>
        </div>
      </div>
    </div>
  );
};
