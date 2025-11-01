import React, { useState, useEffect } from 'react'
import { api } from './api'

function currency(num) {
  return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(num)
}

export default function InvoicesTab() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/invoices')
      if (data.success) {
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('خطأ في تحميل الفواتير:', error)
    } finally {
      setLoading(false)
    }
  }

  const reprintInvoice = async (invoice) => {
    try {
      await api.post('/print-invoice', {
        invoiceNumber: invoice.invoice_number,
        customerName: invoice.customer_name,
        customerPhone: invoice.customer_phone,
        customerAddress: invoice.customer_address,
        items: JSON.parse(invoice.items),
        total: invoice.total,
        date: invoice.created_at,
        notes: invoice.notes
      })
      alert('تم إعادة طباعة الفاتورة بنجاح!')
      loadInvoices()
    } catch (error) {
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
      <h2 className="text-3xl font-bold text-white mb-8">إدارة الفواتير</h2>

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
                <th className="text-right py-3 px-4">الإجمالي</th>
                <th className="text-right py-3 px-4">التاريخ</th>
                <th className="text-center py-3 px-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                  <td className="py-3 px-4 font-mono text-primary">{invoice.invoice_number}</td>
                  <td className="py-3 px-4">{invoice.customer_name}</td>
                  <td className="py-3 px-4 font-bold text-green-400">{currency(invoice.total)}</td>
                  <td className="py-3 px-4 text-gray-300">
                    {new Date(invoice.created_at).toLocaleDateString('ar-LY')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => reprintInvoice(invoice)}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                    >
                      إعادة طباعة
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
