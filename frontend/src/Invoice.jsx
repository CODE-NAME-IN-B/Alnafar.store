import React, { useState } from 'react'
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
  const [discount, setDiscount] = useState(0)
  const [isPaid, setIsPaid] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // إنشاء رقم فاتورة مؤقت للعرض
  const [invoiceNumber, setInvoiceNumber] = useState(() => {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${today}-${randomSuffix}`
  })

  // سيتم إنشاء رقم الفاتورة تلقائياً في الخادم
  const currentDate = new Date().toLocaleDateString('ar-LY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

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

    setIsProcessing(true)

    try {
      const invoiceData = {
        customerInfo,
        items: cart,
        total,
        discount,
        finalTotal: total - discount,
        date: new Date().toISOString(),
        status: isPaid ? 'paid' : 'pending'
      }

      // حفظ أولاً للحصول على رقم الفاتورة الصحيح (اليومي)
      const response = await api.post('/invoices', invoiceData)
      if (!response.data?.success) {
        throw new Error('create_failed')
      }

      const savedInvoice = response.data.invoice || {}
      const fullNumber = savedInvoice.invoice_number || invoiceNumber
      setInvoiceNumber(fullNumber)

      // جلب إعدادات الفاتورة بعد الحفظ لاستخدامها في الطباعة
      let invSettings = {}
      try {
        const r = await api.get('/invoice-settings')
        invSettings = r?.data?.settings || {}
      } catch (_) { invSettings = {} }

      const paperMM = Number(invSettings?.paper_width) || 58
      const fs = String(invSettings?.font_size || 'normal').toLowerCase()
      const fontSize = fs === 'large' ? '12px' : fs === 'small' ? '10px' : '11px'
      const titleSize = fs === 'large' ? '15px' : fs === 'small' ? '13px' : '14px'

      const headerText = invSettings?.header_logo_text || 'فاتورة مبيعات'
      const showStoreInfo = !!Number(invSettings?.show_store_info ?? 1)
      const showFooter = !!Number(invSettings?.show_footer ?? 1)
      const defaultStoreName = 'الشارده للإلكترونيات'
      const defaultStoreNameEn = 'Alnafar Store'
      const storeName = (invSettings?.store_name || '').trim() || defaultStoreName
      const storeNameEn = (invSettings?.store_name_english || '').trim() || defaultStoreNameEn
      const storeAddr = invSettings?.store_address || ''
      const storePhone = invSettings?.store_phone || ''
      const storeEmail = invSettings?.store_email || ''
      const storeWeb = invSettings?.store_website || ''
      const footerMsg = invSettings?.footer_message || 'شكراً لتسوقكم معنا'

      const dailyNo = fullNumber && fullNumber.includes('-')
        ? String((fullNumber.split('-')[1] || '')).padStart(3, '0')
        : fullNumber

      const invoiceHTML = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>فاتورة ${dailyNo}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Tahoma, Arial, Helvetica, sans-serif; 
              background: #fff; 
              color: #000;
              font-size: ${fontSize};
              line-height: 1.3;
              direction: rtl;
            }
            @page { size: ${paperMM}mm auto; margin: 0; }
            .receipt { 
              width: ${paperMM}mm; 
              margin: 0 auto; 
              padding: 2mm 1.5mm;
              background: #fff;
            }
            .logo { text-align: center; margin: 1mm 0 0.5mm 0; }
            .logo img { display: block; margin: 0 auto; max-width: 90%; width: 30mm; height: auto; image-rendering: -webkit-optimize-contrast; }
            .logo-fallback { font-size: ${titleSize}; font-weight: bold; text-align: center; color: #333; margin: 1mm 0; }
            .store-name-ar { 
              font-size: ${titleSize}; 
              font-weight: bold; 
              text-align: center; 
              margin: 0.1mm 0 1px 0;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 700; }
            .font-extrabold { font-weight: 900; }
            .title { 
              font-size: ${titleSize}; 
              font-weight: bold; 
              text-align: center; 
              margin-bottom: 1px;
            }
            .subtitle { 
              font-size: calc(${fontSize} - 1px); 
              text-align: center; 
              margin-bottom: 0px;
            }
            .section-title { 
              font-size: ${fontSize}; 
              font-weight: bold; 
              margin: 2px 0 1px 0;
              text-align: right;
            }
            .separator { 
              border-top: 1px dashed #999; 
              margin: 1px 0; 
            }
            .separator-solid { 
              border-top: 2px solid #000; 
              margin: 3px 0; 
            }
            .info-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 1px 0;
              gap: 4px;
            }
            .info-label { 
              font-weight: bold; 
              color: #000;
              flex-shrink: 0;
            }
            .info-value { 
              text-align: left; 
              color: #000;
              word-break: break-word;
            }
            .item-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 1px 0;
              padding: 1px 0;
              border-bottom: 1px dashed #ddd;
              gap: 4px;
            }
            .item-name { 
              text-align: right;
              word-break: break-word;
              flex: 1;
            }
            .item-price { 
              text-align: left; 
              font-weight: bold;
              direction: ltr;
              flex-shrink: 0;
              min-width: 80px;
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              margin-top: 2px;
              padding-top: 2px;
              border-top: 2px solid #000;
              font-size: ${fontSize};
              font-weight: bold;
            }
            .total-label { text-align: right; }
            .total-value { 
              text-align: left; 
              direction: ltr;
            }
            .footer { 
              text-align: center; 
              font-size: calc(${fontSize} - 2px); 
              color: #555; 
              margin-top: 2px;
              line-height: 1.2;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="logo">
              <img src="/invoice-header.png?v=${Date.now()}" alt="شعار المتجر" onerror="this.onerror=null; this.src='/logo.png';" />
              <div class="logo-fallback" style="display: none;">🏪 ${storeName}</div>
            </div>
            <div class="store-name-ar">${storeName}</div>
            <div class="subtitle">${storeNameEn}</div>
            ${storeAddr ? `<div class="subtitle">📍 ${storeAddr}</div>` : ''}
            ${storePhone ? `<div class="subtitle">📞 ${storePhone}</div>` : ''}
            <div class="subtitle">رقم: ${dailyNo}</div>
            <div class="subtitle">${new Date().toLocaleString('ar-LY')}</div>
            <div class="subtitle">الحالة: ${isPaid ? 'تم الدفع' : 'غير خالص'}</div>
            
            <div class="separator"></div>
            
            <div class="section-title">بيانات العميل</div>
            <div class="info-row">
              <span class="info-label">الاسم:</span>
              <span class="info-value">${customerInfo.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الهاتف:</span>
              <span class="info-value">${customerInfo.phone}</span>
            </div>
            ${customerInfo.notes ? `
            <div class="info-row">
              <span class="info-label">ملاحظات:</span>
              <span class="info-value">${customerInfo.notes}</span>
            </div>` : ''}
            
            <div class="separator"></div>
            
            <div class="section-title">تفاصيل الطلب</div>
            ${cart.map(item => `
            <div class="item-row">
              <span class="item-name">${item.title}</span>
              <span class="item-price">${currency(item.price)}</span>
            </div>`).join('')}
            
            ${discount > 0 ? `
            <div class="info-row">
              <span class="info-label">المجموع قبل الخصم:</span>
              <span class="info-value">${currency(total)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الخصم:</span>
              <span class="info-value">-${currency(discount)}</span>
            </div>` : ''}
            <div class="total-row">
              <span class="total-label">الإجمالي النهائي:</span>
              <span class="total-value">${currency(total - discount)}</span>
            </div>
            
            ${showStoreInfo && (storeAddr || storePhone || storeEmail || storeWeb) ? `
            <div class="separator"></div>
            <div class="section-title">معلومات المتجر</div>
            ${storeAddr ? `<div class="info-row"><span class="info-label">العنوان:</span><span class="info-value">${storeAddr}</span></div>` : ''}
            ${storePhone ? `<div class="info-row"><span class="info-label">الهاتف:</span><span class="info-value">${storePhone}</span></div>` : ''}
            ${storeEmail ? `<div class="info-row"><span class="info-label">البريد:</span><span class="info-value">${storeEmail}</span></div>` : ''}
            ${storeWeb ? `<div class="info-row"><span class="info-label">الموقع:</span><span class="info-value">${storeWeb}</span></div>` : ''}
            ` : ''}
            
            ${showFooter && footerMsg ? `
            <div class="footer">
              <div>${footerMsg}</div>
            </div>` : ''}
          </div>
        </body>
        </html>
      `

      const printWindow = window.open('', '_blank', 'width=800,height=600')
      if (printWindow) {
        printWindow.document.write(invoiceHTML)
        printWindow.document.close()
        
        printWindow.onload = () => {
          try {
            const doc = printWindow.document
            const imgs = Array.from(doc.images || [])
            const waitImgs = imgs.length
              ? Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(res => { img.onload = img.onerror = res })))
              : Promise.resolve()
            waitImgs.then(() => { printWindow.focus(); printWindow.print() })
          } catch (_) {
            printWindow.focus(); printWindow.print()
          }
        }
      }

      // تحديث حالة الطباعة
      try { await api.post(`/invoices/${encodeURIComponent(fullNumber)}/mark-printed`) } catch (_) {}

      onSuccess(response.data)
    } catch (error) {
      console.error('خطأ في إنشاء/طباعة الفاتورة:', error)
      alert('حدث خطأ في حفظ/طباعة الفاتورة')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleInputChange = (field, value) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }))
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
              
              <div className="pt-3 border-t border-gray-600 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-300">الخصم (دينار ليبي):</label>
                  <input
                    type="number"
                    min="0"
                    max={total}
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm text-center"
                    placeholder="0.00"
                  />
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">المجموع قبل الخصم:</span>
                    <span className="text-gray-400">{currency(total)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-white">الإجمالي النهائي:</span>
                  <span className="text-xl font-bold text-primary">{currency(total - discount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">تم الدفع؟</label>
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="w-5 h-5"
                  />
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
