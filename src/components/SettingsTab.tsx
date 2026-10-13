import React, { useState, useEffect } from 'react';
import {
  Settings,
  Clock,
  Calendar,
  Coffee,
  Banknote,
  ShieldCheck,
  Database,
  Download,
  Upload,
  RefreshCw,
  RotateCcw,
  KeyRound,
  Palette,
  Check,
  AlertTriangle,
  Sliders,
  Sparkles,
  Lock,
  Cloud,
  FileSpreadsheet,
  CheckCircle2,
  HelpCircle,
  Activity,
  Layers,
  FileText,
} from 'lucide-react';
import { ShiftConfig, AttendanceRecord, LeaveRecord } from '../types';
import { DEFAULT_SHIFT_CONFIG } from '../utils/calculator';
import {
  toPersianDigits,
  toEnglishDigits,
  formatMinutesToTimeString,
  timeStringToMinutes,
} from '../utils/jalali';
import { APP_THEMES, AppTheme } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { exportFullBackupJSON, importBackupFromJSON } from '../utils/storage';
import {
  getStoredUISettings,
  saveStoredUISettings,
  VisualEffectsSetting,
  resolveEffectiveEffects,
  UISettings,
} from '../utils/uiSettings';

interface SettingsTabProps {
  config: ShiftConfig;
  onSaveConfig: (newConfig: ShiftConfig) => void;
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
  onDataRestored: () => void;
  onResetAllData: () => void;
  onExportExcel?: () => void;
  records?: AttendanceRecord[];
  leaves?: LeaveRecord[];
  onTriggerSync?: () => Promise<void>;
  onTriggerPull?: () => Promise<void>;
  onOpenChangePassword?: () => void;
  onOpenStorageMode?: () => void;
}

type SettingsSectionId = 'shift' | 'thursday' | 'leaves' | 'storage' | 'backup' | 'security' | 'theme';

