import React, { useState } from 'react';
import { X, Lock, KeyRound, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-md bg-[#09090d] border border-white/10 rounded-3xl p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#eca8d6]/10 text-[#eca8d6] border border-[#eca8d6]/20 flex items-center justify-center">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white font-mono">تغییر رمز عبور امن</h3>
              <p className="text-xs text-zinc-400 font-mono">به‌روزرسانی کلید امنیتی کاربر</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 font-mono">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">
              رمز عبور فعلی
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              dir="ltr"
              placeholder="••••••••"
              className="w-full rounded-2xl bg-[#0c0d14] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#eca8d6] text-right"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">
              رمز عبور جدید
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              dir="ltr"
              placeholder="حداقل ۶ کاراکتر"
              className="w-full rounded-2xl bg-[#0c0d14] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#eca8d6] text-right"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">
              تکرار رمز عبور جدید
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              dir="ltr"
              placeholder="تکرار رمز عبور جدید"
              className="w-full rounded-2xl bg-[#0c0d14] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#eca8d6] text-right"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#eca8d6] hover:bg-[#e491cc] text-[#050507] text-xs font-bold shadow-[0_0_15px_rgba(236,168,214,0.3)] transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-[#050507] border-t-transparent animate-spin" />
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
