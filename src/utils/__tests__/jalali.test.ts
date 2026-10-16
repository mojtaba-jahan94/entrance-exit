import { describe, it, expect, vi } from 'vitest';
import {
  getDaysInJalaliMonth,
  getJalaliWeekdayIndex,
  getJalaliWeekdayName,
  checkOfficialHoliday,
  getHolidayForDate,
  parseJalaliDate,
  formatJalaliDate,
  timeStringToMinutes,
  formatMinutesToTimeString,
} from '../jalali';

describe('Jalali Calendar Utilities', () => {
  // 8. ماه ۳۱ روزه
  it('returns 31 days for the first 6 months of Jalali calendar', () => {
    // Months 1 to 6 (Farvardin to Shahrivar) always have 31 days
    for (let month = 1; month <= 6; month++) {
      expect(getDaysInJalaliMonth(1403, month)).toBe(31);
      expect(getDaysInJalaliMonth(1402, month)).toBe(31);
    }

    // Months 7 to 11 (Mehr to Bahman) have 30 days
    for (let month = 7; month <= 11; month++) {
      expect(getDaysInJalaliMonth(1403, month)).toBe(30);
    }
  });

  // 9. سال کبیسه جلالی
  describe('Jalali Leap Year handling', () => {
    it('accurately identifies 30 days in Esfand for leap year 1403 and 29 days for 1402', () => {
      // 1403 is a leap year (کبیسه) -> Esfand has 30 days
      expect(getDaysInJalaliMonth(1403, 12)).toBe(30);

      // 1402 is a normal year -> Esfand has 29 days
      expect(getDaysInJalaliMonth(1402, 12)).toBe(29);
    });

    it('recognizes 30th Esfand in leap year 1403 as an official holiday', () => {
      const holidayCheck = checkOfficialHoliday(1403, 12, 30);
      expect(holidayCheck.isHoliday).toBe(true);
      expect(holidayCheck.title).toContain('عید نوروز');
    });
  });

  // 10. جمعه (Friday detection & weekly off)
  describe('Friday detection', () => {
    it('correctly maps Friday to weekday index 6', () => {
      // 1403/07/06 was a Friday
      const weekdayIdx = getJalaliWeekdayIndex('1403/07/06');
      expect(weekdayIdx).toBe(6);
      expect(getJalaliWeekdayName('1403/07/06')).toBe('جمعه');
    });

    it('identifies Friday as holiday in getHolidayForDate', () => {
      const holidayInfo = getHolidayForDate('1403/07/06');
      expect(holidayInfo.isHoliday).toBe(true);
      expect(holidayInfo.title).toContain('جمعه');
    });
  });

  // BUG-06: parseJalaliDate returns null on invalid input
  describe('parseJalaliDate robustness (BUG-06)', () => {
    it('returns null on invalid or corrupt date inputs instead of falling back to today', () => {
      expect(parseJalaliDate('')).toBeNull();
      expect(parseJalaliDate('invalid-date')).toBeNull();
      expect(parseJalaliDate('1403/13/01')).toBeNull(); // invalid month 13
      expect(parseJalaliDate('1403/07/35')).toBeNull(); // invalid day 35
      expect(parseJalaliDate('999/01/01')).toBeNull(); // out of supported range (< 1200)
    });

    it('correctly parses valid Jalali dates', () => {
      const parsed = parseJalaliDate('1403/07/15');
      expect(parsed).toEqual({ jy: 1403, jm: 7, jd: 15 });
    });

    it('accurately validates month lengths and leap years', () => {
      // 1403/12/30 is valid because 1403 is a leap year (کبیسه)
      expect(parseJalaliDate('1403/12/30')).toEqual({ jy: 1403, jm: 12, jd: 30 });

      // 1402/12/30 is invalid because 1402 is not a leap year (Esfand has 29 days)
      expect(parseJalaliDate('1402/12/30')).toBeNull();

      // 1403/07/31 is invalid because Mehr has 30 days
      expect(parseJalaliDate('1403/07/31')).toBeNull();

      // 1403/06/31 is valid because Shahrivar has 31 days
      expect(parseJalaliDate('1403/06/31')).toEqual({ jy: 1403, jm: 6, jd: 31 });
    });
  });

  // BUG-07: Warn for years beyond 1407 for lunar holidays
  describe('Lunar holidays boundary warning (BUG-07)', () => {
    it('logs a console warning when checking holidays for year > 1407', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      checkOfficialHoliday(1408, 1, 1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('فقط تا پایان سال ۱۴۰۷ تعریف شده‌اند')
      );
      warnSpy.mockRestore();
    });
  });

  // Time conversion helpers
  describe('Time conversion utilities', () => {
    it('converts time strings to minutes and back accurately', () => {
      expect(timeStringToMinutes('08:30')).toBe(510);
      expect(timeStringToMinutes('17:10')).toBe(1030);
      expect(formatMinutesToTimeString(510)).toBe('08:30');
      expect(formatMinutesToTimeString(1030)).toBe('17:10');
      expect(formatJalaliDate(1403, 7, 5)).toBe('1403/07/05');
    });
  });
});
