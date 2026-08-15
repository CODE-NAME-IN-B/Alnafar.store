import React, { useEffect, useState } from 'react'
import { api, setAuthToken, loadAuthFromStorage } from './api'
import GamesTabNew from './GamesTabNew'
import InvoiceSettings from './InvoiceSettings'
import InvoicesTab from './InvoicesTab'
import DailyReportTab from './DailyReportTab'
import GenreSeriesManager from './GenreSeriesManager'
import logo from '../assites/logo.png'
import UsersTab from './UsersTab'
import PackagesTab from './PackagesTab'

function currency(num) {
  return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(num)
}

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [tab, setTab] = useState('games')
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [currentUser, setCurrentUser] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    loadAuthFromStorage();
    const has = !!localStorage.getItem('token');
    setLoggedIn(has)
    if (has) { api.get('/auth/me').then(r => setCurrentUser(r.data?.user || null)).catch(() => { }) }
  }, [])

  async function submitLogin(e) {
    e.preventDefault()
    try {
      setIsLoggingIn(true)
      const { data } = await api.post('/auth/login', loginForm)
      setAuthToken(data.token)
      setLoggedIn(true)
      try { const r = await api.get('/auth/me'); setCurrentUser(r.data?.user || null) } catch { }
    } catch {
      alert('Invalid credentials')
    } finally {
      setIsLoggingIn(false)
    }
  }

  function logout() {
    setAuthToken(null)
    setLoggedIn(false)
    // إعادة التوجيه إلى الواجهة الرئيسية
    window.location.hash = '#/'
  }

  const navItems = [
    { id: 'games', label: 'الألعاب', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959V6a2 2 0 00-2-2H5.5a2 2 0 00-2 2v5.5c0 .355.186.676.401.959.221.29.349.634.349 1.003 0 1.036 1.007 1.875 2.25 1.875s2.25-.84 2.25-1.875c0-.369-.128-.713-.349-1.003A1.65 1.65 0 015.5 11.5V6" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { id: 'categories', label: 'التصنيفات', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg> },
    { id: 'genres', label: 'الأنواع والسلاسل', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg> },
    { id: 'packages', label: 'الباقات', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg> },
    { id: 'invoices', label: 'الفواتير', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
    { id: 'daily-report', label: 'الجرد اليومي', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg> },
    { id: 'invoice-settings', label: 'إعدادات الفاتورة', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" /></svg> },
    { id: 'services', label: 'الخدمات', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-5.1m0 0L11.42 4.97m-5.1 5.1H21M3 3v18" /></svg> },
    { id: 'stats', label: 'الإحصائيات', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg> },
    { id: 'store-home', label: 'الرئيسية (POS)', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg> },
    ...(currentUser?.role === 'admin' ? [{ id: 'users', label: 'الإدمن', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg> }] : [])
  ]

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        <div className="relative z-10 text-center max-w-sm w-full tab-fade-in">
          <div className="w-16 h-16 mx-auto mb-5 bg-white rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center">
            <img src={logo} alt="Alnafar" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">لوحة التحكم</h1>
          <p className="text-gray-500 mb-8 text-sm">متجر النفار — نظام الإدارة</p>
          <form onSubmit={submitLogin} className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2 text-right">اسم المستخدم</label>
              <input
                id="username"
                className="w-full border border-gray-700 bg-gray-800 text-white rounded-xl px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-base transition-all min-h-[48px]"
                placeholder="أدخل اسم المستخدم"
                value={loginForm.username}
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2 text-right">كلمة المرور</label>
              <input
                id="password"
                className="w-full border border-gray-700 bg-gray-800 text-white rounded-xl px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-base transition-all min-h-[48px]"
                placeholder="أدخل كلمة المرور"
                type="password"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <>
                  <div className="loading-spinner !w-5 !h-5 !border-2 !border-white/30 !border-t-white"></div>
                  <span>جاري الدخول...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white safe-area-bottom">
      {/* Header */}
      <nav className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/50 sticky top-0 z-40" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                aria-label="فتح القائمة"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              </button>

              <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 bg-white rounded-xl overflow-hidden shadow-lg">
                <img src={logo} alt="شعار المتجر" className="w-full h-full object-contain" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base sm:text-lg font-bold text-white leading-tight">لوحة التحكم</h1>
                {currentUser && (
                  <p className="text-[11px] text-gray-500">{currentUser.username} — {currentUser.role}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.location.hash = '#/'}
                className="hidden sm:flex w-10 h-10 items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                aria-label="المتجر الرئيسي"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 font-medium text-xs sm:text-sm transition-all min-h-[40px]"
                aria-label="تسجيل الخروج"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                <span className="hidden sm:inline">خروج</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-5 relative items-start">

          {/* Sidebar - Mobile Drawer */}
          <aside className={`
            fixed md:sticky top-0 md:top-24 right-0 z-50 w-72 md:w-60 lg:w-64 h-screen md:h-auto md:h-auto
            transition-all duration-300 ease-out md:translate-x-0
            ${isMobileMenuOpen ? 'translate-x-0 sidebar-slide-in' : 'translate-x-full md:translate-x-0'}
            border-l border-gray-700/50 md:border-none shadow-2xl md:shadow-none
            flex flex-col md:block
          `}>
            <div className="bg-gray-900/98 md:bg-gray-800/50 md:backdrop-blur-xl rounded-none md:rounded-2xl border-0 md:border md:border-gray-700/50 h-full md:max-h-[calc(100vh-8rem)] overflow-y-auto md:overflow-y-auto">
              {/* Mobile Header */}
              <div className="flex items-center justify-between gap-3 p-4 pb-2 md:hidden border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex-shrink-0 bg-white rounded-xl overflow-hidden shadow-lg">
                    <img src={logo} alt="شعار المتجر" className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white text-sm">لوحة التحكم</div>
                    {currentUser && (
                      <div className="text-[11px] text-gray-400 truncate">{currentUser.username}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  aria-label="إغلاق القائمة"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Navigation */}
              <nav className="p-2 md:p-2 space-y-0.5" role="navigation" aria-label="القائمة الرئيسية">
                {navItems.map(({ id, label, icon }) => (
                  <button
                    key={id}
                    onClick={() => { setTab(id); setIsMobileMenuOpen(false); }}
                    className={`w-full text-right px-2.5 py-2 rounded-lg font-medium transition-all duration-200 min-h-[36px] flex items-center justify-start gap-2 text-xs ${tab === id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    aria-current={tab === id ? 'page' : undefined}
                  >
                    <span className={`w-4 h-4 flex-shrink-0 ${tab === id ? 'text-white' : 'text-gray-500'}`}>{icon}</span>
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <main className="flex-1 min-w-0 md:w-3/4 lg:w-4/5" role="main">
            <div key={tab} className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 shadow-xl overflow-hidden tab-fade-in">
              {tab === 'games' && <GamesTabNew />}
              {tab === 'categories' && <CategoriesTab />}
              {tab === 'genres' && <GenreSeriesManager />}
              {tab === 'packages' && <PackagesTab />}
              {tab === 'invoices' && <InvoicesTab />}
              {tab === 'daily-report' && <DailyReportTab />}
              {tab === 'invoice-settings' && <InvoiceSettings />}
              {tab === 'services' && <ServicesTab />}
              {tab === 'stats' && <StatsTab />}
              {tab === 'users' && currentUser?.role === 'admin' && <UsersTab />}
            </div>
          </main>
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
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
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
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
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
    return <div className="p-4 sm:p-6 lg:p-8 text-center text-gray-400">جاري التحميل...</div>
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-2xl font-bold text-white">الخدمات</h2>
        <p className="text-gray-400 mt-1 text-xs sm:text-base">مثل: فورمات PS4، صيانة، إلخ. تظهر في الواجهة الرئيسية ويضيفها الزبون مع الألعاب.</p>
      </div>
      <form onSubmit={save} className="bg-gray-800 p-3 sm:p-4 rounded-xl border border-gray-700 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end gap-3">
        <input
          placeholder="اسم الخدمة (مثال: فورمات PS4)"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white flex-1 min-w-0 text-sm"
        />
        <input
          type="number"
          step="0.001"
          placeholder="السعر (د.ل)"
          value={form.price}
          onChange={e => setForm({ ...form, price: e.target.value })}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white sm:w-32 text-sm"
        />
        <label className="flex items-center gap-2 text-gray-300 text-sm">
          <input type="checkbox" checked={!!form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} />
          نشط
        </label>
        <div className="flex gap-2">
          <button type="submit" className="flex-1 sm:flex-none px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium text-sm">
            {editingId ? 'حفظ التعديل' : 'إضافة خدمة'}
          </button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ title: '', price: '', is_active: 1 }) }} className="px-3 py-2.5 bg-gray-600 text-white rounded-lg text-sm">إلغاء</button>}
        </div>
      </form>

      {/* Mobile card layout */}
      <div className="sm:hidden space-y-3">
        {items.length === 0 && <div className="p-6 text-center text-gray-400">لا توجد خدمات. أضف خدمة من النموذج أعلاه.</div>}
        {items.map(s => (
          <div key={s.id} className="bg-gray-800 rounded-xl border border-gray-700 p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{s.title}</p>
                <p className="text-primary font-mono text-sm mt-0.5">{Number(s.price).toFixed(3)} د.ل</p>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${s.is_active ? 'bg-green-900/40 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                {s.is_active ? 'نشط' : 'معطل'}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setForm({ title: s.title, price: s.price, is_active: s.is_active }); setEditingId(s.id) }} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">تعديل</button>
              <button onClick={() => remove(s.id)} className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors">حذف</button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table layout */}
      <div className="hidden sm:block bg-gray-800 rounded-xl border border-gray-700 overflow-x-auto">
        <table className="w-full text-white">
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
                  <button onClick={() => { setForm({ title: s.title, price: s.price, is_active: s.is_active }); setEditingId(s.id) }} className="px-3 py-2 min-h-[40px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors mx-1">تعديل</button>
                  <button onClick={() => remove(s.id)} className="px-3 py-2 min-h-[40px] bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors mx-1">حذف</button>
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
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">إجمالي الطلبات</h3>
          </div>
          <div className="text-4xl sm:text-5xl font-bold text-purple-400 mb-2">{stats.totalOrders}</div>
          <p className="text-gray-400">طلب إجمالي</p>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 sm:p-8 rounded-2xl border border-gray-700 shadow-2xl">
          <div className="flex items-center mb-5 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0116.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.665 6.023 6.023 0 01-2.77-.665m5.54 0a6.023 6.023 0 01-2.77.665 6.023 6.023 0 01-2.77-.665" /></svg>
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





