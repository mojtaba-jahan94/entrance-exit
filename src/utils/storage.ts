import * as XLSX from 'xlsx';
import { AttendanceRecord, ShiftConfig, LeaveRecord } from '../types';
import { DEFAULT_SHIFT_CONFIG, calculateAttendanceMetrics } from './calculator';
import {
  getCurrentJalaliDate,
  formatJalaliDate,
  PERSIAN_WEEKDAY_NAMES,
  getJalaliWeekdayIndex,
  getDaysInJalaliMonth,
  toPersianDigits,
  formatMinutesToTimeString,
} from './jalali';

const STORAGE_KEYS = {
  RECORDS: 'shamsi_attendance_records_v1',
  CONFIG: 'shamsi_shift_config_v1',
  LEAVES: 'shamsi_leave_records_v1',
};

export function getStoredShiftConfig(): ShiftConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) {
      return { ...DEFAULT_SHIFT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error reading shift config from storage', e);
  }
  return DEFAULT_SHIFT_CONFIG;
}

export function saveShiftConfig(config: ShiftConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving shift config', e);
  }
}

export function getStoredAttendanceRecords(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading attendance records', e);
  }
  return [];
}

export function saveAttendanceRecords(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving attendance records', e);
  }
}

export function getStoredLeaveRecords(): LeaveRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEAVES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading leaves', e);
  }
  return [];
}

export function saveLeaveRecords(leaves: LeaveRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaves));
  } catch (e) {
    console.error('Error saving leaves', e);
  }
}

/**
 * Initializes mock/sample records for the current Jalali month if storage is empty
 */
export function initializeSampleDataIfEmpty(): {
  records: AttendanceRecord[];
  leaves: LeaveRecord[];
  config: ShiftConfig;
} {
  const existingRecords = getStoredAttendanceRecords();
  const config = getStoredShiftConfig();
  const existingLeaves = getStoredLeaveRecords();

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
            note: 'تعطیل پایان هفته',
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
    } else {
      // Simulate realistic checkin/checkout
      let checkIn = '07:55';
      let checkOut = '16:35';
      let note = 'حضور عادی';

      if (day % 7 === 1) {
        // Late arrival
        checkIn = '08:25';
        checkOut = '16:45';
        note = 'تاخیر به علت ترافیک صبحگاهی';
      } else if (day % 7 === 3) {
        // Good overtime
        checkIn = '07:50';
        checkOut = '18:15';
        note = 'اضافه کاری پروژه';
      } else if (day % 9 === 0) {
        // Early leave
        checkIn = '08:00';
        checkOut = '15:10';
        note = 'خروج زودهنگام با هماهنگی';
      }

      if (isThursday && config.thursdayStatus === 'half_day') {
        checkIn = '08:00';
        checkOut = '12:15';
        note = 'شیفت نیمه‌وقت پنج‌شنبه';
      }

      sampleRecords.push(
        calculateAttendanceMetrics(
          {
            id: `seed_${day}`,
            date: dateStr,
            checkIn,
            checkOut,
            breakMinutes: 30,
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

  saveAttendanceRecords(sampleRecords);
  saveLeaveRecords(sampleLeaves);
  saveShiftConfig(config);

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
      'استراحت (دقیقه)': r.breakMinutes,
      'کارکرد مفید (ساعت)': formatMinutesToTimeString(r.workedMinutes),
      'تاخیر ورود (دقیقه)': r.delayMinutes > 0 ? r.delayMinutes : '-',
      'تعجیل خروج (دقیقه)': r.earlyLeaveMinutes > 0 ? r.earlyLeaveMinutes : '-',
      'اضافه کار عادی (ساعت)': r.overtimeMinutes > 0 ? formatMinutesToTimeString(r.overtimeMinutes) : '-',
      'اضافه کار تعطیل (ساعت)': r.holidayOvertimeMinutes > 0 ? formatMinutesToTimeString(r.holidayOvertimeMinutes) : '-',
      'کسر کار (دقیقه)': r.deficitMinutes > 0 ? r.deficitMinutes : '-',
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
export function exportAllDataBackup(): void {
  const data = {
    records: getStoredAttendanceRecords(),
    leaves: getStoredLeaveRecords(),
    config: getStoredShiftConfig(),
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backup_entrance_exit_${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Restore data from a JSON file
 */
export function importDataBackup(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.records && Array.isArray(parsed.records)) {
      saveAttendanceRecords(parsed.records);
    }
    if (parsed.leaves && Array.isArray(parsed.leaves)) {
      saveLeaveRecords(parsed.leaves);
    }
    if (parsed.config) {
      saveShiftConfig(parsed.config);
    }
    return true;
  } catch (e) {
    console.error('Failed to import backup', e);
    return false;
  }
}
