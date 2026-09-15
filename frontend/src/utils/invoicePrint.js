import { api } from '../api'

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
  const storePhone = invSettings?.store_phone || ''

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const fullNumber = String(invoice.invoice_number || '')
  const dailyNo = fullNumber.includes('-') ? String(parseInt(fullNumber.split('-')[1], 10)) : fullNumber

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
    try {
      qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(trackingUrl)}&format=png`;
    } catch (_) {
      console.error('QR generation failed completely:', e);
    }
  }

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
      line-height: 1.3;
      direction: rtl;
    }
    @page { size: ${paperMM}mm auto; margin: 1.5mm; }
    .receipt { width: 100%; padding: 2mm; text-align: center; }

    .logo { margin-bottom: 1mm; }
    .logo img { display: block; margin: 0 auto; max-width: ${logoW}; max-height: ${logoH}; object-fit: contain; }

    .store-name { font-size: ${titleSize}; font-weight: 900; margin-bottom: 0.5mm; }
    .store-en { font-size: calc(${fontSize} - 1px); font-weight: 600; color: #444; margin-bottom: 1mm; }

    .divider { border-top: 1.5px dashed #000; margin: 1.5mm 0; }

    .order-number { font-size: calc(${fontSize} + 3px); font-weight: 900; margin: 1mm 0; }

    .customer-info { margin: 1mm 0; }
    .customer-name { font-size: calc(${fontSize} + 1px); font-weight: 800; }
    .customer-phone { font-size: ${fontSize}; color: #333; margin-top: 0.5mm; }

    .qr-section { text-align: center; padding: 1.5mm 0; }
    .qr-section img { max-width: 28mm; display: inline-block; }
    .qr-hint { font-size: calc(${fontSize} - 2px); color: #666; font-weight: 600; margin-top: 0.5mm; }

    .contact { margin-top: 1.5mm; padding-top: 1mm; border-top: 1px dashed #999; font-size: calc(${fontSize} - 1px); color: #555; }
    .contact-row { margin: 0.3mm 0; }

    @media print { body { margin: 0; padding: 0; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="logo" id="logo-container">
      <img src="${logoPrimaryUrl}" onerror="this.onerror=null;this.src='${logoFallbackUrl}';this.onerror=function(){this.style.display='none'}" alt="شعار المتجر" />
    </div>
    <div class="store-name">${storeName}</div>
    <div class="store-en">${storeNameEn}</div>

    <div class="divider"></div>

    <div class="order-number">رقم الطلب: ${dailyNo}</div>

    <div class="customer-info">
      <div class="customer-name">${invoice.customer_name || 'عميل نقدي'}</div>
      ${invoice.customer_phone ? `<div class="customer-phone">${invoice.customer_phone}</div>` : ''}
    </div>

    <div class="qr-section">
      ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR" />` : ''}
      <div class="qr-hint">امسح لتفاصيل الطلب</div>
    </div>

    <div class="contact">
      ${storePhone ? `<div class="contact-row">الهاتف: ${storePhone}</div>` : ''}
      ${origin ? `<div class="contact-row">الموقع: ${origin}</div>` : ''}
    </div>
  </div>
  <script>
    (function(){
      function doPrint(){ try { window.print(); } catch(e) {} }
      const imgs = Array.from(document.images || [])
      const waitImgs = imgs.length ? Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(r => { img.onload = img.onerror = r }))) : Promise.resolve()
      Promise.race([waitImgs, new Promise(r => setTimeout(r, 3000))]).then(() => setTimeout(doPrint, 200))
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
