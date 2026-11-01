import type { InvoiceSettings } from '@/api/types';
import { parseInvoiceItems, type InvoiceRecord } from '@/api/invoices';
import { formatDinar } from '@/lib/money';
import type { PrintImageAssets } from './printAssets';

/**
 * توليد HTML داخلي لـ `expo-print` فقط (لتحويل الفاتورة إلى PDF أو إرسالها لطابعة النظام).
 * لا يُعرض هذا الـ HTML داخل التطبيق إطلاقاً (القاعدة 1).
 *
 * قسم الطباعة المضغوطة (طلب المستخدم بعد التجربة الفعلية): مطابقة إيصال الموقع —
 * بدون شعار ولا صور ولا بنود الألعاب، الحد الأدنى من الورق:
 * الاسم/العنوان، رقم الفاتورة، الزبون، السعر النهائي + حالة الدفع، QR، هاتف المحل.
 */

/** الاسم العربي الموحّد الرسمي (قرار معتمد: «الشاردة» بالتاء المربوطة) */
export const DEFAULT_STORE_NAME_AR = 'الشاردة ستور';
export const DEFAULT_STORE_NAME_EN = 'Alnafar Store';

export interface ReceiptHtmlContext {
  /** محفوظ للتوافق — النسخة المضغوطة لا تضمّن شعوراً لتقليل استهلاك الورق */
  assets?: PrintImageAssets;
  /** SVG داخلي لرمز QR (من buildTrackQrSvg) — إفراغه يلغي القسم */
  qrSvg?: string;
}

export function resolveStoreNames(settings: InvoiceSettings = {}): { ar: string; en: string } {
  return {
    ar: (settings.store_name || '').trim() || DEFAULT_STORE_NAME_AR,
    en: (settings.store_name_english || '').trim() || DEFAULT_STORE_NAME_EN,
  };
}

/** عرض صفحة الطباعة بالبكسل (72 PPI) لتمريره إلى printAsync/printToFileAsync */
export function paperWidthPx(paperMM: number): number {
  return Math.round((paperMM * 72) / 25.4);
}

export function buildReceiptHtml(
  invoice: InvoiceRecord,
  settings: InvoiceSettings = {},
  context: ReceiptHtmlContext = {},
): string {
  const paperMM = Number(settings.paper_width) || 58;
  const fs = String(settings.font_size || 'normal').toLowerCase();

  let fontSize = '12px';
  if (paperMM < 100) {
    fontSize = fs === 'large' ? '13px' : fs === 'small' ? '11px' : '12px';
  } else {
    fontSize = fs === 'large' ? '15px' : fs === 'small' ? '13px' : '14px';
  }

  const { ar: storeName, en: storeNameEn } = resolveStoreNames(settings);
  const storeAddr = (settings.store_address || '').trim();
  const storePhone = (settings.store_phone || '').trim();
  const footerMsg = (settings.footer_message || '').trim();

  const fullNumber = String(invoice.invoice_number || '').trim();

  const items = parseInvoiceItems(invoice.items);
  const totalPrice =
    Number(invoice.total) ||
    items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
  const discount = Number(invoice.discount) || 0;
  const finalTotal = Math.max(0, totalPrice - discount);
  const paidAmount = Number(invoice.paid_amount ?? finalTotal);
  const isFullyPaid = paidAmount >= finalTotal && finalTotal > 0;
  const isPartial = paidAmount > 0 && !isFullyPaid;
  const statusTag = isFullyPaid ? 'مدفوع' : isPartial ? 'دفع جزئي' : 'غير مدفوع (آجل)';
  const statusClass = isFullyPaid ? 'ok' : 'due';

  const { qrSvg = '' } = context;

  const remainingLine = isPartial ? ` (${formatDinar(Math.max(0, finalTotal - paidAmount))} متبقية)` : '';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فاتورة ${escapeHtml(fullNumber || '')}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:${paperMM}mm;max-width:${paperMM}mm;font-family:Tahoma,Arial,sans-serif;background:#fff;color:#14171c;font-size:${fontSize};line-height:1.3;direction:rtl}
    @page{margin:1mm}
    .r{width:100%;padding:1.5mm;text-align:center}
    .bn{font-size:${fontSize === '12px' ? '15px' : '17px'};font-weight:900}
    .be{font-size:9px;color:#37454f}
    .l{border:none;border-top:1px dashed #8a949c;margin:1mm 0}
    .ltr{direction:ltr;display:inline-block}
    .no{font-size:${fontSize === '12px' ? '14px' : '15px'};font-weight:800}
    .who{font-weight:700}
    .phone{font-size:${Math.max(9, parseInt(fontSize, 10) - 3)}px;color:#37454f;font-family:'DejaVu Sans Mono',monospace}
    .it{display:flex;justify-content:space-between;gap:2mm;padding:0.4mm 0;text-align:right}
    .tot{font-size:${fontSize === '12px' ? '16px' : '18px'};font-weight:900;margin-top:0.8mm}
    .tag{font-weight:800;display:inline-block;padding:0.3mm 1.5mm;border-radius:1mm;margin-top:0.6mm}
    .tag.ok{color:#166534;background:#f0fdf4;border:1px solid #bbf7d0}
    .tag.due{color:#b91c1c;background:#fef2f2;border:1px solid #fecaca}
    .qr{margin:1mm auto 0;display:flex;flex-direction:column;align-items:center;gap:0.3mm}
    .qr svg{width:${paperMM <= 58 ? 19 : 24}mm;height:${paperMM <= 58 ? 19 : 24}mm}
    .qrcap{font-size:8px;color:#37454f}
    .ft{font-size:8px;color:#37454f;margin-top:0.8mm}
  </style>
</head>
<body>
  <div class="r">
    <div class="bn">${escapeHtml(storeName)}</div>
    <div class="be"><bdi dir="ltr">${escapeHtml(storeNameEn)}</bdi></div>
    ${storeAddr ? `<div class="be">${escapeHtml(storeAddr)}</div>` : ''}
    <hr class="l" />
    <div class="no"><span class="ltr">#${escapeHtml(fullNumber)}</span></div>
    <div class="who">${escapeHtml(invoice.customer_name || 'عميل نقدي')}</div>
    ${invoice.customer_phone ? `<div class="phone"><bdi dir="ltr">${escapeHtml(invoice.customer_phone)}</bdi></div>` : ''}
    <hr class="l" />
    <div class="tot">${escapeHtml(formatDinar(finalTotal))}${remainingLine}</div>
    <div class="tag ${statusClass}"><bdi>${escapeHtml(statusTag)}</bdi></div>
    ${qrSvg ? `<div class="qr">${qrSvg}<div class="qrcap">امسح لمتابعة الطلب</div></div>` : ''}
    ${footerMsg ? `<div class="ft">${escapeHtml(footerMsg)}</div>` : ''}
    ${storePhone ? `<div class="phone ft"><bdi dir="ltr">${escapeHtml(storePhone)}</bdi></div>` : ''}
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
