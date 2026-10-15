import React, { useRef, useState } from 'react';
import { X, Database, Download, Upload, AlertTriangle, Check } from 'lucide-react';
import { exportAllDataBackup, importDataBackup } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import { useFocusTrap } from '../utils/useFocusTrap';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: () => void;
  onResetAllData: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
  onResetAllData,
}) => {
  const modalRef = useFocusTrap(isOpen, onClose);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      exportAllDataBackup(user?.id);
      setSuccessMessage('فایل پشتیبان با موفقیت دانلود شد.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch {
      setErrorMessage('خطا در دانلود فایل پشتیبان');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importDataBackup(content, user?.id);
        if (ok) {
          setSuccessMessage('داده‌ها با موفقیت بازیابی شدند.');
          onDataRestored();
          setTimeout(() => {
            setSuccessMessage('');
            onClose();
          }, 1500);
        } else {
          setErrorMessage('فایل انتخاب‌شده نامعتبر است.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (
      window.confirm(
        'آیا از پاک‌سازی کلیه اطلاعات تردد و مرخصی‌ها مطمئن هستید؟ این عملیات غیرقابل بازگشت است!'
      )
    ) {
      onResetAllData();
      setSuccessMessage('اطلاعات با موفقیت پاک‌سازی شدند.');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="backup-modal-title"
        className="relative w-full max-w-md rounded-[32px] border border-[var(--border)] liquid-glass-modal p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-2xl bg-[var(--surface-2)] p-2.5 text-[var(--accent)] border border-[var(--border)] shadow-inner">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 id="backup-modal-title" className="text-sm sm:text-base font-bold text-[var(--text-main)]">پشتیبان‌گیری و مدیریت داده‌ها</h3>
              <p className="text-[11px] sm:text-xs text-muted">
                انتقال، دانلود و بازیابی اطلاعات تردد {user ? `(حساب ${user.displayName})` : ''}
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
        {successMessage && (
          <div className="mt-4 rounded-2xl bg-[var(--semantic-success)]/10 border border-[var(--semantic-success)]/30 p-3 text-xs text-[var(--semantic-success)] flex items-center gap-2 backdrop-blur-md">
            <Check className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 rounded-2xl bg-[var(--semantic-danger)]/10 border border-[var(--semantic-danger)]/30 p-3 text-xs text-[var(--semantic-danger)] flex items-center gap-2 backdrop-blur-md">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content */}
        <div className="mt-5 space-y-3">
          {/* Download Backup */}
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 hover:border-[var(--border-strong)] transition-all text-right group backdrop-blur-md shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[var(--surface)] p-2.5 text-[var(--accent)] border border-[var(--border)]">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--text-main)] block">دانلود نسخه پشتیبان کامل</span>
                <span className="text-[11px] text-muted block mt-0.5">
                  ذخیره کلیه ترددها، مرخصی‌ها و تنظیمات در قالب فایل JSON
                </span>
              </div>
            </div>
          </button>

          {/* Import Backup */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 hover:border-[var(--border-strong)] transition-all text-right group backdrop-blur-md shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[var(--surface)] p-2.5 text-[var(--accent)] border border-[var(--border)]">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--text-main)] block">بازیابی از فایل پشتیبان</span>
                <span className="text-[11px] text-muted block mt-0.5">
                  بارگذاری اطلاعات از فایل پشتیبان ذخیره‌شده
                </span>
              </div>
            </div>
          </button>

          {/* Reset All */}
          <div className="pt-3 border-t border-[var(--border)]">
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-between rounded-2xl border border-[var(--semantic-danger)]/30 bg-[var(--semantic-danger)]/10 p-3.5 hover:bg-[var(--semantic-danger)]/15 transition-all text-right text-[var(--semantic-danger)] backdrop-blur-md shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-[var(--semantic-danger)]" />
                <span className="text-xs font-semibold">پاک‌سازی کلیه اطلاعات این حساب و شروع مجدد</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
