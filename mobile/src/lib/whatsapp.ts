import { normalizePhone } from './phone';

export interface MessageItem {
  title: string;
  price: number;
  sizeGb?: number | null;
  quantity?: number;
}

/** رسالة واتساب مبنية كما في الواجهة: سطر لكل عنصر + الحجم والسعر */
export function buildOrderMessage(items: MessageItem[], total: number): string {
  const lines: string[] = ['السلام عليكم، أريد إتمام الطلب التالي:', ''];
  for (const item of items) {
    const size = item.sizeGb ? `${Math.round(item.sizeGb)} GB` : null;
    const qty = item.quantity && item.quantity > 1 ? ` × ${item.quantity}` : '';
    lines.push(`• ${item.title}${qty}${size ? ` (${size})` : ''} — ${item.price} د.ل`);
  }
  lines.push('', `الإجمالي: ${total} د.ل`);
  return lines.join('\n');
}

/** فتح واتساب برسالة جاهزة — عبر رابط عميق (Deep Link) أصلي */
export function whatsappLink(phoneRaw: string, text: string): string {
  const phone = normalizePhone(phoneRaw);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