export const SettingsTab: React.FC<SettingsTabProps> = ({
  config,
  onSaveConfig,
  currentTheme,
  onSelectTheme,
  onDataRestored,
  onResetAllData,
  onExportExcel,
  records = [],
  leaves = [],
  onTriggerSync,
  onTriggerPull,
  onOpenChangePassword,
  onOpenStorageMode,
}) => {
  const { user, storageMode, changePassword, setStorageMode } = useAuth();
  const userId = user?.id;

  const [activeSection, setActiveSection] = useState<SettingsSectionId>('shift');
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

  // Password form state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passwordNotice, setPasswordNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Action status message
  const [saveNotice, setSaveNotice] = useState<string>('');
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  // UI Settings (Visual Effects, Blur, etc.)
  const [uiSettings, setUiSettings] = useState<UISettings>(getStoredUISettings);

  const handleVisualEffectsChange = (mode: VisualEffectsSetting) => {
    const updated = { ...uiSettings, visualEffects: mode };
    setUiSettings(updated);
    saveStoredUISettings(updated);
  };

  useEffect(() => {
    setFormData(config);
    setOvertimeMultiplierStr(config.overtimeMultiplier !== undefined ? String(config.overtimeMultiplier) : '1.4');
    setHolidayMultiplierStr(config.holidayMultiplier !== undefined ? String(config.holidayMultiplier) : '1.8');
    setHourlyRateStr(config.hourlyRateToman ? String(config.hourlyRateToman) : '0');
  }, [config]);

  // Derived metrics
  const standardDailyNetMinutes = Math.max(
    60,
    (formData.requiredDailyMinutes || 510) - (formData.defaultBreakMinutes || 30)
  );
  const dailyNetHours = (standardDailyNetMinutes / 60).toFixed(1);
  const weeklyTotalHours = (
    ((standardDailyNetMinutes * 5) + (formData.thursdayStatus === 'half_day' ? (formData.thursdayMinutes || 240) : formData.thursdayStatus === 'full_day' ? standardDailyNetMinutes : 0)) / 60
  ).toFixed(1);

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const leaveDays = Number(formData.monthlyLeaveDays) || 2.5;
    const quotaHours = Math.round(leaveDays * (standardDailyNetMinutes / 60));

    const parsedOt = parseFloat(toEnglishDigits(overtimeMultiplierStr));
    const otMultiplier = !isNaN(parsedOt) && parsedOt > 0 ? parsedOt : 1.4;

    const parsedHol = parseFloat(toEnglishDigits(holidayMultiplierStr));
    const holMultiplier = !isNaN(parsedHol) && parsedHol > 0 ? parsedHol : 1.8;

    const parsedRate = parseInt(toEnglishDigits(hourlyRateStr), 10);
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
    setSaveNotice('تنظیمات جدید با موفقیت ذخیره و اعمال گردید.');
    setTimeout(() => setSaveNotice(''), 4000);
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        'آیا مایل به بازنشانی تنظیمات شیفت به مقادیر پیش‌فرض هستید؟ (۸:۳۰ تا ۱۷:۰۰ شناور، ۳۰ دقیقه ناهار، پنج‌شنبه نیمه‌وقت)'
      )
    ) {
      setFormData(DEFAULT_SHIFT_CONFIG);
      setOvertimeMultiplierStr(String(DEFAULT_SHIFT_CONFIG.overtimeMultiplier));
      setHolidayMultiplierStr(String(DEFAULT_SHIFT_CONFIG.holidayMultiplier));
      setHourlyRateStr(String(DEFAULT_SHIFT_CONFIG.hourlyRateToman || 0));
      onSaveConfig(DEFAULT_SHIFT_CONFIG);
      setSaveNotice('تنظیمات به حالت پیش‌فرض کارخانه بازنشانی شد.');
      setTimeout(() => setSaveNotice(''), 4000);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);

    if (!newPass || newPass.length < 4) {
      setPasswordNotice({ type: 'error', text: 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد.' });
      return;
    }
    if (newPass !== confirmPass) {
      setPasswordNotice({ type: 'error', text: 'تکرار رمز عبور جدید مطابقت ندارد.' });
      return;
    }

    try {
      await changePassword({ currentPassword: currentPass, newPassword: newPass });
      setPasswordNotice({ type: 'success', text: 'رمز عبور شما با موفقیت تغییر یافت.' });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      setPasswordNotice({ type: 'error', text: err?.message || 'خطا در تغییر رمز عبور. رمز عبور فعلی نامعتبر است.' });
    }
  };

  const handleDownloadBackup = () => {
    exportFullBackupJSON(userId);
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = importBackupFromJSON(text, userId);
        if (success) {
          alert('فایل پشتیبان با موفقیت بازیابی شد!');
          onDataRestored();
        } else {
          alert('خطا در فایل پشتیبان: فرمت نامعتبر');
        }
      } catch (err) {
        alert('خطا در پردازش فایل پشتیبان.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleManualSyncPush = async () => {
    if (!onTriggerSync) return;
    setIsSyncing(true);
    setSyncStatusMsg('در حال بارگذاری و رمزنگاری روی سرور ابری...');
    try {
      await onTriggerSync();
      setSyncStatusMsg('اطلاعات با موفقیت در فضای ابری همگام‌سازی شد.');
    } catch {
      setSyncStatusMsg('خطا در ارتباط با سرور.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(''), 4000);
    }
  };

  const handleManualSyncPull = async () => {
    if (!onTriggerPull) return;
    setIsSyncing(true);
    setSyncStatusMsg('در حال دریافت آخرین نسخه از سرور...');
    try {
      await onTriggerPull();
      setSyncStatusMsg('داده‌ها با موفقیت از سرور دریافت و به‌روز شدند.');
    } catch {
      setSyncStatusMsg('خطا در بارگیری اطلاعات از سرور.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(''), 4000);
    }
  };

  const sections: { id: SettingsSectionId; num: string; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'shift', num: '01', label: 'شیفت و شناوری', icon: Clock },
    { id: 'thursday', num: '02', label: 'پنج‌شنبه‌ها و تعطیلات', icon: Calendar },
    { id: 'leaves', num: '03', label: 'مرخصی و دستمزد', icon: Coffee },
    { id: 'storage', num: '04', label: 'فضای ابری و سینک', icon: Cloud },
    { id: 'backup', num: '05', label: 'پشتیبان‌گیری و خروجی', icon: Database },
    { id: 'security', num: '06', label: 'امنیت و کلمه عبور', icon: Lock },
    { id: 'theme', num: '07', label: 'طراحی و تم سیستم', icon: Palette },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Section Header */}
      <div className="relative border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="compute-pill">
            <span className="w-2 h-2 rounded-full bg-[#eca8d6] animate-pulse" />
            <span>07 // SYSTEM SETTINGS COCKPIT</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>بازنشانی پیش‌فرض</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveAll()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-mono font-medium bg-[#eca8d6] hover:bg-[#f3c2e4] text-black shadow-lg shadow-[#eca8d6]/20 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>ذخیره و اعمال تنظیمات</span>
            </button>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-light text-white tracking-tight">
          مرکز تنظیمات و <span className="text-[#eca8d6]">پیکربندی قوانین کار</span>
        </h1>
        <p className="mt-2 text-sm text-white/60 font-sans max-w-3xl leading-relaxed">
          شخصی‌سازی دقیق پنجره‌های شناور، ساعات موظفی هفتگی، آستانه مرخصی، ذخیره‌سازی ابری و بازیابی داده‌ها.
        </p>

        {saveNotice && (
          <div className="mt-4 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{saveNotice}</span>
          </div>
        )}
      </div>

      {/* Main Settings Navigation Rail & Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar Pills (Tabs) */}
        <aside className="lg:col-span-3 space-y-2">
          <div className="p-2 rounded-2xl border border-white/10 bg-[#09090d] space-y-1">
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-right transition-all text-xs font-mono ${
                    isActive
                      ? 'bg-white text-black font-semibold shadow-md'
                      : 'text-white/65 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-[#eca8d6]'}`} />
                    <span>{sec.label}</span>
                  </div>
                  <span className={`text-[10px] font-mono ${isActive ? 'text-black/60' : 'text-white/30'}`}>
                    {sec.num}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Metrics Glance Box */}
          <div className="p-4 rounded-2xl border border-white/10 bg-[#09090d]/60 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-white/50 text-[11px]">
              <span>خلاصه شیفت جاری</span>
              <span className="text-[#eca8d6]">LIVE METRICS</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/60">ساعت موظف روزانه:</span>
              <span className="text-white font-medium">{toPersianDigits(dailyNetHours)} ساعت</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/60">مجموع موظف هفتگی:</span>
              <span className="text-white font-medium">{toPersianDigits(weeklyTotalHours)} ساعت</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/60">سهمیه مرخصی ماه:</span>
              <span className="text-white font-medium">{toPersianDigits(formData.monthlyLeaveDays || 2.5)} روز</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-white/60">حالت ذخیره‌سازی:</span>
              <span className="text-[#eca8d6]">{storageMode === 'cloud_encrypted' ? 'ابری رمزنگاری' : 'محلی آفلاین'}</span>
            </div>
          </div>
        </aside>

        {/* Content Pane */}
        <section className="lg:col-span-9 rounded-2xl border border-white/10 bg-[#09090d] p-6 sm:p-8 space-y-8">
          {/* Section 01: Shift & Float Window */}
          {activeSection === 'shift' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[11px] font-mono text-[#eca8d6] uppercase tracking-wider">01 // SHIFT ENGINE</span>
                  <h2 className="text-2xl font-display text-white mt-1">تنظیمات شیفت و پنجره شناوری ورود و خروج</h2>
                </div>
                <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-[#eca8d6]">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              {/* Flexible Shift Toggle */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">فعال‌سازی شیفت شناور اداری</div>
                  <div className="text-xs text-white/50 mt-0.5">
                    کارمند مجاز است بین بازه مشخصی وارد شده و ساعت خروج بر اساس حداقل حضور روزانه محاسبه گردد.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFlexibleShift}
                    onChange={(e) => setFormData({ ...formData, isFlexibleShift: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#eca8d6]"></div>
                </label>
              </div>

              {/* Standard Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-2">ساعت ورود استاندارد</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm font-mono text-white text-center focus:border-[#eca8d6] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-2">ساعت خروج استاندارد</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm font-mono text-white text-center focus:border-[#eca8d6] focus:outline-none"
                  />
                </div>
              </div>

              {/* Floating Entry Window */}
              {formData.isFlexibleShift && (
                <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-4">
                  <div className="text-xs font-mono text-[#eca8d6] uppercase tracking-wider">بازه مجاز ورود شناور (صبح)</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-xs text-white/60 mb-1.5">حداقل ساعت مجاز ورود:</span>
                      <input
                        type="time"
                        value={formData.flexStartTimeMin}
                        onChange={(e) => setFormData({ ...formData, flexStartTimeMin: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm font-mono text-white text-center focus:border-[#eca8d6] focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="block text-xs text-white/60 mb-1.5">حداکثر ساعت مجاز ورود بدون تاخیر:</span>
                      <input
                        type="time"
                        value={formData.flexStartTimeMax}
                        onChange={(e) => setFormData({ ...formData, flexStartTimeMax: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm font-mono text-white text-center focus:border-[#eca8d6] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Presence & Break Times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-2">
                    فرجه استراحت و ناهار (دقیقه کسر از کارکرد)
                  </label>
                  <div className="flex gap-2">
                    {[0, 15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setFormData({ ...formData, defaultBreakMinutes: mins })}
                        className={`flex-1 py-2 rounded-xl text-xs font-mono border transition-all ${
                          formData.defaultBreakMinutes === mins
                            ? 'bg-[#eca8d6] text-black font-bold border-[#eca8d6]'
                            : 'border-white/10 bg-black/40 text-white/60 hover:text-white'
                        }`}
                      >
                        {toPersianDigits(mins)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-2">
                    حداقل حضور موظفی ناخالص روزانه (شامل ناهار)
                  </label>
                  <input
                    type="number"
                    value={formData.requiredDailyMinutes}
                    onChange={(e) => setFormData({ ...formData, requiredDailyMinutes: parseInt(e.target.value, 10) || 510 })}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm font-mono text-white text-center focus:border-[#eca8d6] focus:outline-none"
                  />
                  <div className="text-[11px] text-white/40 mt-1">
                    ۵۱۰ دقیقه = ۸ ساعت و ۳۰ دقیقه حضور (معادل ۸ ساعت کار مفید با ۳۰ دقیقه ناهار)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 02: Thursday Policy */}
          {activeSection === 'thursday' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[11px] font-mono text-[#eca8d6] uppercase tracking-wider">02 // THURSDAY POLICY</span>
                  <h2 className="text-2xl font-display text-white mt-1">قوانین کاری پنج‌شنبه‌ها و روزهای پایان هفته</h2>
                </div>
                <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-[#eca8d6]">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-mono text-white/70">وضعیت اداری پنج‌شنبه‌ها در سازمان شما:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thursdayStatus: 'half_day' })}
                    className={`p-4 rounded-xl border text-right transition-all ${
                      formData.thursdayStatus === 'half_day'
                        ? 'border-[#eca8d6] bg-[#eca8d6]/10 text-white'
                        : 'border-white/10 bg-black/40 text-white/60 hover:border-white/30'
                    }`}
                  >
                    <div className="font-semibold text-sm">نیمه‌وقت اداری</div>
                    <div className="text-xs text-white/50 mt-1">حضور الزامی ۴ الی ۴.۵ ساعت</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thursdayStatus: 'off' })}
                    className={`p-4 rounded-xl border text-right transition-all ${
                      formData.thursdayStatus === 'off'
                        ? 'border-[#eca8d6] bg-[#eca8d6]/10 text-white'
                        : 'border-white/10 bg-black/40 text-white/60 hover:border-white/30'
                    }`}
                  >
                    <div className="font-semibold text-sm">تعطیل کامل</div>
                    <div className="text-xs text-white/50 mt-1">بدون الزام حضور (مشابه جمعه)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thursdayStatus: 'full_day' })}
                    className={`p-4 rounded-xl border text-right transition-all ${
                      formData.thursdayStatus === 'full_day'
                        ? 'border-[#eca8d6] bg-[#eca8d6]/10 text-white'
                        : 'border-white/10 bg-black/40 text-white/60 hover:border-white/30'
                    }`}
                  >
                    <div className="font-semibold text-sm">روز کاری کامل</div>
                    <div className="text-xs text-white/50 mt-1">مشابه سایر روزهای هفته</div>
                  </button>
                </div>
              </div>

              {formData.thursdayStatus === 'half_day' && (
                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                  <label className="block text-xs font-mono text-white/70">مدت حضور موظف پنج‌شنبه (دقیقه):</label>
                  <input
                    type="number"
                    value={formData.thursdayMinutes}
                    onChange={(e) => setFormData({ ...formData, thursdayMinutes: parseInt(e.target.value, 10) || 240 })}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm font-mono text-white text-center focus:border-[#eca8d6] focus:outline-none"
                  />
                  <div className="text-[11px] text-white/40">۲۴۰ دقیقه = ۴ ساعت کار مفید در روز پنج‌شنبه</div>
                </div>
              )}
            </div>
          )}

          {/* Section 03: Leaves & Wages */}
          {activeSection === 'leaves' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[11px] font-mono text-[#eca8d6] uppercase tracking-wider">03 // LEAVES & WAGE</span>
                  <h2 className="text-2xl font-display text-white mt-1">سهمیه مرخصی استحقاقی و ضرایب اضافه‌کاری</h2>
                </div>
                <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-[#eca8d6]">
                  <Coffee className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-2">سهمیه مرخصی استحقاقی در ماه (روز)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.monthlyLeaveDays}
                    onChange={(e) => setFormData({ ...formData, monthlyLeaveDays: parseFloat(e.target.value) || 2.5 })}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm font-mono text-white text-center focus:border-[#eca8d6] focus:outline-none"
                  />
                  <div className="text-[11px] text-white/40 mt-1">قانون کار ایران: ۲.۵ روز کاری در هر ماه</div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/70 mb-2">دستمزد ساعتی مبنا (تومان - اختیاری)</label>
                  <input
                    type="text"
                    value={hourlyRateStr}
                    onChange={(e) => setHourlyRateStr(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm font-mono text-white text-center focus:border-[#eca8d6] focus:outline-none"
                    placeholder="مثلا ۱۰۰,۰۰۰"
                  />
                  <div className="text-[11px] text-white/40 mt-1">جهت برآورد خودکار مبلغ اضافه‌کاری ماهانه</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-2">ضریب اضافه‌کاری عادی (روز کاری)</label>
                  <input
                    type="text"
                    value={overtimeMultiplierStr}
                    onChange={(e) => setOvertimeMultiplierStr(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm font-mono text-white text-center focus:border-[#eca8d6] focus:outline-none"
                    placeholder="1.4"
                  />
                  <div className="text-[11px] text-white/40 mt-1">طبق قانون کار: ۱.۴ برابر دستمزد عادی</div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/70 mb-2">ضریب اضافه‌کاری تعطیلات رسمی و جمعه‌ها</label>
                  <input
                    type="text"
                    value={holidayMultiplierStr}
                    onChange={(e) => setHolidayMultiplierStr(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm font-mono text-white text-center focus:border-[#eca8d6] focus:outline-none"
                    placeholder="1.8"
                  />
                  <div className="text-[11px] text-white/40 mt-1">معمولاً ۱.۸ الی ۲.۰ برابر</div>
                </div>
              </div>
            </div>
          )}

          {/* Section 04: Cloud & Storage Engine */}
          {activeSection === 'storage' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[11px] font-mono text-[#eca8d6] uppercase tracking-wider">04 // STORAGE ENGINE</span>
                  <h2 className="text-2xl font-display text-white mt-1">همگام‌سازی ابری و پایگاه داده رمزنگاری‌شده</h2>
                </div>
                <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-[#eca8d6]">
                  <Cloud className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-white">حالت همگام‌سازی ابری سرتاسری (Cloud Sync)</div>
                    <div className="text-xs text-white/50 mt-0.5">
                      اطلاعات به صورت کاملاً رمزنگاری‌شده با سرور اختصاصی ذخیره شده و از هر دستگاهی در دسترس است.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStorageMode(storageMode === 'cloud_encrypted' ? 'local' : 'cloud_encrypted')}
                    className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
                      storageMode === 'cloud_encrypted'
                        ? 'bg-emerald-500 text-black font-bold'
                        : 'border border-white/20 text-white/70 hover:text-white'
                    }`}
                  >
                    {storageMode === 'cloud_encrypted' ? 'ابری فعال' : 'محلی (Local)'}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleManualSyncPush}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/[0.04] text-xs font-mono text-white hover:border-[#eca8d6]/50 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>ارسال و همگام‌سازی با سرور</span>
                </button>

                <button
                  type="button"
                  onClick={handleManualSyncPull}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/[0.04] text-xs font-mono text-white hover:border-[#eca8d6]/50 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دریافت آخرین نسخه از سرور</span>
                </button>
              </div>

              {syncStatusMsg && (
                <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] text-xs font-mono text-[#eca8d6]">
                  {syncStatusMsg}
                </div>
              )}
            </div>
          )}

          {/* Section 05: Backup & Export */}
          {activeSection === 'backup' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[11px] font-mono text-[#eca8d6] uppercase tracking-wider">05 // DATA PORTABILITY</span>
                  <h2 className="text-2xl font-display text-white mt-1">پشتیبان‌گیری، دانلود و بازیابی سوابق</h2>
                </div>
                <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-[#eca8d6]">
                  <Database className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
                  <div className="text-sm font-semibold text-white">دانلود نسخه پشتیبان کامل (JSON)</div>
                  <div className="text-xs text-white/50 leading-relaxed">
                    شامل کلیه سوابق ورود و خروج، مرخصی‌ها، یادداشت‌ها و تنظیمات شیفت در قالب فایل استاندارد.
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono bg-white text-black hover:bg-white/90 font-medium transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>دانلود فایل Backup.json</span>
                  </button>
                </div>

                <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
                  <div className="text-sm font-semibold text-white">بازیابی از فایل پشتیبان (Restore)</div>
                  <div className="text-xs text-white/50 leading-relaxed">
                    بارگذاری فایل JSON جهت بازگردانی اطلاعات پیشین روی این سیستم.
                  </div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono border border-white/20 text-white hover:border-[#eca8d6] cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>انتخاب فایل پشتیبان</span>
                    <input type="file" accept=".json" onChange={handleUploadBackup} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">خروجی اکسل کامل (Excel .xlsx)</div>
                  <div className="text-xs text-white/50 mt-0.5">دانلود کارنامه کامل ماه جاری با فرمول‌های دقیق</div>
                </div>
                <button
                  type="button"
                  onClick={onExportExcel}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>دریافت اکسل</span>
                </button>
              </div>

              {/* Reset Everything */}
              <div className="p-5 rounded-xl border border-rose-500/20 bg-rose-500/[0.04] flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-rose-400">پاک‌سازی کلیه اطلاعات تردد و مرخصی</div>
                  <div className="text-xs text-white/50 mt-0.5">حذف کامل ترددها و بازگشت به تنظیمات صفر اولیه</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('آیا از پاک‌سازی کلیه اطلاعات تردد مطمئن هستید؟ این عملیات غیرقابل بازگشت است.')) {
                      onResetAllData();
                      alert('کلیه اطلاعات پاک‌سازی شدند.');
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-mono bg-rose-500 text-white hover:bg-rose-600 transition-all font-medium"
                >
                  پاک‌سازی داده‌ها
                </button>
              </div>
            </div>
          )}

          {/* Section 06: Security & Password */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[11px] font-mono text-[#eca8d6] uppercase tracking-wider">06 // SECURITY</span>
                  <h2 className="text-2xl font-display text-white mt-1">مدیریت حساب و تغییر رمز عبور</h2>
                </div>
                <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-[#eca8d6]">
                  <Lock className="w-5 h-5" />
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1.5">کلمه عبور فعلی</label>
                  <input
                    type="password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-[#eca8d6] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1.5">کلمه عبور جدید</label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-[#eca8d6] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1.5">تکرار کلمه عبور جدید</label>
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-[#eca8d6] focus:outline-none"
                    required
                  />
                </div>

                {passwordNotice && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                      passwordNotice.type === 'success'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                    }`}
                  >
                    {passwordNotice.type === 'success' ? (
                      <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{passwordNotice.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-mono font-medium bg-[#eca8d6] hover:bg-[#f3c2e4] text-black transition-all"
                >
                  ثبت رمز عبور جدید
                </button>
              </form>
            </div>
          )}

          {/* Section 07: Theme & Display */}
          {activeSection === 'theme' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[11px] font-mono text-[#eca8d6] uppercase tracking-wider">07 // THEME & APPEARANCE</span>
                  <h2 className="text-2xl font-display text-white mt-1">انتخاب پوسته و زبان طراحی سیستم</h2>
                </div>
                <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-[#eca8d6]">
                  <Palette className="w-5 h-5" />
                </div>
              </div>

              {/* Visual Effects Setting Card */}
              <div className="p-5 rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-md space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">افکت‌های بصری و پویانمایی</h3>
                      <p className="text-[11px] text-white/60">
                        کنترل مصرف پردازنده و روانی رابط کاربری (انیمیشن پس‌زمینه، شیشه و دنبال‌کردن ماوس)
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white/10 text-white/80 border border-white/15">
                    حالت اعمال‌شده: {resolveEffectiveEffects(uiSettings.visualEffects) === 'high' ? 'کامل' : 'سبک / کم'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleVisualEffectsChange('auto')}
                    className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
                      uiSettings.visualEffects === 'auto'
                        ? 'border-indigo-400 bg-indigo-500/20 shadow-md text-white'
                        : 'border-white/10 bg-black/30 hover:border-white/20 text-white/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold">خودکار (پیش‌فرض)</span>
                      {uiSettings.visualEffects === 'auto' && <Check className="w-3.5 h-3.5 text-indigo-300" />}
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      تنظیم خودکار بر اساس قدرت پردازنده یا ترجیح کاهش حرکت سیستم (prefers-reduced-motion)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVisualEffectsChange('high')}
                    className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
                      uiSettings.visualEffects === 'high'
                        ? 'border-indigo-400 bg-indigo-500/20 shadow-md text-white'
                        : 'border-white/10 bg-black/30 hover:border-white/20 text-white/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold">کامل (High Effects)</span>
                      {uiSettings.visualEffects === 'high' && <Check className="w-3.5 h-3.5 text-indigo-300" />}
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      پویانمایی روان پس‌زمینه، بازتاب شیشه‌ای ماوس و کانفتی شادباش
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVisualEffectsChange('low')}
                    className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
                      uiSettings.visualEffects === 'low'
                        ? 'border-indigo-400 bg-indigo-500/20 shadow-md text-white'
                        : 'border-white/10 bg-black/30 hover:border-white/20 text-white/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold">کم (Low Effects)</span>
                      {uiSettings.visualEffects === 'low' && <Check className="w-3.5 h-3.5 text-indigo-300" />}
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      بدون پویانمایی حباب، بدون افکت ماوس، بلور سبک‌تر (حداکثر ۱۲px)؛ مناسب گوشی و ذخیره باتری
                    </p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {APP_THEMES.map((theme) => {
                  const isSelected = currentTheme === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => onSelectTheme(theme.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-[#eca8d6] bg-white/[0.04] shadow-lg shadow-[#eca8d6]/10'
                          : 'border-white/10 bg-black/40 hover:border-white/25 hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ backgroundColor: theme.previewAccent }}
                          />
                          <span className="font-semibold text-sm text-white">{theme.persianName}</span>
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#eca8d6] flex items-center justify-center text-black">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-white/50 leading-relaxed mb-4">{theme.description}</p>

                      {/* Swatch palette */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                        <span className="h-4 flex-1 rounded" style={{ backgroundColor: theme.previewBg }} />
                        <span className="h-4 flex-1 rounded" style={{ backgroundColor: theme.previewCard }} />
                        <span className="h-4 flex-1 rounded" style={{ backgroundColor: theme.previewAccent }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Save Bar */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-between">
            <div className="text-xs text-white/40 font-mono">
              کلیه تغییرات با کلیک روی ذخیره به صورت بلادرنگ اعمال می‌شوند.
            </div>
            <button
              type="button"
              onClick={() => handleSaveAll()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-mono font-medium bg-[#eca8d6] hover:bg-[#f3c2e4] text-black shadow-lg shadow-[#eca8d6]/20 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>ذخیره تغییرات</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
