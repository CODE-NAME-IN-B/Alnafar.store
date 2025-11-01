import React, { useState, useRef, useEffect } from 'react'
import { api } from './api'
import PDFOptionsModal from './PDFOptionsModal'

function currency(num) {
  return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(num)
}

export default function Invoice({ cart, total, onClose, onSuccess }) {
  // إضافة أنماط الطباعة
  React.useEffect(() => {
    const printStyles = `
      @media print {
        /* إخفاء كل شيء ما عدا الفاتورة */
        body * {
          visibility: hidden;
        }
        
        .invoice-print, .invoice-print * {
          visibility: visible;
        }
        
        /* إعدادات الصفحة */
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        
        /* تنسيق الفاتورة للطباعة */
        .invoice-print {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          max-width: 210mm;
          background: white !important;
          color: black !important;
          font-family: 'Cairo', Arial, sans-serif !important;
          margin: 0 auto;
          padding: 0;
        }
        
        /* إخفاء الأزرار */
        .no-print {
          display: none !important;
        }
        
        /* تنسيق المحتوى */
        .invoice-content {
          max-width: none !important;
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          padding: 15mm !important;
          font-size: 12pt !important;
          line-height: 1.6 !important;
        }
        
        /* الهيدر */
        .invoice-header {
          text-align: center;
          margin-bottom: 20px;
          background: linear-gradient(135deg, #14b8a6 0%, #10b981 100%) !important;
          color: white !important;
          padding: 15px !important;
          border-radius: 8px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .invoice-header h2 {
          font-size: 20pt !important;
          margin: 0 0 8px 0 !important;
          font-weight: bold !important;
        }
        
        .invoice-header p {
          margin: 2px 0 !important;
          font-size: 11pt !important;
        }
        
        /* تفاصيل الفاتورة */
        .invoice-details {
          font-size: 11pt !important;
          line-height: 1.8 !important;
          margin-bottom: 15px !important;
        }
        
        .invoice-details p {
          margin: 5px 0 !important;
        }
        
        .invoice-details strong {
          font-weight: 600 !important;
        }
        
        /* قسم العناصر */
        .invoice-items {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        
        .invoice-items th,
        .invoice-items td {
          border: 1px solid #333;
          padding: 8px;
          text-align: right;
        }
        
        .invoice-items th {
          background-color: #f3f4f6 !important;
          font-weight: bold;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        /* الإجمالي */
        .invoice-total {
          font-size: 14pt !important;
          font-weight: bold !important;
          text-align: right;
          margin-top: 15px !important;
          border-top: 2px solid #333 !important;
          padding-top: 10px !important;
        }
        
        /* التذييل */
        .invoice-footer {
          text-align: center;
          font-size: 10pt !important;
          margin-top: 20px !important;
          border-top: 1px solid #ddd !important;
          padding-top: 15px !important;
          color: #666 !important;
        }
        
        /* الحدود والفواصل */
        .border-t {
          border-top: 1px solid #e5e7eb !important;
        }
        
        .border-gray-200 {
          border-color: #e5e7eb !important;
        }
        
        /* منع كسر الصفحة داخل العناصر المهمة */
        .invoice-header,
        .invoice-details,
        .invoice-total {
          page-break-inside: avoid;
        }
      }
      
      /* تنسيق عام للفاتورة */
      .receipt-format {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        font-family: 'Cairo', Arial, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        background: white;
        color: black;
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
  const [showPDFOptions, setShowPDFOptions] = useState(false)
  const [pdfBlob, setPdfBlob] = useState(null)
  const [invoiceDataForPDF, setInvoiceDataForPDF] = useState(null)
  const invoiceRef = useRef()

  const invoiceNumber = `INV-${Date.now()}`
  const currentDate = new Date().toLocaleDateString('ar-LY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  // Auto-generate PDF when preview is shown
  useEffect(() => {
    if (showPreview && invoiceDataForPDF && !showPDFOptions) {
      console.log('🎯 Preview shown, triggering PDF generation...')
      const timer = setTimeout(() => {
        generatePDFInterface(invoiceDataForPDF)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [showPreview, invoiceDataForPDF, showPDFOptions])

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
      const response = await api.post('/api/invoices', invoiceData)
      
      if (response.data.success) {
        // Save invoice data for PDF generation
        setInvoiceDataForPDF(invoiceData)
        
        // Show preview - this will trigger useEffect to generate PDF
        setShowPreview(true)
        
        onSuccess(response.data)
      }
      
    } catch (error) {
      console.error('خطأ في إنشاء الفاتورة:', error)
      alert('حدث خطأ في إنشاء الفاتورة. يرجى المحاولة مرة أخرى.')
    } finally {
      setIsProcessing(false)
    }
  }

  // دالة إنشاء واجهة PDF
  const generatePDFInterface = async (invoiceData) => {
    console.log('🔄 Starting PDF generation...')
    console.log('html2pdf available:', !!window.html2pdf)
    
    try {
      const invoiceElement = document.querySelector('.invoice-print')
      console.log('Invoice element found:', !!invoiceElement)
      
      if (!invoiceElement) {
        console.error('❌ Invoice element not found!')
        alert('لم يتم العثور على عنصر الفاتورة. حاول مرة أخرى.')
        return
      }
      
      if (!window.html2pdf) {
        console.error('❌ html2pdf library not loaded!')
        alert('مكتبة PDF غير محملة. يرجى تحديث الصفحة والمحاولة مرة أخرى.')
        return
      }
      
      console.log('✅ Starting PDF generation...')

      // إعدادات PDF محسنة للطابعات الحرارية
      const opt = {
        margin: [1, 1, 1, 1],
        filename: `فاتورة-${invoiceData.invoiceNumber}-${new Date().toLocaleDateString('ar-EG')}.pdf`,
        image: { 
          type: 'jpeg', 
          quality: 1.0 
        },
        html2canvas: { 
          scale: 4,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 302,
          height: 800,
          letterRendering: true,
          logging: false
        },
        jsPDF: { 
          unit: 'mm', 
          format: [80, 210],
          orientation: 'portrait',
          compress: false,
          precision: 16
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy']
        }
      }

      // إنشاء PDF وحفظه كـ blob
      console.log('📄 Generating PDF blob...')
      const pdf = await html2pdf().set(opt).from(invoiceElement).toPdf().get('pdf')
      const blob = pdf.output('blob')
      console.log('✅ PDF blob created:', blob.size, 'bytes')
      
      setPdfBlob(blob)
      setShowPDFOptions(true)
      console.log('✅ PDF options modal should now be visible!')
      
    } catch (error) {
      console.error('❌ فشل في إنشاء PDF:', error)
      alert('فشل في إنشاء PDF: ' + error.message)
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

  // Show PDF options modal if PDF is ready
  if (showPDFOptions && pdfBlob) {
    return (
      <PDFOptionsModal 
        pdfBlob={pdfBlob}
        invoiceNumber={invoiceNumber}
        onClose={() => {
          setShowPDFOptions(false)
          setPdfBlob(null)
          onClose()
        }}
        onBackToPreview={() => {
          setShowPDFOptions(false)
          setPdfBlob(null)
        }}
      />
    )
  }

  if (showPreview) {
    return (
      <InvoicePreview 
        invoiceNumber={invoiceNumber}
        customerInfo={customerInfo}
        cart={cart}
        total={total}
        date={currentDate}
        onClose={onClose}
        onPrintAgain={(data) => printInvoice(data)}
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

// مكون معاينة الفاتورة
function InvoicePreview({ invoiceNumber, customerInfo, cart, total, date, onClose, onPrintAgain }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden invoice-print receipt-format">
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
        <div className="p-4 border-t border-gray-200 flex flex-col gap-3 no-print">
          <button
            onClick={() => window.print()}
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
  )
}

