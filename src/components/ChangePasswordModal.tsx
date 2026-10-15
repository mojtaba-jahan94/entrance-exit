import React, { useState } from 'react';
import { X, KeyRound, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2933]/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-[#D1D5DB] rounded-3xl p-6 shadow-2xl text-[#1F2933]">
        <div className="flex items-center justify-between pb-4 border-b border-[#D1D5DB]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#F5F0E6] text-[#A68A64] border border-[#A68A64]/30">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#1F2933]">تغییر کلمه عبور ورود</h3>
              <p className="text-xs text-[#6B7280]">به‌روزرسانی امن کلمه عبور در سامانه</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1F2933] hover:bg-[#F7F7F2] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-[#FEF2F2] border border-[#B91C1C]/30 text-[#B91C1C] text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-[#F0FDF4] border border-[#2E6F40]/30 text-[#2E6F40] text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1F2933] mb-1.5">
              رمز عبور فعلی
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              dir="ltr"
              placeholder="••••••••"
              className="w-full rounded-xl bg-[#F7F7F2] border border-[#D1D5DB] px-3.5 py-2.5 text-sm text-[#1F2933] placeholder-[#6B7280]/60 focus:outline-none focus:ring-1 focus:ring-[#A68A64] focus:border-[#A68A64] font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F2933] mb-1.5">
              رمز عبور جدید
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              dir="ltr"
              placeholder="حداقل ۶ کاراکتر"
              className="w-full rounded-xl bg-[#F7F7F2] border border-[#D1D5DB] px-3.5 py-2.5 text-sm text-[#1F2933] placeholder-[#6B7280]/60 focus:outline-none focus:ring-1 focus:ring-[#A68A64] focus:border-[#A68A64] font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F2933] mb-1.5">
              تکرار رمز عبور جدید
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              dir="ltr"
              placeholder="تکرار همان رمز عبور جدید"
              className="w-full rounded-xl bg-[#F7F7F2] border border-[#D1D5DB] px-3.5 py-2.5 text-sm text-[#1F2933] placeholder-[#6B7280]/60 focus:outline-none focus:ring-1 focus:ring-[#A68A64] focus:border-[#A68A64] font-mono"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#D1D5DB] bg-white text-xs font-semibold text-[#6B7280] hover:text-[#1F2933] hover:bg-[#F7F7F2] transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#A68A64] hover:bg-[#8F7553] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>در حال ذخیره...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>ذخیره رمز جدید</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
