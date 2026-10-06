import * as jalaali from 'jalaali-js';
import type { OfficialHoliday } from '../types';

export const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const PERSIAN_WEEKDAY_NAMES = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
];

export const PERSIAN_WEEKDAY_SHORT = [
  'ش',
  'ی',
  'د',
  'س',
  'چ',
  'پ',
  'ج',
];

// Common Persian fixed holidays list for Jalali calendar
export const KNOWN_OFFICIAL_HOLIDAYS: OfficialHoliday[] = [
  { month: 1, day: 1, title: 'آغاز سال نو (نوروز)', isOfficial: true },
  { month: 1, day: 2, title: 'عید نوروز', isOfficial: true },
  { month: 1, day: 3, title: 'عید نوروز', isOfficial: true },
  { month: 1, day: 4, title: 'عید نوروز', isOfficial: true },
  { month: 1, day: 12, title: 'روز جمهوری اسلامی ایران', isOfficial: true },
  { month: 1, day: 13, title: 'روز طبیعت (سیزده‌بدر)', isOfficial: true },
  { month: 3, day: 14, title: 'رحلت حضرت امام خمینی', isOfficial: true },
  { month: 3, day: 15, title: 'قیام خونین ۱۵ خرداد', isOfficial: true },
  { month: 11, day: 22, title: 'پیروزی انقلاب اسلامی', isOfficial: true },
  { month: 12, day: 29, title: 'روز ملی شدن صنعت نفت', isOfficial: true },
];

/**
 * Official Iranian Lunar Holidays mapped to Jalali dates for years 1401 to 1407
 */
