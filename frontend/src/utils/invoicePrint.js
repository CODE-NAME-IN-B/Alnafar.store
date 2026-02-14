import { api } from '../api'

function currency(num) {
  return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(num)
}

export async function getInvoiceSettings() {
  try {
    const { data } = await api.get('/invoice-settings')
    return data?.settings || {}
  } catch (_) {
    return {}
  }
}

export async function fetchFullInvoice(invoiceNumber) {
  const { data } = await api.get(`/invoices/${encodeURIComponent(invoiceNumber)}`)
  return data
}

export function openInvoicePrintWindow(invoice, invSettings = {}) {
  const paperMM = Number(invSettings?.paper_width) || 58
  const fs = String(invSettings?.font_size || 'normal').toLowerCase()
  const fontSize = paperMM <= 58 ? '11px' : (fs === 'large' ? '12px' : fs === 'small' ? '10px' : '11px')
  const titleSize = paperMM <= 58 ? '13px' : (fs === 'large' ? '15px' : fs === 'small' ? '13px' : '14px')
  const storeName = (invSettings?.store_name || '').trim() || 'الشارده للإلكترونيات'
  const storeNameEn = (invSettings?.store_name_english || '').trim() || 'Alnafar Store'
  const storeAddr = invSettings?.store_address || ''
  const storePhone = invSettings?.store_phone || ''
  const storeEmail = invSettings?.store_email || ''
  const storeWeb = invSettings?.store_website || ''
  const footerMsg = invSettings?.footer_message || 'شكراً لتسوقكم معنا'
  const showStoreInfo = !!Number(invSettings?.show_store_info ?? 1)
  const showFooter = !!Number(invSettings?.show_footer ?? 1)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const logoUrl = `${origin}/invoice-header.png?v=${Date.now()}`
  const logoFallback = `${origin}/logo.png`

  const fullNumber = String(invoice.invoice_number || '')
  const dailyNo = fullNumber.includes('-') ? String(parseInt(fullNumber.split('-')[1], 10)) : fullNumber
  const notes = invoice.notes ?? invoice.customer_notes ?? ''

  const items = Array.isArray(invoice.items) ? invoice.items : (() => {
    try { return JSON.parse(invoice.items || '[]') } catch { return [] }
  })()

  const logoW = paperMM <= 58 ? '42mm' : '48mm'
  const logoH = paperMM <= 58 ? '12mm' : '14mm'

  const invoiceHTML = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${paperMM}mm">
  <title>فاتورة ${dailyNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${paperMM}mm; max-width: ${paperMM}mm; overflow-x: hidden; font-family: Tahoma, Arial, sans-serif; background: #fff; color: #000; direction: rtl; line-height: 1.25; font-size: ${fontSize}; }
    @page { size: ${paperMM}mm auto; margin: 2mm; }
    .receipt { width: 100%; max-width: ${paperMM}mm; margin: 0 auto; padding: 1mm 1mm; }
    .logo { text-align: center; margin: 0 0 1mm 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .logo img { display: block; margin: 0 auto; max-width: ${logoW}; width: auto; height: auto; max-height: ${logoH}; object-fit: contain; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .store-name-ar { font-size: ${titleSize}; font-weight: bold; text-align: center; margin: 0; }
    .subtitle { font-size: ${fontSize}; text-align: center; margin-bottom: 0; }
    .section-title { font-size: ${fontSize}; font-weight: bold; margin: 1px 0; text-align: right; }
    .separator { border-top: 1px dashed #999; margin: 1px 0; }
    .info-row { display: flex; justify-content: space-between; margin: 0; gap: 2px; font-size: ${fontSize}; }
    .info-label { flex-shrink: 0; }
    .info-value { text-align: left; word-break: break-all; max-width: 60%; }
    .item-row { display: flex; justify-content: space-between; margin: 0; padding: 0; border-bottom: 1px dashed #ddd; gap: 2px; font-size: ${fontSize}; }
    .item-name { text-align: right; word-break: break-all; flex: 1; min-width: 0; }
    .item-price { text-align: left; font-weight: bold; direction: ltr; flex-shrink: 0; }
    .total-row { display: flex; justify-content: space-between; margin-top: 1px; padding-top: 1px; border-top: 2px solid #000; font-weight: bold; font-size: ${fontSize}; }
    .footer { text-align: center; font-size: ${paperMM <= 58 ? '10px' : '8px'}; color: #555; margin-top: 1px; line-height: 1.2; }
    @media print { html, body { width: ${paperMM}mm; max-width: ${paperMM}mm; margin: 0; padding: 0; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="logo">
      <img src="${logoUrl}" alt="شعار المتجر" onerror="this.onerror=null; this.src='${logoFallback}'; this.style.maxWidth='${logoW}'; this.style.maxHeight='${logoH}';" />
    </div>
    <div class="store-name-ar">${storeName}</div>
    <div class="subtitle">${storeNameEn}</div>
    <div class="subtitle">رقم: ${dailyNo}</div>
    <div class="subtitle">${new Date(invoice.created_at).toLocaleString('ar-LY')}</div>
    <div class="subtitle">الحالة: ${(invoice.status || '') === 'paid' ? 'تم الدفع' : 'غير خالص'}</div>
    <div class="separator"></div>
    <div class="section-title">بيانات العميل</div>
    <div class="info-row"><span class="info-label">الاسم:</span><span class="info-value">${invoice.customer_name || ''}</span></div>
    <div class="info-row"><span class="info-label">الهاتف:</span><span class="info-value">${invoice.customer_phone || ''}</span></div>
    ${notes ? `<div class="info-row"><span class="info-label">ملاحظات:</span><span class="info-value">${notes}</span></div>` : ''}
    <div class="separator"></div>
    <div class="section-title">تفاصيل الطلب</div>
    ${(() => { const games = items.filter(i => i.type !== 'service'); return (games.length ? games : items); })().map(item => `
    <div class="item-row">
      <span class="item-name">${item.title || ''}</span>
      <span class="item-price">${currency(item.price || 0)}</span>
    </div>`).join('')}
    ${(() => { const svc = items.filter(i => i.type === 'service'); return svc; })().length ? `
    <div class="separator"></div>
    <div class="section-title">الخدمات</div>
    ${items.filter(i => i.type === 'service').map(s => `
    <div class="item-row">
      <span class="item-name">${s.title || ''}</span>
      <span class="item-price">${currency(s.price || 0)}</span>
    </div>`).join('')}` : ''}
    <div class="total-row">
      <span>الإجمالي النهائي:</span>
      <span>${currency((invoice.total || 0) - (invoice.discount || 0))}</span>
    </div>
    ${showStoreInfo && (storeAddr || storePhone || storeEmail || storeWeb) ? `
    <div class="separator"></div>
    <div class="section-title">معلومات المتجر</div>
    ${storeAddr ? `<div class="info-row"><span class="info-label">العنوان:</span><span class="info-value">${storeAddr}</span></div>` : ''}
    ${storePhone ? `<div class="info-row"><span class="info-label">الهاتف:</span><span class="info-value">${storePhone}</span></div>` : ''}
    ${storeEmail ? `<div class="info-row"><span class="info-label">البريد:</span><span class="info-value">${storeEmail}</span></div>` : ''}
    ${storeWeb ? `<div class="info-row"><span class="info-label">الموقع:</span><span class="info-value">${storeWeb}</span></div>` : ''}
    ` : ''}
    ${showFooter && footerMsg ? `<div class="footer"><div>${footerMsg}</div></div>` : ''}
  </div>
  <script>
    (function(){
      var img = document.querySelector('.logo img');
      function doPrint(){ try { window.print(); } catch(e) {} }
      if (img) {
        if (img.complete) setTimeout(doPrint, 150);
        else { img.onload = function(){ setTimeout(doPrint, 150); }; setTimeout(doPrint, 2000); }
      } else setTimeout(doPrint, 300);
    })();
  </script>
</body>
</html>`

  const printWindow = window.open('', '_blank', 'width=400,height=700')
  if (printWindow) {
    printWindow.document.write(invoiceHTML)
    printWindow.document.close()
  }
}

export async function reprintInvoice(invoice) {
  try {
    const invSettings = await getInvoiceSettings()
    const fullInvoice = invoice.items ? invoice : await fetchFullInvoice(invoice.invoice_number)
    openInvoicePrintWindow(fullInvoice, invSettings)
    try {
      await api.post(`/invoices/${encodeURIComponent(String(invoice.invoice_number || fullInvoice.invoice_number))}/mark-printed`)
    } catch (_) {}
  } catch (err) {
    console.error('فشل في إعادة الطباعة:', err)
    throw err
  }
}
