import React, { useState } from 'react';
import { AlertTriangle, Download, UploadCloud, Clock, X, Cloud } from 'lucide-react';
import { useFocusTrap } from '../utils/useFocusTrap';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdoptCloud: () => Promise<void>;
  onOverwriteCloud: () => Promise<void>;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
  onAdoptCloud,
  onOverwriteCloud,
}) => {
  const modalRef = useFocusTrap(isOpen, onClose);
  const [actionLoading, setActionLoading] = useState<'adopt' | 'overwrite' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdopt = async () => {
    setActionLoading('adopt');
    setErrorMsg(null);
    try {
      await onAdoptCloud();
      onClose();
    } catch (err: any) {
      console.error('Adopt cloud error:', err);
      setErrorMsg(err?.message || 'خطا در بارگذاری داده‌های سرور ابری.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOverwrite = async () => {
    setActionLoading('overwrite');
    setErrorMsg(null);
    try {
      await onOverwriteCloud();
      onClose();
    } catch (err: any) {
      console.error('Overwrite cloud error:', err);
      setErrorMsg(err?.message || 'خطا در ذخیره‌سازی داده‌ها روی سرور.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      aria-modal="true"
      role="dialog"
      aria-labelledby="conflict-modal-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-6 text-slate-800 dark:text-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-700/50 rounded-xl text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 id="conflict-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
                تعارض در همگام‌سازی ابری
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                نسخه‌ی داده‌ها همخوان نیست
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="بستن"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message body */}
        <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-xl text-sm leading-relaxed text-amber-900 dark:text-amber-200">
          <p className="font-medium">روی دستگاه دیگری داده‌ی جدیدتری ذخیره شده است.</p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1.5">
            برای پیشگیری از بازنویسی ناخواسته، تعیین کنید کدام نسخه معتبر است.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* Action Options */}
        <div className="space-y-3">
          {/* Option A: Adopt Cloud */}
          <button
            type="button"
            disabled={actionLoading !== null}
            onClick={handleAdopt}
            className="w-full text-right p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-900/50 transition-all flex items-start gap-3.5 group cursor-pointer disabled:opacity-50"
          >
            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 group-hover:scale-105 transition-transform shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-2">
                <span>استفاده از داده‌ی ابری</span>
                {actionLoading === 'adopt' && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-normal">در حال دریافت...</span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                داده‌های جدیدتر از سرور دریافت و جایگزین می‌شوند. پیش از جایگزینی، یک فایل پشتیبان JSON از داده‌های این دستگاه به‌صورت خودکار دانلود می‌شود.
              </p>
            </div>
          </button>

          {/* Option B: Overwrite Cloud */}
          <button
            type="button"
            disabled={actionLoading !== null}
            onClick={handleOverwrite}
            className="w-full text-right p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-start gap-3.5 group cursor-pointer disabled:opacity-50"
          >
            <div className="p-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 group-hover:scale-105 transition-transform shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>جایگزینی داده‌ی ابری با داده‌ی این دستگاه</span>
                {actionLoading === 'overwrite' && (
                  <span className="text-xs text-slate-500 font-normal">در حال ذخیره...</span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                نسخه‌ی این دستگاه روی سرور ذخیره شده و داده‌های دستگاه دیگر بازنویسی خواهند شد.
              </p>
            </div>
          </button>
        </div>

        {/* Footer / Option C: Later */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>بعداً</span>
          </button>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Cloud className="w-3.5 h-3.5" />
            <span>همگام‌سازی تا تصمیم شما متوقف می‌ماند</span>
          </span>
        </div>
      </div>
    </div>
  );
};
