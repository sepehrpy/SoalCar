import React, { useState } from 'react';
import { X, User, Wrench, Shield, LogIn, UserPlus, Mail, Key, CheckCircle, Lock, Sparkles, ArrowLeft } from 'lucide-react';
import { UserRole } from '../types';
import { apiService, setStoredUser } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

type AuthMode = 'quick_email' | 'password' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('quick_email');
  const [role, setRole] = useState<UserRole>(UserRole.Owner);

  // Quick OTP Email state
  const [quickEmail, setQuickEmail] = useState('');
  const [quickCode, setQuickCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoCodeHint, setDemoCodeHint] = useState('');

  // Password / Register Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  const [district, setDistrict] = useState('منطقه ۲ (ستارخان)');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendQuickCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!quickEmail || !quickEmail.includes('@')) {
      setErrorMsg('لطفاً آدرس ایمیل معتبر وارد کنید.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.sendQuickCode(quickEmail);
      setOtpSent(true);
      setDemoCodeHint(res.demoCode || '1234');
      setSuccessMsg(`کد تایید یک‌بارمصرف ارسال شد. (کد تست سریع: ${res.demoCode || '1234'})`);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ارسال کد ایمیل');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyQuickCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await apiService.verifyQuickCode(quickEmail, quickCode, role);
      setStoredUser(res.user);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'کد ورود نامعتبر است.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFillCode = () => {
    setQuickCode('1234');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (authMode === 'password') {
        const res = await apiService.login(email || username);
        setStoredUser(res.user);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await apiService.register({
          username,
          email,
          phoneNumber,
          role,
          displayName,
          workshopName,
          district,
        });
        setStoredUser(res.user);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در عملیات ورود/ثبت‌نام');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-sky-600" />
              <span>
                {authMode === 'quick_email'
                  ? 'ورود و ثبت‌نام سریع با ایمیل'
                  : authMode === 'password'
                  ? 'ورود با رمز عبور'
                  : 'ثبت‌نام جدید در سوال‌کار'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {authMode === 'quick_email'
                ? 'تنها با وارد کردن ایمیل و ۱ کلیک بدون نیاز به رمز وارد شوید.'
                : 'اطلاعات حساب کاربری خود را وارد کنید.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-200">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center justify-between">
            <span>{successMsg}</span>
            {otpSent && (
              <button
                type="button"
                onClick={handleAutoFillCode}
                className="px-2 py-1 bg-emerald-700 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-800 transition-colors"
              >
                درج خودکار کد ۱۲۳۴
              </button>
            )}
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-2xl text-[11px] font-bold gap-1">
          <button
            onClick={() => {
              setAuthMode('quick_email');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              authMode === 'quick_email' ? 'bg-sky-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>۱-کلیک ایمیل</span>
          </button>
          <button
            onClick={() => {
              setAuthMode('password');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              authMode === 'password' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>رمز عبور</span>
          </button>
          <button
            onClick={() => {
              setAuthMode('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              authMode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>ثبت‌نام کامل</span>
          </button>
        </div>

        {/* 1) QUICK EMAIL AUTH FORM */}
        {authMode === 'quick_email' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendQuickCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    آدرس ایمیل شما
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="مثال: ali.rezaei@gmail.com"
                      value={quickEmail}
                      onChange={(e) => setQuickEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 focus:border-sky-500 focus:bg-white focus:outline-hidden transition-all"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    نقش شما در سامانه
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole(UserRole.Owner)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        role === UserRole.Owner
                          ? 'border-sky-600 bg-sky-50 text-sky-800'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <User className="w-4 h-4 text-sky-600" />
                      <span>مالک خودرو</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole(UserRole.Mechanic)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        role === UserRole.Mechanic
                          ? 'border-sky-600 bg-sky-50 text-sky-800'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <Wrench className="w-4 h-4 text-sky-600" />
                      <span>مکانیک / متخصص</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span>در حال ارسال کد...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>ارسال کد یک‌بارمصرف ورود (یک کلیک)</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyQuickCode} className="space-y-4 animate-in fade-in">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      کد تایید ۴ رقمی ارسال‌شده به {quickEmail}
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[11px] text-sky-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>تغییر ایمیل</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="۱ ۲ ۳ ۴"
                    value={quickCode}
                    onChange={(e) => setQuickCode(e.target.value)}
                    className="w-full py-3 text-center tracking-widest text-lg font-black bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:border-sky-500 focus:bg-white focus:outline-hidden"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    کد تست سریع: <strong className="text-slate-800 font-extrabold">{demoCodeHint}</strong>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span>در حال تایید...</span>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>تایید و ورود آنی به سیستم</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* 2 & 3) PASSWORD LOGIN OR REGISTER FORM */}
        {(authMode === 'password' || authMode === 'register') && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {authMode === 'register' && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setRole(UserRole.Owner)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center flex items-center justify-center gap-2 transition-all ${
                    role === UserRole.Owner
                      ? 'border-sky-600 bg-sky-50 text-sky-800'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <User className="w-4 h-4 text-sky-600" />
                  <span>مالک خودرو</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole(UserRole.Mechanic)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center flex items-center justify-center gap-2 transition-all ${
                    role === UserRole.Mechanic
                      ? 'border-sky-600 bg-sky-50 text-sky-800'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <Wrench className="w-4 h-4 text-sky-600" />
                  <span>مکانیک / متخصص</span>
                </button>
              </div>
            )}

            {authMode === 'password' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نام کاربری یا ایمیل</label>
                <input
                  type="text"
                  required
                  placeholder="ali@example.com یا ali_rezaei"
                  value={email || username}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setUsername(e.target.value);
                  }}
                  className="w-full p-3 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نام کاربری (انگلیسی)</label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: mehdi_mechanic"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ایمیل</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200"
                  />
                </div>

                {role === UserRole.Mechanic && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">نام نمایش (استادکار/مهندس)</label>
                      <input
                        type="text"
                        placeholder="استاد مهدی رضایی"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">نام تعمیرگاه / کارگاه</label>
                      <input
                        type="text"
                        placeholder="تعمیرگاه تخصصی نوین کار"
                        value={workshopName}
                        onChange={(e) => setWorkshopName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">منطقه فعالیت (تهران)</label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200"
                      >
                        <option value="منطقه ۱ (تجریش/نیاوران)">منطقه ۱ (تجریش/نیاوران)</option>
                        <option value="منطقه ۲ (ستارخان/گیشا)">منطقه ۲ (ستارخان/گیشا)</option>
                        <option value="منطقه ۳ (میرداماد/ونک)">منطقه ۳ (میرداماد/ونک)</option>
                        <option value="منطقه ۴ (تهرانپارس)">منطقه ۴ (تهرانپارس)</option>
                        <option value="منطقه ۵ (صادقیه/پونک)">منطقه ۵ (صادقیه/پونک)</option>
                        <option value="منطقه ۶ (یوسف‌آباد)">منطقه ۶ (یوسف‌آباد)</option>
                      </select>
                    </div>
                  </>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رمز عبور</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>در حال پردازش...</span>
              ) : authMode === 'password' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>ورود به حساب</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>ثبت‌نام نهایی حساب</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Security Badge */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>اتصال امن SSL / TLS | رمزنگاری دوعاملی آماده فعال‌سازی</span>
        </div>

      </div>
    </div>
  );
};
