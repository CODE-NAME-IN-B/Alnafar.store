import QRCode from 'qrcode';
import { WEB_BASE } from '@/lib/env';

/**
 * بناء مسار التتبع الموحد القابل للمسح من الهاتف.
 * نفس الصيغة المستخدمة في شاشة الفاتورة الأصلية (NativeReceiptModal).
 */
export function buildTrackUrl(invoiceNumber: string | number | null | undefined): string {
  const code = String(invoiceNumber ?? '').trim();
  if (!code) return '';
  return `${WEB_BASE}/#/track/${encodeURIComponent(code)}`;
}

/**
 * توليد رمز QR كـ SVG داخلي (يُستخدم داخل HTML الطباعة فقط).
 * لا يُظهره داخل التطبيق إطلاقاً — توليد HTML لأغراض expo-print مسموح حصراً.
 */
export function buildTrackQrSvg(invoiceNumber: string | number | null | undefined): string {
  const url = buildTrackUrl(invoiceNumber);
  if (!url) return '';
  try {
    const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
    const { size, data } = qr.modules;
    let path = '';
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (data[y * size + x]) {
          path += `M${x} ${y}h1v1h-1z`;
        }
      }
    }
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" ` +
      `shape-rendering="crispEdges">` +
      `<rect width="${size}" height="${size}" fill="none"/>` +
      `<path d="${path}" fill="#000"/>` +
      `</svg>`
    );
  } catch {
    return '';
  }
}
