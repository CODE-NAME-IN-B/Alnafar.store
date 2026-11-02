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
    html,body{width:${paperMM}mm;max-width:${paperMM}mm;font-family:Tahoma,Arial,sans-serif;background:#fff;color:#000;font-size:${fontSize};line-height:1.5;direction:rtl}
    @page{size:${paperMM}mm auto;margin:3mm 2mm}
    /* الهدر العلوي ثابت السلة: لا margin-collapse ولا مساحة مقتَطعة */
    .r{width:100%;padding:1.5mm 2mm;text-align:center}
    /* كل سطر كتلة مستقلة — منع تداخل الاسم مع الرقم */
    .r > div{display:block;width:100%;clear:both;overflow-wrap:break-word;word-break:break-word;unicode-bidi:isolate}
    .bn{font-size:${fontSize === '12px' ? '16px' : '18px'};font-weight:900;line-height:1.5;color:#000}
    .be{font-size:9.5px;color:#1f2937;line-height:1.5}
    .l{border:none;border-top:1px dashed #4b5563;margin:1.2mm 2mm}
    .ltr{direction:ltr;display:inline-block;unicode-bidi:isolate}
    .no{font-size:${fontSize === '12px' ? '14.5px' : '15.5px'};font-weight:800;line-height:1.5;margin-top:0.8mm}
    .who{font-weight:700;line-height:1.6;margin-top:0.8mm;padding:0.4mm 1mm;background:none}
    .phone{font-size:${Math.max(9.5, parseInt(fontSize, 10) - 3)}px;color:#1f2937;font-family:'DejaVu Sans Mono',monospace;line-height:1.6;margin-top:0.5mm}
    .it{display:flex;justify-content:space-between;gap:2mm;padding:0.4mm 0;text-align:right}
    .tot{font-size:${fontSize === '12px' ? '17px' : '19px'};font-weight:900;margin-top:1mm;line-height:1.5}
    .tag{font-weight:800;display:inline-block;padding:0.4mm 1.5mm;border-radius:1mm;margin-top:1mm}
    .tag.ok{color:#166534;background:#f0fdf4;border:1px solid #bbf7d0}
    .tag.due{color:#b91c1c;background:#fef2f2;border:1px solid #fecaca}
    .qr{margin:1.2mm auto 0;display:flex;flex-direction:column;align-items:center;gap:0.3mm}
    .qr svg{width:${paperMM <= 58 ? 19 : 24}mm;height:${paperMM <= 58 ? 19 : 24}mm}
    .qrcap{font-size:8.5px;color:#1f2937}
    .ft{font-size:8.5px;color:#1f2937;margin-top:1mm}
  </style>
</head>
<body>
  <!-- هدر علوي ثابت: يظهر هكذا على الورق كما في المعاينة (مسافة قبل الاسم) -->
  <div style="height:2mm"></div>
  <div class="r">
    <div style="padding-top:1mm"></div>
    <div class="bn">${escapeHtml(storeName)}</div>
    <div class="be"><bdi dir="ltr">${escapeHtml(storeNameEn)}</bdi></div>
    ${storeAddr ? `<div class="be">${escapeHtml(storeAddr)}</div>` : ''}
    <hr class="l" />
    <div class="no"><bdi dir="ltr">#${escapeHtml(fullNumber)}</bdi></div>
    <div class="who">${escapeHtml(invoice.customer_name || 'عميل نقدي')}</div>
    ${invoice.customer_phone ? `<div class="phone"><bdi dir="ltr">${escapeHtml(invoice.customer_phone)}</bdi></div>` : ''}
    <hr class="l" />
    <div class="tot"><bdi dir="ltr">${escapeHtml(formatDinar(finalTotal))}</bdi>${remainingLine}</div>
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
