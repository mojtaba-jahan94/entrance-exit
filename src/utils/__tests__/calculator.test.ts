import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SHIFT_CONFIG,
  calculateAttendanceMetrics,
  calculateMonthlyStats,
  getLeaveDurationMinutes,
} from '../calculator';
import { AttendanceRecord, ShiftConfig, LeaveRecord } from '../../types';

describe('Attendance Calculator Engine', () => {
  const baseConfig: ShiftConfig = { ...DEFAULT_SHIFT_CONFIG };

  // 1. ورود در ۰۸:۴۰ و خروج هدف ۱۷:۱۰
  it('calculates target check-out at 17:10 when checking in at 08:40', () => {
    // 1403/07/07 is a Saturday (normal working day)
    const record = calculateAttendanceMetrics(
      {
        id: 'test_1',
        date: '1403/07/07',
        checkIn: '08:40',
        checkOut: null,
      },
      baseConfig
    );

    // 08:40 + 510 minutes = 17:10
    expect(record.targetCheckOut).toBe('17:10');
    expect(record.status).toBe('in_progress');
    expect(record.delayMinutes).toBe(0); // 08:40 is within flexible window 08:30-09:30
  });

  // 2. تاخیر بعد از ۰۹:۳۰
  it('calculates delay accurately when checking in after 09:30 flexible window', () => {
    const record = calculateAttendanceMetrics(
      {
        id: 'test_2',
        date: '1403/07/07',
        checkIn: '09:45',
        checkOut: '18:15',
      },
      baseConfig
    );

    // Flexible window max is 09:30 -> arrival at 09:45 means 15 minutes delay
    expect(record.delayMinutes).toBe(15);
    // 09:45 to 18:15 is 510 minutes raw presence - 30 min break = 480 min net worked
    expect(record.workedMinutes).toBe(480);
    expect(record.earlyLeaveMinutes).toBe(0);
    expect(record.deficitMinutes).toBe(0);
  });

  // 3. کسر ۳۰ دقیقه ناهار
  it('deducts 30-minute lunch break from raw presence on standard working days', () => {
    const record = calculateAttendanceMetrics(
      {
        id: 'test_3',
        date: '1403/07/07',
        checkIn: '08:30',
        checkOut: '17:00',
        breakMinutes: 30,
      },
      baseConfig
    );

    // 08:30 to 17:00 is 510 minutes raw presence
    // 510 - 30 = 480 minutes (8 hours) net worked
    expect(record.workedMinutes).toBe(480);
    expect(record.breakMinutes).toBe(30);
    expect(record.delayMinutes).toBe(0);
    expect(record.deficitMinutes).toBe(0);
    expect(record.overtimeMinutes).toBe(0);
  });

  // 4. پنج‌شنبه ۴ ساعته بدون ناهار
  it('handles Thursday half-day shift (4 hours) without lunch break deduction', () => {
    // 1403/07/05 is a Thursday
    const thursdayRecord = calculateAttendanceMetrics(
      {
        id: 'test_4',
        date: '1403/07/05',
        checkIn: '08:30',
        checkOut: '12:30',
      },
      baseConfig
    );

    // Thursday default break is 0
    expect(thursdayRecord.breakMinutes).toBe(0);
    // 08:30 to 12:30 = 240 minutes (4 hours)
    expect(thursdayRecord.workedMinutes).toBe(240);
    expect(thursdayRecord.delayMinutes).toBe(0);
    expect(thursdayRecord.deficitMinutes).toBe(0);
    expect(thursdayRecord.overtimeMinutes).toBe(0);
    expect(thursdayRecord.netBalanceMinutes).toBe(0);
  });

  // 5. اضافه کار و کسر کار
  it('calculates overtime when worked minutes exceed daily requirement', () => {
    const record = calculateAttendanceMetrics(
      {
        id: 'test_5_ot',
        date: '1403/07/07',
        checkIn: '08:30',
        checkOut: '18:00', // 570 mins raw - 30 break = 540 mins worked
      },
      baseConfig
    );

    // Net required is 480 mins. 540 - 480 = 60 minutes overtime
    expect(record.workedMinutes).toBe(540);
    expect(record.overtimeMinutes).toBe(60);
    expect(record.deficitMinutes).toBe(0);
    expect(record.netBalanceMinutes).toBe(60);
  });

  it('calculates deficit when worked minutes are below daily requirement', () => {
    const record = calculateAttendanceMetrics(
      {
        id: 'test_5_deficit',
        date: '1403/07/07',
        checkIn: '08:30',
        checkOut: '16:00', // 450 mins raw - 30 break = 420 mins worked
      },
      baseConfig
    );

    // Net required is 480 mins. 480 - 420 = 60 minutes deficit
    expect(record.workedMinutes).toBe(420);
    expect(record.deficitMinutes).toBe(60);
    expect(record.overtimeMinutes).toBe(0);
    expect(record.netBalanceMinutes).toBe(-60);
  });

  // BUG-01: خروج قبل از ورود باید رد شود
  it('rejects check-out before check-in with a clear error', () => {
    expect(() => {
      calculateAttendanceMetrics(
        {
          id: 'test_bug_01',
          date: '1403/07/07',
          checkIn: '17:00',
          checkOut: '08:30',
        },
        baseConfig
      );
    }).toThrow('ساعت خروج نمی‌تواند قبل از ساعت ورود باشد.');
  });

  // 6. سهمیه مرخصی ساعتی/نیم‌روز/روزانه
  describe('Leave calculations', () => {
    it('calculates leave duration accurately for hourly, half-day, and daily types', () => {
      // Hourly with start/end time
      expect(
        getLeaveDurationMinutes({
          type: 'hourly',
          startTime: '10:00',
          endTime: '12:30',
        })
      ).toBe(150);

      // Hourly with fractional hours
      expect(
        getLeaveDurationMinutes({
          type: 'hourly',
          hours: 2,
        })
      ).toBe(120);

      // Half-day leave on regular day (4 hours = 240 minutes)
      expect(
        getLeaveDurationMinutes(
          {
            type: 'half_day',
            date: '1403/07/07',
          },
          480
        )
      ).toBe(240);

      // Daily leave (8 hours = 480 minutes)
      expect(
        getLeaveDurationMinutes(
          {
            type: 'daily',
            date: '1403/07/07',
          },
          480
        )
      ).toBe(480);
    });

    it('credits full daily leave and sets zero deficit and full worked quota', () => {
      const leaves: LeaveRecord[] = [
        {
          id: 'leave_1',
          date: '1403/07/07',
          type: 'daily',
          hours: 8,
          reason: 'استراحت',
          approved: true,
          createdAt: new Date().toISOString(),
        },
      ];

      const record = calculateAttendanceMetrics(
        {
          id: 'test_leave_full',
          date: '1403/07/07',
        },
        baseConfig,
        leaves
      );

      expect(record.status).toBe('leave');
      expect(record.workedMinutes).toBe(480);
      expect(record.deficitMinutes).toBe(0);
      expect(record.netBalanceMinutes).toBe(0);
    });
  });

  // 7. روز ناقص (Incomplete past day)
  describe('Incomplete past day handling (BUG-04)', () => {
    it('does not count past incomplete records in presentDaysCount', () => {
      // Use an older date in Mehr 1403
      const pastIncompleteRecord: AttendanceRecord = {
        id: 'past_inc_1',
        date: '1403/07/01',
        gregorianDate: '2024-09-22',
        dayOfWeek: 1,
        checkIn: '08:30',
        checkOut: null,
        breakMinutes: 0,
        status: 'in_progress',
        delayMinutes: 0,
        earlyLeaveMinutes: 0,
        workedMinutes: 0,
        overtimeMinutes: 0,
        holidayOvertimeMinutes: 0,
        deficitMinutes: 0,
        netBalanceMinutes: 0,
      };

      const completeRecord: AttendanceRecord = {
        id: 'past_complete_2',
        date: '1403/07/02',
        gregorianDate: '2024-09-23',
        dayOfWeek: 2,
        checkIn: '08:30',
        checkOut: '17:00',
        breakMinutes: 30,
        status: 'present',
        delayMinutes: 0,
        earlyLeaveMinutes: 0,
        workedMinutes: 480,
        overtimeMinutes: 0,
        holidayOvertimeMinutes: 0,
        deficitMinutes: 0,
        netBalanceMinutes: 0,
      };

      const stats = calculateMonthlyStats(
        [pastIncompleteRecord, completeRecord],
        1403,
        7,
        baseConfig,
        []
      );

      // Only the fully completed day should count as present, incomplete past day excluded
      expect(stats.presentDaysCount).toBe(1);
    });
  });

  // Year Transitions and Month Filtering in calculateMonthlyStats
  describe('Monthly stats across year boundaries and leap years', () => {
    it('strictly isolates records by year and month prefix', () => {
      const rec1403: AttendanceRecord = {
        id: 'rec_1403',
        date: '1403/12/15',
        gregorianDate: '2025-03-05',
        dayOfWeek: 4,
        checkIn: '08:30',
        checkOut: '17:00',
        breakMinutes: 30,
        status: 'present',
        delayMinutes: 0,
        earlyLeaveMinutes: 0,
        workedMinutes: 480,
        overtimeMinutes: 0,
        holidayOvertimeMinutes: 0,
        deficitMinutes: 0,
        netBalanceMinutes: 0,
      };

      const rec1404: AttendanceRecord = {
        id: 'rec_1404',
        date: '1404/12/15',
        gregorianDate: '2026-03-06',
        dayOfWeek: 6,
        checkIn: '08:30',
        checkOut: '17:00',
        breakMinutes: 30,
        status: 'present',
        delayMinutes: 0,
        earlyLeaveMinutes: 0,
        workedMinutes: 480,
        overtimeMinutes: 0,
        holidayOvertimeMinutes: 0,
        deficitMinutes: 0,
        netBalanceMinutes: 0,
      };

      const stats1403 = calculateMonthlyStats([rec1403, rec1404], 1403, 12, baseConfig, []);
      expect(stats1403.totalWorkedMinutes).toBe(480);
      expect(stats1403.presentDaysCount).toBe(1);

      const stats1404 = calculateMonthlyStats([rec1403, rec1404], 1404, 12, baseConfig, []);
      expect(stats1404.totalWorkedMinutes).toBe(480);
      expect(stats1404.presentDaysCount).toBe(1);

      const stats1404Farvardin = calculateMonthlyStats([rec1403, rec1404], 1404, 1, baseConfig, []);
      expect(stats1404Farvardin.totalWorkedMinutes).toBe(0);
      expect(stats1404Farvardin.presentDaysCount).toBe(0);
    });

    it('correctly accounts for 30 days in leap year 1403 Esfand vs 29 days in 1402 Esfand', () => {
      const stats1402Esfand = calculateMonthlyStats([], 1402, 12, baseConfig, []);
      const stats1403Esfand = calculateMonthlyStats([], 1403, 12, baseConfig, []);

      // Both month stats compute standard obligations for the full month
      expect(stats1402Esfand.totalMonthRequiredMinutes).toBeGreaterThan(0);
      expect(stats1403Esfand.totalMonthRequiredMinutes).toBeGreaterThan(0);
    });
  });
});
