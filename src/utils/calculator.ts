import { AttendanceRecord, ShiftConfig, MonthlyStats, LeaveRecord } from '../types';
import {
  timeStringToMinutes,
  getJalaliWeekdayIndex,
  parseJalaliDate,
  checkOfficialHoliday,
  formatMinutesToTimeString,
  getDaysInJalaliMonth,
  formatJalaliDate,
  getCurrentJalaliDate,
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
  thursdayMinutes: 240, // 4 hours
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
/**
 * Calculates attendance metrics for a single day record, taking into account any approved leaves for that day
 */
/**
 * Calculates the exact duration of a leave in minutes based on clock logic
 */
export function getLeaveDurationMinutes(
  leave: Partial<LeaveRecord>,
  standardDailyNetMinutes: number = 480
): number {
  if (typeof leave.minutes === 'number' && leave.minutes > 0) {
    return leave.minutes;
  }
  if (leave.date) {
    const wd = getJalaliWeekdayIndex(leave.date);
    if (wd === 5 && (leave.type === 'daily' || leave.type === 'half_day')) {
      return Math.min(standardDailyNetMinutes, 240);
    }
  }
  if (leave.type === 'daily' || leave.type === 'sick' || leave.type === 'unpaid') {
    return standardDailyNetMinutes;
  }
  if (leave.type === 'half_day') {
    return Math.round(standardDailyNetMinutes / 2);
  }
  // Hourly leave:
  // 1. Exact stored minutes
  if (typeof leave.minutes === 'number' && leave.minutes > 0) {
    return leave.minutes;
  }
  // 2. Clock times (از ساعت ... تا ساعت ...)
  if (leave.startTime && leave.endTime) {
    const s = timeStringToMinutes(leave.startTime);
    const e = timeStringToMinutes(leave.endTime);
    if (e > s) {
      return e - s;
    }
  }
  // 3. Fractional hours
  if (typeof leave.hours === 'number' && leave.hours > 0) {
    return Math.round(leave.hours * 60);
  }
  return 0;
}

export function calculateAttendanceMetrics(
  record: Partial<AttendanceRecord> & { date: string },
  config: ShiftConfig,
  dayLeaves?: LeaveRecord[]
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
      requiredPresenceMinutes = config.thursdayMinutes || 240;
      netRequiredMinutes = config.thursdayMinutes || 240; // 4 hours net
    } else {
      requiredPresenceMinutes = config.requiredDailyMinutes || 510;
      netRequiredMinutes = Math.max(0, requiredPresenceMinutes - (config.defaultBreakMinutes || 30));
    }
  }

  // Relevant approved leaves for this specific day
  const relevantLeaves = (dayLeaves || []).filter(
    (l) => l.date === record.date && l.approved !== false
  );
  const isThursdayHalfDay = isThursday && config.thursdayStatus === 'half_day';
  const fullDayLeave = relevantLeaves.find(
    (l) =>
      l.type === 'daily' ||
      l.type === 'sick' ||
      l.type === 'unpaid' ||
      (isThursdayHalfDay && l.type === 'half_day')
  );
  const partialLeaves = relevantLeaves.filter(
    (l) => l.type === 'hourly' || (!isThursdayHalfDay && l.type === 'half_day')
  );
  const totalLeaveCreditMinutes = partialLeaves.reduce(
    (sum, l) => sum + getLeaveDurationMinutes(l, netRequiredMinutes),
    0
  );

  const checkIn = record.checkIn || null;
  const checkOut = record.checkOut || null;

  // Handle Full-Day Leave (including full Thursday leave, or hourly leaves that cover the full shift)
  const isCoveredByLeaves =
    Boolean(fullDayLeave) ||
    (!checkIn && !checkOut && totalLeaveCreditMinutes >= netRequiredMinutes && netRequiredMinutes > 0);

  if (isCoveredByLeaves) {
    const leaveNote = fullDayLeave?.reason
      ? `مرخصی: ${fullDayLeave.reason}`
      : fullDayLeave?.type === 'half_day' || isThursdayHalfDay
      ? 'مرخصی پنج‌شنبه'
      : 'مرخصی روزانه';
    return {
      id: record.id || `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: record.date,
      gregorianDate: record.gregorianDate || '',
      dayOfWeek: weekday,
      checkIn: null,
      checkOut: null,
      breakMinutes: 0,
      status: 'leave',
      delayMinutes: 0,
      earlyLeaveMinutes: 0,
      workedMinutes: netRequiredMinutes, // Credited full standard net day
      overtimeMinutes: 0,
      holidayOvertimeMinutes: 0,
      deficitMinutes: 0,
      targetCheckOut: undefined,
      netBalanceMinutes: 0,
      leaveMinutes: netRequiredMinutes,
      note: record.note ? `${record.note} (${leaveNote})` : leaveNote,
      isHoliday: holidayInfo.isHoliday || isFriday,
      holidayTitle: holidayInfo.title || (isFriday ? 'جمعه (تعطیل هفتگی)' : undefined),
    };
  }

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
    } else if (totalLeaveCreditMinutes >= netRequiredMinutes) {
      status = 'leave';
      workedMinutes = netRequiredMinutes;
      deficitMinutes = 0;
      netBalanceMinutes = 0;
    } else {
      status = record.status === 'leave' ? 'leave' : 'absent';
      if (status === 'leave') {
        workedMinutes = netRequiredMinutes;
        deficitMinutes = 0;
        netBalanceMinutes = 0;
      } else if (status === 'absent') {
        deficitMinutes = Math.max(0, netRequiredMinutes - totalLeaveCreditMinutes);
        netBalanceMinutes = -deficitMinutes;
      }
    }
  } else if (checkIn && !checkOut) {
    // Currently at work (in progress)
    status = 'in_progress';
    const checkInMins = timeStringToMinutes(checkIn);

    if (!isHoliday) {
      // Calculate raw delay based on flexible arrival (08:30 - 09:30)
      let rawDelay = 0;
      const grace = config.graceMinutes || 0;
      if (config.isFlexibleShift) {
        const maxFlexInMins = timeStringToMinutes(config.flexStartTimeMax || '09:30');
        if (checkInMins > maxFlexInMins + grace) {
          rawDelay = checkInMins - maxFlexInMins;
        }
      } else {
        const startMins = timeStringToMinutes(config.startTime);
        if (checkInMins > startMins + grace) {
          rawDelay = checkInMins - startMins;
        }
      }

      // Deduct partial leave credit from delay
      delayMinutes = Math.max(0, rawDelay - totalLeaveCreditMinutes);

      // Target checkout adjusted for leave (e.g. taking 2h leave allows leaving 2h earlier)
      const targetMins = Math.max(
        checkInMins,
        checkInMins + requiredPresenceMinutes - totalLeaveCreditMinutes
      );
      targetCheckOut = formatMinutesToTimeString(targetMins);
    }
  } else if (checkIn && checkOut) {
    // Both checkIn and checkOut exist
    status = 'present';
    const checkInMins = timeStringToMinutes(checkIn);
    const checkOutMins = timeStringToMinutes(checkOut);

    // Raw presence time (مدت حضور فیزیکی در محل کار)
    const rawPresenceMinutes = Math.max(0, checkOutMins - checkInMins);
    // Net worked time (کارکرد فیزیکی مفید پس از کسر ناهار)
    workedMinutes = Math.max(0, rawPresenceMinutes - breakMinutes);

    if (isHoliday) {
      // Any work on holidays/Fridays is 100% holiday overtime
      holidayOvertimeMinutes = workedMinutes;
      netBalanceMinutes = holidayOvertimeMinutes;
    } else {
      // 1. Calculate Raw Delay (تاخیر ورود)
      let rawDelay = 0;
      const grace = config.graceMinutes || 0;
      if (config.isFlexibleShift) {
        const maxFlexInMins = timeStringToMinutes(config.flexStartTimeMax || '09:30');
        if (checkInMins > maxFlexInMins + grace) {
          rawDelay = checkInMins - maxFlexInMins;
        }
      } else {
        const startMins = timeStringToMinutes(config.startTime);
        if (checkInMins > startMins + grace) {
          rawDelay = checkInMins - startMins;
        }
      }

      // 2. Target Check Out Time & Early Exit (تعجیل خروج)
      const standardTargetMins = checkInMins + requiredPresenceMinutes;
      // Departure shortfall: how many minutes before target departure did they leave?
      const departureShortfall = Math.max(0, standardTargetMins - checkOutMins);
      // Raw early leave is the exit shortfall, subtracting arrival delay so late arrival isn't counted twice
      const rawEarlyLeave = Math.max(0, departureShortfall - rawDelay);

      // 3. Offset Delay & Early Exit from approved partial leave credits
      let remainingLeave = totalLeaveCreditMinutes;
      if (rawDelay > 0 && remainingLeave > 0) {
        const delayOffset = Math.min(rawDelay, remainingLeave);
        delayMinutes = rawDelay - delayOffset;
        remainingLeave -= delayOffset;
      } else {
        delayMinutes = rawDelay;
      }

      if (rawEarlyLeave > 0 && remainingLeave > 0) {
        const earlyOffset = Math.min(rawEarlyLeave, remainingLeave);
        earlyLeaveMinutes = rawEarlyLeave - earlyOffset;
        remainingLeave -= earlyOffset;
      } else {
        earlyLeaveMinutes = rawEarlyLeave;
      }

      // Adjusted target checkout accounting for approved leave credit
      targetCheckOut = formatMinutesToTimeString(
        Math.max(checkInMins, standardTargetMins - totalLeaveCreditMinutes)
      );

      // 4. Overtime & Deficit:
      // Effective worked time = physical worked + approved leave credit
      const effectiveWorked = workedMinutes + totalLeaveCreditMinutes;

      if (effectiveWorked > netRequiredMinutes) {
        overtimeMinutes = effectiveWorked - netRequiredMinutes;
      }

      if (effectiveWorked < netRequiredMinutes) {
        deficitMinutes = netRequiredMinutes - effectiveWorked;
      } else {
        deficitMinutes = 0;
      }

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
    leaveMinutes: totalLeaveCreditMinutes > 0 ? totalLeaveCreditMinutes : undefined,
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
  const monthLeaves = leaves.filter((l) => l.date.startsWith(monthPrefix) && l.approved !== false);

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
  });

  // Calculate full month standard obligation (ساعت موظفی کل روزهای کاری ماه)
  const daysInMonth = getDaysInJalaliMonth(jy, jm);
  let totalMonthRequiredMinutes = 0;
  let passedRequiredMinutes = 0;
  const today = getCurrentJalaliDate();
  const isCurrentMonth = today.jy === jy && today.jm === jm;
  const maxDayToCheck = isCurrentMonth ? today.jd : daysInMonth;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatJalaliDate(jy, jm, d);
    const weekday = getJalaliWeekdayIndex(dateStr);
    const holidayInfo = checkOfficialHoliday(jy, jm, d);
    const isFriday = weekday === 6;
    const isThursday = weekday === 5;

    let dayRequired = 0;
    if (!isFriday && !holidayInfo.isHoliday) {
      if (isThursday) {
        if (config.thursdayStatus === 'half_day') {
          dayRequired = config.thursdayMinutes || 240;
        } else if (config.thursdayStatus === 'full_day') {
          dayRequired = standardDailyNetMinutes;
        }
      } else {
        dayRequired = standardDailyNetMinutes;
      }
    }

    totalMonthRequiredMinutes += dayRequired;
    if (d <= maxDayToCheck) {
      passedRequiredMinutes += dayRequired;
    }
  }

  // totalRequiredMinutes represents the required working minutes for the period evaluated
  // For the current month, it represents required working minutes up to today; for past months, the whole month
  const totalRequiredMinutes = isCurrentMonth
    ? Math.max(passedRequiredMinutes, 1)
    : totalMonthRequiredMinutes;

  // Calculate leaves in exact minutes and days based on clock logic
  const totalLeaveMinutes = monthLeaves.reduce(
    (sum, l) => sum + getLeaveDurationMinutes(l, standardDailyNetMinutes),
    0
  );
  const totalLeaveHours = parseFloat((totalLeaveMinutes / 60).toFixed(2));
  const standardDayHours = standardDailyNetMinutes / 60; // 8 hours
  const totalLeaveDays = parseFloat((totalLeaveMinutes / standardDailyNetMinutes).toFixed(1));

  const monthlyQuotaHours =
    config.monthlyLeaveQuotaHours ||
    (config.monthlyLeaveDays ? config.monthlyLeaveDays * standardDayHours : 20);
  const monthlyQuotaMinutes = monthlyQuotaHours * 60;

  const remainingLeaveMinutes = Math.max(0, monthlyQuotaMinutes - totalLeaveMinutes);
  const remainingLeaveHours = parseFloat((remainingLeaveMinutes / 60).toFixed(2));
  const remainingLeaveDays = parseFloat((remainingLeaveMinutes / standardDailyNetMinutes).toFixed(1));

  // Net balance (اضافه کاری منهای کسر کار)
  const netBalanceMinutes = totalOvertimeMinutes + totalHolidayOvertimeMinutes - totalDeficitMinutes;

  // Completion rate against required hours so far
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
    totalMonthRequiredMinutes,
    totalWorkedMinutes,
    totalOvertimeMinutes,
    totalHolidayOvertimeMinutes,
    totalDelayMinutes,
    totalEarlyLeaveMinutes,
    totalDeficitMinutes,
    totalLeaveMinutes,
    totalLeaveHours,
    totalLeaveDays,
    remainingLeaveMinutes,
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

