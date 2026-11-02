/**
 * مراقب طلبات الزبون المحفوظة محلياً:
 * يفحص كل ~60 ثانية حالة الأوامر الموجودة في «تتبع طلباتي»، وعند أي
 * تغيّر في الحالة يُصدر إشعاراً محلياً (ومنها «جاهز للاستلام») دون
 * خادم إخطار — لأن الطلب محفوظ على الجهاز.
 */
import { useEffect, useRef, useState } from 'react';
import { trackOrder } from '@/api/orders';
import { notifyOrderStatusChanged } from '@/lib/notifications';
import {
  getSavedStatuses,
  getTrackedOrders,
  removeTrackedOrder,
  saveTrackedStatus,
} from '@/lib/trackedOrders';
import { showToast } from '@/lib/toast';

const POLL_MS = 60_000;

export default function TrackedOrderWatcher() {
  /* عدد الطلبات المحفوظة فقط — يكفي لتفعيل/تعطيل الحلقة الدورية */
  const [trackedCount, setTrackedCount] = useState(0);
  const busyRef = useRef(false);

  useEffect(() => {
    let alive = true;

    const tick = async () => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const refs = await getTrackedOrders();
        if (!alive) return;
        setTrackedCount(refs.length);
        if (refs.length === 0) return;

        const statuses = await getSavedStatuses();
        for (const ref of refs) {
          try {
            const order = await trackOrder(ref.invoice_number);
            if (!alive || !order?.status) continue;
            const prev = statuses[ref.invoice_number];
            if (prev && prev !== order.status) {
              await notifyOrderStatusChanged(order.invoice_number, order.status);
              if (order.status === 'ready') {
                showToast(`طلبك #${order.invoice_number} جاهز للاستلام 🎮`);
              }
            }
            statuses[ref.invoice_number] = order.status;
            void saveTrackedStatus(ref.invoice_number, order.status);
          } catch (err) {
            // طلب حُذف من الخادم (404) → ينزال من القائمة المحلية
            const httpStatus = (err as { response?: { status?: number } })?.response?.status;
            if (httpStatus === 404) {
              void removeTrackedOrder(ref.invoice_number);
            }
          }
        }
      } catch {
        // تجاهل — المحاولة القادمة بعد دقيقة
      } finally {
        busyRef.current = false;
      }
    };

    void tick();
    const timer = setInterval(() => void tick(), POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return null;
}
