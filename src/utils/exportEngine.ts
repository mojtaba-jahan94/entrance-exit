import { AttendanceRecord, LeaveRecord, ShiftConfig, MonthlyStats } from '../types';
import {
  PERSIAN_WEEKDAY_NAMES,
  getDaysInJalaliMonth,
  formatJalaliDate,
  getJalaliWeekdayIndex,
  checkOfficialHoliday,
  getTodayJalaliString,
  formatMinutesToTimeString,
  formatMinutesToPersianReadable,
  toPersianDigits,
} from './jalali';
import { calculateMonthlyStats } from './calculator';

export interface FullMonthDayRow {
  dayNumber: number;
  date: string;
  weekdayIndex: number;
  weekdayName: string;
  status: string;
  statusType: 'present' | 'absent' | 'leave' | 'holiday' | 'weekend' | 'in_progress' | 'unrecorded';
  isHoliday: boolean;
  isFriday: boolean;
  checkIn: string | null;
  checkOut: string | null;
  targetCheckOut?: string;
  breakMinutes: number;
  workedMinutes: number;
  delayMinutes: number;
  earlyLeaveMinutes: number;
  overtimeMinutes: number;
  holidayOvertimeMinutes: number;
  deficitMinutes: number;
  netBalanceMinutes: number;
  leaveDescription?: string;
  note: string;
}

/**
 * Builds a continuous, complete 1-to-N list of all days in the given Jalali month,
 * combining recorded attendance, leave requests, official holidays, and shift configuration.
 */
