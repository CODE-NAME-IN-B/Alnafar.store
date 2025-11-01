import React from 'react'

export default function PDFOptionsModal({ pdfBlob, invoiceNumber, onClose, onBackToPreview }) {
  const pdfUrl = URL.createObjectURL(pdfBlob)

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `فاتورة-${invoiceNumber}.pdf`
    link.click()
  }

  const handlePrint = () => {
    const printWindow = window.open(pdfUrl, '_blank')
    if (printWindow) {
      printWindow.onload = () => printWindow.print()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg text-center mb-6">
          <h2 className="text-2xl font-bold">📄 فاتورة PDF جاهزة!</h2>
          <p>رقم الفاتورة: {invoiceNumber}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button onClick={handleDownload} className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg">
            تحميل PDF
          </button>
          <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg">
            طباعة PDF
          </button>
          <button onClick={() => window.open(pdfUrl, '_blank')} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg">
            فتح في تبويب
          </button>
          <button onClick={onBackToPreview} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg">
            العودة
          </button>
        </div>

        <button onClick={onClose} className="w-full bg-gray-200 hover:bg-gray-300 px-4 py-3 rounded-lg">
          إغلاق
        </button>
      </div>
    </div>
  )
}
