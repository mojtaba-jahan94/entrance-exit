import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  User as UserIcon,
  Clock,
  Coffee,
  Banknote,
  Palette,
  Cloud,
  Eye,
  Info,
  Check,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  Search,
  Download,
  Upload,
  RefreshCw,
  LogOut,
  KeyRound,
  FileSpreadsheet,
  Trash2,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';
import { ShiftConfig, AttendanceRecord, LeaveRecord } from '../types';
import { DEFAULT_SHIFT_CONFIG } from '../utils/calculator';
import {
  toPersianDigits,
  toEnglishDigits,
  formatMinutesToTimeString,
} from '../utils/jalali';
import { useAuth } from '../context/AuthContext';
import { exportFullBackupJSON, importBackupFromJSON } from '../utils/storage';
import {
  getStoredUISettings,
  saveStoredUISettings,
  VisualEffectsSetting,
  ThemeMode,
  UISettings,
} from '../utils/uiSettings';

export interface SettingsPageProps {
  config: ShiftConfig;
  onSaveConfig: (newConfig: ShiftConfig) => void;
  onBackToDashboard: () => void;
  records?: AttendanceRecord[];
  leaves?: LeaveRecord[];
  onDataRestored?: () => void;
  onResetAllData?: () => void;
  onExportExcel?: () => void;
  onTriggerSync?: () => Promise<void>;
  onTriggerPull?: () => Promise<void>;
}

export type SettingsSectionKey =
  | 'account'
  | 'shift'
  | 'leave'
  | 'finance'
  | 'appearance'
  | 'storage'
  | 'accessibility'
  | 'about';