export const KNOWN_LUNAR_HOLIDAYS: Record<string, string> = {
  // 1401
  '1401/1/2': 'شهادت حضرت علی (ع)',
  '1401/2/12': 'عید سعید فطر',
  '1401/2/13': 'تعطیلی عید فطر',
  '1401/3/5': 'شهادت امام جعفر صادق (ع)',
  '1401/4/19': 'عید سعید قربان',
  '1401/4/27': 'عید سعید غدیر خم',
  '1401/5/16': 'تاسوعای حسینی',
  '1401/5/17': 'عاشورای حسینی',
  '1401/6/26': 'اربعین حسینی',
  '1401/7/3': 'رحلت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)',
  '1401/7/5': 'شهادت امام رضا (ع)',
  '1401/7/13': 'شهادت امام حسن عسکری (ع)',
  '1401/7/22': 'میلاد رسول اکرم (ص) و امام صادق (ع)',
  '1401/10/6': 'شهادت حضرت فاطمه زهرا (س)',
  '1401/11/15': 'ولادت امام علی (ع) و روز پدر',
  '1401/11/29': 'مبعث رسول اکرم (ص)',
  '1401/12/17': 'ولادت حضرت قائم (عج) و نیمه شعبان',

  // 1402
  '1402/1/23': 'شهادت حضرت علی (ع)',
  '1402/2/2': 'عید سعید فطر',
  '1402/2/3': 'تعطیلی عید سعید فطر',
  '1402/2/26': 'شهادت امام جعفر صادق (ع)',
  '1402/4/8': 'عید سعید قربان',
  '1402/4/16': 'عید سعید غدیر خم',
  '1402/5/5': 'تاسوعای حسینی',
  '1402/5/6': 'عاشورای حسینی',
  '1402/6/15': 'اربعین حسینی',
  '1402/6/23': 'رحلت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)',
  '1402/6/25': 'شهادت امام رضا (ع)',
  '1402/7/2': 'شهادت امام حسن عسکری (ع)',
  '1402/7/11': 'میلاد رسول اکرم (ص) و امام جعفر صادق (ع)',
  '1402/9/26': 'شهادت حضرت فاطمه زهرا (س)',
  '1402/11/5': 'ولادت حضرت امام علی (ع) و روز پدر',
  '1402/11/19': 'مبعث رسول اکرم (ص)',
  '1402/12/6': 'ولادت حضرت قائم (عج) و نیمه شعبان',

  // 1403
  '1403/1/12': 'شهادت حضرت علی (ع)',
  '1403/1/22': 'عید سعید فطر',
  '1403/1/23': 'تعطیلی عید سعید فطر',
  '1403/2/15': 'شهادت امام جعفر صادق (ع)',
  '1403/3/28': 'عید سعید قربان',
  '1403/4/5': 'عید سعید غدیر خم',
  '1403/4/25': 'تاسوعای حسینی',
  '1403/4/26': 'عاشورای حسینی',
  '1403/6/4': 'اربعین حسینی',
  '1403/6/12': 'رحلت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)',
  '1403/6/14': 'شهادت امام رضا (ع)',
  '1403/6/22': 'شهادت امام حسن عسکری (ع)',
  '1403/6/31': 'میلاد حضرت رسول اکرم (ص) و امام جعفر صادق (ع)',
  '1403/9/15': 'شهادت حضرت فاطمه زهرا (س)',
  '1403/10/25': 'ولادت حضرت امام علی (ع) و روز پدر',
  '1403/11/9': 'مبعث رسول اکرم (ص)',
  '1403/11/26': 'ولادت حضرت قائم (عج) و نیمه شعبان',

  // 1404
  '1404/1/1': 'شهادت حضرت علی (ع)',
  '1404/1/11': 'عید سعید فطر',
  '1404/1/12': 'تعطیلی عید سعید فطر',
  '1404/2/4': 'شهادت امام جعفر صادق (ع)',
  '1404/3/16': 'عید سعید قربان',
  '1404/3/24': 'عید سعید غدیر خم',
  '1404/4/14': 'تاسوعای حسینی',
  '1404/4/15': 'عاشورای حسینی',
  '1404/5/24': 'اربعین حسینی',
  '1404/6/1': 'رحلت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)',
  '1404/6/3': 'شهادت امام رضا (ع)',
  '1404/6/11': 'شهادت امام حسن عسکری (ع)',
  '1404/6/20': 'میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)',
  '1404/9/4': 'شهادت حضرت فاطمه زهرا (س)',
  '1404/10/14': 'ولادت حضرت امام علی (ع) و روز پدر',
  '1404/10/28': 'مبعث رسول اکرم (ص)',
  '1404/11/15': 'ولادت حضرت قائم (عج) و نیمه شعبان',
  '1404/12/29': 'شهادت حضرت علی (ع)',

  // 1405
  '1405/1/1': 'عید سعید فطر',
  '1405/1/2': 'تعطیلی عید سعید فطر',
  '1405/1/24': 'شهادت امام جعفر صادق (ع)',
  '1405/3/6': 'عید سعید قربان',
  '1405/3/14': 'عید سعید غدیر خم',
  '1405/4/3': 'تاسوعای حسینی',
  '1405/4/4': 'عاشورای حسینی',
  '1405/5/13': 'اربعین حسینی',
  '1405/5/21': 'رحلت رسول اکرم (ص) و شهادت امام حسن مجتبی (ع)',
  '1405/5/23': 'شهادت امام رضا (ع)',
  '1405/5/31': 'شهادت امام حسن عسکری (ع)',
  '1405/6/9': 'میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)',
  '1405/8/23': 'شهادت حضرت فاطمه زهرا (س)',
  '1405/10/3': 'ولادت حضرت امام علی (ع) و روز پدر',
  '1405/10/17': 'مبعث رسول اکرم (ص)',
  '1405/11/4': 'ولادت حضرت قائم (عج) و نیمه شعبان',
  '1405/12/18': 'شهادت حضرت علی (ع)',

  // 1406
  '1406/1/13': 'شهادت امام جعفر صادق (ع)',
  '1406/2/26': 'عید سعید قربان',
  '1406/3/3': 'عید سعید غدیر خم',
  '1406/3/23': 'تاسوعای حسینی',
  '1406/3/24': 'عاشورای حسینی',
  '1406/5/2': 'اربعین حسینی',
  '1406/5/10': 'رحلت رسول اکرم (ص) و شهادت امام حسن مجتبی (ع)',
  '1406/5/12': 'شهادت امام رضا (ع)',
  '1406/5/20': 'شهادت امام حسن عسکری (ع)',
  '1406/5/29': 'میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)',
  '1406/8/12': 'شهادت حضرت فاطمه زهرا (س)',
  '1406/9/22': 'ولادت حضرت علی (ع) و روز پدر',
  '1406/10/7': 'مبعث رسول اکرم (ص)',
  '1406/10/24': 'ولادت حضرت قائم (عج) و نیمه شعبان',
  '1406/12/7': 'شهادت حضرت علی (ع)',
  '1406/12/18': 'عید سعید فطر',
  '1406/12/19': 'تعطیلی عید سعید فطر',

  // 1407
  '1407/1/2': 'شهادت امام جعفر صادق (ع)',
  '1407/2/16': 'عید سعید قربان',
  '1407/2/24': 'عید سعید غدیر خم',
  '1407/3/13': 'تاسوعای حسینی',
  '1407/3/14': 'عاشورای حسینی',
  '1407/4/22': 'اربعین حسینی',
  '1407/4/30': 'رحلت رسول اکرم (ص) و شهادت امام حسن مجتبی (ع)',
  '1407/5/1': 'شهادت امام رضا (ع)',
  '1407/5/9': 'شهادت امام حسن عسکری (ع)',
  '1407/5/18': 'میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)',
  '1407/8/1': 'شهادت حضرت فاطمه زهرا (س)',
  '1407/9/12': 'ولادت حضرت امام علی (ع) و روز پدر',
  '1407/9/26': 'مبعث رسول اکرم (ص)',
  '1407/10/14': 'ولادت حضرت قائم (عج) و نیمه شعبان',
  '1407/11/26': 'شهادت حضرت علی (ع)',
  '1407/12/7': 'عید سعید فطر',
  '1407/12/8': 'تعطیلی عید سعید فطر',
};

