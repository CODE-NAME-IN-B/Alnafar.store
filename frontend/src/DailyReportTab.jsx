import React, { useState, useEffect } from 'react'
import { api } from './api'
import socket from './socket'

function currency(num) {
  return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(num)
}

export default function DailyReportTab() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    loadDailyReport(selectedDate)
    loadReportsHistory()

    // الاستماع للتحديثات الفورية
    socket.on('invoice_created', () => {
      if (selectedDate === new Date().toISOString().split('T')[0]) {
        loadDailyReport(selectedDate)
      }
      loadReportsHistory()
    })

    return () => {
      socket.off('invoice_created')
    }
  }, [selectedDate])

  const loadDailyReport = async (date) => {
    try {
      setLoading(true)
      const { data } = await api.get(`/daily-report/${date}`)
      setReport(data.report)
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

  const closeDailyReport = async (date) => {
    if (!confirm(`هل أنت متأكد من إغلاق الجرد ليوم ${date}؟ لن تتمكن من التراجع عن هذا الإجراء.`)) {
      return
    }

    try {
      const { data } = await api.post(`/daily-report/${date}/close`)
      if (data.success) {
        alert('تم إغلاق الجرد اليومي بنجاح')
        loadDailyReport(selectedDate)
        loadReportsHistory()
      }
    } catch (error) {
      console.error('خطأ في إغلاق الجرد:', error)
      alert('حدث خطأ في إغلاق الجرد')
    }
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white">الجرد اليومي</h2>
        <div className="flex gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
          />
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            {showHistory ? 'إخفاء التاريخ' : 'عرض التاريخ'}
          </button>
        </div>
      </div>

      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* إحصائيات اليوم */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-6">إحصائيات {selectedDate}</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">عدد الفواتير:</span>
                  <span className="text-2xl font-bold text-white">{report.total_invoices || 0}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">آخر رقم فاتورة:</span>
                  <span className="text-xl font-bold text-primary">{report.last_invoice_number || 0}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">إجمالي المبيعات:</span>
                  <span className="text-lg font-bold text-green-400">{currency(report.total_revenue || 0)}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">إجمالي الخصومات:</span>
                  <span className="text-lg font-bold text-red-400">{currency(report.total_discount || 0)}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-600 to-green-700 rounded-lg">
                  <span className="text-white font-medium">صافي الربح:</span>
                  <span className="text-xl font-bold text-white">{currency(report.net_revenue || 0)}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">حالة الجرد:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    report.is_closed ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                  }`}>
                    {report.is_closed ? 'مغلق' : 'مفتوح'}
                  </span>
                </div>
              </div>

              {!report.is_closed && report.total_invoices > 0 && (
                <button
                  onClick={() => closeDailyReport(selectedDate)}
                  className="w-full mt-6 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  🔒 إغلاق الجرد اليومي
                </button>
              )}
            </div>
          </div>

          {/* قائمة الفواتير */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-6">فواتير اليوم ({report.invoices?.length || 0})</h3>
              
              {report.invoices && report.invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-right py-3 px-4">رقم الفاتورة</th>
                        <th className="text-right py-3 px-4">العميل</th>
                        <th className="text-right py-3 px-4">المجموع</th>
                        <th className="text-right py-3 px-4">الخصم</th>
                        <th className="text-right py-3 px-4">الصافي</th>
                        <th className="text-right py-3 px-4">الوقت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.invoices.map((invoice, index) => (
                        <tr key={invoice.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                          <td className="py-3 px-4 font-mono text-primary">{invoice.invoice_number}</td>
                          <td className="py-3 px-4">{invoice.customer_name}</td>
                          <td className="py-3 px-4 text-gray-300">{currency(invoice.total)}</td>
                          <td className="py-3 px-4 text-red-400">
                            {invoice.discount > 0 ? `-${currency(invoice.discount)}` : '—'}
                          </td>
                          <td className="py-3 px-4 font-bold text-green-400">
                            {currency((invoice.total || 0) - (invoice.discount || 0))}
                          </td>
                          <td className="py-3 px-4 text-gray-400">
                            {new Date(invoice.created_at).toLocaleTimeString('ar-LY')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">لا توجد فواتير لهذا التاريخ</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* تاريخ التقارير */}
      {showHistory && (
        <div className="mt-8 bg-gray-800 p-6 rounded-xl">
          <h3 className="text-xl font-bold text-white mb-6">تاريخ التقارير اليومية</h3>
          
          {reports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-right py-3 px-4">التاريخ</th>
                    <th className="text-right py-3 px-4">عدد الفواتير</th>
                    <th className="text-right py-3 px-4">إجمالي المبيعات</th>
                    <th className="text-right py-3 px-4">الخصومات</th>
                    <th className="text-right py-3 px-4">صافي الربح</th>
                    <th className="text-center py-3 px-4">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((dailyReport) => (
                    <tr 
                      key={dailyReport.date} 
                      className="border-b border-gray-700 hover:bg-gray-700/30 cursor-pointer"
                      onClick={() => setSelectedDate(dailyReport.date)}
                    >
                      <td className="py-3 px-4 font-medium">{dailyReport.date}</td>
                      <td className="py-3 px-4">{dailyReport.total_invoices}</td>
                      <td className="py-3 px-4 text-green-400">{currency(dailyReport.total_revenue)}</td>
                      <td className="py-3 px-4 text-red-400">{currency(dailyReport.total_discount)}</td>
                      <td className="py-3 px-4 font-bold text-green-400">{currency(dailyReport.net_revenue)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          dailyReport.is_closed ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                        }`}>
                          {dailyReport.is_closed ? 'مغلق' : 'مفتوح'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">لا توجد تقارير سابقة</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
