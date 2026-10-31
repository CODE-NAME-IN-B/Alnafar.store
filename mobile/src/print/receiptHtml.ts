import type { InvoiceSettings } from '@/api/types';
import { parseInvoiceItems, type InvoiceRecord } from '@/api/invoices';
import { formatDinar } from '@/lib/money';
import type { PrintImageAssets } from './printAssets';

/**
 * توليد HTML داخلي لـ `expo-print` فقط (لتحويل الفاتورة إلى PDF أو إرسالها لطابعة النظام).
 * لا يُعرض هذا الـ HTML داخل التطبيق إطلاقاً (القاعدة 1).
 *
 * القسم 5 (U7): مطابقة عرض الورق المختار (58mm/80mm)، خط واضح، شعار + QR،
 * ورقم فاتورة كامل معزول الاتجاه بصيغة واحدة، واسم «الشاردة ستور» + Alnafar Store.
 */

/** الاسم العربي الموحّد الرسمي (قرار معتمد: «الشاردة» بالتاء المربوطة) */
export const DEFAULT_STORE_NAME_AR = 'الشاردة ستور';
export const DEFAULT_STORE_NAME_EN = 'Alnafar Store';

const AR_FONT =
  "'Cairo','Segoe UI',Tahoma,sans-serif";

export interface ReceiptHtmlContext {
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
  let titleSize = '17px';
  if (paperMM < 100) {
    fontSize = fs === 'large' ? '13px' : fs === 'small' ? '11px' : '12px';
    titleSize = fs === 'large' ? '19px' : fs === 'small' ? '16px' : '17px';
  } else {
    fontSize = fs === 'large' ? '15px' : fs === 'small' ? '13px' : '14px';
    titleSize = fs === 'large' ? '21px' : '18px';
  }

  const { ar: storeName, en: storeNameEn } = resolveStoreNames(settings);
  const storeAddr = (settings.store_address || '').trim();
  const storePhone = (settings.store_phone || '').trim();
  const footerMsg = (settings.footer_message || '').trim();

  const fullNumber = String(invoice.invoice_number || '').trim();
  const dailyNo = fullNumber.includes('-') ? fullNumber.split('-')[1] ?? fullNumber : fullNumber;

  const items = parseInvoiceItems(invoice.items);
  const totalPrice =
    Number(invoice.total) ||
    items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
  const discount = Number(invoice.discount) || 0;
  const finalTotal = Math.max(0, totalPrice - discount);
  const paidAmount = Number(invoice.paid_amount ?? finalTotal);
  const remaining = Math.max(0, finalTotal - paidAmount);

  const isFullyPaid = paidAmount >= finalTotal && finalTotal > 0;
  const isPartial = paidAmount > 0 && !isFullyPaid;
  const statusText = isFullyPaid
    ? 'مدفوع بالكامل'
    : isPartial
      ? `المتبقي: ${formatDinar(remaining)}`
      : 'غير مدفوع (آجل)';
  const statusClass = isFullyPaid ? 'ok' : 'due';

  const { assets = {}, qrSvg = '' } = context;
  const headerImg = assets.headerDataUri
    ? `<div class="brandimg"><img src="${assets.headerDataUri}" alt="شعار المتجر" /></div>`
    : assets.logoDataUri
      ? `<div class="brandimg round"><img src="${assets.logoDataUri}" alt="شعار المتجر" /></div>`
      : '';

