import { useState, useEffect, useCallback } from 'react';
import { User, PushNotificationItem } from '../types';
import { apiService } from '../services/api';

// Helper to convert VAPID public key to Uint8Array for PushManager
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(currentUser: User | null) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [notifications, setNotifications] = useState<PushNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check support & initialize Service Worker
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);

      // Register /sw.js
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[PushHook] Service Worker registered successfully:', reg);
          setSwRegistration(reg);

          // Check if already subscribed
          return reg.pushManager.getSubscription();
        })
        .then((existingSub) => {
          if (existingSub) {
            setSubscription(existingSub);
          }
        })
        .catch((err) => {
          console.warn('[PushHook] Service Worker registration failed:', err);
        });
    }
  }, []);

  // Fetch notifications list
  const refreshNotifications = useCallback(async () => {
    try {
      const res = await apiService.getPushNotifications(currentUser?.id);
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.warn('[PushHook] Failed to load notifications:', err);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 15000); // Periodic check every 15s
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  // Subscribe to Push Notifications
  const enableNotifications = async () => {
    if (!isSupported) {
      alert('مرورگر شما از Service Worker و Push Notifications پشتیبانی نمی‌کند.');
      return false;
    }

    setLoading(true);
    try {
      // Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        alert('دسترسی به اعلان‌های مرورگر تایید نشد.');
        setLoading(false);
        return false;
      }

      // Get or wait for Service Worker registration
      let reg = swRegistration;
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        setSwRegistration(reg);
      }

      // Fetch VAPID key from backend
      const { publicKey } = await apiService.getVapidPublicKey();
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Subscribe via PushManager
      const pushSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      setSubscription(pushSub);

      // Send subscription to backend
      await apiService.subscribePush(pushSub.toJSON(), currentUser?.id);

      // Trigger automatic service check & refresh
      await apiService.checkServiceReminders(currentUser?.id);
      await refreshNotifications();

      // Show test local notification
      if (reg.active) {
        reg.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: '🔔 اعلان‌های هوشمند سوالکار فعال شد',
          body: 'شما از این پس پاسخ‌های جدید مکانیک‌ها و سررسید سرویس‌های خودرو را بلافاصله دریافت خواهید کرد.',
          notificationType: 'system'
        });
      }

      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('[PushHook] Enable error:', err);
      alert('خطا در فعال‌سازی اعلان‌ها: ' + (err.message || String(err)));
      setLoading(false);
      return false;
    }
  };

  // Unsubscribe
  const disableNotifications = async () => {
    if (!subscription) return;
    setLoading(true);
    try {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await apiService.unsubscribePush(endpoint);
      setSubscription(null);
      setLoading(false);
    } catch (err) {
      console.error('[PushHook] Unsubscribe error:', err);
      setLoading(false);
    }
  };

  // Send Test Notification
  const sendTestNotification = async (customTitle?: string, customBody?: string) => {
    setLoading(true);
    try {
      const res = await apiService.sendTestPushNotification(
        {
          title: customTitle || '🧪 تست اعلان هوشمند سوالکار',
          body: customBody || 'این یک پیام آزمایشی جهت تایید عملکرد سرویس ورکر و Push Notifications است.',
          type: 'system',
        },
        currentUser?.id
      );

      // Also trigger via active Service Worker for immediate local feedback
      if (swRegistration?.active) {
        swRegistration.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: customTitle || '🧪 تست اعلان هوشمند سوالکار',
          body: customBody || 'این یک پیام آزمایشی جهت تایید عملکرد سرویس ورکر است.',
          notificationType: 'system'
        });
      }

      await refreshNotifications();
      setLoading(false);
      return res;
    } catch (err: any) {
      alert('خطا در ارسال اعلان آزمایشی: ' + (err.message || String(err)));
      setLoading(false);
    }
  };

  // Mark Read
  const markAsRead = async (notificationId?: string, markAll = false) => {
    try {
      await apiService.markNotificationRead(notificationId, markAll, currentUser?.id);
      await refreshNotifications();
    } catch (err) {
      console.warn('[PushHook] Mark read error:', err);
    }
  };

  // Check Maintenance Reminders
  const checkServiceReminders = async () => {
    try {
      const res = await apiService.checkServiceReminders(currentUser?.id);
      await refreshNotifications();
      return res;
    } catch (err) {
      console.warn('[PushHook] Service check error:', err);
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    notifications,
    unreadCount,
    loading,
    enableNotifications,
    disableNotifications,
    sendTestNotification,
    markAsRead,
    checkServiceReminders,
    refreshNotifications,
  };
}
