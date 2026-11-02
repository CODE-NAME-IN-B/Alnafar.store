/**
 * التتبع المحلي لطلبات الزبون:
 * الطلب يُحفظ في جهاز الزبون بمجرد فتح تتبعه عبر QR (لأن الورقة تُفقد بعد
 * الانصراف)، ثم يبقى في «تتبع طلباتي» ويُفحص دورياً — وعند تحول الطلب
 * «جاهز» يصل إشعار محلي فوري دون الحاجة للخادم أو إعادة المسح.
 */
import { jsonGet, jsonSet } from './storage';

export interface TrackedOrderRef {
  invoice_number: string;
  saved_at: string;
}

const LIST_KEY = 'track.orders';
const STATUS_KEY = 'track.orders_status';
const MAX_TRACKED = 50;

/** قائمة الطلبات المحفوظة محلياً — الأحدث فتحاً أولاً */
export async function getTrackedOrders(): Promise<TrackedOrderRef[]> {
  return jsonGet<TrackedOrderRef[]>(LIST_KEY, []);
}

/** إضافة/تحديث طلب في قائمة التتبع المحلية (بدون تكرار، حتى 50 طلباً) */
export async function addTrackedOrder(id: string): Promise<void> {
  const trimmed = String(id ?? '').trim();
  if (!trimmed) return;
  const list = (await getTrackedOrders()).filter(
    (r) => r.invoice_number !== trimmed
  );
  list.unshift({ invoice_number: trimmed, saved_at: new Date().toISOString() });
  await jsonSet(LIST_KEY, list.slice(0, MAX_TRACKED));
}

/** حذف طلب من قائمة التتبع المحلية */
export async function removeTrackedOrder(id: string): Promise<void> {
  const trimmed = String(id ?? '').trim();
  const list = (await getTrackedOrders()).filter(
    (r) => r.invoice_number !== trimmed
  );
  await jsonSet(LIST_KEY, list);
  const statuses = await getSavedStatuses();
  if (trimmed in statuses) {
    delete statuses[trimmed];
    await jsonSet(STATUS_KEY, statuses);
  }
}

/** آخر حالة معروفة لكل معرّف طلب محفوظ (أساس كشف التغيّر) */
export async function getSavedStatuses(): Promise<Record<string, string>> {
  return jsonGet<Record<string, string>>(STATUS_KEY, {});
}

/** تحديث الحالة المحفوظة لطلب — تُستدعى بعد كل فحص ناجح */
export async function saveTrackedStatus(
  id: string,
  status: string
): Promise<void> {
  const trimmed = String(id ?? '').trim();
  if (!trimmed || !status) return;
  const statuses = await getSavedStatuses();
  if (statuses[trimmed] === status) return;
  statuses[trimmed] = status;
  await jsonSet(STATUS_KEY, statuses);
}
