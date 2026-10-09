import React, { useEffect, useState } from 'react'
import { api, setAuthToken, loadAuthFromStorage, setActiveBranchId } from './api'
import GamesTabNew from './GamesTabNew'
import InvoiceSettings from './InvoiceSettings'
import InvoicesTab from './InvoicesTab'
import Loader from './Loader'
import { preloadLogo } from './utils/logoCache'
import { showToast as showToastShared } from './utils/toast'
import DailyReportTab from './DailyReportTab'
import GenreSeriesManager from './GenreSeriesManager'
import logo from '../assites/logo.png'
import UsersTab from './UsersTab'
import PackagesTab from './PackagesTab'
import BranchesTab from './BranchesTab'

function currency(num) {
  return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(num)
}

function showToast(message, type = 'info') {
  showToastShared(message, type)
}

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [tab, setTab] = useState('dashboard')
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [currentUser, setCurrentUser] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [branches, setBranches] = useState([])
  const [activeBranch, setActiveBranch] = useState('all')
  const [scopeVersion, setScopeVersion] = useState(0)

  const isSuperAdmin = !!currentUser && currentUser.role === 'admin' && Number(currentUser.branch_id || 1) === 1

  useEffect(() => {
    loadAuthFromStorage();
    setActiveBranchId(null);
    setActiveBranch('all');
    const has = !!localStorage.getItem('token');
    if (has) {
      api.get('/auth/me').then(r => {
        setCurrentUser(r.data?.user || null)
        setLoggedIn(true)
      }).catch(() => {
        setAuthToken(null)
        setLoggedIn(false)
      })
    }
  }, [])

  // تحميل قائمة الفروع للأدمن الرئيسي (لمُحدِّد الفرع)
  useEffect(() => {
    if (!loggedIn || !currentUser || currentUser.role !== 'admin') return
    api.get('/branches').then(r => {
      setBranches(Array.isArray(r.data) ? r.data : (r.data?.branches || []))
    }).catch(() => {})
  }, [loggedIn, currentUser])

  // مزامنة الفرع النشط مع طبقة الـ API وإعادة تحميل التبويب عند تغييره
  function changeBranch(val) {
    setActiveBranch(val)
    setActiveBranchId(val)
    setScopeVersion(v => v + 1)
  }

  // Preload invoice logo for instant print
  useEffect(() => { preloadLogo(window.location.origin) }, [])

  async function submitLogin(e) {
    e.preventDefault()
    try {
      setIsLoggingIn(true)
      const { data } = await api.post('/auth/login', loginForm)
      setAuthToken(data.token)
      // ابدأ من نطاق "كل الفروع" قبل معرفة هوية المستخدم؛ سيُقيّد تلقائياً في الخادم لأدمن الفرع
      setActiveBranchId(null)
      setActiveBranch('all')
      setLoggedIn(true)
      try { const r = await api.get('/auth/me'); setCurrentUser(r.data?.user || null) } catch { }
    } catch {
      showToast('اسم المستخدم أو كلمة المرور غير صحيحة', 'error')
    } finally {
      setIsLoggingIn(false)
    }
  }

  function logout() {
    setAuthToken(null)
    setActiveBranchId(null)
    setActiveBranch('all')
    setCurrentUser(null)
    setScopeVersion(v => v + 1)
    setLoggedIn(false)
    // إعادة التوجيه إلى الواجهة الرئيسية
    window.location.hash = '#/'
  }

  const navItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg> },
    { id: 'games', label: 'الألعاب', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959V6a2 2 0 00-2-2H5.5a2 2 0 00-2 2v5.5c0 .355.186.676.401.959.221.29.349.634.349 1.003 0 1.036 1.007 1.875 2.25 1.875s2.25-.84 2.25-1.875c0-.369-.128-.713-.349-1.003A1.65 1.65 0 015.5 11.5V6" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { id: 'invoices', label: 'الفواتير', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
    { id: 'daily-report', label: 'الجرد اليومي', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg> },
    { id: 'packages', label: 'الباقات', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg> },
    { id: 'categories', label: 'التصنيفات', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg> },
    { id: 'genres', label: 'الأنواع', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg> },
    { id: 'services', label: 'الخدمات', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-5.1m0 0L11.42 4.97m-5.1 5.1H21M3 3v18" /></svg> },
    { id: 'invoice-settings', label: 'الإعدادات', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { id: 'store-home', label: 'فتح المتجر', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg> },
    ...(currentUser?.role === 'admin' ? [
      ...(isSuperAdmin ? [
        { id: 'branches', label: 'الفروع', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" /></svg> }
      ] : []),
      { id: 'users', label: 'المستخدمون', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> },
      { id: 'audit-logs', label: 'سجل النشاط', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> }
    ] : [])
  ]

  if (!loggedIn) {
    return (
      <div className="min-h-screen text-white flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{background: 'var(--bg)'}}>
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-pulse" style={{background: 'rgba(20, 184, 166, 0.15)'}}></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-pulse" style={{background: 'rgba(20, 184, 166, 0.1)', animationDelay: '1s'}}></div>
        </div>
        <div className="relative z-10 text-center max-w-sm w-full tab-fade-in">
          <div className="w-16 h-16 mx-auto mb-5 bg-white rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center">
            <img src={logo} alt="Alnafar" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{color: 'var(--brand)'}}>لوحة التحكم</h1>
          <p className="mb-8 text-sm" style={{color: 'var(--text-secondary)'}}>متجر النفار — نظام الإدارة</p>
          <form onSubmit={submitLogin} className="rounded-2xl p-6 space-y-4 shadow-2xl" style={{background: 'var(--surface-elevated)', border: '1px solid var(--border)'}}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2 text-right" style={{color: 'var(--text-secondary)'}}>اسم المستخدم</label>
              <input
                id="username"
                className="w-full rounded-xl px-4 py-3 text-base transition-all min-h-[48px]"
                placeholder="أدخل اسم المستخدم"
                value={loginForm.username}
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-right" style={{color: 'var(--text-secondary)'}}>كلمة المرور</label>
              <input
                id="password"
                className="w-full rounded-xl px-4 py-3 text-base transition-all min-h-[48px]"
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
              className="w-full px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{background: 'var(--brand)', color: 'white'}}
            >
              {isLoggingIn ? (
                <>
                  <div className="loading-spinner !w-5 !h-5"></div>
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
    <div className="min-h-screen text-white safe-area-bottom" style={{background: 'var(--bg)'}}>
      {/* Header */}
      <nav className="sticky top-0 z-40" style={{background: 'var(--surface)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)'}} role="banner">
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

              {/* مُحدِّد الفرع: الأدمن الرئيسي يختار أي فرع، وأدمن الفرع يرى فرعه فقط */}
              {currentUser?.role === 'admin' && (
                isSuperAdmin ? (
                  <select
                    value={activeBranch}
                    onChange={e => changeBranch(e.target.value)}
                    className="mr-1 sm:mr-2 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-medium min-h-[40px] max-w-[46vw] sm:max-w-none truncate cursor-pointer"
                    style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    aria-label="اختيار الفرع"
                    title="اعرض بيانات فرع معيّن أو كل الفروع"
                  >
                    <option value="all">كل الفروع</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}{b.is_main ? ' (رئيسي)' : ''}</option>
                    ))}
                  </select>
                ) : (
                  <span className="mr-1 sm:mr-2 px-2.5 py-2 rounded-xl text-xs font-bold min-h-[40px] flex items-center" style={{ background: 'rgba(20,184,166,0.12)', color: 'var(--brand)', border: '1px solid rgba(20,184,166,0.3)' }}>
                    {currentUser.branch_name || 'فرع'}
                  </span>
                )
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setActiveBranchId(null); window.location.hash = '#/' }}
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
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-5 relative md:items-start">

          {/* Sidebar - Mobile Drawer */}
          <aside className={`
            fixed md:sticky top-0 md:top-24 right-0 z-50 w-72 md:w-60 lg:w-64 h-screen md:h-auto md:h-auto
            transition-all duration-300 ease-out md:translate-x-0
            ${isMobileMenuOpen ? 'translate-x-0 sidebar-slide-in' : 'translate-x-full md:translate-x-0'}
            md:border-none shadow-2xl md:shadow-none
            flex flex-col md:block
          `} style={{borderLeft: '1px solid var(--border)'}}>
            <div className="md:backdrop-blur-xl rounded-none md:rounded-2xl border-0 md:border h-full md:max-h-[calc(100vh-8rem)] overflow-y-auto md:overflow-y-auto" style={{background: 'var(--surface)', borderColor: 'var(--border)'}}>
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
              <nav className="p-3 md:p-2 space-y-1" role="navigation" aria-label="القائمة الرئيسية">
                {navItems.map(({ id, label, icon }) => (
                  <button
                    key={id}
                    onClick={() => { 
                      if (id === 'store-home') { setActiveBranchId(null); window.location.hash = '#/'; return; }
                      setTab(id); setIsMobileMenuOpen(false); 
                    }}
                    className={`w-full text-right px-3 py-2.5 rounded-xl font-medium transition-all duration-200 min-h-[44px] flex items-center justify-start gap-3 text-sm ${tab === id
                      ? 'text-white shadow-lg'
                      : 'hover:text-white'
                      }`}
                    style={tab === id ? {background: 'var(--brand)', boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)'} : {color: 'var(--text-secondary)'}}
                    aria-current={tab === id ? 'page' : undefined}
                  >
                    <span className={`w-5 h-5 flex-shrink-0 ${tab === id ? 'text-white' : 'text-gray-400'}`}>{icon}</span>
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <main className="flex-1 min-w-0 w-full md:w-3/4 lg:w-4/5" role="main">
            <div key={`${tab}-${scopeVersion}`} className="backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden tab-fade-in" style={{background: 'var(--surface)', border: '1px solid var(--border)'}}>
              {tab === 'dashboard' && <DashboardHome />}
              {tab === 'games' && <GamesTabNew />}
              {tab === 'categories' && <CategoriesTab />}
              {tab === 'genres' && <GenreSeriesManager />}
              {tab === 'packages' && <PackagesTab />}
              {tab === 'invoices' && <InvoicesTab />}
              {tab === 'daily-report' && <DailyReportTab />}
              {tab === 'invoice-settings' && <InvoiceSettings />}
              {tab === 'services' && <ServicesTab />}
              {tab === 'stats' && <StatsTab />}
              {tab === 'branches' && isSuperAdmin && <BranchesTab />}
              {tab === 'users' && currentUser?.role === 'admin' && <UsersTab />}
              {tab === 'audit-logs' && currentUser?.role === 'admin' && <AuditLogsTab />}
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      setLoading(true)
      const { data } = await api.get('/categories');
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      setItems([])
      showToast('تعذر تحميل التصنيفات', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function save(e) {
    if (e) e.preventDefault()
    if (!name.trim()) return
    try {
      setSaving(true)
      if (editing) {
        await api.put(`/categories/${editing.id}`, { name: name.trim() })
        // تحديث محلي بدلاً من إعادة التحميل
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === editing.id ? { ...item, name: name.trim() } : item
          )
        )
        showToast('تم تحديث التصنيف بنجاح')
      } else {
        const response = await api.post('/categories', { name: name.trim() })
        // إضافة التصنيف الجديد محلياً
        setItems(prevItems => [...prevItems, response.data])
        showToast('تمت إضافة التصنيف بنجاح')
      }
      setName(''); setEditing(null)
    } catch (e) {
      showToast(e?.response?.data?.message || 'فشل حفظ التصنيف', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id) {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return
    try {
      await api.delete(`/categories/${id}`)
      // حذف محلي بدلاً من إعادة التحميل
      setItems(prevItems => prevItems.filter(item => item.id !== id))
      showToast('تم حذف التصنيف')
    } catch (e) {
      showToast('تعذر حذف التصنيف', 'error')
    }
  }

  async function toggleVisibility(item) {
    const next = Number(item.is_visible) ? 0 : 1
    try {
      await api.put(`/categories/${item.id}/visibility`, { is_visible: next })
      setItems(prevItems => prevItems.map(c => c.id === item.id ? { ...c, is_visible: next } : c))
      showToast(next ? 'أصبح التصنيف ظاهراً' : 'تم إخفاء التصنيف')
    } catch (e) {
      showToast('تعذر تغيير حالة الظهور', 'error')
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="skeleton-header mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {[0, 1].map(i => (
            <div key={i} className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-5 sm:p-6 space-y-3">
              <div className="skeleton h-8 w-1/2 rounded-lg"></div>
              <div className="skeleton h-12 w-full rounded-xl"></div>
              <div className="skeleton h-12 w-full rounded-xl"></div>
              <div className="skeleton h-12 w-full rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">إدارة التصنيفات</h2>
        <p className="text-gray-400 text-sm sm:text-base">إضافة وتعديل وحذف تصنيفات الألعاب</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">{editing ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</h3>
          </div>

          <form onSubmit={save} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">اسم التصنيف</label>
              <input
                className="w-full bg-gray-950 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                placeholder="أدخل اسم التصنيف"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="btn btn-primary flex-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                {saving ? 'جاري الحفظ...' : (editing ? 'تحديث التصنيف' : 'إضافة التصنيف')}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => { setEditing(null); setName('') }}
                  className="btn btn-secondary"
                >
                  إلغاء
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h7.5M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">قائمة التصنيفات ({items.length})</h3>
          </div>

          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon text-teal-400">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /></svg>
              </div>
              <div className="empty-state-title">لا توجد تصنيفات</div>
              <div className="empty-state-description">ابدأ بإضافة أول تصنيف من النموذج المجاور.</div>
            </div>
          ) : (
            <div className="space-y-3 custom-scrollbar max-h-[28rem] overflow-y-auto pr-1">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-950/60 rounded-xl border border-white/5 hover:border-teal-500/20 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-gray-200 font-medium text-sm sm:text-base truncate ${Number(item.is_visible) ? '' : 'line-through opacity-50'}`}>{item.name}</span>
                    <span className={`badge shrink-0 ${Number(item.is_visible) ? 'badge-success' : 'badge-neutral'}`}>
                      {Number(item.is_visible) ? 'ظاهر' : 'مخفي'}
                    </span>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleVisibility(item)}
                      className={`btn btn-sm ${Number(item.is_visible) ? 'btn-secondary text-amber-300' : 'btn-secondary text-teal-300'}`}
                      title={Number(item.is_visible) ? 'إخفاء من المتجر' : 'إظهار في المتجر'}
                      aria-label={Number(item.is_visible) ? 'إخفاء' : 'إظهار'}
                    >
                      {Number(item.is_visible) ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      )}
                      <span className="hidden sm:inline">{Number(item.is_visible) ? 'إخفاء' : 'إظهار'}</span>
                    </button>
                    <button
                      onClick={() => { setEditing(item); setName(item.name) }}
                      className="btn btn-sm btn-secondary text-teal-300"
                      title="تعديل"
                      aria-label="تعديل"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                      <span className="hidden sm:inline">تعديل</span>
                    </button>
                    <button
                      onClick={() => remove(item.id)}
                      className="btn btn-sm btn-secondary text-red-400"
                      title="حذف"
                      aria-label="حذف"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      <span className="hidden sm:inline">حذف</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ServicesTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', price: '', is_active: 1 })
  const [editingId, setEditingId] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/services?active=false')
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      showToast('تعذر تحميل الخدمات', 'error')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    try {
      setSaving(true)
      if (editingId) {
        await api.put(`/services/${editingId}`, {
          title: form.title.trim(),
          price: Number(form.price) || 0,
          is_active: form.is_active ? 1 : 0
        })
        setEditingId(null)
        showToast('تم تحديث الخدمة بنجاح')
      } else {
        await api.post('/services', {
          title: form.title.trim(),
          price: Number(form.price) || 0,
          is_active: form.is_active ? 1 : 0
        })
        showToast('تمت إضافة الخدمة بنجاح')
      }
      setForm({ title: '', price: '', is_active: 1 })
      load()
    } catch (err) {
      showToast(err?.response?.data?.message || 'فشل الحفظ', 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!confirm('حذف هذه الخدمة؟')) return
    try {
      await api.delete(`/services/${id}`)
      showToast('تم حذف الخدمة')
      load()
    } catch (err) {
      showToast('فشل الحذف', 'error')
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="skeleton-header"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[1,2,3].map(i => <div key={i} className="skeleton-card"></div>)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-2xl font-bold text-white">الخدمات</h2>
        <p className="text-gray-400 mt-1 text-xs sm:text-base">مثل: فورمات PS4، صيانة، إلخ. تظهر في الواجهة الرئيسية ويضيفها الزبون مع الألعاب.</p>
      </div>

      <form onSubmit={save} className="bg-gray-900/40 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/5 shadow-xl mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">اسم الخدمة</label>
          <input
            placeholder="مثال: فورمات PS4"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full bg-gray-950 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-sm"
          />
        </div>
        <div className="sm:w-36">
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">السعر (د.ل)</label>
          <input
            type="number"
            step="0.001"
            placeholder="0.000"
            value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
            className="w-full bg-gray-950 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-gray-300 text-sm min-h-[44px] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!form.is_active}
            onChange={e => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })}
            className="w-4 h-4 accent-teal-500"
          />
          نشط
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={saving || !form.title.trim()} className="btn btn-primary flex-1 sm:flex-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            {saving ? 'جاري الحفظ...' : (editingId ? 'حفظ التعديل' : 'إضافة خدمة')}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm({ title: '', price: '', is_active: 1 }) }} className="btn btn-secondary">
              إلغاء
            </button>
          )}
        </div>
      </form>

      {/* Mobile card layout */}
      <div className="sm:hidden space-y-3">
        {items.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon text-teal-400">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-5.1m0 0L11.42 4.97m-5.1 5.1H21M3 3v18" /></svg>
            </div>
            <div className="empty-state-title">لا توجد خدمات</div>
            <div className="empty-state-description">أضف خدمة من النموذج أعلاه.</div>
          </div>
        )}
        {items.map(s => (
          <div key={s.id} className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{s.title}</p>
                <p className="text-teal-400 font-mono text-sm mt-0.5 tabular-nums">{Number(s.price).toFixed(3)} د.ل</p>
              </div>
              <span className={`badge shrink-0 ${s.is_active ? 'badge-success' : 'badge-neutral'}`}>
                {s.is_active ? 'نشط' : 'معطل'}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setForm({ title: s.title, price: s.price, is_active: s.is_active }); setEditingId(s.id) }} className="btn btn-secondary flex-1 btn-sm text-teal-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                تعديل
              </button>
              <button onClick={() => remove(s.id)} className="btn btn-secondary flex-1 btn-sm text-red-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table layout */}
      <div className="hidden sm:block bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl overflow-hidden">
        <table className="w-full text-white">
          <thead>
            <tr className="border-b border-white/5 bg-gray-950/40">
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">الخدمة</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">السعر (د.ل)</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">الحالة</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map(s => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 text-sm">{s.title}</td>
                <td className="py-3 px-4 font-mono text-sm tabular-nums">{Number(s.price).toFixed(3)}</td>
                <td className="py-3 px-4">
                  <span className={`badge ${s.is_active ? 'badge-success' : 'badge-neutral'}`}>
                    {s.is_active ? 'نشط' : 'معطل'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button onClick={() => { setForm({ title: s.title, price: s.price, is_active: s.is_active }); setEditingId(s.id) }} className="btn btn-secondary btn-sm text-teal-300 mx-1" title="تعديل">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                    تعديل
                  </button>
                  <button onClick={() => remove(s.id)} className="btn btn-secondary btn-sm text-red-400 mx-1" title="حذف">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon text-teal-400">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-5.1m0 0L11.42 4.97m-5.1 5.1H21M3 3v18" /></svg>
            </div>
            <div className="empty-state-title">لا توجد خدمات</div>
            <div className="empty-state-description">أضف خدمة من النموذج أعلاه.</div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatsTab() {
  const [stats, setStats] = useState({ totalOrders: 0, topGames: [] })
  const [details, setDetails] = useState([])
  const [gamesCount, setGamesCount] = useState(null)

  async function load() {
    try {
      const { data } = await api.get('/stats');
      const topGames = Array.isArray(data?.topGames) ? data.topGames : []
      setStats({ totalOrders: data?.totalOrders || 0, topGames })
      setGamesCount(data?.totalGames ?? null)

      // حلّ عناوين الألعاب عبر /games/batch (نفس نمط TopList في App.jsx)
      const idList = topGames
        .map(t => t.gameId)
        .filter(v => v !== null && v !== undefined && String(v).trim() !== '' && !Number.isNaN(Number(v)))
      let rows = []
      if (idList.length) {
        try {
          const res = await api.get('/games/batch', { params: { ids: idList.join(',') } })
          rows = Array.isArray(res.data) ? res.data : []
        } catch (_) { rows = [] }
      }
      const map = new Map(rows.map(g => [Number(g.id), g]))
      setDetails(
        topGames.map(t => {
          const g = (t.gameId !== null && t.gameId !== undefined && String(t.gameId).trim() !== '') ? map.get(Number(t.gameId)) : null
          return {
            id: g?.id ?? t.gameId ?? t.title,
            title: g?.title || t.title || (t.gameId ? `لعبة #${t.gameId}` : null),
            image: g?.image || '',
            count: t.count
          }
        }).filter(g => g.title !== null)
      )
    } catch (e) {
      setStats({ totalOrders: 0, topGames: [] })
      setDetails([])
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">الإحصائيات</h2>
        <p className="text-gray-400 text-sm sm:text-base">عرض إحصائيات المتجر والألعاب الأكثر طلباً</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-5 sm:p-8">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">إجمالي الطلبات</h3>
          </div>
          <div className="text-4xl sm:text-5xl font-bold text-teal-400 mb-2 tabular-nums">{stats.totalOrders}</div>
          <p className="text-gray-400">طلب إجمالي</p>
          <div className="mt-4 text-sm text-gray-400">
            الألعاب في المتجر: <span className="text-teal-400 font-semibold tabular-nums">{gamesCount ?? stats.topGames.length}</span>
          </div>
        </div>

        <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-5 sm:p-8">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0116.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.665 6.023 6.023 0 01-2.77-.665m5.54 0a6.023 6.023 0 01-2.77.665 6.023 6.023 0 01-2.77-.665" /></svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">الألعاب الأكثر طلباً</h3>
          </div>

          <div className="space-y-3">
            {details.length > 0 ? (
              details.slice(0, 5).map((g, i) => (
                <div key={g.id} className="flex items-center justify-between p-3 bg-gray-950/60 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 bg-teal-500/15 text-teal-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 tabular-nums">{i + 1}</span>
                    {g.image && (
                      <img src={g.image} alt={g.title} loading="lazy" className="w-9 h-9 rounded-lg object-cover border border-white/10 shrink-0" onError={e => { e.currentTarget.style.display = 'none' }} />
                    )}
                    <span className="text-gray-200 text-sm truncate">{g.title}</span>
                  </div>
                  <span className="text-teal-400 font-semibold text-sm shrink-0 tabular-nums">{g.count}</span>
                </div>
              ))
            ) : (
              <div className="empty-state py-8">
                <div className="empty-state-icon text-teal-400">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <div className="empty-state-title">لا توجد بيانات بعد</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


function DashboardHome() {
  const [stats, setStats] = useState({ totalOrders: 0, topGames: [], totalGames: null })
  const [topDetails, setTopDetails] = useState([])
  const [invoicesSummary, setInvoicesSummary] = useState(null)
  const [recentInvoices, setRecentInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [statsRes, summaryRes, invoicesRes] = await Promise.allSettled([
          api.get('/stats'),
          api.get('/invoices-summary'),
          api.get('/invoices?limit=5')
        ])
        if (statsRes.status === 'fulfilled') {
          const d = statsRes.value.data || {}
          const topGames = Array.isArray(d.topGames) ? d.topGames : []
          if (!cancelled) {
            setStats({
              totalOrders: d.totalOrders || 0,
              topGames,
              totalGames: d.totalGames ?? null
            })
          }

          // حلّ عناوين الألعاب وصورها عبر /games/batch (نفس نمط TopList في App.jsx)
          const idList = topGames
            .map(t => t.gameId)
            .filter(v => v !== null && v !== undefined && String(v).trim() !== '' && !Number.isNaN(Number(v)))
          let rows = []
          if (idList.length) {
            try {
              const res = await api.get('/games/batch', { params: { ids: idList.join(',') } })
              rows = Array.isArray(res.data) ? res.data : (res.data?.games || [])
            } catch (_) { rows = [] }
          }
          const map = new Map(rows.map(g => [Number(g.id), g]))
          const resolved = topGames
            .map(t => {
              const g = (t.gameId !== null && t.gameId !== undefined && String(t.gameId).trim() !== '')
                ? map.get(Number(t.gameId))
                : null
              return {
                id: g?.id ?? t.gameId ?? t.title,
                title: g?.title || t.title || (t.gameId ? `لعبة #${t.gameId}` : null),
                image: g?.image || '',
                count: t.count
              }
            })
            .filter(g => g.title !== null)
          if (!cancelled) setTopDetails(resolved)
        }
        if (summaryRes.status === 'fulfilled') {
          if (!cancelled) setInvoicesSummary(summaryRes.value.data)
        }
        if (invoicesRes.status === 'fulfilled') {
          if (!cancelled) setRecentInvoices(invoicesRes.value.data?.invoices || invoicesRes.value.data || [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="skeleton-header mb-6"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton h-28 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {[1,2].map(i => (
            <div key={i} className="skeleton h-64 rounded-2xl"></div>
          ))}
        </div>
      </div>
    )
  }

  // قراءة دفاعية لكل شكل من أشكال الاستجابة
  const summary = invoicesSummary?.summary || invoicesSummary || {}
  const invoiceCount = summary.totalInvoices ?? summary.total_invoices ?? stats.totalOrders
  const revenue = summary.totalRevenue ?? summary.total_revenue ?? 0
  const gamesCount = stats.totalGames ?? stats.topGames.length

  const fmt = (n) => new Intl.NumberFormat('ar-LY', { maximumFractionDigits: 0 }).format(Number(n) || 0)
  const fmtDate = (v) => {
    if (!v) return ''
    const d = new Date(v)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('ar-LY', { day: '2-digit', month: '2-digit' })
  }

  const kpis = [
    {
      label: 'إجمالي الطلبات',
      value: fmt(stats.totalOrders),
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
    },
    {
      label: 'الفواتير',
      value: fmt(invoiceCount),
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
    },
    {
      label: 'الإيرادات',
      value: `${fmt(revenue)} د.ل`,
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
    },
    {
      label: 'الألعاب',
      value: fmt(gamesCount),
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959V6a2 2 0 00-2-2H5.5a2 2 0 00-2 2v5.5c0 .355.186.676.401.959.221.29.349.634.349 1.003 0 1.036 1.007 1.875 2.25 1.875s2.25-.84 2.25-1.875c0-.369-.128-.713-.349-1.003A1.65 1.65 0 015.5 11.5V6" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    },
  ]

  const statusBadges = {
    pending: 'badge-warning',
    confirmed: 'badge-info',
    processing: 'badge-info',
    ready: 'badge-success',
    completed: 'badge-success',
    cancelled: 'badge-danger',
    refunded: 'badge-neutral',
  }
  const statusLabels = {
    pending: 'قيد الانتظار', confirmed: 'مؤكد', processing: 'قيد التنفيذ',
    ready: 'جاهز', completed: 'مكتمل', cancelled: 'ملغي', refunded: 'مسترد',
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white">مرحباً بك</h2>
        <p className="text-gray-400 text-sm mt-1">نظرة عامة على المتجر</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-4 sm:p-5 hover:border-teal-500/30 transition-colors duration-200">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mb-3">
              {kpi.icon}
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white leading-tight tabular-nums">{kpi.value}</div>
            <div className="text-gray-400 text-[11px] sm:text-xs mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Invoices */}
        <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-4 sm:p-5">
          <h3 className="text-base font-bold text-white mb-4">آخر الفواتير</h3>
          {recentInvoices.length === 0 ? (
            <div className="empty-state py-8">
              <div className="empty-state-icon text-teal-400">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              </div>
              <div className="empty-state-title">لا توجد فواتير بعد</div>
            </div>
          ) : (
            <div className="space-y-2">
              {recentInvoices.slice(0, 5).map((inv, i) => (
                <div key={inv.id ?? i} className="flex items-center justify-between gap-3 p-3 bg-gray-950/60 rounded-xl border border-white/5">
                  <div className="min-w-0">
                    <div className="text-white text-sm font-medium truncate">{inv.customer_name || 'عميل'}</div>
                    <div className="text-gray-400 text-xs truncate">
                      {inv.invoice_number}
                      {fmtDate(inv.created_at) ? ` • ${fmtDate(inv.created_at)}` : ''}
                    </div>
                  </div>
                  <div className="text-left shrink-0 flex flex-col items-end gap-1">
                    <div className="text-white font-semibold text-sm tabular-nums">{Number(inv.final_total || inv.total || 0).toFixed(2)} د.ل</div>
                    <span className={`badge ${statusBadges[inv.status] || 'badge-neutral'}`}>
                      {statusLabels[inv.status] || inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Games */}
        <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-4 sm:p-5">
          <h3 className="text-base font-bold text-white mb-4">الأكثر مبيعاً</h3>
          {topDetails.length === 0 ? (
            <div className="empty-state py-8">
              <div className="empty-state-icon text-teal-400">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959V6a2 2 0 00-2-2H5.5a2 2 0 00-2 2v5.5c0 .355.186.676.401.959.221.29.349.634.349 1.003 0 1.036 1.007 1.875 2.25 1.875s2.25-.84 2.25-1.875c0-.369-.128-.713-.349-1.003A1.65 1.65 0 015.5 11.5V6" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div className="empty-state-title">لا توجد بيانات بعد</div>
            </div>
          ) : (
            <div className="space-y-2">
              {topDetails.slice(0, 5).map((g, i) => (
                <div key={g.id ?? i} className="flex items-center gap-3 p-3 bg-gray-950/60 rounded-xl border border-white/5">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 tabular-nums ${
                    i === 0 ? 'bg-teal-500/20 text-teal-300'
                    : i === 1 ? 'bg-gray-400/20 text-gray-300'
                    : i === 2 ? 'bg-teal-700/20 text-teal-500'
                    : 'bg-white/5 text-gray-500'
                  }`}>{i + 1}</span>
                  {g.image ? (
                    <img
                      src={g.image}
                      alt={g.title}
                      loading="lazy"
                      className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                      onError={e => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-400 border border-white/10 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959" /></svg>
                    </div>
                  )}
                  <span className="flex-1 min-w-0 text-white text-sm truncate" title={g.title}>{g.title}</span>
                  <span className="text-teal-400 font-semibold text-sm shrink-0 tabular-nums">{g.count} مبيعة</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


const auditSelectCls = "w-full sm:w-auto bg-gray-950 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all cursor-pointer"

function AuditLogsTab() {
  const [logs, setLogs] = useState([])
  const [branches, setBranches] = useState([])
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState({ action: '', entity_type: '', branchId: '' })

  const isSuperAdmin = !!me && me.role === 'admin' && Number(me.branch_id || 1) === 1

  const statusLabels = {
    pending: 'قيد الانتظار', confirmed: 'مؤكد', processing: 'قيد التنفيذ',
    ready: 'جاهز', completed: 'مكتمل', cancelled: 'ملغي', refunded: 'مسترد',
  }

  const actionLabels = {
    login_success: 'تسجيل دخول ناجح',
    login_failed: 'محاولة دخول فاشلة',
    invoice_status_changed: 'تغيير حالة فاتورة',
    order_status_changed: 'تغيير حالة طلب',
    game_created: 'إضافة لعبة',
    game_updated: 'تعديل لعبة',
    game_deleted: 'حذف لعبة',
    settings_updated: 'تعديل الإعدادات',
    settings_created: 'إنشاء الإعدادات',
    invoices_paid_all: 'تسديد جميع الفواتير',
    invoice_marked_unpaid: 'إرجاع فاتورة إلى غير مدفوعة',
    payment_recorded: 'تسجيل دفعة',
  }

  const entityLabels = {
    user: 'مستخدم',
    game: 'لعبة',
    invoice: 'فاتورة',
    settings: 'الإعدادات',
  }

  const diffLabels = {
    status: 'الحالة',
    paid_amount: 'المبلغ المدفوع',
    payment_amount: 'قيمة الدفعة',
    price: 'السعر',
    title: 'العنوان',
    category_id: 'الفئة',
    genre: 'النوع',
    series: 'السلسلة',
    whatsapp_number: 'رقم واتساب',
    telegram_username: 'تلجرام',
    communication_method: 'طريقة التواصل',
    reason: 'السبب',
    count: 'العدد',
    totalPaid: 'الإجمالي المسدّد',
    branchId: 'الفرع',
  }

  const reasonLabels = {
    invalid_credentials: 'بيانات الدخول غير صحيحة',
    wrong_password: 'كلمة مرور خاطئة',
  }

  function actionBadgeClass(action) {
    if (action === 'login_failed' || action === 'game_deleted' || action === 'invoice_marked_unpaid') {
      return 'bg-red-500/15 text-red-400 border border-red-500/30'
    }
    if (action === 'login_success' || action === 'game_created' || action === 'payment_recorded' || action === 'invoices_paid_all' || action === 'settings_created') {
      return 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
    }
    return 'bg-gray-700/60 text-gray-300 border border-gray-600/50'
  }

  function formatDiffValue(key, value) {
    if (value === null || value === undefined || value === '') return '—'
    if (key === 'status') return statusLabels[value] || String(value)
    if (key === 'reason') return reasonLabels[value] || String(value)
    if (typeof value === 'boolean') return value ? 'نعم' : 'لا'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  function renderDiff(log) {
    let oldObj = null
    let newObj = null
    try { oldObj = log.old_value ? JSON.parse(log.old_value) : null } catch { oldObj = null }
    try { newObj = log.new_value ? JSON.parse(log.new_value) : null } catch { newObj = null }
    if (!oldObj && !newObj) return null
    const keys = Array.from(new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]))
    const entries = keys.filter(k => {
      const hasOld = oldObj && Object.prototype.hasOwnProperty.call(oldObj, k)
      const hasNew = newObj && Object.prototype.hasOwnProperty.call(newObj, k)
      if (hasOld && hasNew) return JSON.stringify(oldObj[k]) !== JSON.stringify(newObj[k])
      return true
    })
    if (!entries.length) return null
    return (
      <div className="flex flex-wrap gap-1.5">
        {entries.map(k => {
          const hasOld = oldObj && Object.prototype.hasOwnProperty.call(oldObj, k)
          return (
            <span key={k} className="inline-flex items-center gap-1.5 text-[11px] bg-gray-950/60 border border-white/5 rounded-lg px-2 py-1">
              <span className="font-semibold text-gray-300">{diffLabels[k] || k}:</span>
              {hasOld && (
                <>
                  <span className="text-red-400/80 line-through decoration-red-400/40">{formatDiffValue(k, oldObj[k])}</span>
                  <svg className="w-3 h-3 text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                </>
              )}
              <span className="text-teal-400">{formatDiffValue(k, (newObj || {})[k])}</span>
            </span>
          )
        })}
      </div>
    )
  }

  async function load() {
    setLoading(true)
    try {
      const params = { page, limit: 20 }
      if (filter.action) params.action = filter.action
      if (filter.entity_type) params.entity_type = filter.entity_type
      if (filter.branchId) params.branchId = filter.branchId
      const { data } = await api.get('/audit-logs', { params })
      setLogs(data?.logs || [])
      setTotal(data?.total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, filter])

  useEffect(() => {
    let mounted = true
    Promise.all([
      api.get('/branches'),
      api.get('/auth/me').catch(() => ({ data: {} })),
    ])
      .then(([branchesRes, meRes]) => {
        if (!mounted) return
        const rows = Array.isArray(branchesRes.data) ? branchesRes.data : (branchesRes.data?.branches || [])
        setBranches(rows)
        setMe(meRes.data?.user || null)
      })
      .catch(e => console.error(e))
    return () => { mounted = false }
  }, [])

  function updateFilter(patch) {
    setFilter(prev => ({ ...prev, ...patch }))
    setPage(1)
  }

  return (
    <div className="p-3 min-[400px]:p-4 sm:p-6 lg:p-8 space-y-6 tab-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-900/40 p-4 sm:p-6 rounded-2xl border border-white/5 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-900/30 shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-white">سجل النشاط</h2>
            <p className="text-gray-400 mt-1 text-xs sm:text-sm">تتبّع كل العمليات التي تمت على النظام والفروع</p>
          </div>
        </div>
        <span className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-bold text-teal-400 bg-teal-500/15 border border-teal-500/30 rounded-xl px-4 py-2.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
          </svg>
          <span>{total}</span>
        </span>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-4">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <select
            value={filter.action}
            onChange={e => updateFilter({ action: e.target.value })}
            className={auditSelectCls}
            aria-label="تصفية حسب العملية"
          >
            <option value="">جميع العمليات</option>
            {Object.entries(actionLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={filter.entity_type}
            onChange={e => updateFilter({ entity_type: e.target.value })}
            className={auditSelectCls}
            aria-label="تصفية حسب الكيان"
          >
            <option value="">جميع الكيانات</option>
            {Object.entries(entityLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          {isSuperAdmin && (
            <select
              value={filter.branchId}
              onChange={e => updateFilter({ branchId: e.target.value })}
              className={auditSelectCls}
              aria-label="تصفية حسب الفرع"
            >
              <option value="">كل الفروع</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Logs */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-14 rounded-2xl"></div>)}
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state bg-gray-900/40 rounded-2xl border border-white/5 backdrop-blur-md">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-30 text-teal-400" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="empty-state-title">لا يوجد نشاط</p>
          <p className="empty-state-description">لم يتم تسجيل أي عمليات بعد</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-white text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-gray-400">
                    <th className="text-right font-semibold py-4 px-4">المستخدم</th>
                    <th className="text-right font-semibold py-4 px-4">العملية</th>
                    <th className="text-right font-semibold py-4 px-4">الكيان</th>
                    <th className="text-right font-semibold py-4 px-4">الفرع</th>
                    <th className="text-right font-semibold py-4 px-4">التفاصيل</th>
                    <th className="text-right font-semibold py-4 px-4">الوقت</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={log.id ?? i} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors align-top">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow">
                            {(log.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-white truncate">{log.username || 'system'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${actionBadgeClass(log.action)}`}>
                          {actionLabels[log.action] || log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300 whitespace-nowrap">
                        {log.entity_type ? (
                          <>
                            {entityLabels[log.entity_type] || log.entity_type}
                            {log.entity_id != null && <span className="text-gray-500"> #{log.entity_id}</span>}
                          </>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {log.branch_name && (
                          <span className="badge bg-gray-700/50 text-gray-300 border border-gray-600/40 whitespace-nowrap">
                            {log.branch_name || 'الفرع الرئيسي'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 min-w-[220px]">{renderDiff(log)}</td>
                      <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">
                        {log.created_at ? new Date(log.created_at).toLocaleString('ar-LY') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {logs.map((log, i) => (
              <div key={log.id ?? i} className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-4 shadow-xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold shrink-0 shadow">
                      {(log.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-bold truncate">{log.username || 'system'}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`badge ${actionBadgeClass(log.action)}`}>
                          {actionLabels[log.action] || log.action}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-500 whitespace-nowrap shrink-0">
                    {log.created_at ? new Date(log.created_at).toLocaleString('ar-LY') : '—'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {log.entity_type && (
                    <span className="inline-flex items-center gap-1 text-gray-300 bg-white/5 border border-white/5 rounded-lg px-2.5 py-1.5">
                      {entityLabels[log.entity_type] || log.entity_type}
                      {log.entity_id != null && <span className="text-gray-500">#{log.entity_id}</span>}
                    </span>
                  )}
                  {log.branch_name && (
                    <span className="badge bg-gray-700/50 text-gray-300 border border-gray-600/40">
                      {log.branch_name || 'الفرع الرئيسي'}
                    </span>
                  )}
                </div>

                {renderDiff(log) && (
                  <div className="pt-3 border-t border-white/5">{renderDiff(log)}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-secondary btn-sm"
          >
            السابق
          </button>
          <span className="text-gray-400 text-sm">صفحة {page} من {Math.ceil(total / 20)}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * 20 >= total}
            className="btn btn-secondary btn-sm"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  )
}



