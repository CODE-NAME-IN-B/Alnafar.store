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
  const [isProcessing, setIsProcessing] = useState(false)

  const invoiceNumber = `INV-${Date.now()}`
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

    // جلب إعدادات الفاتورة
    let invSettings = {}
    try {
      const r = await api.get('/invoice-settings')
      invSettings = r?.data?.settings || {}
    } catch (_) { invSettings = {} }

    const paperMM = Number(invSettings?.paper_width) || 80
    const fs = String(invSettings?.font_size || 'normal').toLowerCase()
    const fontSize = fs === 'large' ? '16px' : fs === 'small' ? '12px' : '14px'
    const titleSize = fs === 'large' ? '22px' : fs === 'small' ? '16px' : '18px'

    const headerText = invSettings?.header_logo_text || 'فاتورة مبيعات'
    const showStoreInfo = !!Number(invSettings?.show_store_info ?? 1)
    const showFooter = !!Number(invSettings?.show_footer ?? 1)
    const storeName = invSettings?.store_name || ''
    const storeNameEn = invSettings?.store_name_english || ''
    const storeAddr = invSettings?.store_address || ''
    const storePhone = invSettings?.store_phone || ''
    const storeEmail = invSettings?.store_email || ''
    const storeWeb = invSettings?.store_website || ''
    const footerMsg = invSettings?.footer_message || 'شكراً لتسوقكم معنا'

    // إنشاء HTML للفاتورة
    const invoiceHTML = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة ${invoiceNumber}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Cairo', 'Tahoma', 'Arial', sans-serif; 
            background: #fff; 
            color: #000;
            font-size: ${fontSize};
            line-height: 1.6;
            direction: rtl;
          }
          @page { size: ${paperMM}mm auto; margin: 0; }
          .receipt { 
            width: ${paperMM}mm; 
            margin: 0 auto; 
            padding: 8mm 4mm;
            background: #fff;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }
          .font-extrabold { font-weight: 900; }
          .title { 
            font-size: ${titleSize}; 
            font-weight: 900; 
            text-align: center; 
            margin-bottom: 4px;
          }
          .subtitle { 
            font-size: calc(${fontSize} - 1px); 
            text-align: center; 
            color: #333; 
            margin-bottom: 3px;
          }
          .section-title { 
            font-size: ${fontSize}; 
            font-weight: 800; 
            margin: 8px 0 6px 0;
            text-align: right;
          }
          .separator { 
            border-top: 1px dashed #999; 
            margin: 8px 0; 
          }
          .separator-solid { 
            border-top: 2px solid #000; 
            margin: 8px 0; 
          }
          .info-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 4px 0;
            gap: 8px;
          }
          .info-label { 
            font-weight: 700; 
            color: #000;
            flex-shrink: 0;
          }
          .info-value { 
            text-align: left; 
            color: #333;
            word-break: break-word;
          }
          .item-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 6px 0;
            padding: 4px 0;
            border-bottom: 1px dashed #ddd;
            gap: 8px;
          }
          .item-name { 
            text-align: right;
            word-break: break-word;
            flex: 1;
          }
          .item-price { 
            text-align: left; 
            font-weight: 700;
            direction: ltr;
            flex-shrink: 0;
            min-width: 80px;
          }
          .total-row { 
            display: flex; 
            justify-content: space-between; 
            margin-top: 8px;
            padding-top: 8px;
            border-top: 2px solid #000;
            font-size: calc(${fontSize} + 2px);
            font-weight: 900;
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
            margin-top: 10px;
            line-height: 1.8;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          ${showStoreInfo && storeName ? `<div class="section-title text-center">${storeName}</div>` : ''}
          ${showStoreInfo && storeNameEn ? `<div class="subtitle">${storeNameEn}</div>` : ''}
          <div class="title">${headerText}</div>
          <div class="subtitle">رقم: ${invoiceNumber}</div>
          <div class="subtitle">${new Date().toLocaleString('ar-LY')}</div>
          
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
          ${customerInfo.address ? `
          <div class="info-row">
            <span class="info-label">العنوان:</span>
            <span class="info-value">${customerInfo.address}</span>
          </div>` : ''}
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
          
          <div class="total-row">
            <span class="total-label">الإجمالي:</span>
            <span class="total-value">${currency(total)}</span>
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

    // فتح نافذة طباعة
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (printWindow) {
      printWindow.document.write(invoiceHTML)
      printWindow.document.close()
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus()
          printWindow.print()
        }, 500)
      }
    }

    // حفظ الفاتورة في قاعدة البيانات
    try {
      const invoiceData = {
        invoiceNumber,
        customerInfo,
        items: cart,
        total,
        date: new Date().toISOString(),
        status: 'pending'
      }

      const response = await api.post('/invoices', invoiceData)
      if (response.data?.success) {
        onSuccess(response.data)
      }
    } catch (error) {
      console.error('خطأ في إنشاء الفاتورة:', error)
      alert('حدث خطأ في حفظ الفاتورة')
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
