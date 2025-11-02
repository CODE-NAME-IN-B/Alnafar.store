import React, { useState, useEffect } from 'react'
import { api } from './api'

function currency(num) {
  return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(num)
}

export default function InvoicesTab() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 50 })
  const [summary, setSummary] = useState(null)
  const [editingInvoice, setEditingInvoice] = useState(null)

  useEffect(() => {
    loadInvoices()
    loadSummary()
  }, [])

  const loadInvoices = async (page = 1) => {
    try {
      setLoading(true)
      const { data } = await api.get('/invoices', { params: { page } })
      setInvoices(data.invoices || [])
      if (data.pagination) setPagination(data.pagination)
    } catch (error) {
      console.error('خطأ في تحميل الفواتير:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSummary = async () => {
    try {
      const { data } = await api.get('/invoices-summary')
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
    if (!confirm('⚠️ تحذير: هل أنت متأكد من حذف جميع الفواتير؟ هذا الإجراء لا يمكن التراجع عنه!')) return
    if (!confirm('تأكيد نهائي: سيتم حذف جميع الفواتير نهائياً!')) return
    
    try {
      const { data } = await api.delete('/invoices')
      if (data.success) {
        alert(data.message)
        loadInvoices(1)
        loadSummary()
      }
    } catch (error) {
      alert('حدث خطأ في حذف الفواتير')
      console.error(error)
    }
  }

  const reprintInvoice = (invoice) => {
    // إنشاء نافذة جديدة لطباعة الفاتورة
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    
    const invoiceHTML = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة ${invoice.invoice_number}</title>
        <style>
          body { font-family: 'Cairo', Arial, sans-serif; margin: 20px; background: white; color: black; }
          .invoice-header { background: linear-gradient(135deg, #14b8a6 0%, #10b981 100%); color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
          .invoice-content { padding: 20px; }
          .section { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb; }
          .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; padding-top: 15px; border-top: 2px solid #333; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <h2>فاتورة مبيعات</h2>
          <p>رقم الفاتورة: ${invoice.invoice_number}</p>
          <p>${new Date(invoice.created_at).toLocaleDateString('ar-LY')}</p>
        </div>
        
        <div class="invoice-content">
          <div class="section">
            <h3>بيانات العميل:</h3>
            <p><strong>الاسم:</strong> ${invoice.customer_name}</p>
            <p><strong>الهاتف:</strong> ${invoice.customer_phone}</p>
            ${invoice.customer_address ? `<p><strong>العنوان:</strong> ${invoice.customer_address}</p>` : ''}
            ${invoice.notes ? `<p><strong>ملاحظات:</strong> ${invoice.notes}</p>` : ''}
          </div>
          
          <div class="section">
            <h3>تفاصيل الطلب:</h3>
            ${JSON.parse(invoice.items).map(item => `
              <div class="item">
                <span>${item.title}</span>
                <span>${new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(item.price)}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="total">
            الإجمالي: ${new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(invoice.total)}
          </div>
          
          <div class="footer">
            <p>شكراً لتسوقكم معنا</p>
            <p>للاستفسارات: +218xxxxxxxxx</p>
            <p>تم إنشاء هذه الفاتورة بواسطة متجر النفار</p>
          </div>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="background: #14b8a6; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">طباعة أو حفظ PDF</button>
          <button onclick="window.close()" style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-left: 10px;">إغلاق</button>
        </div>
      </body>
      </html>
    `
    
    printWindow.document.write(invoiceHTML)
    printWindow.document.close()
    
    // فتح نافذة الطباعة تلقائياً بعد تحميل الصفحة
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 500)
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
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white">إدارة الفواتير</h2>
        <button
          onClick={deleteAllInvoices}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          🗑️ حذف جميع الفواتير
        </button>
      </div>

      {/* إحصائيات الفواتير */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl text-white">
            <div className="text-sm opacity-90 mb-1">إجمالي الفواتير</div>
            <div className="text-3xl font-bold">{summary.totalInvoices}</div>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-xl text-white">
            <div className="text-sm opacity-90 mb-1">إجمالي الإيرادات</div>
            <div className="text-2xl font-bold">{currency(summary.totalRevenue)}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-xl text-white">
            <div className="text-sm opacity-90 mb-1">فواتير اليوم</div>
            <div className="text-3xl font-bold">{summary.todayInvoices}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-700 p-6 rounded-xl text-white">
            <div className="text-sm opacity-90 mb-1">إيرادات اليوم</div>
            <div className="text-2xl font-bold">{currency(summary.todayRevenue)}</div>
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
                <th className="text-right py-3 px-4">التاريخ</th>
                <th className="text-right py-3 px-4">الطباعة</th>
                <th className="text-center py-3 px-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                  <td className="py-3 px-4 font-mono text-primary">{invoice.invoice_number}</td>
                  <td className="py-3 px-4">{invoice.customer_name}</td>
                  <td className="py-3 px-4 text-gray-300">{currency(invoice.total)}</td>
                  <td className="py-3 px-4 text-red-400">{invoice.discount > 0 ? `-${currency(invoice.discount)}` : '—'}</td>
                  <td className="py-3 px-4 font-bold text-green-400">{currency((invoice.total || 0) - (invoice.discount || 0))}</td>
                  <td className="py-3 px-4 text-gray-300">
                    {new Date(invoice.created_at).toLocaleString('ar-LY')}
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {invoice.print_count || 0} {invoice.printed_at ? `— آخر طباعة: ${new Date(invoice.printed_at).toLocaleString('ar-LY')}` : ''}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => reprintInvoice(invoice)}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                        title="إعادة طباعة"
                      >
                        🖨️
                      </button>
                      <button
                        onClick={() => {
                          const items = Array.isArray(invoice.items) ? invoice.items : (()=>{ try { return JSON.parse(invoice.items) } catch { return [] } })()
                          const info = [
                            `رقم: ${invoice.invoice_number}`,
                            `التاريخ: ${new Date(invoice.created_at).toLocaleString('ar-LY')}`,
                            `الاسم: ${invoice.customer_name}`,
                            `الهاتف: ${invoice.customer_phone}`,
                            invoice.customer_address ? `العنوان: ${invoice.customer_address}` : '',
                            `المجموع قبل الخصم: ${new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(invoice.total)}`,
                            invoice.discount > 0 ? `الخصم: -${new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(invoice.discount)}` : '',
                            `الإجمالي النهائي: ${new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format((invoice.total || 0) - (invoice.discount || 0))}`,
                            `العناصر:\n` + items.map((it,i)=>`${i+1}. ${it.title} — ${new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(it.price)}`).join('\n')
                          ].filter(Boolean).join('\n')
                          alert(info)
                        }}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                        title="عرض التفاصيل"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => deleteInvoice(invoice.id)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
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
            <button disabled={pagination.page<=1} onClick={()=>loadInvoices(pagination.page-1)} className="px-3 py-1.5 bg-gray-700 disabled:opacity-50 rounded">السابق</button>
            <span className="text-gray-300">صفحة {pagination.page} من {pagination.pages}</span>
            <button disabled={pagination.page>=pagination.pages} onClick={()=>loadInvoices(pagination.page+1)} className="px-3 py-1.5 bg-gray-700 disabled:opacity-50 rounded">التالي</button>
          </div>
        </div>
      )}
    </div>
  )
}
