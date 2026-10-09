import React, { useState, useEffect } from 'react'
import { api } from './api'
import socket from './socket'
import { reprintInvoice, getInvoiceSettings } from './utils/invoicePrint'
import Loader from './Loader'

function currency(num) {
  return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(num)
}

function RangeCard({ icon, label, value, accent }) {
  const accents = {
    teal: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    sky: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    red: 'bg-red-500/15 text-red-400 border-red-500/30'
  }
  return (
    <div className="relative overflow-hidden bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-4">
      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>
      <div className="relative z-10">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${accents[accent]}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>{icon}</svg>
        </div>
        <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
        <p className={`font-black tabular-nums leading-tight ${value.length > 14 ? 'text-xl' : 'text-3xl'} text-white break-all`}>{value}</p>
      </div>
    </div>
  )
}

export default function DailyReportTab() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [rangeStart, setRangeStart] = useState(new Date().toISOString().split('T')[0])
  const [rangeEnd, setRangeEnd] = useState(new Date().toISOString().split('T')[0])
  const [range, setRange] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [closeNotes, setCloseNotes] = useState('')
  const [editInvoice, setEditInvoice] = useState(null)
  const [reprinting, setReprinting] = useState(null)

  useEffect(() => {
    loadDailyReport(selectedDate)
    loadReportsHistory()
    socket.on('invoice_created', () => {
      if (selectedDate === new Date().toISOString().split('T')[0]) loadDailyReport(selectedDate)
      loadReportsHistory()
    })
    return () => { socket.off('invoice_created') }
  }, [selectedDate])

  const loadDailyReport = async (date) => {
    try {
      setLoading(true)
      const { data } = await api.get(`/daily-report/${date}`, { params: { includeUnpaid: 1 } })
      setReport(data.report || null)
    } catch (error) {
      console.error('خطأ في تحميل الجرد اليومي:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReportsHistory = async () => {
    try {
      const { data } = await api.get('/daily-reports?limit=10')
      setReports(data.reports || [])
    } catch (error) {
      console.error('خطأ في تحميل تاريخ التقارير:', error)
    }
  }

  const loadRange = async () => {
    if (!rangeStart) { alert('يرجى اختيار تاريخ البداية'); return }
    try {
      const { data } = await api.get('/daily-report-range', { params: { start: rangeStart, end: rangeEnd } })
      if (data.success) setRange(data.range)
    } catch (error) {
      console.error('خطأ في تحميل تقارير النطاق:', error)
      alert('فشل تحميل تقارير النطاق')
    }
  }

  const exportCsv = async () => {
    if (!rangeStart) { alert('يرجى اختيار تاريخ البداية'); return }
    try {
      setExporting(true)
      const res = await api.get('/daily-report/export.csv', { params: { start: rangeStart, end: rangeEnd }, responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `daily-report-${rangeStart}${rangeEnd !== rangeStart ? '_' + rangeEnd : ''}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('خطأ في التصدير CSV:', error)
      alert('فشل تصدير CSV')
    } finally {
      setExporting(false)
    }
  }

  const deleteAllInvoicesAllDays = async () => {
    if (!confirm('تحذير: سيتم حذف جميع الفواتير لكل الأيام. هل أنت متأكد؟')) return
    if (!confirm('تأكيد نهائي: هذا الإجراء لا يمكن التراجع عنه.')) return
    try {
      const { data } = await api.delete('/invoices')
      if (data.success) {
        alert(data.message)
        await loadDailyReport(selectedDate)
        await loadReportsHistory()
      }
    } catch (error) {
      console.error('خطأ في حذف جميع الفواتير:', error)
      alert('حدث خطأ في حذف جميع الفواتير')
    }
  }

  const closeDailyReport = async (date) => {
    if (!confirm(`هل أنت متأكد من إغلاق الجرد ليوم ${date}؟`)) return
    try {
      const { data } = await api.post(`/daily-report/${date}/close`, { notes: closeNotes })
      if (data.success) {
        alert('تم إغلاق الجرد اليومي بنجاح')
        loadDailyReport(selectedDate)
        loadReportsHistory()
        setCloseNotes('')
      }
    } catch (error) {
      console.error('خطأ في إغلاق الجرد:', error)
      alert('حدث خطأ في إغلاق الجرد')
    }
  }

  const handleReprint = async (inv) => {
    try {
      setReprinting(inv.id)
      await reprintInvoice(inv)
    } catch (_) {
      alert('فشل في إعادة الطباعة')
    } finally {
      setReprinting(null)
    }
  }

  const handleSaveEdit = async () => {
    if (!editInvoice || !editInvoice.id) return
    const items = editInvoice.items || []
    const total = items.reduce((s, i) => s + (Number(i.price) || 0), 0)
    const discount = Number(editInvoice.discount) || 0
    try {
      await api.put(`/invoices/${editInvoice.id}`, {
        customer_name: editInvoice.customer_name,
        customer_phone: editInvoice.customer_phone,
        customer_address: editInvoice.customer_address || '',
        customer_notes: editInvoice.customer_notes || '',
        items,
        total,
        discount,
        status: editInvoice.status
      })
      setEditInvoice(null)
      loadDailyReport(selectedDate)
    } catch (err) {
      alert(err?.response?.data?.message || 'فشل حفظ التعديلات')
    }
  }

  const removeItemFromEdit = (index) => {
    if (!editInvoice) return
    const items = [...(editInvoice.items || [])]
    items.splice(index, 1)
    setEditInvoice({ ...editInvoice, items })
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader />
        <p className="text-gray-400">جاري تحميل الجرد اليومي...</p>
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8">
      {/* عنوان وتاريخ واحد واضح */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white">قسم الجرد اليومي</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-gray-400 text-sm">تاريخ الجرد:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 min-h-[44px]"
          />
          <button
            onClick={() => setShowExport(!showExport)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] ${showExport ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40' : 'bg-gray-800 hover:bg-gray-700 text-white border border-white/10'}`}
          >
            {showExport ? 'إخفاء التصدير' : 'تصدير نطاق'}
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] ${showHistory ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40' : 'bg-gray-800 hover:bg-gray-700 text-white border border-white/10'}`}
          >
            {showHistory ? 'إخفاء التاريخ' : 'عرض التاريخ'}
          </button>
          <button
            onClick={deleteAllInvoicesAllDays}
            className="px-4 py-2.5 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-600/30 rounded-xl text-sm font-medium transition-all min-h-[44px]"
          >
            حذف كل الفواتير
          </button>
        </div>
      </div>

      {/* نطاق التصدير (منفصل ومرتب) */}
      {showExport && (
        <div className="bg-gray-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-4 mb-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-3">تصدير نطاق تواريخ</h3>
          <div className="flex flex-wrap items-center gap-3">
            <input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} className="bg-gray-950 border border-gray-700/50 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 min-h-[44px]" />
            <span className="text-gray-400">إلى</span>
            <input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className="bg-gray-950 border border-gray-700/50 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 min-h-[44px]" />
            <button onClick={loadRange} className="px-4 py-2.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-600/30 rounded-xl text-sm font-medium transition-all min-h-[44px]">عرض النطاق</button>
            <button onClick={exportCsv} disabled={exporting} className="px-4 py-2.5 bg-amber-600/20 text-amber-400 hover:bg-amber-600 hover:text-white disabled:opacity-60 border border-amber-600/30 rounded-xl text-sm font-medium transition-all min-h-[44px]">{exporting ? 'جارٍ التصدير...' : 'تصدير CSV'}</button>
          </div>
        </div>
      )}

      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* إحصائيات اليوم */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-5">
              <h3 className="text-lg font-bold text-white mb-4">إحصائيات {selectedDate}</h3>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center p-3 bg-gray-950/60 border border-white/5 rounded-xl">
                  <span className="text-gray-300 text-sm">عدد الفواتير:</span>
                  <span className="text-xl font-bold text-white tabular-nums">{report.total_invoices || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950/60 border border-white/5 rounded-xl">
                  <span className="text-gray-300 text-sm">آخر رقم فاتورة:</span>
                  <span className="text-lg font-bold text-[color:var(--brand)] tabular-nums">{report.last_invoice_number || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950/60 border border-white/5 rounded-xl">
                  <span className="text-gray-300 text-sm">إجمالي المبيعات:</span>
                  <span className="font-bold text-emerald-400 tabular-nums">{currency(report.total_revenue || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950/60 border border-white/5 rounded-xl">
                  <span className="text-gray-300 text-sm">إجمالي الخصومات:</span>
                  <span className="font-bold text-red-400 tabular-nums">{currency(report.total_discount || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-l from-[color:var(--brand)] to-emerald-600 rounded-xl shadow-lg shadow-teal-500/20">
                  <span className="text-white font-medium">صافي الربح:</span>
                  <span className="text-lg font-bold text-white tabular-nums">{currency(report.net_revenue || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-950/60 border border-white/5 rounded-xl">
                  <span className="text-gray-300 text-sm">حالة الجرد:</span>
                  <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${report.is_closed ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {report.is_closed ? 'مغلق' : 'مفتوح'}
                  </span>
                </div>
              </div>
              {!report.is_closed && report.total_invoices > 0 && (
                <div className="mt-4 space-y-2">
                  <input
                    className="w-full bg-gray-950/60 border border-gray-700/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                    value={closeNotes}
                    onChange={(e) => setCloseNotes(e.target.value)}
                    placeholder="ملاحظات الإغلاق (اختياري)"
                  />
                  <button onClick={() => closeDailyReport(selectedDate)} className="w-full px-4 py-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30 rounded-xl text-sm font-medium transition-all min-h-[44px]">إغلاق الجرد اليومي</button>
                </div>
              )}
            </div>
          </div>

          {/* قائمة الفواتير + إجراءات */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-5">
              <h3 className="text-lg font-bold text-white mb-4">فواتير اليوم ({report.invoices?.length || 0})</h3>
              {report.invoices && report.invoices.length > 0 ? (
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-white text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-right py-2 px-3 text-gray-400 font-semibold text-xs">رقم الفاتورة</th>
                        <th className="text-right py-2 px-3 text-gray-400 font-semibold text-xs">العميل</th>
                        <th className="text-right py-2 px-3 text-gray-400 font-semibold text-xs">المجموع</th>
                        <th className="text-right py-2 px-3 text-gray-400 font-semibold text-xs">الخصم</th>
                        <th className="text-right py-2 px-3 text-gray-400 font-semibold text-xs">الصافي</th>
                        <th className="text-right py-2 px-3 text-gray-400 font-semibold text-xs">الوقت</th>
                        <th className="text-center py-2 px-3 text-gray-400 font-semibold text-xs">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(report.invoices || []).map((inv) => (
                        <tr key={inv.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                          <td className="py-2.5 px-3 font-mono text-[color:var(--brand)]">{inv.invoice_number}</td>
                          <td className="py-2.5 px-3">{inv.customer_name || 'نقدي'}</td>
                          <td className="py-2.5 px-3 text-gray-300 tabular-nums">{currency(inv.total)}</td>
                          <td className="py-2.5 px-3 text-red-400 tabular-nums">{inv.discount > 0 ? `-${currency(inv.discount)}` : '—'}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-400 tabular-nums">{currency((inv.total || 0) - (inv.discount || 0))}</td>
                          <td className="py-2.5 px-3 text-gray-400 tabular-nums">{new Date(inv.created_at).toLocaleTimeString('ar-LY')}</td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex flex-wrap gap-2 justify-center min-w-[120px]">
                              <button
                                onClick={() => handleReprint(inv)}
                                disabled={reprinting === inv.id}
                                className="px-3 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white disabled:opacity-50 rounded-lg text-xs font-medium transition-all min-h-[44px] cursor-pointer"
                                title="إعادة طباعة"
                              >
                                {reprinting === inv.id ? '...' : 'طباعة'}
                              </button>
                              <button
                                onClick={() => setEditInvoice({ ...inv })}
                                className="px-3 py-2 bg-teal-500/20 text-teal-400 hover:bg-teal-500 hover:text-white rounded-lg text-xs font-medium transition-all min-h-[44px] cursor-pointer"
                                title="تعديل الفاتورة"
                              >
                                تعديل
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 text-sm">
                  <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  لا توجد فواتير لهذا التاريخ
                </div>
              )}
            </div>
            {report.carriedInvoices && report.carriedInvoices.length > 0 && (
              <div className="bg-amber-500/5 backdrop-blur-md rounded-2xl border border-amber-500/20 p-5 mt-4">
                <h3 className="text-sm font-bold text-amber-300 mb-3">آجل مستحق من أيام سابقة ({report.carriedInvoices.length}) — يُرحّل لليوم</h3>
                <div className="space-y-2">
                  {report.carriedInvoices.map((inv) => {
                    const balance = (inv.total || 0) - (inv.discount || 0) - (inv.paid_amount || 0);
                    return (
                      <div key={inv.id} className="flex items-center justify-between gap-2 bg-gray-900/60 rounded-xl px-3 py-2.5 border border-amber-500/10">
                        <div className="min-w-0">
                          <div className="font-mono text-[color:var(--brand)] text-sm font-bold">{inv.invoice_number}</div>
                          <div className="text-white text-xs truncate">{inv.customer_name || 'عميل نقدي'}</div>
                        </div>
                        <div className="text-left flex-shrink-0">
                          <div className="text-red-400 font-bold text-sm tabular-nums">{currency(balance)}</div>
                          <div className="text-gray-500 text-[10px]">متبقي</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* نطاق التقارير */}
      {range && (
        <div className="mt-6 bg-gray-900/60 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">تقارير من {range.start} إلى {range.end}</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <RangeCard
              accent="teal"
              label="عدد الفواتير"
              value={String(range.totals?.total_invoices ?? 0)}
              icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
            />
            <RangeCard
              accent="emerald"
              label="إجمالي المبيعات"
              value={currency(range.totals?.total_revenue ?? 0)}
              icon={<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />}
            />
            <RangeCard
              accent="red"
              label="إجمالي الخصومات"
              value={currency(range.totals?.total_discount ?? 0)}
              icon={<path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />}
            />
            <RangeCard
              accent="sky"
              label="الصافي"
              value={currency(range.totals?.net_revenue ?? 0)}
              icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
            />
          </div>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-white text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-right py-2 px-3 text-gray-400 font-semibold text-xs">التاريخ</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-semibold text-xs">الفواتير</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-semibold text-xs">المبيعات</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-semibold text-xs">الخصومات</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-semibold text-xs">الصافي</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-semibold text-xs">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {(range.days || []).map((d) => (
                  <tr key={d.date} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-3">{d.date}</td>
                    <td className="py-2.5 px-3 tabular-nums">{d.total_invoices}</td>
                    <td className="py-2.5 px-3 text-emerald-400 tabular-nums">{currency(d.total_revenue)}</td>
                    <td className="py-2.5 px-3 text-red-400 tabular-nums">{currency(d.total_discount)}</td>
                    <td className="py-2.5 px-3 font-bold text-white tabular-nums">{currency(d.net_revenue)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${d.is_closed ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>{d.is_closed ? 'مغلق' : 'مفتوح'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* تاريخ التقارير */}
      {showHistory && reports.length > 0 && (
        <div className="mt-6 bg-gray-900/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-5">
          <h3 className="text-lg font-bold text-white mb-4">تاريخ التقارير اليومية</h3>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-white text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-right py-2 px-3 text-gray-400 font-semibold text-xs">التاريخ</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-semibold text-xs">عدد الفواتير</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-semibold text-xs">إجمالي المبيعات</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-semibold text-xs">صافي الربح</th>
                  <th className="text-center py-2 px-3 text-gray-400 font-semibold text-xs">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {(reports || []).map((r) => (
                  <tr key={r.date} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer" onClick={() => setSelectedDate(r.date)}>
                    <td className="py-2.5 px-3 font-medium">{r.date}</td>
                    <td className="py-2.5 px-3 tabular-nums">{r.total_invoices}</td>
                    <td className="py-2.5 px-3 text-emerald-400 tabular-nums">{currency(r.total_revenue)}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400 tabular-nums">{currency(r.net_revenue)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${r.is_closed ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>{r.is_closed ? 'مغلق' : 'مفتوح'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* modal تعديل الفاتورة */}
      {editInvoice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setEditInvoice(null)}>
          <div className="bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-white/10 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-gradient-to-l from-[color:var(--brand)] to-emerald-600 p-4 sm:p-5 flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-bold text-white">تعديل الفاتورة {editInvoice.invoice_number}</h3>
              <button onClick={() => setEditInvoice(null)} className="w-9 h-9 text-white/70 hover:text-white hover:bg-white/20 flex items-center justify-center rounded-lg transition-all cursor-pointer" aria-label="إغلاق">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">اسم العميل</label>
                <input value={editInvoice.customer_name || ''} onChange={e => setEditInvoice({ ...editInvoice, customer_name: e.target.value })} className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">الهاتف</label>
                <input value={editInvoice.customer_phone || ''} onChange={e => setEditInvoice({ ...editInvoice, customer_phone: e.target.value })} className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">العنوان</label>
                <input value={editInvoice.customer_address || ''} onChange={e => setEditInvoice({ ...editInvoice, customer_address: e.target.value })} className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">ملاحظات</label>
                <input value={editInvoice.customer_notes || ''} onChange={e => setEditInvoice({ ...editInvoice, customer_notes: e.target.value })} className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">الخصم (د.ل)</label>
                <input type="number" step="0.001" value={editInvoice.discount || 0} onChange={e => setEditInvoice({ ...editInvoice, discount: e.target.value })} className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">العناصر (يمكن حذف عنصر فقط)</label>
                <ul className="space-y-2">
                  {(editInvoice.items || []).map((item, i) => (
                    <li key={i} className="flex justify-between items-center bg-gray-800/80 rounded-xl px-3 py-2 border border-white/5">
                      <span className="text-white text-sm">{item.title} — <span className="tabular-nums">{currency(item.price)}</span></span>
                      <button type="button" onClick={() => removeItemFromEdit(i)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer text-sm">حذف</button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 flex gap-2">
                <button onClick={handleSaveEdit} className="flex-1 px-4 py-2.5 min-h-[44px] bg-gradient-to-l from-[color:var(--brand)] to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-medium text-sm sm:text-base transition-all shadow-lg shadow-teal-500/20 cursor-pointer">حفظ التعديلات</button>
                <button onClick={() => setEditInvoice(null)} className="px-4 py-2.5 min-h-[44px] bg-gray-800 border border-white/10 text-gray-300 hover:bg-white/5 rounded-xl font-medium text-sm sm:text-base transition-all cursor-pointer">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}