/**
 * Converts English digits to Persian digits
 */
export function toPersianDigits(num: number | string): string {
  if (num === null || num === undefined) return '';
  const str = String(num);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

/**
 * Converts Persian digits to English digits
 */
export function toEnglishDigits(str: string): string {
  if (!str) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[۰-۹]/g, (w) => String(persianDigits.indexOf(w)));
}

/**
 * Returns current Jalali date object { jy, jm, jd }
 */
export function getCurrentJalaliDate(): { jy: number; jm: number; jd: number } {
  const now = new Date();
  return jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Formats Jalali date to standard string "1403/07/05"
 */
export function formatJalaliDate(jy: number, jm: number, jd: number): string {
  const m = jm < 10 ? `0${jm}` : `${jm}`;
  const d = jd < 10 ? `0${jd}` : `${jd}`;
  return `${jy}/${m}/${d}`;
}

/**
 * Returns current Jalali date formatted "1403/07/05"
 */
export function getTodayJalaliString(): string {
  const { jy, jm, jd } = getCurrentJalaliDate();
  return formatJalaliDate(jy, jm, jd);
}

/**
 * Parses Jalali string "1403/07/05" into { jy, jm, jd }
 */
export function parseJalaliDate(dateStr: string): { jy: number; jm: number; jd: number } {
  const normalized = toEnglishDigits(dateStr).trim();
  const parts = normalized.split(/[\/\-]/).map((p) => parseInt(p, 10));
  if (parts.length >= 3) {
    return { jy: parts[0], jm: parts[1], jd: parts[2] };
  }
  const cur = getCurrentJalaliDate();
  return cur;
}

/**
 * Converts Jalali date string to Gregorian Date object
 */
export function jalaliToGregorianDate(dateStr: string): Date {
  const { jy, jm, jd } = parseJalaliDate(dateStr);
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
}

/**
 * Converts Gregorian Date to Jalali string "1403/07/05"
 */
export function gregorianToJalaliString(date: Date): string {
  const { jy, jm, jd } = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return formatJalaliDate(jy, jm, jd);
}

/**
 * Get weekday index for a Jalali date string:
 * 0: شنبه, 1: یکشنبه, ..., 6: جمعه
 */
export function getJalaliWeekdayIndex(dateStr: string): number {
  const date = jalaliToGregorianDate(dateStr);
  const day = date.getDay(); // 0 is Sunday, 6 is Saturday in standard JS
  // Map JS Day (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
  // to Persian Weekday (0=Sat, 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri):
  return (day + 1) % 7;
}

/**
 * Returns weekday name in Persian for date string
 */
export function getJalaliWeekdayName(dateStr: string): string {
  const idx = getJalaliWeekdayIndex(dateStr);
  return PERSIAN_WEEKDAY_NAMES[idx] || '';
}

/**
 * Returns number of days in a given Jalali month (considering leap years)
 */
export function getDaysInJalaliMonth(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm);
}

