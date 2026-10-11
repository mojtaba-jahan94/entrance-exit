import React, { useState } from 'react';
import {
  X,
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
  const { storageMode, setStorageMode, lastSyncedAt, isSyncing } = useAuth();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl liquid-glass-modal border border-white/20 rounded-[32px] p-5 sm:p-7 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/15">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shadow-inner">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white/95">
                مدیریت محل ذخیره‌سازی و امنیت داده‌ها
              </h3>
              <p className="text-xs text-white/60">
                انتخاب محل نگهداری و سطح رمزنگاری اطلاعات تردد و محاسبات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/60 hover:bg-white/15 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="mt-4 flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs backdrop-blur-md">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 flex items-start gap-2.5 p-3 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs backdrop-blur-md">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Storage Mode Selection Cards */}
        <div className="mt-5 space-y-3.5">
          <p className="text-xs font-semibold text-white/80">
            محل ذخیره‌سازی داده‌های تردد، مرخصی و شیفت‌های کاری:
          </p>

          {/* Option 1: Local Browser Only */}
          <div
            onClick={() => handleModeChange('local')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all relative backdrop-blur-md ${
              storageMode === 'local'
                ? 'bg-indigo-500/20 border-indigo-400/60 shadow-xl shadow-indigo-500/10'
                : 'bg-white/[0.04] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    storageMode === 'local'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-white/10 text-white/60'
                  }`}
                >
                  <Laptop className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white/95">
                      ذخیره‌سازی محلی (فقط روی این دستگاه)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/70 border border-white/15">
                      خصوصی و آفلاین
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">
                    اطلاعات تردد، ساعات کاری و مرخصی‌ها به صورت محرمانه تنها در حافظه مرورگر این دستگاه ذخیره می‌شوند و هیچ دیتایی به خارج ارسال نمی‌گردد.
                  </p>
                </div>
              </div>
              <div className="shrink-0 pt-1">
                <div
                  className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                    storageMode === 'local'
                      ? 'border-indigo-400 bg-indigo-500 text-white shadow-sm'
                      : 'border-white/30 bg-transparent'
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
            className={`cursor-pointer p-4 rounded-2xl border transition-all relative backdrop-blur-md ${
              storageMode === 'cloud_encrypted'
                ? 'bg-cyan-500/20 border-cyan-400/60 shadow-xl shadow-cyan-500/10'
                : 'bg-white/[0.04] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    storageMode === 'cloud_encrypted'
                      ? 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/30'
                      : 'bg-white/10 text-white/60'
                  }`}
                >
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white/95">
                      همگام‌سازی ابری با رمزنگاری پیشرفته (AES-256)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      رمزنگاری سراسری
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">
                    تمامی اطلاعات تردد، مرخصی و تنظیمات پیش از ارسال، با کلید ۲۵۶ بیتی اختصاصی بر روی همین مرورگر رمزگذاری شده و بر روی سرور ایمن نگهداری می‌شوند. حتی مدیر سرور نیز قادر به خواندن داده‌های شما نخواهد بود.
                  </p>
                </div>
              </div>
              <div className="shrink-0 pt-1">
                <div
                  className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                    storageMode === 'cloud_encrypted'
                      ? 'border-cyan-400 bg-cyan-500 text-white shadow-sm'
                      : 'border-white/30 bg-transparent'
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
          <div className="mt-5 p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-white/70">
                <Server className="h-4 w-4 text-cyan-300" />
                <span>وضعیت ارتباط با سرور:</span>
                <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  سرور مرکزی فعال و متصل
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
              <span className="text-white/60">آخرین همگام‌سازی ابری:</span>
              <span className="text-white/95 font-mono text-[11px]">
                {formatLastSync(lastSyncedAt)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="liquid-pill-btn-primary flex items-center justify-center gap-2 py-2.5 text-xs font-semibold disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>همگام‌سازی دستی اکنون</span>
              </button>

              <button
                type="button"
                onClick={handleManualPull}
                disabled={isSyncing}
                className="liquid-pill-btn flex items-center justify-center gap-2 py-2.5 text-xs font-semibold disabled:opacity-50"
              >
                <Cloud className="h-4 w-4 text-cyan-300" />
                <span>بازیابی از نسخه ابری</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="liquid-pill-btn px-6 py-2.5 text-xs font-semibold"
          >
            تأیید و بستن
          </button>
        </div>
      </div>
    </div>
  );
};
