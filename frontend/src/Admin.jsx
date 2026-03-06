import React, { useEffect, useState } from 'react'
import { api, setAuthToken, loadAuthFromStorage } from './api'
import GamesTabNew from './GamesTabNew'
import InvoiceSettings from './InvoiceSettings'
import InvoicesTab from './InvoicesTab'
import DailyReportTab from './DailyReportTab'
import GenreSeriesManager from './GenreSeriesManager'
import logo from '../assites/logo.png'
import UsersTab from './UsersTab'

function currency(num) {
  return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(num)
}

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [tab, setTab] = useState('games')
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [currentUser, setCurrentUser] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    loadAuthFromStorage();
    const has = !!localStorage.getItem('token');
    setLoggedIn(has)
    if (has) { api.get('/auth/me').then(r => setCurrentUser(r.data?.user || null)).catch(() => { }) }
  }, [])

  async function submitLogin(e) {
    e.preventDefault()
    try {
      const { data } = await api.post('/auth/login', loginForm)
      setAuthToken(data.token)
      setLoggedIn(true)
      try { const r = await api.get('/auth/me'); setCurrentUser(r.data?.user || null) } catch { }
    } catch {
      alert('Invalid credentials')
    }
  }

  function logout() {
    setAuthToken(null)
    setLoggedIn(false)
    // إعادة التوجيه إلى الواجهة الرئيسية
    window.location.hash = '#/'
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="fixed inset-0 pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="relative z-10 text-center max-w-sm w-full">
          <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-2xl shadow-xl overflow-hidden flex items-center justify-center">
            <img src={logo} alt="Alnafar" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">لوحة التحكم</h1>
          <p className="text-gray-400 mb-8 text-sm">متجر النفار — نظام الإدارة</p>
          <form onSubmit={submitLogin} className="bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 text-right">اسم المستخدم</label>
              <input
                className="w-full border border-gray-700 bg-gray-800 text-white rounded-lg px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base transition-all"
                placeholder="أدخل اسم المستخدم"
                value={loginForm.username}
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 text-right">كلمة المرور</label>
              <input
                className="w-full border border-gray-700 bg-gray-800 text-white rounded-lg px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base transition-all"
                placeholder="أدخل كلمة المرور"
                type="password"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/25"
            >
              تسجيل الدخول
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white safe-area-bottom">
      {/* Header - محسّن للموبايل */}
      <nav className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-2xl border-b border-gray-700 safe-area-inset sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 text-gray-300 hover:text-white focus:outline-none"
                aria-label="القائمة"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <img src={logo} alt="شعار المتجر" className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-lg object-contain bg-white" />
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent truncate hidden sm:block">
                لوحة تحكم المدير
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.hash = '#/'}
                className="hidden sm:flex px-4 py-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 font-semibold text-sm transition-all duration-300 items-center gap-2"
              >
                🏠 المتجر الرئيسي
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold text-sm sm:text-base transition-all duration-300 shadow-lg flex-shrink-0"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - شبكة متجاوبة مع شريط جانبي */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 relative">

          {/* Mobile Overlay */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`
            fixed md:static inset-y-0 right-0 z-50 w-64 md:w-1/4 lg:w-1/5 bg-gray-900 md:bg-transparent
            transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0
            transition-transform duration-300 ease-in-out border-l border-gray-700 md:border-none shadow-2xl md:shadow-none
            flex flex-col
          `}>
            <div className="bg-gray-800/60 md:backdrop-blur-sm rounded-none md:rounded-2xl border-0 md:border md:border-gray-700 p-4 flex-1 overflow-y-auto">
              {/* Mobile Close Button & Header */}
              <div className="flex items-center justify-between gap-3 mb-6 md:mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex-shrink-0 bg-white rounded-lg overflow-hidden">
                    <img src={logo} alt="شعار المتجر" className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-sm">لوحة التحكم</div>
                    {currentUser && (
                      <div className="text-xs text-gray-400 truncate">{currentUser.username} — {currentUser.role}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="md:hidden p-2 text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-1">
                {[
                  { id: 'games', label: 'الألعاب', icon: '🎮' },
                  { id: 'categories', label: 'التصنيفات', icon: '📂' },
                  { id: 'genres', label: 'الأنواع والسلاسل', icon: '🏷️' },
                  { id: 'invoices', label: 'الفواتير', icon: '🧾' },
                  { id: 'daily-report', label: 'الجرد اليومي', icon: '📈' },
                  { id: 'invoice-settings', label: 'إعدادات الفاتورة', icon: '🖨️' },
                  { id: 'services', label: 'الخدمات', icon: '🔧' },
                  { id: 'stats', label: 'الإحصائيات', icon: '📊' },
                  { id: 'store-home', label: 'الرئيسية (POS)', icon: '🏠', action: () => window.location.hash = '#/' },
                  ...(currentUser?.role === 'admin' ? [{ id: 'users', label: 'الإدمن', icon: '🛡️' }] : [])
                ].map(({ id, label, icon, action }) => (
                  <button
                    key={id}
                    onClick={() => {
                      if (action) action();
                      else { setTab(id); setIsMobileMenuOpen(false); }
                    }}
                    className={`w-full text-right px-4 py-3 rounded-xl font-semibold transition-all duration-200 min-h-[48px] flex items-center justify-start gap-3 ${tab === id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'bg-transparent text-gray-300 hover:bg-gray-700/50 hover:text-white'
                      }`}
                  >
                    <span className="text-xl w-6 text-center">{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="flex-1 min-w-0 md:w-3/4 lg:w-4/5">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-2xl">
              {tab === 'games' && <GamesTabNew />}
              {tab === 'categories' && <CategoriesTab />}
              {tab === 'genres' && <GenreSeriesManager />}
              {tab === 'invoices' && <InvoicesTab />}
              {tab === 'daily-report' && <DailyReportTab />}
              {tab === 'invoice-settings' && <InvoiceSettings />}
              {tab === 'services' && <ServicesTab />}
              {tab === 'stats' && <StatsTab />}
              {tab === 'users' && currentUser?.role === 'admin' && <UsersTab />}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function CategoriesTab() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(null)

  async function load() {
    try {
      const { data } = await api.get('/categories');
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      setItems([])
    }
  }

  useEffect(() => { load() }, [])

  async function save() {
    if (!name.trim()) return
    if (editing) {
      await api.put(`/categories/${editing.id}`, { name })
      // تحديث محلي بدلاً من إعادة التحميل
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === editing.id ? { ...item, name } : item
        )
      )
    } else {
      const response = await api.post('/categories', { name })
      // إضافة التصنيف الجديد محلياً
      setItems(prevItems => [...prevItems, response.data])
    }
    setName(''); setEditing(null)
  }

  async function remove(id) {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return
    await api.delete(`/categories/${id}`)
    // حذف محلي بدلاً من إعادة التحميل
    setItems(prevItems => prevItems.filter(item => item.id !== id))
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">إدارة التصنيفات</h2>
        <p className="text-gray-400">إضافة وتعديل وحذف تصنيفات الألعاب</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 sm:p-8 rounded-2xl border border-gray-700 shadow-2xl">
          <div className="flex items-center mb-5 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
              <span className="text-xl sm:text-2xl">📂</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">{editing ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</h3>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">اسم التصنيف</label>
              <input
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                placeholder="أدخل اسم التصنيف"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={save}
                className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                {editing ? 'تحديث التصنيف' : 'إضافة التصنيف'}
              </button>
              {editing && (
                <button
                  onClick={() => { setEditing(null); setName('') }}
                  className="px-4 sm:px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all duration-300 text-sm sm:text-base"
                >
                  إلغاء
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 sm:p-8 rounded-2xl border border-gray-700 shadow-2xl">
          <div className="flex items-center mb-5 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
              <span className="text-xl sm:text-2xl">📋</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">قائمة التصنيفات ({items.length})</h3>
          </div>

          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors">
                <span className="text-gray-200 font-medium text-sm sm:text-base">{item.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditing(item); setName(item.name) }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ServicesTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', price: '', is_active: 1 })
  const [editingId, setEditingId] = useState(null)

  const load = async () => {
    try {
      const { data } = await api.get('/services?active=false')
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    try {
      if (editingId) {
        await api.put(`/services/${editingId}`, {
          title: form.title.trim(),
          price: Number(form.price) || 0,
          is_active: form.is_active ? 1 : 0
        })
        setEditingId(null)
      } else {
        await api.post('/services', {
          title: form.title.trim(),
          price: Number(form.price) || 0,
          is_active: form.is_active ? 1 : 0
        })
      }
      setForm({ title: '', price: '', is_active: 1 })
      load()
    } catch (err) {
      alert(err?.response?.data?.message || 'فشل الحفظ')
    }
  }

  const remove = async (id) => {
    if (!confirm('حذف هذه الخدمة؟')) return
    try {
      await api.delete(`/services/${id}`)
      load()
    } catch (err) {
      alert('فشل الحذف')
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-5 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white">الخدمات</h2>
        <p className="text-gray-400 mt-1 text-sm sm:text-base">مثل: فورمات PS4، صيانة، إلخ. تظهر في الواجهة الرئيسية ويضيفها الزبون مع الألعاب.</p>
      </div>
      <form onSubmit={save} className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-6 flex flex-col sm:flex-row sm:items-end gap-3">
        <input
          placeholder="اسم الخدمة (مثال: فورمات PS4)"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white flex-1 min-w-0"
        />
        <input
          type="number"
          step="0.001"
          placeholder="السعر (د.ل)"
          value={form.price}
          onChange={e => setForm({ ...form, price: e.target.value })}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white sm:w-32"
        />
        <label className="flex items-center gap-2 text-gray-300">
          <input type="checkbox" checked={!!form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} />
          نشط
        </label>
        <div className="flex gap-2">
          <button type="submit" className="flex-1 sm:flex-none px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium">
            {editingId ? 'حفظ التعديل' : 'إضافة خدمة'}
          </button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ title: '', price: '', is_active: 1 }) }} className="px-3 py-2.5 bg-gray-600 text-white rounded-lg">إلغاء</button>}
        </div>
      </form>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-x-auto">
        <table className="w-full text-white min-w-[400px]">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-right py-3 px-4 text-sm">الخدمة</th>
              <th className="text-right py-3 px-4 text-sm">السعر (د.ل)</th>
              <th className="text-right py-3 px-4 text-sm">الحالة</th>
              <th className="text-center py-3 px-4 text-sm">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map(s => (
              <tr key={s.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                <td className="py-3 px-4 text-sm">{s.title}</td>
                <td className="py-3 px-4 font-mono text-sm">{Number(s.price).toFixed(3)}</td>
                <td className="py-3 px-4">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${s.is_active ? 'bg-green-900/40 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                    {s.is_active ? 'نشط' : 'معطل'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button onClick={() => { setForm({ title: s.title, price: s.price, is_active: s.is_active }); setEditingId(s.id) }} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs mx-1">تعديل</button>
                  <button onClick={() => remove(s.id)} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs mx-1">حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <div className="p-6 text-center text-gray-400">لا توجد خدمات. أضف خدمة من النموذج أعلاه.</div>}
      </div>
    </div>
  )
}

function StatsTab() {
  const [stats, setStats] = useState({ totalOrders: 0, topGames: [] })

  async function load() {
    try {
      const { data } = await api.get('/stats');
      setStats({
        totalOrders: data?.totalOrders || 0,
        topGames: Array.isArray(data?.topGames) ? data.topGames : []
      })
    } catch (e) {
      setStats({ totalOrders: 0, topGames: [] })
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">الإحصائيات</h2>
        <p className="text-gray-400">عرض إحصائيات المتجر والألعاب الأكثر طلباً</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 sm:p-8 rounded-2xl border border-gray-700 shadow-2xl">
          <div className="flex items-center mb-5 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
              <span className="text-xl sm:text-2xl">📊</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">إجمالي الطلبات</h3>
          </div>
          <div className="text-4xl sm:text-5xl font-bold text-purple-400 mb-2">{stats.totalOrders}</div>
          <p className="text-gray-400">طلب إجمالي</p>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 sm:p-8 rounded-2xl border border-gray-700 shadow-2xl">
          <div className="flex items-center mb-5 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
              <span className="text-xl sm:text-2xl">🏆</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">الألعاب الأكثر طلباً</h3>
          </div>

          <div className="space-y-3">
            {stats.topGames.length > 0 ? (
              stats.topGames.slice(0, 5).map((g, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                    <span className="text-gray-200 text-sm">{g.title || `لعبة #${g.gameId}`}</span>
                  </div>
                  <span className="text-orange-400 font-semibold text-sm">{g.count}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400">لا توجد بيانات بعد</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}





