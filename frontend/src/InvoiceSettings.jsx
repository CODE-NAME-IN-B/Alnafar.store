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
      await api.post('/invoice-settings', settings)
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

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">جاري تحميل الإعدادات...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-white mb-8">إعدادات الفاتورة</h2>

      <form onSubmit={handleSave} className="bg-gray-800 p-6 rounded-xl space-y-6">
        {/* معلومات المتجر */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">اسم المتجر (عربي)</label>
            <input
              type="text"
              value={settings.store_name}
              onChange={(e) => handleInputChange('store_name', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">اسم المتجر (إنجليزي)</label>
            <input
              type="text"
              value={settings.store_name_english}
              onChange={(e) => handleInputChange('store_name_english', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">عنوان المتجر</label>
            <input
              type="text"
              value={settings.store_address}
              onChange={(e) => handleInputChange('store_address', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">رقم الهاتف</label>
            <input
              type="tel"
              value={settings.store_phone}
              onChange={(e) => handleInputChange('store_phone', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              value={settings.store_email}
              onChange={(e) => handleInputChange('store_email', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">الموقع الإلكتروني</label>
            <input
              type="url"
              value={settings.store_website}
              onChange={(e) => handleInputChange('store_website', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
            />
          </div>
        </div>

        {/* إعدادات الفاتورة */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">رسالة التذييل</label>
          <textarea
            value={settings.footer_message}
            onChange={(e) => handleInputChange('footer_message', e.target.value)}
            rows={3}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
          />
        </div>

        {/* خيارات العرض */}
        <div className="flex gap-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.show_store_info}
              onChange={(e) => handleInputChange('show_store_info', e.target.checked)}
              className="mr-2"
            />
            <span className="text-gray-300">إظهار معلومات المتجر</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.show_footer}
              onChange={(e) => handleInputChange('show_footer', e.target.checked)}
              className="mr-2"
            />
            <span className="text-gray-300">إظهار التذييل</span>
          </label>
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold rounded-lg transition-colors"
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
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
          >
            طباعة تجريبية
          </button>
        </div>
      </form>
    </div>
  )
}
