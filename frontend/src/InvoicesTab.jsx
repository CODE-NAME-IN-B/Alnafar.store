import React, { useState, useEffect, useMemo } from 'react'
import { api } from './api'
import socket from './socket'
import { reprintInvoice as reprintInvoiceUtil } from './utils/invoicePrint'
import Loader from './Loader'

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
  const [gamesList, setGamesList] = useState([])
  const [servicesList, setServicesList] = useState([])
  const [categories, setCategories] = useState([])
  const [showGamePicker, setShowGamePicker] = useState(false)
  const [showServicePicker, setShowServicePicker] = useState(false)
  const [gameSearch, setGameSearch] = useState('')
  const [gameCategory, setGameCategory] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [dateFrom, setDateFrom] = useState(() => new Date().toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadInvoices()
    loadSummary()
    api.get('/games').then(({ data }) => setGamesList(Array.isArray(data) ? data : [])).catch(() => {})
    api.get('/services?active=false').then(({ data }) => setServicesList(Array.isArray(data) ? data : [])).catch(() => {})
    api.get('/categories').then(({ data }) => setCategories(Array.isArray(data) ? data : [])).catch(() => {})

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

  const handleSaveEdit = async () => {
    if (!editingInvoice || !editingInvoice.id) return
    const items = editingInvoice.items || []
    const total = items.reduce((s, i) => s + (Number(i.price) || 0), 0)
    const discount = Number(editingInvoice.discount) || 0
    try {
      await api.put(`/invoices/${editingInvoice.id}`, {
        customer_name: editingInvoice.customer_name,
        customer_phone: editingInvoice.customer_phone,
        items,
        total,
        discount,
        status: editingInvoice.status
      })
      setEditingInvoice(null)
      loadInvoices(pagination.page)
      loadSummary()
    } catch (err) {
      alert(err?.response?.data?.message || 'فشل حفظ التعديلات')
    }
  }

  const removeItemFromEdit = (index) => {
    if (!editingInvoice) return
    const items = [...(editingInvoice.items || [])]
    items.splice(index, 1)
    setEditingInvoice({ ...editingInvoice, items })
  }

  const addGameToInvoice = (game) => {
    if (!editingInvoice) return
    const items = [...(editingInvoice.items || []), { title: game.title, price: game.price, size_gb: game.size_gb, type: 'game' }]
    setEditingInvoice({ ...editingInvoice, items })
    setShowGamePicker(false)
    setGameSearch('')
  }

  const addServiceToInvoice = (service) => {
    if (!editingInvoice) return
    const items = [...(editingInvoice.items || []), { title: service.title, price: service.price, type: 'service' }]
    setEditingInvoice({ ...editingInvoice, items })
    setShowServicePicker(false)
  }

  const filteredGames = useMemo(() => {
    let list = gamesList
    if (gameCategory) {
      list = list.filter(g => g.category_id === Number(gameCategory))
    }
    const q = gameSearch.trim().toLowerCase()
    if (!q) return list
    return list.filter(g => String(g.title || '').toLowerCase().includes(q))
  }, [gamesList, gameSearch, gameCategory])

  const filteredServices = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase()
    if (!q) return servicesList
    return servicesList.filter(s => String(s.title || '').toLowerCase().includes(q))
  }, [servicesList, serviceSearch])

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader />
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg> <span className="text-sm">حذف فواتير اليوم</span>
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
          <div className="flex gap-2">
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0]
                setDateFrom(today)
                setDateTo(today)
              }}
              className="px-4 py-2.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-600/30 rounded-lg font-medium transition-all text-sm"
            >
              اليوم
            </button>
            <button
              onClick={() => loadInvoices(1)}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all shadow-lg shadow-primary/20 text-sm"
            >
              بحث بالتاريخ
            </button>
          </div>
        </div>

        {/* Search & Limit */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-2 sm:pt-0 sm:border-t-0 border-t border-gray-700/50">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
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

      {/* إحصائيات الفواتير */}
      {summary && (
        <div className="mb-8 space-y-4">
          {/* Period Stats */}
          {dateFrom && dateTo && (summary.rangeInvoices !== undefined || summary.rangeRevenue !== undefined) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-600 p-5 rounded-3xl text-white shadow-xl shadow-cyan-500/20">
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/10 rounded-full blur-lg"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <span className="text-sm font-semibold text-white/90">فواتير الفترة</span>
                  </div>
                  <p className="text-4xl font-black tracking-tight leading-none">{Number(summary.rangeInvoices) ?? 0}</p>
                  <p className="text-xs text-white/60 mt-2">من {dateFrom} إلى {dateTo}</p>
                </div>
              </div>
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-5 rounded-3xl text-white shadow-xl shadow-emerald-500/20">
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/10 rounded-full blur-lg"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <span className="text-sm font-semibold text-white/90">إيرادات الفترة</span>
                  </div>
                  <p className="text-3xl font-black tracking-tight leading-none break-all">{currency(Number(summary.rangeRevenue) || 0)}</p>
                  <p className="text-xs text-white/60 mt-2">من {dateFrom} إلى {dateTo}</p>
                </div>
              </div>
            </div>
          )}

          {dateFrom && dateTo && (summary.rangeCollectedRevenue !== undefined) && (
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 via-violet-600 to-purple-600 p-5 rounded-3xl text-white shadow-xl shadow-violet-500/20">
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/10 rounded-full blur-lg"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <span className="text-sm font-semibold text-white/90">الكاش المحصّل فعلياً (بدون الآجل)</span>
                </div>
                <p className="text-3xl font-black tracking-tight leading-none break-all">{currency(Number(summary.rangeCollectedRevenue) || 0)}</p>
                <p className="text-xs text-white/60 mt-2">عن الفترة المحددة</p>
              </div>
            </div>
          )}

          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-500/20">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
              <div className="relative z-10">
                <svg className="w-8 h-8 text-white/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="text-xs font-medium text-white/70 mb-1">إجمالي الفواتير</p>
                <p className="text-3xl font-black">{summary.totalInvoices}</p>
              </div>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
              <div className="relative z-10">
                <svg className="w-8 h-8 text-white/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                <p className="text-xs font-medium text-white/70 mb-1">إجمالي المبيعات</p>
                <p className="text-xl font-black break-all leading-tight">{currency(Number(summary.totalRevenue) || 0)}</p>
              </div>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 p-4 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
              <div className="relative z-10">
                <svg className="w-8 h-8 text-white/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <p className="text-xs font-medium text-white/70 mb-1">الكاش المحصّل كلياً</p>
                <p className="text-xl font-black break-all leading-tight">{currency(Number(summary.collectedRevenue) || 0)}</p>
              </div>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-2xl text-white shadow-lg shadow-purple-500/20">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
              <div className="relative z-10">
                <svg className="w-8 h-8 text-white/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-xs font-medium text-white/70 mb-1">فواتير اليوم</p>
                <p className="text-3xl font-black">{summary.todayInvoices}</p>
              </div>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-amber-600 p-4 rounded-2xl text-white shadow-lg shadow-orange-500/20">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
              <div className="relative z-10">
                <svg className="w-8 h-8 text-white/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-xs font-medium text-white/70 mb-1">كاش اليوم الفعلي</p>
                <p className="text-xl font-black break-all leading-tight">{currency(Number(summary.todayCollectedRevenue) || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="bg-gray-800/40 p-8 sm:p-12 rounded-2xl border border-gray-700/50 text-center shadow-lg">
          <div className="text-4xl mb-4 opacity-50">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
          </div>
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
                      <option value="ready">جاهز</option>
                      <option value="completed">مكتمل</option>
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
                    <button onClick={() => reprintInvoice(invoice)} className="py-2.5 bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white rounded-lg transition-colors flex items-center justify-center" title="طباعة"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" /></svg></button>
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
                    }} className="py-2.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors flex items-center justify-center" title="التفاصيل"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
                    <button onClick={() => setEditingInvoice({
                        id: invoice.id, invoice_number: invoice.invoice_number,
                        customer_name: invoice.customer_name, customer_phone: invoice.customer_phone,
                        customer_address: invoice.customer_address || '',
                        customer_notes: invoice.customer_notes || '',
                        items: items, discount: invoice.discount || 0, status: invoice.status
                    })} className="py-2.5 bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600 hover:text-white rounded-lg transition-colors flex items-center justify-center" title="تعديل"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg></button>
                    <button onClick={() => deleteInvoice(invoice.id)} className="py-2.5 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors flex items-center justify-center" title="حذف"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
                    
                    {balance > 0 && (
                      <button onClick={() => payBalance(invoice)} className="col-span-4 mt-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-colors shadow-lg">
                        تسديد الباقي ({currency(balance)})
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
                        <button onClick={() => reprintInvoice(invoice)} className="p-2 bg-gray-700 hover:bg-green-600 text-white rounded-lg transition-colors" title="طباعة"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" /></svg></button>
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
                        }} className="p-2 bg-gray-700 hover:bg-blue-600 text-white rounded-lg transition-colors" title="تفاصيل"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
                        <button onClick={() => setEditingInvoice({
                          id: invoice.id, invoice_number: invoice.invoice_number,
                          customer_name: invoice.customer_name, customer_phone: invoice.customer_phone,
                          customer_address: invoice.customer_address || '',
                          customer_notes: invoice.customer_notes || '',
                          items: items, discount: invoice.discount || 0, status: invoice.status
                        })} className="p-2 bg-gray-700 hover:bg-yellow-600 text-white rounded-lg transition-colors" title="تعديل"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg></button>
                        <button onClick={() => deleteInvoice(invoice.id)} className="p-2 bg-gray-700 hover:bg-red-600 text-white rounded-lg transition-colors" title="حذف"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
                        {balance > 0 && (
                          <button onClick={() => payBalance(invoice)} className="px-3 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-colors shadow-md">
                            تسديد
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

      {/* modal تعديل الفاتورة - بسيط وخفيف */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setEditingInvoice(null)}>
          <div className="bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-white/10 max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gray-900 border-b border-white/10 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">تعديل الفاتورة</h3>
                <p className="text-xs text-gray-500">#{editingInvoice.invoice_number}</p>
              </div>
              <button onClick={() => setEditingInvoice(null)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all text-lg">✕</button>
            </div>

            <div className="p-4 space-y-4">
              {/* بيانات العميل */}
              <div className="grid grid-cols-2 gap-2">
                <input value={editingInvoice.customer_name || ''} onChange={e => setEditingInvoice({ ...editingInvoice, customer_name: e.target.value })} className="bg-gray-800 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm" placeholder="الاسم" />
                <input value={editingInvoice.customer_phone || ''} onChange={e => setEditingInvoice({ ...editingInvoice, customer_phone: e.target.value })} className="bg-gray-800 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm" placeholder="الهاتف" />
              </div>

              {/* الخصم + الحالة */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 bg-gray-800 border border-white/10 rounded-lg px-3 py-2.5">
                  <input type="number" step="0.001" min="0" value={editingInvoice.discount || 0} onChange={e => setEditingInvoice({ ...editingInvoice, discount: e.target.value })} className="flex-1 bg-transparent text-white text-sm w-full outline-none" placeholder="الخصم" />
                  <span className="text-xs text-gray-500">د.ل</span>
                </div>
                <select value={editingInvoice.status || 'pending'} onChange={e => setEditingInvoice({ ...editingInvoice, status: e.target.value })} className="bg-gray-800 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm">
                  <option value="pending">قيد الانتظار</option>
                  <option value="processing">تجهيز</option>
                  <option value="ready">جاهز</option>
                  <option value="completed">مكتمل</option>
                </select>
              </div>

              {/* العناصر */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 font-bold">العناصر ({(editingInvoice.items || []).length})</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setShowGamePicker(true); setGameSearch('') }} className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-md text-[11px] font-bold hover:bg-emerald-500/30 transition-colors">+ لعبة</button>
                    <button onClick={() => setShowServicePicker(true)} className="px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-md text-[11px] font-bold hover:bg-blue-500/30 transition-colors">+ خدمة</button>
                  </div>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(editingInvoice.items || []).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.type === 'service' ? 'bg-blue-400' : 'bg-emerald-400'}`}></span>
                      <span className="flex-1 text-white text-sm truncate">{item.title}</span>
                      <span className="text-xs text-gray-400">{currency(item.price)}</span>
                      <button onClick={() => removeItemFromEdit(i)} className="text-red-400 hover:text-red-300 text-xs px-1">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* الإجمالي */}
              <div className="flex justify-between items-center bg-gray-800 rounded-lg px-4 py-3">
                <span className="text-sm text-gray-400">الإجمالي</span>
                <span className="text-lg font-black text-white">{currency((editingInvoice.items || []).reduce((s, i) => s + (Number(i.price) || 0), 0) - (Number(editingInvoice.discount) || 0))}</span>
              </div>

              {/* أزرار */}
              <div className="flex gap-2">
                <button onClick={() => setEditingInvoice(null)} className="flex-1 py-3 border border-white/10 text-gray-300 rounded-xl font-medium text-sm hover:bg-white/5 transition-all">إلغاء</button>
                <button onClick={handleSaveEdit} className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-sm transition-all">حفظ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال اختيار لعبة */}
      {showGamePicker && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4" onClick={() => { setShowGamePicker(false); setGameCategory(''); setGameSearch('') }}>
          <div className="bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-white/10 max-w-md w-full max-h-[75vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">اختر لعبة</h3>
                <button onClick={() => { setShowGamePicker(false); setGameCategory(''); setGameSearch('') }} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg text-lg">✕</button>
              </div>
              {/* فلتر الفئات */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-hide">
                <button onClick={() => setGameCategory('')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${!gameCategory ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>الكل</button>
                {categories.map(c => (
                  <button key={c.id} onClick={() => setGameCategory(String(c.id))} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${gameCategory === String(c.id) ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>{c.name}</button>
                ))}
              </div>
              <input autoFocus value={gameSearch} onChange={e => setGameSearch(e.target.value)} className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:ring-1 focus:ring-emerald-500/50" placeholder="ابحث عن لعبة..." />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredGames.map(game => (
                <button key={game.id} onClick={() => addGameToInvoice(game)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-right">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{game.title}</p>
                    <p className="text-gray-500 text-xs">{game.size_gb > 0 ? `${game.size_gb} GB` : ''}</p>
                  </div>
                  <span className="text-emerald-400 font-bold text-sm whitespace-nowrap">{currency(game.price)}</span>
                </button>
              ))}
              {filteredGames.length === 0 && <div className="text-center py-8 text-gray-500 text-sm">لا توجد نتائج</div>}
            </div>
          </div>
        </div>
      )}

      {/* مودال اختيار خدمة */}
      {showServicePicker && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4" onClick={() => setShowServicePicker(false)}>
          <div className="bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-white/10 max-w-md w-full max-h-[60vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">اختر خدمة</h3>
                <button onClick={() => setShowServicePicker(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg text-lg">✕</button>
              </div>
              <input autoFocus value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500/50" placeholder="ابحث عن خدمة..." />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredServices.map(service => (
                <button key={service.id} onClick={() => addServiceToInvoice(service)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-right">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{service.title}</p>
                  </div>
                  <span className="text-blue-400 font-bold text-sm whitespace-nowrap">{currency(service.price)}</span>
                </button>
              ))}
              {filteredServices.length === 0 && <div className="text-center py-8 text-gray-500 text-sm">لا توجد خدمات</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