/**
 * Checks if a date is a known official holiday (fixed solar + lunar)
 */
export function checkOfficialHoliday(jy: number, jm: number, jd: number): { isHoliday: boolean; title?: string } {
  // 1. Check known fixed solar holidays
  const fixed = KNOWN_OFFICIAL_HOLIDAYS.find((h) => h.month === jm && h.day === jd);
  if (fixed) {
    return { isHoliday: true, title: fixed.title };
  }

  // 2. Check 30th Esfand in leap years (always holiday)
  if (jm === 12 && jd === 30 && jalaali.isLeapJalaaliYear(jy)) {
    return { isHoliday: true, title: 'عید نوروز (روز پایانی سال)' };
  }

  // 3. Check known lunar holidays for the year
  const key = `${jy}/${jm}/${jd}`;
  if (KNOWN_LUNAR_HOLIDAYS[key]) {
    return { isHoliday: true, title: KNOWN_LUNAR_HOLIDAYS[key] };
  }

  return { isHoliday: false };
}

/**
 * Checks if a given Jalali date string is an official holiday
 */
export function getHolidayForDate(dateStr: string): { isHoliday: boolean; title?: string } {
  const { jy, jm, jd } = parseJalaliDate(dateStr);
  const weekday = getJalaliWeekdayIndex(dateStr);
  const isFri = weekday === 6;
  const official = checkOfficialHoliday(jy, jm, jd);

  if (official.isHoliday) {
    return { isHoliday: true, title: official.title };
  }
  if (isFri) {
    return { isHoliday: true, title: 'جمعه (تعطیل هفتگی)' };
  }
  return { isHoliday: false };
}

export interface JalaliCalendarCell {
  jy: number;
  jm: number;
  jd: number;
  dateStr: string;
  isCurrentMonth: boolean;
  dayOfWeek: number; // 0=Sat, 1=Sun, ..., 6=Fri
  weekdayName: string;
  isFriday: boolean;
  isOfficialHoliday: boolean;
  holidayTitle?: string;
  isHoliday: boolean; // Friday or Official holiday
  isToday: boolean;
}

/**
 * Generates the complete 7-column calendar matrix for a Jalali month,
 * including padding days from the previous and next months.
 */
