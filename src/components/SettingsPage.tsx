import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Clock,
  Banknote,
  Palette,
  Database,
  Check,
  RotateCcw,
  ShieldCheck,
  KeyRound,
  Download,
  Upload,
  AlertTriangle,
  Lock,
  HardDrive,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Sliders,
  Calendar,
  Layers,
  ChevronLeft,
} from 'lucide-react';
import { ShiftConfig, AttendanceRecord, LeaveRecord, UserProfileInfo, UserPreferences } from '../types';
import { DEFAULT_SHIFT_CONFIG } from '../utils/calculator';
import {
  toPersianDigits,
  toEnglishDigits,
  getCurrentJalaliDate,
} from '../utils/jalali';
import {
  exportAllDataBackup,
  importDataBackup,
  getStoredUserProfile,
  saveStoredUserProfile,
  getStoredUserPreferences,
  saveStoredUserPreferences,
  exportMonthToExcel,
} from '../utils/storage';
import { AppTheme, APP_THEMES } from '../utils/theme';
import { useAuth } from '../context/AuthContext';

export type SettingsCategory = 'profile' | 'shift' | 'finance' | 'appearance' | 'data';

export interface SettingsPageProps {
  config: ShiftConfig;
  onSaveConfig: (newConfig: ShiftConfig) => void;
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
  records: AttendanceRecord[];
  leaves: LeaveRecord[];
  onDataRestored: () => void;
  onResetAllData: () => void;
  onOpenStorageMode?: () => void;
  onOpenChangePassword?: () => void;
  onProfileChange?: (profile: UserProfileInfo) => void;
  onPreferencesChange?: (preferences: UserPreferences) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  config,
  onSaveConfig,
  currentTheme,
  onSelectTheme,
  records,
  onDataRestored,
  onResetAllData,
  onOpenStorageMode,
  onOpenChangePassword,
  onProfileChange,
  onPreferencesChange,
}) => {
  const { user, dbStatus, storageMode, lastSyncedAt } = useAuth();
  const userId = user?.id;

  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('profile');

  // Shift & Timing Config State
  const [formData, setFormData] = useState<ShiftConfig>(config);
  const [overtimeMultiplierStr, setOvertimeMultiplierStr] = useState<string>(
    config.overtimeMultiplier !== undefined ? String(config.overtimeMultiplier) : '1.4'
  );
  const [holidayMultiplierStr, setHolidayMultiplierStr] = useState<string>(
    config.holidayMultiplier !== undefined ? String(config.holidayMultiplier) : '1.8'
  );

  // Profile State
  const [profile, setProfile] = useState<UserProfileInfo>(() => getStoredUserProfile(userId));

  // Preferences State
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    getStoredUserPreferences(userId)
  );

  // Status & Alerts
  const [isSavedToastVisible, setIsSavedToastVisible] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [dangerConfirmStep, setDangerConfirmStep] = useState<'idle' | 'confirm_reset' | 'confirm_delete'>('idle');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if initial config changes
  useEffect(() => {
    setFormData(config);
    setOvertimeMultiplierStr(
      config.overtimeMultiplier !== undefined ? String(config.overtimeMultiplier) : '1.4'
    );
    setHolidayMultiplierStr(
      config.holidayMultiplier !== undefined ? String(config.holidayMultiplier) : '1.8'
    );
  }, [config]);

  // Track unsaved modifications
  const markDirty = () => {
    setHasUnsavedChanges(true);
  };

  // Avatar Swatches
  const avatarColors = [
    { id: '#A68A64', label: 'چوب گرم نوردیک' },
    { id: '#1F2933', label: 'زغال چوب نوردیک' },
    { id: '#2E6F40', label: 'سبز جنگلی' },
    { id: '#4F46E5', label: 'نیلی کبالت' },
    { id: '#D97706', label: 'کهربایی کلاسیک' },
  ];

  // Save All handler
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

    const updatedConfig: ShiftConfig = {
      ...formData,
      overtimeMultiplier: otMultiplier,
      holidayMultiplier: holMultiplier,
      monthlyLeaveDays: leaveDays,
      monthlyLeaveQuotaHours: quotaHours,
    };

    // Save config, profile & preferences
    onSaveConfig(updatedConfig);
    saveStoredUserProfile(profile, userId);
    saveStoredUserPreferences(preferences, userId);
    onProfileChange?.(profile);
    onPreferencesChange?.(preferences);

    setHasUnsavedChanges(false);
    setIsSavedToastVisible(true);
    setTimeout(() => {
      setIsSavedToastVisible(false);
    }, 3500);
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    if (
      window.confirm(
        'آیا مایل به بازنشانی کلیه تنظیمات شیفت، سهمیه مرخصی و ضرایب به مقادیر پیش‌فرض هستید؟'
      )
    ) {
      setFormData(DEFAULT_SHIFT_CONFIG);
      setOvertimeMultiplierStr(String(DEFAULT_SHIFT_CONFIG.overtimeMultiplier));
      setHolidayMultiplierStr(String(DEFAULT_SHIFT_CONFIG.holidayMultiplier));
      setHasUnsavedChanges(true);
    }
  };

  // File Import Backup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importDataBackup(content, userId);
        if (ok) {
          const newProfile = getStoredUserProfile(userId);
          const newPrefs = getStoredUserPreferences(userId);
          setProfile(newProfile);
          setPreferences(newPrefs);
          onProfileChange?.(newProfile);
          onPreferencesChange?.(newPrefs);
          setImportStatus({ type: 'success', text: 'داده‌های پشتیبان با موفقیت بازیابی شدند.' });
          onDataRestored();
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus({ type: 'error', text: 'فایل پشتیبان انتخاب‌شده نامعتبر یا ناسازگار است.' });
          setTimeout(() => setImportStatus(null), 4000);
        }
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Export current month to Excel
  const handleExportExcel = () => {
    const { jy, jm } = getCurrentJalaliDate();
    exportMonthToExcel(records, jy, jm, 'جامع');
  };

  // Calculated Shift Metrics Preview
  const grossMinutes = formData.requiredDailyMinutes || 510;
  const breakMins = formData.defaultBreakMinutes ?? 30;
  const netMinutes = Math.max(0, grossMinutes - breakMins);

  const categories = [
    {
      id: 'profile' as SettingsCategory,
      title: 'پروفایل و هویت کاربری',
      desc: 'مشخصات پرسنلی، نام نمایشی و وضعیت حساب',
      icon: <User className="h-5 w-5" />,
    },
    {
      id: 'shift' as SettingsCategory,
      title: 'قوانین شیفت و ساعات کاری',
      desc: 'ورود شناور، کسر ناهار و قانون پنج‌شنبه‌ها',
      icon: <Clock className="h-5 w-5" />,
    },
    {
      id: 'finance' as SettingsCategory,
      title: 'محاسبات مالی و مرخصی',
      desc: 'دستمزد ساعتی، ضرایب اضافه کاری و سهمیه',
      icon: <Banknote className="h-5 w-5" />,
    },
    {
      id: 'appearance' as SettingsCategory,
      title: 'ظاهر و نمایش',
      desc: 'پالت نوردیک، تم‌ها و نحوه نمایش جداول',
      icon: <Palette className="h-5 w-5" />,
    },
    {
      id: 'data' as SettingsCategory,
      title: 'پشتیبان‌گیری و مدیریت داده‌ها',
      desc: 'خروجی اکسل، فایل JSON و بازنشانی اطلاعات',
      icon: <Database className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#D1D5DB] p-5 sm:p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F0E6] text-[#A68A64] border border-[#A68A64]/30 shadow-sm">
            <Sliders className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-[#1F2933]">تنظیمات و پیکربندی سامانه</h1>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
              مدیریت یکپارچه شیفت‌های کاری شناور، سهمیه مرخصی، دستمزد و حساب کاربری
            </p>
          </div>
        </div>

        {/* Status Chip */}
        <div className="flex items-center gap-2">
          {hasUnsavedChanges ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/30 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-[#D97706] animate-pulse" />
              تغییرات ذخیره‌نشده
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0FDF4] text-[#2E6F40] border border-[#2E6F40]/30 text-xs font-semibold">
              <Check className="h-3.5 w-3.5" />
              تنظیمات به‌روز هستند
            </span>
          )}
        </div>
      </div>

      {/* 2. Mobile Horizontal Pill Bar */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl shrink-0 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#A68A64] text-white shadow-sm'
                  : 'bg-white border border-[#D1D5DB] text-[#6B7280] hover:text-[#1F2933]'
              }`}
            >
              {cat.icon}
              <span>{cat.title}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Right Sticky Sidebar (Desktop) */}
        <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-20 space-y-2">
          <div className="bg-white border border-[#D1D5DB] rounded-3xl p-3 shadow-sm space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
              بخش‌های تنظیمات
            </div>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-right group ${
                    isActive
                      ? 'bg-[#F5F0E6] text-[#1F2933] border border-[#A68A64]/40 shadow-sm'
                      : 'hover:bg-[#F7F7F2] text-[#6B7280] hover:text-[#1F2933]'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 transition-colors ${
                      isActive
                        ? 'bg-[#A68A64] text-white'
                        : 'bg-[#F7F7F2] text-[#6B7280] group-hover:text-[#1F2933]'
                    }`}
                  >
                    {cat.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold truncate ${isActive ? 'text-[#1F2933]' : ''}`}>
                      {cat.title}
                    </p>
                    <p className="text-[11px] text-[#6B7280] truncate mt-0.5">{cat.desc}</p>
                  </div>
                  {isActive && <ChevronLeft className="h-4 w-4 text-[#A68A64] shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Quick Summary Card */}
          <div className="bg-white border border-[#D1D5DB] rounded-3xl p-4 shadow-sm space-y-3">
            <span className="text-xs font-bold text-[#1F2933] flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#A68A64]" />
              پالت اختصاصی نوردیک
            </span>
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              <div className="h-7 rounded-lg bg-[#1F2933]" title="#1F2933 - Nordic Charcoal" />
              <div className="h-7 rounded-lg bg-[#6B7280]" title="#6B7280 - Fjord Gray" />
              <div className="h-7 rounded-lg bg-[#D1D5DB]" title="#D1D5DB - Cloud Gray" />
              <div className="h-7 rounded-lg bg-[#F7F7F2] border border-[#D1D5DB]" title="#F7F7F2 - Snow Cream" />
              <div className="h-7 rounded-lg bg-[#A68A64]" title="#A68A64 - Warm Wood" />
            </div>
            <p className="text-[11px] text-[#6B7280] leading-relaxed">
              طراحی شده بر اساس استانداردهای اداری با کنتراست ارگونومیک و بدون خستگی چشم.
            </p>
          </div>
        </aside>

        {/* Left Settings Panel */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* SECTION 1: USER PROFILE & IDENTITY */}
          {activeCategory === 'profile' && (
            <div className="tab-transition bg-white border border-[#D1D5DB] rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
              <div className="border-b border-[#D1D5DB] pb-4">
                <h2 className="text-base sm:text-lg font-black text-[#1F2933]">پروفایل و هویت کاربری</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  اطلاعات پرسنلی، عنوان شغلی و شناسه سازمانی شما جهت درج در گزارشات و فرم‌ها
                </p>
              </div>

              {/* ID Badge Preview */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-[#F7F7F2] border border-[#D1D5DB]">
                <div
                  className="h-16 w-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md shrink-0"
                  style={{ backgroundColor: profile.avatarColor || '#A68A64' }}
                >
                  {(profile.employeeName || user?.displayName || user?.username || 'ک').charAt(0)}
                </div>
                <div className="space-y-1 text-center sm:text-right flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="text-base font-bold text-[#1F2933]">
                      {profile.employeeName || user?.displayName || user?.username || 'همکار گرامی'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-[#D1D5DB] text-[10px] font-semibold text-[#A68A64]">
                      {profile.roleTitle || 'کارشناس'}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    بخش: {profile.department || 'عمومی'} | کد پرسنلی: {toPersianDigits(profile.personnelId || '---')}
                  </p>
                  <p className="text-[11px] text-[#6B7280] font-mono dir-ltr text-center sm:text-right">
                    @{user?.username}
                  </p>
                </div>
              </div>

              {/* Profile Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F2933] mb-1.5">
                    نام و نام خانوادگی کامل
                  </label>
                  <input
                    type="text"
                    value={profile.employeeName}
                    placeholder={user?.displayName || 'مثال: محمد احمدی'}
                    onChange={(e) => {
                      setProfile({ ...profile, employeeName: e.target.value });
                      markDirty();
                    }}
                    className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-3.5 py-2.5 text-xs text-[#1F2933] focus:border-[#A68A64] focus:ring-1 focus:ring-[#A68A64] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2933] mb-1.5">
                    سمت یا عنوان سازمانی
                  </label>
                  <input
                    type="text"
                    value={profile.roleTitle}
                    placeholder="مثال: مدیر فنی / کارشناس ارشد"
                    onChange={(e) => {
                      setProfile({ ...profile, roleTitle: e.target.value });
                      markDirty();
                    }}
                    className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-3.5 py-2.5 text-xs text-[#1F2933] focus:border-[#A68A64] focus:ring-1 focus:ring-[#A68A64] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2933] mb-1.5">
                    شماره یا کد پرسنلی
                  </label>
                  <input
                    type="text"
                    value={profile.personnelId}
                    placeholder="مثال: ۱۴۰۳-۸۹۲"
                    onChange={(e) => {
                      setProfile({ ...profile, personnelId: e.target.value });
                      markDirty();
                    }}
                    className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-3.5 py-2.5 text-xs text-[#1F2933] font-mono focus:border-[#A68A64] focus:ring-1 focus:ring-[#A68A64] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2933] mb-1.5">
                    واحد سازمانی / دپارتمان
                  </label>
                  <input
                    type="text"
                    value={profile.department}
                    placeholder="مثال: تحقیق و توسعه / بازرگانی"
                    onChange={(e) => {
                      setProfile({ ...profile, department: e.target.value });
                      markDirty();
                    }}
                    className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-3.5 py-2.5 text-xs text-[#1F2933] focus:border-[#A68A64] focus:ring-1 focus:ring-[#A68A64] focus:outline-none"
                  />
                </div>
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-xs font-bold text-[#1F2933] mb-2">
                  رنگ تم آواتار پرسنلی
                </label>
                <div className="flex items-center gap-2.5">
                  {avatarColors.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => {
                        setProfile({ ...profile, avatarColor: color.id });
                        markDirty();
                      }}
                      className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
                        profile.avatarColor === color.id
                          ? 'ring-2 ring-offset-2 ring-[#A68A64] scale-110 shadow-sm'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color.id }}
                      title={color.label}
                    >
                      {profile.avatarColor === color.id && <Check className="h-4 w-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cloud Account & Security Information */}
              <div className="pt-4 border-t border-[#D1D5DB] space-y-3">
                <h3 className="text-xs font-bold text-[#1F2933] flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#2E6F40]" />
                  <span>امنیت حساب و وضعیت فضای ذخیره‌سازی</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#F7F7F2] border border-[#D1D5DB] space-y-1">
                    <span className="text-[11px] text-[#6B7280] block">حالت ذخیره‌سازی داده‌ها</span>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1F2933]">
                      {storageMode === 'cloud_encrypted' ? (
                        <>
                          <Lock className="h-3.5 w-3.5 text-[#2E6F40]" />
                          <span>فضای ابری رمزنگاری‌شده (E2EE)</span>
                        </>
                      ) : (
                        <>
                          <HardDrive className="h-3.5 w-3.5 text-[#6B7280]" />
                          <span>مرورگر محلی (Offline-First)</span>
                        </>
                      )}
                    </div>
                    {lastSyncedAt && (
                      <p className="text-[10px] text-[#6B7280]">
                        آخرین همگام‌سازی: {new Date(lastSyncedAt).toLocaleTimeString('fa-IR')}
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F7F7F2] border border-[#D1D5DB] space-y-1">
                    <span className="text-[11px] text-[#6B7280] block">وضعیت اتصال دیتابیس سرور</span>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1F2933]">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          dbStatus === 'connected' ? 'bg-[#2E6F40]' : 'bg-[#D97706]'
                        }`}
                      />
                      <span>
                        {dbStatus === 'connected'
                          ? 'ارتباط آنلاین پایدار'
                          : dbStatus === 'not_configured'
                          ? 'لوکال / بدون سرور متمرکز'
                          : 'در حال بررسی'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {onOpenChangePassword && (
                    <button
                      type="button"
                      onClick={onOpenChangePassword}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs font-semibold text-[#1F2933] hover:bg-[#F5F0E6] transition-colors"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-[#6B7280]" />
                      <span>تغییر رمز عبور ورود</span>
                    </button>
                  )}
                  {onOpenStorageMode && (
                    <button
                      type="button"
                      onClick={onOpenStorageMode}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs font-semibold text-[#1F2933] hover:bg-[#F5F0E6] transition-colors"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-[#A68A64]" />
                      <span>تنظیمات همگام‌سازی ابری</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: SHIFT & WORKING HOURS */}
          {activeCategory === 'shift' && (
            <div className="tab-transition bg-white border border-[#D1D5DB] rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
              <div className="border-b border-[#D1D5DB] pb-4">
                <h2 className="text-base sm:text-lg font-black text-[#1F2933]">قوانین شیفت و ساعات کاری</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  پیکربندی بازه ورود و خروج شناور، کسر استراحت ناهار و مدت موظفی روزهای هفته
                </p>
              </div>

              {/* Flexible Shift Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F7F7F2] border border-[#D1D5DB]">
                <div>
                  <span className="text-xs font-bold text-[#1F2933] block">فعال بودن شیفت کاری شناور</span>
                  <span className="text-[11px] text-[#6B7280]">
                    ورود در بازه مجاز تعیین‌شده مشمول تاخیر نشده و ساعت خروج متناسب با آن جابجا می‌شود
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFlexibleShift}
                    onChange={(e) => {
                      setFormData({ ...formData, isFlexibleShift: e.target.checked });
                      markDirty();
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#D1D5DB] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-[#D1D5DB] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A68A64]" />
                </label>
              </div>

              {/* Start Time Ranges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F2933] mb-1">
                    شروع بازه ورود مجاز شناور
                  </label>
                  <input
                    type="time"
                    value={formData.flexStartTimeMin || '08:30'}
                    onChange={(e) => {
                      setFormData({ ...formData, flexStartTimeMin: e.target.value });
                      markDirty();
                    }}
                    className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-3.5 py-2.5 text-sm font-mono text-[#1F2933] text-center focus:border-[#A68A64] focus:outline-none"
                  />
                  <span className="text-[10px] text-[#6B7280] mt-1 block">پیش‌فرض اداری: ۰۸:۳۰</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2933] mb-1">
                    پایان بازه ورود مجاز شناور (شروع تاخیر)
                  </label>
                  <input
                    type="time"
                    value={formData.flexStartTimeMax || '09:30'}
                    onChange={(e) => {
                      setFormData({ ...formData, flexStartTimeMax: e.target.value });
                      markDirty();
                    }}
                    className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-3.5 py-2.5 text-sm font-mono text-[#1F2933] text-center focus:border-[#A68A64] focus:outline-none"
                  />
                  <span className="text-[10px] text-[#6B7280] mt-1 block">
                    ورود بعد از این ساعت تاخیر محسوب می‌شود (پیش‌فرض: ۰۹:۳۰)
                  </span>
                </div>
              </div>

              {/* Departure Ranges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F2933] mb-1">
                    حداقل ساعت خروج (در صورت ورود رأس ۰۸:۳۰)
                  </label>
                  <input
                    type="time"
                    value={formData.flexDepartureMin || '17:00'}
                    onChange={(e) => {
                      setFormData({ ...formData, flexDepartureMin: e.target.value });
                      markDirty();
                    }}
                    className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-3.5 py-2.5 text-sm font-mono text-[#1F2933] text-center focus:border-[#A68A64] focus:outline-none"
                  />
                  <span className="text-[10px] text-[#6B7280] mt-1 block">پیش‌فرض: ۱۷:۰۰</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2933] mb-1">
                    حداکثر ساعت خروج شیفت عادی (ورود ۰۹:۳۰)
                  </label>
                  <input
                    type="time"
                    value={formData.flexDepartureMax || '18:00'}
                    onChange={(e) => {
                      setFormData({ ...formData, flexDepartureMax: e.target.value });
                      markDirty();
                    }}
                    className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-3.5 py-2.5 text-sm font-mono text-[#1F2933] text-center focus:border-[#A68A64] focus:outline-none"
                  />
                  <span className="text-[10px] text-[#6B7280] mt-1 block">پیش‌فرض: ۱۸:۰۰</span>
                </div>
              </div>

              {/* Lunch Break with Quick Presets */}
              <div className="p-4 rounded-2xl bg-[#F7F7F2] border border-[#D1D5DB] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-[#1F2933]">
                      کسر خودکار زمان ناهار و استراحت میان‌روزی
                    </label>
                    <span className="text-[11px] text-[#6B7280]">
                      این مدت از کل حضور کسر شده و مبنای کارکرد خالص مفید قرار می‌گیرد
                    </span>
                  </div>
                  <div className="font-mono text-sm font-black text-[#A68A64]">
                    {toPersianDigits(formData.defaultBreakMinutes ?? 30)} دقیقه
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2">
                  {[0, 15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, defaultBreakMinutes: mins });
                        markDirty();
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        formData.defaultBreakMinutes === mins
                          ? 'bg-[#A68A64] text-white shadow-sm'
                          : 'bg-white border border-[#D1D5DB] text-[#6B7280] hover:text-[#1F2933]'
                      }`}
                    >
                      {mins === 0 ? 'بدون کسر ناهار' : `${toPersianDigits(mins)} دقیقه`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Thursday Policy */}
              <div className="space-y-3 pt-2 border-t border-[#D1D5DB]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#1F2933]">
                    قانون کاری روزهای پنج‌شنبه (Thursday Policy)
                  </label>
                  <span className="text-[11px] text-[#A68A64] font-medium font-mono">
                    جمعه‌ها به صورت قانون کار تعطیل هفتگی است
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'half_day', title: 'نیمه‌وقت (۴ ساعت)', desc: 'موظفی ۲۴۰ دقیقه، بدون کسر ناهار' },
                    { id: 'off', title: 'تعطیل کامل', desc: 'بدون موظفی، حضور مازاد اضافه کار است' },
                    { id: 'full_day', title: 'روز کاری کامل', desc: 'مشابه شنبه تا چهارشنبه (۸.۵ ساعت)' },
                  ].map((p) => {
                    const isSelected = formData.thursdayStatus === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            thursdayStatus: p.id as any,
                            thursdayMinutes: p.id === 'half_day' ? 240 : p.id === 'off' ? 0 : 510,
                          });
                          markDirty();
                        }}
                        className={`p-3.5 rounded-2xl border text-right transition-all ${
                          isSelected
                            ? 'border-[#A68A64] bg-[#F5F0E6] text-[#1F2933] shadow-sm'
                            : 'border-[#D1D5DB] bg-white text-[#6B7280] hover:border-[#A68A64]/40 hover:text-[#1F2933]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{p.title}</span>
                          {isSelected && <Check className="h-4 w-4 text-[#A68A64]" />}
                        </div>
                        <span className="text-[11px] block opacity-80">{p.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Shift Calculation Banner */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F5F0E6] border border-[#A68A64]/30 text-xs text-[#1F2933]">
                <span>
                  حضور ناخالص: <strong>{toPersianDigits(Math.floor(grossMinutes / 60))}س و {toPersianDigits(grossMinutes % 60)}د</strong>
                </span>
                <span>
                  کسر ناهار: <strong className="text-[#D97706]">{toPersianDigits(breakMins)} دقیقه</strong>
                </span>
                <span>
                  کارکرد مفید خالص روزانه: <strong className="text-[#2E6F40] font-bold">{toPersianDigits(Math.floor(netMinutes / 60))}س و {toPersianDigits(netMinutes % 60)}د</strong>
                </span>
              </div>
            </div>
          )}

          {/* SECTION 3: FINANCIAL & LEAVE QUOTAS */}
          {activeCategory === 'finance' && (
            <div className="tab-transition bg-white border border-[#D1D5DB] rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
              <div className="border-b border-[#D1D5DB] pb-4">
                <h2 className="text-base sm:text-lg font-black text-[#1F2933]">محاسبات مالی و مرخصی‌ها</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  تنظیم نرخ دستمزد ساعتی، ضرایب اضافه کاری و سهمیه قانونی مرخصی استحقاقی
                </p>
              </div>

              {/* Hourly Rate (Toman) */}
              <div className="p-4 rounded-2xl bg-[#F7F7F2] border border-[#D1D5DB] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#1F2933]">
                    نرخ دستمزد ساعتی پایه (تومان)
                  </label>
                  {formData.hourlyRateToman ? (
                    <span className="text-xs font-bold font-mono text-[#2E6F40]">
                      معادل دقیقه‌ای: {toPersianDigits(Math.round(formData.hourlyRateToman / 60).toLocaleString())} تومان
                    </span>
                  ) : null}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="مثال: ۸۵,۰۰۰ تومان"
                    value={
                      formData.hourlyRateToman
                        ? formData.hourlyRateToman.toLocaleString('en-US')
                        : ''
                    }
                    onChange={(e) => {
                      const cleanStr = toEnglishDigits(e.target.value).replace(/[^0-9]/g, '');
                      const val = cleanStr ? parseInt(cleanStr, 10) : 0;
                      setFormData({ ...formData, hourlyRateToman: val });
                      markDirty();
                    }}
                    className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3.5 py-2.5 text-sm font-mono text-[#1F2933] text-center focus:border-[#A68A64] focus:outline-none tracking-wider"
                  />
                  {formData.hourlyRateToman ? (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, hourlyRateToman: 0 });
                        markDirty();
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#B91C1C] text-xs p-1"
                      title="پاک کردن"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
                <p className="text-[11px] text-[#6B7280]">
                  این مبلغ جهت برآورد مالی کارکرد و اضافه کاری ماهانه در گزارشات تحلیلی استفاده می‌شود.
                </p>
              </div>

              {/* Overtime Multipliers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F2933] mb-1">
                    ضریب اضافه کاری روزهای عادی
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={overtimeMultiplierStr}
                    onChange={(e) => {
                      const cleanStr = toEnglishDigits(e.target.value)
                        .replace(/[/٫,]/g, '.')
                        .replace(/[^0-9.]/g, '');
                      const parts = cleanStr.split('.');
                      const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleanStr;
                      setOvertimeMultiplierStr(formatted);
                      markDirty();
                    }}
                    className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-3.5 py-2.5 text-xs font-mono text-[#1F2933] text-center focus:border-[#A68A64] focus:outline-none"
                  />
                  <span className="text-[10px] text-[#6B7280] mt-1 block">
                    قانون کار ایران: ۱.۴ برابر دستمزد پایه
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2933] mb-1">
                    ضریب اضافه کاری تعطیلات و جمعه‌ها
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={holidayMultiplierStr}
                    onChange={(e) => {
                      const cleanStr = toEnglishDigits(e.target.value)
                        .replace(/[/٫,]/g, '.')
                        .replace(/[^0-9.]/g, '');
                      const parts = cleanStr.split('.');
                      const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleanStr;
                      setHolidayMultiplierStr(formatted);
                      markDirty();
                    }}
                    className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-3.5 py-2.5 text-xs font-mono text-[#1F2933] text-center focus:border-[#A68A64] focus:outline-none"
                  />
                  <span className="text-[10px] text-[#6B7280] mt-1 block">
                    قانون کار ایران: ۱.۸ تا ۲.۰ برابر دستمزد پایه
                  </span>
                </div>
              </div>

              {/* Monthly Leave Quota */}
              <div className="pt-2 border-t border-[#D1D5DB] space-y-3">
                <h3 className="text-xs font-bold text-[#1F2933] flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#A68A64]" />
                  <span>سهمیه مرخصی استحقاقی قانون کار (ماده ۶۴)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1F2933] mb-1">
                      سهمیه مرخصی ماهانه (روز)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="15"
                      value={formData.monthlyLeaveDays ?? 2.5}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormData({
                          ...formData,
                          monthlyLeaveDays: val,
                          monthlyLeaveQuotaHours: Math.round(val * 8),
                        });
                        markDirty();
                      }}
                      className="w-full rounded-xl border border-[#D1D5DB] bg-[#F7F7F2] px-3.5 py-2.5 text-xs font-mono text-[#1F2933] text-center focus:border-[#A68A64] focus:outline-none"
                    />
                    <span className="text-[10px] text-[#6B7280] mt-1 block">
                      استاندارد قانون کار: ۲.۵ روز در ماه (۲۶ روز کاری در سال)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1F2933] mb-1">
                      معادل سهمیه مرخصی ماهانه (ساعت)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`${toPersianDigits(Math.round((formData.monthlyLeaveDays || 2.5) * 8))} ساعت کاری`}
                      className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3.5 py-2.5 text-xs font-mono text-[#A68A64] font-bold text-center cursor-not-allowed"
                    />
                    <span className="text-[10px] text-[#6B7280] mt-1 block">
                      محاسبه خودکار: ۲.۵ روز × ۸ ساعت کار خالص = ۲۰ ساعت
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: APPEARANCE & PREFERENCES */}
          {activeCategory === 'appearance' && (
            <div className="tab-transition bg-white border border-[#D1D5DB] rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
              <div className="border-b border-[#D1D5DB] pb-4">
                <h2 className="text-base sm:text-lg font-black text-[#1F2933]">ظاهر و نحوه نمایش</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  شخصی‌سازی پالت‌های رنگی، نحوه نمایش کارنامه و ترجیحات تعاملی سامانه
                </p>
              </div>

              {/* Theme Selector Grid */}
              <div>
                <label className="block text-xs font-bold text-[#1F2933] mb-2.5">
                  انتخاب تم بصری سامانه
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {APP_THEMES.map((th) => {
                    const isSelected = currentTheme === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => onSelectTheme(th.id)}
                        className={`p-3.5 rounded-2xl border text-right transition-all ${
                          isSelected
                            ? 'border-[#A68A64] bg-[#F5F0E6] shadow-sm'
                            : 'border-[#D1D5DB] bg-white hover:border-[#A68A64]/40 hover:bg-[#F7F7F2]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-[#1F2933]">{th.persianName}</span>
                          {isSelected ? (
                            <span className="h-4 w-4 rounded-full bg-[#A68A64] text-white flex items-center justify-center text-[10px]">
                              ✓
                            </span>
                          ) : null}
                        </div>
                        {/* Theme preview swatch */}
                        <div className="h-8 rounded-xl flex items-center px-3 gap-2 border border-[#D1D5DB]/60 overflow-hidden" style={{ backgroundColor: th.previewBg }}>
                          <div className="h-3.5 w-7 rounded-md" style={{ backgroundColor: th.previewCard }} />
                          <div className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: th.previewAccent }} />
                        </div>
                        <p className="text-[10px] text-[#6B7280] mt-2 line-clamp-1">{th.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Table View Mode */}
              <div className="pt-2 border-t border-[#D1D5DB] space-y-3">
                <label className="block text-xs font-bold text-[#1F2933]">
                  حالت نمایش پیش‌فرض کارنامه تردد
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPreferences({ ...preferences, defaultViewMode: 'table' });
                      markDirty();
                    }}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between ${
                      preferences.defaultViewMode === 'table'
                        ? 'border-[#A68A64] bg-[#F5F0E6] text-[#1F2933] shadow-sm'
                        : 'border-[#D1D5DB] bg-white text-[#6B7280] hover:text-[#1F2933]'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">جدول تفصیلی (Table)</span>
                      <span className="text-[10px] text-[#6B7280]">حالت بهینه برای کامپیوتر و نمایش کامل ستون‌ها</span>
                    </div>
                    {preferences.defaultViewMode === 'table' && <Check className="h-4 w-4 text-[#A68A64]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPreferences({ ...preferences, defaultViewMode: 'card' });
                      markDirty();
                    }}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between ${
                      preferences.defaultViewMode === 'card'
                        ? 'border-[#A68A64] bg-[#F5F0E6] text-[#1F2933] shadow-sm'
                        : 'border-[#D1D5DB] bg-white text-[#6B7280] hover:text-[#1F2933]'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">کارت‌های شبکه‌ای (Cards)</span>
                      <span className="text-[10px] text-[#6B7280]">حالت مدرن کارتی مناسب برای موبایل و تبلت</span>
                    </div>
                    {preferences.defaultViewMode === 'card' && <Check className="h-4 w-4 text-[#A68A64]" />}
                  </button>
                </div>
              </div>

              {/* System Interaction Toggles */}
              <div className="pt-2 border-t border-[#D1D5DB] space-y-3">
                <h3 className="text-xs font-bold text-[#1F2933] flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#A68A64]" />
                  <span>ترجیحات تعاملی سامانه</span>
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F7F2] border border-[#D1D5DB]">
                    <div>
                      <span className="text-xs font-bold text-[#1F2933] block">یادآوری‌های ثبت ورود و خروج</span>
                      <span className="text-[11px] text-[#6B7280]">
                        نمایش اعلان در زمان رسیدن به سقف موظفی روزانه جهت خروج به موقع
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.enableNotifications}
                        onChange={(e) => {
                          setPreferences({ ...preferences, enableNotifications: e.target.checked });
                          markDirty();
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#D1D5DB] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-[#D1D5DB] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A68A64]" />
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F7F2] border border-[#D1D5DB]">
                    <div>
                      <span className="text-xs font-bold text-[#1F2933] block">انیمیشن و افکت ثبت تردد</span>
                      <span className="text-[11px] text-[#6B7280]">
                        پخش صدای تایید ملایم و افکت تصویری پس از ثبت تردد روزانه
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.enableSoundEffects}
                        onChange={(e) => {
                          setPreferences({ ...preferences, enableSoundEffects: e.target.checked });
                          markDirty();
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#D1D5DB] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-[#D1D5DB] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A68A64]" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: BACKUP, EXPORT & DANGER ZONE */}
          {activeCategory === 'data' && (
            <div className="tab-transition bg-white border border-[#D1D5DB] rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
              <div className="border-b border-[#D1D5DB] pb-4">
                <h2 className="text-base sm:text-lg font-black text-[#1F2933]">پشتیبان‌گیری و مدیریت داده‌ها</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  دریافت نسخه پشتیبان کامل، خروجی اکسل، بازیابی اطلاعات و پاک‌سازی داده‌ها
                </p>
              </div>

              {/* Status Alert */}
              {importStatus && (
                <div
                  className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-semibold ${
                    importStatus.type === 'success'
                      ? 'bg-[#F0FDF4] border border-[#2E6F40]/30 text-[#2E6F40]'
                      : 'bg-[#FEF2F2] border border-[#B91C1C]/30 text-[#B91C1C]'
                  }`}
                >
                  {importStatus.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{importStatus.text}</span>
                </div>
              )}

              {/* Export Buttons */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#1F2933] flex items-center gap-2">
                  <Download className="h-4 w-4 text-[#A68A64]" />
                  <span>پشتیبان‌گیری و دانلود اطلاعات</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => exportAllDataBackup(userId)}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-[#F7F7F2] border border-[#D1D5DB] hover:border-[#A68A64] hover:bg-[#F5F0E6] transition-all text-right group shadow-sm"
                  >
                    <div className="p-2.5 rounded-xl bg-white text-[#A68A64] border border-[#D1D5DB] group-hover:bg-[#A68A64] group-hover:text-white transition-colors">
                      <Download className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#1F2933] block">دانلود فایل کامل پشتیبان (JSON)</span>
                      <span className="text-[11px] text-[#6B7280]">شامل کلیه ترددها، مرخصی‌ها، پروفایل و تنظیمات</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-[#F7F7F2] border border-[#D1D5DB] hover:border-[#2E6F40] hover:bg-[#F0FDF4] transition-all text-right group shadow-sm"
                  >
                    <div className="p-2.5 rounded-xl bg-white text-[#2E6F40] border border-[#D1D5DB] group-hover:bg-[#2E6F40] group-hover:text-white transition-colors">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#1F2933] block">خروجی اکسل کامل (XLSX)</span>
                      <span className="text-[11px] text-[#6B7280]">فایل جدولی استاندارد سازمانی جهت ارائه به امور اداری</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Restore Section */}
              <div className="pt-2 border-t border-[#D1D5DB] space-y-3">
                <h3 className="text-xs font-bold text-[#1F2933] flex items-center gap-2">
                  <Upload className="h-4 w-4 text-[#A68A64]" />
                  <span>بازیابی داده‌ها از فایل پشتیبان</span>
                </h3>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#D1D5DB] hover:border-[#A68A64] rounded-3xl p-6 text-center cursor-pointer bg-[#F7F7F2] hover:bg-[#F5F0E6]/30 transition-all space-y-2"
                >
                  <div className="h-10 w-10 mx-auto rounded-full bg-white flex items-center justify-center text-[#A68A64] border border-[#D1D5DB]">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-[#1F2933]">
                    برای بارگذاری فایل پشتیبان (.json) اینجا کلیک کنید یا فایل را بکشید و رها کنید
                  </p>
                  <p className="text-[11px] text-[#6B7280]">
                    کلیه رکوردهای تردد، مرخصی و تنظیمات قبلی شما با دقت کامل بازیابی خواهند شد
                  </p>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-3 border-t border-[#D1D5DB]">
                <div className="p-5 rounded-3xl border border-[#B91C1C]/40 bg-[#FEF2F2]/40 space-y-3">
                  <div className="flex items-center gap-2 text-[#B91C1C]">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <h3 className="text-xs font-bold">منطقه خطر (Danger Zone)</h3>
                  </div>
                  <p className="text-[11px] text-[#6B7280] leading-relaxed">
                    عملیات زیر غیرقابل بازگشت هستند. پیش از اقدام، پیشنهاد می‌شود ابتدا از داده‌های خود نسخه پشتیبان JSON دریافت نمایید.
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    {dangerConfirmStep === 'confirm_reset' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#B91C1C] font-bold">آیا کاملاً مطمئن هستید؟</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(DEFAULT_SHIFT_CONFIG);
                            setOvertimeMultiplierStr(String(DEFAULT_SHIFT_CONFIG.overtimeMultiplier));
                            setHolidayMultiplierStr(String(DEFAULT_SHIFT_CONFIG.holidayMultiplier));
                            setDangerConfirmStep('idle');
                            markDirty();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#B91C1C] text-white text-xs font-bold shadow-sm"
                        >
                          بله، بازنشانی شود
                        </button>
                        <button
                          type="button"
                          onClick={() => setDangerConfirmStep('idle')}
                          className="px-3 py-1.5 rounded-xl border border-[#D1D5DB] bg-white text-xs text-[#6B7280]"
                        >
                          انصراف
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDangerConfirmStep('confirm_reset')}
                        className="px-4 py-2 rounded-xl border border-[#B91C1C]/30 bg-white hover:bg-rose-50 text-xs font-bold text-[#B91C1C] transition-colors"
                      >
                        بازنشانی قوانین شیفت به پیش‌فرض کارگاه
                      </button>
                    )}

                    {dangerConfirmStep === 'confirm_delete' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#B91C1C] font-bold">پاک‌سازی کل رکوردهای تردد؟</span>
                        <button
                          type="button"
                          onClick={() => {
                            onResetAllData();
                            setDangerConfirmStep('idle');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#B91C1C] text-white text-xs font-bold shadow-sm"
                        >
                          بله، کاملاً پاک شود
                        </button>
                        <button
                          type="button"
                          onClick={() => setDangerConfirmStep('idle')}
                          className="px-3 py-1.5 rounded-xl border border-[#D1D5DB] bg-white text-xs text-[#6B7280]"
                        >
                          انصراف
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDangerConfirmStep('confirm_delete')}
                        className="px-4 py-2 rounded-xl border border-[#B91C1C]/30 bg-white hover:bg-rose-50 text-xs font-bold text-[#B91C1C] transition-colors"
                      >
                        پاک‌سازی کلیه رکوردهای تردد و مرخصی‌ها
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Action Bar (Save & Reset) */}
          <div className="bg-white border border-[#D1D5DB] rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              {isSavedToastVisible ? (
                <div className="flex items-center gap-1.5 text-[#2E6F40] font-bold animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>تنظیمات با موفقیت ذخیره و در سامانه اعمال شدند.</span>
                </div>
              ) : hasUnsavedChanges ? (
                <span className="text-[#D97706] font-medium">
                  توجه: تغییرات جدید اعمال‌شده هنوز ذخیره نشده‌اند.
                </span>
              ) : (
                <span className="text-[#6B7280]">
                  کلیه پارامترها با مقادیر جاری سامانه هماهنگ هستند.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#D1D5DB] bg-white hover:bg-[#F7F7F2] text-xs font-semibold text-[#6B7280] hover:text-[#1F2933] transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>پیش‌فرض‌ها</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveAll()}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#A68A64] hover:bg-[#8F7553] text-white text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
              >
                <Check className="h-4 w-4" />
                <span>ذخیره کلیه تغییرات</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
