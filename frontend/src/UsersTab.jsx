import React, { useEffect, useState } from 'react'
import { api } from './api'
import Loader from './Loader'

const inputCls = "w-full bg-gray-950 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all"

const iconBtnBase = "p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"

function EditIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
    </svg>
  )
}

function KeyIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  )
}

function TrashIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  )
}

function CloseIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function BranchIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  )
}

export default function UsersTab() {
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [me, setMe] = useState(null)
  const [movingId, setMovingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', role: 'staff' })
  const [editing, setEditing] = useState(null)
  const [pwModal, setPwModal] = useState({ open: false, id: null, username: '', password: '' })
  const [pwResult, setPwResult] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  const isSuperAdmin = !!me && me.role === 'admin' && Number(me.branch_id || 1) === 1

  function canManage(u) {
    if (String(u.id) === String(me?.id)) return true
    if (isSuperAdmin) return true
    if ((Number(u.branch_id) || 1) !== (Number(me?.branch_id) || 1)) return false
    return u.role !== 'admin'
  }

  function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    const arr = new Uint32Array(10)
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(arr)
    else for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 1e9)
    let p = ''
    for (let i = 0; i < arr.length; i++) p += chars[arr[i] % chars.length]
    setPwModal(prev => ({ ...prev, password: p }))
  }

  async function load() {
    try {
      setLoading(true)
      const [usersRes, branchesRes, meRes] = await Promise.all([
        api.get('/users'),
        api.get('/branches'),
        api.get('/auth/me')
      ])
      const ud = usersRes.data
      setUsers(Array.isArray(ud) ? ud : (ud.users || []))
      const rows = Array.isArray(branchesRes.data) ? branchesRes.data : (branchesRes.data?.branches || [])
      setBranches(rows)
      setMe(meRes.data?.user || null)
      setForm(prev => prev.branch_id == null && rows.length ? { ...prev, branch_id: rows[0].id } : prev)
    } catch (e) {
      console.error(e)
      alert('تعذر تحميل المستخدمين')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function changeUserBranch(userId, branchId) {
    try {
      setMovingId(userId)
      await api.put(`/users/${userId}`, { branch_id: Number(branchId) })
      await load()
    } catch (e) {
      alert(e?.response?.data?.message || 'فشل نقل المستخدم إلى الفرع')
    } finally {
      setMovingId(null)
    }
  }

  async function createUser(e) {
    e.preventDefault()
    if (!form.username.trim() || !form.password.trim()) return
    try {
      setCreating(true)
      const payload = { username: form.username, password: form.password, role: form.role }
      if (form.branch_id != null) payload.branch_id = Number(form.branch_id)
      await api.post('/users', payload)
      setForm({ username: '', password: '', role: 'staff', branch_id: branches[0]?.id })
      await load()
    } catch (e) {
      alert(e?.response?.data?.message || 'فشل إنشاء المستخدم')
    } finally { setCreating(false) }
  }

  async function updateUser(e) {
    e.preventDefault()
    if (!editing) return
    try {
      setUpdating(true)
      const payload = { username: editing.username, role: editing.role }
      if (editing.branch_id != null) payload.branch_id = Number(editing.branch_id)
      await api.put(`/users/${editing.id}`, payload)
      setEditing(null)
      await load()
    } catch (e) {
      alert(e?.response?.data?.message || 'فشل تحديث المستخدم')
    } finally { setUpdating(false) }
  }

  async function deleteUser(id) {
    if (!confirm('هل تريد حذف هذا المستخدم؟')) return
    try {
      await api.delete(`/users/${id}`)
      await load()
    } catch (e) {
      alert(e?.response?.data?.message || 'فشل حذف المستخدم')
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    if (!pwModal.password || pwModal.password.length < 6) {
      alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    try {
      await api.put(`/users/${pwModal.id}/password`, { password: pwModal.password })
      setPwResult({ username: pwModal.username, password: pwModal.password })
      setPwModal({ open: false, id: null, username: '', password: '' })
    } catch (e) {
      alert(e?.response?.data?.message || 'فشل تحديث كلمة المرور')
    }
  }

  function openPwModal(u) {
    setPwModal({ open: true, id: u.id, username: u.username, password: '' })
  }

  function roleBadge(role) {
    if (role === 'admin') {
      return <span className="badge bg-teal-500/15 text-teal-400 border border-teal-500/30">مدير</span>
    }
    return <span className="badge bg-gray-700/60 text-gray-300 border border-gray-600/50">موظف</span>
  }

  function renderBranch(u) {
    if (isSuperAdmin) {
      return (
        <select
          value={u.branch_id ?? ''}
          disabled={movingId === u.id}
          onChange={e => changeUserBranch(u.id, e.target.value)}
          title="نقل المستخدم إلى فرع آخر"
          className="w-full bg-gray-950 border border-gray-700/50 hover:border-teal-500/60 focus:border-teal-500 rounded-lg px-2.5 py-2 text-white text-xs sm:text-sm cursor-pointer outline-none focus:ring-2 focus:ring-teal-500/40 transition-colors disabled:opacity-50 disabled:cursor-wait min-h-[44px]"
        >
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-gray-300 text-xs sm:text-sm bg-white/5 border border-white/5 rounded-lg px-2.5 py-1.5">
        <BranchIcon className="w-4 h-4 text-gray-400" />
        {u.branch_name || '—'}
      </span>
    )
  }

  function renderActions(u, fullWidth) {
    const manage = canManage(u)
    const isSelf = String(u.id) === String(me?.id)
    return (
      <div className={fullWidth ? 'grid grid-cols-3 gap-2' : 'flex items-center gap-1.5'}>
        <button
          type="button"
          onClick={() => setEditing({ ...u, branch_id: u.branch_id ?? branches[0]?.id })}
          disabled={!manage}
          title="تعديل"
          className={`${iconBtnBase} ${fullWidth ? 'flex items-center justify-center gap-1.5 py-2.5 bg-teal-500/15 text-teal-400 hover:bg-teal-500 hover:text-white focus:ring-teal-500/50 text-xs font-bold' : 'bg-teal-500/15 text-teal-400 hover:bg-teal-500 hover:text-white focus:ring-teal-500/50'}`}
        >
          <EditIcon className={fullWidth ? 'w-5 h-5' : 'w-4 h-4'} />
          {fullWidth && <span>تعديل</span>}
        </button>
        <button
          type="button"
          onClick={() => openPwModal(u)}
          disabled={!manage}
          title="تغيير / إظهار كلمة المرور"
          className={`${iconBtnBase} ${fullWidth ? 'flex items-center justify-center gap-1.5 py-2.5 bg-amber-500/15 text-amber-400 hover:bg-amber-500 hover:text-white focus:ring-amber-500/50 text-xs font-bold' : 'bg-amber-500/15 text-amber-400 hover:bg-amber-500 hover:text-white focus:ring-amber-500/50'}`}
        >
          <KeyIcon className={fullWidth ? 'w-5 h-5' : 'w-4 h-4'} />
          {fullWidth && <span>كلمة المرور</span>}
        </button>
        <button
          type="button"
          onClick={() => deleteUser(u.id)}
          disabled={!manage || isSelf}
          title="حذف"
          className={`${iconBtnBase} ${fullWidth ? 'flex items-center justify-center gap-1.5 py-2.5 bg-red-500/15 text-red-400 hover:bg-red-600 hover:text-white focus:ring-red-500/50 text-xs font-bold' : 'bg-red-500/15 text-red-400 hover:bg-red-600 hover:text-white focus:ring-red-500/50'}`}
        >
          <TrashIcon className={fullWidth ? 'w-5 h-5' : 'w-4 h-4'} />
          {fullWidth && <span>حذف</span>}
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader variant="dots" size="lg" />
        <p className="text-gray-400 font-bold animate-pulse">جارٍ تحميل المستخدمين...</p>
      </div>
    )
  }

  return (
    <div className="p-3 min-[400px]:p-4 sm:p-6 lg:p-8 space-y-6 tab-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-900/40 p-4 sm:p-6 rounded-2xl border border-white/5 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-900/30 shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-white">إدارة الإدمن والمستخدمين</h2>
            <p className="text-gray-400 mt-1 text-xs sm:text-sm">إنشاء مستخدمين جدد وتعديل الأدوار وكلمات المرور</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(v => !v)}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-l from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30 border border-white/10 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50 min-h-[44px]"
        >
          {showCreate ? (
            <>
              <CloseIcon className="w-5 h-5" />
              <span>إغلاق النموذج</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              <span>إضافة مستخدم</span>
            </>
          )}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={createUser} className="bg-gray-900/60 backdrop-blur-xl border border-teal-500/30 rounded-2xl p-4 sm:p-6 lg:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            إضافة مستخدم جديد
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-xs sm:text-sm mb-1.5 font-medium">اسم المستخدم</label>
              <input className={inputCls} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required placeholder="اسم الدخول" />
            </div>
            <div>
              <label className="block text-gray-300 text-xs sm:text-sm mb-1.5 font-medium">كلمة المرور</label>
              <input type="password" className={inputCls} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} placeholder="6 أحرف على الأقل" />
            </div>
            <div>
              <label className="block text-gray-300 text-xs sm:text-sm mb-1.5 font-medium">الدور</label>
              {isSuperAdmin ? (
                <select className={inputCls + ' cursor-pointer'} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="staff">موظف</option>
                  <option value="admin">مدير</option>
                </select>
              ) : (
                <div className={inputCls + ' flex items-center text-gray-300'}>موظف</div>
              )}
            </div>
            <div>
              <label className="block text-gray-300 text-xs sm:text-sm mb-1.5 font-medium">الفرع</label>
              {isSuperAdmin ? (
                <select className={inputCls + ' cursor-pointer'} value={form.branch_id ?? ''} onChange={e => setForm({ ...form, branch_id: Number(e.target.value) })}>
                  {branches.length === 0 && <option value="">—</option>}
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              ) : (
                <div className={inputCls + ' flex items-center gap-1.5 text-gray-300'}>
                  <BranchIcon className="w-4 h-4 text-gray-400" />
                  {me?.branch_name || 'فرعك'}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={creating}
              className="flex-1 py-3 bg-gradient-to-l from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-teal-900/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50 min-h-[44px]"
            >
              {creating ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 min-h-[44px]"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* Users list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
            المستخدمون
            <span className="text-xs font-bold text-teal-400 bg-teal-500/15 border border-teal-500/30 rounded-full px-2.5 py-0.5">{users.length}</span>
          </h3>
        </div>

        {users.length === 0 ? (
          <div className="empty-state bg-gray-900/40 rounded-2xl border border-white/5 backdrop-blur-md">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-30 text-teal-400" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <p className="empty-state-title">لا يوجد مستخدمون بعد</p>
            <p className="empty-state-description">ابدأ بإضافة أول مستخدم للبدء في إدارة الفروع والصلاحيات.</p>
            <button onClick={() => setShowCreate(true)} className="mt-4 text-teal-400 hover:text-teal-300 hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50 rounded">
              إضافة أول مستخدم
            </button>
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
                      <th className="text-right font-semibold py-4 px-4">الدور</th>
                      <th className="text-right font-semibold py-4 px-4">الفرع</th>
                      <th className="text-right font-semibold py-4 px-4">تاريخ الإضافة</th>
                      <th className="text-center font-semibold py-4 px-4">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow">
                              {(u.username || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate flex items-center gap-2">
                                {u.username}
                                {String(u.id) === String(me?.id) && (
                                  <span className="badge bg-teal-500/15 text-teal-400 border border-teal-500/30">أنت</span>
                                )}
                              </p>
                              <p className="text-[11px] text-gray-500 font-mono">#{u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{roleBadge(u.role)}</td>
                        <td className="py-3 px-4 max-w-[220px]">{renderBranch(u)}</td>
                        <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">
                          {u.created_at ? new Date(u.created_at).toLocaleString('ar-LY', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center">{renderActions(u, false)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {users.map(u => (
                <div key={u.id} className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-4 shadow-xl space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold shrink-0 shadow">
                        {(u.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-bold truncate">{u.username}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {roleBadge(u.role)}
                          {String(u.id) === String(me?.id) && (
                            <span className="badge bg-teal-500/15 text-teal-400 border border-teal-500/30">أنت</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-500 font-mono shrink-0">#{u.id}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="flex-1 min-w-0">{renderBranch(u)}</div>
                    <span className="shrink-0">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('ar-LY', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-white/5">
                    {renderActions(u, true)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setEditing(null)}>
          <div className="bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-white/10 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-white">تعديل مستخدم</h4>
                <p className="text-xs text-gray-400">{editing.username}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                aria-label="إغلاق"
              >
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={updateUser} className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-gray-300 text-xs sm:text-sm mb-1.5 font-medium">اسم المستخدم</label>
                <input className={inputCls} value={editing.username} onChange={e => setEditing({ ...editing, username: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-xs sm:text-sm mb-1.5 font-medium">الدور</label>
                {isSuperAdmin ? (
                  <select className={inputCls + ' cursor-pointer'} value={editing.role} onChange={e => setEditing({ ...editing, role: e.target.value })}>
                    <option value="staff">موظف</option>
                    <option value="admin">مدير</option>
                  </select>
                ) : (
                  <div className={inputCls + ' flex items-center text-gray-300'}>موظف</div>
                )}
              </div>
              <div>
                <label className="block text-gray-300 text-xs sm:text-sm mb-1.5 font-medium">الفرع</label>
                {isSuperAdmin ? (
                  <select className={inputCls + ' cursor-pointer'} value={editing.branch_id ?? ''} onChange={e => setEditing({ ...editing, branch_id: Number(e.target.value) })}>
                    {branches.length === 0 && <option value="">—</option>}
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className={inputCls + ' flex items-center gap-1.5 text-gray-300'}>
                    <BranchIcon className="w-4 h-4 text-gray-400" />
                    {me?.branch_name || editing.branch_name || 'فرعك'}
                  </div>
                )}
              </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-white/10">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-3 bg-gradient-to-l from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-teal-900/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50 min-h-[44px]"
                >
                  {updating ? 'جاري التحديث...' : 'تحديث'}
                </button>
                <button
                  type="button"
                  onClick={() => openPwModal(editing)}
                  className="px-5 py-3 bg-amber-500/15 text-amber-400 hover:bg-amber-500 hover:text-white rounded-xl font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50 min-h-[44px]"
                >
                  تغيير كلمة المرور
                </button>
                <button
                  type="button"
                  onClick={() => deleteUser(editing.id)}
                  className="px-5 py-3 bg-red-500/15 text-red-400 hover:bg-red-600 hover:text-white rounded-xl font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/50 min-h-[44px]"
                >
                  حذف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password modal */}
      {pwModal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setPwModal({ open: false, id: null, username: '', password: '' })}>
          <div className="bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-white/10 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-white">تغيير كلمة المرور</h4>
                <p className="text-xs text-gray-400">{pwModal.username}</p>
              </div>
              <button
                type="button"
                onClick={() => setPwModal({ open: false, id: null, username: '', password: '' })}
                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                aria-label="إغلاق"
              >
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={changePassword} className="p-4 sm:p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-300">كلمة المرور الجديدة</label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-xs px-3 py-1.5 bg-teal-500/15 text-teal-400 hover:bg-teal-500 hover:text-white rounded-lg font-bold transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  >
                    توليد
                  </button>
                </div>
                <input
                  type="text"
                  dir="ltr"
                  className="w-full bg-gray-950 border border-gray-700/50 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                  value={pwModal.password}
                  onChange={e => setPwModal({ ...pwModal, password: e.target.value })}
                  placeholder="اكتب أو ولّد كلمة مرور"
                  minLength={6}
                  required
                />
                <p className="text-gray-500 text-xs mt-2">بعد الحفظ ستظهر كلمة المرور مرة واحدة لتتمكن من نسخها ومشاركتها مع المستخدم.</p>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPwModal({ open: false, id: null, username: '', password: '' })}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 min-h-[44px]"
                >
                  إلغاء
                </button>
                <button className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50 min-h-[44px]">
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password result modal */}
      {pwResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setPwResult(null)}>
          <div className="bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-white/10 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-white">كلمة المرور الجديدة</h4>
                <p className="text-xs text-gray-400">{pwResult.username}</p>
              </div>
              <button
                type="button"
                onClick={() => setPwResult(null)}
                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                aria-label="إغلاق"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              <div className="bg-gray-950 border border-emerald-600/40 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <span dir="ltr" className="font-mono text-emerald-400 text-lg break-all">{pwResult.password}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(pwResult.password)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
                  نسخ
                </button>
              </div>
              <p className="text-amber-400/90 text-xs leading-relaxed">ملاحظة: لا يمكن استرجاع كلمة المرور لاحقاً لأسباب أمنية (تُخزَّن مشفّرة). احفظها الآن أو أعد توليدها عند الحاجة.</p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setPwResult(null)}
                  className="px-5 py-2.5 bg-gradient-to-l from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-xl font-bold transition-all active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50 min-h-[44px]"
                >
                  تم
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
