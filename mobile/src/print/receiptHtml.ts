import type { InvoiceSettings } from '@/api/types';
import { parseInvoiceItems, type InvoiceRecord } from '@/api/invoices';
import { formatDinar } from '@/lib/money';

/**
 * توليد HTML داخلي لـ `expo-print` فقط (لتحويل الفاتورة إلى PDF أو إرسالها لطابعة النظام).
 * لا يُعرض هذا الـ HTML داخل التطبيق إطلاقاً (القاعدة 1).
 */
export function buildReceiptHtml(invoice: InvoiceRecord, settings: InvoiceSettings = {}): string {
  const paperMM = Number(settings.paper_width) || 58;
  const fs = String(settings.font_size || 'normal').toLowerCase();

  let fontSize = '11px';
  let titleSize = '15px';
  if (paperMM <= 58) {
    fontSize = '11px';
    titleSize = '15px';
  } else if (paperMM < 100) {
    fontSize = fs === 'large' ? '12px' : fs === 'small' ? '10px' : '11px';
    titleSize = fs === 'large' ? '17px' : fs === 'small' ? '14px' : '15px';
  } else {
    fontSize = fs === 'large' ? '14px' : fs === 'small' ? '12px' : '13px';
    titleSize = fs === 'large' ? '20px' : fs === 'small' ? '16px' : '18px';
  }

  const storeName = (settings.store_name || '').trim() || 'الشارده للإلكترونيات';
  const storeNameEn = (settings.store_name_english || '').trim() || 'Alnafar Store';
  const storeAddr = (settings.store_address || '').trim();
  const storePhone = (settings.store_phone || '').trim();
  const footerMsg = (settings.footer_message || '').trim();

  const fullNumber = String(invoice.invoice_number || '');
  const dailyNo = fullNumber.includes('-')
    ? String(parseInt(fullNumber.split('-')[1] ?? fullNumber, 10))
    : fullNumber;

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

  const itemsRows = items
    .map(
      (item) => `
      <tr>
        <td style="text-align:right;padding:1mm 0;">${escapeHtml(item.title)}${
          item.platform ? ` (${escapeHtml(item.platform)})` : ''
        }</td>
        <td style="text-align:left;padding:1mm 0;font-weight:700;">${escapeHtml(
          formatDinar(Number(item.price) * (Number(item.quantity) || 1))
        )}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فاتورة ${escapeHtml(dailyNo)}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:${paperMM}mm;max-width:${paperMM}mm;font-family:Tahoma,Arial,sans-serif;background:#fff;color:#111;font-size:${fontSize};line-height:1.35;direction:rtl}
    @page{size:${paperMM}mm auto;margin:1.5mm}
    .r{width:100%;padding:2mm;text-align:center}
    .bn{font-size:${titleSize};font-weight:900;color:#111}
    .be{font-size:10px;font-weight:600;color:#555;margin-bottom:1mm}
    .addr{font-size:10px;color:#666;margin-bottom:1mm}
    .sep{border:none;border-top:1px dashed #999;margin:1.5mm 0}
    .on{font-size:${titleSize};font-weight:800;margin:1mm 0;color:#111}
    .cn{font-weight:800;margin-top:0.5mm}
    .cp{color:#444;font-size:10px}
    table{width:100%;border-collapse:collapse;margin:1.5mm 0;font-size:10px}
    .total{font-size:${titleSize};font-weight:900;margin:1.5mm 0;padding:1mm;border:1.5px solid #111;border-radius:1mm}
    .status{font-weight:700;margin:1mm 0;padding:0.5mm 1.5mm;border-radius:1mm;display:inline-block}
    .status.ok{color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0}
    .status.due{color:#dc2626;background:#fef2f2;border:1px solid #fecaca}
    .ft{padding-top:1mm;border-top:1px dashed #ccc;font-size:10px;color:#555;margin-top:1.5mm}
  </style>
</head>
<body>
  <div class="r">
    <div class="bn">${escapeHtml(storeName)}</div>
    <div class="be">${escapeHtml(storeNameEn)}</div>
    ${storeAddr ? `<div class="addr">${escapeHtml(storeAddr)}</div>` : ''}
    <hr class="sep" />
    <div class="on">#${escapeHtml(dailyNo)}</div>
    <div class="cn">${escapeHtml(invoice.customer_name || 'عميل نقدي')}</div>
    ${invoice.customer_phone ? `<div class="cp">${escapeHtml(invoice.customer_phone)}</div>` : ''}
    <hr class="sep" />
    <table>${itemsRows}</table>
    ${
      discount > 0
        ? `<div style="font-size:10px;color:#555;">الخصم: ${escapeHtml(formatDinar(discount))}</div>`
        : ''
    }
    <div class="total">${escapeHtml(formatDinar(finalTotal))}</div>
    <div class="status ${statusClass}">${escapeHtml(statusText)}</div>
    ${footerMsg ? `<div class="ft">${escapeHtml(footerMsg)}</div>` : ''}
    ${storePhone ? `<div class="ft">📞 ${escapeHtml(storePhone)}</div>` : ''}
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
