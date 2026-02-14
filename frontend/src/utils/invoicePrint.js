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
  const fontSize = fs === 'large' ? '12px' : fs === 'small' ? '10px' : '11px'
  const titleSize = fs === 'large' ? '15px' : fs === 'small' ? '13px' : '14px'
  const storeName = (invSettings?.store_name || '').trim() || 'الشارده للإلكترونيات'
  const storeNameEn = (invSettings?.store_name_english || '').trim() || 'Alnafar Store'
  const storeAddr = invSettings?.store_address || ''
  const storePhone = invSettings?.store_phone || ''
  const storeEmail = invSettings?.store_email || ''
  const storeWeb = invSettings?.store_website || ''
  const footerMsg = invSettings?.footer_message || 'شكراً لتسوقكم معنا'
  const showStoreInfo = !!Number(invSettings?.show_store_info ?? 1)
  const showFooter = !!Number(invSettings?.show_footer ?? 1)

  const fullNumber = String(invoice.invoice_number || '')
  const dailyNo = fullNumber.includes('-') ? String(parseInt(fullNumber.split('-')[1], 10)) : fullNumber
  const notes = invoice.notes ?? invoice.customer_notes ?? ''

  const items = Array.isArray(invoice.items) ? invoice.items : (() => {
    try { return JSON.parse(invoice.items || '[]') } catch { return [] }
  })()

  const invoiceHTML = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>فاتورة ${dailyNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Tahoma, Arial, sans-serif; background: #fff; color: #000; direction: rtl; line-height: 1.3; font-size: ${fontSize}; }
    @page { size: ${paperMM}mm auto; margin: 0; }
    .receipt { width: ${paperMM}mm; margin: 0 auto; padding: 2mm 1.5mm; }
    .logo { text-align: center; margin: 1mm 0 0.5mm 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; min-height: 12mm; }
    .logo img { display: block; margin: 0 auto; max-width: 48mm; width: 48mm; max-height: 14mm; height: auto; object-fit: contain; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .store-name-ar { font-size: ${titleSize}; font-weight: bold; text-align: center; margin: 0.1mm 0 1px 0; }
    .subtitle { font-size: calc(${fontSize} - 1px); text-align: center; margin-bottom: 0; }
    .section-title { font-size: ${fontSize}; font-weight: bold; margin: 2px 0 1px 0; text-align: right; }
    .separator { border-top: 1px dashed #999; margin: 1px 0; }
    .info-row { display: flex; justify-content: space-between; margin: 1px 0; gap: 4px; }
    .info-label { font-weight: bold; flex-shrink: 0; }
    .info-value { text-align: left; word-break: break-word; }
    .item-row { display: flex; justify-content: space-between; margin: 1px 0; padding: 1px 0; border-bottom: 1px dashed #ddd; gap: 4px; }
    .item-name { text-align: right; word-break: break-word; flex: 1; }
    .item-price { text-align: left; font-weight: bold; direction: ltr; flex-shrink: 0; min-width: 60px; }
    .total-row { display: flex; justify-content: space-between; margin-top: 2px; padding-top: 2px; border-top: 2px solid #000; font-weight: bold; }
    .footer { text-align: center; font-size: calc(${fontSize} - 2px); color: #555; margin-top: 2px; line-height: 1.2; }
    @media print { body { margin: 0; padding: 0; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="logo">
      <img src="/invoice-header.png?v=${Date.now()}" alt="شعار المتجر" onerror="this.onerror=null; this.src='/logo.png'; this.style.maxWidth='48mm'; this.style.maxHeight='14mm';" />
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
    ${items.map(item => `
    <div class="item-row">
      <span class="item-name">${item.title || ''}</span>
      <span class="item-price">${currency(item.price || 0)}</span>
    </div>`).join('')}
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
</body>
</html>`

  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (printWindow) {
    printWindow.document.write(invoiceHTML)
    printWindow.document.close()
    printWindow.onload = () => setTimeout(() => printWindow.print(), 300)
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
