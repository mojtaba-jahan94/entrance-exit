import { AttendanceRecord, ShiftConfig, MonthlyStats, LeaveRecord } from '../types';
import {
  timeStringToMinutes,
  getJalaliWeekdayIndex,
  parseJalaliDate,
  checkOfficialHoliday,
} from './jalali';

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

  // Determine required minutes for this day
  let requiredMinutes = config.requiredDailyMinutes;
  if (isFriday || holidayInfo.isHoliday) {
    requiredMinutes = 0;
  } else if (isThursday) {
    if (config.thursdayStatus === 'off') {
      requiredMinutes = 0;
    } else if (config.thursdayStatus === 'half_day') {
      requiredMinutes = config.thursdayMinutes;
    } else {
      requiredMinutes = config.requiredDailyMinutes;
    }
  }

  const checkIn = record.checkIn || null;
  const checkOut = record.checkOut || null;
  const breakMinutes = record.breakMinutes || 0;

  let delayMinutes = 0;
  let earlyLeaveMinutes = 0;
  let workedMinutes = 0;
  let overtimeMinutes = 0;
  let holidayOvertimeMinutes = 0;
  let deficitMinutes = 0;
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
        deficitMinutes = requiredMinutes;
      }
    }
  } else if (checkIn && !checkOut) {
    // Currently at work (in progress)
    status = 'in_progress';
    const checkInMins = timeStringToMinutes(checkIn);
    const startMins = timeStringToMinutes(config.startTime);

    if (!isHoliday && checkInMins > startMins + config.graceMinutes) {
      delayMinutes = checkInMins - startMins;
    }
  } else if (checkIn && checkOut) {
    // Both checkIn and checkOut exist
    status = 'present';
    const checkInMins = timeStringToMinutes(checkIn);
    const checkOutMins = timeStringToMinutes(checkOut);
    const startMins = timeStringToMinutes(config.startTime);
    const endMins = isThursday && config.thursdayStatus === 'half_day'
      ? startMins + config.thursdayMinutes
      : timeStringToMinutes(config.endTime);

    // Raw worked time minus breaks
    const rawMinutes = Math.max(0, checkOutMins - checkInMins);
    workedMinutes = Math.max(0, rawMinutes - breakMinutes);

    if (isHoliday) {
      // Any work on holidays is 100% holiday overtime
      holidayOvertimeMinutes = workedMinutes;
    } else {
      // 1. Calculate Delay (تاخیر)
      if (checkInMins > startMins + config.graceMinutes) {
        delayMinutes = checkInMins - startMins;
      }

      // 2. Calculate Early Leave (تعجیل)
      if (checkOutMins < endMins) {
        earlyLeaveMinutes = endMins - checkOutMins;
      }

      // 3. Calculate Overtime (اضافه کاری)
      if (workedMinutes > requiredMinutes) {
        overtimeMinutes = workedMinutes - requiredMinutes;
      }

      // 4. Calculate Deficit (کسر کار)
      if (workedMinutes < requiredMinutes) {
        deficitMinutes = requiredMinutes - workedMinutes;
      }
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
          totalRequiredMinutes += config.thursdayMinutes;
        } else if (config.thursdayStatus === 'full_day') {
          totalRequiredMinutes += config.requiredDailyMinutes;
        }
      } else {
        totalRequiredMinutes += config.requiredDailyMinutes;
      }
    }
  });

  // Calculate leaves
  const totalLeaveHours = monthLeaves.reduce((sum, l) => sum + (l.hours || 0), 0);
  const remainingLeaveHours = Math.max(0, config.monthlyLeaveQuotaHours - totalLeaveHours);

  // Completion rate
  const completionRate = totalRequiredMinutes > 0
    ? Math.min(100, Math.round((totalWorkedMinutes / totalRequiredMinutes) * 100))
    : 100;

  return {
    totalRequiredMinutes,
    totalWorkedMinutes,
    totalOvertimeMinutes,
    totalHolidayOvertimeMinutes,
    totalDelayMinutes,
    totalEarlyLeaveMinutes,
    totalDeficitMinutes,
    totalLeaveHours,
    remainingLeaveHours,
    presentDaysCount,
    absentDaysCount,
    leaveDaysCount,
    completionRate,
  };
}

export const DEFAULT_SHIFT_CONFIG: ShiftConfig = {
  startTime: '08:00',
  endTime: '16:30',
  requiredDailyMinutes: 510, // 8 hours and 30 mins
  graceMinutes: 15,
  thursdayStatus: 'half_day',
  thursdayMinutes: 240, // 4 hours
  fridayStatus: 'off',
  monthlyLeaveQuotaHours: 20, // ~2.5 days per month
  overtimeMultiplier: 1.4,
  holidayMultiplier: 1.8,
};
