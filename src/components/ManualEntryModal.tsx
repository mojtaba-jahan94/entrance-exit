import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Calendar,
  Check,
  AlertTriangle,
  Info,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import * as jalaali from 'jalaali-js';
import { AttendanceRecord, DayStatus, LeaveRecord, ShiftConfig } from '../types';
import {
  getCurrentJalaliDate,
  formatJalaliDate,
  parseJalaliDate,
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEKDAY_NAMES,
  getJalaliWeekdayIndex,
  toPersianDigits,
  timeStringToMinutes,
  checkOfficialHoliday,
  formatMinutesToTimeString,
} from '../utils/jalali';
import { calculateAttendanceMetrics, DEFAULT_SHIFT_CONFIG } from '../utils/calculator';
import { useFocusTrap } from '../utils/useFocusTrap';

export interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recordData: Partial<AttendanceRecord>) => void;
  initialRecord?: AttendanceRecord | null;
  existingRecords?: AttendanceRecord[];
  leaves?: LeaveRecord[];
  config?: ShiftConfig;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRecord,
  existingRecords = [],
  leaves = [],
  config,
}) => {
  const { jy: curY, jm: curM, jd: curD } = getCurrentJalaliDate();

  const [year, setYear] = useState<number>(curY);
  const [month, setMonth] = useState<number>(curM);
  const [day, setDay] = useState<number>(curD);

  const [checkIn, setCheckIn] = useState<string>('08:30');
  const [checkOut, setCheckOut] = useState<string>('17:00');
  const [breakMinutes, setBreakMinutes] = useState<number>(30);
  const [status, setStatus] = useState<DayStatus>('present');
  const [note, setNote] = useState<string>('');

  // Soft warning acknowledgment checkbox state
  const [allowHolidayRecord, setAllowHolidayRecord] = useState<boolean>(false);

  // Form field errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Confirmation state when closing dirty form
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState<boolean>(false);

  // Snapshot of initial values to determine `isDirty`
  const [initialSnapshot, setInitialSnapshot] = useState<{
    year: number;
    month: number;
    day: number;
    checkIn: string;
    checkOut: string;
    breakMinutes: number;
    status: DayStatus;
    note: string;
  } | null>(null);

  // Refs for auto-focusing first invalid field
  const daySelectRef = useRef<HTMLSelectElement>(null);
  const checkInInputRef = useRef<HTMLInputElement>(null);
  const checkOutInputRef = useRef<HTMLInputElement>(null);
  const breakMinutesInputRef = useRef<HTMLInputElement>(null);
  const holidayConfirmRef = useRef<HTMLInputElement>(null);

  // Days in selected Jalali month (dynamically accounts for 31, 30, or leap 29/30)
  const daysInCurrentMonth = useMemo(() => {
    return jalaali.jalaaliMonthLength(year, month);
  }, [year, month]);

  // Adjust day if selected month has fewer days
  useEffect(() => {
    if (day > daysInCurrentMonth) {
      setDay(daysInCurrentMonth);
    }
  }, [daysInCurrentMonth, day]);

  const dateStr = formatJalaliDate(year, month, day);
  const weekdayIdx = getJalaliWeekdayIndex(dateStr);
  const weekdayName = PERSIAN_WEEKDAY_NAMES[weekdayIdx] || '';
  const isThursday = weekdayIdx === 5;
  const isFriday = weekdayIdx === 6;

  // Initialize or reset form when modal opens or initialRecord changes
  useEffect(() => {
    if (!isOpen) return;

    let initY = curY;
    let initM = curM;
    let initD = curD;
    let initIn = '08:30';
    let initOut = isThursday ? '13:00' : '17:00';
    let initBreak = isThursday ? 0 : 30;
    let initStatus: DayStatus = 'present';
    let initNote = '';

    if (initialRecord) {
      if (initialRecord.date) {
        const parsed = parseJalaliDate(initialRecord.date);
        initY = parsed.jy;
        initM = parsed.jm;
        initD = parsed.jd;
      }
      initIn = initialRecord.checkIn || '';
      initOut = initialRecord.checkOut || '';
      initBreak = initialRecord.breakMinutes !== undefined ? initialRecord.breakMinutes : 30;
      initStatus = initialRecord.status || 'present';
      initNote = initialRecord.note || '';
    } else {
      const today = getCurrentJalaliDate();
      initY = today.jy;
      initM = today.jm;
      initD = today.jd;
    }

    setYear(initY);
    setMonth(initM);
    setDay(initD);
    setCheckIn(initIn);
    setCheckOut(initOut);
    setBreakMinutes(initBreak);
    setStatus(initStatus);
    setNote(initNote);
    setAllowHolidayRecord(false);
    setErrors({});
    setShowUnsavedConfirm(false);

    setInitialSnapshot({
      year: initY,
      month: initM,
      day: initD,
      checkIn: initIn,
      checkOut: initOut,
      breakMinutes: initBreak,
      status: initStatus,
      note: initNote,
    });
  }, [isOpen, initialRecord, curY, curM, curD, isThursday]);

  // Form dirty status
  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false;
    return (
      initialSnapshot.year !== year ||
      initialSnapshot.month !== month ||
      initialSnapshot.day !== day ||
      initialSnapshot.checkIn !== checkIn ||
      initialSnapshot.checkOut !== checkOut ||
      initialSnapshot.breakMinutes !== breakMinutes ||
      initialSnapshot.status !== status ||
      initialSnapshot.note !== note
    );
  }, [initialSnapshot, year, month, day, checkIn, checkOut, breakMinutes, status, note]);

  // Handle request to close modal (prompts if dirty)
  const handleAttemptClose = React.useCallback(() => {
    if (isDirty) {
      setShowUnsavedConfirm(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  // Accessible focus trap and Escape handler
  const modalRef = useFocusTrap(isOpen, handleAttemptClose);

  // 5. Holiday & Full-Day Leave Soft Warning Detection
  const holidayInfo = useMemo(() => checkOfficialHoliday(year, month, day), [year, month, day]);

  const matchingFullDayLeave = useMemo(() => {
    return leaves.find(
      (l) =>
        l.date === dateStr &&
        l.approved !== false &&
        (l.type === 'daily' ||
          l.type === 'sick' ||
          l.type === 'unpaid' ||
          (weekdayIdx === 5 && l.type === 'half_day'))
    );
  }, [leaves, dateStr, weekdayIdx]);

  const isSpecialHolidayOrFullLeave = Boolean(
    holidayInfo.isHoliday || isFriday || matchingFullDayLeave
  );

  const holidayReasonText = useMemo(() => {
    if (holidayInfo.isHoliday) {
      return holidayInfo.title || 'تعطیل رسمی';
    }
    if (isFriday) {
      return 'جمعه (تعطیل هفتگی)';
    }
    if (matchingFullDayLeave) {
      const typeLabel =
        matchingFullDayLeave.type === 'sick'
          ? 'استعلاجی'
          : matchingFullDayLeave.type === 'unpaid'
          ? 'بدون حقوق'
          : matchingFullDayLeave.type === 'half_day'
          ? 'نیم‌روز پنج‌شنبه'
          : 'روزانه';
      return `مرخصی کامل (${typeLabel})`;
    }
    return '';
  }, [holidayInfo, isFriday, matchingFullDayLeave]);

  // 6. Notice when date already has an existing record
  const existingRecordForDate = useMemo(() => {
    return existingRecords.find(
      (r) => r.date === dateStr && (!initialRecord?.id || r.id !== initialRecord.id)
    );
  }, [existingRecords, dateStr, initialRecord]);

  const isEditingExisting = Boolean(
    (initialRecord && initialRecord.date === dateStr && initialRecord.id) || existingRecordForDate
  );

  // 8. Resilient Live Calculation Preview (displays «—» on invalid inputs without throwing)
  const livePreview = useMemo(() => {
    // If times are missing
    if (!checkIn.trim() || !checkOut.trim()) {
      return {
        isValid: false,
        rawPresenceText: '—',
        breakText: '—',
        netWorkedText: '—',
        balanceMinutes: null,
      };
    }

    const inMins = timeStringToMinutes(checkIn);
    const outMins = timeStringToMinutes(checkOut);

    // If times are invalid or check-out is before/equal to check-in
    if (isNaN(inMins) || isNaN(outMins) || outMins <= inMins) {
      return {
        isValid: false,
        rawPresenceText: '—',
        breakText: '—',
        netWorkedText: '—',
        balanceMinutes: null,
      };
    }

    const rawPresence = outMins - inMins;
    const bMins = Number(breakMinutes) || 0;

    // If lunch break exceeds total presence
    if (bMins > rawPresence) {
      return {
        isValid: false,
        rawPresenceText: '—',
        breakText: '—',
        netWorkedText: '—',
        balanceMinutes: null,
      };
    }

    try {
      const activeConfig = config || DEFAULT_SHIFT_CONFIG;
      const metrics = calculateAttendanceMetrics(
        {
          date: dateStr,
          checkIn: checkIn.trim(),
          checkOut: checkOut.trim(),
          breakMinutes: bMins,
          status,
          note: note.trim(),
        },
        activeConfig,
        leaves
      );

      return {
        isValid: true,
        rawPresenceText: `${toPersianDigits(Math.floor(rawPresence / 60))}س و ${toPersianDigits(rawPresence % 60)}د`,
        breakText: `${toPersianDigits(metrics.breakMinutes)}د`,
        netWorkedText: `${toPersianDigits(Math.floor(metrics.workedMinutes / 60))}س و ${toPersianDigits(metrics.workedMinutes % 60)}د`,
        balanceMinutes: metrics.netBalanceMinutes,
      };
    } catch (err) {
      console.warn('Live preview calculation notice:', err);
      return {
        isValid: false,
        rawPresenceText: '—',
        breakText: '—',
        netWorkedText: '—',
        balanceMinutes: null,
      };
    }
  }, [checkIn, checkOut, breakMinutes, status, note, dateStr, config, leaves]);

  // Validation function
  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    const today = getCurrentJalaliDate();

    // 2. Future date check
    const isFutureDate =
      year > today.jy ||
      (year === today.jy && month > today.jm) ||
      (year === today.jy && month === today.jm && day > today.jd);

    if (isFutureDate) {
      newErrors.date = 'ثبت تردد برای تاریخ‌های آینده امکان‌پذیر نیست. لطفاً تاریخی تا امروز را انتخاب کنید.';
    }

    const isValidTimeFormat = (val: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(val.trim());

    // 4. Invalid or empty time checks
    if (!checkIn || !checkIn.trim()) {
      newErrors.checkIn = 'ساعت ورود نمی‌تواند خالی باشد.';
    } else if (!isValidTimeFormat(checkIn)) {
      newErrors.checkIn = 'فرمت ساعت ورود نامعتبر است (مثال: ۰۸:۳۰).';
    }

    if (!checkOut || !checkOut.trim()) {
      newErrors.checkOut = 'ساعت خروج نمی‌تواند خالی باشد.';
    } else if (!isValidTimeFormat(checkOut)) {
      newErrors.checkOut = 'فرمت ساعت خروج نامعتبر است (مثال: ۱۷:۰۰).';
    }

    // 1. Checkout before or equal to checkin
    if (checkIn && checkOut && isValidTimeFormat(checkIn) && isValidTimeFormat(checkOut)) {
      const inMins = timeStringToMinutes(checkIn);
      const outMins = timeStringToMinutes(checkOut);

      if (outMins <= inMins) {
        newErrors.checkOut = 'ساعت خروج باید بعد از ساعت ورود باشد (خروج نمی‌تواند قبل یا هم‌زمان با ورود باشد).';
      } else {
        // 3. Lunch break longer than total presence
        const presenceMins = outMins - inMins;
        const bMins = Number(breakMinutes) || 0;
        if (bMins > presenceMins) {
          newErrors.breakMinutes = `مدت ناهار (${toPersianDigits(bMins)} دقیقه) نمی‌تواند بیشتر از کل مدت حضور (${toPersianDigits(presenceMins)} دقیقه) باشد.`;
        }
      }
    }

    // 5. Soft warning: require acknowledgement to proceed on holiday/full leave
    if (isSpecialHolidayOrFullLeave && !allowHolidayRecord) {
      newErrors.holiday = 'این روز تعطیل رسمی یا دارای مرخصی کامل است. اگر مایل به ثبت تردد هستید، تیک تأیید ادامه را فعال کنید.';
    }

    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      // Auto-focus first invalid field
      if (validationErrors.date && daySelectRef.current) {
        daySelectRef.current.focus();
      } else if (validationErrors.checkIn && checkInInputRef.current) {
        checkInInputRef.current.focus();
      } else if (validationErrors.checkOut && checkOutInputRef.current) {
        checkOutInputRef.current.focus();
      } else if (validationErrors.breakMinutes && breakMinutesInputRef.current) {
        breakMinutesInputRef.current.focus();
      } else if (validationErrors.holiday && holidayConfirmRef.current) {
        holidayConfirmRef.current.focus();
      }
      return;
    }

    // Target ID if editing existing record
    const targetId = initialRecord?.id || existingRecordForDate?.id || undefined;

    onSave({
      id: targetId,
      date: dateStr,
      checkIn: checkIn ? checkIn.trim() : null,
      checkOut: checkOut ? checkOut.trim() : null,
      breakMinutes: Number(breakMinutes) || 0,
      status,
      note: note.trim(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-entry-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleAttemptClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg rounded-[32px] liquid-glass-modal p-5 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col border border-[var(--border)]"
      >
        {/* 7. Confirmation Modal on Unsaved Changes */}
        {showUnsavedConfirm && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="unsaved-title"
            aria-describedby="unsaved-desc"
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-5 rounded-[32px] backdrop-blur-md animate-in fade-in duration-150"
          >
            <div className="bg-[var(--surface)] border border-[var(--border-strong)] rounded-2xl p-5 max-w-sm w-full text-center shadow-2xl space-y-3.5">
              <div className="mx-auto w-11 h-11 rounded-full bg-[var(--semantic-warning)]/15 text-[var(--semantic-warning)] border border-[var(--semantic-warning)]/30 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h4 id="unsaved-title" className="text-sm font-bold text-[var(--text-main)]">
                تغییرات ذخیره‌نشده!
              </h4>
              <p id="unsaved-desc" className="text-xs text-muted leading-relaxed">
                تغییراتی در فرم وارد کرده‌اید که ذخیره نشده‌اند. آیا مطمئن هستید که می‌خواهید بدون ذخیره از فرم خارج شوید؟
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUnsavedConfirm(false)}
                  className="liquid-pill-btn px-4 py-2 text-xs font-semibold"
                >
                  ادامه ویرایش
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUnsavedConfirm(false);
                    onClose();
                  }}
                  className="rounded-full bg-[var(--semantic-danger)] text-[var(--bg)] px-4 py-2 text-xs font-bold shadow-md transition-opacity hover:opacity-90"
                >
                  خروج بدون ذخیره
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 sm:pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="rounded-2xl bg-[var(--surface-2)] p-2.5 text-[var(--accent)] border border-[var(--border)] shadow-inner">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 id="manual-entry-modal-title" className="text-sm sm:text-base font-bold text-[var(--text-main)]">
                {isEditingExisting ? 'ویرایش تردد' : 'ثبت تردد جدید'}
              </h3>
              <p className="text-[11px] sm:text-xs text-muted">
                تاریخ انتخاب‌شده: <span className="font-semibold text-[var(--text-main)]">{weekdayName}</span>،{' '}
                <span className="font-mono text-[var(--accent)]">{toPersianDigits(dateStr)}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAttemptClose}
            className="rounded-full p-2 text-muted hover:bg-[var(--surface-2)] hover:text-[var(--text-main)] transition-colors"
            title="بستن"
            aria-label="بستن فرم"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 6. Informative Banner: Editing Existing Record */}
        {isEditingExisting && (
          <div className="mt-3 rounded-2xl border border-[var(--semantic-info)]/30 bg-[var(--semantic-info)]/10 p-3 text-xs text-[var(--semantic-info)] flex items-start gap-2.5">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="block text-[var(--text-main)] font-bold">
                توجه: در حال ویرایش رکورد موجود
              </strong>
              <p className="text-[11px] text-[var(--text-main)]/85 leading-relaxed">
                برای تاریخ {toPersianDigits(dateStr)} قبلاً تردد ثبت شده است. ذخیره این فرم، رکورد موجود را با مقادیر جدید به‌روزرسانی خواهد کرد.
              </p>
            </div>
          </div>
        )}

        {/* 5. Soft Warning Banner: Official Holiday or Full Leave */}
        {isSpecialHolidayOrFullLeave && (
          <div className="mt-3 rounded-2xl border border-[var(--semantic-warning)]/30 bg-[var(--semantic-warning)]/10 p-3 text-xs text-[var(--semantic-warning)] space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="block text-[var(--text-main)] font-bold">
                  هشدار: این روز «{holidayReasonText}» است
                </strong>
                <p className="text-[11px] text-[var(--text-main)]/85 leading-relaxed">
                  بر اساس تقویم یا سوابق مرخصی، این روز کاری عادی نیست. ثبت تردد به صورت اضافه کاری یا استثنایی منظور خواهد شد.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
              <input
                ref={holidayConfirmRef}
                type="checkbox"
                checked={allowHolidayRecord}
                onChange={(e) => {
                  setAllowHolidayRecord(e.target.checked);
                  if (errors.holiday) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.holiday;
                      return next;
                    });
                  }
                }}
                className="rounded border-[var(--border-strong)] text-[var(--accent)] focus:ring-[var(--focus)] h-4 w-4"
              />
              <span className="text-xs font-semibold text-[var(--text-main)]">
                ثبت تردد در این روز را تأیید می‌کنم و مایل به ادامه هستم
              </span>
            </label>

            {errors.holiday && (
              <p id="holiday-error" role="alert" className="text-[11px] text-[var(--semantic-danger)] font-bold flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{errors.holiday}</span>
              </p>
            )}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-3 sm:mt-4 space-y-3.5 sm:space-y-4 overflow-y-auto pr-0.5">
          {/* Jalali Date Selection */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
              تاریخ شمسی
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Day */}
              <div>
                <select
                  ref={daySelectRef}
                  value={day}
                  onChange={(e) => {
                    setDay(parseInt(e.target.value, 10));
                    if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                  }}
                  aria-invalid={Boolean(errors.date)}
                  aria-describedby={errors.date ? 'date-error' : undefined}
                  className={`liquid-input w-full px-3 py-2 text-xs font-medium text-[var(--text-main)] ${
                    errors.date ? 'border-[var(--semantic-danger)] focus:border-[var(--semantic-danger)]' : ''
                  }`}
                >
                  {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d} className="bg-[var(--surface)] text-[var(--text-main)]">
                      روز {toPersianDigits(d)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div>
                <select
                  value={month}
                  onChange={(e) => {
                    setMonth(parseInt(e.target.value, 10));
                    if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                  }}
                  aria-invalid={Boolean(errors.date)}
                  aria-describedby={errors.date ? 'date-error' : undefined}
                  className={`liquid-input w-full px-3 py-2 text-xs font-medium text-[var(--text-main)] ${
                    errors.date ? 'border-[var(--semantic-danger)] focus:border-[var(--semantic-danger)]' : ''
                  }`}
                >
                  {PERSIAN_MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx + 1} className="bg-[var(--surface)] text-[var(--text-main)]">
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <select
                  value={year}
                  onChange={(e) => {
                    setYear(parseInt(e.target.value, 10));
                    if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                  }}
                  aria-invalid={Boolean(errors.date)}
                  aria-describedby={errors.date ? 'date-error' : undefined}
                  className={`liquid-input w-full px-3 py-2 text-xs font-medium text-[var(--text-main)] font-mono ${
                    errors.date ? 'border-[var(--semantic-danger)] focus:border-[var(--semantic-danger)]' : ''
                  }`}
                >
                  {[1402, 1403, 1404, 1405, 1406].map((yr) => (
                    <option key={yr} value={yr} className="bg-[var(--surface)] text-[var(--text-main)]">
                      {toPersianDigits(yr)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Future Date Error Message */}
            {errors.date && (
              <p
                id="date-error"
                role="alert"
                className="mt-1.5 text-xs text-[var(--semantic-danger)] font-medium flex items-center gap-1"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errors.date}</span>
              </p>
            )}
          </div>

          {/* Time Check-In & Check-Out */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="manual-checkin-input" className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
                ساعت ورود
              </label>
              <div className="relative">
                <input
                  id="manual-checkin-input"
                  ref={checkInInputRef}
                  type="time"
                  value={checkIn}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    if (errors.checkIn) setErrors((prev) => ({ ...prev, checkIn: '' }));
                  }}
                  aria-invalid={Boolean(errors.checkIn)}
                  aria-describedby={errors.checkIn ? 'checkin-error' : undefined}
                  className={`liquid-input w-full px-3 py-2 text-sm font-mono text-[var(--text-main)] text-center ${
                    errors.checkIn ? 'border-[var(--semantic-danger)] focus:border-[var(--semantic-danger)] ring-1 ring-[var(--semantic-danger)]/30' : ''
                  }`}
                />
              </div>
              {/* 4. CheckIn Error Message */}
              {errors.checkIn && (
                <p
                  id="checkin-error"
                  role="alert"
                  className="mt-1 text-xs text-[var(--semantic-danger)] font-medium flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{errors.checkIn}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="manual-checkout-input" className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
                ساعت خروج
              </label>
              <div className="relative">
                <input
                  id="manual-checkout-input"
                  ref={checkOutInputRef}
                  type="time"
                  value={checkOut}
                  onChange={(e) => {
                    setCheckOut(e.target.value);
                    if (errors.checkOut) setErrors((prev) => ({ ...prev, checkOut: '' }));
                  }}
                  aria-invalid={Boolean(errors.checkOut)}
                  aria-describedby={errors.checkOut ? 'checkout-error' : undefined}
                  className={`liquid-input w-full px-3 py-2 text-sm font-mono text-[var(--text-main)] text-center ${
                    errors.checkOut ? 'border-[var(--semantic-danger)] focus:border-[var(--semantic-danger)] ring-1 ring-[var(--semantic-danger)]/30' : ''
                  }`}
                />
              </div>
              {/* 1 & 4. CheckOut Error Message */}
              {errors.checkOut && (
                <p
                  id="checkout-error"
                  role="alert"
                  className="mt-1 text-xs text-[var(--semantic-danger)] font-medium flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{errors.checkOut}</span>
                </p>
              )}
            </div>
          </div>

          {/* Break and Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="manual-break-input" className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
                مدت ناهار / استراحت (دقیقه)
              </label>
              <input
                id="manual-break-input"
                ref={breakMinutesInputRef}
                type="number"
                min="0"
                max="240"
                value={breakMinutes}
                onChange={(e) => {
                  setBreakMinutes(Math.max(0, parseInt(e.target.value) || 0));
                  if (errors.breakMinutes) setErrors((prev) => ({ ...prev, breakMinutes: '' }));
                }}
                aria-invalid={Boolean(errors.breakMinutes)}
                aria-describedby={errors.breakMinutes ? 'break-error' : undefined}
                className={`liquid-input w-full px-3 py-2 text-xs font-mono text-[var(--text-main)] text-center ${
                  errors.breakMinutes ? 'border-[var(--semantic-danger)] focus:border-[var(--semantic-danger)] ring-1 ring-[var(--semantic-danger)]/30' : ''
                }`}
              />
              {/* 3. Break > Presence Error Message */}
              {errors.breakMinutes && (
                <p
                  id="break-error"
                  role="alert"
                  className="mt-1 text-xs text-[var(--semantic-danger)] font-medium flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{errors.breakMinutes}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
                وضعیت روز
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DayStatus)}
                className="liquid-input w-full px-3 py-2 text-xs font-medium text-[var(--text-main)]"
              >
                <option value="present" className="bg-[var(--surface)] text-[var(--text-main)]">حاضر عادی</option>
                <option value="leave" className="bg-[var(--surface)] text-[var(--text-main)]">مرخصی</option>
                <option value="absent" className="bg-[var(--surface)] text-[var(--text-main)]">غیبت</option>
                <option value="holiday" className="bg-[var(--surface)] text-[var(--text-main)]">تعطیل رسمی</option>
                <option value="weekend" className="bg-[var(--surface)] text-[var(--text-main)]">جمعه / تعطیل هفتگی</option>
              </select>
            </div>
          </div>

          {/* Note / Description */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
              یادداشت یا علت تاخیر / اضافه کاری
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثال: حضور در جلسه، ماموریت، تاخیر با هماهنگی..."
              className="liquid-input w-full p-2.5 text-xs text-[var(--text-main)] placeholder:text-muted resize-none"
            />
          </div>

          {/* 8. Live Calculation Preview Banner */}
          <div className="rounded-2xl bg-[var(--surface-2)] p-3 border border-[var(--border)] text-xs backdrop-blur-md shadow-inner space-y-1.5">
            <div className="flex items-center justify-between text-muted text-[11px]">
              <span className="font-semibold text-[var(--text-main)] flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span>پیش‌نمایش زنده محاسبه کارکرد:</span>
              </span>
              {livePreview.isValid && livePreview.balanceMinutes !== null && (
                <div className="font-mono font-bold">
                  {livePreview.balanceMinutes > 0 ? (
                    <span className="text-[var(--semantic-success)] inline-flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" />
                      <bdi dir="ltr">+{toPersianDigits(formatMinutesToTimeString(livePreview.balanceMinutes))}</bdi>
                    </span>
                  ) : livePreview.balanceMinutes < 0 ? (
                    <span className="text-[var(--semantic-danger)] inline-flex items-center gap-0.5">
                      <TrendingDown className="h-3 w-3" />
                      <bdi dir="ltr">-{toPersianDigits(formatMinutesToTimeString(Math.abs(livePreview.balanceMinutes)))}</bdi>
                    </span>
                  ) : (
                    <span className="text-muted inline-flex items-center gap-0.5">
                      <Minus className="h-3 w-3" />
                      <bdi dir="ltr">۰</bdi>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1 border-t border-[var(--border)] font-mono">
              <div>
                <span className="text-muted block mb-0.5 font-sans">کل حضور</span>
                <strong className="text-[var(--text-main)] text-xs">{livePreview.rawPresenceText}</strong>
              </div>
              <div>
                <span className="text-muted block mb-0.5 font-sans">کسر ناهار</span>
                <strong className="text-[var(--semantic-warning)] text-xs">{livePreview.breakText}</strong>
              </div>
              <div>
                <span className="text-muted block mb-0.5 font-sans">کارکرد مفید خالص</span>
                <strong className="text-[var(--semantic-success)] text-xs font-black">{livePreview.netWorkedText}</strong>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={handleAttemptClose}
              className="liquid-pill-btn px-4 py-2.5 text-xs font-semibold"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="liquid-pill-btn-primary flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold"
            >
              <Check className="h-4 w-4" />
              <span>{isEditingExisting ? 'ذخیره تغییرات' : 'ثبت تردد'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
