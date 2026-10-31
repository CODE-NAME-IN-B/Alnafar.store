import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { api } from '@/api/client';
import { statusLabel } from './statuses';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** تهيئة قناة أندرويد وطلب إذن الإشعارات وإرجاع Expo Push Token إن توفر */
export async function registerForOrderNotifications(
  orderId: string | number
): Promise<{ granted: boolean; token: string | null }> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'تحديثات الطلبات',
      importance: Notifications.AndroidImportance.HIGH,
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

  if (finalStatus !== 'granted') {
    return { granted: false, token: null };
  }

  let pushToken: string | null = null;
  if (Device.isDevice) {
    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      const tokenResp = projectId
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();
      pushToken = tokenResp.data;
    } catch {
      pushToken = null;
    }
  }

  if (pushToken && orderId) {
    try {
      await api.post('/notifications/register-device', {
        orderId: String(orderId),
        expoPushToken: pushToken,
      });
    } catch {
      // المسار اختياري على الخادم حتى تُعتمد تعديلات القسم 6
    }
  }

  return { granted: true, token: pushToken };
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
