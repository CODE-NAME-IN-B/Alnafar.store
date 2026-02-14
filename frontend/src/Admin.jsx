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

  useEffect(() => { 
    loadAuthFromStorage(); 
    const has = !!localStorage.getItem('token');
    setLoggedIn(has)
    if (has) { api.get('/auth/me').then(r => setCurrentUser(r.data?.user || null)).catch(()=>{}) }
  }, [])

  async function submitLogin(e) {
    e.preventDefault()
    try {
      const { data } = await api.post('/auth/login', loginForm)
      setAuthToken(data.token)
      setLoggedIn(true)
      try { const r = await api.get('/auth/me'); setCurrentUser(r.data?.user||null) } catch {}
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
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <form onSubmit={submitLogin} className="bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-sm space-y-3 border border-gray-700">
          <h2 className="text-xl font-semibold text-white">تسجيل دخول المدير</h2>
          <input className="w-full border border-gray-700 bg-gray-900 text-white rounded-lg px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="اسم المستخدم" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} />
          <input className="w-full border border-gray-700 bg-gray-900 text-white rounded-lg px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="كلمة المرور" type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
          <button className="w-full bg-primary hover:bg-primary-dark text-white rounded-lg px-3 py-2">دخول</button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <nav className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-2xl border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={logo} alt="شعار المتجر" className="w-10 h-10 flex-shrink-0 rounded-lg object-contain bg-white" />
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                لوحة تحكم المدير
              </h1>
            </div>
            <button 
              onClick={logout} 
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 md:col-span-3">
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex-shrink-0 bg-white rounded-lg overflow-hidden">
                  <img src={logo} alt="شعار المتجر" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white">لوحة التحكم</div>
                  {currentUser && (
                    <div className="text-xs text-gray-400">{currentUser.username} — {currentUser.role}</div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { id: 'games', label: 'الألعاب', icon: '🎮' },
                  { id: 'categories', label: 'التصنيفات', icon: '📂' },
                  { id: 'genres', label: 'الأنواع والسلاسل', icon: '🏷️' },
                  { id: 'invoices', label: 'الفواتير', icon: '🧾' },
                  { id: 'daily-report', label: 'الجرد اليومي', icon: '📈' },
                  { id: 'invoice-settings', label: 'إعدادات الفاتورة', icon: '🖨️' },
                  { id: 'services', label: 'الخدمات', icon: '🔧' },
                  { id: 'stats', label: 'الإحصائيات', icon: '📊' },
                  ...(currentUser?.role === 'admin' ? [{ id: 'users', label: 'الإدمن', icon: '🛡️' }] : [])
                ].map(({ id, label, icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`w-full text-right px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      tab === id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                    }`}
                  >
                    <span className="ml-2">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
          <section className="col-span-12 md:col-span-9">
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
    const { data } = await api.get('/categories'); 
    setItems(data) 
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
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">إدارة التصنيفات</h2>
        <p className="text-gray-400">إضافة وتعديل وحذف تصنيفات الألعاب</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 shadow-2xl">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
              <span className="text-2xl">📂</span>
            </div>
            <h3 className="text-2xl font-bold text-white">{editing ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">اسم التصنيف</label>
              <input 
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300" 
                placeholder="أدخل اسم التصنيف" 
                value={name} 
                onChange={e => setName(e.target.value)} 
              />
            </div>
            
            <div className="flex space-x-4">
              <button 
                onClick={save} 
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                {editing ? 'تحديث التصنيف' : 'إضافة التصنيف'}
              </button>
              {editing && (
                <button 
                  onClick={() => { setEditing(null); setName('') }} 
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  إلغاء
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 shadow-2xl">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-2xl font-bold text-white">قائمة التصنيفات ({items.length})</h3>
          </div>
          
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors">
                <span className="text-gray-200 font-medium">{item.name}</span>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => { setEditing(item); setName(item.name) }} 
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    تعديل
                  </button>
                  <button 
                    onClick={() => remove(item.id)} 
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors"
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
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">الخدمات</h2>
        <p className="text-gray-400 mt-1">مثل: فورمات PS4، صيانة، إلخ. تظهر في الواجهة الرئيسية ويضيفها الزبون مع الألعاب.</p>
      </div>
      <form onSubmit={save} className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-6 flex flex-wrap items-end gap-3">
        <input
          placeholder="اسم الخدمة (مثال: فورمات PS4)"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white min-w-[200px]"
        />
        <input
          type="number"
          step="0.001"
          placeholder="السعر (د.ل)"
          value={form.price}
          onChange={e => setForm({ ...form, price: e.target.value })}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white w-28"
        />
        <label className="flex items-center gap-2 text-gray-300">
          <input type="checkbox" checked={!!form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} />
          نشط
        </label>
        <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium">
          {editingId ? 'حفظ التعديل' : 'إضافة خدمة'}
        </button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ title: '', price: '', is_active: 1 }) }} className="px-3 py-2 bg-gray-600 text-white rounded-lg">إلغاء</button>}
      </form>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-x-auto">
        <table className="w-full text-white">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-right py-3 px-4">الخدمة</th>
              <th className="text-right py-3 px-4">السعر (د.ل)</th>
              <th className="text-right py-3 px-4">الحالة</th>
              <th className="text-center py-3 px-4">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map(s => (
              <tr key={s.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                <td className="py-3 px-4">{s.title}</td>
                <td className="py-3 px-4 font-mono">{Number(s.price).toFixed(3)}</td>
                <td className="py-3 px-4">{s.is_active ? 'نشط' : 'معطل'}</td>
                <td className="py-3 px-4 text-center">
                  <button onClick={() => { setForm({ title: s.title, price: s.price, is_active: s.is_active }); setEditingId(s.id) }} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm mx-1">تعديل</button>
                  <button onClick={() => remove(s.id)} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm mx-1">حذف</button>
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
    const { data } = await api.get('/stats'); 
    setStats(data) 
  }
  
  useEffect(() => { load() }, [])
  
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">الإحصائيات</h2>
        <p className="text-gray-400">عرض إحصائيات المتجر والألعاب الأكثر طلباً</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 shadow-2xl">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-2xl font-bold text-white">إجمالي الطلبات</h3>
          </div>
          
          <div className="text-4xl font-bold text-purple-400">{stats.totalOrders}</div>
          <p className="text-gray-400 mt-2">طلب إجمالي</p>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 shadow-2xl">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-4">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-2xl font-bold text-white">الألعاب الأكثر طلباً</h3>
          </div>
          
          <div className="space-y-3">
            {stats.topGames.length > 0 ? (
              stats.topGames.map((g, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl">
                  <span className="text-gray-200">اللعبة #{g.gameId}</span>
                  <span className="text-orange-400 font-semibold">{g.count} طلب</span>
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





