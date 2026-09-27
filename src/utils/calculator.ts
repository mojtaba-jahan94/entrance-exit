import { AttendanceRecord, ShiftConfig, MonthlyStats, LeaveRecord } from '../types';
import {
  timeStringToMinutes,
  getJalaliWeekdayIndex,
  parseJalaliDate,
  checkOfficialHoliday,
  formatMinutesToTimeString,
} from './jalali';

export const DEFAULT_SHIFT_CONFIG: ShiftConfig = {
  startTime: '08:30',
  endTime: '17:00',
  isFlexibleShift: true,
  flexStartTimeMin: '08:30',
  flexStartTimeMax: '09:30',
  flexDepartureMin: '17:00',
  flexDepartureMax: '18:00',
  requiredDailyMinutes: 510, // 8 hours and 30 mins total presence
  defaultBreakMinutes: 30, // 30 minutes lunch/break excluded from work hours
  graceMinutes: 0,
  thursdayStatus: 'half_day',
  thursdayMinutes: 270, // 4 hours and 30 mins
  fridayStatus: 'off',
  monthlyLeaveDays: 2.5, // 2.5 days per month
  monthlyLeaveQuotaHours: 20, // 20 hours (2.5 days * 8h)
  overtimeMultiplier: 1.4,
  holidayMultiplier: 1.8,
  hourlyRateToman: 0,
};

/**
 * Calculates attendance metrics for a single day record
 */
