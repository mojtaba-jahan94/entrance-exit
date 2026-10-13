import React, { useState } from 'react';
import { X, KeyRound, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFocusTrap } from '../utils/useFocusTrap';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useFocusTrap(isOpen, onClose);
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword) {
      setErrorMsg('لطفاً رمز عبور فعلی را وارد کنید.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('رمز عبور جدید با تکرار آن همخوانی ندارد.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccessMsg('رمز عبور شما با موفقیت به‌روزرسانی شد.');
      setTimeout(() => {
        onClose();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در تغییر کلمه عبور.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-modal-title"
        className="relative w-full max-w-md liquid-glass-modal border border-[var(--border)] rounded-[32px] p-6 shadow-2xl text-[var(--text-main)]"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border)] shadow-inner">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 id="change-password-modal-title" className="font-bold text-sm sm:text-base text-[var(--text-main)]">تغییر کلمه عبور امن</h3>
              <p className="text-xs text-muted">به‌روزرسانی امن کلمه عبور در سرور مرکزی</p>
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

        {errorMsg && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-2xl bg-[var(--semantic-danger)]/10 border border-[var(--semantic-danger)]/30 text-[var(--semantic-danger)] text-xs backdrop-blur-md">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-2xl bg-[var(--semantic-success)]/10 border border-[var(--semantic-success)]/30 text-[var(--semantic-success)] text-xs backdrop-blur-md">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
              رمز عبور فعلی
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              dir="ltr"
              placeholder="••••••••"
              className="liquid-input w-full px-3.5 py-2.5 text-sm text-[var(--text-main)] placeholder:text-muted font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
              رمز عبور جدید
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              dir="ltr"
              placeholder="حداقل ۶ کاراکتر"
              className="liquid-input w-full px-3.5 py-2.5 text-sm text-[var(--text-main)] placeholder:text-muted font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
              تکرار رمز عبور جدید
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              dir="ltr"
              placeholder="تکرار رمز عبور جدید"
              className="liquid-input w-full px-3.5 py-2.5 text-sm text-[var(--text-main)] placeholder:text-muted font-mono"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="liquid-pill-btn px-4 py-2 text-xs font-semibold"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="liquid-pill-btn-primary flex items-center gap-1.5 px-5 py-2 text-xs font-bold disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-[var(--accent-contrast)]/30 border-t-[var(--accent-contrast)] animate-spin" />
                  <span>در حال ذخیره...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>به‌روزرسانی رمز عبور</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
