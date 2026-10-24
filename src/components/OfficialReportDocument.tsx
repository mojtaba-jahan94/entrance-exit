import React, { useMemo } from 'react';
import { AttendanceRecord, LeaveRecord, ShiftConfig, MonthlyStats } from '../types';
import {
  toPersianDigits,
  formatMinutesToTimeString,
  formatMinutesToPersianReadable,
  getTodayJalaliString,
} from '../utils/jalali';
import { buildFullMonthRows, FullMonthDayRow } from '../utils/exportEngine';

export interface OfficialReportDocumentProps {
  records: AttendanceRecord[];
  leaves: LeaveRecord[];
  config: ShiftConfig;
  stats: MonthlyStats;
  selectedYear: number;
  selectedMonth: number;
  selectedMonthName: string;
  personnelName: string;
  showFinancials?: boolean;
  showSignatures?: boolean;
  orientation?: 'landscape' | 'portrait';
  className?: string;
  id?: string;
}

export const OfficialReportDocument: React.FC<OfficialReportDocumentProps> = ({
  records,
  leaves,
  config,
  stats,
  selectedYear,
  selectedMonth,
  selectedMonthName,
  personnelName,
  showFinancials = true,
  showSignatures = true,
  orientation = 'landscape',
  className = '',
  id = 'official-print-report',
}) => {
  const fullRows = useMemo(
    () => buildFullMonthRows(records, leaves, config, selectedYear, selectedMonth),
    [records, leaves, config, selectedYear, selectedMonth]
  );
  const todayStr = getTodayJalaliString();

  // Calculate detailed column totals directly from fullRows
  const tableTotals = useMemo(() => {
    return fullRows.reduce(
      (acc, r) => {
        acc.breakMins += r.breakMinutes;
        acc.workedMins += r.workedMinutes;
        acc.delayMins += r.delayMinutes;
        acc.earlyMins += r.earlyLeaveMinutes;
        acc.normalOTMins += r.overtimeMinutes;
        acc.holidayOTMins += r.holidayOvertimeMinutes;
        acc.deficitMins += r.deficitMinutes;
        acc.balanceMins += r.netBalanceMinutes;
        if (r.statusType === 'present' || r.checkIn) acc.presentDays++;
        if (r.statusType === 'absent') acc.absentDays++;
        if (r.statusType === 'leave') acc.leaveDays++;
        return acc;
      },
      {
        breakMins: 0,
        workedMins: 0,
        delayMins: 0,
        earlyMins: 0,
        normalOTMins: 0,
        holidayOTMins: 0,
        deficitMins: 0,
        balanceMins: 0,
        presentDays: 0,
        absentDays: 0,
        leaveDays: 0,
      }
    );
  }, [fullRows]);

  const isNetPositive = tableTotals.balanceMins >= 0;
  const isLandscape = orientation === 'landscape';

  return (
    <div
      id={id}
      dir="rtl"
      className={`official-report-root bg-white text-neutral-900 font-sans p-4 sm:p-6 mx-auto leading-relaxed shadow-sm print:shadow-none print:p-0 print:m-0 print:max-w-none ${
        isLandscape
          ? 'max-w-[297mm] text-[10px] print-orientation-landscape'
          : 'max-w-[210mm] text-[9.5px] print-orientation-portrait'
      } ${className}`}
      style={{
        minHeight: isLandscape ? '205mm' : '290mm',
      }}
    >
      {/* 1. Official Header */}
      <header className="border-b-2 border-neutral-800 pb-2.5 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-black text-xs print:bg-black print:text-white">
              تردد
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-neutral-900">
                کارنامه و گزارش جامع تردد و کارکرد ماهانه پرسنل
              </h1>
              <p className="text-[9.5px] text-neutral-500 font-medium">
                شامل جزئیات دقیق ورود، خروج، موظفی، اضافه کاری، تاخیر، تعجیل و مرخصی‌ها
              </p>
            </div>
          </div>

          <div className="text-left font-mono text-[9.5px] text-neutral-600 space-y-0.5">
            <div>
              <span className="text-neutral-500 font-sans ml-1">دوره:</span>
              <strong className="text-neutral-900 font-sans font-bold">
                {selectedMonthName} {toPersianDigits(selectedYear)}
              </strong>
            </div>
            <div>
              <span className="text-neutral-500 font-sans ml-1">تاریخ صدور:</span>
              <span>{toPersianDigits(todayStr)}</span>
            </div>
          </div>
        </div>

        {/* Personnel & Shift Meta Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5 pt-2 border-t border-neutral-200 text-[9.5px] bg-neutral-50 p-2 rounded print:bg-neutral-100">
          <div>
            <span className="text-neutral-500 block">نام پرسنل:</span>
            <strong className="text-neutral-900 text-[10.5px] font-bold">
              {personnelName || 'کاربر سیستم'}
            </strong>
          </div>
          <div>
            <span className="text-neutral-500 block">نوع شیفت کاری:</span>
            <span className="text-neutral-800 font-medium">
              {config.isFlexibleShift
                ? `شناور (${toPersianDigits(config.flexStartTimeMin || '08:30')} الی ${toPersianDigits(config.flexStartTimeMax || '09:30')})`
                : `${toPersianDigits(config.startTime)} الی ${toPersianDigits(config.endTime)}`}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block">ساعت موظفی روزانه:</span>
            <span className="text-neutral-800 font-medium font-mono">
              {toPersianDigits(config.requiredDailyMinutes || 510)} دقیقه ({toPersianDigits(((config.requiredDailyMinutes || 510) / 60).toFixed(1))} س)
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block">وضعیت پنج‌شنبه:</span>
            <span className="text-neutral-800 font-medium">
              {config.thursdayStatus === 'off'
                ? 'تعطیل هفتگی'
                : config.thursdayStatus === 'half_day'
                ? `نیمه‌وقت (${toPersianDigits(config.thursdayMinutes || 240)} د)`
                : 'تمام‌وقت'}
            </span>
          </div>
        </div>
      </header>

      {/* 2. Executive Metrics Summary Grid (Key KPI Boxes) */}
      <section className="mb-3">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
          {/* Required */}
          <div className="border border-neutral-300 rounded p-1.5 bg-neutral-50 print:bg-neutral-50">
            <span className="text-[8.5px] text-neutral-500 block mb-0.5">موظفی دوره</span>
            <strong className="text-[11.5px] font-mono text-neutral-900 block font-bold">
              {toPersianDigits(formatMinutesToTimeString(stats.totalRequiredMinutes))}
            </strong>
            <span className="text-[8px] text-neutral-500 block font-mono">
              ({toPersianDigits(stats.workingDaysCount)} روز کاری)
            </span>
          </div>

          {/* Worked */}
          <div className="border border-neutral-300 rounded p-1.5 bg-neutral-50 print:bg-neutral-50">
            <span className="text-[8.5px] text-neutral-500 block mb-0.5">کارکرد خالص</span>
            <strong className="text-[11.5px] font-mono text-neutral-900 block font-black">
              {toPersianDigits(formatMinutesToTimeString(tableTotals.workedMins))}
            </strong>
            <span className="text-[8px] text-neutral-500 block">
              تحقق: {toPersianDigits(stats.completionRate)}%
            </span>
          </div>

          {/* Overtime (Separated Normal & Holiday) */}
          <div className="border border-neutral-300 rounded p-1.5 bg-neutral-50 print:bg-neutral-50">
            <span className="text-[8.5px] text-neutral-500 block mb-0.5">اضافه کار کل</span>
            <strong className="text-[11.5px] font-mono text-neutral-900 block font-bold">
              {toPersianDigits(
                formatMinutesToTimeString(tableTotals.normalOTMins + tableTotals.holidayOTMins)
              )}
            </strong>
            <span className="text-[8px] text-neutral-500 block font-mono">
              عادی: {toPersianDigits(formatMinutesToTimeString(tableTotals.normalOTMins))} | تعطیل: {toPersianDigits(formatMinutesToTimeString(tableTotals.holidayOTMins))}
            </span>
          </div>

          {/* Delays & Early Departure */}
          <div className="border border-neutral-300 rounded p-1.5 bg-neutral-50 print:bg-neutral-50">
            <span className="text-[8.5px] text-neutral-500 block mb-0.5">تاخیر و تعجیل</span>
            <strong className="text-[11.5px] font-mono text-neutral-900 block font-bold">
              {toPersianDigits(tableTotals.delayMins + tableTotals.earlyMins)} دقیقه
            </strong>
            <span className="text-[8px] text-neutral-500 block font-mono">
              تاخیر: {toPersianDigits(tableTotals.delayMins)}د | تعجیل: {toPersianDigits(tableTotals.earlyMins)}د
            </span>
          </div>

          {/* Leaves */}
          <div className="border border-neutral-300 rounded p-1.5 bg-neutral-50 print:bg-neutral-50">
            <span className="text-[8.5px] text-neutral-500 block mb-0.5">مرخصی کل</span>
            <strong className="text-[11.5px] font-mono text-neutral-900 block font-bold">
              {toPersianDigits(stats.totalLeaveHours)} ساعت
            </strong>
            <span className="text-[8px] text-neutral-500 block font-mono">
              استفاده: {toPersianDigits(stats.totalLeaveDays)} روز
            </span>
          </div>

          {/* Net Balance */}
          <div className="border border-neutral-300 rounded p-1.5 bg-neutral-50 print:bg-neutral-50">
            <span className="text-[8.5px] text-neutral-500 block mb-0.5">تراز خالص کارکرد</span>
            <strong className="text-[11.5px] font-mono block font-black text-neutral-900">
              {isNetPositive ? '+' : '-'}
              {toPersianDigits(formatMinutesToTimeString(Math.abs(tableTotals.balanceMins)))}
            </strong>
            <span className="text-[8px] text-neutral-500 block">
              {isNetPositive ? 'مازاد اضافه کار' : 'کسری کارکرد'}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Comprehensive Detailed Month Attendance Table (ALL 16 COLUMNS) */}
      <section className="mb-3">
        <table className="w-full text-right border-collapse border border-neutral-400 text-[9px] print:text-[8.5px]">
          <thead>
            <tr className="bg-neutral-100 text-neutral-900 font-bold border-b border-neutral-400 text-center">
              <th className="py-1 px-1 border-l border-neutral-300 w-6">ردیف</th>
              <th className="py-1 px-1.5 border-l border-neutral-300 w-16">تاریخ</th>
              <th className="py-1 px-1 border-l border-neutral-300 w-12">روز</th>
              <th className="py-1 px-1.5 border-l border-neutral-300 w-24 text-right">وضعیت</th>
              <th className="py-1 px-1 border-l border-neutral-300 font-mono w-11">ورود</th>
              <th className="py-1 px-1 border-l border-neutral-300 font-mono w-11">خروج</th>
              <th className="py-1 px-1 border-l border-neutral-300 font-mono w-11">خروج هدف</th>
              <th className="py-1 px-1 border-l border-neutral-300 font-mono w-9">ناهار</th>
              <th className="py-1 px-1.5 border-l border-neutral-300 font-mono w-13">کارکرد مفید</th>
              <th className="py-1 px-1 border-l border-neutral-300 font-mono w-9">تاخیر</th>
              <th className="py-1 px-1 border-l border-neutral-300 font-mono w-9">تعجیل</th>
              <th className="py-1 px-1.5 border-l border-neutral-300 font-mono w-12">اضافه عادی</th>
              <th className="py-1 px-1.5 border-l border-neutral-300 font-mono w-12">اضافه تعطیل</th>
              <th className="py-1 px-1 border-l border-neutral-300 font-mono w-9">کسر کار</th>
              <th className="py-1 px-1.5 border-l border-neutral-300 font-mono w-12">تراز روز</th>
              <th className="py-1 px-2 text-right">توضیحات و مرخصی</th>
            </tr>
          </thead>
          <tbody>
            {fullRows.map((r, idx) => {
              const isEven = idx % 2 === 0;
              const isWeekendRow = r.isFriday;
              const isHolidayRow = r.isHoliday && !r.isFriday;
              const isIncomplete = Boolean(r.checkIn && !r.checkOut && r.date < todayStr);

              const rowBg = isIncomplete
                ? 'bg-amber-50 font-medium'
                : isWeekendRow
                ? 'bg-neutral-100 font-medium'
                : isHolidayRow
                ? 'bg-neutral-50'
                : isEven
                ? 'bg-white'
                : 'bg-neutral-50/60';

              return (
                <tr
                  key={r.date}
                  className={`border-b border-neutral-200 ${rowBg}`}
                  style={{ pageBreakInside: 'avoid' }}
                >
                  {/* ردیف */}
                  <td className="py-0.5 px-1 border-l border-neutral-200 text-center font-mono text-[8px] text-neutral-500">
                    {toPersianDigits(r.dayNumber)}
                  </td>

                  {/* تاریخ */}
                  <td className="py-0.5 px-1.5 border-l border-neutral-200 font-mono text-center">
                    {toPersianDigits(r.date)}
                  </td>

                  {/* روز */}
                  <td className="py-0.5 px-1 border-l border-neutral-200 text-center font-medium">
                    <span className={r.isFriday ? 'font-bold text-neutral-900' : ''}>
                      {r.weekdayName}
                    </span>
                  </td>

                  {/* وضعیت */}
                  <td className="py-0.5 px-1.5 border-l border-neutral-200">
                    <span className="block truncate max-w-[130px]" title={r.status}>
                      {r.status}
                    </span>
                  </td>

                  {/* ورود */}
                  <td className="py-0.5 px-1 border-l border-neutral-200 text-center font-mono font-medium">
                    {r.checkIn ? toPersianDigits(r.checkIn) : '-'}
                  </td>

                  {/* خروج */}
                  <td className="py-0.5 px-1 border-l border-neutral-200 text-center font-mono font-medium">
                    {r.checkOut ? toPersianDigits(r.checkOut) : '-'}
                  </td>

                  {/* خروج هدف */}
                  <td className="py-0.5 px-1 border-l border-neutral-200 text-center font-mono text-neutral-700">
                    {r.targetCheckOut ? toPersianDigits(r.targetCheckOut) : '-'}
                  </td>

                  {/* ناهار */}
                  <td className="py-0.5 px-1 border-l border-neutral-200 text-center font-mono text-neutral-500">
                    {r.breakMinutes > 0 ? toPersianDigits(r.breakMinutes) : '-'}
                  </td>

                  {/* کارکرد خالص */}
                  <td className="py-0.5 px-1.5 border-l border-neutral-200 text-center font-mono font-bold">
                    {r.workedMinutes > 0
                      ? toPersianDigits(formatMinutesToTimeString(r.workedMinutes))
                      : '-'}
                  </td>

                  {/* تاخیر */}
                  <td className="py-0.5 px-1 border-l border-neutral-200 text-center font-mono">
                    {r.delayMinutes > 0 ? toPersianDigits(r.delayMinutes) : '-'}
                  </td>

                  {/* تعجیل */}
                  <td className="py-0.5 px-1 border-l border-neutral-200 text-center font-mono">
                    {r.earlyLeaveMinutes > 0 ? toPersianDigits(r.earlyLeaveMinutes) : '-'}
                  </td>

                  {/* اضافه کار عادی */}
                  <td className="py-0.5 px-1.5 border-l border-neutral-200 text-center font-mono">
                    {r.overtimeMinutes > 0
                      ? toPersianDigits(formatMinutesToTimeString(r.overtimeMinutes))
                      : '-'}
                  </td>

                  {/* اضافه کار تعطیل */}
                  <td className="py-0.5 px-1.5 border-l border-neutral-200 text-center font-mono">
                    {r.holidayOvertimeMinutes > 0
                      ? toPersianDigits(formatMinutesToTimeString(r.holidayOvertimeMinutes))
                      : '-'}
                  </td>

                  {/* کسر کار */}
                  <td className="py-0.5 px-1 border-l border-neutral-200 text-center font-mono">
                    {r.deficitMinutes > 0 ? toPersianDigits(r.deficitMinutes) : '-'}
                  </td>

                  {/* تراز روز */}
                  <td className="py-0.5 px-1.5 border-l border-neutral-200 text-center font-mono font-bold">
                    {r.netBalanceMinutes !== 0
                      ? (r.netBalanceMinutes > 0 ? '+' : '-') +
                        toPersianDigits(formatMinutesToTimeString(Math.abs(r.netBalanceMinutes)))
                      : '-'}
                  </td>

                  {/* توضیحات و مرخصی - کاملاً بدون بریدگی */}
                  <td className="py-0.5 px-2 text-right text-[8.5px] text-neutral-700 whitespace-normal break-words leading-tight">
                    {r.leaveDescription && (
                      <span className="font-semibold text-neutral-900 ml-1">
                        [{r.leaveDescription}]
                      </span>
                    )}
                    {r.note || (!r.leaveDescription ? '-' : '')}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Table Summary Footer */}
          <tfoot>
            <tr className="bg-neutral-200 text-neutral-900 font-bold border-t-2 border-neutral-500 text-[9px] print:text-[8.5px]">
              <td colSpan={4} className="py-1 px-2 border-l border-neutral-400 font-bold text-center">
                جمع کل کارنامه ماهانه ({toPersianDigits(fullRows.length)} روز تقویمی / {toPersianDigits(tableTotals.presentDays)} روز حضور)
              </td>
              <td colSpan={3} className="py-1 px-1 border-l border-neutral-400 text-center font-mono text-[8.5px]">
                {toPersianDigits(tableTotals.presentDays)} روز ثبت تردد
              </td>
              <td className="py-1 px-1 border-l border-neutral-400 text-center font-mono">
                {tableTotals.breakMins > 0 ? toPersianDigits(tableTotals.breakMins) : '-'}
              </td>
              <td className="py-1 px-1.5 border-l border-neutral-400 text-center font-mono font-black">
                {toPersianDigits(formatMinutesToTimeString(tableTotals.workedMins))}
              </td>
              <td className="py-1 px-1 border-l border-neutral-400 text-center font-mono">
                {tableTotals.delayMins > 0 ? `${toPersianDigits(tableTotals.delayMins)}د` : '۰'}
              </td>
              <td className="py-1 px-1 border-l border-neutral-400 text-center font-mono">
                {tableTotals.earlyMins > 0 ? `${toPersianDigits(tableTotals.earlyMins)}د` : '۰'}
              </td>
              <td className="py-1 px-1.5 border-l border-neutral-400 text-center font-mono font-bold">
                {tableTotals.normalOTMins > 0
                  ? toPersianDigits(formatMinutesToTimeString(tableTotals.normalOTMins))
                  : '۰'}
              </td>
              <td className="py-1 px-1.5 border-l border-neutral-400 text-center font-mono font-bold">
                {tableTotals.holidayOTMins > 0
                  ? toPersianDigits(formatMinutesToTimeString(tableTotals.holidayOTMins))
                  : '۰'}
              </td>
              <td className="py-1 px-1 border-l border-neutral-400 text-center font-mono">
                {tableTotals.deficitMins > 0 ? `${toPersianDigits(tableTotals.deficitMins)}د` : '۰'}
              </td>
              <td className="py-1 px-1.5 border-l border-neutral-400 text-center font-mono font-black">
                {isNetPositive ? '+' : '-'}
                {toPersianDigits(formatMinutesToTimeString(Math.abs(tableTotals.balanceMins)))}
              </td>
              <td className="py-1 px-2 text-right text-[8.5px]">
                مرخصی کل: {toPersianDigits(stats.totalLeaveHours)} ساعت ({toPersianDigits(stats.totalLeaveDays)} روز)
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* 4. Financial Calculations Block (Optional) */}
      {showFinancials && config.hourlyRateToman && config.hourlyRateToman > 0 && (
        <section
          className="mb-3 border border-neutral-300 rounded p-2 bg-neutral-50 text-[9.5px] print:bg-neutral-50"
          style={{ pageBreakInside: 'avoid' }}
        >
          <div className="flex items-center justify-between border-b border-neutral-300 pb-1 mb-1.5">
            <h3 className="font-bold text-neutral-900">برآورد ریالی اضافه کاری و دستمزد دوره</h3>
            <span className="text-[9px] text-neutral-600 font-mono">
              نرخ پایه ساعتی مصوب: {toPersianDigits(config.hourlyRateToman.toLocaleString())} تومان
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-neutral-500 block text-[8.5px]">
                اضافه کار عادی ({toPersianDigits(config.overtimeMultiplier || 1.4)}x)
              </span>
              <strong className="font-mono text-neutral-900">
                {toPersianDigits(
                  Math.round(
                    (tableTotals.normalOTMins / 60) *
                      config.hourlyRateToman *
                      (config.overtimeMultiplier || 1.4)
                  ).toLocaleString()
                )}{' '}
                تومان
              </strong>
            </div>

            <div>
              <span className="text-neutral-500 block text-[8.5px]">
                اضافه کار تعطیل ({toPersianDigits(config.holidayMultiplier || 1.8)}x)
              </span>
              <strong className="font-mono text-neutral-900">
                {toPersianDigits(
                  Math.round(
                    (tableTotals.holidayOTMins / 60) *
                      config.hourlyRateToman *
                      (config.holidayMultiplier || 1.8)
                  ).toLocaleString()
                )}{' '}
                تومان
              </strong>
            </div>

            <div>
              <span className="text-neutral-500 block text-[8.5px]">کل برآورد ناخالص اضافه کاری</span>
              <strong className="font-mono font-black text-neutral-900 text-[11px]">
                {toPersianDigits(
                  Math.round(
                    (tableTotals.normalOTMins / 60) *
                      config.hourlyRateToman *
                      (config.overtimeMultiplier || 1.4) +
                      (tableTotals.holidayOTMins / 60) *
                        config.hourlyRateToman *
                        (config.holidayMultiplier || 1.8)
                  ).toLocaleString()
                )}{' '}
                تومان
              </strong>
            </div>
          </div>
        </section>
      )}

      {/* 5. Signatures and Approvals (Optional) */}
      {showSignatures && (
        <footer
          className="mt-4 pt-2.5 border-t border-neutral-300 text-[9.5px]"
          style={{ pageBreakInside: 'avoid' }}
        >
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="space-y-8">
              <span className="text-neutral-700 font-medium block">امضای پرسنل</span>
              <div className="border-b border-neutral-300 w-3/4 mx-auto"></div>
            </div>

            <div className="space-y-8">
              <span className="text-neutral-700 font-medium block">تایید مدیر مستقیم</span>
              <div className="border-b border-neutral-300 w-3/4 mx-auto"></div>
            </div>

            <div className="space-y-8">
              <span className="text-neutral-700 font-medium block">امور اداری و منابع انسانی</span>
              <div className="border-b border-neutral-300 w-3/4 mx-auto"></div>
            </div>

            <div className="space-y-8">
              <span className="text-neutral-700 font-medium block">واحد مالی و حسابداری</span>
              <div className="border-b border-neutral-300 w-3/4 mx-auto"></div>
            </div>
          </div>

          <div className="text-center text-[8.5px] text-neutral-400 mt-3">
            کارنامه تردد توسط سامانه تردد هوشمند ثبت و پردازش شده و فاقد خط‌خوردگی معتبر است.
          </div>
        </footer>
      )}
    </div>
  );
};
