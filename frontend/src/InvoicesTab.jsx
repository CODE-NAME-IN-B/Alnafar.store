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

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">جاري تحميل الفواتير...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">الفواتير</h2>
          <p className="text-gray-400 mt-1">اختر نطاق التاريخ لحساب الأرباح (مثلاً من أول الشهر لليوم)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={deleteAllInvoices}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            🗑️ حذف فواتير اليوم
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="text-gray-400 text-sm">من تاريخ:</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
        />
        <label className="text-gray-400 text-sm">إلى تاريخ:</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
        />
        <button
          onClick={() => loadInvoices(1)}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium"
        >
          عرض
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ابحث برقم الفاتورة أو اسم العميل..."
          className="flex-1 min-w-[240px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white"
        />
        <select
          value={pageLimit}
          onChange={e => setPageLimit(parseInt(e.target.value) || 50)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white"
        >
          <option value={20}>20 لكل صفحة</option>
          <option value={50}>50 لكل صفحة</option>
          <option value={100}>100 لكل صفحة</option>
        </select>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl text-white">
              <div className="text-sm opacity-90 mb-1">إجمالي الفواتير</div>
              <div className="text-3xl font-bold">{summary.totalInvoices}</div>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-xl text-white">
              <div className="text-sm opacity-90 mb-1">إجمالي الإيرادات</div>
              <div className="text-2xl font-bold">{currency(Number(summary.totalRevenue) || 0)}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-xl text-white">
              <div className="text-sm opacity-90 mb-1">فواتير اليوم</div>
              <div className="text-3xl font-bold">{summary.todayInvoices}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-600 to-orange-700 p-6 rounded-xl text-white">
              <div className="text-sm opacity-90 mb-1">إيرادات اليوم</div>
              <div className="text-2xl font-bold">{currency(Number(summary.todayRevenue) || 0)}</div>
            </div>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="bg-gray-800 p-8 rounded-xl text-center">
          <h3 className="text-xl font-bold text-white mb-2">لا توجد فواتير</h3>
          <p className="text-gray-400">لم يتم إنشاء أي فواتير بعد</p>
        </div>
      ) : (
        <div className="bg-gray-800 p-6 rounded-xl overflow-x-auto">
          <table className="w-full text-white">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-right py-3 px-4">رقم الفاتورة</th>
                <th className="text-right py-3 px-4">اسم العميل</th>
                <th className="text-right py-3 px-4">المجموع</th>
                <th className="text-right py-3 px-4">الخصم</th>
                <th className="text-right py-3 px-4">الإجمالي</th>
                <th className="text-right py-3 px-4">وقت الإنشاء</th>
                <th className="text-right py-3 px-4">عدد الطباعات</th>
                <th className="text-center py-3 px-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                  <td className="py-3 px-4 font-mono text-primary">{invoice.invoice_number}</td>
                  <td className="py-3 px-4">{invoice.customer_name}</td>
                  <td className="py-3 px-4 text-gray-300">{currency(invoice.total)}</td>
                  <td className="py-3 px-4 text-red-400">{invoice.discount > 0 ? `-${currency(invoice.discount)}` : '—'}</td>
                  <td className="py-3 px-4 font-bold text-green-400">{currency((invoice.total || 0) - (invoice.discount || 0))}</td>
                  <td className="py-3 px-4 text-gray-300 text-sm">
                    {new Date(invoice.created_at).toLocaleString('ar-LY', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-3 px-4 text-gray-300 text-center">
                    <span className="bg-gray-700 px-2 py-1 rounded text-xs">
                      {invoice.print_count || 0}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex flex-wrap gap-2 justify-center min-w-[120px]">
                      <button
                        onClick={() => reprintInvoice(invoice)}
                        className="p-2 sm:px-3 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                        title="إعادة طباعة"
                      >
                        🖨️
                      </button>
                      <button
                        onClick={() => {
                          const items = Array.isArray(invoice.items) ? invoice.items : (() => { try { return JSON.parse(invoice.items) } catch { return [] } })()
                          const info = [
                            `رقم: ${invoice.invoice_number}`,
                            `التاريخ: ${new Date(invoice.created_at).toLocaleString('ar-LY')}`,
                            `الاسم: ${invoice.customer_name}`,
                            `الهاتف: ${invoice.customer_phone}`,
                            invoice.customer_address ? `العنوان: ${invoice.customer_address}` : '',
                            `المجموع قبل الخصم: ${new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(invoice.total)}`,
                            invoice.discount > 0 ? `الخصم: -${new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(invoice.discount)}` : '',
                            `الإجمالي النهائي: ${new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format((invoice.total || 0) - (invoice.discount || 0))}`,
                            `العناصر:\n` + items.map((it, i) => `${i + 1}. ${it.title} — ${new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(it.price)}`).join('\n')
                          ].filter(Boolean).join('\n')
                          alert(info)
                        }}
                        className="p-2 sm:px-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                        title="عرض التفاصيل"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => deleteInvoice(invoice.id)}
                        className="p-2 sm:px-3 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                        title="حذف الفاتورة"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button disabled={pagination.page <= 1} onClick={() => loadInvoices(pagination.page - 1)} className="px-3 py-1.5 bg-gray-700 disabled:opacity-50 rounded">السابق</button>
            <span className="text-gray-300">صفحة {pagination.page} من {pagination.pages}</span>
            <button disabled={pagination.page >= pagination.pages} onClick={() => loadInvoices(pagination.page + 1)} className="px-3 py-1.5 bg-gray-700 disabled:opacity-50 rounded">التالي</button>
          </div>
        </div>
      )}
    </div>
  )
}
