import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Sparkles,
  Send,
  ShieldCheck,
  Clock,
  ExternalLink,
  Car,
  BellOff,
  RefreshCw,
  CheckCheck
} from 'lucide-react';
import { PushNotificationItem } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSupported: boolean;
  permission: NotificationPermission;
  subscription: PushSubscription | null;
  notifications: PushNotificationItem[];
  unreadCount: number;
  loading: boolean;
  onEnableNotifications: () => Promise<boolean>;
  onDisableNotifications: () => Promise<void>;
  onSendTestNotification: (title?: string, body?: string) => Promise<any>;
  onMarkAsRead: (notificationId?: string, markAll?: boolean) => Promise<void>;
  onCheckServiceReminders: () => Promise<any>;
  onNavigateToUrl: (url: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  isSupported,
  permission,
  subscription,
  notifications,
  unreadCount,
  loading,
  onEnableNotifications,
  onDisableNotifications,
  onSendTestNotification,
  onMarkAsRead,
  onCheckServiceReminders,
  onNavigateToUrl,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'mechanic_answer' | 'service_reminder'>('all');
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'unread') return !item.read;
    if (activeFilter === 'mechanic_answer') return item.type === 'mechanic_answer';
    if (activeFilter === 'service_reminder') return item.type === 'service_reminder';
    return true;
  });

  const handleTestNotification = async () => {
    setTestSuccessMessage(null);
    const res = await onSendTestNotification();
    if (res) {
      setTestSuccessMessage('اعلان آزمایشی با موفقیت به مرورگر و سرویس ورکر ارسال شد!');
      setTimeout(() => setTestSuccessMessage(null), 5000);
    }
  };

  const handleManualServiceCheck = async () => {
    setTestSuccessMessage(null);
    const res = await onCheckServiceReminders();
    if (res) {
      setTestSuccessMessage(res.message || 'بررسی وضعیت سرویس‌های دوره‌ای خودرو انجام گردید.');
      setTimeout(() => setTestSuccessMessage(null), 5000);
    }
  };

  const formatPersianTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'همین الان';
      if (diffMins < 60) return `${diffMins} دقیقه پیش`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} ساعت پیش`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} روز پیش`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[88vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-900 via-sky-800 to-slate-900 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">مرکز اعلان‌های سرویس ورکر</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black">
                    {unreadCount} خوانده‌نشده
                  </span>
                )}
              </div>
              <p className="text-xs text-sky-200 mt-0.5">
                هشدارهای پاسخ مکانیک، سررسید سرویس دوره‌ای و پیام‌های سیستم
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-sky-100 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Service Worker Status Banner */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5 ${
                  subscription
                    ? 'bg-emerald-600'
                    : permission === 'denied'
                    ? 'bg-rose-600'
                    : 'bg-amber-500'
                }`}
              >
                {subscription ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : permission === 'denied' ? (
                  <BellOff className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">وضعیت اعلان‌های مرورگر (Service Worker):</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black ${
                      subscription
                        ? 'bg-emerald-100 text-emerald-800'
                        : permission === 'denied'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {subscription
                      ? 'فعال و متصل (Connected)'
                      : permission === 'denied'
                      ? 'مسدودشده در مرورگر'
                      : 'غیرفعال / در انتظار تایید'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {subscription
                    ? 'سرویس ورکر فعال است. پیام‌های پاسخ مکانیک و هشدار سرویس خودرو مستقیم روی سیستم شما دریافت می‌شوند.'
                    : 'برای دریافت لحظه‌ای پاسخ مکانیک‌ها و هشدارهای تعویض روغن/تسمه، اعلان‌ها را فعال نمایید.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {subscription ? (
                <button
                  onClick={onDisableNotifications}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
                >
                  غیرفعال‌سازی Push
                </button>
              ) : (
                <button
                  onClick={onEnableNotifications}
                  disabled={loading}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>فعال‌سازی Push Notifications</span>
                </button>
              )}
            </div>
          </div>

          {/* Action Tools Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-200/60">
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestNotification}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-amber-600" />
                <span>ارسال اعلان آزمایشی (Test Push)</span>
              </button>

              <button
                onClick={handleManualServiceCheck}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${loading ? 'animate-spin' : ''}`} />
                <span>بررسی هشدارهای گاراژ</span>
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => onMarkAsRead(undefined, true)}
                className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 transition-colors ml-1"
              >
                <CheckCheck className="w-4 h-4" />
                <span>علامت‌گذاری همه به‌عنوان خوانده‌شده</span>
              </button>
            )}
          </div>

          {testSuccessMessage && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{testSuccessMessage}</span>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            همه ({notifications.length})
          </button>
          <button
            onClick={() => setActiveFilter('unread')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              activeFilter === 'unread'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            خوانده‌نشده ({unreadCount})
          </button>
          <button
            onClick={() => setActiveFilter('mechanic_answer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              activeFilter === 'mechanic_answer'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            پاسخ مکانیک‌ها
          </button>
          <button
            onClick={() => setActiveFilter('service_reminder')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              activeFilter === 'service_reminder'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            یادآوری سرویس خودرو
          </button>
        </div>

        {/* Notifications List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3 bg-slate-50/50">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <BellOff className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-700">هیچ اعلانی در این بخش وجود ندارد</p>
              <p className="text-xs text-slate-500 mt-1">
                هنگامی که مکانیک به سوال شما پاسخ دهد یا موعد سرویس خودرو فرارسد، اعلان جدید در اینجا نمایش داده می‌شود.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  onMarkAsRead(notif.id);
                  if (notif.targetUrl) {
                    onNavigateToUrl(notif.targetUrl);
                    onClose();
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                  notif.read
                    ? 'bg-white border-slate-200/80 opacity-80 hover:opacity-100 hover:border-sky-300'
                    : 'bg-white border-sky-300 shadow-md shadow-sky-900/5 ring-1 ring-sky-200'
                }`}
              >
                {!notif.read && (
                  <span className="absolute top-4 left-4 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100" />
                )}

                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      notif.type === 'mechanic_answer'
                        ? 'bg-sky-100 text-sky-700'
                        : notif.type === 'service_reminder'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {notif.type === 'mechanic_answer' ? (
                      <Wrench className="w-5 h-5" />
                    ) : notif.type === 'service_reminder' ? (
                      <Car className="w-5 h-5" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-sky-700 transition-colors">
                        {notif.title}
                      </h4>
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatPersianTimeAgo(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-600 leading-relaxed mb-2.5">
                      {notif.body}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 group-hover:underline">
                        <span>مشاهده جزئیات</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>

                      {!notif.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead(notif.id);
                          }}
                          className="text-[11px] font-bold text-slate-400 hover:text-slate-700"
                        >
                          علامت‌گذاری به‌عنوان خوانده‌شده
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>سوالکار از استانداردهای رسمی W3C Web Push Protocol بهره می‌برد.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors"
          >
            بستن
          </button>
        </div>

      </div>
    </div>
  );
};
