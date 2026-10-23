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
  getJalaliMonthGrid,
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

  // Year Transitions and Month Boundary Navigation
  describe('Year boundary transitions and weekday continuity', () => {
    it('maintains continuous weekdays across non-leap year boundary (1402 Esfand -> 1403 Farvardin)', () => {
      // 1402 was not a leap year; Esfand ended on day 29
      const lastDay1402 = '1402/12/29';
      const firstDay1403 = '1403/01/01';

      const lastDayIdx = getJalaliWeekdayIndex(lastDay1402); // سه‌شنبه (Tuesday = 3)
      const firstDayIdx = getJalaliWeekdayIndex(firstDay1403); // چهارشنبه (Wednesday = 4)

      expect(lastDayIdx).toBe(3);
      expect(getJalaliWeekdayName(lastDay1402)).toBe('سه‌شنبه');
      expect(firstDayIdx).toBe(4);
      expect(getJalaliWeekdayName(firstDay1403)).toBe('چهارشنبه');
      expect((lastDayIdx + 1) % 7).toBe(firstDayIdx);
    });

    it('maintains continuous weekdays across leap year boundary (1403 Esfand -> 1404 Farvardin)', () => {
      // 1403 was a leap year; Esfand had 30 days
      const day29 = '1403/12/29';
      const day30 = '1403/12/30';
      const firstDay1404 = '1404/01/01';

      const day29Idx = getJalaliWeekdayIndex(day29); // چهارشنبه (Wednesday = 4)
      const day30Idx = getJalaliWeekdayIndex(day30); // پنج‌شنبه (Thursday = 5)
      const firstDayIdx = getJalaliWeekdayIndex(firstDay1404); // جمعه (Friday = 6)

      expect(day29Idx).toBe(4);
      expect(getJalaliWeekdayName(day29)).toBe('چهارشنبه');

      expect(day30Idx).toBe(5);
      expect(getJalaliWeekdayName(day30)).toBe('پنج‌شنبه');

      expect(firstDayIdx).toBe(6);
      expect(getJalaliWeekdayName(firstDay1404)).toBe('جمعه');

      expect((day29Idx + 1) % 7).toBe(day30Idx);
      expect((day30Idx + 1) % 7).toBe(firstDayIdx);
    });
  });

  // Calendar Grid Matrix across Year Transitions
  describe('Calendar Grid generation across Year boundaries (getJalaliMonthGrid)', () => {
    it('correctly includes leap day 1403/12/30 in previous month padding for 1404/01', () => {
      const cells = getJalaliMonthGrid(1404, 1);

      // 1404/01/01 is Friday (weekday index 6), so grid has 6 padding days from 1403/12
      const prevMonthPadding = cells.filter((c: any) => !c.isCurrentMonth && c.jm === 12);
      expect(prevMonthPadding.length).toBe(6);

      // The last padding day must be 1403/12/30 (Thursday)
      const lastPadding = prevMonthPadding[prevMonthPadding.length - 1];
      expect(lastPadding.jy).toBe(1403);
      expect(lastPadding.jm).toBe(12);
      expect(lastPadding.jd).toBe(30);
      expect(lastPadding.dateStr).toBe('1403/12/30');
      expect(lastPadding.weekdayName).toBe('پنج‌شنبه');

      // The first current month day must be 1404/01/01 (Friday)
      const firstCurrent = cells.find((c: any) => c.isCurrentMonth && c.jd === 1);
      expect(firstCurrent).toBeDefined();
      expect(firstCurrent!.jy).toBe(1404);
      expect(firstCurrent!.jm).toBe(1);
      expect(firstCurrent!.dateStr).toBe('1404/01/01');
      expect(firstCurrent!.weekdayName).toBe('جمعه');
    });

    it('correctly pads 1403/01 with 1402/12 non-leap days ending on 29', () => {
      const cells = getJalaliMonthGrid(1403, 1);

      // 1403/01/01 is Wednesday (weekday index 4), so grid has 4 padding days (Sat, Sun, Mon, Tue)
      const prevMonthPadding = cells.filter((c: any) => !c.isCurrentMonth && c.jm === 12);
      expect(prevMonthPadding.length).toBe(4);

      const lastPadding = prevMonthPadding[prevMonthPadding.length - 1];
      expect(lastPadding.jy).toBe(1402);
      expect(lastPadding.jm).toBe(12);
      expect(lastPadding.jd).toBe(29);
      expect(lastPadding.dateStr).toBe('1402/12/29');
      expect(lastPadding.weekdayName).toBe('سه‌شنبه');
    });

    it('pads next month cells with year increment for Esfand (month 12)', () => {
      const cells = getJalaliMonthGrid(1403, 12);

      // Month 12 has 30 days for 1403
      const currentDays = cells.filter((c: any) => c.isCurrentMonth);
      expect(currentDays.length).toBe(30);

      // Any next month padding should belong to 1404/01
      const nextMonthPadding = cells.filter((c: any) => !c.isCurrentMonth && c.jm === 1);
      expect(nextMonthPadding.length).toBeGreaterThan(0);
      expect(nextMonthPadding[0].jy).toBe(1404);
      expect(nextMonthPadding[0].jm).toBe(1);
      expect(nextMonthPadding[0].jd).toBe(1);
      expect(nextMonthPadding[0].dateStr).toBe('1404/01/01');
    });
  });

  // Official Holidays consistency across multiple years
  describe('Holidays across multiple years', () => {
    it('correctly identifies fixed solar holidays regardless of year', () => {
      const testYears = [1401, 1402, 1403, 1404, 1405, 1406, 1407, 1408];
      for (const y of testYears) {
        const nowruz = checkOfficialHoliday(y, 1, 1);
        expect(nowruz.isHoliday).toBe(true);
        expect(nowruz.title).toContain('نوروز');

        const natureDay = checkOfficialHoliday(y, 1, 13);
        expect(natureDay.isHoliday).toBe(true);
        expect(natureDay.title).toContain('طبیعت');

        const revolution = checkOfficialHoliday(y, 11, 22);
        expect(revolution.isHoliday).toBe(true);
        expect(revolution.title).toContain('انقلاب');
      }
    });

    it('accurately identifies lunar holidays and combines co-occurring titles for 1403', () => {
      // 1403/01/13: Nature Day + Martyrdom of Imam Ali (21 Ramadan 1445)
      const day13Farvardin = checkOfficialHoliday(1403, 1, 13);
      expect(day13Farvardin.isHoliday).toBe(true);
      expect(day13Farvardin.title).toContain('طبیعت');
      expect(day13Farvardin.title).toContain('شهادت حضرت علی');

      // 1403/01/22: Eid al-Fitr
      const eidFitr = checkOfficialHoliday(1403, 1, 22);
      expect(eidFitr.isHoliday).toBe(true);
      expect(eidFitr.title).toContain('عید سعید فطر');

      // 1403/06/04: Arbaeen
      const arbaeen = checkOfficialHoliday(1403, 6, 4);
      expect(arbaeen.isHoliday).toBe(true);
      expect(arbaeen.title).toContain('اربعین');

      // 1403/10/25: Father's Day
      const fathersDay = checkOfficialHoliday(1403, 10, 25);
      expect(fathersDay.isHoliday).toBe(true);
      expect(fathersDay.title).toContain('روز پدر');

      // 1403/11/09: Mab'ath
      const mabath = checkOfficialHoliday(1403, 11, 9);
      expect(mabath.isHoliday).toBe(true);
      expect(mabath.title).toContain('مبعث');

      // 1403/11/26: Nimeh Shaban
      const nimehShaban = checkOfficialHoliday(1403, 11, 26);
      expect(nimehShaban.isHoliday).toBe(true);
      expect(nimehShaban.title).toContain('نیمه شعبان');
    });

    it('accurately identifies calibrated official holidays for 1404 according to Geophysics Calendar Center', () => {
      // 1404/01/02: Nowruz + Martyrdom of Imam Ali
      const day2Farvardin = checkOfficialHoliday(1404, 1, 2);
      expect(day2Farvardin.isHoliday).toBe(true);
      expect(day2Farvardin.title).toContain('نوروز');
      expect(day2Farvardin.title).toContain('شهادت حضرت علی');

      // 1404/01/11 & 1404/01/12: Eid Fitr
      const eidFitr1 = checkOfficialHoliday(1404, 1, 11);
      expect(eidFitr1.isHoliday).toBe(true);
      expect(eidFitr1.title).toContain('عید سعید فطر');

      const eidFitr2 = checkOfficialHoliday(1404, 1, 12);
      expect(eidFitr2.isHoliday).toBe(true);
      expect(eidFitr2.title).toContain('جمهوری اسلامی');
      expect(eidFitr2.title).toContain('تعطیلی عید سعید فطر');

      // 1404/05/23: Arbaeen (23 Mordad, NOT 24 Mordad)
      const arbaeen = checkOfficialHoliday(1404, 5, 23);
      expect(arbaeen.isHoliday).toBe(true);
      expect(arbaeen.title).toContain('اربعین');
      expect(checkOfficialHoliday(1404, 5, 24).isHoliday).toBe(false);

      // 1404/05/31: Departure of the Prophet (31 Mordad, NOT 1 Shahrivar)
      const prophetDeparture = checkOfficialHoliday(1404, 5, 31);
      expect(prophetDeparture.isHoliday).toBe(true);
      expect(prophetDeparture.title).toContain('رحلت پیامبر اکرم');

      // 1404/06/02: Martyrdom of Imam Reza (2 Shahrivar, NOT 3 Shahrivar)
      const imamReza = checkOfficialHoliday(1404, 6, 2);
      expect(imamReza.isHoliday).toBe(true);
      expect(imamReza.title).toContain('امام رضا');

      // 1404/09/03: Martyrdom of Hazrat Fatima (3 Azar, NOT 4 Azar)
      const fatimaZahra = checkOfficialHoliday(1404, 9, 3);
      expect(fatimaZahra.isHoliday).toBe(true);
      expect(fatimaZahra.title).toContain('فاطمه زهرا');

      // 1404/10/13: Father's Day (13 Dey, NOT 14 Dey)
      const fathersDay = checkOfficialHoliday(1404, 10, 13);
      expect(fathersDay.isHoliday).toBe(true);
      expect(fathersDay.title).toContain('روز پدر');

      // 1404/10/27: Mab'ath (27 Dey, NOT 28 Dey)
      const mabath = checkOfficialHoliday(1404, 10, 27);
      expect(mabath.isHoliday).toBe(true);
      expect(mabath.title).toContain('مبعث');

      // 1404/12/20: Second martyrdom of Imam Ali in 1404 (20 Esfand, NOT 29 Esfand)
      const secondImamAli = checkOfficialHoliday(1404, 12, 20);
      expect(secondImamAli.isHoliday).toBe(true);
      expect(secondImamAli.title).toContain('شهادت حضرت علی');
    });

    it('accurately identifies calibrated official holidays for 1405 according to Geophysics Calendar Center', () => {
      // 1405/01/01: Nowruz + Eid al-Fitr
      const day1 = checkOfficialHoliday(1405, 1, 1);
      expect(day1.isHoliday).toBe(true);
      expect(day1.title).toContain('نوروز');
      expect(day1.title).toContain('عید سعید فطر');

      // 1405/03/14: Khomeini Departure + Eid al-Ghadir
      const day14Khordad = checkOfficialHoliday(1405, 3, 14);
      expect(day14Khordad.isHoliday).toBe(true);
      expect(day14Khordad.title).toContain('امام خمینی');
      expect(day14Khordad.title).toContain('عید سعید غدیر خم');

      // 1405/04/03 & 1405/04/04: Tasua & Ashura
      expect(checkOfficialHoliday(1405, 4, 3).title).toContain('تاسوعای حسینی');
      expect(checkOfficialHoliday(1405, 4, 4).title).toContain('عاشورای حسینی');

      // 1405/05/13: Arbaeen
      expect(checkOfficialHoliday(1405, 5, 13).title).toContain('اربعین');

      // 1405/12/09: Martyrdom of Imam Ali
      expect(checkOfficialHoliday(1405, 12, 9).title).toContain('شهادت حضرت علی');
    });
  });
});
