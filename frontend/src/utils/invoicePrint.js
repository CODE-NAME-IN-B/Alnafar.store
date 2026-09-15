import { api } from '../api'
import logoBase64 from './logoBase64'

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

  const logoW = paperMM <= 58 ? '38mm' : '42mm'
  const logoH = paperMM <= 58 ? '10mm' : '12mm'

  // Generate QR
  let qrDataUrl = ''
  const trackingUrl = `${origin}/#/track/${encodeURIComponent(fullNumber)}`
  try {
    const qrcodeLib = await import('qrcode')
    const qrCanvas = document.createElement('canvas')
    await qrcodeLib.toCanvas(qrCanvas, trackingUrl, { width: 100, margin: 1, errorCorrectionLevel: 'M' })
    qrDataUrl = qrCanvas.toDataURL('image/png')
  } catch (e) {
    try {
      qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(trackingUrl)}&format=png`
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

  // Status logic
  const isFullyPaid = paidAmount >= finalTotal && finalTotal > 0
  const isPartialPayment = paidAmount > 0 && !isFullyPaid
  const statusText = isFullyPaid ? 'مدفوع بالكامل' : (isPartialPayment ? `المتبقي: ${currency(remaining)}` : 'غير مدفوع')
  const statusClass = isFullyPaid ? 'ok' : 'due'

  const storeAddr = (invSettings?.store_address || '').trim()

  const invoiceHTML = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فاتورة ${dailyNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:${paperMM}mm;max-width:${paperMM}mm;overflow-x:hidden;font-family:'Cairo',Tahoma,Arial,sans-serif;background:#fff;color:#111;font-size:${fontSize};line-height:1.25;direction:rtl}
    @page{size:${paperMM}mm auto;margin:1mm}
    .r{width:100%;padding:1.5mm 2mm;text-align:center}
    .logo{margin-bottom:0.8mm}
    .logo img{display:block;margin:0 auto;max-width:${logoW};max-height:${logoH};object-fit:contain}
    .bn{font-size:${titleSize};font-weight:900;color:#111}
    .be{font-size:calc(${fontSize} - 1px);font-weight:600;color:#555;margin-bottom:0.3mm}
    .addr{font-size:calc(${fontSize} - 2px);color:#777;margin-bottom:0.5mm}
    .sep{border:none;border-top:1px dashed #bbb;margin:0.8mm 0}
    .on{font-size:calc(${fontSize} - 1px);font-weight:700;padding:0.5mm 0;color:#333}
    .ci{margin:0.5mm 0}
    .cn{font-size:calc(${fontSize} + 1px);font-weight:800}
    .cp{font-size:${fontSize};color:#444}
    .total{font-size:calc(${fontSize} + 3px);font-weight:900;margin:1mm 0;padding:0.8mm;border:1.5px solid #222;border-radius:1mm}
    .status{font-size:calc(${fontSize} - 1px);font-weight:700;margin:0.5mm 0;padding:0.3mm 1mm;border-radius:1mm;display:inline-block}
    .status.ok{color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0}
    .status.due{color:#dc2626;background:#fef2f2;border:1px solid #fecaca}
    .qr{padding:0.8mm 0}
    .qr img{max-width:20mm;display:inline-block}
    .qh{font-size:calc(${fontSize} - 2px);color:#888;font-weight:600;margin-top:0.3mm}
    .ft{padding-top:0.5mm;border-top:1px dashed #ccc;font-size:calc(${fontSize} - 1px);color:#666}
    @media print{body{margin:0;padding:0}}
  </style>
</head>
<body>
  <div class="r">
    <div class="logo">
      <img src="${logoBase64}" alt="شعار" />
    </div>
    <div class="bn">${storeName}</div>
    <div class="be">${storeNameEn}</div>
    ${storeAddr ? `<div class="addr">${storeAddr}</div>` : ''}
    <hr class="sep" />
    <div class="on">#${dailyNo}</div>
    <div class="ci">
      <div class="cn">${invoice.customer_name || 'عميل نقدي'}</div>
      ${invoice.customer_phone ? `<div class="cp">${invoice.customer_phone}</div>` : ''}
    </div>
    <div class="total">${currency(finalTotal)}</div>
    <div class="status ${statusClass}">${statusText}</div>
    <div class="qr">
      ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR" />` : ''}
      <div class="qh">امسح لتفاصيل الطلب</div>
    </div>
    ${storePhone ? `<div class="ft">📞 ${storePhone}</div>` : ''}
  </div>
  <script>
    (function(){
      function doPrint(){try{window.print()}catch(e){}}
      var imgs=Array.from(document.images||[]);
      var w=imgs.length?Promise.all(imgs.map(function(i){return i.complete?Promise.resolve():new Promise(function(r){i.onload=i.onerror=r})})):Promise.resolve();
      Promise.race([w,new Promise(function(r){setTimeout(r,4000)})]).then(function(){setTimeout(doPrint,200)});
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
