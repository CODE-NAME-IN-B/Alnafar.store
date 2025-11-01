import React, { useState, useRef } from 'react'
import { api } from './api'

function currency(num) {
  return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(num)
}

export default function Invoice({ cart, total, onClose, onSuccess }) {
  // إضافة أنماط الطباعة
  React.useEffect(() => {
    const printStyles = `
      @media print {
        body * {
          visibility: hidden;
        }
        .invoice-print, .invoice-print * {
          visibility: visible;
        }
        .invoice-print {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: white !important;
          color: black !important;
        }
        .no-print {
          display: none !important;
        }
        .invoice-content {
          max-width: none !important;
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          padding: 20px !important;
        }
        .invoice-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .invoice-details {
          font-size: 14px;
          line-height: 1.6;
        }
        .invoice-items {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .invoice-items th,
        .invoice-items td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: right;
        }
        .invoice-total {
          font-size: 16px;
          font-weight: bold;
          text-align: right;
          margin-top: 20px;
        }
      }
    `;
    
    const styleSheet = document.createElement("style");
    styleSheet.innerText = printStyles;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const invoiceRef = useRef()

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
    
    try {
      // إنشاء الفاتورة
      const invoiceData = {
        invoiceNumber,
        customerInfo,
        items: cart,
        total,
        date: new Date().toISOString(),
        status: 'pending'
      }

      // حفظ الفاتورة في قاعدة البيانات
      const response = await api.post('/invoices', invoiceData)
      
      // طباعة الفاتورة على جهاز Sunmi V2
      const printResult = await printInvoice(invoiceData)
      
      // إظهار معاينة الفاتورة
      setShowPreview(true)
      
      // استدعاء callback النجاح مع معلومات الطباعة
      if (onSuccess) {
        onSuccess({
          ...response.data,
          cloudMode: printResult?.cloudMode || false
        })
      }
      
    } catch (error) {
      console.error('خطأ في إنشاء الفاتورة:', error)
      alert('حدث خطأ في إنشاء الفاتورة. يرجى المحاولة مرة أخرى.')
    } finally {
      setIsProcessing(false)
    }
  }

  const printInvoice = async (invoiceData) => {
    try {
      const response = await api.post('/print-invoice', {
        invoiceNumber: invoiceData.invoiceNumber,
        customerName: invoiceData.customerInfo.name,
        customerPhone: invoiceData.customerInfo.phone,
        customerAddress: invoiceData.customerInfo.address,
        items: invoiceData.items,
        total: invoiceData.total,
        date: invoiceData.date,
        notes: invoiceData.customerInfo.notes
      })
      return response.data
    } catch (error) {
      console.error('خطأ في الطباعة:', error)
      // لا نوقف العملية إذا فشلت الطباعة
      return { cloudMode: true }
    }
  }

  const handleInputChange = (field, value) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (showPreview) {
    return <InvoicePreview 
      invoiceNumber={invoiceNumber}
      customerInfo={customerInfo}
      cart={cart}
      total={total}
      date={currentDate}
      onClose={onClose}
      onPrintAgain={() => printInvoice({ invoiceNumber, customerInfo, items: cart, total, date: new Date().toISOString() })}
    />
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

// مكون معاينة الفاتورة
function InvoicePreview({ invoiceNumber, customerInfo, cart, total, date, onClose, onPrintAgain }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden invoice-print">
        {/* header */}
        <div className="bg-gradient-to-r from-primary to-emerald-500 text-white p-6 text-center invoice-header">
          <h2 className="text-2xl font-bold mb-2">فاتورة مبيعات</h2>
          <p className="text-primary-light">رقم الفاتورة: {invoiceNumber}</p>
          <p className="text-primary-light text-sm">{currentDate}</p>
        </div>

        {/* محتوى الفاتورة */}
        <div className="p-4 text-gray-800 space-y-4 invoice-content invoice-details">
          {/* معلومات الفاتورة */}
          <div className="flex justify-between items-start text-sm">
            <div>
              <p><strong>رقم الفاتورة:</strong> {invoiceNumber}</p>
              <p><strong>التاريخ:</strong> {date}</p>
            </div>
          </div>

          {/* معلومات العميل */}
          <div className="border-t border-gray-200 pt-3">
            <h3 className="font-semibold mb-2">بيانات العميل:</h3>
            <div className="text-sm space-y-1">
              <p><strong>الاسم:</strong> {customerInfo.name}</p>
              <p><strong>الهاتف:</strong> {customerInfo.phone}</p>
              {customerInfo.address && <p><strong>العنوان:</strong> {customerInfo.address}</p>}
              {customerInfo.notes && <p><strong>ملاحظات:</strong> {customerInfo.notes}</p>}
            </div>
          </div>

          {/* تفاصيل الألعاب */}
          <div className="border-t border-gray-200 pt-3">
            <h3 className="font-semibold mb-2">تفاصيل الطلب:</h3>
            <div className="space-y-2">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm py-1 border-b border-gray-100">
                  <span className="flex-1">{item.title}</span>
                  <span className="font-medium">{currency(item.price)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* الإجمالي */}
          <div className="border-t-2 border-gray-300 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">الإجمالي:</span>
              <span className="text-xl font-bold text-primary">{currency(total)}</span>
            </div>
          </div>

          {/* footer */}
          <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-3">
            <p>شكراً لتسوقكم معنا</p>
            <p>للاستفسارات: +218xxxxxxxxx</p>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="p-4 border-t border-gray-200 flex gap-3 no-print">
          <button
            onClick={() => printInvoice(invoiceData)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            طباعة حرارية
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            طباعة عادية
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}
