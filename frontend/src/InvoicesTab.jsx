import React, { useState, useEffect, useMemo } from 'react'
import { api } from './api'
import socket from './socket'

function currency(num) {
  return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(num)
}

export default function InvoicesTab() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 50 })
  const [summary, setSummary] = useState(null)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [search, setSearch] = useState('')
  const [pageLimit, setPageLimit] = useState(50)

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
      const { data } = await api.get('/invoices', { params: { page, limit: pageLimit } })
      setInvoices(data.invoices || [])
      if (data.pagination) setPagination(data.pagination)
    } catch (error) {
      console.error('خطأ في تحميل الفواتير:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadInvoices(1) }, [pageLimit])

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
      // جلب إعدادات الفاتورة لعرض اسم المتجر وضبط المقاسات
      let invSettings = {}
      try {
        const { data } = await api.get('/invoice-settings')
        invSettings = data?.settings || {}
      } catch (_) { invSettings = {} }

      const paperMM = Number(invSettings?.paper_width) || 58
      const fs = String(invSettings?.font_size || 'normal').toLowerCase()
      const fontSize = fs === 'large' ? '12px' : fs === 'small' ? '10px' : '11px'
      const titleSize = fs === 'large' ? '15px' : fs === 'small' ? '13px' : '14px'

      const headerText = invSettings?.header_logo_text || 'فاتورة مبيعات'
      const showStoreInfo = !!Number(invSettings?.show_store_info ?? 1)
      const showFooter = !!Number(invSettings?.show_footer ?? 1)
      const defaultStoreName = 'الشارده للإلكترونيات'
      const defaultStoreNameEn = 'Alnafar Store'
      const storeName = (invSettings?.store_name || '').trim() || defaultStoreName
      const storeNameEn = (invSettings?.store_name_english || '').trim() || defaultStoreNameEn
      const storeAddr = invSettings?.store_address || ''
      const storePhone = invSettings?.store_phone || ''
      const storeEmail = invSettings?.store_email || ''
      const storeWeb = invSettings?.store_website || ''
      const footerMsg = invSettings?.footer_message || 'شكراً لتسوقكم معنا'

      const fullNumber = String(invoice.invoice_number || '')
      const dailyNo = fullNumber.includes('-') ? String(parseInt(fullNumber.split('-')[1], 10)) : fullNumber

      // إنشاء نافذة جديدة لطباعة الفاتورة
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      const invoiceHTML = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>فاتورة ${dailyNo}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Tahoma, Arial, Helvetica, sans-serif; 
              background: #fff; color: #000; direction: rtl; line-height: 1.3; font-size: ${fontSize};
            }
            @page { size: ${paperMM}mm auto; margin: 0; }
            .receipt { width: ${paperMM}mm; margin: 0 auto; padding: 2mm 1.5mm; }
            .logo { text-align: center; margin: 1mm 0 0.5mm 0; }
            .logo img { display: block; margin: 0 auto; max-width: 90%; width: 30mm; height: auto; image-rendering: -webkit-optimize-contrast; }
            .logo-fallback { font-size: ${titleSize}; font-weight: bold; text-align: center; color: #333; margin: 1mm 0; }
            .store-name-ar { font-size: ${titleSize}; font-weight: bold; text-align: center; margin: 0.1mm 0 1px 0; }
            .subtitle { font-size: calc(${fontSize} - 1px); text-align: center; margin-bottom: 0; }
            .title { font-size: ${titleSize}; font-weight: bold; text-align: center; margin-bottom: 1px; }
            .section-title { font-size: ${fontSize}; font-weight: bold; margin: 2px 0 1px 0; text-align: right; }
            .separator { border-top: 1px dashed #999; margin: 1px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 1px 0; gap: 4px; }
            .info-label { font-weight: bold; color: #000; flex-shrink: 0; }
            .info-value { text-align: left; color: #000; word-break: break-word; }
            .item-row { display: flex; justify-content: space-between; margin: 1px 0; padding: 1px 0; border-bottom: 1px dashed #ddd; gap: 4px; }
            .item-name { text-align: right; word-break: break-word; flex: 1; }
            .item-price { text-align: left; font-weight: bold; direction: ltr; flex-shrink: 0; min-width: 60px; }
            .total-row { display: flex; justify-content: space-between; margin-top: 2px; padding-top: 2px; border-top: 2px solid #000; font-weight: bold; }
            .footer { text-align: center; font-size: calc(${fontSize} - 2px); color: #555; margin-top: 2px; line-height: 1.2; }
            @media print { body { margin: 0; padding: 0; } .no-print { display: none !important; } }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="logo">
              <img src="/invoice-header.png?v=${Date.now()}" alt="شعار المتجر" onerror="this.onerror=null; this.src='/logo.png';" />
              <div class="logo-fallback" style="display: none;">🏪 ${storeName}</div>
            </div>
            <div class="store-name-ar">${storeName}</div>
            <div class="subtitle">${storeNameEn}</div>
            <div class="subtitle">رقم: ${dailyNo}</div>
            <div class="subtitle">${new Date(invoice.created_at).toLocaleString('ar-LY')}</div>
            <div class="subtitle">الحالة: ${(invoice.status||'') === 'paid' ? 'تم الدفع' : 'غير خالص'}</div>
            <div class="separator"></div>
            <div class="section-title">بيانات العميل</div>
            <div class="info-row"><span class="info-label">الاسم:</span><span class="info-value">${invoice.customer_name}</span></div>
            <div class="info-row"><span class="info-label">الهاتف:</span><span class="info-value">${invoice.customer_phone}</span></div>
            ${invoice.notes ? `<div class=\"info-row\"><span class=\"info-label\">ملاحظات:</span><span class=\"info-value\">${invoice.notes}</span></div>` : ''}
            <div class="separator"></div>
            <div class="section-title">تفاصيل الطلب</div>
            ${(() => { const items = Array.isArray(invoice.items) ? invoice.items : (()=>{ try { return JSON.parse(invoice.items) } catch { return [] } })(); return items.map(item => `
              <div class=\"item-row\">
                <span class=\"item-name\">${item.title}</span>
                <span class=\"item-price\">${new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(item.price)}</span>
              </div>`).join('') })()}
            <div class="total-row">
              <span>الإجمالي النهائي:</span>
              <span>${new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format((invoice.total || 0) - (invoice.discount || 0))}</span>
            </div>
            ${showStoreInfo && (storeAddr || storePhone || storeEmail || storeWeb) ? `
              <div class=\"separator\"></div>
              <div class=\"section-title\">معلومات المتجر</div>
              ${storeAddr ? `<div class=\"info-row\"><span class=\"info-label\">العنوان:</span><span class=\"info-value\">${storeAddr}</span></div>` : ''}
              ${storePhone ? `<div class=\"info-row\"><span class=\"info-label\">الهاتف:</span><span class=\"info-value\">${storePhone}</span></div>` : ''}
              ${storeEmail ? `<div class=\"info-row\"><span class=\"info-label\">البريد:</span><span class=\"info-value\">${storeEmail}</span></div>` : ''}
              ${storeWeb ? `<div class=\"info-row\"><span class=\"info-label\">الموقع:</span><span class=\"info-value\">${storeWeb}</span></div>` : ''}
            ` : ''}
            ${showFooter && footerMsg ? `<div class=\"footer\"><div>${footerMsg}</div></div>` : ''}
          </div>
        </body>
        </html>
      `

      if (printWindow) {
        printWindow.document.write(invoiceHTML)
        printWindow.document.close()
        printWindow.onload = () => {
          setTimeout(() => { printWindow.print() }, 300)
        }
      }

      // تحديث حالة الطباعة في السيرفر
      try { await api.post(`/invoices/${encodeURIComponent(fullNumber)}/mark-printed`) } catch (_) {}
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
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white">إدارة الفواتير</h2>
        <div className="flex gap-2">
          <button
            onClick={deleteAllInvoices}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            🗑️ حذف فواتير اليوم
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input 
          value={search}
          onChange={e=>setSearch(e.target.value)}
          placeholder="ابحث برقم الفاتورة أو اسم العميل..."
          className="flex-1 min-w-[240px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white"
        />
        <select 
          value={pageLimit}
          onChange={e=>setPageLimit(parseInt(e.target.value)||50)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white"
        >
          <option value={20}>20 لكل صفحة</option>
          <option value={50}>50 لكل صفحة</option>
          <option value={100}>100 لكل صفحة</option>
        </select>
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
              {filteredInvoices.map((invoice) => (
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