export function buildFullMonthRows(
  records: AttendanceRecord[],
  leaves: LeaveRecord[],
  config: ShiftConfig,
  jy: number,
  jm: number
): FullMonthDayRow[] {
  const daysInMonth = getDaysInJalaliMonth(jy, jm);
  const todayStr = getTodayJalaliString();
  const standardDailyNetMinutes = Math.max(
    60,
    (config.requiredDailyMinutes || 510) - (config.defaultBreakMinutes || 30)
  );

  const monthPrefix = `${jy}/${jm < 10 ? '0' + jm : jm}/`;
  const monthRecords = records.filter((r) => r.date.startsWith(monthPrefix));
  const monthLeaves = leaves.filter((l) => l.date.startsWith(monthPrefix) && l.approved !== false);

  const rows: FullMonthDayRow[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatJalaliDate(jy, jm, day);
    const weekdayIndex = getJalaliWeekdayIndex(dateStr);
    const weekdayName = PERSIAN_WEEKDAY_NAMES[weekdayIndex] || '';
    const holidayInfo = checkOfficialHoliday(jy, jm, day);
    const isFriday = weekdayIndex === 6;
    const isThursday = weekdayIndex === 5;

    const existingRecord = monthRecords.find((r) => r.date === dateStr);
    const dayLeaves = monthLeaves.filter((l) => l.date === dateStr);

    if (existingRecord) {
      let statusText = 'حاضر';
      let statusType: FullMonthDayRow['statusType'] = 'present';

      if (existingRecord.status === 'absent') {
        statusText = 'غایب';
        statusType = 'absent';
      } else if (existingRecord.status === 'leave') {
        const primaryLeave = dayLeaves[0];
        const leaveLabel = primaryLeave
          ? primaryLeave.type === 'sick'
            ? 'مرخصی استعلاجی'
            : primaryLeave.type === 'daily'
            ? 'مرخصی روزانه'
            : primaryLeave.type === 'hourly'
            ? 'مرخصی ساعتی'
            : 'مرخصی'
          : 'مرخصی';
        statusText = leaveLabel;
        statusType = 'leave';
      } else if (existingRecord.status === 'holiday') {
        statusText = `تعطیل رسمی${existingRecord.holidayTitle ? ` (${existingRecord.holidayTitle})` : ''}`;
        statusType = 'holiday';
      } else if (existingRecord.status === 'weekend') {
        statusText = isFriday ? 'جمعه (تعطیل هفتگی)' : 'تعطیل پایان هفته';
        statusType = 'weekend';
      } else if (existingRecord.status === 'in_progress') {
        if (dateStr < todayStr) {
          statusText = 'خروج ثبت‌نشده (ناقص)';
          statusType = 'in_progress';
        } else {
          statusText = 'در حال کار';
          statusType = 'in_progress';
        }
      }

      rows.push({
        dayNumber: day,
        date: dateStr,
        weekdayIndex,
        weekdayName,
        status: statusText,
        statusType,
        isHoliday: Boolean(existingRecord.isHoliday || holidayInfo.isHoliday || isFriday),
        isFriday,
        checkIn: existingRecord.checkIn,
        checkOut: existingRecord.checkOut,
        targetCheckOut: existingRecord.targetCheckOut,
        breakMinutes: existingRecord.breakMinutes || 0,
        workedMinutes: existingRecord.workedMinutes || 0,
        delayMinutes: existingRecord.delayMinutes || 0,
        earlyLeaveMinutes: existingRecord.earlyLeaveMinutes || 0,
        overtimeMinutes: existingRecord.overtimeMinutes || 0,
        holidayOvertimeMinutes: existingRecord.holidayOvertimeMinutes || 0,
        deficitMinutes: existingRecord.deficitMinutes || 0,
        netBalanceMinutes: existingRecord.netBalanceMinutes || 0,
        leaveDescription:
          dayLeaves.length > 0
            ? dayLeaves
                .map((l) => `${l.type === 'hourly' ? 'ساعتی' : 'روزانه'}: ${l.hours}س`)
                .join(', ')
            : undefined,
        note: existingRecord.note || '',
      });
    } else {
      // Day has no explicit AttendanceRecord
      if (isFriday) {
        rows.push({
          dayNumber: day,
          date: dateStr,
          weekdayIndex,
          weekdayName,
          status: 'جمعه (تعطیل هفتگی)',
          statusType: 'weekend',
          isHoliday: true,
          isFriday: true,
          checkIn: null,
          checkOut: null,
          breakMinutes: 0,
          workedMinutes: 0,
          delayMinutes: 0,
          earlyLeaveMinutes: 0,
          overtimeMinutes: 0,
          holidayOvertimeMinutes: 0,
          deficitMinutes: 0,
          netBalanceMinutes: 0,
          note: '',
        });
      } else if (holidayInfo.isHoliday) {
        rows.push({
          dayNumber: day,
          date: dateStr,
          weekdayIndex,
          weekdayName,
          status: `تعطیل رسمی${holidayInfo.title ? ` (${holidayInfo.title})` : ''}`,
          statusType: 'holiday',
          isHoliday: true,
          isFriday: false,
          checkIn: null,
          checkOut: null,
          breakMinutes: 0,
          workedMinutes: 0,
          delayMinutes: 0,
          earlyLeaveMinutes: 0,
          overtimeMinutes: 0,
          holidayOvertimeMinutes: 0,
          deficitMinutes: 0,
          netBalanceMinutes: 0,
          note: holidayInfo.title || '',
        });
      } else if (isThursday && config.thursdayStatus === 'off') {
        rows.push({
          dayNumber: day,
          date: dateStr,
          weekdayIndex,
          weekdayName,
          status: 'پنج‌شنبه تعطیل',
          statusType: 'weekend',
          isHoliday: true,
          isFriday: false,
          checkIn: null,
          checkOut: null,
          breakMinutes: 0,
          workedMinutes: 0,
          delayMinutes: 0,
          earlyLeaveMinutes: 0,
          overtimeMinutes: 0,
          holidayOvertimeMinutes: 0,
          deficitMinutes: 0,
          netBalanceMinutes: 0,
          note: '',
        });
      } else if (dayLeaves.length > 0) {
        const primaryLeave = dayLeaves[0];
        const leaveMins = primaryLeave.minutes || primaryLeave.hours * 60;
        const leaveLabel =
          primaryLeave.type === 'sick'
            ? 'مرخصی استعلاجی'
            : primaryLeave.type === 'daily'
            ? 'مرخصی روزانه'
            : primaryLeave.type === 'hourly'
            ? 'مرخصی ساعتی'
            : 'مرخصی';

        rows.push({
          dayNumber: day,
          date: dateStr,
          weekdayIndex,
          weekdayName,
          status: leaveLabel,
          statusType: 'leave',
          isHoliday: false,
          isFriday: false,
          checkIn: null,
          checkOut: null,
          breakMinutes: 0,
          workedMinutes: leaveMins,
          delayMinutes: 0,
          earlyLeaveMinutes: 0,
          overtimeMinutes: 0,
          holidayOvertimeMinutes: 0,
          deficitMinutes: 0,
          netBalanceMinutes: 0,
          leaveDescription: `${primaryLeave.hours} ساعت ${primaryLeave.reason ? `(${primaryLeave.reason})` : ''}`,
          note: primaryLeave.reason || '',
        });
      } else if (dateStr < todayStr) {
        // Past working day without punch or leave
        const deficit = isThursday && config.thursdayStatus === 'half_day'
          ? (config.thursdayMinutes || 240)
          : standardDailyNetMinutes;

        rows.push({
          dayNumber: day,
          date: dateStr,
          weekdayIndex,
          weekdayName,
          status: 'غیبت',
          statusType: 'absent',
          isHoliday: false,
          isFriday: false,
          checkIn: null,
          checkOut: null,
          breakMinutes: 0,
          workedMinutes: 0,
          delayMinutes: 0,
          earlyLeaveMinutes: 0,
          overtimeMinutes: 0,
          holidayOvertimeMinutes: 0,
          deficitMinutes: deficit,
          netBalanceMinutes: -deficit,
          note: 'عدم ثبت تردد',
        });
      } else {
        // Future unrecorded date
        rows.push({
          dayNumber: day,
          date: dateStr,
          weekdayIndex,
          weekdayName,
          status: 'ثبت نشده',
          statusType: 'unrecorded',
          isHoliday: false,
          isFriday: false,
          checkIn: null,
          checkOut: null,
          breakMinutes: 0,
          workedMinutes: 0,
          delayMinutes: 0,
          earlyLeaveMinutes: 0,
          overtimeMinutes: 0,
          holidayOvertimeMinutes: 0,
          deficitMinutes: 0,
          netBalanceMinutes: 0,
          note: '',
        });
      }
    }
  }

  return rows;
}

