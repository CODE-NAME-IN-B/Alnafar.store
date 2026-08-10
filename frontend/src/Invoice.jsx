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
  const [paidAmount, setPaidAmount] = useState(editingData?.paid_amount !== undefined ? editingData.paid_amount : total)
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
      const finalTotal = total - discount;
      const invoiceData = {
        customerInfo,
        items: cart.map(({ title, price, size_gb, type, items }) => ({ title, price, size_gb, ...(type && { type }), ...(items && { items }) })),
        total,
        totalSize,
        estimatedMinutes,
        discount,
        finalTotal,
        paidAmount,
        date: new Date().toISOString(),
        status: paidAmount >= finalTotal ? 'completed' : 'pending'
      }

      // إذا كنا في وضع التعديل، نستخدم PUT بدلاً من POST
      let response;
      if (isEditing && editingData?.id) {
        response = await api.put(`/invoices/${editingData.id}`, invoiceData)
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-white/5 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/5 sticky top-0 bg-gradient-to-b from-gray-800/95 to-gray-800/80 backdrop-blur-md z-10 rounded-t-3xl sm:rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">{isEditing ? 'تعديل الفاتورة' : 'إنشاء فاتورة'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">#{invoiceNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              aria-label="إغلاق"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {/* معلومات العميل */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              معلومات العميل
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  required
                  value={customerInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full bg-gray-700/50 border border-white/5 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-sm transition-all"
                  placeholder="أدخل الاسم الكامل"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  required
                  value={customerInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full bg-gray-700/50 border border-white/5 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-sm transition-all"
                  placeholder="+218xxxxxxxxx"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                ملاحظات (اختياري)
              </label>
              <textarea
                value={customerInfo.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={2}
                className="w-full bg-gray-700/50 border border-white/5 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-sm resize-none transition-all"
                placeholder="أي ملاحظات إضافية..."
              />
            </div>
          </div>

          {/* ملخص الطلب */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              ملخص الطلب
            </h3>

            <div className="bg-gray-700/30 rounded-xl p-3 space-y-2">
              {cart.filter(i => i.type !== 'service').length > 0 && (
                <>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider px-1">الألعاب</p>
                  {cart.filter(i => i.type !== 'service').map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 px-2 bg-white/3 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{item.title}</p>
                      </div>
                      <span className="text-purple-400 font-bold text-sm tabular-nums mr-2">{currency(item.price)}</span>
                    </div>
                  ))}
                </>
              )}
              {cart.filter(i => i.type === 'service').length > 0 && (
                <>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider px-1 mt-2">الخدمات</p>
                  {cart.filter(i => i.type === 'service').map((s, index) => (
                    <div key={`s-${index}`} className="flex justify-between items-center py-2 px-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{s.title}</p>
                      </div>
                      <span className="text-emerald-400 font-bold text-sm tabular-nums mr-2">{currency(s.price)}</span>
                    </div>
                  ))}
                </>
              )}

              <div className="pt-3 border-t border-white/5 space-y-3">
                {totalSize > 0 && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
                        إجمالي الحجم
                      </span>
                      <span className="text-sm font-bold text-white">{totalSize.toFixed(2)} GB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        الوقت التقديري
                      </span>
                      <span className="text-sm font-bold text-purple-400">~{Math.max(10, Math.ceil((totalSize / 50) * 10))} دقيقة</span>
                    </div>
                  </div>
                )}

                {/* الخصم */}
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm text-gray-400 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                    الخصم
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max={total}
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      className="w-20 bg-gray-700/50 border border-white/5 rounded-lg px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                      placeholder="0"
                    />
                    <span className="text-xs text-gray-500">د.ل</span>
                  </div>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-xs text-gray-500 px-1">
                    <span>قبل الخصم</span>
                    <span className="line-through">{currency(total)}</span>
                  </div>
                )}

                {/* الإجمالي */}
                <div className="flex justify-between items-center bg-gradient-to-l from-purple-500/10 to-transparent p-3 rounded-xl">
                  <span className="text-sm font-bold text-white">الإجمالي النهائي</span>
                  <span className="text-xl font-black text-purple-400 tabular-nums">{new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(total - discount)}</span>
                </div>

                {/* المبلغ المدفوع */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">المبلغ المدفوع</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="0"
                      max={total - discount}
                      step="0.01"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                      className="flex-1 bg-gray-700/50 border border-white/5 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      placeholder="0.00"
                    />
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setPaidAmount(total - discount)} className="px-2.5 py-1.5 text-[11px] font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors">الكل</button>
                      <button type="button" onClick={() => setPaidAmount((total - discount) / 2)} className="px-2.5 py-1.5 text-[11px] font-bold bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">نصف</button>
                      <button type="button" onClick={() => setPaidAmount(0)} className="px-2.5 py-1.5 text-[11px] font-bold bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">آجل</button>
                    </div>
                  </div>
                  {paidAmount < (total - discount) && paidAmount > 0 && (
                    <div className="flex justify-between items-center text-xs bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
                      <span className="text-orange-400 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        المتبقي
                      </span>
                      <span className="text-orange-400 font-bold">{currency((total - discount) - paidAmount)}</span>
                    </div>
                  )}
                  {paidAmount === 0 && (
                    <div className="text-xs text-gray-500 bg-gray-700/30 rounded-lg px-3 py-2 text-center">
                      سيتم تسجيل المبلغ كآجل
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-4 sm:pb-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 min-h-[48px] border border-white/10 text-gray-300 rounded-xl hover:bg-white/5 hover:border-white/20 transition-all font-medium text-sm"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isProcessing || cart.length === 0}
              className="flex-1 px-4 py-3 min-h-[48px] bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] active:scale-[0.98]"
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
                  {isEditing ? 'حفظ التعديلات' : 'إنشاء وطباعة الفاتورة'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
