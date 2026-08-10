import React, { useState, useRef, useEffect } from 'react';
import {
  Wrench,
  Search,
  PlusCircle,
  User as UserIcon,
  Sparkles,
  ShieldCheck,
  Building2,
  LogOut,
  ChevronDown,
  Menu,
  X,
  HelpCircle,
  Car,
  Bell
} from 'lucide-react';
import { User, UserRole } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onOpenAskModal: () => void;
  onOpenAiDrawer: () => void;
  onOpenAuthModal: () => void;
  onSwitchUserRole: (role: UserRole) => void;
  onLogout: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: () => void;
  onOpenNotificationModal?: () => void;
  unreadNotificationsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAskModal,
  onOpenAiDrawer,
  onOpenAuthModal,
  onSwitchUserRole,
  onLogout,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onOpenNotificationModal,
  unreadNotificationsCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-6 space-x-reverse">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 group text-right"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-700 flex items-center justify-center text-white shadow-md shadow-sky-700/20 group-hover:bg-sky-800 transition-colors">
                <Wrench className="w-5 h-5 transition-transform group-hover:rotate-12" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 block leading-tight">
                  سوال‌کار
                  <span className="text-sky-700 font-extrabold text-sm ml-1">.ir</span>
                </span>
                <span className="text-[10px] font-medium text-slate-500 block -mt-0.5">
                  پلتفرم تخصصی Q&A خودرو
                </span>
              </div>
            </button>

            {/* Desktop Navigation links */}
            <nav className="hidden md:flex items-center space-x-1 space-x-reverse mr-4">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'home'
                    ? 'text-sky-700 bg-sky-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                صفحه اصلی
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'questions'
                    ? 'text-sky-700 bg-sky-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                پرسش‌ها و پاسخ‌ها
              </button>
              <button
                onClick={() => setActiveTab('mechanics')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'mechanics'
                    ? 'text-sky-700 bg-sky-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                دایرکتوری مکانیک‌ها
              </button>
              <button
                onClick={() => setActiveTab('articles')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'articles' || activeTab === 'article-detail'
                    ? 'text-sky-700 bg-sky-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                مجله و مقالات
              </button>
              {currentUser?.role === UserRole.Mechanic && (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === 'dashboard'
                      ? 'text-sky-700 bg-sky-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  پنل مکانیک
                </button>
              )}
              {currentUser?.role === UserRole.Admin && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === 'admin'
                      ? 'text-purple-700 bg-purple-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  مدیریت سیستم
                </button>
              )}
            </nav>
          </div>

          {/* Quick Header Search */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="جستجوی عیب، صدای غیرعادی، خودرو (مثلاً: صدای ۲۰۶...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 hover:bg-slate-200/70 focus:bg-white text-slate-800 placeholder-slate-400 text-sm rounded-xl border border-transparent focus:border-sky-500 focus:outline-hidden transition-all"
              />
              <button
                onClick={onSearchSubmit}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 p-1"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Controls & User Menu */}
          <div className="flex items-center space-x-3 space-x-reverse">
            
            {/* AI Assistant Button */}
            <button
              onClick={onOpenAiDrawer}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold shadow-xs hover:from-amber-600 hover:to-amber-700 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-100 animate-pulse" />
              <span>تست هوشمند عیب‌یابی</span>
            </button>

            {/* Ask Question CTA */}
            <button
              onClick={onOpenAskModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-sm shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>ثبت سوال جدید</span>
            </button>

            {/* Notification Bell Button */}
            <button
              onClick={onOpenNotificationModal}
              title="مرکز اعلان‌های سرویس ورکر"
              className="relative p-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-700 hover:text-sky-700 transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5 text-slate-700" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center border-2 border-white">
                  {unreadNotificationsCount > 9 ? '۹+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* User Profile / Auth Toggle */}
            {currentUser ? (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <img
                    src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt={currentUser.username}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-sky-100"
                  />
                  <span className="hidden sm:inline-block text-xs font-bold text-slate-700 max-w-[100px] truncate">
                    {currentUser.mechanicProfile?.displayName || currentUser.username}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* User Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="p-3 bg-slate-50 rounded-xl mb-2">
                      <p className="text-xs font-bold text-slate-900">
                        {currentUser.mechanicProfile?.displayName || currentUser.username}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800">
                          {currentUser.role === UserRole.Mechanic
                            ? 'مکانیک تأییدشده'
                            : currentUser.role === UserRole.Admin
                            ? 'مدیر سیستم'
                            : 'مالک خودرو'}
                        </span>
                        {currentUser.mechanicProfile?.reputationScore && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
                            امتیاز: {currentUser.mechanicProfile.reputationScore}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Role Switcher Demo Box */}
                    <div className="p-2 border-t border-slate-100 my-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                        تغییر نقش تست سریع:
                      </p>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          onClick={() => {
                            onSwitchUserRole(UserRole.Owner);
                            setUserDropdownOpen(false);
                          }}
                          className={`text-[10px] font-bold py-1 px-1.5 rounded-lg border text-center transition-colors ${
                            currentUser.role === UserRole.Owner
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          مالک خودرو
                        </button>
                        <button
                          onClick={() => {
                            onSwitchUserRole(UserRole.Mechanic);
                            setUserDropdownOpen(false);
                          }}
                          className={`text-[10px] font-bold py-1 px-1.5 rounded-lg border text-center transition-colors ${
                            currentUser.role === UserRole.Mechanic
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          مکانیک
                        </button>
                        <button
                          onClick={() => {
                            onSwitchUserRole(UserRole.Admin);
                            setUserDropdownOpen(false);
                          }}
                          className={`text-[10px] font-bold py-1 px-1.5 rounded-lg border text-center transition-colors ${
                            currentUser.role === UserRole.Admin
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          مدیر
                        </button>
                      </div>
                    </div>

                    {/* Profile & Garage Button */}
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-700 rounded-xl transition-colors my-0.5"
                    >
                      <UserIcon className="w-4 h-4 text-sky-600" />
                      <span>پروفایل، گاراژ و امنیت</span>
                    </button>

                    {currentUser.role === UserRole.Mechanic && (
                      <button
                        onClick={() => {
                          setActiveTab('dashboard');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-700 rounded-xl transition-colors"
                      >
                        <Building2 className="w-4 h-4" />
                        <span>پنل مدیریت مکانیک</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onLogout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>خروج از حساب</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors"
              >
                <UserIcon className="w-4 h-4 text-slate-500" />
                <span>ورود / ثبت‌نام</span>
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-2">
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="جستجوی سوال یا ماشین..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 text-slate-800 text-sm rounded-xl"
            />
            <button onClick={onSearchSubmit} className="absolute left-3 top-2.5 text-slate-400">
              <Search className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setActiveTab('home');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-bold ${
              activeTab === 'home' ? 'bg-sky-50 text-sky-700' : 'text-slate-700'
            }`}
          >
            صفحه اصلی
          </button>
          <button
            onClick={() => {
              setActiveTab('questions');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-bold ${
              activeTab === 'questions' ? 'bg-sky-50 text-sky-700' : 'text-slate-700'
            }`}
          >
            پرسش‌ها و پاسخ‌ها
          </button>
          <button
            onClick={() => {
              setActiveTab('mechanics');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-bold ${
              activeTab === 'mechanics' ? 'bg-sky-50 text-sky-700' : 'text-slate-700'
            }`}
          >
            دایرکتوری مکانیک‌ها
          </button>
          <button
            onClick={() => {
              setActiveTab('articles');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-bold ${
              activeTab === 'articles' || activeTab === 'article-detail' ? 'bg-sky-50 text-sky-700' : 'text-slate-700'
            }`}
          >
            مجله و مقالات
          </button>
          {currentUser?.role === UserRole.Mechanic && (
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full text-right px-4 py-2.5 rounded-xl text-sm font-bold text-sky-800 bg-sky-50"
            >
              پنل مکانیک
            </button>
          )}

          <button
            onClick={() => {
              onOpenAiDrawer();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold"
          >
            <Sparkles className="w-4 h-4" />
            <span>تست هوشمند عیب‌یابی خودرو (AI)</span>
          </button>
        </div>
      )}
    </header>
  );
};
