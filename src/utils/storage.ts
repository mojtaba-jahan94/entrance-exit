import * as XLSX from 'xlsx';
import { AttendanceRecord, ShiftConfig, LeaveRecord } from '../types';
import { DEFAULT_SHIFT_CONFIG, calculateAttendanceMetrics } from './calculator';
import {
  getCurrentJalaliDate,
  formatJalaliDate,
  PERSIAN_WEEKDAY_NAMES,
  getJalaliWeekdayIndex,
  toPersianDigits,
  formatMinutesToTimeString,
} from './jalali';

function getStorageKeys(userId?: string) {
  if (userId) {
    return {
      RECORDS: `shamsi_attendance_records_${userId}`,
      CONFIG: `shamsi_shift_config_${userId}`,
      LEAVES: `shamsi_leave_records_${userId}`,
    };
  }
  return {
    RECORDS: 'shamsi_attendance_records_v1',
    CONFIG: 'shamsi_shift_config_v1',
    LEAVES: 'shamsi_leave_records_v1',
  };
}

export function getStoredShiftConfig(userId?: string): ShiftConfig {
  try {
    const keys = getStorageKeys(userId);
    let raw = localStorage.getItem(keys.CONFIG);

    // If scoped config not found, check legacy config
    if (!raw && userId) {
      raw = localStorage.getItem('shamsi_shift_config_v1');
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      // If legacy config without flexible shift settings, automatically upgrade to new workplace defaults
      if (!parsed.isFlexibleShift || parsed.startTime === '08:00') {
        const upgraded: ShiftConfig = {
          ...DEFAULT_SHIFT_CONFIG,
          ...parsed,
          startTime: '08:30',
          endTime: '17:00',
          isFlexibleShift: true,
          flexStartTimeMin: '08:30',
          flexStartTimeMax: '09:30',
          flexDepartureMin: '17:00',
          flexDepartureMax: '18:00',
          requiredDailyMinutes: 510,
          defaultBreakMinutes: 30,
          thursdayMinutes: 270,
          monthlyLeaveDays: 2.5,
          monthlyLeaveQuotaHours: 20,
        };
        saveShiftConfig(upgraded, userId);
        return upgraded;
      }
      return { ...DEFAULT_SHIFT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Error reading shift config from storage', e);
  }
  return DEFAULT_SHIFT_CONFIG;
}

export function saveShiftConfig(config: ShiftConfig, userId?: string): void {
  try {
    const keys = getStorageKeys(userId);
    localStorage.setItem(keys.CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving shift config', e);
  }
}

export function getStoredAttendanceRecords(userId?: string): AttendanceRecord[] {
  try {
    const keys = getStorageKeys(userId);
    let raw = localStorage.getItem(keys.RECORDS);

    // Migration: If logged-in user has no records yet, migrate legacy records
    if (!raw && userId) {
      const legacyRaw = localStorage.getItem('shamsi_attendance_records_v1');
      if (legacyRaw) {
        localStorage.setItem(keys.RECORDS, legacyRaw);
        raw = legacyRaw;
      }
    }

    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading attendance records', e);
  }
  return [];
}

export function saveAttendanceRecords(records: AttendanceRecord[], userId?: string): void {
  try {
    const keys = getStorageKeys(userId);
    localStorage.setItem(keys.RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving attendance records', e);
  }
}

export function getStoredLeaveRecords(userId?: string): LeaveRecord[] {
  try {
    const keys = getStorageKeys(userId);
    let raw = localStorage.getItem(keys.LEAVES);

    if (!raw && userId) {
      const legacyRaw = localStorage.getItem('shamsi_leave_records_v1');
      if (legacyRaw) {
        localStorage.setItem(keys.LEAVES, legacyRaw);
        raw = legacyRaw;
      }
    }

    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading leaves', e);
  }
  return [];
}

export function saveLeaveRecords(leaves: LeaveRecord[], userId?: string): void {
  try {
    const keys = getStorageKeys(userId);
    localStorage.setItem(keys.LEAVES, JSON.stringify(leaves));
  } catch (e) {
    console.error('Error saving leaves', e);
  }
}

/**
 * Initializes mock/sample records for the current Jalali month if storage is empty
 */
export function initializeSampleDataIfEmpty(userId?: string): {
  records: AttendanceRecord[];
  leaves: LeaveRecord[];
  config: ShiftConfig;
} {
  const existingRecords = getStoredAttendanceRecords(userId);
  const config = getStoredShiftConfig(userId);
  const existingLeaves = getStoredLeaveRecords(userId);

  if (existingRecords.length > 0) {
    return { records: existingRecords, leaves: existingLeaves, config };
  }

  // Generate realistic sample records for current month up to today
  const { jy, jm, jd } = getCurrentJalaliDate();
  const sampleRecords: AttendanceRecord[] = [];

  for (let day = 1; day <= Math.min(jd, 25); day++) {
    const dateStr = formatJalaliDate(jy, jm, day);
    const weekday = getJalaliWeekdayIndex(dateStr);
    const isFriday = weekday === 6;
    const isThursday = weekday === 5;

    if (isFriday) {
      sampleRecords.push(
        calculateAttendanceMetrics(
          {
            id: `seed_${day}`,
            date: dateStr,
            breakMinutes: 0,
            status: 'weekend',
            note: 'تعطیل پایان هفته (جمعه)',
          },
          config
        )
      );
    } else if (isThursday && config.thursdayStatus === 'off') {
      sampleRecords.push(
        calculateAttendanceMetrics(
          {
            id: `seed_${day}`,
            date: dateStr,
            breakMinutes: 0,
            status: 'weekend',
            note: 'پنج‌شنبه تعطیل',
          },
          config
        )
      );
    } else if (isThursday && config.thursdayStatus === 'half_day') {
      // Thursday 4.5 hours presence: e.g. 08:35 to 13:05
      sampleRecords.push(
        calculateAttendanceMetrics(
          {
            id: `seed_${day}`,
            date: dateStr,
            checkIn: '08:35',
            checkOut: '13:05',
            breakMinutes: 0,
            note: 'شیفت نیمه‌وقت پنج‌شنبه (۴.۵ ساعت)',
          },
          config
        )
      );
    } else {
      // Simulate realistic checkin/checkout for flexible 8:30-9:30 shift
      let checkIn = '08:35';
      let checkOut = '17:10';
      let breakMinutes = config.defaultBreakMinutes || 30;
      let note = 'حضور عادی و به موقع';

      if (day % 7 === 1) {
        // Late arrival (after 09:30)
        checkIn = '09:45';
        checkOut = '18:15';
        note = 'تاخیر به علت ترافیک صبحگاهی (۱۵ دقیقه)';
      } else if (day % 7 === 3) {
        // High productive overtime
        checkIn = '08:30';
        checkOut = '18:30';
        note = 'اضافه کاری برای تحویل تسک‌های پروژه';
      } else if (day % 9 === 0) {
        // Early leave
        checkIn = '08:40';
        checkOut = '16:30';
        note = 'خروج زودهنگام با هماهنگی مدیریت';
      } else if (day % 5 === 2) {
        // Checked in at 09:15, left at 17:45 (perfect flexible shift)
        checkIn = '09:15';
        checkOut = '17:45';
        note = 'استفاده از فرجه شناوری مجاز صبح';
      }

      sampleRecords.push(
        calculateAttendanceMetrics(
          {
            id: `seed_${day}`,
            date: dateStr,
            checkIn,
            checkOut,
            breakMinutes,
            note,
          },
          config
        )
      );
    }
  }

  // Sample leave
  const sampleLeaves: LeaveRecord[] = [
    {
      id: 'leave_seed_1',
      date: formatJalaliDate(jy, jm, Math.max(1, jd - 4)),
      type: 'hourly',
      hours: 2,
      startTime: '10:00',
      endTime: '12:00',
      reason: 'امور بانکی و اداری',
      approved: true,
      createdAt: new Date().toISOString(),
    },
  ];

  saveAttendanceRecords(sampleRecords, userId);
  saveLeaveRecords(sampleLeaves, userId);
  saveShiftConfig(config, userId);

  return { records: sampleRecords, leaves: sampleLeaves, config };
}

/**
 * Export records of a specific month to Excel (.xlsx) file
 */
export function exportMonthToExcel(
  records: AttendanceRecord[],
  jy: number,
  jm: number,
  monthName: string
): void {
  const monthPrefix = `${jy}/${jm < 10 ? '0' + jm : jm}/`;
  const monthRecords = records
    .filter((r) => r.date.startsWith(monthPrefix))
    .sort((a, b) => a.date.localeCompare(b.date));

  const rows = monthRecords.map((r) => {
    let statusText = 'حاضر';
    if (r.status === 'absent') statusText = 'غایب';
    else if (r.status === 'leave') statusText = 'مرخصی';
    else if (r.status === 'holiday') statusText = 'تعطیل رسمی';
    else if (r.status === 'weekend') statusText = 'جمعه / تعطیل';
    else if (r.status === 'in_progress') statusText = 'در حال کار';

    return {
      'تاریخ (شمسی)': r.date,
      'روز هفته': PERSIAN_WEEKDAY_NAMES[r.dayOfWeek] || '',
      'وضعیت': statusText,
      'ساعت ورود': r.checkIn || '-',
      'ساعت خروج': r.checkOut || '-',
      'خروج موظفی هدف': r.targetCheckOut || '-',
      'استراحت/ناهار (دقیقه)': r.breakMinutes,
      'کارکرد مفید خالص (ساعت)': formatMinutesToTimeString(r.workedMinutes),
      'تاخیر ورود (دقیقه)': r.delayMinutes > 0 ? r.delayMinutes : '-',
      'تعجیل خروج (دقیقه)': r.earlyLeaveMinutes > 0 ? r.earlyLeaveMinutes : '-',
      'اضافه کار عادی (ساعت)': r.overtimeMinutes > 0 ? formatMinutesToTimeString(r.overtimeMinutes) : '-',
      'اضافه کار تعطیل (ساعت)': r.holidayOvertimeMinutes > 0 ? formatMinutesToTimeString(r.holidayOvertimeMinutes) : '-',
      'کسر کار (دقیقه)': r.deficitMinutes > 0 ? r.deficitMinutes : '-',
      'تراز روز (دقیقه)': r.netBalanceMinutes,
      'توضیحات و یادداشت': r.note || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `کارکرد ${monthName} ${jy}`);

  // Set RTL on sheet if supported
  if (!worksheet['!views']) {
    worksheet['!views'] = [{ RTL: true }];
  }

  const fileName = `گزارش_تردد_${monthName}_${jy}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Backup all data to a JSON file
 */
export function exportAllDataBackup(userId?: string): void {
  const data = {
    records: getStoredAttendanceRecords(userId),
    leaves: getStoredLeaveRecords(userId),
    config: getStoredShiftConfig(userId),
    userId: userId || null,
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backup_entrance_exit_${userId ? userId + '_' : ''}${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Restore data from a JSON file
 */
export function importDataBackup(jsonString: string, userId?: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.records && Array.isArray(parsed.records)) {
      saveAttendanceRecords(parsed.records, userId);
    }
    if (parsed.leaves && Array.isArray(parsed.leaves)) {
      saveLeaveRecords(parsed.leaves, userId);
    }
    if (parsed.config) {
      saveShiftConfig(parsed.config, userId);
    }
    return true;
  } catch (e) {
    console.error('Failed to import backup', e);
    return false;
  }
}
