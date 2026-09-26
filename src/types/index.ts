export type DayStatus = 'present' | 'absent' | 'leave' | 'holiday' | 'weekend' | 'in_progress';

export interface ShiftConfig {
  startTime: string; // e.g. "08:00"
  endTime: string; // e.g. "16:30"
  requiredDailyMinutes: number; // e.g. 510 (8.5 hours)
  graceMinutes: number; // e.g. 15 (allowed tardiness without penalty)
  thursdayStatus: 'half_day' | 'off' | 'full_day';
  thursdayMinutes: number; // e.g. 240 (4 hours)
  fridayStatus: 'off';
  monthlyLeaveQuotaHours: number; // e.g. 20 hours (approx 2.5 days per month)
  overtimeMultiplier: number; // e.g. 1.4
  holidayMultiplier: number; // e.g. 1.8
}

export interface AttendanceRecord {
  id: string;
  date: string; // "1403/07/05" (Jalali)
  gregorianDate: string; // "2024-09-26"
  dayOfWeek: number; // 0=شنبه, 1=یکشنبه, ..., 6=جمعه
  checkIn: string | null; // "08:05"
  checkOut: string | null; // "17:30"
  breakMinutes: number; // e.g. 30
  status: DayStatus;
  delayMinutes: number; // دقیقه تاخیر
  earlyLeaveMinutes: number; // دقیقه تعجیل (خروج زودتر)
  workedMinutes: number; // کارکرد واقعی موثر
  overtimeMinutes: number; // اضافه کاری عادی
  holidayOvertimeMinutes: number; // اضافه کاری تعطیلات
  deficitMinutes: number; // کسر کار
  note?: string;
  isHoliday?: boolean;
  holidayTitle?: string;
}

export type LeaveType = 'hourly' | 'daily' | 'sick' | 'unpaid';

export interface LeaveRecord {
  id: string;
  date: string; // "1403/07/05"
  type: LeaveType;
  hours: number; // Hours or fractional hours
  startTime?: string;
  endTime?: string;
  reason: string;
  approved: boolean;
  createdAt: string;
}

export interface OfficialHoliday {
  month: number; // 1-12 (Jalali)
  day: number; // 1-31 (Jalali)
  title: string;
  isOfficial: boolean;
}

export interface MonthlyStats {
  totalRequiredMinutes: number;
  totalWorkedMinutes: number;
  totalOvertimeMinutes: number;
  totalHolidayOvertimeMinutes: number;
  totalDelayMinutes: number;
  totalEarlyLeaveMinutes: number;
  totalDeficitMinutes: number;
  totalLeaveHours: number;
  remainingLeaveHours: number;
  presentDaysCount: number;
  absentDaysCount: number;
  leaveDaysCount: number;
  completionRate: number; // Percentage 0 - 100
}
