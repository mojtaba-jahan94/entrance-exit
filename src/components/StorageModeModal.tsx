import React, { useState } from 'react';
import {
  X,
  Cloud,
  ShieldCheck,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  Laptop,
  Check,
  Server,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StorageMode } from '../types';
import { toPersianDigits } from '../utils/jalali';
import { useFocusTrap } from '../utils/useFocusTrap';

interface StorageModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerSync: () => Promise<void>;
  onTriggerPull: () => Promise<void>;
  onOpenBackup?: () => void;
}

/**
 * Maps raw or English error strings into friendly Persian messages.
 */
function toSimplePersianError(err: any): string {
  const msg = String(err?.message || err || '');
  if (
    msg.includes('passphrase') ||
    msg.includes('decrypt') ||
    msg.includes('password') ||
    msg.includes('رمز') ||
    msg.includes('key')
  ) {
    return 'رمز عبور یا کلید رمزنگاری اشتباه است. امکان رمزگشایی و دسترسی به اطلاعات وجود ندارد.';
  }
  if (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('connect') ||
    msg.includes('اتصال') ||
    msg.includes('internet') ||
    msg.includes('Failed to fetch')
  ) {
    return 'خطا در ارتباط با سرور ابری. لطفاً اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید.';
  }
  if (msg.includes('unauthorized') || msg.includes('auth') || msg.includes('401')) {
    return 'نشست کاربری شما منقضی شده است. لطفاً یک‌بار خارج شده و دوباره وارد حساب شوید.';
  }
  return msg || 'خطایی در فرآیند همگام‌سازی رخ داده است. داده‌های شما در حافظه محلی محفوظ است.';
}

