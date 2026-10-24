import { AttendanceRecord, ShiftConfig, LeaveRecord } from '../types';
import { DEFAULT_SHIFT_CONFIG, calculateAttendanceMetrics } from './calculator';
import {
  getCurrentJalaliDate,
  formatJalaliDate,
  PERSIAN_WEEKDAY_NAMES,
  getJalaliWeekdayIndex,
  formatMinutesToTimeString,
} from './jalali';
import { exportMonthToExcelAdvanced } from './exportEngine';

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
      if (parsed.thursdayMinutes === 270) {
        parsed.thursdayMinutes = 240;
        saveShiftConfig(parsed, userId);
      }
      // If legacy config without flexible shift settings, automatically upgrade to new workplace defaults
      if (parsed.isFlexibleShift === undefined && (parsed.startTime === '08:00' || !parsed.startTime)) {
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
          thursdayMinutes: 240,
          monthlyLeaveDays: 2.5,
          monthlyLeaveQuotaHours: 20,
        };
        saveShiftConfig(upgraded, userId);
        return upgraded;
      }
      return { ...DEFAULT_SHIFT_CONFIG, ...parsed, thursdayMinutes: parsed.thursdayMinutes || 240 };
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
    const refreshed = existingRecords.map((r) =>
      calculateAttendanceMetrics(
        r,
        config,
        existingLeaves.filter((l) => l.date === r.date)
      )
    );
    saveAttendanceRecords(refreshed, userId);
    return { records: refreshed, leaves: existingLeaves, config };
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
      // Thursday 4 hours presence: e.g. 08:30 to 12:30
      sampleRecords.push(
        calculateAttendanceMetrics(
          {
            id: `seed_${day}`,
            date: dateStr,
            checkIn: '08:30',
            checkOut: '12:30',
            breakMinutes: 0,
            note: 'شیفت نیمه‌وقت پنج‌شنبه (۴ ساعت)',
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
export async function exportMonthToExcel(
  records: AttendanceRecord[],
  jy: number,
  jm: number,
  monthName: string,
  leaves: LeaveRecord[] = [],
  config?: ShiftConfig,
  personnelName?: string
): Promise<void> {
  const effectiveConfig = config || getStoredShiftConfig();
  const effectiveLeaves = leaves && leaves.length > 0 ? leaves : getStoredLeaveRecords();
  await exportMonthToExcelAdvanced(
    records,
    effectiveLeaves,
    effectiveConfig,
    jy,
    jm,
    monthName,
    personnelName
  );
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

export interface BackupImportResult {
  success: boolean;
  error?: string;
}

export function validateBackupData(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, error: 'فایل پشتیبان باید یک شیء معتبر JSON باشد.' };
  }
  const obj = data as Record<string, unknown>;

  if (!('records' in obj) && !('leaves' in obj) && !('config' in obj)) {
    return { valid: false, error: 'فایل فاقد اطلاعات لازم (تردد، مرخصی یا تنظیمات) است.' };
  }

  if ('records' in obj && obj.records !== undefined) {
    if (!Array.isArray(obj.records)) {
      return { valid: false, error: 'بخش رکوردهای تردد (records) باید یک آرایه باشد.' };
    }
    for (let i = 0; i < obj.records.length; i++) {
      const r = obj.records[i];
      if (!r || typeof r !== 'object') {
        return { valid: false, error: `ردیف ${i + 1} تردد ساختار معتبری ندارد.` };
      }
      if (typeof r.id !== 'string' || typeof r.date !== 'string') {
        return { valid: false, error: `شناسه یا تاریخ در ردیف ${i + 1} تردد نامعتبر است.` };
      }
    }
  }

  if ('leaves' in obj && obj.leaves !== undefined) {
    if (!Array.isArray(obj.leaves)) {
      return { valid: false, error: 'بخش مرخصی‌ها (leaves) باید یک آرایه باشد.' };
    }
    for (let i = 0; i < obj.leaves.length; i++) {
      const l = obj.leaves[i];
      if (!l || typeof l !== 'object') {
        return { valid: false, error: `ردیف ${i + 1} مرخصی ساختار معتبری ندارد.` };
      }
      if (typeof l.id !== 'string' || typeof l.date !== 'string' || typeof l.type !== 'string') {
        return { valid: false, error: `فیلدهای الزامی در ردیف ${i + 1} مرخصی ناقص هستند.` };
      }
    }
  }

  if ('config' in obj && obj.config !== undefined) {
    if (!obj.config || typeof obj.config !== 'object' || Array.isArray(obj.config)) {
      return { valid: false, error: 'تنظیمات شیفت (config) ساختار معتبری ندارد.' };
    }
    const c = obj.config as Record<string, unknown>;
    if (typeof c.startTime !== 'string' || typeof c.endTime !== 'string') {
      return { valid: false, error: 'ساعت شروع یا پایان شیفت در تنظیمات معتبر نیست.' };
    }
  }

  return { valid: true };
}

/**
 * Restore data from a JSON file with validation
 */
export function importDataBackup(
  jsonString: string,
  userId?: string
): BackupImportResult {
  try {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return { success: false, error: 'فایل انتخاب‌شده یک فرمت معتبر JSON نیست.' };
    }

    const validation = validateBackupData(parsed);
    if (!validation.valid) {
      console.error('Validation failed for backup data:', validation.error);
      return { success: false, error: validation.error };
    }

    const validData = parsed as {
      records?: AttendanceRecord[];
      leaves?: LeaveRecord[];
      config?: ShiftConfig;
    };

    if (validData.records && Array.isArray(validData.records)) {
      saveAttendanceRecords(validData.records, userId);
    }
    if (validData.leaves && Array.isArray(validData.leaves)) {
      saveLeaveRecords(validData.leaves, userId);
    }
    if (validData.config) {
      saveShiftConfig(validData.config, userId);
    }

    return { success: true };
  } catch (e) {
    const errorMsg = 'خطای غیرمنتظره در پردازش و ذخیره فایل پشتیبان.';
    console.error('Failed to import backup:', e);
    return { success: false, error: errorMsg };
  }
}

export const exportFullBackupJSON = exportAllDataBackup;
export const importBackupFromJSON = importDataBackup;
