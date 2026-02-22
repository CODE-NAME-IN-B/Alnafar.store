import React, { useState, useEffect } from 'react'
import { api } from './api'
import { openInvoicePrintWindow, getInvoiceSettings } from './utils/invoicePrint'

function currency(num) {
  return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(num)
}

export default function Invoice({ cart, total, totalSize = 0, onClose, onSuccess }) {
  // If we are editing, we might have initial data passed in or available via cart items
  const isEditing = !!localStorage.getItem('editing_invoice')
  const editingData = isEditing ? JSON.parse(localStorage.getItem('editing_invoice')) : null

  const [customerInfo, setCustomerInfo] = useState({
    name: editingData?.customer_name || cart[0]?.customer_name || '',
    phone: editingData?.customer_phone || cart[0]?.customer_phone || '',
    address: editingData?.customer_address || '',
    notes: editingData?.notes || editingData?.customer_notes || ''
  })

  const [discount, setDiscount] = useState(editingData?.discount || 0)
  const [isPaid, setIsPaid] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // إنشاء رقم فاتورة مؤقت للعرض
  const [invoiceNumber, setInvoiceNumber] = useState(editingData?.invoice_number || (() => {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${today}-${randomSuffix}`
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isProcessing) return
    if (!customerInfo.name.trim() || !customerInfo.phone.trim()) {
      alert('يرجى إدخال الاسم ورقم الهاتف')
      return
    }

    if (cart.length === 0) {
      alert('السلة فارغة')
      return
    }

    // حساب الوقت التقديري للتثبيت (مثلاً 10 دقائق لكل 50 جيجا، مع حد أدنى 10 دقائق)
    const estimatedMinutes = totalSize > 0 ? Math.max(10, Math.ceil((totalSize / 50) * 10)) : 0

    setIsProcessing(true)

    try {
      const invoiceData = {
        customerInfo,
        items: cart.map(({ title, price, size_gb, type }) => ({ title, price, size_gb, ...(type && { type }) })),
        total,
        totalSize,
        estimatedMinutes,
        discount,
        finalTotal: total - discount,
        date: new Date().toISOString(),
        status: isPaid ? 'paid' : 'pending'
      }

      // إذا كنا في وضع التعديل، نستخدم PUT بدلاً من POST
      let response;
      if (isEditing && editingData?.id) {
        response = await api.put(`/api/invoices/${editingData.id}`, invoiceData)
      } else {
        response = await api.post('/invoices', invoiceData)
      }

      if (!response.data?.success) {
        throw new Error('create_failed')
      }

      const savedInvoice = response.data.invoice || {}
      savedInvoice.items = cart // Ensure current items are used if the backend doesn't return them

      // جلب إعدادات الفاتورة بعد الحفظ لاستخدامها في الطباعة
      const invSettings = await getInvoiceSettings()

      // استخدام نافذة الطباعة الموحدة
      await openInvoicePrintWindow(savedInvoice, invSettings)

      // تحديث حالة الطباعة
      try {
        const fullNum = savedInvoice.invoice_number || invoiceNumber
        await api.post(`/invoices/${encodeURIComponent(fullNum)}/mark-printed`)
      } catch (_) { }

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
              {cart.filter(i => i.type !== 'service').length > 0 && (
                <>
                  <p className="text-gray-400 text-xs font-medium">تفاصيل الطلب</p>
                  {cart.filter(i => i.type !== 'service').map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{item.title}</p>
                      </div>
                      <div className="text-primary font-semibold">{currency(item.price)}</div>
                    </div>
                  ))}
                </>
              )}
              {cart.filter(i => i.type === 'service').length > 0 && (
                <>
                  <p className="text-gray-400 text-xs font-medium mt-2">الخدمات</p>
                  {cart.filter(i => i.type === 'service').map((s, index) => (
                    <div key={`s-${index}`} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{s.title}</p>
                      </div>
                      <div className="text-primary font-semibold">{currency(s.price)}</div>
                    </div>
                  ))}
                </>
              )}

              <div className="pt-3 border-t border-gray-600 space-y-3">
                {totalSize > 0 && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-300">إجمالي الحجم:</span>
                      <span className="text-sm font-bold text-white">{totalSize.toFixed(2)} GB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-300">الوقت التقديري:</span>
                      <span className="text-sm font-bold text-primary">~{Math.max(10, Math.ceil((totalSize / 50) * 10))} دقيقة</span>
                    </div>
                  </div>
                )}
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
                  <span className="text-xl font-bold text-primary">{new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(total - discount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">تم الدفع؟</label>
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="w-5 h-5 accent-primary"
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
