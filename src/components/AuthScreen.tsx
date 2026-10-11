import React, { useState } from 'react';
import {
  CalendarClock,
  Lock,
  User as UserIcon,
  ShieldCheck,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Server,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { login, register, dbStatus, isLoading } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!username.trim()) {
      setErrorMsg('لطفاً نام کاربری را وارد کنید.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    if (mode === 'register') {
      if (!displayName.trim()) {
        setErrorMsg('لطفاً نام و نام خانوادگی خود را وارد کنید.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('رمز عبور و تکرار آن یکسان نیستند.');
        return;
      }

      try {
        await register({
          username: username.trim(),
          displayName: displayName.trim(),
          password,
        });
        setSuccessMsg('ثبت‌نام با موفقیت انجام شد! در حال انتقال...');
      } catch (err: any) {
        setErrorMsg(err.message || 'خطا در ثبت نام کاربر.');
      }
    } else {
      try {
        await login({
          username: username.trim(),
          password,
        });
      } catch (err: any) {
        setErrorMsg(err.message || 'نام کاربری یا رمز عبور اشتباه است.');
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F5F4F0] text-[#111] font-sans">
      <div className="w-full max-w-md mx-auto z-10 py-8">
        {/* Brand / Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-widest text-black/50 bg-black/[0.04] border border-black/[0.06] uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>AGENTIC SYSTEM // سامانه هوشمند تردد</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-[#111] mb-2">
            ورود به سامانه کارکرد و تردد
          </h1>
          <p className="text-xs sm:text-sm text-black/45 leading-relaxed">
            محاسبه دقیق شیفت‌های کاری، اضافه کار، تاخیر و مرخصی
          </p>
        </div>

        {/* Server Status Ribbon */}
        <div className="mb-4 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.03] border border-black/[0.06] text-[11px] font-mono text-black/60">
            <Server className="h-3.5 w-3.5 text-black/40" />
            <span>وضعیت سرور:</span>
            {dbStatus === 'connected' && (
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                متصل و فعال
              </span>
            )}
            {dbStatus === 'not_configured' && (
              <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                پایگاه داده در انتظار راه‌اندازی
              </span>
            )}
            {dbStatus === 'error' && (
              <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
                عدم اتصال
              </span>
            )}
            {dbStatus === 'checking' && (
              <span className="flex items-center gap-1.5 text-black/40">
                بررسی وضعیت...
              </span>
            )}
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-black/[0.08] rounded-2xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06),_0_2px_8px_rgba(0,0,0,0.04)]">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-black/[0.03] border border-black/[0.05] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-medium rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-[#111] text-white shadow-xs'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              ورود به حساب
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-medium rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-[#111] text-white shadow-xs'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              ثبت‌نام کاربر جدید
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-black/70 mb-1.5">
                  نام و نام خانوادگی:
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="مثال: علی احمدی"
                  className="w-full bg-white border border-black/10 rounded-xl px-3.5 py-2.5 text-xs text-[#111] placeholder:text-black/30 focus:border-black/30 focus:outline-none transition-all"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-black/70 mb-1.5">
                نام کاربری:
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="نام کاربری (حداقل ۳ حرف انگلیسی یا فارسی)"
                className="w-full bg-white border border-black/10 rounded-xl px-3.5 py-2.5 text-xs text-[#111] placeholder:text-black/30 focus:border-black/30 focus:outline-none transition-all font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-black/70 mb-1.5">
                رمز عبور:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="حداقل ۶ کاراکتر"
                  className="w-full bg-white border border-black/10 rounded-xl px-3.5 py-2.5 pl-10 text-xs text-[#111] placeholder:text-black/30 focus:border-black/30 focus:outline-none transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-black/70 mb-1.5">
                  تکرار رمز عبور:
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="تکرار همان رمز عبور"
                  className="w-full bg-white border border-black/10 rounded-xl px-3.5 py-2.5 text-xs text-[#111] placeholder:text-black/30 focus:border-black/30 focus:outline-none transition-all font-mono"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#111] text-white hover:bg-[#2c2c2c] transition-all text-xs font-medium tracking-wide shadow-xs active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>در حال پردازش...</span>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>ورود به سامانه</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>ایجاد حساب کاربری</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