/**
 * Downloads a binary Buffer/Blob safely in modern browsers and node test environments.
 */
function triggerFileDownload(data: ArrayBuffer, fileName: string, mimeType: string): void {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }
}

/**
 * Exports full month attendance and analytics into a professionally formatted Excel (.xlsx) file.
 */
export async function exportMonthToExcelAdvanced(
  records: AttendanceRecord[],
  leaves: LeaveRecord[] = [],
  config: ShiftConfig,
  jy: number,
  jm: number,
  monthName: string,
  personnelName?: string
): Promise<{ success: boolean; fileName: string; rowCount: number }> {
  const XLSX = await import('xlsx');
  const fullRows = buildFullMonthRows(records, leaves, config, jy, jm);
  const stats = calculateMonthlyStats(records, jy, jm, config, leaves);

  // 1. Build Data Rows for Sheet 1
  const excelDataRows = fullRows.map((r) => ({
    'ردیف': r.dayNumber,
    'تاریخ (شمسی)': r.date,
    'روز هفته': r.weekdayName,
    'وضعیت': r.status,
    'ساعت ورود': r.checkIn || '-',
    'ساعت خروج': r.checkOut || '-',
    'خروج موظفی هدف': r.targetCheckOut || '-',
    'استراحت (دقیقه)': r.breakMinutes > 0 ? r.breakMinutes : 0,
    'کارکرد خالص (ساعت)': r.workedMinutes > 0 ? formatMinutesToTimeString(r.workedMinutes) : '-',
    'تاخیر ورود (دقیقه)': r.delayMinutes > 0 ? r.delayMinutes : 0,
    'تعجیل خروج (دقیقه)': r.earlyLeaveMinutes > 0 ? r.earlyLeaveMinutes : 0,
    'اضافه کار عادی (ساعت)': r.overtimeMinutes > 0 ? formatMinutesToTimeString(r.overtimeMinutes) : '-',
    'اضافه کار تعطیل (ساعت)': r.holidayOvertimeMinutes > 0 ? formatMinutesToTimeString(r.holidayOvertimeMinutes) : '-',
    'کسر کار (دقیقه)': r.deficitMinutes > 0 ? r.deficitMinutes : 0,
    'تراز روز (ساعت)': r.netBalanceMinutes !== 0 ? formatMinutesToTimeString(r.netBalanceMinutes) : '00:00',
    'مرخصی': r.leaveDescription || '-',
    'یادداشت و توضیحات': r.note || '',
  }));

  // Totals Row
  const totalsRow = {
    'ردیف': 'جمع کل',
    'تاریخ (شمسی)': `${fullRows.length} روز`,
    'روز هفته': `موظفی: ${formatMinutesToTimeString(stats.totalRequiredMinutes)}`,
    'وضعیت': `${stats.presentDaysCount} روز حضور`,
    'ساعت ورود': '',
    'ساعت خروج': '',
    'خروج موظفی هدف': '',
    'استراحت (دقیقه)': fullRows.reduce((acc, curr) => acc + curr.breakMinutes, 0),
    'کارکرد خالص (ساعت)': formatMinutesToTimeString(stats.totalWorkedMinutes),
    'تاخیر ورود (دقیقه)': stats.totalDelayMinutes,
    'تعجیل خروج (دقیقه)': stats.totalEarlyLeaveMinutes,
    'اضافه کار عادی (ساعت)': stats.totalOvertimeMinutes > 0 ? formatMinutesToTimeString(stats.totalOvertimeMinutes) : '-',
    'اضافه کار تعطیل (ساعت)': stats.totalHolidayOvertimeMinutes > 0 ? formatMinutesToTimeString(stats.totalHolidayOvertimeMinutes) : '-',
    'کسر کار (دقیقه)': stats.totalDeficitMinutes,
    'تراز روز (ساعت)': formatMinutesToTimeString(stats.netBalanceMinutes),
    'مرخصی': `${toPersianDigits(stats.totalLeaveDays)} روز (${toPersianDigits(stats.totalLeaveHours)} ساعت)`,
    'یادداشت و توضیحات': `تراز ماه: ${stats.netBalanceMinutes >= 0 ? '+' : '-'}${formatMinutesToPersianReadable(Math.abs(stats.netBalanceMinutes))}`,
  };

  const sheet1Data = [...excelDataRows, totalsRow];
  const worksheet1 = XLSX.utils.json_to_sheet(sheet1Data);

  // Set Column Widths for Sheet 1
  worksheet1['!cols'] = [
    { wch: 8 },  // ردیف
    { wch: 14 }, // تاریخ
    { wch: 12 }, // روز هفته
    { wch: 22 }, // وضعیت
    { wch: 12 }, // ورود
    { wch: 12 }, // خروج
    { wch: 16 }, // خروج موظفی هدف
    { wch: 16 }, // استراحت
    { wch: 18 }, // کارکرد خالص
    { wch: 18 }, // تاخیر ورود
    { wch: 18 }, // تعجیل خروج
    { wch: 20 }, // اضافه کار عادی
    { wch: 20 }, // اضافه کار تعطیل
    { wch: 16 }, // کسر کار
    { wch: 16 }, // تراز روز
    { wch: 20 }, // مرخصی
    { wch: 28 }, // یادداشت
  ];

  // Set RTL on sheet 1
  worksheet1['!views'] = [{ RTL: true }];

  // 2. Build Sheet 2: Monthly & Financial Analytics Summary
  const executiveSummaryData = [
    { 'عنوان شاخص': 'نام و مشخصات پرسنل', 'مقدار': personnelName || 'کاربر سیستم', 'توضیحات': '' },
    { 'عنوان شاخص': 'دوره گزارش', 'مقدار': `${monthName} ${toPersianDigits(jy)}`, 'توضیحات': `از ۰۱ تا ${toPersianDigits(fullRows.length)} ${monthName}` },
    { 'عنوان شاخص': 'تاریخ استخراج گزارش', 'مقدار': toPersianDigits(getTodayJalaliString()), 'توضیحات': '' },
    { 'عنوان شاخص': 'کل روزهای تقویمی ماه', 'مقدار': `${toPersianDigits(fullRows.length)} روز`, 'توضیحات': '' },
    { 'عنوان شاخص': 'تعداد روزهای موظف کاری', 'مقدار': `${toPersianDigits(stats.workingDaysCount)} روز`, 'توضیحات': 'بدون احتساب جمعه‌ها و تعطیلات رسمی' },
    { 'عنوان شاخص': 'روزهای حضور ثبت‌شده', 'مقدار': `${toPersianDigits(stats.presentDaysCount)} روز`, 'توضیحات': '' },
    { 'عنوان شاخص': 'ساعات موظفی استاندارد دوره', 'مقدار': formatMinutesToTimeString(stats.totalRequiredMinutes), 'توضیحات': `${formatMinutesToPersianReadable(stats.totalRequiredMinutes)}` },
    { 'عنوان شاخص': 'کارکرد واقعی موثر ثبت‌شده', 'مقدار': formatMinutesToTimeString(stats.totalWorkedMinutes), 'توضیحات': `${formatMinutesToPersianReadable(stats.totalWorkedMinutes)}` },
    { 'عنوان شاخص': 'درصد تحقق موظفی', 'مقدار': `${toPersianDigits(stats.completionRate)}%`, 'توضیحات': 'نسبت کارکرد به موظفی' },
    { 'عنوان شاخص': 'اضافه کار عادی', 'مقدار': formatMinutesToTimeString(stats.totalOvertimeMinutes), 'توضیحات': `${toPersianDigits((stats.totalOvertimeMinutes / 60).toFixed(1))} ساعت` },
    { 'عنوان شاخص': 'اضافه کار تعطیل رسمی / جمعه', 'مقدار': formatMinutesToTimeString(stats.totalHolidayOvertimeMinutes), 'توضیحات': `${toPersianDigits((stats.totalHolidayOvertimeMinutes / 60).toFixed(1))} ساعت` },
    { 'عنوان شاخص': 'مجموع اضافه کار ماهانه', 'مقدار': formatMinutesToTimeString(stats.totalOvertimeMinutes + stats.totalHolidayOvertimeMinutes), 'توضیحات': '' },
    { 'عنوان شاخص': 'مجموع تاخیر ورود', 'مقدار': `${toPersianDigits(stats.totalDelayMinutes)} دقیقه`, 'توضیحات': '' },
    { 'عنوان شاخص': 'مجموع تعجیل خروج', 'مقدار': `${toPersianDigits(stats.totalEarlyLeaveMinutes)} دقیقه`, 'توضیحات': '' },
    { 'عنوان شاخص': 'مجموع کسر کار', 'مقدار': `${toPersianDigits(stats.totalDeficitMinutes)} دقیقه`, 'توضیحات': '' },
    { 'عنوان شاخص': 'تراز کارکرد (خالص)', 'مقدار': `${stats.netBalanceMinutes >= 0 ? '+' : '-'}${formatMinutesToTimeString(Math.abs(stats.netBalanceMinutes))}`, 'توضیحات': stats.netBalanceMinutes >= 0 ? 'مازاد اضافه کار بر کسر کار' : 'کسر کار بیشتر از اضافه کار' },
    { 'عنوان شاخص': 'مرخصی استفاده‌شده', 'مقدار': `${toPersianDigits(stats.totalLeaveDays)} روز (${toPersianDigits(stats.totalLeaveHours)} ساعت)`, 'توضیحات': '' },
  ];

  if (config.hourlyRateToman && config.hourlyRateToman > 0) {
    const regularOtToman = Math.round(
      (stats.totalOvertimeMinutes / 60) * config.hourlyRateToman * (config.overtimeMultiplier || 1.4)
    );
    const holidayOtToman = Math.round(
      (stats.totalHolidayOvertimeMinutes / 60) * config.hourlyRateToman * (config.holidayMultiplier || 1.8)
    );
    executiveSummaryData.push(
      { 'عنوان شاخص': 'نرخ دستمزد ساعتی پایه', 'مقدار': `${toPersianDigits(config.hourlyRateToman.toLocaleString())} تومان`, 'توضیحات': '' },
      { 'عنوان شاخص': 'برآورد اضافه کار عادی', 'مقدار': `${toPersianDigits(regularOtToman.toLocaleString())} تومان`, 'توضیحات': `ضریب ${toPersianDigits(config.overtimeMultiplier || 1.4)}` },
      { 'عنوان شاخص': 'برآورد اضافه کار تعطیلات', 'مقدار': `${toPersianDigits(holidayOtToman.toLocaleString())} تومان`, 'توضیحات': `ضریب ${toPersianDigits(config.holidayMultiplier || 1.8)}` },
      { 'عنوان شاخص': 'کل برآورد ریالی اضافه کاری', 'مقدار': `${toPersianDigits((stats.estimatedOvertimePay || (regularOtToman + holidayOtToman)).toLocaleString())} تومان`, 'توضیحات': 'برآورد کارگاهی قانون کار' }
    );
  }

  const worksheet2 = XLSX.utils.json_to_sheet(executiveSummaryData);
  worksheet2['!cols'] = [
    { wch: 32 }, // عنوان شاخص
    { wch: 28 }, // مقدار
    { wch: 36 }, // توضیحات
  ];
  worksheet2['!views'] = [{ RTL: true }];

  // 3. Assemble Workbook
  const workbook = XLSX.utils.book_new();
  // Set RTL for the workbook view in Microsoft Excel
  (workbook as any).Workbook = { Views: [{ RTL: true }] };

  XLSX.utils.book_append_sheet(workbook, worksheet1, `کارکرد ${monthName} ${jy}`);
  XLSX.utils.book_append_sheet(workbook, worksheet2, 'خلاصه تحلیلی و مالی');

  const fileName = `گزارش_تردد_${monthName}_${jy}.xlsx`;

  // Write using safe buffer download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  triggerFileDownload(
    excelBuffer,
    fileName,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
  );

  return {
    success: true,
    fileName,
    rowCount: fullRows.length,
  };
}