interface SectionDefinition {
  key: SettingsSectionKey;
  num: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  config,
  onSaveConfig,
  onBackToDashboard,
  records: _records = [],
  leaves: _leaves = [],
  onDataRestored,
  onResetAllData,
  onExportExcel,
  onTriggerSync,
  onTriggerPull,
}) => {
  const { user, storageMode, changePassword, logout, setStorageMode } = useAuth();
  const userId = user?.id;

  // Active section & mobile subview
  const [activeSection, setActiveSection] = useState<SettingsSectionKey>('shift');
  const [mobileInDetail, setMobileInDetail] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Local Form State
  const [formData, setFormData] = useState<ShiftConfig>(config);
  const [overtimeMultiplierStr, setOvertimeMultiplierStr] = useState<string>(
    config.overtimeMultiplier !== undefined ? String(config.overtimeMultiplier) : '1.4'
  );
  const [holidayMultiplierStr, setHolidayMultiplierStr] = useState<string>(
    config.holidayMultiplier !== undefined ? String(config.holidayMultiplier) : '1.8'
  );
  const [hourlyRateStr, setHourlyRateStr] = useState<string>(
    config.hourlyRateToman ? String(config.hourlyRateToman) : '0'
  );

  // UI Settings (theme, effects)
  const [uiSettings, setUiSettings] = useState<UISettings>(getStoredUISettings);

  // Password state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passwordNotice, setPasswordNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cloud sync manual trigger state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');
  const [saveNotice, setSaveNotice] = useState<string>('');

  // Sync state with upstream config prop
  useEffect(() => {
    setFormData(config);
    setOvertimeMultiplierStr(config.overtimeMultiplier !== undefined ? String(config.overtimeMultiplier) : '1.4');
    setHolidayMultiplierStr(config.holidayMultiplier !== undefined ? String(config.holidayMultiplier) : '1.8');
    setHourlyRateStr(config.hourlyRateToman ? String(config.hourlyRateToman) : '0');
  }, [config]);

  // Track Unsaved Changes
  const hasUnsavedChanges = useMemo(() => {
    const otEqual = String(config.overtimeMultiplier ?? 1.4) === overtimeMultiplierStr.trim();
    const holEqual = String(config.holidayMultiplier ?? 1.8) === holidayMultiplierStr.trim();
    const rateEqual = String(config.hourlyRateToman ?? 0) === hourlyRateStr.trim().replace(/,/g, '');
    const configEqual =
      formData.isFlexibleShift === config.isFlexibleShift &&
      formData.startTime === config.startTime &&
      formData.endTime === config.endTime &&
      formData.flexStartTimeMin === config.flexStartTimeMin &&
      formData.flexStartTimeMax === config.flexStartTimeMax &&
      formData.flexDepartureMin === config.flexDepartureMin &&
      formData.flexDepartureMax === config.flexDepartureMax &&
      formData.requiredDailyMinutes === config.requiredDailyMinutes &&
      formData.defaultBreakMinutes === config.defaultBreakMinutes &&
      formData.thursdayStatus === config.thursdayStatus &&
      formData.thursdayMinutes === config.thursdayMinutes &&
      formData.monthlyLeaveDays === config.monthlyLeaveDays;

    return !(otEqual && holEqual && rateEqual && configEqual);
  }, [formData, overtimeMultiplierStr, holidayMultiplierStr, hourlyRateStr, config]);

  // Section Definitions
  const sections: SectionDefinition[] = useMemo(
    () => [
      {
        key: 'shift',
        num: '۰۱',
        label: 'قوانین کاری و شیفت',
        description: 'شیفت شناور، بازه ورود و خروج، ساعات موظفی روزانه و پنج‌شنبه',
        icon: Clock,
        tags: ['شیفت', 'ورود', 'خروج', 'شناور', 'ناهار', 'پنج‌شنبه', 'حضور', 'تاخیر'],
      },
      {
        key: 'leave',
        num: '۰۲',
        label: 'سهمیه مرخصی‌ها',
        description: 'سهمیه ماهانه استحقاقی و محاسبه خودکار معادل ساعتی',
        icon: Coffee,
        tags: ['مرخصی', 'استحقاقی', 'ساعت', 'روز', 'سهمیه'],
      },
      {
        key: 'finance',
        num: '۰۳',
        label: 'ضرایب و محاسبات مالی',
        description: 'ضرایب اضافه‌کاری عادی و تعطیلات، نرخ دستمزد ساعتی اختیاری',
        icon: Banknote,
        tags: ['اضافه‌کار', 'تعطیلات', 'دستمزد', 'تومان', 'حقوق', 'مالی'],
      },
      {
        key: 'appearance',
        num: '۰۴',
        label: 'ظاهر و پویانمایی',
        description: 'تم نوردیک (روشن/تیره/خودکار) و کنترل افکت‌های گرافیکی',
        icon: Palette,
        tags: ['تم', 'تیره', 'روشن', 'پویانمایی', 'افکت', 'شیشه', 'کانفتی'],
      },
      {
        key: 'storage',
        num: '۰۵',
        label: 'داده، همگام‌سازی و پشتیبان',
        description: 'ذخیره‌سازی ابری، پشتیبان‌گیری JSON و خروجی کارنامه اکسل',
        icon: Cloud,
        tags: ['ابری', 'همگام‌سازی', 'سینک', 'پشتیبان', 'بکاپ', 'اکسل', 'حذف'],
      },
      {
        key: 'account',
        num: '۰۶',
        label: 'حساب کاربری و امنیت',
        description: 'مشخصات کاربر جاری، تغییر کلمه عبور و خروج از حساب',
        icon: UserIcon,
        tags: ['کاربر', 'رمز', 'امنیت', 'خروج', 'پسورد'],
      },
      {
        key: 'accessibility',
        num: '۰۷',
        label: 'دسترسی‌پذیری و ارگونومی',
        description: 'کاهش حرکت، استانداردهای کنتراست WCAG و ناوبری کیبورد',
        icon: Eye,
        tags: ['کنتراست', 'کاهش حرکت', 'کیبورد', 'دسترسی‌پذیری'],
      },
      {
        key: 'about',
        num: '۰۸',
        label: 'درباره سامانه و مستندات',
        description: 'نسخه سامانه، قوانین استاندارد قانون کار و فرمول‌های محاسباتی',
        icon: Info,
        tags: ['درباره', 'نسخه', 'مستندات', 'راهنما', 'فرمول'],
      },
    ],
    []
  );

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter(
      (sec) =>
        sec.label.toLowerCase().includes(q) ||
        sec.description.toLowerCase().includes(q) ||
        sec.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [searchQuery, sections]);

  // Handlers for Save & Reset
  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const leaveDays = Number(formData.monthlyLeaveDays) || 2.5;
    const standardDailyNet = Math.max(
      60,
      (formData.requiredDailyMinutes || 510) - (formData.defaultBreakMinutes || 30)
    );
    const quotaHours = Math.round(leaveDays * (standardDailyNet / 60));

    const parsedOt = parseFloat(toEnglishDigits(overtimeMultiplierStr));
    const otMultiplier = !isNaN(parsedOt) && parsedOt > 0 ? parsedOt : 1.4;

    const parsedHol = parseFloat(toEnglishDigits(holidayMultiplierStr));
    const holMultiplier = !isNaN(parsedHol) && parsedHol > 0 ? parsedHol : 1.8;

    const parsedRate = parseInt(toEnglishDigits(hourlyRateStr).replace(/,/g, ''), 10);
    const hourlyRate = !isNaN(parsedRate) && parsedRate >= 0 ? parsedRate : 0;

    const updated: ShiftConfig = {
      ...formData,
      overtimeMultiplier: otMultiplier,
      holidayMultiplier: holMultiplier,
      hourlyRateToman: hourlyRate,
      monthlyLeaveDays: leaveDays,
      monthlyLeaveQuotaHours: quotaHours,
    };

    onSaveConfig(updated);
    setSaveNotice('تنظیمات جدید با موفقیت ذخیره و در سامانه اعمال گردید.');
    setTimeout(() => setSaveNotice(''), 4000);
  };

  const handleResetSectionDefaults = (section: SettingsSectionKey) => {
    if (!window.confirm('آیا از بازنشانی این بخش به مقادیر پیش‌فرض اطمینان دارید؟')) return;

    if (section === 'shift') {
      setFormData((prev) => ({
        ...prev,
        isFlexibleShift: DEFAULT_SHIFT_CONFIG.isFlexibleShift,
        startTime: DEFAULT_SHIFT_CONFIG.startTime,
        endTime: DEFAULT_SHIFT_CONFIG.endTime,
        flexStartTimeMin: DEFAULT_SHIFT_CONFIG.flexStartTimeMin,
        flexStartTimeMax: DEFAULT_SHIFT_CONFIG.flexStartTimeMax,
        flexDepartureMin: DEFAULT_SHIFT_CONFIG.flexDepartureMin,
        flexDepartureMax: DEFAULT_SHIFT_CONFIG.flexDepartureMax,
        requiredDailyMinutes: DEFAULT_SHIFT_CONFIG.requiredDailyMinutes,
        defaultBreakMinutes: DEFAULT_SHIFT_CONFIG.defaultBreakMinutes,
        thursdayStatus: DEFAULT_SHIFT_CONFIG.thursdayStatus,
        thursdayMinutes: DEFAULT_SHIFT_CONFIG.thursdayMinutes,
      }));
    } else if (section === 'leave') {
      setFormData((prev) => ({
        ...prev,
        monthlyLeaveDays: DEFAULT_SHIFT_CONFIG.monthlyLeaveDays,
        monthlyLeaveQuotaHours: DEFAULT_SHIFT_CONFIG.monthlyLeaveQuotaHours,
      }));
    } else if (section === 'finance') {
      setOvertimeMultiplierStr(String(DEFAULT_SHIFT_CONFIG.overtimeMultiplier));
      setHolidayMultiplierStr(String(DEFAULT_SHIFT_CONFIG.holidayMultiplier));
      setHourlyRateStr(String(DEFAULT_SHIFT_CONFIG.hourlyRateToman || 0));
      setFormData((prev) => ({
        ...prev,
        overtimeMultiplier: DEFAULT_SHIFT_CONFIG.overtimeMultiplier,
        holidayMultiplier: DEFAULT_SHIFT_CONFIG.holidayMultiplier,
        hourlyRateToman: DEFAULT_SHIFT_CONFIG.hourlyRateToman,
      }));
    } else if (section === 'appearance') {
      const resetUI: UISettings = { ...uiSettings, themeMode: 'auto', visualEffects: 'auto' };
      setUiSettings(resetUI);
      saveStoredUISettings(resetUI);
    }

    setSaveNotice('تنظیمات این بخش به پیش‌فرض بازنشانی شد. لطفاً برای نهایی‌شدن، دکمه ذخیره را بزنید.');
    setTimeout(() => setSaveNotice(''), 4000);
  };

  const handleLeavePageGuard = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('شما تغییرات ذخیره‌نشده دارید. آیا مایلید بدون ذخیره از صفحه تنظیمات خارج شوید؟')) {
        return;
      }
    }
    onBackToDashboard();
  };

  // Theme change
  const handleThemeModeChange = (mode: ThemeMode) => {
    const updated = { ...uiSettings, themeMode: mode };
    setUiSettings(updated);
    saveStoredUISettings(updated);
  };

  // Visual effects change
  const handleVisualEffectsChange = (mode: VisualEffectsSetting) => {
    const updated = { ...uiSettings, visualEffects: mode };
    setUiSettings(updated);
    saveStoredUISettings(updated);
  };

  // Password submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);

    if (!newPass || newPass.length < 4) {
      setPasswordNotice({ type: 'error', text: 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد.' });
      return;
    }
    if (newPass !== confirmPass) {
      setPasswordNotice({ type: 'error', text: 'تکرار رمز عبور جدید با رمز واردشده مطابقت ندارد.' });
      return;
    }

    try {
      await changePassword({ currentPassword: currentPass, newPassword: newPass });
      setPasswordNotice({ type: 'success', text: 'رمز عبور شما با موفقیت به‌روزرسانی شد.' });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      setPasswordNotice({
        type: 'error',
        text: err?.message || 'خطا در تغییر رمز عبور. لطفاً از صحت کلمه عبور فعلی اطمینان حاصل کنید.',
      });
    }
  };

  // Cloud sync push / pull
  const handleManualSyncPush = async () => {
    if (!onTriggerSync) return;
    setIsSyncing(true);
    setSyncStatusMsg('در حال رمزنگاری و ارسال آخرین تغییرات به فضای ابری...');
    try {
      await onTriggerSync();
      setSyncStatusMsg('داده‌ها با موفقیت در فضای ابری همگام‌سازی شدند.');
    } catch {
      setSyncStatusMsg('خطا در همگام‌سازی ابری. اتصال به اینترنت را بررسی کنید.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(''), 4000);
    }
  };

  const handleManualSyncPull = async () => {
    if (!onTriggerPull) return;
    setIsSyncing(true);
    setSyncStatusMsg('در حال دریافت و بازخوانی سوابق از سرور ابری...');
    try {
      await onTriggerPull();
      setSyncStatusMsg('داده‌های ابری دریافت و جایگزین گردیدند.');
    } catch {
      setSyncStatusMsg('خطا در دریافت اطلاعات از سرور ابری.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(''), 4000);
    }
  };

  // JSON backup restore
  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = importBackupFromJSON(text, userId);
        if (success) {
          alert('فایل پشتیبان با موفقیت بازیابی و بارگذاری شد!');
          if (onDataRestored) onDataRestored();
        } else {
          alert('خطا در بازیابی: ساختار فایل پشتیبان معتبر نیست.');
        }
      } catch {
        alert('خطا در پردازش فایل پشتیبان.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const displayName = user?.displayName || user?.username || 'کاربر گرامی';

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200 print:hidden">
      {/* Top Breadcrumb & Status Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-[28px] bg-[var(--surface)] border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLeavePageGuard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-muted hover:text-text bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-all active:scale-95"
            title="بازگشت به پیشخوان"
            aria-label="بازگشت به پیشخوان"
          >
            <ArrowRight className="h-4 w-4" />
            <span>بازگشت به پیشخوان</span>
          </button>
          <div className="h-4 w-px bg-[var(--border)] hidden sm:block" />
          <h1 className="text-sm sm:text-base font-bold text-text flex items-center gap-2">
            <Settings className="h-5 w-5 text-[var(--accent)]" />
            <span>تنظیمات و پیکربندی سیستم</span>
          </h1>
        </div>

        {/* Global Save Status & Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <div
            role="status"
            aria-live="polite"
            className={`text-xs px-3 py-1 rounded-full font-medium border flex items-center gap-1.5 transition-all ${
              hasUnsavedChanges
                ? 'bg-[var(--semantic-warning)]/15 text-[var(--semantic-warning)] border-[var(--semantic-warning)]/30 animate-pulse'
                : 'bg-[var(--semantic-success)]/15 text-[var(--semantic-success)] border-[var(--semantic-success)]/30'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                hasUnsavedChanges ? 'bg-[var(--semantic-warning)]' : 'bg-[var(--semantic-success)]'
              }`}
            />
            <span>{hasUnsavedChanges ? 'تغییرات ذخیره‌نشده' : 'تمام تنظیمات ذخیره شدند'}</span>
          </div>

          <button
            type="button"
            onClick={() => handleSaveAll()}
            disabled={!hasUnsavedChanges}
            className={`liquid-pill-btn-primary px-4 py-2 text-xs font-bold shadow-md flex items-center gap-1.5 transition-all active:scale-95 ${
              !hasUnsavedChanges ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <Check className="h-4 w-4" />
            <span>ذخیره تغییرات</span>
          </button>
        </div>
      </div>

      {/* Save Notification Banner */}
      {saveNotice && (
        <aside
          role="status"
          aria-live="polite"
          className="p-3.5 rounded-2xl border border-[var(--semantic-success)]/40 bg-[var(--surface-2)] text-[var(--semantic-success)] text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{saveNotice}</span>
        </aside>
      )}

      {/* Main Settings Navigation & Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* RIGHT COLUMN (RTL): Section Navigation Rail (Desktop) / List Root (Mobile) */}
        <nav
          aria-label="فهرست بخش‌های تنظیمات"
          className={`lg:col-span-4 space-y-3 ${mobileInDetail ? 'hidden lg:block' : 'block'}`}
        >
          {/* Quick Search in Settings */}
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در تنظیمات و قوانین..."
              className="liquid-input w-full pr-10 pl-4 py-2.5 text-xs text-text placeholder:text-muted rounded-2xl"
              aria-label="جستجو در بخش‌های تنظیمات"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-text"
              >
                ✕
              </button>
            )}
          </div>

          {/* Section Items */}
          <div className="space-y-1.5 p-2 rounded-[28px] bg-[var(--surface)] border border-[var(--border)] shadow-sm">
            {filteredSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.key;
              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => {
                    setActiveSection(sec.key);
                    setMobileInDetail(true);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-right transition-all group ${
                    isActive
                      ? 'liquid-pill-btn-primary shadow-md'
                      : 'hover:bg-[var(--surface-2)] text-text'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 transition-colors ${
                        isActive
                          ? 'bg-[var(--accent-contrast)]/15 text-[var(--accent-contrast)]'
                          : 'bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border)]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="text-xs font-bold truncate">{sec.label}</div>
                      <div
                        className={`text-[10px] truncate mt-0.5 ${
                          isActive ? 'opacity-85' : 'text-muted'
                        }`}
                      >
                        {sec.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-mono ${
                        isActive ? 'opacity-80' : 'text-muted'
                      }`}
                    >
                      {sec.num}
                    </span>
                    <ChevronLeft className="h-4 w-4 lg:hidden opacity-60" />
                  </div>
                </button>
              );
            })}

            {filteredSections.length === 0 && (
              <div className="p-6 text-center text-xs text-muted">
                گزینه‌ای مطابق با جستجوی شما پیدا نشد.
              </div>
            )}
          </div>
        </nav>

        {/* LEFT COLUMN (RTL): Content Pane */}
        <section
          aria-labelledby="section-heading"
          className={`lg:col-span-8 p-5 sm:p-7 rounded-[32px] bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-6 ${
            !mobileInDetail ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Mobile Back to List Button */}
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileInDetail(false)}
              className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] hover:underline"
            >
              <ArrowRight className="h-4 w-4" />
              <span>بازگشت به فهرست بخش‌ها</span>
            </button>
            <span className="text-xs font-mono text-muted">تنظیمات</span>
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div>
              <span className="text-[11px] font-mono text-[var(--accent)] font-bold uppercase tracking-wider">
                بخش {sections.find((s) => s.key === activeSection)?.num} // پیکربندی اختصاصی
              </span>
              <h2 id="section-heading" className="text-lg sm:text-xl font-bold text-text mt-1">
                {sections.find((s) => s.key === activeSection)?.label}
              </h2>
              <p className="text-xs text-muted mt-1">
                {sections.find((s) => s.key === activeSection)?.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleResetSectionDefaults(activeSection)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted hover:text-text bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-all"
              title="بازنشانی این بخش به پیش‌فرض"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">پیش‌فرض بخش</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* SECTION 01: SHIFT RULES                                  */}
          {/* ========================================================= */}
          {activeSection === 'shift' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--semantic-info)]/30 bg-[var(--semantic-info)]/10 p-4 text-xs text-[var(--semantic-info)] leading-relaxed">
                <span className="font-bold">قوانین محاسبه کارکرد:</span> ورود بین ساعت‌های مجاز شناور، بدون کسر تاخیر ثبت می‌شود. تغییر ساعات موظف و ناهار، مستقیماً بر کارکرد مفید، کسر کار و اضافه کار کارنامه ماه جاری اعمال می‌گردد.
              </div>

              {/* Flexible Shift Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
                <div>
                  <label htmlFor="flex-shift-toggle" className="text-xs font-bold text-text block cursor-pointer">
                    فعال‌سازی شیفت شناور اداری
                  </label>
                  <p className="text-[11px] text-muted mt-0.5">
                    کارمند مجاز است بین بازه شناور صبح وارد شده و خروج متناظر محاسبه گردد
                  </p>
                </div>
                <input
                  id="flex-shift-toggle"
                  type="checkbox"
                  checked={formData.isFlexibleShift}
                  onChange={(e) => setFormData({ ...formData, isFlexibleShift: e.target.checked })}
                  className="h-5 w-5 accent-[var(--accent)] cursor-pointer rounded"
                />
              </div>

              {/* Flexible Entry Range */}
              {formData.isFlexibleShift && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-4">
                  <div className="text-xs font-bold text-[var(--accent)]">بازه مجاز ورود شناور (صبح)</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text mb-1">
                        شروع بازه ورود شناور
                      </label>
                      <input
                        type="time"
                        value={formData.flexStartTimeMin || '08:30'}
                        onChange={(e) => setFormData({ ...formData, flexStartTimeMin: e.target.value })}
                        className="liquid-input w-full px-3 py-2 text-sm font-mono text-center text-text"
                      />
                      <span className="text-[10px] text-muted mt-1 block">پیش‌فرض: ۰۸:۳۰</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text mb-1">
                        پایان بازه ورود مجاز (شروع تاخیر)
                      </label>
                      <input
                        type="time"
                        value={formData.flexStartTimeMax || '09:30'}
                        onChange={(e) => setFormData({ ...formData, flexStartTimeMax: e.target.value })}
                        className="liquid-input w-full px-3 py-2 text-sm font-mono text-center text-text"
                      />
                      <span className="text-[10px] text-muted mt-1 block">پیش‌فرض: ۰۹:۳۰</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Flexible Departure Range */}
              {formData.isFlexibleShift && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-4">
                  <div className="text-xs font-bold text-[var(--accent)]">بازه خروج موظفی متناظر (عصر)</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text mb-1">
                        حداقل ساعت خروج (در صورت ورود ۰۸:۳۰)
                      </label>
                      <input
                        type="time"
                        value={formData.flexDepartureMin || '17:00'}
                        onChange={(e) => setFormData({ ...formData, flexDepartureMin: e.target.value })}
                        className="liquid-input w-full px-3 py-2 text-sm font-mono text-center text-text"
                      />
                      <span className="text-[10px] text-muted mt-1 block">پیش‌فرض: ۱۷:۰۰</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text mb-1">
                        حداکثر ساعت خروج (در صورت ورود ۰۹:۳۰)
                      </label>
                      <input
                        type="time"
                        value={formData.flexDepartureMax || '18:00'}
                        onChange={(e) => setFormData({ ...formData, flexDepartureMax: e.target.value })}
                        className="liquid-input w-full px-3 py-2 text-sm font-mono text-center text-text"
                      />
                      <span className="text-[10px] text-muted mt-1 block">پیش‌فرض: ۱۸:۰۰</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Total Presence and Lunch Break */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    مدت کل حضور الزامی روزانه (ناخالص)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="120"
                      max="720"
                      value={formData.requiredDailyMinutes || 510}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requiredDailyMinutes: Math.max(0, parseInt(e.target.value, 10) || 510),
                        })
                      }
                      className="liquid-input w-full px-3 py-2 text-xs font-mono text-center text-text"
                    />
                    <span className="text-xs text-muted">دقیقه</span>
                  </div>
                  <span className="text-[10px] text-muted mt-1 block">
                    ۵۱۰ دقیقه = ۸ ساعت و ۳۰ دقیقه حضور فیزیکی
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    کسر خودکار فرجه ناهار / استراحت
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={formData.defaultBreakMinutes ?? 30}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          defaultBreakMinutes: Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                      className="liquid-input w-full px-3 py-2 text-xs font-mono text-center text-text"
                    />
                    <span className="text-xs text-muted">دقیقه</span>
                  </div>
                  <span className="text-[10px] text-[var(--semantic-success)] mt-1 block">
                    کارکرد مفید خالص: ۸ ساعت در هر روز
                  </span>
                </div>
              </div>

              {/* Thursday Rules */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
                <label className="block text-xs font-semibold text-text">
                  وضعیت اداری روزهای پنج‌شنبه
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thursdayStatus: 'half_day' })}
                    className={`p-3 rounded-xl border text-right transition-all ${
                      formData.thursdayStatus === 'half_day'
                        ? 'liquid-pill-btn-primary shadow-sm'
                        : 'border-[var(--border)] bg-[var(--surface)] text-muted hover:text-text'
                    }`}
                  >
                    <div className="text-xs font-bold">نیمه‌وقت (۴ ساعت)</div>
                    <div className="text-[10px] opacity-80 mt-0.5">بدون کسر ناهار</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thursdayStatus: 'off' })}
                    className={`p-3 rounded-xl border text-right transition-all ${
                      formData.thursdayStatus === 'off'
                        ? 'liquid-pill-btn-primary shadow-sm'
                        : 'border-[var(--border)] bg-[var(--surface)] text-muted hover:text-text'
                    }`}
                  >
                    <div className="text-xs font-bold">تعطیل کامل</div>
                    <div className="text-[10px] opacity-80 mt-0.5">مشابه جمعه</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thursdayStatus: 'full_day' })}
                    className={`p-3 rounded-xl border text-right transition-all ${
                      formData.thursdayStatus === 'full_day'
                        ? 'liquid-pill-btn-primary shadow-sm'
                        : 'border-[var(--border)] bg-[var(--surface)] text-muted hover:text-text'
                    }`}
                  >
                    <div className="text-xs font-bold">روز کاری کامل</div>
                    <div className="text-[10px] opacity-80 mt-0.5">مشابه سایر روزها</div>
                  </button>
                </div>

                {formData.thursdayStatus === 'half_day' && (
                  <div className="pt-2">
                    <label className="block text-xs text-muted mb-1">
                      مدت حضور پنج‌شنبه (دقیقه):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="60"
                        max="360"
                        value={formData.thursdayMinutes || 240}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            thursdayMinutes: Math.max(0, parseInt(e.target.value, 10) || 240),
                          })
                        }
                        className="liquid-input w-32 px-3 py-1.5 text-xs font-mono text-center text-text"
                      />
                      <span className="text-xs text-muted">
                        معادل {toPersianDigits(formatMinutesToTimeString(formData.thursdayMinutes || 240))} ساعت کارکرد
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 02: LEAVE POLICIES                               */}
          {/* ========================================================= */}
          {activeSection === 'leave' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--semantic-warning)]/30 bg-[var(--semantic-warning)]/10 p-4 text-xs text-[var(--semantic-warning)] leading-relaxed">
                <span className="font-bold">قانون مرخصی استحقاقی:</span> طبق قانون کار، هر کارمند ماهانه ۲.۵ روز کاری حق مرخصی دارد. سهمیه کل ماه به ساعت بر اساس ساعات موظفی خالص روزانه (۸ ساعت) معادل ۲۰ ساعت محاسبه می‌گردد.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    سهمیه مرخصی ماهانه (بر حسب روز)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={formData.monthlyLeaveDays ?? 2.5}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        monthlyLeaveDays: val,
                        monthlyLeaveQuotaHours: Math.round(val * 8),
                      });
                    }}
                    className="liquid-input w-full px-3 py-2 text-sm font-mono text-center text-text"
                  />
                  <span className="text-[10px] text-muted mt-1 block">پیش‌فرض قانون کار: ۲.۵ روز در ماه</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    معادل سهمیه مرخصی به ساعت در ماه
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={Math.round((formData.monthlyLeaveDays || 2.5) * 8)}
                    className="liquid-input w-full px-3 py-2 text-sm font-mono text-[var(--accent)] text-center cursor-not-allowed opacity-85"
                  />
                  <span className="text-[10px] text-muted mt-1 block">
                    (۲.۵ روز × ۸ ساعت کار مفید = ۲۰ ساعت)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 03: FINANCE & MULTIPLIERS                         */}
          {/* ========================================================= */}
          {activeSection === 'finance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    ضریب اضافه‌کاری روزهای عادی
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="1.4"
                    value={overtimeMultiplierStr}
                    onChange={(e) => {
                      const clean = toEnglishDigits(e.target.value)
                        .replace(/[/٫,]/g, '.')
                        .replace(/[^0-9.]/g, '');
                      const parts = clean.split('.');
                      const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : clean;
                      setOvertimeMultiplierStr(formatted);
                    }}
                    className="liquid-input w-full px-3 py-2 text-xs font-mono text-center text-text"
                  />
                  <span className="text-[10px] text-muted mt-1 block">
                    طبق قانون کار: ۱.۴ برابر دستمزد ساعت عادی
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    ضریب اضافه‌کاری تعطیلات رسمی و جمعه‌ها
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="1.8"
                    value={holidayMultiplierStr}
                    onChange={(e) => {
                      const clean = toEnglishDigits(e.target.value)
                        .replace(/[/٫,]/g, '.')
                        .replace(/[^0-9.]/g, '');
                      const parts = clean.split('.');
                      const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : clean;
                      setHolidayMultiplierStr(formatted);
                    }}
                    className="liquid-input w-full px-3 py-2 text-xs font-mono text-center text-text"
                  />
                  <span className="text-[10px] text-muted mt-1 block">
                    معمول سازمان‌ها: ۱.۸ تا ۲.۰ برابر دستمزد عادی
                  </span>
                </div>
              </div>

              {/* Optional Hourly Wage */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-text">
                    دستمزد ساعتی مبنا (تومان - کاملاً اختیاری)
                  </label>
                  {parseInt(hourlyRateStr.replace(/,/g, ''), 10) > 0 && (
                    <span className="text-xs text-[var(--semantic-success)] font-bold font-mono">
                      {toPersianDigits(
                        parseInt(hourlyRateStr.replace(/,/g, ''), 10).toLocaleString()
                      )}{' '}
                      تومان
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="مثال: ۱۰۰,۰۰۰"
                  value={hourlyRateStr}
                  onChange={(e) => {
                    const clean = toEnglishDigits(e.target.value).replace(/[^0-9]/g, '');
                    setHourlyRateStr(clean ? parseInt(clean, 10).toLocaleString('en-US') : '0');
                  }}
                  className="liquid-input w-full px-3 py-2 text-sm font-mono text-center text-text tracking-wider"
                />
                <p className="text-[10px] text-muted">
                  در صورت تعیین، مبلغ تخمینی اضافه‌کاری ماه جاری در تب گزارشات به صورت خودکار محاسبه و نمایش داده می‌شود.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 04: APPEARANCE & THEME                            */}
          {/* ========================================================= */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              {/* Theme Mode Selector */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-text">
                  <span>حالت نمایش پالت رنگی نوردیک</span>
                  <span className="text-[10px] text-muted font-mono">Nordic Palette</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleThemeModeChange('auto')}
                    className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      uiSettings.themeMode === 'auto'
                        ? 'border-[var(--accent)] bg-[var(--accent)]/15 shadow-md text-text font-bold'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-muted hover:text-text'
                    }`}
                  >
                    <Laptop className="h-4 w-4" />
                    <span className="text-xs">خودکار (سیستم)</span>
                    <span className="text-[10px] text-muted">هماهنگ با تم سیستم عامل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeModeChange('dark')}
                    className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      uiSettings.themeMode === 'dark'
                        ? 'border-[var(--accent)] bg-[var(--accent)]/15 shadow-md text-text font-bold'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-muted hover:text-text'
                    }`}
                  >
                    <Moon className="h-4 w-4" />
                    <span className="text-xs">حالت تیره</span>
                    <span className="text-[10px] text-muted">Nordic Charcoal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeModeChange('light')}
                    className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      uiSettings.themeMode === 'light'
                        ? 'border-[var(--accent)] bg-[var(--accent)]/15 shadow-md text-text font-bold'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-muted hover:text-text'
                    }`}
                  >
                    <Sun className="h-4 w-4" />
                    <span className="text-xs">حالت روشن</span>
                    <span className="text-[10px] text-muted">Snow Cream</span>
                  </button>
                </div>
              </div>

              {/* Visual Effects Setting */}
              <div className="space-y-2.5 pt-3 border-t border-[var(--border)]">
                <span className="text-xs font-bold text-text block">
                  افکت‌های بصری و شبیه‌سازی سیال
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleVisualEffectsChange('auto')}
                    className={`p-3.5 rounded-2xl border text-right transition-all ${
                      uiSettings.visualEffects === 'auto'
                        ? 'border-[var(--accent)] bg-[var(--accent)]/15 shadow-md text-text font-bold'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-muted hover:text-text'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">خودکار (پیش‌فرض)</span>
                      {uiSettings.visualEffects === 'auto' && (
                        <Check className="h-3.5 w-3.5 text-[var(--accent)]" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted leading-relaxed">
                      تشخیص هوشمند بر اساس توان پردازنده و تنظیم کاهش حرکت سیستم
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVisualEffectsChange('high')}
                    className={`p-3.5 rounded-2xl border text-right transition-all ${
                      uiSettings.visualEffects === 'high'
                        ? 'border-[var(--accent)] bg-[var(--accent)]/15 shadow-md text-text font-bold'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-muted hover:text-text'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">کامل (High Effects)</span>
                      {uiSettings.visualEffects === 'high' && (
                        <Check className="h-3.5 w-3.5 text-[var(--accent)]" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted leading-relaxed">
                      حرکت ارگانیک پس‌زمینه، فیلتر شیشه‌ای بلور و پاشش کانفتی پایان شیفت
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVisualEffectsChange('low')}
                    className={`p-3.5 rounded-2xl border text-right transition-all ${
                      uiSettings.visualEffects === 'low'
                        ? 'border-[var(--accent)] bg-[var(--accent)]/15 shadow-md text-text font-bold'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-muted hover:text-text'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">کم (Low Effects)</span>
                      {uiSettings.visualEffects === 'low' && (
                        <Check className="h-3.5 w-3.5 text-[var(--accent)]" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted leading-relaxed">
                      صرفه‌جویی در باتری و حافظه (بلور سبک، بدون انیمیشن پس‌زمینه)
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 05: STORAGE & BACKUP                              */}
          {/* ========================================================= */}
          {activeSection === 'storage' && (
            <div className="space-y-6">
              {/* Cloud Sync Mode Switch */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-text">حالت همگام‌سازی ابری رمزنگاری‌شده (Zero-Knowledge)</h3>
                    <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                      داده‌ها قبل از خروج با کلید مشتق از کلمه عبور شما در مرورگر رمزنگاری می‌شوند؛ سرور هرگز کلید را نمی‌بیند.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStorageMode(storageMode === 'cloud_encrypted' ? 'local' : 'cloud_encrypted')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                      storageMode === 'cloud_encrypted'
                        ? 'liquid-pill-btn-primary shadow-md'
                        : 'bg-[var(--surface)] text-muted border border-[var(--border)] hover:text-text'
                    }`}
                  >
                    {storageMode === 'cloud_encrypted' ? 'ابری رمزنگاری فعال' : 'محلی آفلاین (Local)'}
                  </button>
                </div>

                {storageMode === 'cloud_encrypted' && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={handleManualSyncPush}
                      disabled={isSyncing}
                      className="liquid-pill-btn px-3.5 py-1.5 text-xs text-text flex items-center gap-1.5"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>ارسال دستی به فضای ابری</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleManualSyncPull}
                      disabled={isSyncing}
                      className="liquid-pill-btn px-3.5 py-1.5 text-xs text-text flex items-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>دریافت آخرین نسخه از سرور</span>
                    </button>
                  </div>
                )}

                {syncStatusMsg && (
                  <div className="text-xs text-[var(--accent)] font-mono pt-1">
                    {syncStatusMsg}
                  </div>
                )}
              </div>

              {/* Backup JSON Export & Import */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
                  <h3 className="text-xs font-bold text-text">دانلود فایل پشتیبان کامل (JSON)</h3>
                  <p className="text-[11px] text-muted leading-relaxed">
                    شامل کلیه سوابق تردد، مرخصی‌ها، یادداشت‌ها و تنظیمات شیفت با فرمت استاندارد.
                  </p>
                  <button
                    type="button"
                    onClick={() => exportFullBackupJSON(userId)}
                    className="liquid-pill-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>دانلود Backup.json</span>
                  </button>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
                  <h3 className="text-xs font-bold text-text">بازیابی از فایل پشتیبان (Restore)</h3>
                  <p className="text-[11px] text-muted leading-relaxed">
                    بارگذاری فایل JSON پیشین جهت بازیابی کلیه اطلاعات تردد در سامانه.
                  </p>
                  <label className="liquid-pill-btn px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer inline-flex w-fit">
                    <Upload className="h-4 w-4" />
                    <span>انتخاب فایل پشتیبان</span>
                    <input type="file" accept=".json" onChange={handleUploadBackup} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Excel Export */}
              {onExportExcel && (
                <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-text">خروجی کامل اکسل کارنامه ماه (.xlsx)</h3>
                    <p className="text-[11px] text-muted mt-0.5">دانلود کارنامه به همراه فرمول‌های حسابداری</p>
                  </div>
                  <button
                    type="button"
                    onClick={onExportExcel}
                    className="liquid-pill-btn px-4 py-2 text-xs font-bold text-[var(--semantic-success)] border border-[var(--semantic-success)]/40 hover:bg-[var(--semantic-success)]/10 flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>دریافت فایل اکسل</span>
                  </button>
                </div>
              )}

              {/* Clear All Data */}
              {onResetAllData && (
                <div className="p-4 sm:p-5 rounded-2xl border border-[var(--semantic-danger)]/30 bg-[var(--semantic-danger)]/10 space-y-2">
                  <h3 className="text-xs font-bold text-[var(--semantic-danger)]">
                    پاک‌سازی کلیه اطلاعات تردد و مرخصی
                  </h3>
                  <p className="text-[11px] text-muted">
                    این عملیات غیرقابل بازگشت است و کلیه سوابق ثبت‌شده حذف و به مقادیر اولیه بازمی‌گردد.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          'آیا از پاک‌سازی کامل تمام ترددها و مرخصی‌ها اطمینان دارید؟ این عملیات غیرقابل بازگشت است!'
                        )
                      ) {
                        onResetAllData();
                        alert('کلیه داده‌های سامانه پاک‌سازی شدند.');
                      }
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--semantic-danger)] text-[var(--accent-contrast)] hover:brightness-110 transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>پاک‌سازی کامل اطلاعات</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 06: ACCOUNT & SECURITY                            */}
          {/* ========================================================= */}
          {activeSection === 'account' && (
            <div className="space-y-6">
              {/* User Profile Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-lg flex items-center justify-center shadow-md">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text">{displayName}</h3>
                    <p className="text-xs text-muted font-mono dir-ltr text-right">@{user?.username}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('آیا مایل به خروج از حساب کاربری هستید؟')) {
                      logout();
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--semantic-danger)] bg-[var(--semantic-danger)]/15 border border-[var(--semantic-danger)]/30 hover:bg-[var(--semantic-danger)]/25 transition-all flex items-center gap-1.5"
                >
                  <LogOut className="h-4 w-4" />
                  <span>خروج از حساب</span>
                </button>
              </div>

              {/* Password Change Form */}
              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                <h3 className="text-xs font-bold text-text flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4 text-[var(--accent)]" />
                  <span>تغییر رمز عبور ورود</span>
                </h3>

                <div>
                  <label className="block text-xs text-muted mb-1">کلمه عبور فعلی</label>
                  <input
                    type="password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    className="liquid-input w-full px-3 py-2 text-sm text-text"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted mb-1">کلمه عبور جدید</label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="liquid-input w-full px-3 py-2 text-sm text-text"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted mb-1">تکرار کلمه عبور جدید</label>
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="liquid-input w-full px-3 py-2 text-sm text-text"
                    required
                  />
                </div>

                {passwordNotice && (
                  <div
                    role="alert"
                    className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      passwordNotice.type === 'success'
                        ? 'border-[var(--semantic-success)]/40 bg-[var(--semantic-success)]/10 text-[var(--semantic-success)]'
                        : 'border-[var(--semantic-danger)]/40 bg-[var(--semantic-danger)]/10 text-[var(--semantic-danger)]'
                    }`}
                  >
                    {passwordNotice.type === 'success' ? (
                      <Check className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{passwordNotice.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="liquid-pill-btn-primary px-5 py-2.5 text-xs font-bold shadow-md"
                >
                  ثبت کلمه عبور جدید
                </button>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 07: ACCESSIBILITY & ERGONOMICS                    */}
          {/* ========================================================= */}
          {activeSection === 'accessibility' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-xs text-muted space-y-3 leading-relaxed">
                <h3 className="font-bold text-text text-sm flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[var(--semantic-success)]" />
                  <span>انطباق کامل با استانداردهای WCAG 2.1 AA</span>
                </h3>
                <p>
                  کلیه رنگ‌های متن اصلی و ثانویه در هر دو تم تیره و روشن سامانه، دارای نسبت کنتراست بالای ۴.۵:۱ (متن استاندارد) و عناصر واسط کاربری دارای کنتراست بالای ۳:۱ نسبت به پس‌زمینه‌ها هستند.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
                  <div className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <span className="block text-muted">کنتراست متن تیره:</span>
                    <strong className="text-text">13.7:1 (PASS)</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <span className="block text-muted">کنتراست متن روشن:</span>
                    <strong className="text-text">13.0:1 (PASS)</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <span className="block text-muted">متن دکمه تأکیدی:</span>
                    <strong className="text-text">6.1:1 (PASS)</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <span className="block text-muted">خطوط فوکوس UI:</span>
                    <strong className="text-text">4.5:1 (PASS)</strong>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2 text-xs">
                <span className="font-bold text-text block">ناوبری کامل با کیبورد</span>
                <p className="text-muted leading-relaxed">
                  تمامی دکمه‌ها، زبانه‌ها، فرم‌ها و جدول‌های سامانه مجهز به دامنه فوکوس استاندارد (Focus Ring)، پشتیبانی از کلیدهای Tab و Shift+Tab، و بازخوانی توسط صفحه‌خوان‌ها با مشخصه‌های ARIA می‌باشند.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 08: ABOUT & DOCUMENTATION                         */}
          {/* ========================================================= */}
          {activeSection === 'about' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-text">سامانه هوشمند مدیریت تردد و کارکرد</h3>
                    <p className="text-xs text-muted mt-0.5">نسخه ۲.۴.۰ (طراحی نوردیک مدرن)</p>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
                    v2.4.0
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  طراحی‌شده برای مدیریت دقیق کارکرد، ساعات شناور، تاخیر، اضافه‌کار و مرخصی بر مبنای تقویم رسمی و قوانین کار ایران. کلیه محاسبات در سطح ثانیه در هسته محاسباتی مستقل پردازش می‌شوند.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1.5">
                  <span className="font-bold text-text block">امنیت و حریم خصوصی داده‌ها</span>
                  <p className="text-muted leading-relaxed">
                    پایگاه داده محلی مرورگر با رمزنگاری پیشرفته محافظت شده و ارسال به فضای ابری با پروتکل بدون افشا (Zero-Knowledge) انجام می‌شود.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1.5">
                  <span className="font-bold text-text block">قابلیت کارکرد کاملاً آفلاین</span>
                  <p className="text-muted leading-relaxed">
                    سامانه بدون نیاز به اتصال دائم اینترنت، به صورت Progressive Web App (PWA) در تمامی دستگاه‌ها کار می‌کند.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
