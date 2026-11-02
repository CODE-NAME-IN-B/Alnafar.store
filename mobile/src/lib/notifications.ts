/**
 * الإشعارات (Expo Push) — وحدة موحّدة:
 *  1. تسجيل الجهاز للإشعارات العالمية (لعبة جديدة) — حتى للضيف.
 *  2. تسجيل الجهاز لتتبع طلب معيّن (track/[id]) وإشعار محلي عند تغيّر الحالة.
 *
 * كل عمليات التسجيل تفشل بصمت: في Expo Go على أندرويد لا يدعم Remote Push
 * منذ SDK 53، والتوكن يتطلب projectId (eas init) — تعمل الكامل مع build تطوير رسمي.
 */
import { useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from '@/api/client';
import { showToast } from '@/lib/toast';
import { statusLabel } from './statuses';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** طلب إذن الإشعارات وإرجاع Expo Push Token (null إن تعذر) */
async function requestPermissionAndGetToken(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'تحديثات الطلبات',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#14b8a6',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const tokenResp = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    return tokenResp.data ?? null;
  } catch {
    return null;
  }
}

/** تسجيل الجهاز على الخادم — فشل صائم دائماً */
async function registerDevice(token: string, orderId?: string): Promise<void> {
  try {
    await api.post('/devices/register', {
      token,
      platform: Platform.OS,
      orderId: orderId ?? null,
    });
  } catch {
    // التسجيل على الخادم اختياري — لا يعطل التدفق
  }
}

/**
 * تسجيل الجهاز للإشعارات العالمية (لعبة جديدة) — يُستدعى مرة عند الإقلاع،
 * للضيف والزبون والموظف جميعاً.
 */
export async function registerForPushNotifications(): Promise<void> {
  try {
    const token = await requestPermissionAndGetToken();
    if (token) await registerDevice(token);
  } catch {
    // الإشعارات ميزة إضافية — الفشل الصامت مطلوب
  }
}

/**
 * تسجيل الجهاز لتتبع طلب معيّن (تُستدعى من شاشة التتبع) —
 * يربط التوكن برقم الفاتورة حتى تصل إشعارات «طلبك جاهز».
 */
export async function registerForOrderNotifications(
  orderId: string | number
): Promise<{ granted: boolean; token: string | null }> {
  try {
    const token = await requestPermissionAndGetToken();
    if (token && orderId) {
      await registerDevice(token, String(orderId));
      return { granted: true, token };
    }
    return { granted: false, token: null };
  } catch {
    return { granted: false, token: null };
  }
}

/** إشعار محلي فوري عند تغيّر حالة الطلب أثناء التتبع */
export async function notifyOrderStatusChanged(
  invoiceNumber: string,
  newStatus: string
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `تحديث حالة الطلب #${invoiceNumber}`,
        body: `الحالة الآن: ${statusLabel(newStatus)}`,
        data: { invoiceNumber, status: newStatus },
      },
      trigger: null,
    });
  } catch {
    // نتجاهل إن رفض المستخدم الإذن
  }
}

/** مستمع الإشعارات البادئة في الواجهة — يحولها إلى Toast داخل التطبيق */
export function useForegroundNotifications(): void {
  const listenerRef = useRef<{ remove(): void } | null>(null);

  useEffect(() => {
    try {
      const sub = Notifications.addNotificationReceivedListener((n) => {
        const title = n.request?.content?.title;
        const body = n.request?.content?.body;
        showToast([title, body].filter(Boolean).join(' — '));
      });
      listenerRef.current = sub;
    } catch {
      // ignore
    }
    return () => {
      listenerRef.current?.remove();
      listenerRef.current = null;
    };
  }, []);
}