  const itemsRows = items
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.title)}${item.platform ? ` (${escapeHtml(item.platform)})` : ''}</td>
        <td class="money">${escapeHtml(
          formatDinar(Number(item.price) * (Number(item.quantity) || 1)),
        )}</td>
      </tr>`,
    )
    .join('');

  const qrBlock = qrSvg
    ? `<div class="qr">${qrSvg}<div class="qrcap">امسح الرمز لتتبع حالة الطلب</div></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فاتورة ${escapeHtml(dailyNo)}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:${paperMM}mm;max-width:${paperMM}mm;font-family:${AR_FONT};background:#fff;color:#14171c;font-size:${fontSize};line-height:1.45;direction:rtl}
    @page{margin:1.5mm}
    .r{width:100%;padding:2mm;text-align:center}
    .brandimg img{width:${paperMM <= 58 ? 30 : 40}mm;height:auto;display:block;margin:0 auto 1mm}
    .brandimg.round img{width:18mm;height:18mm;border-radius:50%;background:#fff}
    .bn{font-size:${titleSize};font-weight:900;color:#14171c}
    .be{font-size:${Math.max(9, parseInt(fontSize, 10) - 3)}px;font-weight:600;color:#37454f;letter-spacing:0.2px;margin-bottom:0.5mm}
    .addr{font-size:${Math.max(9, parseInt(fontSize, 10) - 3)}px;color:#37454f;margin-bottom:0.5mm}
    .ltr{direction:ltr;unicode-bidi:isolate;display:inline-block;font-variant-numeric:tabular-nums}
    .sep{border:none;border-top:1px dashed #8a949c;margin:1.5mm 0}
    .on{font-size:${titleSize};font-weight:800;margin:1mm 0;color:#14171c}
    .on .ltr{font-weight:800}
    .cn{font-weight:800;margin-top:0.5mm}
    .cp{color:#37454f}
    table{width:100%;border-collapse:collapse;margin:1mm 0}
    td{text-align:right;padding:0.8mm 0;font-size:${fontSize}}
    td.money{text-align:left;font-weight:800;direction:ltr;unicode-bidi:isolate}
    .discount{font-size:${fontSize};color:#37454f}
    .total{font-size:${titleSize};font-weight:900;margin:1.5mm 0;padding:1mm;border:1.5px solid #14171c;border-radius:1mm}
    .status{font-weight:800;margin:1mm 0;padding:0.5mm 1.5mm;border-radius:1mm;display:inline-block}
    .status.ok{color:#166534;background:#f0fdf4;border:1px solid #bbf7d0}
    .status.due{color:#b91c1c;background:#fef2f2;border:1px solid #fecaca}
    .qr{margin:1mm 0;display:flex;flex-direction:column;align-items:center;gap:0.5mm}
    .qr svg{width:22mm;height:22mm}
    .qrcap{font-size:${Math.max(9, parseInt(fontSize, 10) - 3)}px;color:#37454f}
    .ft{padding-top:0.6mm;border-top:1px dashed #8a949c;font-size:${Math.max(9, parseInt(fontSize, 10) - 3)}px;color:#37454f;margin-top:1mm}
  </style>
</head>
<body>
  <div class="r">
    ${headerImg}
    <div class="bn">${escapeHtml(storeName)}</div>
    <div class="be"><bdi dir="ltr">${escapeHtml(storeNameEn)}</bdi></div>
    ${storeAddr ? `<div class="addr">${escapeHtml(storeAddr)}</div>` : ''}
    <hr class="sep" />
    <div class="on"><span class="ltr">#${escapeHtml(fullNumber)}</span></div>
    <div class="cn">${escapeHtml(invoice.customer_name || 'عميل نقدي')}</div>
    ${invoice.customer_phone ? `<div class="cp"><bdi dir="ltr">${escapeHtml(invoice.customer_phone)}</bdi></div>` : ''}
    <hr class="sep" />
    ${itemsRows ? `<table>${itemsRows}</table>` : '<div class="addr">لا توجد بنود في هذه الفاتورة</div>'}
    ${
      discount > 0
        ? `<div class="discount">الخصم: ${escapeHtml(formatDinar(discount))}</div>`
        : ''
    }
    <div class="total">${escapeHtml(formatDinar(finalTotal))}</div>
    <div class="status ${statusClass}"><bdi>${escapeHtml(statusText)}</bdi></div>
    ${qrBlock}
    ${footerMsg ? `<div class="ft">${escapeHtml(footerMsg)}</div>` : ''}
    ${storePhone ? `<div class="ft"><bdi dir="ltr">${escapeHtml(storePhone)}</bdi></div>` : ''}
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
