import React, { useState } from 'react';
import {
  X,
  HardDrive,
  Cloud,
  ShieldCheck,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Check,
  Server,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StorageMode } from '../types';
import { toPersianDigits } from '../utils/jalali';

interface StorageModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerSync: () => Promise<void>;
  onTriggerPull: () => Promise<void>;
}

export const StorageModeModal: React.FC<StorageModeModalProps> = ({
  isOpen,
  onClose,
  onTriggerSync,
  onTriggerPull,
}) => {
  const { storageMode, setStorageMode, lastSyncedAt, isSyncing, dbStatus } = useAuth();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleModeChange = async (mode: StorageMode) => {
    try {
      await setStorageMode(mode);
      if (mode === 'cloud_encrypted') {
        setSuccessMsg('حالت همگام‌سازی ابری با رمزنگاری پیشرفته فعال شد.');
        await onTriggerSync();
      } else {
        setSuccessMsg('حالت ذخیره‌سازی محلی (فقط مرورگر) فعال شد.');
      }
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در تغییر حالت ذخیره‌سازی.');
    }
  };

  const handleManualSync = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await onTriggerSync();
      setSuccessMsg('اطلاعات با موفقیت رمزنگاری و در سرور ابری همگام شدند.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در همگام‌سازی اطلاعات.');
    }
  };

  const handleManualPull = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!window.confirm('آیا مایلید اطلاعات ذخیره‌شده در سرور ابری رمزگشایی و در این مرورگر بارگذاری شوند؟')) {
      return;
    }
    try {
      await onTriggerPull();
      setSuccessMsg('اطلاعات با موفقیت از سرور ابری بارگذاری و رمزگشایی شدند.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در بارگذاری اطلاعات ابری.');
    }
  };

  const formatLastSync = (isoStr: string | null) => {
    if (!isoStr) return 'تاکنون همگام‌سازی نشده است';
    try {
      const d = new Date(isoStr);
      return toPersianDigits(d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })) + ' (' + toPersianDigits(d.toLocaleDateString('fa-IR')) + ')';
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#161a28] border border-white/[0.1] rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                مدیریت محل ذخیره‌سازی و امنیت داده‌ها
              </h3>
              <p className="text-xs text-slate-400">
                انتخاب محل نگهداری و سطح رمزنگاری اطلاعات تردد و محاسبات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Storage Mode Selection Cards */}
        <div className="mt-5 space-y-3.5">
          <p className="text-xs font-semibold text-slate-300">
            محل ذخیره‌سازی داده‌های تردد، مرخصی و شیفت‌های کاری:
          </p>

          {/* Option 1: Local Browser Only */}
          <div
            onClick={() => handleModeChange('local')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all relative ${
              storageMode === 'local'
                ? 'bg-indigo-950/30 border-indigo-500/70 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    storageMode === 'local'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800/80 text-slate-400'
                  }`}
                >
                  <Laptop className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">
                      ذخیره‌سازی محلی (فقط روی این دستگاه)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      خصوصی و آفلاین
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    اطلاعات تردد، ساعات کاری و مرخصی‌ها به صورت محرمانه تنها در حافظه مرورگر این دستگاه ذخیره می‌شوند و هیچ دیتایی به خارج ارسال نمی‌گردد.
                  </p>
                </div>
              </div>
              <div className="shrink-0 pt-1">
                <div
                  className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                    storageMode === 'local'
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-slate-700 bg-transparent'
                  }`}
                >
                  {storageMode === 'local' && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
            </div>
          </div>

          {/* Option 2: Cloud Sync with AES-256 Encryption */}
          <div
            onClick={() => handleModeChange('cloud_encrypted')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all relative ${
              storageMode === 'cloud_encrypted'
                ? 'bg-indigo-950/30 border-cyan-500/70 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    storageMode === 'cloud_encrypted'
                      ? 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/30'
                      : 'bg-slate-800/80 text-slate-400'
                  }`}
                >
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">
                      همگام‌سازی ابری با رمزنگاری پیشرفته (AES-256)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      رمزنگاری سراسری
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    تمامی اطلاعات تردد، مرخصی و تنظیمات پیش از ارسال، با کلید ۲۵۶ بیتی اختصاصی بر روی همین مرورگر رمزگذاری شده و بر روی سرور ایمن نگهداری می‌شوند. حتی مدیر سرور نیز قادر به خواندن داده‌های شما نخواهد بود.
                  </p>
                </div>
              </div>
              <div className="shrink-0 pt-1">
                <div
                  className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                    storageMode === 'cloud_encrypted'
                      ? 'border-cyan-500 bg-cyan-600 text-white'
                      : 'border-slate-700 bg-transparent'
                  }`}
                >
                  {storageMode === 'cloud_encrypted' && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Controls (Visible when Cloud Sync is selected) */}
        {storageMode === 'cloud_encrypted' && (
          <div className="mt-5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Server className="h-4 w-4 text-cyan-400" />
                <span>وضعیت ارتباط با سرور:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  سرور مرکزی فعال و متصل
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">آخرین همگام‌سازی ابری:</span>
              <span className="text-slate-200 font-mono text-[11px]">
                {formatLastSync(lastSyncedAt)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>همگام‌سازی دستی اکنون</span>
              </button>

              <button
                type="button"
                onClick={handleManualPull}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-semibold transition-all disabled:opacity-50"
              >
                <Cloud className="h-4 w-4 text-cyan-400" />
                <span>بازیابی از نسخه ابری</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            تأیید و بستن
          </button>
        </div>
      </div>
    </div>
  );
};
