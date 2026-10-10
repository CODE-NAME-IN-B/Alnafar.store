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

function parseItems(invoice) {
  if (Array.isArray(invoice.items)) return invoice.items
  try {
    return JSON.parse(invoice.items) || []
  } catch {
    return []
  }
}

const Icon = {
  receipt: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  trend: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />,
  cash: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />,
  calendar: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />,
  banknote: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />,
  calendarRange: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zM6.75 12h.008v.008H6.75V12zm0 2.25h.008v.008H6.75v-.008zm0 2.25h.008v.008H6.75v-.008zm12-4.5h.008v.008H18.75V12zm0 2.25h.008v.008H18.75v-.008z" />,
  eye: <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>,
  wrench: <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z" />,
  gamepad: <><path strokeLinecap="round" strokeLinejoin="round" d="M6 11h4M8 9v4" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12h.01M18 10h.01" /><path strokeLinecap="round" strokeLinejoin="round" d="M17.32 5H6.68a4 4 0 00-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 003 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 019.828 16h4.344a2 2 0 011.414.586L17 18c.5.5 1 1 2 1a3 3 0 003-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0017.32 5z" /></>,
  cube: <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
}

const statusStyles = (status) =>
  status === 'completed' ? 'bg-emerald-900/50 text-emerald-300' :
  status === 'ready' ? 'bg-sky-900/50 text-sky-300' :
  status === 'processing' ? 'bg-amber-900/50 text-amber-300' :
  'bg-gray-700 text-gray-300'

const statusLabels = {
  pending: 'قيد الانتظار',
  processing: 'تجهيز',
  ready: 'جاهز',
  completed: 'مكتمل'
}

const statusBorder = (status) =>
  status === 'completed' ? 'border-emerald-500/30' :
  status === 'ready' ? 'border-sky-500/30' :
  status === 'processing' ? 'border-amber-500/30' :
  'border-gray-600'

function StatusPill({ status, selectable = false, onChange }) {
  const value = status || 'pending'
  if (selectable) {
    return (
      <div className="relative inline-flex items-center">
        <select
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          aria-label="حالة الفاتورة"
          className={`appearance-none cursor-pointer min-h-[38px] font-bold text-xs pl-8 pr-3 py-1.5 rounded-full border focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 transition-all ${statusStyles(value)} ${statusBorder(value)}`}
        >
          <option value="pending">{statusLabels.pending}</option>
          <option value="processing">{statusLabels.processing}</option>
          <option value="ready">{statusLabels.ready}</option>
          <option value="completed">{statusLabels.completed}</option>
        </select>
        <svg className="w-3.5 h-3.5 absolute left-2.5 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
      </div>
    )
  }
  return (
    <span className={`inline-flex items-center font-bold text-xs px-2.5 py-1 rounded-full border ${statusStyles(value)} ${statusBorder(value)}`}>
      {statusLabels[value] || value}
    </span>
  )
}

const itemMeta = (type) =>
  type === 'service' ? { cls: 'bg-sky-500/15 text-sky-400', icon: Icon.wrench } :
  type === 'package' ? { cls: 'bg-purple-500/15 text-purple-400', icon: Icon.cube } :
  { cls: 'bg-emerald-500/15 text-emerald-400', icon: Icon.gamepad }