export function getJalaliMonthGrid(jy: number, jm: number): JalaliCalendarCell[] {
  const daysInMonth = jalaali.jalaaliMonthLength(jy, jm);
  const firstDayStr = formatJalaliDate(jy, jm, 1);
  const firstDayWeekday = getJalaliWeekdayIndex(firstDayStr); // 0=Sat, ..., 6=Fri
  const todayStr = getTodayJalaliString();

  const cells: JalaliCalendarCell[] = [];

  // Previous month padding days
  if (firstDayWeekday > 0) {
    const prevYear = jm === 1 ? jy - 1 : jy;
    const prevMonth = jm === 1 ? 12 : jm - 1;
    const prevMonthDays = jalaali.jalaaliMonthLength(prevYear, prevMonth);
    const startPrevDay = prevMonthDays - firstDayWeekday + 1;

    for (let d = startPrevDay; d <= prevMonthDays; d++) {
      const dateStr = formatJalaliDate(prevYear, prevMonth, d);
      const wd = getJalaliWeekdayIndex(dateStr);
      const isFri = wd === 6;
      const official = checkOfficialHoliday(prevYear, prevMonth, d);

      cells.push({
        jy: prevYear,
        jm: prevMonth,
        jd: d,
        dateStr,
        isCurrentMonth: false,
        dayOfWeek: wd,
        weekdayName: PERSIAN_WEEKDAY_NAMES[wd],
        isFriday: isFri,
        isOfficialHoliday: official.isHoliday,
        holidayTitle: official.title || (isFri ? 'جمعه' : undefined),
        isHoliday: isFri || official.isHoliday,
        isToday: dateStr === todayStr,
      });
    }
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatJalaliDate(jy, jm, d);
    const wd = getJalaliWeekdayIndex(dateStr);
    const isFri = wd === 6;
    const official = checkOfficialHoliday(jy, jm, d);

    cells.push({
      jy,
      jm,
      jd: d,
      dateStr,
      isCurrentMonth: true,
      dayOfWeek: wd,
      weekdayName: PERSIAN_WEEKDAY_NAMES[wd],
      isFriday: isFri,
      isOfficialHoliday: official.isHoliday,
      holidayTitle: official.title || (isFri ? 'جمعه (تعطیل هفتگی)' : undefined),
      isHoliday: isFri || official.isHoliday,
      isToday: dateStr === todayStr,
    });
  }

  // Next month padding days to complete rows (multiples of 7: 35 or 42)
  const totalNeeded = cells.length > 35 ? 42 : 35;
  const remaining = totalNeeded - cells.length;
  if (remaining > 0) {
    const nextYear = jm === 12 ? jy + 1 : jy;
    const nextMonth = jm === 12 ? 1 : jm + 1;

    for (let d = 1; d <= remaining; d++) {
      const dateStr = formatJalaliDate(nextYear, nextMonth, d);
      const wd = getJalaliWeekdayIndex(dateStr);
      const isFri = wd === 6;
      const official = checkOfficialHoliday(nextYear, nextMonth, d);

      cells.push({
        jy: nextYear,
        jm: nextMonth,
        jd: d,
        dateStr,
        isCurrentMonth: false,
        dayOfWeek: wd,
        weekdayName: PERSIAN_WEEKDAY_NAMES[wd],
        isFriday: isFri,
        isOfficialHoliday: official.isHoliday,
        holidayTitle: official.title || (isFri ? 'جمعه' : undefined),
        isHoliday: isFri || official.isHoliday,
        isToday: dateStr === todayStr,
      });
    }
  }

  return cells;
}

/**
 * Formats minutes into standard Persian duration string: e.g. "۸ ساعت و ۳۰ دقیقه" or "08:30"
 */
export function formatMinutesToTimeString(totalMinutes: number, showSign = false): string {
  const sign = totalMinutes < 0 ? '-' : (showSign && totalMinutes > 0 ? '+' : '');
  const absMinutes = Math.abs(Math.round(totalMinutes));
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  const hStr = hours < 10 ? `0${hours}` : `${hours}`;
  const mStr = mins < 10 ? `0${mins}` : `${mins}`;
  return `${sign}${hStr}:${mStr}`;
}

export function formatMinutesToPersianReadable(totalMinutes: number): string {
  if (totalMinutes === 0) return '۰ دقیقه';
  const sign = totalMinutes < 0 ? 'منفی ' : '';
  const absMinutes = Math.abs(Math.round(totalMinutes));
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;

  if (hours > 0 && mins > 0) {
    return `${sign}${toPersianDigits(hours)} ساعت و ${toPersianDigits(mins)} دقیقه`;
  }
  if (hours > 0) {
    return `${sign}${toPersianDigits(hours)} ساعت`;
  }
  return `${sign}${toPersianDigits(mins)} دقیقه`;
}

/**
 * Formats current clock time (HH:MM:SS)
 */
export function getCurrentTimeString(includeSeconds = false): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  if (includeSeconds) {
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
  return `${h}:${m}`;
}

/**
 * Converts "HH:MM" to total minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = toEnglishDigits(timeStr).split(':');
  if (parts.length < 2) return 0;
  const hours = parseInt(parts[0], 10) || 0;
  const mins = parseInt(parts[1], 10) || 0;
  return hours * 60 + mins;
}
