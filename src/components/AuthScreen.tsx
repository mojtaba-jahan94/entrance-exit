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
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#050507] text-white font-sans bg-grid-compute relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#eca8d6]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-96 h-96 bg-[#c597eb]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md mx-auto z-10 py-8">
        {/* Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-mono tracking-widest text-[#eca8d6] bg-[#eca8d6]/10 border border-[#eca8d6]/20 uppercase mb-4 shadow-[0_0_15px_rgba(236,168,214,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#eca8d6] animate-pulse" />
            <span>COMPUTE.11 // AUTH PROTOCOL</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-2">
            ورود به سامانه <span className="text-[#eca8d6] font-medium">تردد و کارکرد</span>
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            محاسبه دقیق شیفت‌های کاری، شناوری اداری و کاردکس مرخصی
          </p>
        </div>

        {/* Server Status Ribbon */}
        <div className="mb-6 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-zinc-400">
            <Server className="h-3.5 w-3.5 text-zinc-500" />
            <span>پایگاه داده محلی:</span>
            <span
              className={`flex items-center gap-1 font-bold ${
                dbStatus === 'connected'
                  ? 'text-emerald-400'
                  : dbStatus === 'checking'
                  ? 'text-amber-400'
                  : 'text-zinc-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  dbStatus === 'connected'
                    ? 'bg-emerald-400'
                    : dbStatus === 'checking'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-zinc-500'
                }`}
              />
              {dbStatus === 'connected'
                ? 'فعال و آماده'
                : dbStatus === 'checking'
                ? 'در حال برقراری'
                : 'آفلاین محلی'}
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="relative rounded-3xl border border-white/10 bg-[#09090d]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          {/* Tabs Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 mb-6 font-mono text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-[#eca8d6] text-[#050507] font-bold shadow-[0_0_15px_rgba(236,168,214,0.3)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>ورود به حساب</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-[#eca8d6] text-[#050507] font-bold shadow-[0_0_15px_rgba(236,168,214,0.3)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>ایجاد حساب جدید</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-4 flex items-center gap-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300 font-mono animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-center gap-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-300 font-mono animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                  نام و نام خانوادگی
                </label>
                <div className="relative">
                  <UserIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="مثال: مجتبی جهان‌بخش"
                    className="w-full rounded-2xl border border-white/10 bg-[#0c0d14] pr-10 pl-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-[#eca8d6] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                نام کاربری (لاتین)
              </label>
              <div className="relative">
                <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  dir="ltr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or user"
                  className="w-full rounded-2xl border border-white/10 bg-[#0c0d14] pr-10 pl-4 py-3 text-sm font-mono text-white placeholder-zinc-600 focus:border-[#eca8d6] focus:outline-none transition-colors text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                رمز عبور
              </label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/10 bg-[#0c0d14] pr-10 pl-11 py-3 text-sm font-mono text-white placeholder-zinc-600 focus:border-[#eca8d6] focus:outline-none transition-colors text-right"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                  تکرار رمز عبور
                </label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-white/10 bg-[#0c0d14] pr-10 pl-4 py-3 text-sm font-mono text-white placeholder-zinc-600 focus:border-[#eca8d6] focus:outline-none transition-colors text-right"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#eca8d6] hover:bg-[#e491cc] text-[#050507] py-3.5 text-xs font-bold tracking-wide transition-all shadow-[0_0_25px_rgba(236,168,214,0.3)] active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-[#050507] border-t-transparent animate-spin" />
                  <span>در حال پردازش...</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>ورود به سیستم</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>ثبت‌نام و ورود مستقیم</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <span className="text-[11px] font-mono text-zinc-500 block">
              حساب کاربری پیش‌فرض: نام کاربری <code className="text-[#eca8d6]">admin</code> / رمز <code className="text-[#eca8d6]">admin123</code>
            </span>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-mono text-zinc-500">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>رمزنگاری بومی داده‌ها با کلید اختصاصی کاربر</span>
        </div>
      </div>
    </div>
  );
};
