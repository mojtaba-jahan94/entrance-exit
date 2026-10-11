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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-xl bg-[#09090d] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl text-white max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#eca8d6]/10 text-[#eca8d6] border border-[#eca8d6]/20 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white font-mono">
                مدیریت فضای ذخیره‌سازی و امنیت ابری
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                انتخاب محل نگهداری و معماری رمزنگاری داده‌ها
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="mt-4 flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 flex items-start gap-2.5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Storage Mode Selection Cards */}
        <div className="mt-5 space-y-3 font-mono">
          <p className="text-xs text-zinc-400">
            محل ذخیره‌سازی داده‌های تردد، مرخصی و شیفت‌های کاری:
          </p>

          {/* Option 1: Local Browser Only */}
          <div
            onClick={() => handleModeChange('local')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all relative ${
              storageMode === 'local'
                ? 'bg-[#eca8d6]/10 border-[#eca8d6]/50 shadow-[0_0_20px_rgba(236,168,214,0.15)]'
                : 'bg-[#0c0d14] border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${
                    storageMode === 'local'
                      ? 'bg-[#eca8d6] text-[#050507]'
                      : 'bg-white/5 text-zinc-400'
                  }`}
                >
                  <Laptop className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">
                      ذخیره‌سازی محلی (فقط روی این دستگاه)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-zinc-400 border border-white/10">
                      آفلاین
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    اطلاعات تردد، ساعات کاری و مرخصی‌ها به صورت محرمانه تنها در حافظه مرورگر این دستگاه ذخیره می‌شوند و هیچ دیتایی ارسال نمی‌گردد.
                  </p>
                </div>
              </div>
              <div className="shrink-0 pt-1">
                <div
                  className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                    storageMode === 'local'
                      ? 'border-[#eca8d6] bg-[#eca8d6] text-[#050507]'
                      : 'border-white/20 bg-transparent'
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
                ? 'bg-[#eca8d6]/10 border-[#eca8d6]/50 shadow-[0_0_20px_rgba(236,168,214,0.15)]'
                : 'bg-[#0c0d14] border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${
                    storageMode === 'cloud_encrypted'
                      ? 'bg-[#eca8d6] text-[#050507]'
                      : 'bg-white/5 text-zinc-400'
                  }`}
                >
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">
                      همگام‌سازی ابری با رمزنگاری پیشرفته (AES-256)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      رمزنگاری سراسری
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    تمامی اطلاعات پیش از ارسال، با کلید ۲۵۶ بیتی اختصاصی رمزگذاری شده و بر روی سرور ایمن نگهداری می‌شوند.
                  </p>
                </div>
              </div>
              <div className="shrink-0 pt-1">
                <div
                  className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                    storageMode === 'cloud_encrypted'
                      ? 'border-[#eca8d6] bg-[#eca8d6] text-[#050507]'
                      : 'border-white/20 bg-transparent'
                  }`}
                >
                  {storageMode === 'cloud_encrypted' && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Controls */}
        {storageMode === 'cloud_encrypted' && (
          <div className="mt-5 p-4 rounded-2xl bg-[#0c0d14] border border-white/10 space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-zinc-400">
                <Server className="h-4 w-4 text-[#eca8d6]" />
                <span>وضعیت ارتباط با سرور:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  سرور مرکزی متصل
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
              <span className="text-zinc-500">آخرین همگام‌سازی ابری:</span>
              <span className="text-zinc-300 text-[11px]">
                {formatLastSync(lastSyncedAt)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#eca8d6] hover:bg-[#e491cc] text-[#050507] text-xs font-bold transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>همگام‌سازی دستی اکنون</span>
              </button>

              <button
                type="button"
                onClick={handleManualPull}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-all disabled:opacity-50"
              >
                <Cloud className="h-4 w-4 text-[#eca8d6]" />
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
            className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition-colors"
          >
            تأیید و بستن
          </button>
        </div>
      </div>
    </div>
  );
};
