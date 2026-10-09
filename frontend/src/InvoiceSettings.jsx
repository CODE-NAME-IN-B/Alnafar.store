import React, { useState, useEffect } from 'react'
import { api } from './api'
import Loader from './Loader'
import { showToast } from './utils/toast'

const inputCls = "w-full bg-gray-950 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-sm sm:text-base"
const selectCls = inputCls + " cursor-pointer"

function Section({ icon, title, description, children }) {
  return (
    <section className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-white">{title}</h3>
          {description && <p className="text-gray-400 text-xs sm:text-sm mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

export default function InvoiceSettings() {
  const [settings, setSettings] = useState({
    store_name: 'متجر الألعاب',
    store_name_english: 'Alnafar Store',
    store_address: '',
    store_phone: '',
    store_email: '',
    store_website: '',
    footer_message: 'شكراً لتسوقكم معنا',
    header_logo_text: 'فاتورة مبيعات',
    show_store_info: true,
    show_footer: true,
    paper_width: 58,
    font_size: 'normal'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [backingUp, setBackingUp] = useState(false)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/invoice-settings')
      if (data.success && data.settings) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('خطأ في تحميل الإعدادات:', error)
      showToast('تعذر تحميل الإعدادات', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      // Auto-format phone for WhatsApp: ensure country code 218
      let phone = (settings.store_phone || '').replace(/[^0-9]/g, '')
      if (phone.startsWith('00')) phone = phone.substring(2)
      if (phone.startsWith('0')) phone = '218' + phone.substring(1)
      if (phone.length === 9 && !phone.startsWith('218')) phone = '218' + phone
      const formatted = { ...settings, store_phone: phone }
      await api.post('/invoice-settings', formatted)
      setSettings(formatted)
      showToast('تم حفظ الإعدادات بنجاح!')
    } catch (error) {
      showToast('حدث خطأ في حفظ الإعدادات', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleBackupDatabase = async () => {
    try {
      setBackingUp(true)
      const response = await api.get('/backup-database', { responseType: 'blob' })

      // إنشاء رابط تحميل
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url

      // اسم الملف مع التاريخ
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      link.setAttribute('download', `database-backup-${timestamp}.sqlite`)

      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      showToast('تم تحميل النسخة الاحتياطية بنجاح!')
    } catch (error) {
      showToast('حدث خطأ في إنشاء النسخة الاحتياطية', 'error')
      console.error(error)
    } finally {
      setBackingUp(false)
    }
  }

  const handleRestoreDatabase = async () => {
    if (!confirm('تحذير: سيتم استبدال قاعدة البيانات الحالية. هل أنت متأكد؟')) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.sqlite'

    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      try {
        setRestoring(true)

        // قراءة الملف كـ base64
        const reader = new FileReader()
        reader.onload = async (event) => {
          try {
            const base64Data = event.target.result.split(',')[1]

            const { data } = await api.post('/restore-database', {
              backupData: base64Data
            })

            if (data.success) {
              showToast('تم استعادة قاعدة البيانات بنجاح! سيتم إعادة تحميل الصفحة...')
              setTimeout(() => window.location.reload(), 1500)
            }
          } catch (error) {
            showToast('حدث خطأ في استعادة قاعدة البيانات', 'error')
            console.error(error)
          } finally {
            setRestoring(false)
          }
        }

        reader.readAsDataURL(file)
      } catch (error) {
        showToast('حدث خطأ في قراءة الملف', 'error')
        console.error(error)
        setRestoring(false)
      }
    }

    input.click()
  }

  const handlePrintTest = async () => {
    try {
      await api.post('/print-test')
      showToast('تم إجراء الطباعة التجريبية بنجاح!')
    } catch (error) {
      showToast('فشل في الطباعة التجريبية', 'error')
    }
  }

  if (loading) {
    return (
      <div className="p-3 min-[400px]:p-4 sm:p-6 lg:p-8">
        <div className="skeleton-header mb-6"></div>
        <div className="space-y-4">
          {[0, 1].map(i => <div key={i} className="skeleton h-44 rounded-2xl"></div>)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 min-[400px]:p-4 sm:p-6 lg:p-8">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-8">إعدادات الفاتورة</h2>

      <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
        <Section
          title="بيانات المتجر"
          description="تظهر هذه البيانات في رأس الفاتورة المطبوعة"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614" /></svg>}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">اسم المتجر (عربي)</label>
              <input
                type="text"
                value={settings.store_name}
                onChange={(e) => handleInputChange('store_name', e.target.value)}
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">اسم المتجر (إنجليزي)</label>
              <input
                type="text"
                value={settings.store_name_english}
                onChange={(e) => handleInputChange('store_name_english', e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">عنوان المتجر</label>
              <input
                type="text"
                value={settings.store_address}
                onChange={(e) => handleInputChange('store_address', e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">رقم الواتساب / الهاتف</label>
              <input
                type="tel"
                value={settings.store_phone}
                onChange={(e) => handleInputChange('store_phone', e.target.value)}
                placeholder="218920595447"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">البريد الإلكتروني</label>
              <input
                type="email"
                value={settings.store_email}
                onChange={(e) => handleInputChange('store_email', e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">الموقع الإلكتروني</label>
              <input
                type="url"
                value={settings.store_website}
                onChange={(e) => handleInputChange('store_website', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </Section>

        <Section
          title="إعدادات الطباعة"
          description="تحكم في مظهر الفاتورة وعرض معلومات المتجر"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" /></svg>}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">نص ترويسة الفاتورة</label>
              <input
                type="text"
                value={settings.header_logo_text || ''}
                onChange={(e) => handleInputChange('header_logo_text', e.target.value)}
                placeholder="فاتورة مبيعات"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">عرض الورق</label>
              <select
                value={settings.paper_width || 58}
                onChange={(e) => handleInputChange('paper_width', Number(e.target.value))}
                className={selectCls}
              >
                <option value={58}>58 مم</option>
                <option value={80}>80 مم</option>
                <option value={100}>100 مم</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">حجم الخط</label>
              <select
                value={settings.font_size || 'normal'}
                onChange={(e) => handleInputChange('font_size', e.target.value)}
                className={selectCls}
              >
                <option value="normal">عادي</option>
                <option value="large">كبير</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">رسالة التذييل</label>
              <textarea
                value={settings.footer_message}
                onChange={(e) => handleInputChange('footer_message', e.target.value)}
                rows={3}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 sm:gap-6 mt-4 sm:mt-5">
            <label className="flex items-center gap-2 cursor-pointer select-none min-h-[44px]">
              <input
                type="checkbox"
                checked={settings.show_store_info}
                onChange={(e) => handleInputChange('show_store_info', e.target.checked)}
                className="w-4 h-4 accent-teal-500"
              />
              <span className="text-gray-300 text-sm">إظهار معلومات المتجر</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none min-h-[44px]">
              <input
                type="checkbox"
                checked={settings.show_footer}
                onChange={(e) => handleInputChange('show_footer', e.target.checked)}
                className="w-4 h-4 accent-teal-500"
              />
              <span className="text-gray-300 text-sm">إظهار التذييل</span>
            </label>
          </div>
        </Section>

        {/* أزرار التحكم */}
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="btn btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>

          <button type="button" onClick={handlePrintTest} className="btn btn-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659" /></svg>
            طباعة تجريبية
          </button>
        </div>

        {/* قسم النسخ الاحتياطي */}
        <Section
          title="النسخ الاحتياطي واستعادة البيانات"
          description="احفظ نسخة احتياطية من قاعدة البيانات أو استعد نسخة سابقة"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75" /></svg>}
        >
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleBackupDatabase}
              disabled={backingUp}
              className="btn btn-secondary"
            >
              {backingUp ? (
                <>
                  <Loader size="sm" variant="bar" />
                  جاري التحميل...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                  تحميل نسخة احتياطية
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleRestoreDatabase}
              disabled={restoring}
              className="btn btn-danger"
            >
              {restoring ? (
                <>
                  <Loader size="sm" variant="bar" />
                  جاري الاستعادة...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                  استعادة من نسخة احتياطية
                </>
              )}
            </button>
          </div>

          <div className="mt-4 bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
              <div className="text-xs sm:text-sm text-yellow-200">
                <p className="font-semibold mb-1">تنبيه هام:</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-300/90">
                  <li>قم بإنشاء نسخة احتياطية بشكل دوري للحفاظ على بياناتك</li>
                  <li>عند الاستعادة، سيتم حفظ نسخة احتياطية تلقائية من البيانات الحالية</li>
                  <li>تأكد من صحة ملف النسخة الاحتياطية قبل الاستعادة</li>
                </ul>
              </div>
            </div>
          </div>
        </Section>
      </form>
    </div>
  )
}
