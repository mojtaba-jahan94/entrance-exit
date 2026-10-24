import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  Download,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { AttendanceRecord, LeaveRecord, ShiftConfig } from '../types';
import {
  PERSIAN_MONTH_NAMES,
  toPersianDigits,
  getCurrentJalaliDate,
} from '../utils/jalali';
import { calculateMonthlyStats } from '../utils/calculator';
import { exportMonthToExcelAdvanced } from '../utils/exportEngine';
import { OfficialReportDocument } from './OfficialReportDocument';
import { LiquidGlassCard } from './LiquidGlassCard';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AttendanceRecord[];
  leaves: LeaveRecord[];
  config: ShiftConfig;
  initialYear: number;
  initialMonth: number;
  initialPersonnelName?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  records,
  leaves,
  config,
  initialYear,
  initialMonth,
  initialPersonnelName = 'کاربر سیستم',
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
  const [personnelName, setPersonnelName] = useState<string>(initialPersonnelName);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [showFinancials, setShowFinancials] = useState<boolean>(true);
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // Sync state if modal opens with different month/year
  React.useEffect(() => {
    if (isOpen) {
      setSelectedYear(initialYear);
      setSelectedMonth(initialMonth);
      if (initialPersonnelName) {
        setPersonnelName(initialPersonnelName);
      }
    }
  }, [isOpen, initialYear, initialMonth, initialPersonnelName]);

  const selectedMonthName = PERSIAN_MONTH_NAMES[selectedMonth - 1] || '';

  const monthlyStats = useMemo(() => {
    return calculateMonthlyStats(records, selectedYear, selectedMonth, config, leaves);
  }, [records, selectedYear, selectedMonth, config, leaves]);

  const availableYears = useMemo(() => {
    const curYear = getCurrentJalaliDate().jy;
    const minYear = Math.min(1400, selectedYear - 2, curYear - 2);
    const maxYear = Math.max(1410, selectedYear + 2, curYear + 2);
    const years: number[] = [];
    for (let y = minYear; y <= maxYear; y++) {
      years.push(y);
    }
    return years;
  }, [selectedYear]);

  const handlePrint = () => {
    if (orientation === 'landscape') {
      document.body.classList.add('print-landscape');
      document.body.classList.remove('print-portrait');
    } else {
      document.body.classList.add('print-portrait');
      document.body.classList.remove('print-landscape');
    }
    window.print();
  };

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      const res = await exportMonthToExcelAdvanced(
        records,
        leaves,
        config,
        selectedYear,
        selectedMonth,
        selectedMonthName,
        personnelName
      );
      setDownloadSuccessMessage(`فایل ${res.fileName} با موفقیت دانلود شد.`);
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error generating Excel file', err);
      alert('خطا در صدور فایل اکسل. لطفا دوباره تلاش کنید.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="پیش‌نمایش و صدور کارنامه و گزارش"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 print:static print:bg-white print:p-0 print:overflow-visible print:z-auto"
    >
      <div className="relative w-full max-w-5xl my-auto rounded-[28px] sm:rounded-[36px] bg-[var(--surface)] border border-[var(--border)] shadow-2xl flex flex-col max-h-[94vh] overflow-hidden print:max-w-none print:shadow-none print:border-none print:rounded-none print:bg-white print:overflow-visible print:max-h-none">
        {/* Header Controls (Screen Only) */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--surface-2)] shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[var(--accent)]/15 p-2 text-[var(--accent)] border border-[var(--accent)]/30">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[var(--text-main)]">
                صدور و چاپ کارنامه تردد ({selectedMonthName} {toPersianDigits(selectedYear)})
              </h2>
              <p className="text-[11px] sm:text-xs text-muted">
                پیش‌نمایش سند استاندارد جهت دانلود اکسل یا ذخیره/چاپ مستقیم PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-muted hover:text-text hover:bg-[var(--surface)] transition-all"
              aria-label="بستن پنجره"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Options Toolbar (Screen Only) */}
        <div className="p-3 sm:p-4 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          {/* Controls: Month, Year, Personnel Name */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month select */}
            <div className="flex items-center rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-2 py-1">
              <Calendar className="h-3.5 w-3.5 text-muted ml-1.5" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="bg-transparent text-xs font-bold text-text focus:outline-none cursor-pointer"
                aria-label="انتخاب ماه"
              >
                {PERSIAN_MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1} className="bg-bg text-text">
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year select */}
            <div className="flex items-center rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-2 py-1">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="bg-transparent text-xs font-bold text-accent focus:outline-none cursor-pointer font-mono"
                aria-label="انتخاب سال"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr} className="bg-bg text-text">
                    {toPersianDigits(yr)}
                  </option>
                ))}
              </select>
            </div>

            {/* Personnel Name input */}
            <div className="flex items-center rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-2 py-1">
              <UserIcon className="h-3.5 w-3.5 text-muted ml-1.5" />
              <input
                type="text"
                value={personnelName}
                onChange={(e) => setPersonnelName(e.target.value)}
                placeholder="نام پرسنل..."
                className="bg-transparent text-xs text-text placeholder:text-muted focus:outline-none w-28 sm:w-36"
                aria-label="نام پرسنل"
              />
            </div>
          </div>

          {/* Orientation and Toggle Switches */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
            {/* Orientation */}
            <div className="flex items-center rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-0.5">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  orientation === 'landscape'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                    : 'text-muted hover:text-text'
                }`}
                title="چاپ افقی A4 - نمایش کامل همه ۱۶ ستون با بیشترین وضوح و خوانایی"
              >
                افقی (استاندارد)
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  orientation === 'portrait'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                    : 'text-muted hover:text-text'
                }`}
                title="چاپ عمودی A4 فشرده"
              >
                عمودی
              </button>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showFinancials}
                onChange={(e) => setShowFinancials(e.target.checked)}
                className="rounded accent-[var(--accent)]"
              />
              <span>برآورد مالی</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showSignatures}
                onChange={(e) => setShowSignatures(e.target.checked)}
                className="rounded accent-[var(--accent)]"
              />
              <span>بخش امضاها</span>
            </label>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2 mr-auto">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="badge-success px-3.5 py-1.5 rounded-full text-xs font-semibold shadow flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              title="دانلود فایل اکسل دو برگه شامل تمام روزها و خلاصه آماری"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>{isExportingExcel ? 'در حال تهیه...' : 'دانلود اکسل (.xlsx)'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="liquid-pill-btn-primary px-4 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 transition-all active:scale-95"
              title="چاپ یا ذخیره فایل PDF استاندارد"
            >
              <Printer className="h-4 w-4" />
              <span>چاپ / ذخیره PDF</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert for download */}
        {downloadSuccessMessage && (
          <div className="bg-[var(--semantic-success)]/15 border-b border-[var(--semantic-success)]/30 text-[var(--semantic-success)] text-xs font-medium px-4 py-2 flex items-center gap-2 print:hidden animate-in fade-in duration-200">
            <CheckCircle2 className="h-4 w-4" />
            <span>{downloadSuccessMessage}</span>
          </div>
        )}

        {/* Live A4 Document Preview Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-900/40 print:p-0 print:bg-white print:overflow-visible">
          <div className="bg-white rounded-lg shadow-2xl mx-auto overflow-hidden border border-neutral-300 print:shadow-none print:border-none print:rounded-none print:overflow-visible">
            <OfficialReportDocument
              records={records}
              leaves={leaves}
              config={config}
              stats={monthlyStats}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              selectedMonthName={selectedMonthName}
              personnelName={personnelName}
              showFinancials={showFinancials}
              showSignatures={showSignatures}
              orientation={orientation}
              className="preview-mode"
              id="official-print-report"
            />
          </div>
        </div>

        {/* Bottom Bar Info */}
        <div className="p-3 bg-[var(--surface-2)] border-t border-[var(--border)] text-[11px] text-muted flex items-center justify-between shrink-0 print:hidden">
          <span>
            💡 راهنما: برای ذخیره به عنوان <strong>PDF</strong>، دکمه «چاپ / ذخیره PDF» را زده و در پنجره مرورگر گزینه <strong>Save as PDF</strong> را انتخاب نمایید.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted hover:text-text px-3 py-1 rounded"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
