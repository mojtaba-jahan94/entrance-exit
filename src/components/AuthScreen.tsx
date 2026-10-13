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
import { LiquidMeshBackground } from './LiquidMeshBackground';
import { LiquidGlassCard } from './LiquidGlassCard';

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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 text-[var(--text-main)] overflow-hidden font-sans">
      {/* 1. Dynamic Fluid Mesh Background Engine */}
      <LiquidMeshBackground />

      <div className="relative w-full max-w-md mx-auto z-10">
        {/* Brand / Logo Section */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-[24px] bg-[var(--surface-2)] text-[var(--accent)] shadow-xl border border-[var(--border-strong)] mb-4 animate-in zoom-in-95 duration-500">
            <CalendarClock className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)] mb-1.5">
            سامانه یکپارچه مدیریت کارکرد و تردد
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            احراز هویت امن با استانداردهای نوین حفاظت از اطلاعات
          </p>
        </div>

        {/* Server Status Ribbon */}
        <div className="mb-4 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-medium backdrop-blur-md shadow-sm">
            <Server className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span className="text-muted">وضعیت سامانه:</span>
            {dbStatus === 'connected' && (
              <span className="flex items-center gap-1.5 text-[var(--semantic-success)] font-semibold">
                <span className="h-2 w-2 rounded-full bg-[var(--semantic-success)] animate-pulse" />
                سرور مرکزی فعال و متصل
              </span>
            )}
            {dbStatus === 'not_configured' && (
              <span className="flex items-center gap-1.5 text-[var(--semantic-warning)] font-semibold" title="پایگاه داده سرور در انتظار پیکربندی است">
                <span className="h-2 w-2 rounded-full bg-[var(--semantic-warning)]" />
                در انتظار راه‌اندازی سرور مرکزی
              </span>
            )}
            {dbStatus === 'error' && (
              <span className="flex items-center gap-1.5 text-[var(--semantic-danger)] font-semibold">
                <span className="h-2 w-2 rounded-full bg-[var(--semantic-danger)]" />
                عدم اتصال به سرور مرکزی
              </span>
            )}
            {dbStatus === 'checking' && (
              <span className="flex items-center gap-1.5 text-muted">
                <span className="h-2 w-2 rounded-full bg-muted animate-ping" />
                بررسی وضعیت اتصال...
              </span>
            )}
          </div>
        </div>

        {/* Auth Card */}
        <LiquidGlassCard
          className="rounded-[34px] p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] mb-6 backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                mode === 'login'
                  ? 'liquid-pill-btn-primary shadow-lg'
                  : 'text-muted hover:text-[var(--text-main)]'
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
              className={`flex items-center justify-center gap-2 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                mode === 'register'
                  ? 'liquid-pill-btn-primary shadow-lg'
                  : 'text-muted hover:text-[var(--text-main)]'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              <span>ثبت‌نام جدید</span>
            </button>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 p-3 rounded-2xl bg-[var(--semantic-danger)]/10 border border-[var(--semantic-danger)]/30 text-[var(--semantic-danger)] text-xs backdrop-blur-md">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 p-3 rounded-2xl bg-[var(--semantic-success)]/10 border border-[var(--semantic-success)]/30 text-[var(--semantic-success)] text-xs backdrop-blur-md">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
                  نام و نام خانوادگی
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-muted">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="مثال: علی احمدی"
                    required
                    className="liquid-input w-full pr-10 pl-3.5 py-2.5 text-sm text-[var(--text-main)] placeholder:text-muted"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
                نام کاربری
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-muted">
                  <UserIcon className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: user_admin"
                  dir="ltr"
                  required
                  className="liquid-input w-full pr-10 pl-3.5 py-2.5 text-sm text-[var(--text-main)] placeholder:text-muted font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
                رمز عبور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-muted">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="حداقل ۶ کاراکتر"
                  dir="ltr"
                  required
                  className="liquid-input w-full pr-10 pl-10 py-2.5 text-sm text-[var(--text-main)] placeholder:text-muted font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted hover:text-[var(--text-main)] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
                  تکرار رمز عبور
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-muted">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="تکرار همان رمز عبور"
                    dir="ltr"
                    required
                    className="liquid-input w-full pr-10 pl-3.5 py-2.5 text-sm text-[var(--text-main)] placeholder:text-muted font-mono"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="liquid-pill-btn-primary w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold shadow-xl disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-[var(--accent-contrast)]/30 border-t-[var(--accent-contrast)] animate-spin" />
                  <span>در حال اعتبارسنجی و اتصال به سرور...</span>
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
          <div className="mt-6 pt-5 border-t border-[var(--border)] flex items-start gap-2.5 text-[11px] text-muted leading-relaxed">
            <ShieldCheck className="h-4 w-4 text-[var(--semantic-success)] shrink-0 mt-0.5" />
            <span>
              امنیت کامل اطلاعات: کلمات عبور با الگوریتم‌های استاندارد چندمرحله‌ای رمزنگاری شده و نشست‌های کاربری به صورت امن محافظت می‌شوند. در این سامانه می‌توانید اطلاعات تردد خود را به صورت محرمانه روی مرورگر ذخیره کنید یا همگام‌سازی ابری رمزنگاری‌شده (AES-256) را فعال نمایید.
            </span>
          </div>
        </LiquidGlassCard>
      </div>
    </div>
  );
};
