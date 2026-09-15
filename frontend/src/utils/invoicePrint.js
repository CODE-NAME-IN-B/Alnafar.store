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

function fetchLogoAsDataUrl(origin) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        canvas.getContext('2d').drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } catch (_) { resolve(null) }
    }
    img.onerror = () => resolve(null)
    img.src = `${origin}/invoice-header.png?t=${Date.now()}`
  })
}

function currency(num) {
  const n = Number(num) || 0
  return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(n)
}

export async function openInvoicePrintWindow(invoice, invSettings = {}) {
  const paperMM = Number(invSettings?.paper_width) || 58
  const fs = String(invSettings?.font_size || 'normal').toLowerCase()
  const fontSize = paperMM <= 58 ? '11px' : (fs === 'large' ? '12px' : fs === 'small' ? '10px' : '11px')
  const titleSize = paperMM <= 58 ? '15px' : (fs === 'large' ? '17px' : fs === 'small' ? '14px' : '15px')
  const storeName = (invSettings?.store_name || '').trim() || 'الشارده للإلكترونيات'
  const storeNameEn = (invSettings?.store_name_english || '').trim() || 'Alnafar Store'
  const storePhone = invSettings?.store_phone || ''

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const fullNumber = String(invoice.invoice_number || '')
  const dailyNo = fullNumber.includes('-') ? String(parseInt(fullNumber.split('-')[1], 10)) : fullNumber

  const logoW = paperMM <= 58 ? '44mm' : '50mm'
  const logoH = paperMM <= 58 ? '13mm' : '15mm'

  // Fetch logo as base64 BEFORE opening window
  const logoDataUrl = await fetchLogoAsDataUrl(origin)

  // Generate QR
  let qrDataUrl = ''
  const trackingUrl = `${origin}/#/track/${encodeURIComponent(fullNumber)}`
  try {
    const qrcodeLib = await import('qrcode')
    const qrCanvas = document.createElement('canvas')
    await qrcodeLib.toCanvas(qrCanvas, trackingUrl, { width: 120, margin: 1, errorCorrectionLevel: 'M' })
    qrDataUrl = qrCanvas.toDataURL('image/png')
  } catch (e) {
    try {
      qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(trackingUrl)}&format=png`
    } catch (_) {}
  }

  // Calculate prices
  const items = Array.isArray(invoice.items) ? invoice.items : (() => {
    try { return JSON.parse(invoice.items || '[]') } catch { return [] }
  })()
  const totalPrice = items.reduce((sum, i) => sum + (Number(i.price) || 0), 0)
  const discount = Number(invoice.discount) || 0
  const finalTotal = totalPrice - discount
  const paidAmount = Number(invoice.paid_amount) || 0
  const remaining = finalTotal - paidAmount

  const invoiceHTML = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
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
      color: #1a1a1a;
      font-size: ${fontSize};
      line-height: 1.35;
      direction: rtl;
    }
    @page { size: ${paperMM}mm auto; margin: 1.5mm; }
    .r { width: 100%; padding: 2mm 2.5mm; text-align: center; }

    .logo { margin-bottom: 1.5mm; }
    .logo img { display: block; margin: 0 auto; max-width: ${logoW}; max-height: ${logoH}; object-fit: contain; }

    .brand-name { font-size: ${titleSize}; font-weight: 900; letter-spacing: -0.3px; color: #111; }
    .brand-en { font-size: calc(${fontSize} - 1px); font-weight: 600; color: #555; margin-top: 0.3mm; margin-bottom: 1.5mm; }

    .sep { border: none; border-top: 1.5px dashed #bbb; margin: 1.5mm 0; }

    .order-num {
      font-size: calc(${fontSize} + 4px);
      font-weight: 900;
      color: #000;
      padding: 1.5mm 0;
      letter-spacing: 1px;
    }

    .cust { margin: 1.5mm 0; }
    .cust-name { font-size: calc(${fontSize} + 1px); font-weight: 800; }
    .cust-phone { font-size: ${fontSize}; color: #444; margin-top: 0.3mm; }

    .price-box {
      margin: 2mm 0;
      padding: 1.5mm;
      border: 1.5px solid #222;
      border-radius: 2mm;
    }
    .price-row {
      display: flex;
      justify-content: space-between;
      padding: 0.4mm 0;
      font-size: ${fontSize};
    }
    .price-row.total {
      font-size: calc(${fontSize} + 2px);
      font-weight: 900;
      border-top: 1.5px solid #222;
      margin-top: 0.8mm;
      padding-top: 0.8mm;
    }
    .price-row.paid { color: #16a34a; font-weight: 700; }
    .price-row.due { color: #dc2626; font-weight: 800; }
    .price-label { font-weight: 600; }
    .price-val { font-weight: 800; font-family: 'Cairo', monospace; }

    .qr { padding: 2mm 0; }
    .qr img { max-width: 28mm; display: inline-block; }
    .qr-hint { font-size: calc(${fontSize} - 2px); color: #888; font-weight: 600; margin-top: 0.5mm; }

    .foot {
      margin-top: 1.5mm;
      padding-top: 1mm;
      border-top: 1px dashed #ccc;
      font-size: calc(${fontSize} - 1px);
      color: #666;
    }
    .foot-row { margin: 0.3mm 0; }

    @media print { body { margin: 0; padding: 0; } }
  </style>
</head>
<body>
  <div class="r">
    <div class="logo">
      ${logoDataUrl
        ? `<img src="${logoDataUrl}" alt="شعار" />`
        : `<img src="${origin}/invoice-header.png" onerror="this.onerror=null;this.src='${origin}/logo.png';this.onerror=function(){this.style.display='none'}" alt="شعار" />`
      }
    </div>
    <div class="brand-name">${storeName}</div>
    <div class="brand-en">${storeNameEn}</div>

    <hr class="sep" />

    <div class="order-num">#${dailyNo}</div>

    <div class="cust">
      <div class="cust-name">${invoice.customer_name || 'عميل نقدي'}</div>
      ${invoice.customer_phone ? `<div class="cust-phone">${invoice.customer_phone}</div>` : ''}
    </div>

    <div class="price-box">
      ${items.length > 0 ? `
      <div class="price-row"><span class="price-label">المنتجات (${items.length})</span><span class="price-val">${currency(totalPrice)}</span></div>
      ` : ''}
      ${discount > 0 ? `<div class="price-row"><span class="price-label">الخصم</span><span class="price-val">-${currency(discount)}</span></div>` : ''}
      <div class="price-row total"><span class="price-label">الإجمالي</span><span class="price-val">${currency(finalTotal)}</span></div>
      <div class="price-row paid"><span class="price-label">المدفوع</span><span class="price-val">${currency(paidAmount)}</span></div>
      ${remaining > 0 ? `<div class="price-row due"><span class="price-label">المتبقي</span><span class="price-val">${currency(remaining)}</span></div>` : ''}
    </div>

    <div class="qr">
      ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR" />` : ''}
      <div class="qr-hint">امسح لتفاصيل الطلب</div>
    </div>

    <div class="foot">
      ${storePhone ? `<div class="foot-row">📞 ${storePhone}</div>` : ''}
      ${origin ? `<div class="foot-row">🌐 ${origin}</div>` : ''}
    </div>
  </div>
  <script>
    (function(){
      function doPrint(){ try { window.print(); } catch(e) {} }
      var imgs = Array.from(document.images || []);
      var wait = imgs.length ? Promise.all(imgs.map(function(i){ return i.complete ? Promise.resolve() : new Promise(function(r){ i.onload=i.onerror=r }) })) : Promise.resolve();
      Promise.race([wait, new Promise(function(r){ setTimeout(r, 4000) })]).then(function(){ setTimeout(doPrint, 300) });
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
    } catch (_) { }
  } catch (err) {
    console.error('فشل في إعادة الطباعة:', err)
    throw err
  }
}
