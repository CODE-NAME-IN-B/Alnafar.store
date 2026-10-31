/** حالات الفاتورة/الطلب وعناوينها العربية كما في الواجهة */
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'قيد الانتظار',
  paid: 'تم الدفع',
  confirmed: 'مؤكدة',
  processing: 'جاري التجهيز',
  ready: 'جاهز للاستلام',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  refunded: 'مسترد',
};

/** الخطوات الثلاث الظاهرة للزبون في تتبع الطلب */
export const TRACK_STEPS = ['تم الاستلام', 'جاري التجهيز', 'جاهز للاستلام'] as const;

/**
 * موقع الخطوة الحالية داخل الخطوات الثلاث.
 * - pending/paid/confirmed → الخطوة 1 تُعد مكتملة
 * - processing → خطوة 2 نشطة
 * - ready/completed → كل الخطوات مكتملة
 */
export function stepIndexFor(status: OrderStatus): { current: number; done: number } {
  if (status === 'completed' || status === 'ready') return { current: 2, done: 3 };
  if (status === 'processing') return { current: 1, done: 1 };
  // pending / paid / confirmed
  return { current: 0, done: 1 };
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as OrderStatus] ?? status;
}
