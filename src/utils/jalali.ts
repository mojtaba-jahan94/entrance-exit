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
  { month: 1, day: 12, title: 'روز جمهوری اسلامی', isOfficial: true },
  { month: 1, day: 13, title: 'روز طبیعت (سیزده‌بدر)', isOfficial: true },
  { month: 3, day: 14, title: 'رحلت امام خمینی', isOfficial: true },
  { month: 3, day: 15, title: 'قیام ۱۵ خرداد', isOfficial: true },
  { month: 11, day: 22, title: 'پیروزی انقلاب اسلامی', isOfficial: true },
  { month: 12, day: 29, title: 'روز ملی شدن صنعت نفت', isOfficial: true },
];

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
 * Checks if a date is a known official holiday
 */
export function checkOfficialHoliday(jy: number, jm: number, jd: number): { isHoliday: boolean; title?: string } {
  // Check known fixed solar holidays
  const fixed = KNOWN_OFFICIAL_HOLIDAYS.find((h) => h.month === jm && h.day === jd);
  if (fixed) {
    return { isHoliday: true, title: fixed.title };
  }
  return { isHoliday: false };
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
