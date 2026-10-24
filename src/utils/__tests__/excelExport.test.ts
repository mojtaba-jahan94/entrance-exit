import { describe, it, expect } from 'vitest';
import { buildFullMonthRows, exportMonthToExcelAdvanced } from '../exportEngine';
import { DEFAULT_SHIFT_CONFIG } from '../calculator';
import { AttendanceRecord, LeaveRecord } from '../../types';

describe('exportEngine', () => {
  const config = { ...DEFAULT_SHIFT_CONFIG };

  it('builds a complete full month of days (30 or 31 rows)', () => {
    const records: AttendanceRecord[] = [
      {
        id: 'rec_1',
        date: '1403/07/01',
        gregorianDate: '2024-09-22',
        dayOfWeek: 1, // یکشنبه
        status: 'present',
        checkIn: '08:30',
        checkOut: '17:00',
        breakMinutes: 30,
        workedMinutes: 480,
        delayMinutes: 0,
        earlyLeaveMinutes: 0,
        overtimeMinutes: 0,
        holidayOvertimeMinutes: 0,
        deficitMinutes: 0,
        netBalanceMinutes: 0,
        isHoliday: false,
      },
    ];

    const leaves: LeaveRecord[] = [
      {
        id: 'leave_1',
        date: '1403/07/05',
        type: 'daily',
        hours: 8,
        reason: 'امور شخصی',
        approved: true,
        createdAt: '2024-09-26',
      },
    ];

    // Mehr has 30 days
    const rows = buildFullMonthRows(records, leaves, config, 1403, 7);
    expect(rows.length).toBe(30);

    // Day 1 has attendance
    expect(rows[0].status).toBe('حاضر');
    expect(rows[0].checkIn).toBe('08:30');
    expect(rows[0].checkOut).toBe('17:00');

    // Day 5 has leave
    expect(rows[4].status).toContain('مرخصی');

    // Fridays should be marked as weekend
    const fridays = rows.filter((r) => r.isFriday);
    expect(fridays.length).toBeGreaterThanOrEqual(4);
    fridays.forEach((f) => {
      expect(f.status).toContain('جمعه');
    });
  });

  it('exports to excel buffer and returns success without crashing', async () => {
    const result = await exportMonthToExcelAdvanced(
      [],
      [],
      config,
      1403,
      7,
      'مهر',
      'مجتبی جهان'
    );

    expect(result.success).toBe(true);
    expect(result.fileName).toBe('گزارش_تردد_مهر_1403.xlsx');
    expect(result.rowCount).toBe(30);
  });
});
