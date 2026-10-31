import { api } from './client';
import type { OrderSubmitPayload, TrackedOrder } from './types';

/**
 * إرسال طلب من السلة — عام ومحدود بمعدل 5 طلبات/دقيقة.
 * يُخزن على الخادم في جدول orders ويعيد `id` الطلب.
 */
export async function submitOrder(payload: OrderSubmitPayload): Promise<{ id: number }> {
  const { data } = await api.post<{ id: number }>('/orders', payload);
  return data;
}

/**
 * تتبع طلب/فاتورة بمعرّفها أو رقمها — عام.
 * الباكند يقرأ من جدول الفواتير والطلبات.
 */
export async function trackOrder(idOrNumber: string | number): Promise<TrackedOrder> {
  const { data } = await api.get<{ success: true; order: TrackedOrder }>(
    `/orders/${encodeURIComponent(String(idOrNumber))}`
  );
  return data.order;
}

/** تحديث حالة طلب/فاتورة من شاشة التتبع أو الفواتير (يتطلب توكن موظف/مدير) */
export async function updateOrderStatus(
  idOrNumber: string | number,
  status: string
): Promise<{ success: boolean; message?: string }> {
  const { data } = await api.put<{ success: boolean; message?: string }>(
    `/orders/${encodeURIComponent(String(idOrNumber))}/status`,
    { status }
  );
  return data;
}

/** تبديل حالة التثبيت لبند لعبة داخل الفاتورة (يتطلب توكن موظف/مدير) */
export async function toggleOrderItemInstalled(
  idOrNumber: string | number,
  itemIndex: number,
  installed: boolean
): Promise<{ success: boolean; message?: string }> {
  const { data } = await api.put<{ success: boolean; message?: string }>(
    `/orders/${encodeURIComponent(String(idOrNumber))}/items/${itemIndex}/installed`,
    { installed }
  );
  return data;
}
