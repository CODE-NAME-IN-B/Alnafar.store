import React, { useState, useEffect } from 'react'
import { api } from './api'

function currency(num) {
  return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(num)
}

export default function Invoice({ cart, total, onClose, onSuccess }) {
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const invoiceNumber = `INV-${Date.now()}`
  const currentDate = new Date().toLocaleDateString('ar-LY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  // تبسيط معالجة الطباعة - بدون PDF معقد

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!customerInfo.name.trim() || !customerInfo.phone.trim()) {
      alert('يرجى إدخال الاسم ورقم الهاتف')
      return
    }

    if (cart.length === 0) {
      alert('السلة فارغة')
      return
    }

    // فتح نافذة طباعة مخصصة كجزء من تفاعل المستخدم (موثوق في كل المتصفحات)
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    const payload = {
      invoiceNumber,
      date: new Date().toLocaleString('ar-LY'),
      customerInfo,
      items: cart,
      total
    }

    // ارسم الإيصال كصورة في نافذة الأب لتجنب حظر سكربتات inline في نافذة الطباعة
    const renderReceiptToDataURL = (data) => {
      const dpi = 203 // thermal dpi
      const mm2px = mm => Math.round(mm * dpi / 25.4)
      const paperMM = 80
      const width = mm2px(paperMM)
      const pad = mm2px(3)
      const titleSize = 40
      const base = 30
      const small = 26
      const lineGap = 8

      const lines = []
      lines.push({ t: 'فاتورة مبيعات', type: 'title' })
      lines.push({ t: 'رقم: ' + data.invoiceNumber, type: 'sub' })
      lines.push({ t: data.date, type: 'sub' })
      lines.push({ type: 'sep' })
      lines.push({ t: 'بيانات العميل', type: 'caption' })
      lines.push({ kv: ['الاسم', data.customerInfo.name || '-' ] })
      lines.push({ kv: ['الهاتف', data.customerInfo.phone || '-' ] })
      if (data.customerInfo.address) lines.push({ kv: ['العنوان', data.customerInfo.address] })
      if (data.customerInfo.notes)   lines.push({ kv: ['ملاحظات', data.customerInfo.notes] })
      lines.push({ type: 'sep' })
      lines.push({ t: 'تفاصيل الطلب', type: 'caption' })
      for (const it of data.items) lines.push({ item: it })
      lines.push({ type: 'total' })
      lines.push({ t: 'شكراً لتسوقكم معنا', type: 'footer' })

      // احسب الارتفاع المطلوب
      let h = pad
      for (const ln of lines) {
        if (ln.type === 'title') h += titleSize + lineGap
        else if (ln.type === 'sep') h += 12
        else if (ln.type === 'caption') h += base + lineGap
        else if (ln.type === 'sub' || ln.type === 'footer') h += small + lineGap
        else if (ln.type === 'total') h += base + lineGap
        else if (ln.kv) h += base + lineGap
        else if (ln.item) h += base + lineGap
      }
      h += pad

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, width, h)
      ctx.fillStyle = '#000'
      ctx.textBaseline = 'top'
      const ctxFont = (size, w = 700) => { ctx.font = `${w} ${size}px sans-serif` }
      const drawSep = () => { ctx.fillRect(pad, y + 4, width - pad * 2, 2); y += 12 }
      const formatCurrency = v => new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(v)

      let y = pad
      for (const ln of lines) {
        if (ln.type === 'title') {
          ctxFont(titleSize, 800); ctx.textAlign = 'center'; ctx.fillText(ln.t, width / 2, y); y += titleSize + lineGap
        } else if (ln.type === 'sub') {
          ctxFont(small, 600); ctx.textAlign = 'center'; ctx.fillText(ln.t, width / 2, y); y += small + lineGap
        } else if (ln.type === 'caption') {
          ctxFont(base, 800); ctx.textAlign = 'right'; ctx.fillText(ln.t, width - pad, y); y += base + lineGap
        } else if (ln.type === 'sep') {
          drawSep()
        } else if (ln.kv) {
          ctxFont(base, 700); ctx.textAlign = 'left'; ctx.fillText(ln.kv[0], pad, y); ctx.textAlign = 'right'; ctx.fillText(ln.kv[1], width - pad, y); y += base + lineGap
        } else if (ln.item) {
          ctxFont(base, 700); ctx.textAlign = 'left'; ctx.fillText(ln.item.title, pad, y); ctx.textAlign = 'right'; ctx.fillText(formatCurrency(ln.item.price), width - pad, y); y += base + lineGap
        } else if (ln.type === 'total') {
          drawSep(); ctxFont(base + 4, 900); ctx.textAlign = 'left'; ctx.fillText('الإجمالي', pad, y); ctx.textAlign = 'right'; ctx.fillText(formatCurrency(data.total), width - pad, y); y += base + lineGap
        } else if (ln.type === 'footer') {
          ctxFont(small, 600); ctx.textAlign = 'center'; ctx.fillText(ln.t, width / 2, y); y += small + lineGap
        }
      }
      return canvas.toDataURL('image/png')
    }

    const imgDataUrl = renderReceiptToDataURL(payload)

    const invoiceHTML = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة ${invoiceNumber}</title>
        <style>
          html, body { background:#fff; margin:0; }
          @page { size: 80mm auto; margin: 0; }
          body { width:80mm; margin:0 auto; }
          img#print-image { width:80mm; display:block; }
          .no-print { display:none; }
        </style>
      </head>
      <body>
        <img id="print-image" alt="invoice" src="${imgDataUrl}" />
      </body>
      </html>
    `
    if (printWindow) {
      printWindow.document.write(invoiceHTML)
      printWindow.document.close()
      const startPrint = () => { try { printWindow.focus(); printWindow.print() } catch (_) {} }
      printWindow.onload = () => {
        try {
          const img = printWindow.document.getElementById('print-image')
          if (img) {
            if (img.complete && img.naturalWidth > 0) {
              startPrint()
            } else {
              img.onload = startPrint
              img.onerror = startPrint
            }
          } else {
            setTimeout(startPrint, 200)
          }
        } catch (_) { setTimeout(startPrint, 300) }
      }
      // Fallback in case onload miss-fires in some browsers
      setTimeout(startPrint, 1500)
    } else {
      console.warn('تم حظر النافذة المنبثقة من المتصفح، سيتم الطباعة في نفس الصفحة')
      // افتح المعاينة واطبع في نفس الصفحة كحل بديل
      setShowPreview(true)
      try { window.print() } catch (_) {}
    }

    // حفظ الفاتورة في الخلفية دون تعطيل الطباعة
    try {
      setIsProcessing(true)
      const invoiceData = {
        invoiceNumber,
        customerInfo,
        items: cart,
        total,
        date: new Date().toISOString(),
        status: 'pending'
      }

      const response = await api.post('/invoices', invoiceData)
      if (response.data?.success) onSuccess(response.data)
    } catch (error) {
      console.error('خطأ في إنشاء الفاتورة:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // دالة طباعة بسيطة مثل printatestpage.com
  const handlePrint = () => {
    console.log('🖨️ فتح نافذة طباعة المتصفح')
    window.print()
  }

  // دالة تحديث معلومات العميل
  const handleInputChange = (field, value) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // عرض معاينة الفاتورة مع زر طباعة بسيط
  if (showPreview) {
    return (
      <InvoicePreview 
        invoiceNumber={invoiceNumber}
        customerInfo={customerInfo}
        cart={cart}
        total={total}
        date={currentDate}
        onClose={onClose}
        onPrint={handlePrint}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 w-full max-w-lg rounded-xl shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">إنشاء فاتورة</h2>
              <p className="text-sm text-gray-400 mt-1">رقم الفاتورة: {invoiceNumber}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl p-1"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* معلومات العميل */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              معلومات العميل
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  required
                  value={customerInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                  placeholder="أدخل الاسم الكامل"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  required
                  value={customerInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                  placeholder="+218xxxxxxxxx"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                العنوان (اختياري)
              </label>
              <input
                type="text"
                value={customerInfo.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                placeholder="أدخل العنوان"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ملاحظات (اختياري)
              </label>
              <textarea
                value={customerInfo.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base resize-none"
                placeholder="أي ملاحظات إضافية..."
              />
            </div>
          </div>

          {/* ملخص الطلب */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              ملخص الطلب
            </h3>
            
            <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{item.title}</p>
                  </div>
                  <div className="text-primary font-semibold">
                    {currency(item.price)}
                  </div>
                </div>
              ))}
              
              <div className="pt-3 border-t border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-white">الإجمالي:</span>
                  <span className="text-xl font-bold text-primary">{currency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isProcessing || cart.length === 0}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary-dark hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  إنشاء وطباعة الفاتورة
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// مكون معاينة الفاتورة الجديد - مثل printatestpage.com
function InvoicePreview({ invoiceNumber, customerInfo, cart, total, date, onClose, onPrint }) {
  return (
    <>
      {/* أنماط المعاينة والطباعة بنمط إيصال 58mm مناسب لـ Sunmi V2 */}
      <style>{`
        :root { --font-size: 16px; }
        .receipt { width: 100%; max-width: 100%; margin: 0; padding: 18px 20px; font-size: var(--font-size); line-height: 1.6; color: #111; background: #fff; }
        .rc-title { text-align: center; font-weight: 800; font-size: calc(var(--font-size) + 4px); }
        .rc-sub { text-align: center; color: #555; font-size: calc(var(--font-size) - 1px); margin-top: 4px; }
        .rc-sep { border-top: 1px dashed #999; margin: 12px 0; }
        .rc-caption { font-weight: 800; margin-bottom: 8px; font-size: var(--font-size); }
        .rc-line, .rc-item, .rc-total { display: flex; justify-content: space-between; gap: 16px; }
        .rc-line span:first-child { color: #444; }
        .rc-item { padding: 10px 0; border-bottom: 1px dashed #e5e7eb; }
        .rc-item span { word-break: break-word; }
        .price { direction: ltr; font-weight: 900; }
        .rc-total { font-size: calc(var(--font-size) + 4px); font-weight: 900; padding-top: 12px; border-top: 2px solid #111; }
        .rc-footer { text-align: center; font-size: calc(var(--font-size) - 2px); color: #555; margin-top: 14px; }

        @media print {
          body * { visibility: hidden; }
          .invoice-print, .invoice-print * { visibility: visible; }
          .invoice-print { position: absolute; left: 0; top: 0; width: 100%; max-width: none !important; background: #fff !important; color: #000 !important; font-family: 'Cairo', Arial, sans-serif !important; }
          .no-print { display: none !important; }
          @page { size: A4; margin: 10mm; }
          .receipt { width: 100% !important; margin: 0 !important; font-size: var(--font-size) !important; }
        }
      `}</style>
      
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden invoice-print">
          <div className="p-4">
            <div className="receipt">
              <div className="rc-title">فاتورة مبيعات</div>
              <div className="rc-sub">رقم الفاتورة: {invoiceNumber}</div>
              <div className="rc-sub">{date}</div>
              <div className="rc-sep"></div>

              <div className="rc-caption">بيانات العميل</div>
              <div className="rc-line"><span>الاسم</span><span>{customerInfo.name}</span></div>
              <div className="rc-line"><span>الهاتف</span><span>{customerInfo.phone}</span></div>
              {customerInfo.address && (
                <div className="rc-line"><span>العنوان</span><span>{customerInfo.address}</span></div>
              )}
              {customerInfo.notes && (
                <div className="rc-line"><span>ملاحظات</span><span>{customerInfo.notes}</span></div>
              )}

              <div className="rc-sep"></div>
              <div className="rc-caption">تفاصيل الطلب</div>
              {cart.map((item, index) => (
                <div key={index} className="rc-item">
                  <span>{item.title}</span>
                  <span className="price">{currency(item.price)}</span>
                </div>
              ))}

              <div className="rc-total"><span>الإجمالي</span><span className="price">{currency(total)}</span></div>
              <div className="rc-footer">
                <div>شكراً لتسوقكم معنا</div>
                <div>للاستفسارات: +218xxxxxxxxx</div>
              </div>
            </div>
          </div>

          {/* أزرار التحكم - مخفية في الطباعة */}
          <div className="p-4 border-t border-gray-200 flex flex-col gap-3 no-print">
            <button
              onClick={onPrint}
              className="w-full bg-gradient-to-r from-primary to-emerald-500 hover:from-primary-dark hover:to-emerald-600 text-white px-6 py-4 rounded-lg transition-all duration-300 font-bold flex items-center justify-center gap-2 text-lg shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              طباعة أو حفظ PDF
            </button>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">💡 كيفية الاستخدام:</p>
                  <ul className="space-y-1">
                    <li>• اضغط على زر "طباعة أو حفظ PDF"</li>
                    <li>• في نافذة الطباعة، اختر "حفظ كـ PDF" من الوجهة</li>
                    <li>• أو اختر طابعة للطباعة المباشرة</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

