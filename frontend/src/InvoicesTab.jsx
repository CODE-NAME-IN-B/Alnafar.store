import React, { useState, useEffect, useMemo } from 'react'
import { api } from './api'
import socket from './socket'
import { reprintInvoice as reprintInvoiceUtil } from './utils/invoicePrint'

function currency(num) {
  const n = Number(num)
  if (Number.isNaN(n)) return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(0)
  return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(n)
}

export default function InvoicesTab() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 50 })
  const [summary, setSummary] = useState(null)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [search, setSearch] = useState('')
  const [pageLimit, setPageLimit] = useState(50)
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadInvoices()
    loadSummary()

    // الاستماع للتحديثات الفورية
    socket.on('invoice_created', (data) => {
      console.log('📄 فاتورة جديدة:', data.message);
      loadInvoices(pagination.page); // إعادة تحميل الفواتير
      loadSummary(); // إعادة تحميل الإحصائيات

      // إشعار بصري
      if (Notification.permission === 'granted') {
        new Notification('فاتورة جديدة', {
          body: data.message,
          icon: '/favicon.svg'
        });
      }
    });

    // طلب إذن الإشعارات
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.off('invoice_created');
    };
  }, [])

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return invoices
    return invoices.filter(inv => {
      const num = String(inv.invoice_number || '').toLowerCase()
      const name = String(inv.customer_name || '').toLowerCase()
      return num.includes(q) || name.includes(q)
    })
  }, [invoices, search])

  const loadInvoices = async (page = 1) => {
    try {
      setLoading(true)
      const params = { page, limit: pageLimit }
      if (dateFrom && dateTo) {
        params.dateFrom = dateFrom
        params.dateTo = dateTo
      } else {
        params.date = dateTo || new Date().toISOString().split('T')[0]
      }
      const { data } = await api.get('/invoices', { params })
      setInvoices(data.invoices || [])
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (error) {
      console.error('خطأ في تحميل الفواتير:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadInvoices(1); loadSummary() }, [pageLimit, dateFrom, dateTo])

  const loadSummary = async () => {
    try {
      const params = {}
      if (dateFrom && dateTo) {
        params.dateFrom = dateFrom
        params.dateTo = dateTo
      }
      const { data } = await api.get('/invoices-summary', { params })
      if (data.success) setSummary(data.summary)
    } catch (error) {
      console.error('خطأ في تحميل الإحصائيات:', error)
    }
  }

  const deleteInvoice = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return

    try {
      const { data } = await api.delete(`/invoices/${id}`)
      if (data.success) {
        alert('تم حذف الفاتورة بنجاح')
        loadInvoices(pagination.page)
        loadSummary()
      }
    } catch (error) {
      alert('حدث خطأ في حذف الفاتورة')
      console.error(error)
    }
  }

  const deleteAllInvoices = async () => {
    if (!confirm('سيتم حذف فواتير اليوم فقط. هل تريد المتابعة؟')) return

    try {
      const { data } = await api.delete('/invoices/today')
      if (data.success) {
        alert(data.message)
        loadInvoices(1)
        loadSummary()
      }
    } catch (error) {
      alert('حدث خطأ في حذف فواتير اليوم')
      console.error(error)
    }
  }

  const reprintInvoice = async (invoice) => {
    try {
      await reprintInvoiceUtil(invoice)
    } catch (err) {
      console.error('فشل في إعادة الطباعة:', err)
      alert('فشل في إعادة الطباعة')
    }
  }

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.put(`/invoices/${id}/status`, { status })
      if (data.success) {
        setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: data.invoice.status } : inv))
      }
    } catch (error) {
      console.error('Update status error:', error)
      alert('فشل تحديث الحالة')
    }
  }

  const payBalance = async (invoice) => {
    const finalTotal = (invoice.total || 0) - (invoice.discount || 0);
    const paidAmount = invoice.paid_amount || 0;
    const balance = finalTotal - paidAmount;

    if (balance <= 0) return;

    const amountStr = prompt(`المبلغ المتبقي: ${currency(balance)}\n\nأدخل قيمة الدفعة (أو اضغط موافق لتسديد الباقي كاملاً):`, balance.toString());
    if (amountStr === null) return;

    const payment = Number(amountStr);
    if (isNaN(payment) || payment <= 0 || payment > balance) {
      alert('قيمة الدفعة غير صالحة');
      return;
    }

    try {
      const { data } = await api.put(`/invoices/${invoice.id}/payment`, { amount: payment });
      if (data.success) {
        alert('تم تسجيل الدفعة بنجاح');
        loadInvoices(pagination.page);
        loadSummary();
      }
    } catch (error) {
      console.error('فشل في تسجيل الدفعة:', error);
      alert('فشل في تسجيل الدفعة');
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">جاري تحميل الفواتير...</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 overflow-hidden max-w-[100vw]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 mt-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">الفواتير</h2>
          <p className="text-gray-400 mt-1 text-sm">اختر نطاق التاريخ لحساب الأرباح (عن فترة محددة)</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={deleteAllInvoices}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-600/30 rounded-lg font-medium transition-all flex justify-center items-center gap-2"
          >
            <span>🗑️</span> <span className="text-sm">حذف فواتير اليوم</span>
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-gray-800/40 p-3 sm:p-5 rounded-xl border border-gray-700/50 mb-6 space-y-4">
        {/* Date Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3">
          <div className="flex-1 flex flex-row gap-2 sm:gap-4">
            <div className="flex-1">
              <label className="text-gray-400 text-xs sm:text-sm block mb-1.5 focus-within:text-primary transition-colors">من تاريخ:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 sm:px-3 py-2 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="text-gray-400 text-xs sm:text-sm block mb-1.5 focus-within:text-primary transition-colors">إلى تاريخ:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 sm:px-3 py-2 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>
          <button
            onClick={() => loadInvoices(1)}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all shadow-lg shadow-primary/20 text-sm"
          >
            بحث بالتاريخ
          </button>
        </div>

        {/* Search & Limit */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-2 sm:pt-0 sm:border-t-0 border-t border-gray-700/50">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-400 text-sm">🔍</span>
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث برقم الفاتورة أو العميل..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pr-9 pl-3 py-2.5 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <select
            value={pageLimit}
            onChange={e => setPageLimit(parseInt(e.target.value) || 50)}
            className="w-full sm:w-auto bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-primary transition-all"
          >
            <option value={20}>20 فاتورة</option>
            <option value={50}>50 فاتورة</option>
            <option value={100}>100 فاتورة</option>
          </select>
        </div>
      </div>

      {/* إحصائيات الفواتير - عند اختيار نطاق تاريخ تظهر إحصائيات الفترة */}
      {summary && (
        <div className="space-y-4 mb-8">
          {dateFrom && dateTo && (summary.rangeInvoices !== undefined || summary.rangeRevenue !== undefined) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-teal-600 to-teal-700 p-6 rounded-xl text-white border-2 border-teal-400">
                <div className="text-sm opacity-90 mb-1">فواتير الفترة المحددة</div>
                <div className="text-3xl font-bold">{Number(summary.rangeInvoices) ?? 0}</div>
                <div className="text-xs opacity-80 mt-1">من {dateFrom} إلى {dateTo}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 rounded-xl text-white border-2 border-emerald-400">
                <div className="text-sm opacity-90 mb-1">إيرادات الفترة المحددة</div>
                <div className="text-2xl font-bold">{currency(Number(summary.rangeRevenue) || 0)}</div>
                <div className="text-xs opacity-80 mt-1">من {dateFrom} إلى {dateTo}</div>
              </div>
            </div>
          )}

          {dateFrom && dateTo && (summary.rangeCollectedRevenue !== undefined) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-xl text-white border-2 border-indigo-400 opacity-90">
                <div className="text-sm opacity-90 mb-1">الكاش المحصّل فعلياً (بدون الآجل)</div>
                <div className="text-2xl font-bold">{currency(Number(summary.rangeCollectedRevenue) || 0)}</div>
                <div className="text-xs opacity-80 mt-1">عن الفترة المحددة</div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl text-white">
              <div className="text-sm opacity-90 mb-1">إجمالي الفواتير</div>
              <div className="text-3xl font-bold">{summary.totalInvoices}</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-xl text-white opacity-80">
              <div className="text-sm opacity-90 mb-1">إجمالي المبيعات</div>
              <div className="text-2xl font-bold">{currency(Number(summary.totalRevenue) || 0)}</div>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-xl text-white">
              <div className="text-sm opacity-90 mb-1">الكاش المحصّل كلياً</div>
              <div className="text-2xl font-bold">{currency(Number(summary.collectedRevenue) || 0)}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-xl text-white">
              <div className="text-sm opacity-90 mb-1">فواتير اليوم</div>
              <div className="text-3xl font-bold">{summary.todayInvoices}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-600 to-orange-700 p-6 rounded-xl text-white">
              <div className="text-sm opacity-90 mb-1">كاش اليوم الفعلي</div>
              <div className="text-2xl font-bold">{currency(Number(summary.todayCollectedRevenue) || 0)}</div>
            </div>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="bg-gray-800/40 p-8 sm:p-12 rounded-2xl border border-gray-700/50 text-center shadow-lg">
          <div className="text-4xl mb-4 opacity-50">🧾</div>
          <h3 className="text-xl font-bold text-white mb-2">لا توجد فواتير</h3>
          <p className="text-gray-400 text-sm">لم يتم العثور على أي فواتير في هذه الفترة</p>
        </div>
      ) : (
        <div className="mb-4">
          {/* Mobile Cards (Hidden on Desktop) */}
          <div className="grid grid-cols-1 md:hidden gap-4">
            {filteredInvoices.map((invoice) => {
              const finalTotal = (invoice.total || 0) - (invoice.discount || 0);
              const balance = finalTotal - (invoice.paid_amount || 0);
              const items = Array.isArray(invoice.items) ? invoice.items : (() => { try { return JSON.parse(invoice.items) } catch { return [] } })();
              
              return (
                <div key={invoice.id} className="bg-gray-800/80 rounded-xl border border-gray-700 p-4 shadow-sm flex flex-col gap-3">
                  {/* Header: Num + Status */}
                  <div className="flex justify-between items-start pb-3 border-b border-gray-700">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-primary font-bold text-sm">{invoice.invoice_number}</span>
                      <span className="text-white text-sm font-medium">{invoice.customer_name || 'عميل نقدي'}</span>
                    </div>
                    <select
                      value={invoice.status || 'pending'}
                      onChange={(e) => updateStatus(invoice.id, e.target.value)}
                      className={`text-xs p-1.5 rounded-md border-none focus:ring-1 focus:ring-primary ${
                        invoice.status === 'ready' ? 'bg-green-900/50 text-green-400' :
                        invoice.status === 'completed' ? 'bg-blue-900/50 text-blue-400' :
                        invoice.status === 'processing' ? 'bg-yellow-900/50 text-yellow-400' :
                        'bg-gray-700 text-gray-300'
                      }`}
                    >
                      <option value="pending">⏳ قيد الانتظار</option>
                      <option value="processing">⚙️ التجهيز</option>
                      <option value="ready">✅ جاهز</option>
                      <option value="completed">🏁 مكتمل</option>
                    </select>
                  </div>

                  {/* Body: Amounts */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex flex-col bg-gray-900/50 p-2 rounded-lg">
                      <span className="text-gray-400 text-xs mb-1">المجموع</span>
                      <span className="text-white font-semibold">{currency(finalTotal)}</span>
                    </div>
                    <div className="flex flex-col bg-gray-900/50 p-2 rounded-lg">
                      <span className="text-gray-400 text-xs mb-1">المدفوع</span>
                      <span className="text-green-400 font-bold">{currency(invoice.paid_amount || 0)}</span>
                    </div>
                    {balance > 0 && (
                      <div className="col-span-2 flex flex-col bg-red-900/20 border border-red-900/30 p-2 rounded-lg">
                        <span className="text-red-300 text-xs mb-1">الباقي (الآجل)</span>
                        <span className="text-red-400 font-bold">{currency(balance)}</span>
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <div className="text-gray-400 text-xs flex justify-between items-center">
                    <span>التاريخ:</span>
                    <span>
                      {new Date(invoice.created_at).toLocaleString('ar-LY', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-4 gap-2 mt-2 pt-3 border-t border-gray-700">
                    <button onClick={() => reprintInvoice(invoice)} className="py-2.5 bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white rounded-lg transition-colors flex items-center justify-center text-lg" title="طباعة">🖨️</button>
                    <button onClick={() => {
                      const info = [
                        `رقم: ${invoice.invoice_number}`,
                        `التاريخ: ${new Date(invoice.created_at).toLocaleString('ar-LY')}`,
                        `الاسم: ${invoice.customer_name}`,
                        `الهاتف: ${invoice.customer_phone}`,
                        invoice.customer_address ? `العنوان: ${invoice.customer_address}` : '',
                        `المجموع: ${currency(invoice.total)}`,
                        invoice.discount > 0 ? `الخصم: -${currency(invoice.discount)}` : '',
                        `النهائي: ${currency(finalTotal)}`,
                        `\nالعناصر:\n` + items.map((it, i) => `${i + 1}. ${it.title} — ${currency(it.price)}`).join('\n')
                      ].filter(Boolean).join('\n');
                      alert(info);
                    }} className="py-2.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors flex items-center justify-center text-lg" title="التفاصيل">👁️</button>
                    <button onClick={() => {
                        localStorage.setItem('editing_invoice', JSON.stringify({
                          id: invoice.id, invoice_number: invoice.invoice_number,
                          customer_name: invoice.customer_name, customer_phone: invoice.customer_phone,
                          items: items, discount: invoice.discount || 0
                        }));
                        window.location.hash = '#/';
                    }} className="py-2.5 bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600 hover:text-white rounded-lg transition-colors flex items-center justify-center text-lg" title="تعديل">✏️</button>
                    <button onClick={() => deleteInvoice(invoice.id)} className="py-2.5 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors flex items-center justify-center text-lg" title="حذف">🗑️</button>
                    
                    {balance > 0 && (
                      <button onClick={() => payBalance(invoice)} className="col-span-4 mt-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-colors shadow-lg">
                        💰 تسديد الباقي ({currency(balance)})
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (Hidden on Mobile) */}
          <div className="hidden md:block bg-gray-800 rounded-xl overflow-x-auto border border-gray-700">
            <table className="w-full text-white table-auto">
              <thead>
                <tr className="border-b border-gray-600 bg-gray-900/50">
                  <th className="text-right py-4 px-4 font-semibold text-sm">رقم الفاتورة</th>
                  <th className="text-right py-4 px-4 font-semibold text-sm">العميل</th>
                  <th className="text-right py-4 px-4 font-semibold text-sm">المجموع</th>
                  <th className="text-right py-4 px-4 font-semibold text-sm">المدفوع</th>
                  <th className="text-right py-4 px-4 font-semibold text-sm">الباقي</th>
                  <th className="text-right py-4 px-4 font-semibold text-sm">الحالة</th>
                  <th className="text-right py-4 px-4 font-semibold text-sm">التاريخ</th>
                  <th className="text-center py-4 px-4 font-semibold text-sm">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => {
                  const finalTotal = (invoice.total || 0) - (invoice.discount || 0);
                  const balance = finalTotal - (invoice.paid_amount || 0);
                  const items = Array.isArray(invoice.items) ? invoice.items : (() => { try { return JSON.parse(invoice.items) } catch { return [] } })();
                  return (
                  <tr key={invoice.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-primary font-bold">{invoice.invoice_number}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{invoice.customer_name || 'نقدي'}</div>
                      {invoice.customer_phone && <div className="text-xs text-gray-400 mt-0.5">{invoice.customer_phone}</div>}
                    </td>
                    <td className="py-3 px-4 text-gray-200">{currency(finalTotal)}</td>
                    <td className="py-3 px-4 font-bold text-green-400">{currency(invoice.paid_amount || 0)}</td>
                    <td className="py-3 px-4 font-bold text-red-400">{currency(balance)}</td>
                    <td className="py-3 px-4">
                      <select
                        value={invoice.status || 'pending'}
                        onChange={(e) => updateStatus(invoice.id, e.target.value)}
                        className={`text-xs p-1.5 rounded-md border-none focus:ring-1 focus:ring-primary font-medium ${
                          invoice.status === 'ready' ? 'bg-green-900/50 text-green-400' :
                          invoice.status === 'completed' ? 'bg-blue-900/50 text-blue-400' :
                          invoice.status === 'processing' ? 'bg-yellow-900/50 text-yellow-400' :
                          'bg-gray-700 text-gray-300'
                        }`}
                      >
                        <option value="pending">قيد الانتظار</option>
                        <option value="processing">تجهيز</option>
                        <option value="ready">جاهز</option>
                        <option value="completed">مكتمل</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {new Date(invoice.created_at).toLocaleString('ar-LY', {
                        month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button onClick={() => reprintInvoice(invoice)} className="p-2 bg-gray-700 hover:bg-green-600 text-white rounded-lg transition-colors" title="طباعة">🖨️</button>
                        <button onClick={() => {
                          const info = [
                            `رقم: ${invoice.invoice_number}`,
                            `التاريخ: ${new Date(invoice.created_at).toLocaleString('ar-LY')}`,
                            `الاسم: ${invoice.customer_name}`,
                            `الهاتف: ${invoice.customer_phone}`,
                            invoice.customer_address ? `العنوان: ${invoice.customer_address}` : '',
                            `المجموع: ${currency(invoice.total)}`,
                            invoice.discount > 0 ? `الخصم: -${currency(invoice.discount)}` : '',
                            `النهائي: ${currency(finalTotal)}`,
                            `\nالعناصر:\n` + items.map((it, i) => `${i + 1}. ${it.title} — ${currency(it.price)}`).join('\n')
                          ].filter(Boolean).join('\n');
                          alert(info);
                        }} className="p-2 bg-gray-700 hover:bg-blue-600 text-white rounded-lg transition-colors" title="تفاصيل">👁️</button>
                        <button onClick={() => {
                          localStorage.setItem('editing_invoice', JSON.stringify({
                            id: invoice.id, invoice_number: invoice.invoice_number,
                            customer_name: invoice.customer_name, customer_phone: invoice.customer_phone,
                            items: items, discount: invoice.discount || 0
                          }));
                          window.location.hash = '#/';
                        }} className="p-2 bg-gray-700 hover:bg-yellow-600 text-white rounded-lg transition-colors" title="تعديل">✏️</button>
                        <button onClick={() => deleteInvoice(invoice.id)} className="p-2 bg-gray-700 hover:bg-red-600 text-white rounded-lg transition-colors" title="حذف">🗑️</button>
                        {balance > 0 && (
                          <button onClick={() => payBalance(invoice)} className="px-3 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-colors shadow-md">
                            💰 تسديد
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination (Shared) */}
          <div className="flex items-center justify-between bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 mt-4">
            <button disabled={pagination.page <= 1} onClick={() => loadInvoices(pagination.page - 1)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors">
              السابق
            </button>
            <span className="text-gray-300 text-sm font-medium font-mono">
              {pagination.page} / {pagination.pages}
            </span>
            <button disabled={pagination.page >= pagination.pages} onClick={() => loadInvoices(pagination.page + 1)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors">
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
