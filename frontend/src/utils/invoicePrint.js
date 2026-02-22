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

export async function openInvoicePrintWindow(invoice, invSettings = {}) {
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

  // Fetch logo as data URL for better reliability
  let logoDataUrl = ''
  try {
    const res = await fetch(`${origin}/invoice-header.png?v=${Date.now()}`, { mode: 'cors' })
    if (res.ok) {
      const blob = await res.blob()
      logoDataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(r.result)
        r.onerror = reject
        r.readAsDataURL(blob)
      })
    }
    if (!logoDataUrl) {
      const res2 = await fetch(`${origin}/logo.png?v=${Date.now()}`, { mode: 'cors' })
      if (res2.ok) {
        const blob2 = await res2.blob()
        logoDataUrl = await new Promise((resolve, reject) => {
          const r = new FileReader()
          r.onload = () => resolve(r.result)
          r.onerror = reject
          r.readAsDataURL(blob2)
        })
      }
    }
  } catch (_) { }

  // Generate QR code data URL first
  let qrDataUrl = '';
  try {
    const qrcodeLib = await import('qrcode');
    const qrCanvas = document.createElement('canvas');
    const trackingUrl = `${origin}/#/track/${encodeURIComponent(fullNumber)}`;
    await qrcodeLib.toCanvas(qrCanvas, trackingUrl, { width: 100, margin: 1 });
    qrDataUrl = qrCanvas.toDataURL();
  } catch (e) {
    console.error('QR generation error:', e);
  }

  const invoiceHTML = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>فاتورة ${dailyNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${paperMM}mm; max-width: ${paperMM}mm; overflow-x: hidden; font-family: Tahoma, Arial, sans-serif; background: #fff; color: #000; font-size: ${fontSize}; line-height: 1.25; direction: rtl; }
    @page { size: ${paperMM}mm auto; margin: 2mm; }
    .receipt { width: 100%; max-width: ${paperMM}mm; margin: 0 auto; padding: 1mm; background: #fff; }
    .logo { text-align: center; margin: 0 0 1mm 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .logo img { display: block; margin: 0 auto; max-width: ${logoW}; max-height: ${logoH}; width: auto; height: auto; object-fit: contain; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .store-name-ar { font-size: ${titleSize}; font-weight: bold; text-align: center; margin: 0.1mm 0 1px 0; }
    .store-name-en { font-size: ${fontSize}; font-weight: bold; text-align: center; margin: 0 0 1px 0; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .subtitle { font-size: calc(${fontSize} - 1px); text-align: center; margin-bottom: 0px; }
    .subtitle.store-contact { font-size: calc(${fontSize} + 2px); font-weight: 700; margin: 0.5px 0; }
    .section-title { font-size: ${fontSize}; font-weight: bold; margin: 2px 0 1px 0; text-align: right; }
    .separator { border-top: 1px dashed #999; margin: 1px 0; }
    .info-row { display: flex; justify-content: space-between; margin: 1px 0; gap: 4px; }
    .info-label { font-weight: bold; color: #000; flex-shrink: 0; }
    .info-value { text-align: left; color: #000; word-break: break-word; }
    .item-row { display: flex; justify-content: space-between; margin: 1px 0; padding: 1px 0; border-bottom: 1px dashed #ddd; gap: 4px; }
    .item-name { text-align: right; word-break: break-all; flex: 1; min-width: 0; }
    .item-price { text-align: left; font-weight: bold; direction: ltr; flex-shrink: 0; }
    .total-row { display: flex; justify-content: space-between; margin-top: 2px; padding-top: 2px; border-top: 2px solid #000; font-size: ${fontSize}; font-weight: bold; }
    .total-label { text-align: right; }
    .total-value { text-align: left; direction: ltr; }
    .footer { text-align: center; font-size: calc(${fontSize} - 2px); color: #555; margin-top: 2px; line-height: 1.2; }
    .customer-badge { font-size: ${titleSize}; font-weight: 900; background-color: #eee; padding: 2px 5px; border-radius: 4px; display: inline-block; margin: 2px 0; border: 1px solid #000; }
    .qa-section { margin-top: 5px; border: 1px solid #000; padding: 3px; font-size: calc(${fontSize} - 1px); }
    .qa-title { font-weight: bold; text-align: center; border-bottom: 1px solid #000; margin-bottom: 3px; padding-bottom: 1px; }
    .qa-item { display: flex; align-items: center; margin: 2px 0; }
    .qa-box { width: 10px; height: 10px; border: 1px solid #000; margin-left: 5px; display: inline-block; }
    .qr-container { text-align: center; margin-top: 5px; }
    .qr-container img { max-width: 30mm; }
    .qr-label { font-size: 10px; font-weight: bold; margin-top: -3px; }
    @media print { body { margin: 0; padding: 0; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="logo">
      ${logoDataUrl ? `<img src="${logoDataUrl}" alt="شعار المتجر" />` : ''}
    </div>
    <div class="store-name-ar">${storeName}</div>
    <div class="subtitle store-name-en">${storeNameEn}</div>
    ${storeAddr ? `<div class="subtitle store-contact">📍 ${storeAddr}</div>` : ''}
    ${storePhone ? `<div class="subtitle store-contact">📞 ${storePhone}</div>` : ''}
    <div class="subtitle">رقم: ${dailyNo}</div>
    <div class="subtitle">${new Date(invoice.created_at).toLocaleString('ar-LY')}</div>
    
    <div class="separator"></div>
    
    <div class="section-title">بيانات العميل</div>
    <div class="text-center" style="margin-bottom: 3px;">
      <div class="customer-badge">${invoice.customer_name || ''}</div>
    </div>
    <div class="info-row">
      <span class="info-label">الهاتف:</span>
      <span class="info-value">${invoice.customer_phone || ''}</span>
    </div>
    ${notes ? `
    <div class="info-row">
      <span class="info-label">ملاحظات:</span>
      <span class="info-value">${notes}</span>
    </div>` : ''}
    
    <div class="separator"></div>
    
    <div class="section-title">تفاصيل الطلب</div>
    ${items.filter(i => i.type !== 'service').map(item => `
    <div class="item-row">
      <span class="item-name">[ ] ${item.title}</span>
      <span class="item-price">${currency(item.price)}</span>
    </div>`).join('')}
    ${items.filter(i => i.type === 'service').length ? `
    <div class="separator"></div>
    <div class="section-title">الخدمات</div>
    ${items.filter(i => i.type === 'service').map(s => `
    <div class="item-row">
      <span class="item-name">[ ] ${s.title}</span>
      <span class="item-price">${currency(s.price)}</span>
    </div>`).join('')}` : ''}
    
    <div class="separator"></div>
    ${(invoice.total_size_gb > 0 || invoice.totalSize > 0) ? `
    <div class="info-row">
      <span class="info-label">إجمالي الحجم:</span>
      <span class="info-value" style="direction: ltr;">${Number(invoice.total_size_gb || invoice.totalSize).toFixed(2)} GB</span>
    </div>` : ''}
    
    ${invoice.discount > 0 ? `
    <div class="info-row">
      <span class="info-label">المجموع قبل الخصم:</span>
      <span class="info-value">${currency(invoice.total)}</span>
    </div>
    <div class="info-row">
      <span class="info-label">الخصم:</span>
      <span class="info-value">-${currency(invoice.discount)}</span>
    </div>` : ''}
    <div class="total-row">
      <span class="total-label">الإجمالي النهائي:</span>
      <span class="total-value">${currency((invoice.total || 0) - (invoice.discount || 0))}</span>
    </div>
    
    <div class="qa-section">
      <div class="qa-title">QA Checklist</div>
      <div class="qa-item"><span class="qa-box"></span> عدد الألعاب مطابق (${items.filter(i => i.type !== 'service').length})</div>
      <div class="qa-item"><span class="qa-box"></span> مساحة الجهاز تكفي (${(invoice.total_size_gb > 0 || invoice.totalSize > 0) ? Number(invoice.total_size_gb || invoice.totalSize).toFixed(2) + ' GB' : '-'})</div>
    </div>
    
    ${showFooter && footerMsg ? `
    <div class="footer">
      <div>${footerMsg}</div>
    </div>` : ''}
    <div class="qr-container">
      ${qrDataUrl ? `<img src="${qrDataUrl}" alt="تتبع الطلب" /><div class="qr-label">تتبع طلبك عبر مسح الرمز</div>` : ''}
    </div>
  </div>
  <script>
    (function(){
      function doPrint(){ try { window.print(); } catch(e) {} }
      const imgs = Array.from(document.images || [])
      const waitImgs = imgs.length
        ? Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(res => { img.onload = img.onerror = res })))
        : Promise.resolve()
      const timeout = new Promise(r => setTimeout(r, 2000))
      Promise.race([waitImgs, timeout]).then(() => setTimeout(doPrint, 150))
    })();
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=400,height=700');
  if (printWindow) {
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  }
}

export async function reprintInvoice(invoice) {
  try {
    const invSettings = await getInvoiceSettings()
    const fullInvoice = invoice.items ? invoice : await fetchFullInvoice(invoice.invoice_number)
    openInvoicePrintWindow(fullInvoice, invSettings)
    try {
      await api.post(`/invoices/${encodeURIComponent(String(invoice.invoice_number || fullInvoice.invoice_number))}/mark-printed`)
    } catch (_) { }
  } catch (err) {
    console.error('فشل في إعادة الطباعة:', err)
    throw err
  }
}