export function calculateAttendanceMetrics(
  record: Partial<AttendanceRecord> & { date: string },
  config: ShiftConfig
): AttendanceRecord {
  const { jy, jm, jd } = parseJalaliDate(record.date);
  const weekday = getJalaliWeekdayIndex(record.date);
  const holidayInfo = checkOfficialHoliday(jy, jm, jd);
  const isFriday = weekday === 6;
  const isThursday = weekday === 5;
  const isHoliday = isFriday || holidayInfo.isHoliday || false;

  // Determine required presence minutes and net working minutes for this day
  let requiredPresenceMinutes = config.requiredDailyMinutes || 510;
  let netRequiredMinutes = Math.max(0, requiredPresenceMinutes - (config.defaultBreakMinutes || 30)); // 480 mins (8 hours)

  if (isFriday || holidayInfo.isHoliday) {
    requiredPresenceMinutes = 0;
    netRequiredMinutes = 0;
  } else if (isThursday) {
    if (config.thursdayStatus === 'off') {
      requiredPresenceMinutes = 0;
      netRequiredMinutes = 0;
    } else if (config.thursdayStatus === 'half_day') {
      requiredPresenceMinutes = config.thursdayMinutes || 270;
      netRequiredMinutes = config.thursdayMinutes || 270; // 4.5 hours net
    } else {
      requiredPresenceMinutes = config.requiredDailyMinutes || 510;
      netRequiredMinutes = Math.max(0, requiredPresenceMinutes - (config.defaultBreakMinutes || 30));
    }
  }

  const checkIn = record.checkIn || null;
  const checkOut = record.checkOut || null;
  // Default break is 30 mins on full days, 0 on Thursdays/holidays unless specified
  const breakMinutes =
    record.breakMinutes !== undefined
      ? record.breakMinutes
      : isThursday || isHoliday
      ? 0
      : config.defaultBreakMinutes ?? 30;

  let delayMinutes = 0;
  let earlyLeaveMinutes = 0;
  let workedMinutes = 0;
  let overtimeMinutes = 0;
  let holidayOvertimeMinutes = 0;
  let deficitMinutes = 0;
  let netBalanceMinutes = 0;
  let targetCheckOut: string | undefined = undefined;
  let status = record.status || 'present';

  if (!checkIn && !checkOut) {
    // No check-in or check-out recorded
    if (isFriday) {
      status = 'weekend';
    } else if (holidayInfo.isHoliday) {
      status = 'holiday';
    } else if (isThursday && config.thursdayStatus === 'off') {
      status = 'weekend';
    } else {
      status = record.status === 'leave' ? 'leave' : 'absent';
      if (status === 'absent') {
        deficitMinutes = netRequiredMinutes;
        netBalanceMinutes = -netRequiredMinutes;
      }
    }
  } else if (checkIn && !checkOut) {
    // Currently at work (in progress)
    status = 'in_progress';
    const checkInMins = timeStringToMinutes(checkIn);

    if (!isHoliday) {
      // Calculate delay based on flexible arrival (08:30 - 09:30)
      if (config.isFlexibleShift) {
        const maxFlexInMins = timeStringToMinutes(config.flexStartTimeMax || '09:30');
        if (checkInMins > maxFlexInMins) {
          delayMinutes = checkInMins - maxFlexInMins;
        }
      } else {
        const startMins = timeStringToMinutes(config.startTime);
        if (checkInMins > startMins + (config.graceMinutes || 0)) {
          delayMinutes = checkInMins - startMins;
        }
      }

      // Calculate expected target check-out time based on presence requirement
      const targetMins = checkInMins + requiredPresenceMinutes;
      targetCheckOut = formatMinutesToTimeString(targetMins);
    }
  } else if (checkIn && checkOut) {
    // Both checkIn and checkOut exist
    status = 'present';
    const checkInMins = timeStringToMinutes(checkIn);
    const checkOutMins = timeStringToMinutes(checkOut);

    // Raw presence time (مدت حضور فیزیکی در محل کار)
    const rawPresenceMinutes = Math.max(0, checkOutMins - checkInMins);
    // Net worked time (کارکرد مفید موثر پس از کسر تایم ناهار/استراحت)
    workedMinutes = Math.max(0, rawPresenceMinutes - breakMinutes);

    if (isHoliday) {
      // Any work on holidays/Fridays is 100% holiday overtime
      holidayOvertimeMinutes = workedMinutes;
      netBalanceMinutes = holidayOvertimeMinutes;
    } else {
      // 1. Calculate Delay (تاخیر ورود)
      if (config.isFlexibleShift) {
        // Floating arrival between flexStartTimeMin (08:30) and flexStartTimeMax (09:30)
        const maxFlexInMins = timeStringToMinutes(config.flexStartTimeMax || '09:30');
        if (checkInMins > maxFlexInMins) {
          delayMinutes = checkInMins - maxFlexInMins;
        }
      } else {
        const startMins = timeStringToMinutes(config.startTime);
        if (checkInMins > startMins + (config.graceMinutes || 0)) {
          delayMinutes = checkInMins - startMins;
        }
      }

      // 2. Target Check Out Time
      const targetMins = checkInMins + requiredPresenceMinutes;
      targetCheckOut = formatMinutesToTimeString(targetMins);

      // 3. Early Leave (تعجیل خروج)
      if (checkOutMins < targetMins) {
        earlyLeaveMinutes = targetMins - checkOutMins;
      }

      // 4. Overtime (اضافه کاری عادی)
      if (workedMinutes > netRequiredMinutes) {
        overtimeMinutes = workedMinutes - netRequiredMinutes;
      }

      // 5. Deficit (کسر کار)
      if (workedMinutes < netRequiredMinutes) {
        deficitMinutes = netRequiredMinutes - workedMinutes;
      }

      // 6. Net balance
      netBalanceMinutes = overtimeMinutes - deficitMinutes;
    }
  }

  return {
    id: record.id || `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    date: record.date,
    gregorianDate: record.gregorianDate || '',
    dayOfWeek: weekday,
    checkIn,
    checkOut,
    breakMinutes,
    status,
    delayMinutes,
    earlyLeaveMinutes,
    workedMinutes,
    overtimeMinutes,
    holidayOvertimeMinutes,
    deficitMinutes,
    targetCheckOut,
    netBalanceMinutes,
    note: record.note || '',
    isHoliday: holidayInfo.isHoliday || isFriday,
    holidayTitle: holidayInfo.title || (isFriday ? 'جمعه (تعطیل هفتگی)' : undefined),
  };
}

/**
 * Calculates monthly statistics for the specified Jalali month and year
 */
export function calculateMonthlyStats(
  records: AttendanceRecord[],
  jy: number,
  jm: number,
  config: ShiftConfig,
  leaves: LeaveRecord[]
): MonthlyStats {
  const monthPrefix = `${jy}/${jm < 10 ? '0' + jm : jm}/`;
  const monthRecords = records.filter((r) => r.date.startsWith(monthPrefix));
  const monthLeaves = leaves.filter((l) => l.date.startsWith(monthPrefix) && l.approved);

  let totalRequiredMinutes = 0;
  let totalWorkedMinutes = 0;
  let totalOvertimeMinutes = 0;
  let totalHolidayOvertimeMinutes = 0;
  let totalDelayMinutes = 0;
  let totalEarlyLeaveMinutes = 0;
  let totalDeficitMinutes = 0;
  let presentDaysCount = 0;
  let absentDaysCount = 0;
  let leaveDaysCount = 0;

  const standardDailyNetMinutes = Math.max(
    60,
    (config.requiredDailyMinutes || 510) - (config.defaultBreakMinutes || 30)
  ); // 480 mins (8 hours)

  monthRecords.forEach((r) => {
    totalWorkedMinutes += r.workedMinutes;
    totalOvertimeMinutes += r.overtimeMinutes;
    totalHolidayOvertimeMinutes += r.holidayOvertimeMinutes;
    totalDelayMinutes += r.delayMinutes;
    totalEarlyLeaveMinutes += r.earlyLeaveMinutes;
    totalDeficitMinutes += r.deficitMinutes;

    if (r.status === 'present' || (r.status === 'in_progress' && r.checkIn)) {
      presentDaysCount++;
    } else if (r.status === 'absent') {
      absentDaysCount++;
    } else if (r.status === 'leave') {
      leaveDaysCount++;
    }

    // Accumulate required minutes for non-holidays
    const weekday = r.dayOfWeek;
    const isFriday = weekday === 6;
    const isThursday = weekday === 5;

    if (!r.isHoliday && !isFriday) {
      if (isThursday) {
        if (config.thursdayStatus === 'half_day') {
          totalRequiredMinutes += config.thursdayMinutes || 270;
        } else if (config.thursdayStatus === 'full_day') {
          totalRequiredMinutes += standardDailyNetMinutes;
        }
      } else {
        totalRequiredMinutes += standardDailyNetMinutes;
      }
    }
  });

  // Calculate leaves in hours and days
  const totalLeaveHours = monthLeaves.reduce((sum, l) => sum + (l.hours || 0), 0);
  const standardDayHours = standardDailyNetMinutes / 60; // 8 hours
  const totalLeaveDays = parseFloat((totalLeaveHours / standardDayHours).toFixed(1));

  const monthlyQuotaHours =
    config.monthlyLeaveQuotaHours ||
    (config.monthlyLeaveDays ? config.monthlyLeaveDays * standardDayHours : 20);

  const remainingLeaveHours = Math.max(0, monthlyQuotaHours - totalLeaveHours);
  const remainingLeaveDays = parseFloat((remainingLeaveHours / standardDayHours).toFixed(1));

  // Net balance (اضافه کاری منهای کسر کار)
  const netBalanceMinutes = totalOvertimeMinutes + totalHolidayOvertimeMinutes - totalDeficitMinutes;

  // Completion rate
  const completionRate =
    totalRequiredMinutes > 0
      ? Math.min(100, Math.round((totalWorkedMinutes / totalRequiredMinutes) * 100))
      : 100;

  // Optional estimated overtime pay
  let estimatedOvertimePay: number | undefined = undefined;
  if (config.hourlyRateToman && config.hourlyRateToman > 0) {
    const regularOtHours = totalOvertimeMinutes / 60;
    const holidayOtHours = totalHolidayOvertimeMinutes / 60;
    const regularPay = regularOtHours * config.hourlyRateToman * (config.overtimeMultiplier || 1.4);
    const holidayPay = holidayOtHours * config.hourlyRateToman * (config.holidayMultiplier || 1.8);
    estimatedOvertimePay = Math.round(regularPay + holidayPay);
  }

  return {
    totalRequiredMinutes,
    totalWorkedMinutes,
    totalOvertimeMinutes,
    totalHolidayOvertimeMinutes,
    totalDelayMinutes,
    totalEarlyLeaveMinutes,
    totalDeficitMinutes,
    totalLeaveHours,
    totalLeaveDays,
    remainingLeaveHours,
    remainingLeaveDays,
    netBalanceMinutes,
    presentDaysCount,
    absentDaysCount,
    leaveDaysCount,
    completionRate,
    estimatedOvertimePay,
  };
}