function KpiCard({ icon, label, value, accent = 'teal', big }) {
  const accents = {
    teal: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    sky: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  }
  const blobs = {
    teal: 'bg-teal-500/5',
    emerald: 'bg-emerald-500/5',
    sky: 'bg-sky-500/5',
    amber: 'bg-amber-500/5'
  }
  return (
    <div className="relative overflow-hidden bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-4">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none ${blobs[accent] || blobs.teal}`}></div>
      <div className="relative z-10">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${accents[accent]}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>{icon}</svg>
        </div>
        <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
        <p className={`font-black tabular-nums leading-tight ${big ? 'text-3xl' : 'text-xl'} text-white break-all`}>{value}</p>
      </div>
    </div>
  )
}

export default function InvoicesTab() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 50 })
  const [summary, setSummary] = useState(null)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [detailsInvoice, setDetailsInvoice] = useState(null)
  const [search, setSearch] = useState('')
  const [pageLimit, setPageLimit] = useState(50)
  const [statusFilter, setStatusFilter] = useState('')
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
  const [payingAll, setPayingAll] = useState(false)

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
          icon: '/icon-192x192.png'
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

  useEffect(() => {
    if (!detailsInvoice) return
    const onKeyDown = (e) => { if (e.key === 'Escape') setDetailsInvoice(null) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [detailsInvoice])

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase()
    return invoices.filter(inv => {
      if (statusFilter && (inv.status || 'pending') !== statusFilter) return false
      if (!q) return true
      const num = String(inv.invoice_number || '').toLowerCase()
      const name = String(inv.customer_name || '').toLowerCase()
      return num.includes(q) || name.includes(q)
    })
  }, [invoices, search, statusFilter])

  const loadInvoices = async (page = 1) => {
    try {
      setLoading(true)
      const params = { page, limit: pageLimit, includeUnpaid: 1 }
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
      alert(error?.response?.data?.message || 'فشل تحديث الحالة')
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
        const updated = data.invoice || {};
        const newPaid = updated.paid_amount ?? (paidAmount + payment);
        const newStatus = updated.status ?? (newPaid >= finalTotal ? 'completed' : invoice.status);
        const stillOwes = (finalTotal - newPaid) > 0;
        setInvoices(prev => prev.map(inv => inv.id === invoice.id
          ? { ...inv, paid_amount: newPaid, status: newStatus, has_balance: stillOwes ? 1 : 0, isCarried: stillOwes ? inv.isCarried : 0 }
          : inv));
        setSummary(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          for (const k of ['collectedRevenue', 'rangeCollectedRevenue', 'todayCollectedRevenue', 'totalCollected', 'collected']) {
            if (next[k] !== undefined) next[k] = Number(next[k] || 0) + payment;
          }
          return next;
        });
      }
    } catch (error) {
      console.error('فشل في تسجيل الدفعة:', error);
      alert(error?.response?.data?.message || 'فشل في تسجيل الدفعة');
    }
  }

  const payAllInvoices = async () => {
    const scopeLabel = (dateFrom && dateTo)
      ? (dateFrom === dateTo ? `يوم ${dateFrom}` : `من ${dateFrom} إلى ${dateTo}`)
      : 'كل الفترات'
    if (!confirm(`سيتم تسديد كل الفواتير غير المسددة (${scopeLabel}) للفرع المحدد.\nهل تريد المتابعة؟`)) return
    try {
      setPayingAll(true)
      const body = {}
      if (dateFrom && dateTo) { body.dateFrom = dateFrom; body.dateTo = dateTo; body.includeUnpaid = 1 }
      const { data } = await api.post('/invoices/pay-all', body)
      if (data.success) {
        alert(data.message || 'تم تسديد جميع الفواتير')
        loadInvoices(1)
        loadSummary()
      }
    } catch (error) {
      console.error('فشل تسديد جميع الفواتير:', error)
      alert(error?.response?.data?.message || 'فشل تسديد جميع الفواتير')
    } finally {
      setPayingAll(false)
    }
  }

  const markUnpaid = async (invoice) => {
    const paid = Number(invoice.paid_amount || 0)
    if (paid <= 0) return
    if (!confirm(`سيتم إرجاع الفاتورة ${invoice.invoice_number} إلى "غير مدفوع" وتصفير المبلغ المدفوع (${currency(paid)}).\nهل تريد المتابعة؟`)) return
    try {
      const { data } = await api.put(`/invoices/${invoice.id}/mark-unpaid`)
      if (data.success) {
        setInvoices(prev => prev.map(inv => inv.id === invoice.id
          ? { ...inv, paid_amount: 0, status: 'pending', has_balance: 1 }
          : inv))
        setSummary(prev => {
          if (!prev) return prev
          const next = { ...prev }
          for (const k of ['collectedRevenue', 'rangeCollectedRevenue', 'todayCollectedRevenue', 'totalCollected', 'collected']) {
            if (next[k] !== undefined) next[k] = Math.max(0, Number(next[k] || 0) - paid)
          }
          return next
        })
      }
    } catch (error) {
      console.error('فشل تعديل الفاتورة إلى غير مدفوع:', error)
      alert(error?.response?.data?.message || 'فشل تعديل الفاتورة إلى غير مدفوع')
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
        customer_address: editingInvoice.customer_address || '',
        customer_notes: editingInvoice.customer_notes || '',
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

  const detailsItems = detailsInvoice ? parseItems(detailsInvoice) : []
  const detailsFinalTotal = detailsInvoice ? (detailsInvoice.total || 0) - (detailsInvoice.discount || 0) : 0
  const detailsBalance = detailsInvoice ? detailsFinalTotal - (detailsInvoice.paid_amount || 0) : 0

  return (
    <div className="p-4 sm:p-8 overflow-hidden max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 mt-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">قسم الفواتير</h2>
          <p className="text-gray-400 mt-1 text-sm">اختر نطاق التاريخ لحساب الأرباح (عن فترة محددة)</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={payAllInvoices}
            disabled={payingAll || loading}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-600/30 rounded-xl font-medium transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-wait min-h-[44px]"
          >
            {payingAll ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
            <span className="text-sm">{payingAll ? 'جارٍ التسديد...' : 'تسديد جميع الفواتير'}</span>
          </button>
          <button
            onClick={deleteAllInvoices}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-600/30 rounded-xl font-medium transition-all flex justify-center items-center gap-2 min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg> <span className="text-sm">حذف فواتير اليوم</span>
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-gray-900/40 backdrop-blur-md p-3 sm:p-5 rounded-2xl border border-white/5 shadow-xl mb-6 space-y-4">
        {/* Date Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3">
          <div className="flex-1 flex flex-row gap-2 sm:gap-4">
            <div className="flex-1">
              <label className="text-gray-400 text-xs sm:text-sm block mb-1.5 focus-within:text-[color:var(--brand)] transition-colors">من تاريخ:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700/50 rounded-xl px-2 sm:px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="text-gray-400 text-xs sm:text-sm block mb-1.5 focus-within:text-[color:var(--brand)] transition-colors">إلى تاريخ:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700/50 rounded-xl px-2 sm:px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
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
              className="px-4 py-2.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-600/30 rounded-xl font-medium transition-all text-sm min-h-[44px]"
            >
              اليوم
            </button>
            <button
              onClick={() => loadInvoices(1)}
              className="w-full sm:w-auto px-6 py-2.5 bg-[color:var(--brand)] hover:bg-[color:var(--brand-hover)] text-white rounded-xl font-medium transition-all shadow-lg shadow-teal-500/20 text-sm min-h-[44px]"
            >
              بحث بالتاريخ
            </button>
          </div>
        </div>

        {/* Search & Limit */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-2 sm:pt-0 sm:border-t-0 border-t border-white/5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث برقم الفاتورة أو العميل..."
              className="w-full bg-gray-950 border border-gray-700/50 rounded-xl pr-9 pl-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
            />
          </div>
          <select
            value={pageLimit}
            onChange={e => setPageLimit(parseInt(e.target.value) || 50)}
            className="w-full sm:w-auto bg-gray-950 border border-gray-700/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all cursor-pointer"
          >
            <option value={20}>20 فاتورة</option>
            <option value={50}>50 فاتورة</option>
            <option value={100}>100 فاتورة</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            aria-label="فلترة حسب الحالة"
            className="w-full sm:w-auto bg-gray-950 border border-gray-700/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all cursor-pointer"
          >
            <option value="">كل الحالات</option>
            <option value="pending">{statusLabels.pending}</option>
            <option value="processing">{statusLabels.processing}</option>
            <option value="ready">{statusLabels.ready}</option>
            <option value="completed">{statusLabels.completed}</option>
          </select>
          <button
            onClick={() => loadInvoices(pagination.page)}
            className="w-11 h-11 min-h-[44px] flex items-center justify-center bg-gray-950 border border-gray-700/50 rounded-xl text-gray-300 hover:text-white hover:border-teal-500/40 hover:bg-gray-900 transition-all cursor-pointer shrink-0"
            title="تحديث"
            aria-label="تحديث"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
          </button>
        </div>
      </div>

      {/* إحصائيات الفواتير */}
      {summary && (
        <div className="mb-8 space-y-4">
          {/* Period Stats */}
          {dateFrom && dateTo && (summary.rangeInvoices !== undefined || summary.rangeRevenue !== undefined) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KpiCard icon={Icon.calendarRange} label="فواتير الفترة" value={Number(summary.rangeInvoices) ?? 0} accent="sky" big />
              <KpiCard icon={Icon.trend} label="إيرادات الفترة" value={currency(Number(summary.rangeRevenue) || 0)} accent="emerald" big />
              <KpiCard
                icon={Icon.cash}
                label="الكاش المحصّل فعلياً (بدون الآجل)"
                value={currency(Number(summary.rangeCollectedRevenue) || 0)}
                accent="teal"
                big
              />
            </div>
          )}

          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <KpiCard icon={Icon.receipt} label="إجمالي الفواتير" value={summary.totalInvoices} accent="teal" />
            <KpiCard icon={Icon.trend} label="إجمالي المبيعات" value={currency(Number(summary.totalRevenue) || 0)} accent="emerald" />
            <KpiCard icon={Icon.cash} label="الكاش المحصّل كلياً" value={currency(Number(summary.collectedRevenue) || 0)} accent="sky" />
            <KpiCard icon={Icon.calendar} label="فواتير اليوم" value={summary.todayInvoices} accent="amber" />
            <KpiCard icon={Icon.banknote} label="كاش اليوم الفعلي" value={currency(Number(summary.todayCollectedRevenue) || 0)} accent="teal" />
          </div>
        </div>
      )}

      {(invoices.length === 0 || filteredInvoices.length === 0) ? (
        <div className="bg-gray-900/40 backdrop-blur-md p-8 sm:p-12 rounded-2xl border border-white/5 text-center shadow-xl">
          <div className="mb-4 opacity-60">
            <svg className="w-16 h-16 mx-auto text-gray-500" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">لا توجد فواتير</h3>
          <p className="text-gray-400 text-sm">
            {invoices.length > 0 ? 'لا توجد فواتير مطابقة للبحث أو الفلترة' : 'لم يتم العثور على أي فواتير في هذه الفترة'}
          </p>
        </div>
      ) : (
        <div className="mb-4">
          {/* Mobile Cards (Hidden on Desktop) */}
          <div className="grid grid-cols-1 md:hidden gap-4">
            {filteredInvoices.map((invoice) => {
              const finalTotal = (invoice.total || 0) - (invoice.discount || 0);
              const balance = finalTotal - (invoice.paid_amount || 0);
              const items = parseItems(invoice);

              return (
                <div key={invoice.id} className="bg-gray-900/60 backdrop-blur-md rounded-2xl border border-white/5 p-4 shadow-xl flex flex-col gap-3">
                  {/* Header: Num + Status */}
                  <div className="flex justify-between items-start pb-3 border-b border-white/5">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[color:var(--brand)] font-bold text-sm">{invoice.invoice_number}</span>
                      {invoice.isCarried ? (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-full px-2 py-0.5 w-fit">آجل مرحّل</span>
                      ) : null}
                      <span className="text-white text-sm font-medium">{invoice.customer_name || 'عميل نقدي'}</span>
                      {invoice.customer_notes && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-200 bg-amber-500/10 border border-amber-500/25 rounded-md px-2 py-1 max-w-[240px]" title={invoice.customer_notes}>
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                          <span className="font-bold shrink-0">ملاحظة:</span>
                          <span className="truncate">{invoice.customer_notes}</span>
                        </span>
                      )}
                    </div>
                    <StatusPill
                      status={invoice.status}
                      selectable
                      onChange={(value) => updateStatus(invoice.id, value)}
                    />
                  </div>

                  {/* Body: Amounts */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex flex-col bg-gray-950/60 p-2 rounded-lg border border-white/5">
                      <span className="text-gray-400 text-xs mb-1">المجموع</span>
                      <span className="text-white font-semibold">{currency(finalTotal)}</span>
                    </div>
                    <div className="flex flex-col bg-gray-950/60 p-2 rounded-lg border border-white/5">
                      <span className="text-gray-400 text-xs mb-1">المدفوع</span>
                      <span className="text-emerald-400 font-bold">{currency(invoice.paid_amount || 0)}</span>
                    </div>
                    {balance > 0 && (
                      <div className="col-span-2 flex flex-col bg-red-900/20 border border-red-500/30 p-2 rounded-lg">
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
                  <div className="grid grid-cols-4 gap-2 mt-2 pt-3 border-t border-white/5">
                    <button onClick={() => reprintInvoice(invoice)} className="py-2.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg transition-all cursor-pointer flex items-center justify-center min-h-[44px]" title="طباعة"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" /></svg></button>
                    <button onClick={() => setDetailsInvoice(invoice)} className="py-2.5 bg-teal-500/20 text-teal-400 hover:bg-teal-500 hover:text-white rounded-lg transition-all cursor-pointer flex items-center justify-center min-h-[44px]" title="التفاصيل"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">{Icon.eye}</svg></button>
                    <button onClick={() => setEditingInvoice({
                        id: invoice.id, invoice_number: invoice.invoice_number,
                        customer_name: invoice.customer_name, customer_phone: invoice.customer_phone,
                        customer_address: invoice.customer_address || '',
                        customer_notes: invoice.customer_notes || '',
                        items: items, discount: invoice.discount || 0, status: invoice.status
                    })} className="py-2.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white rounded-lg transition-all cursor-pointer flex items-center justify-center min-h-[44px]" title="تعديل"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg></button>
                    <button onClick={() => deleteInvoice(invoice.id)} className="py-2.5 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all cursor-pointer flex items-center justify-center min-h-[44px]" title="حذف"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>

                    {balance > 0 && (
                      <button onClick={() => payBalance(invoice)} className="col-span-4 mt-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-sm transition-all shadow-lg shadow-teal-500/20 min-h-[44px]">
                        تسديد الباقي ({currency(balance)})
                      </button>
                    )}
                    {(invoice.paid_amount || 0) > 0 && (
                      <button onClick={() => markUnpaid(invoice)} className="col-span-4 mt-1 py-2.5 bg-gray-700/60 hover:bg-red-600 text-red-300 hover:text-white font-bold rounded-lg text-sm transition-all border border-red-600/30 min-h-[44px]">
                        إرجاع الفاتورة إلى غير مدفوع
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (Hidden on Mobile) */}
          <div className="hidden md:block overflow-hidden bg-gray-900/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-white">
                <thead>
                  <tr className="border-b border-white/10 bg-gray-900/80">
                    <th className="text-right py-3 px-4 font-semibold text-xs text-gray-400">رقم الفاتورة</th>
                    <th className="text-right py-3 px-4 font-semibold text-xs text-gray-400">العميل</th>
                    <th className="text-right py-3 px-4 font-semibold text-xs text-gray-400">المجموع</th>
                    <th className="text-right py-3 px-4 font-semibold text-xs text-gray-400">المدفوع</th>
                    <th className="text-right py-3 px-4 font-semibold text-xs text-gray-400">الباقي</th>
                    <th className="text-right py-3 px-4 font-semibold text-xs text-gray-400">الحالة</th>
                    <th className="text-right py-3 px-4 font-semibold text-xs text-gray-400">التاريخ</th>
                    <th className="text-center py-3 px-4 font-semibold text-xs text-gray-400">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => {
                    const finalTotal = (invoice.total || 0) - (invoice.discount || 0);
                    const balance = finalTotal - (invoice.paid_amount || 0);
                    const items = parseItems(invoice);
                    return (
                    <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors align-middle">
                      <td className="py-3 px-4 font-mono text-[color:var(--brand)] font-bold">{invoice.invoice_number}{invoice.isCarried ? <span className="block text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-full px-2 py-0.5 w-fit mt-1">آجل مرحّل</span> : null}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{invoice.customer_name || 'نقدي'}</div>
                        {invoice.customer_phone && <div className="text-xs text-gray-400 mt-0.5" dir="ltr">{invoice.customer_phone}</div>}
                        {invoice.customer_notes && (
                          <div className="inline-flex items-center gap-1.5 text-xs text-amber-200 bg-amber-500/10 border border-amber-500/25 rounded-md px-2 py-1 mt-1 max-w-[220px]" title={invoice.customer_notes}>
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                            <span className="font-bold shrink-0">ملاحظة:</span>
                            <span className="truncate">{invoice.customer_notes}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-200 tabular-nums whitespace-nowrap">{currency(finalTotal)}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400 tabular-nums whitespace-nowrap">{currency(invoice.paid_amount || 0)}</td>
                      <td className="py-3 px-4 tabular-nums whitespace-nowrap">
                        {balance > 0
                          ? <span className="font-bold text-red-400">{currency(balance)}</span>
                          : <span className="text-gray-500">{currency(0)}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <StatusPill
                          status={invoice.status}
                          selectable
                          onChange={(value) => updateStatus(invoice.id, value)}
                        />
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs tabular-nums whitespace-nowrap">
                        {new Date(invoice.created_at).toLocaleString('ar-LY', {
                          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                          <button onClick={() => reprintInvoice(invoice)} className="w-9 h-9 min-h-9 flex items-center justify-center rounded-lg bg-gray-800 text-white transition-all cursor-pointer hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50" aria-label="طباعة الفاتورة" title="طباعة">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" /></svg>
                          </button>
                          <button onClick={() => setDetailsInvoice(invoice)} className="w-9 h-9 min-h-9 flex items-center justify-center rounded-lg bg-gray-800 text-white transition-all cursor-pointer hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50" aria-label="عرض التفاصيل" title="تفاصيل">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">{Icon.eye}</svg>
                          </button>
                          <button onClick={() => setEditingInvoice({
                            id: invoice.id, invoice_number: invoice.invoice_number,
                            customer_name: invoice.customer_name, customer_phone: invoice.customer_phone,
                            customer_address: invoice.customer_address || '',
                            customer_notes: invoice.customer_notes || '',
                            items: items, discount: invoice.discount || 0, status: invoice.status
                          })} className="w-9 h-9 min-h-9 flex items-center justify-center rounded-lg bg-gray-800 text-white transition-all cursor-pointer hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50" aria-label="تعديل الفاتورة" title="تعديل">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                          </button>
                          <button onClick={() => deleteInvoice(invoice.id)} className="w-9 h-9 min-h-9 flex items-center justify-center rounded-lg bg-gray-800 text-white transition-all cursor-pointer hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50" aria-label="حذف الفاتورة" title="حذف">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                          </button>
                          {balance > 0 && (
                            <button onClick={() => payBalance(invoice)} className="px-3 h-9 min-h-[44px] bg-teal-600/90 hover:bg-teal-500 text-white rounded-lg text-xs font-bold whitespace-nowrap transition-all shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50">
                              تسديد
                            </button>
                          )}
                          {(invoice.paid_amount || 0) > 0 && (
                            <button onClick={() => markUnpaid(invoice)} className="px-3 h-9 min-h-[44px] text-xs font-bold border border-red-600/30 text-red-300 hover:bg-red-600 hover:text-white rounded-lg whitespace-nowrap transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50" aria-label="إرجاع إلى غير مدفوع" title="إرجاع إلى غير مدفوع">
                              غير مدفوع
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
          </div>

          {/* Pagination (Shared) */}
          <div className="flex items-center justify-between bg-gray-900/50 backdrop-blur-md p-4 rounded-xl border border-white/5 mt-4">
            <button disabled={pagination.page <= 1} onClick={() => loadInvoices(pagination.page - 1)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all min-h-[44px]">
              السابق
            </button>
            <span className="text-gray-300 text-sm font-medium font-mono tabular-nums">
              صفحة {pagination.page} من {pagination.pages}{(pagination.total !== undefined && pagination.total !== null) ? ` | ${pagination.total} فاتورة` : ''}
            </span>
            <button disabled={pagination.page >= pagination.pages} onClick={() => loadInvoices(pagination.page + 1)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all min-h-[44px]">
              التالي
            </button>
          </div>
        </div>
      )}

      {/* modal تفاصيل الفاتورة */}
      {detailsInvoice && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="تفاصيل الفاتورة"
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={() => setDetailsInvoice(null)}
        >
          <div className="w-full sm:max-w-2xl lg:max-w-3xl bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-white/10 max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-gray-800/90 backdrop-blur-md p-4 flex items-center justify-between border-b border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white">تفاصيل الفاتورة</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">#{detailsInvoice.invoice_number}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 tabular-nums">
                  {new Date(detailsInvoice.created_at).toLocaleString('ar-LY', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button onClick={() => setDetailsInvoice(null)} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer" aria-label="إغلاق">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4">
                {/* Zone A: customer + items */}
                <div className="space-y-4 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <StatusPill status={detailsInvoice.status} />
                    {detailsInvoice.isCarried ? <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-full px-2 py-0.5">آجل مرحّل</span> : null}
                  </div>

                  {(detailsInvoice.customer_name || detailsInvoice.customer_phone || detailsInvoice.customer_address || detailsInvoice.customer_notes) && (
                    <div className="bg-gray-800/60 border border-white/5 rounded-xl p-3 space-y-1.5 text-sm">
                      {detailsInvoice.customer_name && <p className="font-bold text-white">الاسم: {detailsInvoice.customer_name}</p>}
                      {detailsInvoice.customer_phone && <p className="text-gray-300 text-xs" dir="ltr">الهاتف: {detailsInvoice.customer_phone}</p>}
                      {detailsInvoice.customer_address && <p className="text-xs text-amber-200">العنوان: {detailsInvoice.customer_address}</p>}
                      {detailsInvoice.customer_notes && <p className="text-xs text-amber-200">ملاحظات: {detailsInvoice.customer_notes}</p>}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 font-bold">عدّة العناصر ({detailsItems.length})</span>
                      <span className="text-[11px] text-gray-500 tabular-nums">{detailsItems.length}</span>
                    </div>
                    <div className="divide-y divide-white/5 bg-gray-800/40 border border-white/5 rounded-xl">
                      {detailsItems.map((item, i) => {
                        const meta = itemMeta(item.type)
                        const sub = (item.size_gb !== undefined && item.size_gb !== null && item.size_gb !== '')
                          ? `${item.size_gb} GB`
                          : (item.quantity ? `× ${item.quantity}` : null)
                        return (
                          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.cls}`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">{meta.icon}</svg>
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                              {sub && <p className="text-[11px] text-gray-500">{sub}</p>}
                            </div>
                            <span className="text-sm font-mono tabular-nums text-gray-200 whitespace-nowrap">{currency(item.price)}</span>
                          </div>
                        )
                      })}
                      {detailsItems.length === 0 && (
                        <div className="text-center text-gray-500 text-xs py-4">لا توجد عناصر</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Zone B: totals + actions */}
                <div className="space-y-4">
                  <div className="bg-gray-800/60 border border-white/5 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">المجموع</span>
                      <span className="text-white tabular-nums">{currency(detailsInvoice.total || 0)}</span>
                    </div>
                    {Number(detailsInvoice.discount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">الخصم</span>
                        <span className="text-amber-400 tabular-nums">-{currency(detailsInvoice.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">المدفوع</span>
                      <span className="text-emerald-400 font-bold tabular-nums">{currency(detailsInvoice.paid_amount || 0)}</span>
                    </div>
                    {detailsBalance > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">الباقي</span>
                        <span className="text-red-400 font-bold tabular-nums">{currency(detailsBalance)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-t border-white/5 pt-3">
                      <span className="text-sm font-bold text-white">النهائي</span>
                      <span className="text-lg font-black text-[color:var(--brand)] tabular-nums">{currency(detailsFinalTotal)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button onClick={() => reprintInvoice(detailsInvoice)} className="py-3 min-h-[44px] rounded-xl font-bold text-sm bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer">
                      طباعة
                    </button>
                    <button onClick={() => { const inv = detailsInvoice; setDetailsInvoice(null); setEditingInvoice({
                      id: inv.id, invoice_number: inv.invoice_number,
                      customer_name: inv.customer_name, customer_phone: inv.customer_phone,
                      customer_address: inv.customer_address || '',
                      customer_notes: inv.customer_notes || '',
                      items: parseItems(inv), discount: inv.discount || 0, status: inv.status
                    }) }} className="py-3 min-h-[44px] rounded-xl font-bold text-sm bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-white transition-all cursor-pointer">
                      تعديل
                    </button>
                    <button onClick={() => setDetailsInvoice(null)} className="py-3 min-h-[44px] rounded-xl font-semibold text-sm border border-white/10 text-gray-300 hover:bg-white/5 transition-all cursor-pointer">إغلاق</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* modal تعديل الفاتورة */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setEditingInvoice(null)}>
          <div className="bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-white/10 w-full sm:max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-l from-[color:var(--brand)] to-emerald-600 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">تعديل الفاتورة</h3>
                <p className="text-xs text-white/70">#{editingInvoice.invoice_number}</p>
              </div>
              <button onClick={() => setEditingInvoice(null)} className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-all cursor-pointer" aria-label="إغلاق">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* بيانات العميل */}
              <div>
                <label className="text-xs text-gray-400 font-bold mb-1 block">بيانات العميل</label>
                <div className="grid grid-cols-2 gap-2">
                  <input value={editingInvoice.customer_name || ''} onChange={e => setEditingInvoice({ ...editingInvoice, customer_name: e.target.value })} className="bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all" placeholder="الاسم" />
                  <input value={editingInvoice.customer_phone || ''} onChange={e => setEditingInvoice({ ...editingInvoice, customer_phone: e.target.value })} className="bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all" placeholder="الهاتف" />
                </div>
                <div className="mt-2">
                  <label className="text-xs text-gray-400 font-bold mb-1 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                    ملاحظات الفاتورة
                  </label>
                  <textarea
                    value={editingInvoice.customer_notes || ''}
                    onChange={e => setEditingInvoice({ ...editingInvoice, customer_notes: e.target.value })}
                    rows={2}
                    className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none transition-all placeholder-gray-500"
                    placeholder="أضف ملاحظة تظهر مع الفاتورة..."
                  />
                </div>
              </div>

              {/* الخصم + الحالة */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 font-bold mb-1 block">الخصم</label>
                  <div className="flex items-center gap-2 bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-teal-500/50 transition-all">
                    <input type="number" step="0.001" min="0" value={editingInvoice.discount || ''} onChange={e => setEditingInvoice({ ...editingInvoice, discount: e.target.value })} className="flex-1 bg-transparent text-white text-sm w-full outline-none" placeholder="0" />
                    <span className="text-xs text-gray-500">د.ل</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold mb-1 block">الحالة</label>
                  <select value={editingInvoice.status || 'pending'} onChange={e => setEditingInvoice({ ...editingInvoice, status: e.target.value })} className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all">
                    <option value="pending">قيد الانتظار</option>
                    <option value="processing">تجهيز</option>
                    <option value="ready">جاهز</option>
                    <option value="completed">مكتمل</option>
                  </select>
                </div>
              </div>

              {/* العناصر */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 font-bold">العناصر ({(editingInvoice.items || []).length})</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setShowGamePicker(true); setGameSearch('') }} className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-md text-[11px] font-bold hover:bg-emerald-500/30 transition-all cursor-pointer min-h-[32px]">+ لعبة</button>
                    <button onClick={() => setShowServicePicker(true)} className="px-2.5 py-1 bg-teal-500/20 text-teal-400 rounded-md text-[11px] font-bold hover:bg-teal-500/30 transition-all cursor-pointer min-h-[32px]">+ خدمة</button>
                  </div>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {(editingInvoice.items || []).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-800/80 rounded-lg px-3 py-2 border border-white/5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.type === 'service' ? 'bg-sky-400' : 'bg-emerald-400'}`}></span>
                      <span className="flex-1 text-white text-sm truncate">{item.title}</span>
                      <span className="text-xs text-gray-400 font-mono">{currency(item.price)}</span>
                      <button onClick={() => removeItemFromEdit(i)} className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-all cursor-pointer" aria-label="حذف العنصر">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                  {(editingInvoice.items || []).length === 0 && (
                    <div className="text-center text-gray-500 text-xs py-4">لا توجد عناصر</div>
                  )}
                </div>
              </div>

              {/* الإجمالي */}
              <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300 font-bold">الإجمالي</span>
                  <span className="text-lg font-black text-[color:var(--brand)] tabular-nums">{currency((editingInvoice.items || []).reduce((s, i) => s + (Number(i.price) || 0), 0) - (Number(editingInvoice.discount) || 0))}</span>
                </div>
              </div>

              {/* أزرار */}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditingInvoice(null)} className="flex-1 py-3 border border-white/10 text-gray-300 rounded-xl font-medium text-sm hover:bg-white/5 transition-all min-h-[44px]">إلغاء</button>
                <button onClick={handleSaveEdit} className="flex-1 py-3 bg-gradient-to-l from-[color:var(--brand)] to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-teal-500/20 min-h-[44px]">حفظ</button>
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
                <button onClick={() => { setShowGamePicker(false); setGameCategory(''); setGameSearch('') }} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer" aria-label="إغلاق">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {/* فلتر الفئات */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-hide">
                <button onClick={() => setGameCategory('')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${!gameCategory ? 'bg-[color:var(--brand)] text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>الكل</button>
                {categories.map(c => (
                  <button key={c.id} onClick={() => setGameCategory(String(c.id))} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${gameCategory === String(c.id) ? 'bg-[color:var(--brand)] text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>{c.name}</button>
                ))}
              </div>
              <input autoFocus value={gameSearch} onChange={e => setGameSearch(e.target.value)} className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-teal-500/50 transition-all" placeholder="ابحث عن لعبة..." />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredGames.map(game => (
                <button key={game.id} onClick={() => addGameToInvoice(game)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-right cursor-pointer">
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
                <button onClick={() => setShowServicePicker(false)} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer" aria-label="إغلاق">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <input autoFocus value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-teal-500/50 transition-all" placeholder="ابحث عن خدمة..." />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredServices.map(service => (
                <button key={service.id} onClick={() => addServiceToInvoice(service)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-right cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{service.title}</p>
                  </div>
                  <span className="text-teal-400 font-bold text-sm whitespace-nowrap">{currency(service.price)}</span>
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