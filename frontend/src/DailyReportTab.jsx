import React, { useState, useEffect } from 'react'
import { api } from './api'
import socket from './socket'
import { reprintInvoice, getInvoiceSettings } from './utils/invoicePrint'

function currency(num) {
  return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(num)
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
      const { data } = await api.get(`/daily-report/${date}`)
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
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">جاري تحميل الجرد اليومي...</p>
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8">
      {/* عنوان وتاريخ واحد واضح */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white">الجرد اليومي</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-gray-400 text-sm">تاريخ الجرد:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
          />
          <button
            onClick={() => setShowExport(!showExport)}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm font-medium"
          >
            {showExport ? 'إخفاء التصدير' : 'تصدير نطاق'}
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            {showHistory ? 'إخفاء التاريخ' : 'عرض التاريخ'}
          </button>
          <button
            onClick={deleteAllInvoicesAllDays}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-sm font-medium"
          >
            حذف كل الفواتير
          </button>
        </div>
      </div>

      {/* نطاق التصدير (منفصل ومرتب) */}
      {showExport && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">تصدير نطاق تواريخ</h3>
          <div className="flex flex-wrap items-center gap-3">
            <input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" />
            <span className="text-gray-400">إلى</span>
            <input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" />
            <button onClick={loadRange} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">عرض النطاق</button>
            <button onClick={exportCsv} disabled={exporting} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium">تصدير CSV</button>
          </div>
        </div>
      )}

      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* إحصائيات اليوم */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">إحصائيات {selectedDate}</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">عدد الفواتير:</span>
                  <span className="text-xl font-bold text-white">{report.total_invoices || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">آخر رقم فاتورة:</span>
                  <span className="text-lg font-bold text-primary">{report.last_invoice_number || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">إجمالي المبيعات:</span>
                  <span className="font-bold text-green-400">{currency(report.total_revenue || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">إجمالي الخصومات:</span>
                  <span className="font-bold text-red-400">{currency(report.total_discount || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-600 to-green-700 rounded-lg">
                  <span className="text-white font-medium">صافي الربح:</span>
                  <span className="text-lg font-bold text-white">{currency(report.net_revenue || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">حالة الجرد:</span>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${report.is_closed ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                    {report.is_closed ? 'مغلق' : 'مفتوح'}
                  </span>
                </div>
              </div>
              {!report.is_closed && report.total_invoices > 0 && (
                <div className="mt-4 space-y-2">
                  <input
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                    value={closeNotes}
                    onChange={(e) => setCloseNotes(e.target.value)}
                    placeholder="ملاحظات الإغلاق (اختياري)"
                  />
                  <button onClick={() => closeDailyReport(selectedDate)} className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">إغلاق الجرد اليومي</button>
                </div>
              )}
            </div>
          </div>

          {/* قائمة الفواتير + إجراءات */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">فواتير اليوم ({report.invoices?.length || 0})</h3>
              {report.invoices && report.invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-white text-sm">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-right py-2 px-3">رقم الفاتورة</th>
                        <th className="text-right py-2 px-3">العميل</th>
                        <th className="text-right py-2 px-3">المجموع</th>
                        <th className="text-right py-2 px-3">الخصم</th>
                        <th className="text-right py-2 px-3">الصافي</th>
                        <th className="text-right py-2 px-3">الوقت</th>
                        <th className="text-center py-2 px-3">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(report.invoices || []).map((inv) => (
                        <tr key={inv.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                          <td className="py-2 px-3 font-mono text-primary">{inv.invoice_number}</td>
                          <td className="py-2 px-3">{inv.customer_name}</td>
                          <td className="py-2 px-3 text-gray-300">{currency(inv.total)}</td>
                          <td className="py-2 px-3 text-red-400">{inv.discount > 0 ? `-${currency(inv.discount)}` : '—'}</td>
                          <td className="py-2 px-3 font-bold text-green-400">{currency((inv.total || 0) - (inv.discount || 0))}</td>
                          <td className="py-2 px-3 text-gray-400">{new Date(inv.created_at).toLocaleTimeString('ar-LY')}</td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex flex-wrap gap-2 justify-center min-w-[120px]">
                              <button
                                onClick={() => handleReprint(inv)}
                                disabled={reprinting === inv.id}
                                className="p-2 sm:px-2 sm:py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                                title="إعادة طباعة"
                              >
                                {reprinting === inv.id ? '...' : 'طباعة'}
                              </button>
                              <button
                                onClick={() => setEditInvoice({ ...inv })}
                                className="p-2 sm:px-2 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
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
                <div className="text-center py-8 text-gray-400">لا توجد فواتير لهذا التاريخ</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* نطاق التقارير */}
      {range && (
        <div className="mt-6 bg-gray-900/50 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-6">تقارير من {range.start} إلى {range.end}</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-500/20">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
              <div className="relative z-10">
                <svg className="w-8 h-8 text-white/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="text-xs font-medium text-white/70 mb-1">عدد الفواتير</p>
                <p className="text-3xl font-black">{range.totals?.total_invoices ?? 0}</p>
              </div>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 p-4 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
              <div className="relative z-10">
                <svg className="w-8 h-8 text-white/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                <p className="text-xs font-medium text-white/70 mb-1">إجمالي المبيعات</p>
                <p className="text-xl font-black break-all leading-tight">{currency(range.totals?.total_revenue ?? 0)}</p>
              </div>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-red-500 to-rose-600 p-4 rounded-2xl text-white shadow-lg shadow-red-500/20">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
              <div className="relative z-10">
                <svg className="w-8 h-8 text-white/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                <p className="text-xs font-medium text-white/70 mb-1">إجمالي الخصومات</p>
                <p className="text-xl font-black break-all leading-tight">{currency(range.totals?.total_discount ?? 0)}</p>
              </div>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-2xl text-white shadow-lg shadow-purple-500/20">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
              <div className="relative z-10">
                <svg className="w-8 h-8 text-white/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-xs font-medium text-white/70 mb-1">الصافي</p>
                <p className="text-xl font-black break-all leading-tight">{currency(range.totals?.net_revenue ?? 0)}</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-white text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-right py-2 px-3">التاريخ</th>
                  <th className="text-right py-2 px-3">الفواتير</th>
                  <th className="text-right py-2 px-3">المبيعات</th>
                  <th className="text-right py-2 px-3">الخصومات</th>
                  <th className="text-right py-2 px-3">الصافي</th>
                  <th className="text-right py-2 px-3">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {(range.days || []).map((d) => (
                  <tr key={d.date} className="border-b border-gray-700">
                    <td className="py-2 px-3">{d.date}</td>
                    <td className="py-2 px-3">{d.total_invoices}</td>
                    <td className="py-2 px-3 text-green-400">{currency(d.total_revenue)}</td>
                    <td className="py-2 px-3 text-red-400">{currency(d.total_discount)}</td>
                    <td className="py-2 px-3 font-bold text-white">{currency(d.net_revenue)}</td>
                    <td className="py-2 px-3">{d.is_closed ? 'مغلق' : 'مفتوح'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* تاريخ التقارير */}
      {showHistory && reports.length > 0 && (
        <div className="mt-6 bg-gray-800 p-5 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">تاريخ التقارير اليومية</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-white text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-right py-2 px-3">التاريخ</th>
                  <th className="text-right py-2 px-3">عدد الفواتير</th>
                  <th className="text-right py-2 px-3">إجمالي المبيعات</th>
                  <th className="text-right py-2 px-3">صافي الربح</th>
                  <th className="text-center py-2 px-3">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {(reports || []).map((r) => (
                  <tr key={r.date} className="border-b border-gray-700 hover:bg-gray-700/30 cursor-pointer" onClick={() => setSelectedDate(r.date)}>
                    <td className="py-2 px-3 font-medium">{r.date}</td>
                    <td className="py-2 px-3">{r.total_invoices}</td>
                    <td className="py-2 px-3 text-green-400">{currency(r.total_revenue)}</td>
                    <td className="py-2 px-3 font-bold text-green-400">{currency(r.net_revenue)}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.is_closed ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>{r.is_closed ? 'مغلق' : 'مفتوح'}</span>
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
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setEditInvoice(null)}>
          <div className="bg-gray-800 rounded-t-2xl sm:rounded-xl border border-gray-700 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 sm:p-5 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-bold text-white">تعديل الفاتورة {editInvoice.invoice_number}</h3>
              <button onClick={() => setEditInvoice(null)} className="text-gray-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center text-xl">✕</button>
            </div>
            <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">اسم العميل</label>
                <input value={editInvoice.customer_name || ''} onChange={e => setEditInvoice({ ...editInvoice, customer_name: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">الهاتف</label>
                <input value={editInvoice.customer_phone || ''} onChange={e => setEditInvoice({ ...editInvoice, customer_phone: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">العنوان</label>
                <input value={editInvoice.customer_address || ''} onChange={e => setEditInvoice({ ...editInvoice, customer_address: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">ملاحظات</label>
                <input value={editInvoice.customer_notes || ''} onChange={e => setEditInvoice({ ...editInvoice, customer_notes: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">الخصم (د.ل)</label>
                <input type="number" step="0.001" value={editInvoice.discount || 0} onChange={e => setEditInvoice({ ...editInvoice, discount: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">العناصر (يمكن حذف عنصر فقط)</label>
                <ul className="space-y-2">
                  {(editInvoice.items || []).map((item, i) => (
                    <li key={i} className="flex justify-between items-center bg-gray-700 rounded-lg px-3 py-2">
                      <span className="text-white text-sm">{item.title} — {currency(item.price)}</span>
                      <button type="button" onClick={() => removeItemFromEdit(i)} className="text-red-400 hover:text-red-300 text-sm">حذف</button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 flex gap-2">
                <button onClick={handleSaveEdit} className="flex-1 px-4 py-2.5 min-h-[44px] bg-primary hover:bg-primary-dark text-white rounded-lg font-medium text-sm sm:text-base">حفظ التعديلات</button>
                <button onClick={() => setEditInvoice(null)} className="px-4 py-2.5 min-h-[44px] bg-gray-600 text-white rounded-lg font-medium text-sm sm:text-base">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