export const StorageModeModal: React.FC<StorageModeModalProps> = ({
  isOpen,
  onClose,
  onTriggerSync,
  onTriggerPull,
  onOpenBackup,
}) => {
  const modalRef = useFocusTrap(isOpen, onClose);
  const { storageMode, setStorageMode, lastSyncedAt, isSyncing } = useAuth();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Warning acknowledgment state before switching to cloud_encrypted
  const [pendingCloudActivation, setPendingCloudActivation] = useState<boolean>(false);
  const [lossAcknowledged, setLossAcknowledged] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectLocal = async () => {
    setPendingCloudActivation(false);
    setLossAcknowledged(false);
    setErrorMsg(null);
    try {
      await setStorageMode('local');
      setSuccessMsg('حالت ذخیره‌سازی محلی (فقط مرورگر) فعال شد.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(toSimplePersianError(err));
    }
  };

  const handleSelectCloudCard = () => {
    if (storageMode === 'cloud_encrypted') {
      return; // Already active
    }
    setErrorMsg(null);
    setPendingCloudActivation(true);
  };

  const handleConfirmActivateCloud = async () => {
    if (!lossAcknowledged) return;
    setErrorMsg(null);
    try {
      await setStorageMode('cloud_encrypted');
      setPendingCloudActivation(false);
      setLossAcknowledged(false);
      setSuccessMsg('حالت همگام‌سازی ابری با رمزنگاری پیشرفته فعال شد.');
      await onTriggerSync();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(toSimplePersianError(err));
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
      setErrorMsg(toSimplePersianError(err));
    }
  };

  const handleManualPull = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (
      !window.confirm(
        'آیا مایلید اطلاعات ذخیره‌شده در سرور ابری رمزگشایی و در این مرورگر بارگذاری شوند؟'
      )
    ) {
      return;
    }
    try {
      await onTriggerPull();
      setSuccessMsg('اطلاعات با موفقیت از سرور ابری بارگذاری و رمزگشایی شدند.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(toSimplePersianError(err));
    }
  };

  const formatLastSync = (isoStr: string | null) => {
    if (!isoStr) return 'تاکنون همگام‌سازی نشده است';
    try {
      const d = new Date(isoStr);
      return (
        toPersianDigits(
          d.toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        ) +
        ' (' +
        toPersianDigits(d.toLocaleDateString('fa-IR')) +
        ')'
      );
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="storage-mode-modal-title"
        className="relative w-full max-w-xl liquid-glass-modal border border-[var(--border)] rounded-[32px] p-5 sm:p-7 shadow-2xl text-[var(--text-main)] max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border)] shadow-inner">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 id="storage-mode-modal-title" className="font-bold text-base sm:text-lg text-[var(--text-main)]">
                مدیریت محل ذخیره‌سازی و امنیت داده‌ها
              </h3>
              <p className="text-xs text-muted">
                انتخاب محل نگهداری و سطح رمزنگاری اطلاعات تردد و محاسبات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="بستن پنجره"
            className="rounded-full p-2 text-muted hover:bg-[var(--surface-2)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 flex items-start gap-2.5 p-3 rounded-2xl bg-[var(--semantic-success)]/10 border border-[var(--semantic-success)]/30 text-[var(--semantic-success)] text-xs backdrop-blur-md"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 p-3 rounded-2xl bg-[var(--semantic-danger)]/10 border border-[var(--semantic-danger)]/30 text-[var(--semantic-danger)] text-xs backdrop-blur-md"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Storage Mode Selection Cards */}
        <div className="mt-5 space-y-3.5">
          <p className="text-xs font-semibold text-[var(--text-main)]">
            محل ذخیره‌سازی داده‌های تردد، مرخصی و شیفت‌های کاری:
          </p>

          {/* Option 1: Local Browser Only */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleSelectLocal}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectLocal();
              }
            }}
            aria-pressed={storageMode === 'local'}
            className={`cursor-pointer p-4 rounded-2xl border transition-all relative backdrop-blur-md ${
              storageMode === 'local'
                ? 'bg-[var(--surface-2)] border-[var(--border-strong)] shadow-md'
                : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    storageMode === 'local'
                      ? 'bg-[var(--accent)] text-[var(--bg)] shadow-md'
                      : 'bg-[var(--surface-2)] text-muted'
                  }`}
                >
                  <Laptop className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text-main)]">
                      ذخیره‌سازی محلی (فقط روی این دستگاه)
                    </span>
                    <span className="badge-neutral text-[10px] px-2 py-0.5 rounded-full">
                      خصوصی و آفلاین
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    اطلاعات تردد، ساعات کاری و مرخصی‌ها به صورت محرمانه تنها در حافظه مرورگر این دستگاه ذخیره می‌شوند و هیچ دیتایی به خارج ارسال نمی‌گردد.
                  </p>
                </div>
              </div>
              <div className="shrink-0 pt-1">
                <div
                  className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                    storageMode === 'local'
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)] shadow-sm'
                      : 'border-[var(--border-strong)] bg-transparent'
                  }`}
                >
                  {storageMode === 'local' && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
            </div>
          </div>

          {/* Option 2: Cloud Sync with AES-256 Encryption */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleSelectCloudCard}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectCloudCard();
              }
            }}
            aria-pressed={storageMode === 'cloud_encrypted'}
            className={`cursor-pointer p-4 rounded-2xl border transition-all relative backdrop-blur-md ${
              storageMode === 'cloud_encrypted'
                ? 'bg-[var(--surface-2)] border-[var(--border-strong)] shadow-md'
                : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    storageMode === 'cloud_encrypted'
                      ? 'bg-[var(--accent)] text-[var(--bg)] shadow-md'
                      : 'bg-[var(--surface-2)] text-muted'
                  }`}
                >
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text-main)]">
                      همگام‌سازی ابری با رمزنگاری پیشرفته (AES-256)
                    </span>
                    <span className="badge-success text-[10px] px-2 py-0.5 rounded-full">
                      رمزنگاری سراسری
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    تمامی اطلاعات تردد، مرخصی و تنظیمات پیش از ارسال، با کلید ۲۵۶ بیتی اختصاصی بر روی همین مرورگر رمزگذاری شده و بر روی سرور ایمن نگهداری می‌شوند. حتی مدیر سرور نیز قادر به خواندن داده‌های شما نخواهد بود.
                  </p>
                </div>
              </div>
              <div className="shrink-0 pt-1">
                <div
                  className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                    storageMode === 'cloud_encrypted'
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)] shadow-sm'
                      : 'border-[var(--border-strong)] bg-transparent'
                  }`}
                >
                  {storageMode === 'cloud_encrypted' && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* Warning Card before activation */}
            {pendingCloudActivation && storageMode !== 'cloud_encrypted' && (
              <div
                role="region"
                aria-label="هشدار مهم رمزنگاری ابری"
                onClick={(e) => e.stopPropagation()}
                className="mt-4 p-4 rounded-2xl bg-[var(--semantic-warning)]/10 border border-[var(--semantic-warning)]/30 text-[var(--text-main)] text-xs space-y-3.5 backdrop-blur-lg animate-in fade-in duration-200"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-[var(--semantic-warning)] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-[var(--semantic-warning)]">
                      هشدار امنیتی بسیار مهم قبل از فعال‌سازی:
                    </h4>
                    <p className="text-[var(--text-main)]/90 leading-relaxed text-[11px] sm:text-xs">
                      داده‌های شما پیش از ارسال با کلید مشتق‌شده از رمز عبورتان رمزنگاری می‌شوند.
                      {' '}
                      <strong className="text-[var(--text-main)] font-bold">
                        در صورتی که کلید یا رمز عبور حساب خود را فراموش یا گم کنید، داده‌های ابری به هیچ عنوان قابل بازیابی یا رمزگشایی نخواهند بود
                      </strong>
                      {' '}
                      و هیچ فردی (حتی پشتیبانی و مدیر سرور) امکان بازگردانی داده‌های شما را نخواهد داشت.
                    </p>
                  </div>
                </div>

                {/* Recommendation & Backup Shortcut Button */}
                <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-[11px] text-muted">
                    پیشنهاد امنیتی: توصیه می‌شود ابتدا یک نسخه پشتیبان آفلاین JSON از داده‌های فعلی خود دریافت نمایید.
                  </span>
                  {onOpenBackup && (
                    <button
                      type="button"
                      onClick={onOpenBackup}
                      className="liquid-pill-btn shrink-0 text-[var(--accent)] border-[var(--border-strong)] px-3 py-1.5 text-xs font-bold hover:bg-[var(--surface-2)] transition-all flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>ابتدا پشتیبان JSON بگیر</span>
                    </button>
                  )}
                </div>

                {/* Mandatory Confirmation Checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer pt-1 select-none">
                  <input
                    type="checkbox"
                    checked={lossAcknowledged}
                    onChange={(e) => setLossAcknowledged(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[var(--border-strong)] bg-[var(--surface)] text-[var(--accent)] focus:ring-[var(--focus)] cursor-pointer"
                  />
                  <span className="text-xs text-[var(--text-main)] font-medium leading-relaxed">
                    متوجه شدم و می‌دانم در صورت گم شدن رمز عبور، اطلاعات ابری به هیچ وجه قابل بازیابی نیست.
                  </span>
                </label>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--semantic-warning)]/20">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingCloudActivation(false);
                      setLossAcknowledged(false);
                    }}
                    className="liquid-pill-btn px-3 py-1.5 text-xs font-semibold text-muted hover:text-[var(--text-main)]"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    disabled={!lossAcknowledged}
                    onClick={handleConfirmActivateCloud}
                    className="liquid-pill-btn-primary px-4 py-2 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                  >
                    فعال‌سازی همگام‌سازی ابری رمزنگاری‌شده
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sync Controls (Visible when Cloud Sync is active) */}
        {storageMode === 'cloud_encrypted' && (
          <div className="mt-5 p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-muted">
                <Server className="h-4 w-4 text-[var(--accent)]" />
                <span>وضعیت ارتباط با سرور:</span>
                <span className="text-[var(--semantic-success)] font-semibold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[var(--semantic-success)] animate-pulse" />
                  سرور مرکزی فعال و متصل
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border)]">
              <span className="text-muted">آخرین همگام‌سازی ابری:</span>
              <span className="text-[var(--text-main)] font-mono text-[11px]">
                {formatLastSync(lastSyncedAt)}
              </span>
            </div>

            {/* Security Backup Shortcut */}
            {onOpenBackup && (
              <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs">
                <span className="text-muted">پشتیبان‌گیری محلی از نسخه فعلی:</span>
                <button
                  type="button"
                  onClick={onOpenBackup}
                  className="liquid-pill-btn text-[var(--accent)] border-[var(--border-strong)] px-3 py-1 text-[11px] font-semibold flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  <span>پشتیبان‌گیری JSON</span>
                </button>
              </div>
            )}

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
                <Cloud className="h-4 w-4 text-[var(--accent)]" />
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
