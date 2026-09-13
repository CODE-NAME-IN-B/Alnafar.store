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
  const titleSize = paperMM <= 58 ? '14px' : (fs === 'large' ? '16px' : fs === 'small' ? '13px' : '14px')
  const storeName = (invSettings?.store_name || '').trim() || 'الشارده للإلكترونيات'
  const storeNameEn = (invSettings?.store_name_english || '').trim() || 'Alnafar Store'
  const storeAddr = invSettings?.store_address || ''
  const storePhone = invSettings?.store_phone || ''
  const footerMsg = invSettings?.footer_message || 'شكراً لتسوقكم معنا'
  const showStoreInfo = !!Number(invSettings?.show_store_info ?? 1)
  const showFooter = !!Number(invSettings?.show_footer ?? 1)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const fullNumber = String(invoice.invoice_number || '')
  const dailyNo = fullNumber.includes('-') ? String(parseInt(fullNumber.split('-')[1], 10)) : fullNumber
  const notes = invoice.notes ?? invoice.customer_notes ?? ''

  const items = Array.isArray(invoice.items) ? invoice.items : (() => {
    try { return JSON.parse(invoice.items || '[]') } catch { return [] }
  })()

  const logoW = paperMM <= 58 ? '42mm' : '48mm'
  const logoH = paperMM <= 58 ? '12mm' : '14mm'

  const logoPrimaryUrl = `${origin}/invoice-header.png?v=${Date.now()}`
  const logoFallbackUrl = `${origin}/logo.png?v=${Date.now()}`

  let qrDataUrl = '';
  const trackingUrl = `${origin}/#/track/${encodeURIComponent(fullNumber)}`;
  try {
    const qrcodeLib = await import('qrcode');
    const qrCanvas = document.createElement('canvas');
    await qrcodeLib.toCanvas(qrCanvas, trackingUrl, { width: 100, margin: 1, errorCorrectionLevel: 'M' });
    qrDataUrl = qrCanvas.toDataURL('image/png');
  } catch (e) {
    // Fallback: use QR server API
    try {
      qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(trackingUrl)}&format=png`;
    } catch (_) {
      console.error('QR generation failed completely:', e);
    }
  }

  const finalTotal = (invoice.total || 0) - (invoice.discount || 0);
  const paidAmount = invoice.paid_amount || 0;
  const remaining = finalTotal - paidAmount;
  let statusText, statusIcon;
  if (paidAmount <= 0) { statusText = 'غير مدفوع'; statusIcon = '○'; }
  else if (paidAmount >= finalTotal) { statusText = 'مدفوع بالكامل'; statusIcon = '●'; }
  else { statusText = 'مدفوع جزئياً'; statusIcon = '◐'; }

  // تجميع الألعاب والخدمات
  const games = items.filter(i => i.type !== 'service')
  const services = items.filter(i => i.type === 'service')

  const totalGames = games.length
  const totalSizeGB = games.reduce((sum, g) => sum + (Number(g.size_gb) || 0), 0)
  const gamesPrice = games.reduce((sum, g) => sum + (Number(g.price) || 0), 0)
  const servicesPrice = services.reduce((sum, s) => sum + (Number(s.price) || 0), 0)

  const invoiceHTML = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>فاتورة ${dailyNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${paperMM}mm;
      max-width: ${paperMM}mm;
      overflow-x: hidden;
      font-family: 'Cairo', Tahoma, Arial, sans-serif;
      background: #fff;
      color: #000;
      font-size: ${fontSize};
      line-height: 1.25;
      direction: rtl;
    }
    @page { size: ${paperMM}mm auto; margin: 1.5mm; }
    .receipt { width: 100%; padding: 1.5mm; }

    .header { text-align: center; padding-bottom: 1.5mm; border-bottom: 1.5px solid #000; margin-bottom: 1.5mm; }
    .logo { text-align: center; margin-bottom: 0.5mm; }
    .logo img { display: block; margin: 0 auto; max-width: ${logoW}; max-height: ${logoH}; object-fit: contain; }
    .store-name-ar { font-size: ${titleSize}; font-weight: 900; }
    .store-name-en { font-size: calc(${fontSize} - 1px); font-weight: 600; color: #333; }
    .store-contact { font-size: calc(${fontSize} - 1px); color: #222; margin: 0.5px 0; }

    .meta { margin-top: 1mm; padding: 1mm; background: #f5f5f5; border: 1px solid #ddd; border-radius: 2px; }
    .meta-row { display: flex; justify-content: space-between; font-size: ${fontSize}; margin: 0.3mm 0; }
    .meta-label { font-weight: 700; }
    .status-badge { display: inline-block; padding: 0.3mm 1.5mm; border-radius: 2px; font-weight: 800; font-size: calc(${fontSize} - 1px); border: 1px solid #000; }
    .status-paid { background: #e0ffe0; }
    .status-partial { background: #fff3cd; }
    .status-unpaid { background: #ffe0e0; }

    .customer { margin-top: 1mm; padding: 1mm; border: 1px solid #ccc; border-radius: 2px; background: #fafafa; }
    .customer-name { font-size: calc(${fontSize} + 1px); font-weight: 900; text-align: center; }
    .customer-phone { text-align: center; font-size: calc(${fontSize} - 1px); color: #333; }

    .summary-box { margin-top: 1.5mm; border: 1.5px solid #000; border-radius: 2px; padding: 1.5mm; text-align: center; }
    .summary-title { font-weight: 900; font-size: calc(${fontSize} + 1px); margin-bottom: 1mm; }
    .summary-row { display: flex; justify-content: space-between; font-size: ${fontSize}; padding: 0.3mm 0; }
    .summary-value { font-weight: 800; }

    .totals { margin-top: 1.5mm; border: 1.5px solid #000; border-radius: 2px; padding: 1mm; }
    .total-row { display: flex; justify-content: space-between; margin: 0.3mm 0; font-size: ${fontSize}; }
    .total-row.final { font-size: calc(${fontSize} + 1px); font-weight: 900; padding-top: 0.8mm; margin-top: 0.8mm; border-top: 1.5px solid #000; }
    .payment-row { font-size: calc(${fontSize} - 1px); }
    .payment-row.paid { color: #006600; }
    .payment-row.remaining { color: #990000; font-weight: 700; }

    .notes { margin-top: 1mm; padding: 1mm; border: 1px dashed #999; border-radius: 2px; font-size: calc(${fontSize} - 1px); }

    .cut-line { border-top: 1.5px dashed #000; margin: 2mm 0 1.5mm 0; text-align: center; position: relative; }
    .cut-label { background: #fff; padding: 0 2mm; position: relative; top: -7px; font-size: calc(${fontSize} - 1px); font-weight: 700; }

    .qr-section { text-align: center; padding: 1.5mm 0; }
    .qr-order { font-size: calc(${fontSize} + 2px); font-weight: 900; margin-bottom: 0.5mm; }
    .qr-section img { max-width: 30mm; display: inline-block; }
    .qr-hint { font-size: calc(${fontSize} - 2px); color: #555; font-weight: 600; }

    .footer { margin-top: 2mm; padding-top: 1.5mm; border-top: 1px dashed #999; text-align: center; font-size: calc(${fontSize} - 2px); color: #555; }
    .footer-msg { font-weight: 700; }

    @media print { body { margin: 0; padding: 0; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="logo"><img src="${logoPrimaryUrl}" onerror="this.onerror=null;this.src='${logoFallbackUrl}';this.onerror=function(){this.style.display='none'}" alt="شعار المتجر" /></div>
      <div class="store-name-ar">${storeName}</div>
      <div class="store-name-en">${storeNameEn}</div>
      ${showStoreInfo ? `<div class="store-contact">${storeAddr ? storeAddr : ''} ${storePhone ? storePhone : ''}</div>` : ''}
    </div>

    <div class="meta">
      <div class="meta-row"><span class="meta-label">رقم:</span><span>${dailyNo}</span></div>
      <div class="meta-row"><span class="meta-label">التاريخ:</span><span>${new Date(invoice.created_at).toLocaleString('ar-LY')}</span></div>
      <div class="meta-row"><span class="meta-label">الحالة:</span><span class="status-badge ${paidAmount >= finalTotal ? 'status-paid' : paidAmount > 0 ? 'status-partial' : 'status-unpaid'}">${statusIcon} ${statusText}</span></div>
    </div>

    <div class="customer">
      <div class="customer-name">${invoice.customer_name || 'عميل نقدي'}</div>
      <div class="customer-phone">${invoice.customer_phone || '—'}</div>
    </div>

    ${notes ? `<div class="notes"><b>ملاحظات:</b> ${notes}</div>` : ''}

    <div class="summary-box">
      <div class="summary-title">ملخص الطلب</div>
      ${totalGames > 0 ? `
      <div class="summary-row"><span>عدد الألعاب</span><span class="summary-value">${totalGames} لعبة</span></div>
      ${totalSizeGB > 0 ? `<div class="summary-row"><span>إجمالي الحجم</span><span class="summary-value">${totalSizeGB.toFixed(1)} GB</span></div>` : ''}
      <div class="summary-row"><span>سعر الألعاب</span><span class="summary-value">${currency(gamesPrice)}</span></div>
      ` : ''}
      ${services.length > 0 ? `<div class="summary-row"><span>الخدمات (${services.length})</span><span class="summary-value">${currency(servicesPrice)}</span></div>` : ''}
    </div>

    <div class="totals">
      ${totalGames > 0 ? `<div class="total-row"><span>الألعاب (${totalGames})</span><span>${currency(gamesPrice)}</span></div>` : ''}
      ${services.length > 0 ? `<div class="total-row"><span>الخدمات (${services.length})</span><span>${currency(servicesPrice)}</span></div>` : ''}
      ${invoice.discount > 0 ? `<div class="total-row"><span>الخصم</span><span>-${currency(invoice.discount)}</span></div>` : ''}
      <div class="total-row final"><span>الإجمالي</span><span>${currency(finalTotal)}</span></div>
      <div class="total-row payment-row paid"><span>المدفوع</span><span>${currency(paidAmount)}</span></div>
      ${remaining > 0 ? `<div class="total-row payment-row remaining"><span>المتبقي</span><span>${currency(remaining)}</span></div>` : ''}
    </div>

    ${showFooter && footerMsg ? `<div class="footer"><div class="footer-msg">${footerMsg}</div></div>` : ''}

    <div class="cut-line"><span class="cut-label">قص هنا</span></div>
    <div class="qr-section">
      <div class="qr-order">رقم الطلب: ${dailyNo}</div>
      ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR" /><div class="qr-hint">امسح لتفاصيل الطلب</div>` : ''}
    </div>
  </div>
  <script>
    (function(){
      function doPrint(){ try { window.print(); } catch(e) {} }
      const imgs = Array.from(document.images || [])
      const waitImgs = imgs.length ? Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(r => { img.onload = img.onerror = r }))) : Promise.resolve()
      Promise.race([waitImgs, new Promise(r => setTimeout(r, 2000))]).then(() => setTimeout(doPrint, 100))
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
