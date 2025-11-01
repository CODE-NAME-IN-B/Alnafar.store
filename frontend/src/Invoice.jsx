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
          font-family: 'Cairo', Arial, sans-serif !important;
        }
        .no-print {
          display: none !important;
        }
        .invoice-content {
          max-width: none !important;
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          padding: 10px !important;
          font-size: 12px !important;
          line-height: 1.4 !important;
        }
        .invoice-header {
          text-align: center;
          margin-bottom: 15px;
          background: none !important;
          color: black !important;
          padding: 10px !important;
        }
        .invoice-details {
          font-size: 11px;
          line-height: 1.5;
          margin-bottom: 10px;
        }
        .invoice-items {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          font-size: 10px;
        }
        .invoice-items th,
        .invoice-items td {
          border: 1px solid #333;
          padding: 4px;
          text-align: right;
        }
        .invoice-items th {
          background-color: #f0f0f0 !important;
          font-weight: bold;
        }
        .invoice-total {
          font-size: 12px;
          font-weight: bold;
          text-align: right;
          margin-top: 10px;
          border-top: 2px solid #333;
          padding-top: 5px;
        }
        .invoice-footer {
          text-align: center;
          font-size: 9px;
          margin-top: 15px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
      }
      
      /* Receipt-specific styles for PDF generation */
      .receipt-format {
        width: 80mm !important;
        max-width: 80mm !important;
        margin: 0 auto;
        padding: 5mm;
        font-family: 'Cairo', 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.3;
        background: white;
        color: black;
      }
      
      .receipt-format .invoice-header {
        text-align: center;
        margin-bottom: 10px;
        border-bottom: 1px dashed #333;
        padding-bottom: 8px;
      }
      
      .receipt-format .invoice-header h2 {
        font-size: 16px;
        margin: 0 0 5px 0;
        font-weight: bold;
      }
      
      .receipt-format .invoice-details {
        margin: 8px 0;
        font-size: 11px;
      }
      
      .receipt-format table {
        width: 100%;
        border-collapse: collapse;
        margin: 8px 0;
      }
      
      .receipt-format th,
      .receipt-format td {
        padding: 2px 4px;
        text-align: right;
        border-bottom: 1px dotted #666;
      }
      
      .receipt-format .invoice-total {
        border-top: 1px solid #333;
        margin-top: 8px;
        padding-top: 5px;
        font-weight: bold;
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
      const response = await api.post('/api/invoices', invoiceData)
      
      if (response.data.success) {
        // Show preview first, then generate PDF
        setShowPreview(true)
        
        // Generate PDF automatically after showing preview
        setTimeout(() => {
          generatePDFInterface(invoiceData)
        }, 500)
        
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
    try {
      const invoiceElement = document.querySelector('.invoice-print')
      if (!invoiceElement || !window.html2pdf) {
        alert('لا يمكن إنشاء PDF في الوقت الحالي')
        return
      }

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
      const pdf = await html2pdf().set(opt).from(invoiceElement).toPdf().get('pdf')
      const blob = pdf.output('blob')
      setPdfBlob(blob)
      setShowPDFOptions(true)
      
    } catch (error) {
      console.error('فشل في إنشاء PDF:', error)
      alert('فشل في إنشاء PDF. حاول مرة أخرى.')
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
        <div className="p-4 border-t border-gray-200 flex flex-wrap gap-2 no-print">
          <button
            onClick={() => {
              const invoiceElement = document.querySelector('.invoice-print');
              if (window.html2pdf && invoiceElement) {
                // Generate and download PDF optimized for thermal printers
                const opt = {
                  margin: [1, 1, 1, 1], // Minimal margins for thermal printers
                  filename: `فاتورة-${invoiceNumber}-${new Date().toLocaleDateString('ar-EG')}.pdf`,
                  image: { 
                    type: 'jpeg', 
                    quality: 1.0 // Maximum quality for thermal printing
                  },
                  html2canvas: { 
                    scale: 4, // High resolution for crisp thermal printing
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    width: 302, // 80mm at 96 DPI (80 * 96 / 25.4)
                    height: 800, // Long receipt format
                    letterRendering: true, // Better text rendering
                    logging: false
                  },
                  jsPDF: { 
                    unit: 'mm', 
                    format: [80, 210], // Standard thermal receipt size (80mm width)
                    orientation: 'portrait',
                    compress: false, // Don't compress for better thermal printing
                    precision: 16 // High precision for thermal printers
                  },
                  pagebreak: { 
                    mode: ['avoid-all', 'css', 'legacy'],
                    before: '.page-break-before',
                    after: '.page-break-after'
                  }
                };
                
                // Show loading message
                const button = event.target.closest('button');
                const originalText = button.innerHTML;
                button.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> جاري الحفظ...';
                button.disabled = true;
                
                html2pdf().set(opt).from(invoiceElement).save().then(() => {
                  // Show success message
                  button.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> تم الحفظ!';
                  setTimeout(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                  }, 2000);
                }).catch((error) => {
                  console.error('PDF save failed:', error);
                  button.innerHTML = originalText;
                  button.disabled = false;
                  alert('فشل في حفظ PDF. حاول مرة أخرى.');
                });
              } else {
                alert('مكتبة PDF غير متاحة');
              }
            }}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-1 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            حفظ PDF
          </button>
          <button
            onClick={() => {
              const invoiceElement = document.querySelector('.invoice-print');
              if (window.enhancedPrint && invoiceElement) {
                // Use enhanced print with PDF generation
                window.enhancedPrint(invoiceElement, {
                  filename: `فاتورة-${invoiceNumber}.pdf`,
                  jsPDF: { 
                    unit: 'mm', 
                    format: [80, 150], // Receipt size optimized
                    orientation: 'portrait'
                  }
                });
              } else {
                window.print();
              }
            }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-1 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            طباعة PDF
          </button>
          <button
            onClick={() => {
              const invoiceElement = document.querySelector('.invoice-print');
              if (invoiceElement) {
                // Try Sunmi innerPrinter first, then fallback
                const isSunmiDevice = navigator.userAgent.includes('sunmi') || 
                                     window.sunmiInnerPrinter || 
                                     window.SunmiInnerPrinter;
                
                if (isSunmiDevice) {
                  try {
                    if (window.sunmiInnerPrinter) {
                      window.sunmiInnerPrinter.print(invoiceElement.innerHTML);
                      return;
                    } else if (window.SunmiInnerPrinter) {
                      window.SunmiInnerPrinter.print(invoiceElement.innerHTML);
                      return;
                    }
                  } catch (error) {
                    console.log('Sunmi print failed:', error);
                  }
                }
                
                // Fallback to regular print
                window.print();
              }
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-1 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            طباعة مباشرة
          </button>
          <button
            onClick={onClose}
            className="w-full mt-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}

// مكون واجهة خيارات PDF
function PDFOptionsModal({ pdfBlob, invoiceNumber, onClose, onBackToPreview }) {
  const pdfUrl = URL.createObjectURL(pdfBlob)

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `فاتورة-${invoiceNumber}-${new Date().toLocaleDateString('ar-EG')}.pdf`
    link.click()
  }

  const handlePrint = () => {
    const printWindow = window.open(pdfUrl, '_blank')
    if (printWindow) {
      printWindow.onload = function() {
        printWindow.print()
      }
    } else {
      alert('تعذر فتح نافذة الطباعة. يرجى تحميل الملف والطباعة يدوياً.')
    }
  }

  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">📄 فاتورة PDF جاهزة!</h2>
          <p className="text-green-100">رقم الفاتورة: {invoiceNumber}</p>
        </div>

        {/* PDF Preview */}
        <div className="p-6">
          <div className="bg-gray-100 rounded-lg p-4 mb-6 text-center">
            <div className="w-16 h-20 bg-red-500 text-white rounded mx-auto mb-3 flex items-center justify-center text-2xl font-bold">
              PDF
            </div>
            <p className="text-gray-700 font-medium">
              فاتورة-{invoiceNumber}-{new Date().toLocaleDateString('ar-EG')}.pdf
            </p>
            <p className="text-sm text-gray-500 mt-1">
              جاهز للتحميل أو الطباعة
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              تحميل PDF
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              طباعة PDF
            </button>

            <button
              onClick={handleOpenInNewTab}
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              فتح في تبويب جديد
            </button>

            <button
              onClick={onBackToPreview}
              className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              العودة للفاتورة
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">نصائح للطباعة الحرارية:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• حمل الملف واستخدمه في برنامج الطباعة الحرارية</li>
                  <li>• الملف محسن لطابعات 80mm</li>
                  <li>• جودة عالية مناسبة للطباعة الاحترافية</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg transition-colors font-medium"
          >
            إنهاء وإغلاق
          </button>
        </div>
      </div>
    </div>
  )
}
