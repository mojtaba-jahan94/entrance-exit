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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 p-4 sm:p-6 rounded-2xl sm:rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-500/20 p-3 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-white">
              گزارش جامع تحلیلی و مالی | {selectedMonthName} {toPersianDigits(selectedYear)}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              خلاصه ساعات کارکرد موظفی، اضافه کاری، انضباط تردد و برآورد مالی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-semibold shadow-md transition-all"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>خروجی اکسل</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 px-3.5 py-2 text-xs font-semibold transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>چاپ گزارش</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Worked */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>مجموع کارکرد موثر</span>
            <Clock className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-white">
            {formatMinutesToPersianReadable(stats.totalWorkedMinutes)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1 font-mono">
            از {formatMinutesToPersianReadable(stats.totalRequiredMinutes)} موظفی
          </span>
        </div>

        {/* Net Balance */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>تراز کارکرد (خالص)</span>
            <Scale className={`h-4 w-4 ${isNetPositive ? 'text-emerald-400' : 'text-rose-400'}`} />
          </div>
          <div
            className={`font-mono text-xl sm:text-2xl font-bold ${
              isNetPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isNetPositive ? '+' : '-'}
            {formatMinutesToPersianReadable(Math.abs(stats.netBalanceMinutes))}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            {isNetPositive ? 'مازاد اضافه کاری بر کسر کار' : 'کسر کار بیشتر از اضافه کار'}
          </span>
        </div>

        {/* Overtime (Regular + Holiday) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>مجموع اضافه کاری</span>
            <Zap className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-indigo-300">
            {formatMinutesToPersianReadable(stats.totalOvertimeMinutes + stats.totalHolidayOvertimeMinutes)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1 font-mono">
            عادی: {toPersianDigits(formatMinutesToTimeString(stats.totalOvertimeMinutes))} | تعطیل:{' '}
            {toPersianDigits(formatMinutesToTimeString(stats.totalHolidayOvertimeMinutes))}
          </span>
        </div>

        {/* Total Delays & Early Leaves */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>تاخیر و تعجیل</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-amber-300">
            {toPersianDigits(stats.totalDelayMinutes + stats.totalEarlyLeaveMinutes)} دقیقه
          </div>
          <span className="text-[11px] text-slate-400 block mt-1 font-mono">
            تاخیر ورود: {toPersianDigits(stats.totalDelayMinutes)}د | تعجیل خروج: {toPersianDigits(stats.totalEarlyLeaveMinutes)}د
          </span>
        </div>
      </div>

      {/* 3. Detailed Financial & Analytical Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Work Breakdown Table */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-md shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-white border-b border-slate-800/80 pb-2.5 flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span>جزئیات محاسبات زمانی ماه</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/40">
              <span className="text-slate-400">ساعات موظفی کل ماه:</span>
              <span className="font-mono font-bold text-white">
                {formatMinutesToPersianReadable(stats.totalRequiredMinutes)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/40">
              <span className="text-slate-400">ساعات کارکرد واقعی موثر:</span>
              <span className="font-mono font-bold text-emerald-400">
                {formatMinutesToPersianReadable(stats.totalWorkedMinutes)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/40">
              <span className="text-slate-400">میانگین کارکرد در روزهای حضور:</span>
              <span className="font-mono font-bold text-cyan-300">
                {formatMinutesToPersianReadable(avgWorkedDaily)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/40">
              <span className="text-slate-400">مرخصی‌های استفاده‌شده:</span>
              <span className="font-mono font-bold text-amber-400">
                {toPersianDigits(stats.totalLeaveDays)} روز ({toPersianDigits(stats.totalLeaveHours)} ساعت)
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400">درصد تحقق موظفی ماهانه:</span>
              <span className="font-mono font-bold text-indigo-400 text-sm">
                {toPersianDigits(stats.completionRate)}%
              </span>
            </div>
          </div>
        </div>

        {/* Financial & Wage Estimation */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-md shadow-xl space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white border-b border-slate-800/80 pb-2.5 flex items-center gap-2">
              <Banknote className="h-4 w-4 text-emerald-400" />
              <span>برآورد ریالی اضافه کاری و دستمزد</span>
            </h3>

            {config.hourlyRateToman && config.hourlyRateToman > 0 ? (
              <div className="space-y-3 pt-2 text-xs">
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                  <span className="text-[11px] text-emerald-300 block mb-1">
                    مبلغ برآوردی اضافه کار این ماه
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                    {toPersianDigits(stats.estimatedOvertimePay?.toLocaleString() || '۰')}
                    <span className="text-xs font-normal text-emerald-300 mr-1.5">تومان</span>
                  </div>
                </div>

                <div className="space-y-2 text-slate-400 text-xs">
                  <div className="flex items-center justify-between">
                    <span>نرخ دستمزد ساعتی پایه:</span>
                    <span className="font-mono text-white">
                      {toPersianDigits(config.hourlyRateToman.toLocaleString())} تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ضریب اضافه کار عادی ({toPersianDigits(config.overtimeMultiplier || 1.4)}x):</span>
                    <span className="font-mono text-indigo-300">
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
                    <span className="font-mono text-cyan-300">
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
              <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                <p>نرخ ساعتی در تنظیمات شیفت ثبت نشده است.</p>
                <p className="text-[11px] text-slate-500">
                  برای مشاهده محاسبات ریالی، در بخش تنظیمات نرخ ساعتی پایه را وارد کنید.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
            * مبالغ فوق صرفاً برآورد کارگاهی بر اساس ضرایب قانون کار بوده و ملاک نهایی فیش حقوقی می‌باشد.
          </div>
        </div>
      </div>
    </div>
  );
};
