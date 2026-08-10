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

  const finalTotal = (invoice.total || 0) - (invoice.discount || 0);
  const paidAmount = invoice.paid_amount || 0;
  const remaining = finalTotal - paidAmount;
  let statusText, statusIcon;
  if (paidAmount <= 0) { statusText = 'غير مدفوع'; statusIcon = '○'; }
  else if (paidAmount >= finalTotal) { statusText = 'مدفوع بالكامل'; statusIcon = '●'; }
  else { statusText = 'مدفوع جزئياً'; statusIcon = '◐'; }

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
      -webkit-font-smoothing: antialiased;
    }
    @page {
      size: ${paperMM}mm auto;
      margin: 2mm;
    }

    .receipt {
      width: 100%;
      max-width: ${paperMM}mm;
      margin: 0 auto;
      padding: 2mm;
      background: #fff;
    }

    /* ─── HEADER ─── */
    .header {
      text-align: center;
      padding-bottom: 2mm;
      border-bottom: 2px solid #000;
      margin-bottom: 2mm;
    }
    .logo { text-align: center; margin-bottom: 1mm; }
    .logo img {
      display: block;
      margin: 0 auto;
      max-width: ${logoW};
      max-height: ${logoH};
      width: auto;
      height: auto;
      object-fit: contain;
    }
    .store-name-ar {
      font-size: ${titleSize};
      font-weight: 900;
      text-align: center;
      margin: 0;
      letter-spacing: -0.3px;
    }
    .store-name-en {
      font-size: calc(${fontSize} - 1px);
      font-weight: 600;
      text-align: center;
      margin: 0 0 1px 0;
      color: #333;
    }
    .store-contact {
      font-size: calc(${fontSize} - 1px);
      font-weight: 600;
      margin: 1px 0;
      color: #222;
    }
    .invoice-meta {
      margin-top: 1.5mm;
      padding: 1.5mm;
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 2px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin: 0.5px 0;
      font-size: ${fontSize};
    }
    .meta-label { font-weight: 700; }
    .meta-value { text-align: left; direction: ltr; }
    .status-badge {
      display: inline-block;
      padding: 0.5mm 2mm;
      border-radius: 2px;
      font-weight: 800;
      font-size: calc(${fontSize} - 1px);
      border: 1px solid #000;
    }
    .status-paid { background: #e0ffe0; }
    .status-partial { background: #fff3cd; }
    .status-unpaid { background: #ffe0e0; }

    /* ─── CUSTOMER ─── */
    .section-header {
      font-size: ${fontSize};
      font-weight: 800;
      margin: 2mm 0 1mm 0;
      padding-bottom: 0.5mm;
      border-bottom: 1px dashed #999;
    }
    .customer-box {
      padding: 1.5mm;
      border: 1px solid #ccc;
      border-radius: 2px;
      background: #fafafa;
      margin-bottom: 1mm;
    }
    .customer-name {
      font-size: calc(${fontSize} + 2px);
      font-weight: 900;
      text-align: center;
      margin-bottom: 0.5mm;
    }
    .customer-info {
      display: flex;
      justify-content: space-between;
      font-size: calc(${fontSize} - 1px);
    }

    /* ─── ITEMS ─── */
    .items-header {
      display: flex;
      justify-content: space-between;
      padding: 1mm 0;
      border-bottom: 2px solid #000;
      font-weight: 800;
      font-size: calc(${fontSize} - 1px);
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1mm 0;
      border-bottom: 1px dotted #ccc;
      gap: 4px;
    }
    .item-row:last-child { border-bottom: none; }
    .item-details { flex: 1; min-width: 0; text-align: right; }
    .item-name { font-weight: 700; word-break: break-all; font-size: ${fontSize}; }
    .item-meta { font-size: calc(${fontSize} - 2px); color: #555; margin-top: 0.3mm; }
    .item-price { text-align: left; font-weight: 800; direction: ltr; flex-shrink: 0; font-size: ${fontSize}; }
    .item-size {
      display: inline-block;
      padding: 0.2mm 1.5mm;
      background: #eee;
      border: 1px solid #ccc;
      border-radius: 2px;
      font-size: calc(${fontSize} - 2px);
      color: #333;
    }

    /* ─── TOTALS ─── */
    .totals-box {
      margin-top: 2mm;
      padding: 1.5mm;
      border: 2px solid #000;
      border-radius: 2px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin: 0.5mm 0;
      font-size: ${fontSize};
    }
    .total-row.final {
      font-size: calc(${fontSize} + 2px);
      font-weight: 900;
      padding-top: 1mm;
      margin-top: 1mm;
      border-top: 2px solid #000;
    }
    .payment-row {
      display: flex;
      justify-content: space-between;
      margin: 0.5mm 0;
      font-size: calc(${fontSize} - 1px);
    }
    .payment-row.paid { color: #006600; }
    .payment-row.remaining { color: #990000; font-weight: 700; }

    /* ─── NOTES ─── */
    .notes-box {
      margin-top: 2mm;
      padding: 1.5mm;
      border: 1px dashed #999;
      border-radius: 2px;
    }
    .notes-title { font-weight: 700; margin-bottom: 0.5mm; font-size: calc(${fontSize} - 1px); }
    .notes-text { font-size: calc(${fontSize} - 1px); color: #333; }

    /* ─── QR SECTION ─── */
    .cut-line {
      border-top: 2px dashed #000;
      margin: 3mm 0 2mm 0;
      text-align: center;
      position: relative;
    }
    .cut-label {
      background: #fff;
      padding: 0 3mm;
      position: relative;
      top: -8px;
      font-size: ${fontSize};
      font-weight: 700;
      color: #333;
    }
    .qr-section {
      text-align: center;
      padding: 2mm 0;
    }
    .qr-order-number {
      font-size: calc(${fontSize} + 3px);
      font-weight: 900;
      margin-bottom: 1mm;
    }
    .qr-section img {
      max-width: 35mm;
      display: inline-block;
    }
    .qr-hint {
      font-size: calc(${fontSize} - 2px);
      margin-top: 0.5mm;
      color: #555;
      font-weight: 600;
    }

    /* ─── FOOTER ─── */
    .footer {
      margin-top: 3mm;
      padding-top: 2mm;
      border-top: 1px dashed #999;
      text-align: center;
      font-size: calc(${fontSize} - 2px);
      color: #555;
      line-height: 1.3;
    }
    .footer-msg { font-weight: 700; margin-bottom: 0.5mm; }
    .footer-info { font-size: calc(${fontSize} - 3px); color: #888; }

    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <!-- ══════ HEADER ══════ -->
    <div class="header">
      <div class="logo">
        ${logoDataUrl ? `<img src="${logoDataUrl}" alt="شعار المتجر" />` : ''}
      </div>
      <div class="store-name-ar">${storeName}</div>
      <div class="store-name-en">${storeNameEn}</div>
      ${showStoreInfo ? `
      <div class="store-contact">${storeAddr ? `📍 ${storeAddr}` : ''}</div>
      <div class="store-contact">${storePhone ? `📞 ${storePhone}` : ''}</div>
      ` : ''}
    </div>

    <!-- ══════ INVOICE META ══════ -->
    <div class="invoice-meta">
      <div class="meta-row">
        <span class="meta-label">رقم الفاتورة:</span>
        <span class="meta-value">${dailyNo}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">التاريخ:</span>
        <span class="meta-value">${new Date(invoice.created_at).toLocaleString('ar-LY')}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">الحالة:</span>
        <span class="status-badge ${paidAmount >= finalTotal ? 'status-paid' : paidAmount > 0 ? 'status-partial' : 'status-unpaid'}">${statusIcon} ${statusText}</span>
      </div>
    </div>

    <!-- ══════ CUSTOMER ══════ -->
    <div class="section-header">بيانات العميل</div>
    <div class="customer-box">
      <div class="customer-name">${invoice.customer_name || 'عميل نقدي'}</div>
      <div class="customer-info">
        <span>📞 ${invoice.customer_phone || '—'}</span>
        ${invoice.customer_email ? `<span>✉ ${invoice.customer_email}</span>` : ''}
      </div>
    </div>

    ${notes ? `
    <div class="notes-box">
      <div class="notes-title">ملاحظات:</div>
      <div class="notes-text">${notes}</div>
    </div>` : ''}

    <!-- ══════ ITEMS ══════ -->
    <div class="section-header">المنتجات</div>
    <div class="items-header">
      <span>الصنف</span>
      <span>السعر</span>
    </div>
    ${items.map(item => `
    <div class="item-row">
      <div class="item-details">
        <div class="item-name">${item.name || item.game_name || ''}</div>
        <div class="item-meta">
          ${item.type === 'service' ? `<span class="item-size">خدمة</span>` : ''}
          ${item.genre ? `<span class="item-size">${item.genre}</span>` : ''}
          ${(item.size_gb || item.size) ? `<span class="item-size">${item.size_gb || item.size} GB</span>` : ''}
          ${item.quantity && item.quantity > 1 ? `<span class="item-size">×${item.quantity}</span>` : ''}
          ${item.type === 'service' && item.time_value && item.time_unit ? `<span class="item-size">${item.time_value} ${item.time_unit === 'month' ? 'شهر' : item.time_unit === 'year' ? 'سنة' : item.time_unit}</span>` : ''}
        </div>
      </div>
      <div class="item-price">${currency(item.price || 0)}</div>
    </div>`).join('')}

    <!-- ══════ TOTALS ══════ -->
    <div class="totals-box">
      <div class="total-row">
        <span>الإجمالي</span>
        <span>${currency(invoice.total || 0)}</span>
      </div>
      ${invoice.discount > 0 ? `
      <div class="total-row">
        <span>الخصم</span>
        <span>-${currency(invoice.discount)}</span>
      </div>` : ''}
      <div class="total-row final">
        <span>الإجمالي النهائي</span>
        <span>${currency(finalTotal)}</span>
      </div>
      <div class="total-row payment-row paid">
        <span>المدفوع</span>
        <span>${currency(paidAmount)}</span>
      </div>
      ${remaining > 0 ? `
      <div class="total-row payment-row remaining">
        <span>المتبقي</span>
        <span>${currency(remaining)}</span>
      </div>` : ''}
    </div>

    ${showFooter && footerMsg ? `
    <div class="footer">
      <div class="footer-msg">${footerMsg}</div>
      ${storeNameEn ? `<div class="footer-info">${storeNameEn}</div>` : ''}
    </div>` : ''}

    <!-- ══════ QR SECTION ══════ -->
    <div class="cut-line">
      <span class="cut-label">✂ قص هنا ✂</span>
    </div>

    <div class="qr-section">
      <div class="qr-order-number">رقم الطلب: ${dailyNo}</div>
      ${qrDataUrl ? `
      <img src="${qrDataUrl}" alt="تتبع الطلب" />
      <div class="qr-hint">امسح الكود لتفاصيل الطلب</div>` : ''}
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
