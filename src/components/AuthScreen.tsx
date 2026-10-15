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
        setSuccessMsg('ثبت‌نام با موفقیت انجام شد! در حال ورود به سامانه...');
      } catch (err: any) {
        setErrorMsg(err.message || 'خطا در ثبت‌نام کاربر.');
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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#F7F7F2] text-[#1F2933] overflow-hidden font-sans">
      {/* Background glowing ambiance */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[#A68A64]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-[#6B7280]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md mx-auto z-10">
        {/* Brand / Logo Section */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[#A68A64] text-white shadow-md shadow-[#A68A64]/20 ring-1 ring-[#A68A64]/30 mb-4 animate-in zoom-in-95 duration-500">
            <CalendarClock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1F2933] mb-1">
            سامانه یکپارچه مدیریت کارکرد و تردد
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            احراز هویت امن با استانداردهای نوین حفاظت از اطلاعات
          </p>
        </div>

        {/* Server Status Ribbon */}
        <div className="mb-4 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#D1D5DB] text-[11px] font-medium shadow-sm">
            <Server className="h-3.5 w-3.5 text-[#A68A64]" />
            <span className="text-[#6B7280]">وضعیت سرور:</span>
            {dbStatus === 'connected' && (
              <span className="flex items-center gap-1.5 text-[#2E6F40] font-semibold">
                <span className="h-2 w-2 rounded-full bg-[#2E6F40] animate-pulse" />
                سرور مرکزی متصل
              </span>
            )}
            {dbStatus === 'not_configured' && (
              <span className="flex items-center gap-1.5 text-[#D97706] font-semibold">
                <span className="h-2 w-2 rounded-full bg-[#D97706]" />
                در انتظار پیکربندی سرور
              </span>
            )}
            {dbStatus === 'error' && (
              <span className="flex items-center gap-1.5 text-[#B91C1C] font-semibold">
                <span className="h-2 w-2 rounded-full bg-[#B91C1C]" />
                عدم اتصال به سرور مرکزی
              </span>
            )}
            {dbStatus === 'checking' && (
              <span className="flex items-center gap-1.5 text-[#6B7280]">
                <span className="h-2 w-2 rounded-full bg-[#6B7280] animate-ping" />
                بررسی وضعیت اتصال...
              </span>
            )}
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-[#D1D5DB] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#F7F7F2] border border-[#D1D5DB] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                mode === 'login'
                  ? 'bg-[#A68A64] text-white shadow-sm'
                  : 'text-[#6B7280] hover:text-[#1F2933]'
              }`}
            >
              <LogIn className="h-4 w-4" />
              <span>ورود به حساب</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                mode === 'register'
                  ? 'bg-[#A68A64] text-white shadow-sm'
                  : 'text-[#6B7280] hover:text-[#1F2933]'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              <span>ثبت‌نام جدید</span>
            </button>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-[#FEF2F2] border border-[#B91C1C]/30 text-[#B91C1C] text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-[#F0FDF4] border border-[#2E6F40]/30 text-[#2E6F40] text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-[#1F2933] mb-1.5">
                  نام و نام خانوادگی
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#6B7280]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="مثال: علی احمدی"
                    required
                    className="w-full rounded-xl bg-[#F7F7F2] border border-[#D1D5DB] pr-10 pl-3.5 py-2.5 text-sm text-[#1F2933] placeholder-[#6B7280]/60 focus:outline-none focus:ring-1 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#1F2933] mb-1.5">
                نام کاربری
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#6B7280]">
                  <UserIcon className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: user_admin"
                  dir="ltr"
                  required
                  className="w-full rounded-xl bg-[#F7F7F2] border border-[#D1D5DB] pr-10 pl-3.5 py-2.5 text-sm text-[#1F2933] placeholder-[#6B7280]/60 focus:outline-none focus:ring-1 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2933] mb-1.5">
                رمز عبور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#6B7280]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="حداقل ۶ کاراکتر"
                  dir="ltr"
                  required
                  className="w-full rounded-xl bg-[#F7F7F2] border border-[#D1D5DB] pr-10 pl-10 py-2.5 text-sm text-[#1F2933] placeholder-[#6B7280]/60 focus:outline-none focus:ring-1 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#6B7280] hover:text-[#1F2933] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-[#1F2933] mb-1.5">
                  تکرار رمز عبور
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#6B7280]">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="تکرار همان رمز عبور"
                    dir="ltr"
                    required
                    className="w-full rounded-xl bg-[#F7F7F2] border border-[#D1D5DB] pr-10 pl-3.5 py-2.5 text-sm text-[#1F2933] placeholder-[#6B7280]/60 focus:outline-none focus:ring-1 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all font-mono"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#A68A64] hover:bg-[#8F7553] text-white py-3 px-4 text-sm font-bold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>در حال اعتبارسنجی و ورود...</span>
                </div>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>ورود امن به سامانه</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>ثبت‌نام و ایجاد حساب کاربری</span>
                </>
              )}
            </button>
          </form>

          {/* Security details footnote */}
          <div className="mt-6 pt-5 border-t border-[#D1D5DB] flex items-start gap-2.5 text-[11px] text-[#6B7280] leading-relaxed">
            <ShieldCheck className="h-4 w-4 text-[#2E6F40] shrink-0 mt-0.5" />
            <span>
              امنیت کامل اطلاعات: نشست‌های کاربری با استانداردهای رمزنگاری محافظت می‌شوند. داده‌ها در مرورگر اختصاصی شما نگهداری شده و امکان فعال‌سازی پشتیبان‌گیری ابری نیز مهیا است.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
