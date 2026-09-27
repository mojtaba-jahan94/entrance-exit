export type DayStatus = 'present' | 'absent' | 'leave' | 'holiday' | 'weekend' | 'in_progress';

export interface ShiftConfig {
  startTime: string; // e.g. "08:30"
  endTime: string; // e.g. "17:00"
  requiredDailyMinutes: number; // e.g. 510 (8.5 hours total presence)
  graceMinutes: number; // e.g. 0 (used if rigid shift)
  
  // Floating / Flexible Shift settings
  isFlexibleShift: boolean; // default true
  flexStartTimeMin: string; // e.g. "08:30"
  flexStartTimeMax: string; // e.g. "09:30"
  flexDepartureMin: string; // e.g. "17:00"
  flexDepartureMax: string; // e.g. "18:00"
  defaultBreakMinutes: number; // e.g. 30 (lunch time, excluded from work time)

  // Thursday policy
  thursdayStatus: 'half_day' | 'off' | 'full_day';
  thursdayMinutes: number; // 270 (4.5 hours)
  fridayStatus: 'off';

  // Leave & Multipliers
  monthlyLeaveDays: number; // 2.5 days
  monthlyLeaveQuotaHours: number; // 20 hours (2.5 days * 8h)
  overtimeMultiplier: number; // e.g. 1.4
  holidayMultiplier: number; // e.g. 1.8
  hourlyRateToman?: number; // Optional hourly wage for salary estimations
}

export interface AttendanceRecord {
  id: string;
  date: string; // "1403/07/05" (Jalali)
  gregorianDate: string; // "2024-09-26"
  dayOfWeek: number; // 0=شنبه, 1=یکشنبه, ..., 6=جمعه
  checkIn: string | null; // "08:35"
  checkOut: string | null; // "17:05"
  breakMinutes: number; // e.g. 30
  status: DayStatus;
  delayMinutes: number; // دقیقه تاخیر ورود
  earlyLeaveMinutes: number; // دقیقه تعجیل خروج
  workedMinutes: number; // کارکرد واقعی موثر (خالص پس از کسر استراحت)
  overtimeMinutes: number; // اضافه کاری عادی
  holidayOvertimeMinutes: number; // اضافه کاری تعطیلات
  deficitMinutes: number; // کسر کار
  targetCheckOut?: string; // ساعت خروج موظفی پیشنهادی روز (مثلاً "17:05")
  netBalanceMinutes: number; // تراز روزانه: اضافه کاری منهای کسر کار
  note?: string;
  isHoliday?: boolean;
  holidayTitle?: string;
}

export type LeaveType = 'hourly' | 'daily' | 'half_day' | 'sick' | 'unpaid';

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
  totalLeaveDays: number;
  remainingLeaveHours: number;
  remainingLeaveDays: number;
  netBalanceMinutes: number; // اضافه کاری منهای کسر کار
  presentDaysCount: number;
  absentDaysCount: number;
  leaveDaysCount: number;
  completionRate: number; // Percentage 0 - 100
  estimatedOvertimePay?: number; // برآورد ریالی اضافه کار (در صورت تعیین دستمزد)
}

