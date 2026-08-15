import React, { useState, useEffect } from 'react'
import { api } from './api'

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
      alert('تم حفظ الإعدادات بنجاح!')
    } catch (error) {
      alert('حدث خطأ في حفظ الإعدادات')
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
      
      alert('تم تحميل النسخة الاحتياطية بنجاح!')
    } catch (error) {
      alert('حدث خطأ في إنشاء النسخة الاحتياطية')
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
              alert('تم استعادة قاعدة البيانات بنجاح! سيتم إعادة تحميل الصفحة...')
              setTimeout(() => window.location.reload(), 1500)
            }
          } catch (error) {
            alert('حدث خطأ في استعادة قاعدة البيانات')
            console.error(error)
          } finally {
            setRestoring(false)
          }
        }
        
        reader.readAsDataURL(file)
      } catch (error) {
        alert('حدث خطأ في قراءة الملف')
        console.error(error)
        setRestoring(false)
      }
    }
    
    input.click()
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">جاري تحميل الإعدادات...</p>
      </div>
    )
  }

  return (
    <div className="p-3 min-[400px]:p-4 sm:p-6 lg:p-8">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-8">إعدادات الفاتورة</h2>

      <form onSubmit={handleSave} className="bg-gray-800 p-4 sm:p-6 rounded-xl space-y-4 sm:space-y-6">
        {/* معلومات المتجر */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">اسم المتجر (عربي)</label>
            <input
              type="text"
              value={settings.store_name}
              onChange={(e) => handleInputChange('store_name', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">اسم المتجر (إنجليزي)</label>
            <input
              type="text"
              value={settings.store_name_english}
              onChange={(e) => handleInputChange('store_name_english', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">عنوان المتجر</label>
            <input
              type="text"
              value={settings.store_address}
              onChange={(e) => handleInputChange('store_address', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">رقم الواتساب / الهاتف</label>
            <input
              type="tel"
              value={settings.store_phone}
              onChange={(e) => handleInputChange('store_phone', e.target.value)}
              placeholder="218920595447"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              value={settings.store_email}
              onChange={(e) => handleInputChange('store_email', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">الموقع الإلكتروني</label>
            <input
              type="url"
              value={settings.store_website}
              onChange={(e) => handleInputChange('store_website', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base"
            />
          </div>
        </div>

        {/* إعدادات الفاتورة */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">رسالة التذييل</label>
          <textarea
            value={settings.footer_message}
            onChange={(e) => handleInputChange('footer_message', e.target.value)}
            rows={3}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base"
          />
        </div>

        {/* خيارات العرض */}
        <div className="flex flex-wrap gap-4 sm:gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.show_store_info}
              onChange={(e) => handleInputChange('show_store_info', e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-gray-300 text-sm">إظهار معلومات المتجر</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.show_footer}
              onChange={(e) => handleInputChange('show_footer', e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-gray-300 text-sm">إظهار التذييل</span>
          </label>
        </div>

        {/* أزرار التحكم */}
        <div className="flex flex-wrap gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold rounded-lg transition-colors text-sm sm:text-base min-h-[44px]"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
          
          <button
            type="button"
            onClick={async () => {
              try {
                await api.post('/print-test')
                alert('تم إجراء الطباعة التجريبية بنجاح!')
              } catch (error) {
                alert('فشل في الطباعة التجريبية')
              }
            }}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors text-sm sm:text-base min-h-[44px]"
          >
            طباعة تجريبية
          </button>
        </div>

        {/* قسم النسخ الاحتياطي */}
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-700">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">النسخ الاحتياطي واستعادة البيانات</h3>
          <p className="text-gray-400 mb-4 sm:mb-6 text-sm">احفظ نسخة احتياطية من قاعدة البيانات أو استعد نسخة سابقة</p>
          
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleBackupDatabase}
              disabled={backingUp}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base min-h-[44px]"
            >
              {backingUp ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري التحميل...
                </>
              ) : (
                <>
                  تحميل نسخة احتياطية
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleRestoreDatabase}
              disabled={restoring}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base min-h-[44px]"
            >
              {restoring ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري الاستعادة...
                </>
              ) : (
                <>
                  استعادة من نسخة احتياطية
                </>
              )}
            </button>
          </div>
          
          <div className="mt-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 sm:p-4">
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
        </div>
      </form>
    </div>
  )
}
