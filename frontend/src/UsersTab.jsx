import React, { useEffect, useState } from 'react'
import { api } from './api'
import Loader from './Loader'

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

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader />
        <p className="text-gray-400">جاري تحميل المستخدمين...</p>
      </div>
    )
  }

  return (
    <div className="p-3 min-[400px]:p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">إدارة الإدمن والمستخدمين</h2>
        <p className="text-gray-400 text-sm">إنشاء مستخدمين جدد وتعديل الأدوار وكلمات المرور</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* إنشاء مستخدم */}
        <form onSubmit={createUser} className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 sm:p-6 lg:p-8 rounded-2xl border border-gray-700 shadow-2xl space-y-4 sm:space-y-6">
          <div className="flex items-center mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-3 sm:mr-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">إضافة مستخدم جديد</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">اسم المستخدم</label>
              <input className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} required />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">كلمة المرور</label>
              <input type="password" className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required minLength={6} />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">الدور</label>
              <select className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
                <option value="staff">موظف</option>
                <option value="admin">مدير</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">الفرع</label>
              <select className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base" value={form.branch_id ?? ''} onChange={e=>setForm({...form, branch_id: Number(e.target.value)})}>
                {branches.length === 0 && <option value="">—</option>}
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button disabled={creating} className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 text-sm sm:text-base min-h-[44px]">
              {creating ? 'جاري الإنشاء...' : 'إنشاء'}
            </button>
          </div>
        </form>

        {/* تعديل مستخدم */}
        <form onSubmit={updateUser} className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 sm:p-6 lg:p-8 rounded-2xl border border-gray-700 shadow-2xl space-y-4 sm:space-y-6">
          <div className="flex items-center mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 sm:mr-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">تعديل مستخدم</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">اختر مستخدم</label>
              <select className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base" value={editing?.id || ''} onChange={(e)=>{
                const id = Number(e.target.value)
                const u = users.find(x=>x.id===id)
                setEditing(u ? { ...u, branch_id: u.branch_id ?? branches[0]?.id } : null)
              }}>
                <option value="">—</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                ))}
              </select>
            </div>
            {editing && (
              <>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">اسم المستخدم</label>
                  <input className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base" value={editing.username} onChange={e=>setEditing({...editing, username:e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">الدور</label>
                  <select className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base" value={editing.role} onChange={e=>setEditing({...editing, role:e.target.value})}>
                    <option value="staff">موظف</option>
                    <option value="admin">مدير</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">الفرع</label>
                  <select className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base" value={editing.branch_id ?? ''} onChange={e=>setEditing({...editing, branch_id: Number(e.target.value)})}>
                    {branches.length === 0 && <option value="">—</option>}
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1 sm:col-span-2 flex flex-wrap gap-2 sm:gap-3">
                  <button disabled={updating} className="px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl min-h-[44px] text-sm sm:text-base">{updating?'جاري التحديث...':'تحديث'}</button>
                  <button type="button" onClick={()=>openPwModal(editing)} className="px-4 sm:px-6 py-2.5 sm:py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl min-h-[44px] text-sm sm:text-base">تغيير كلمة المرور</button>
                  <button type="button" onClick={()=>deleteUser(editing.id)} className="px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl min-h-[44px] text-sm sm:text-base">حذف</button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>

      {/* قائمة المستخدمين */}
      <div className="mt-6 sm:mt-8 bg-gray-800 p-4 sm:p-6 rounded-2xl border border-gray-700">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-4">المستخدمون ({users.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-white text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-right py-3 px-2 sm:px-4">المعرف</th>
                <th className="text-right py-3 px-2 sm:px-4">اسم المستخدم</th>
                <th className="text-right py-3 px-2 sm:px-4">الدور</th>
                <th className="text-right py-3 px-2 sm:px-4">الفرع</th>
                <th className="text-right py-3 px-2 sm:px-4 hidden sm:table-cell">تاريخ الإضافة</th>
                <th className="text-right py-3 px-2 sm:px-4">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-800">
                  <td className="py-3 px-2 sm:px-4">{u.id}</td>
                  <td className="py-3 px-2 sm:px-4">{u.username}</td>
                  <td className="py-3 px-2 sm:px-4">{u.role}</td>
                  <td className="py-3 px-2 sm:px-4">
                    {isSuperAdmin ? (
                      <select
                        value={u.branch_id ?? ''}
                        disabled={movingId === u.id}
                        onChange={e => changeUserBranch(u.id, e.target.value)}
                        title="نقل المستخدم إلى فرع آخر"
                        className="bg-gray-700 border border-gray-600 hover:border-purple-500 focus:border-purple-500 rounded-lg px-2 py-1.5 text-white text-xs sm:text-sm cursor-pointer outline-none transition-colors disabled:opacity-50 disabled:cursor-wait"
                      >
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span>{u.branch_name || '—'}</span>
                    )}
                  </td>
                  <td className="py-3 px-2 sm:px-4 hidden sm:table-cell">{u.created_at ? new Date(u.created_at).toLocaleString('ar-LY') : '—'}</td>
                  <td className="py-3 px-2 sm:px-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => { setEditing({ ...u, branch_id: u.branch_id ?? branches[0]?.id }); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                        disabled={!canManage(u)}
                        title="تعديل"
                        className="p-2 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => openPwModal(u)}
                        disabled={!canManage(u)}
                        title="تغيير / إظهار كلمة المرور"
                        className="p-2 rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteUser(u.id)}
                        disabled={!canManage(u) || String(u.id) === String(me?.id)}
                        title="حذف"
                        className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة تغيير كلمة المرور */}
      {pwModal.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 w-full max-w-md rounded-xl shadow-2xl border border-gray-700">
            <div className="p-5 border-b border-gray-700 flex items-center justify-between">
              <h4 className="text-lg font-bold text-white">تغيير كلمة المرور — {pwModal.username}</h4>
              <button onClick={()=>setPwModal({ open:false, id:null, username:'', password:'' })} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>
            <form onSubmit={changePassword} className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-300">كلمة المرور الجديدة</label>
                  <button type="button" onClick={generatePassword} className="text-xs px-3 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors">توليد</button>
                </div>
                <input type="text" dir="ltr" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white font-mono" value={pwModal.password} onChange={e=>setPwModal({...pwModal, password:e.target.value})} placeholder="اكتب أو ولّد كلمة مرور" minLength={6} required />
                <p className="text-gray-500 text-xs mt-2">بعد الحفظ ستظهر كلمة المرور مرة واحدة لتتمكن من نسخها ومشاركتها مع المستخدم.</p>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={()=>setPwModal({ open:false, id:null, username:'', password:'' })} className="px-5 py-2.5 border border-gray-600 text-gray-300 rounded-lg">إلغاء</button>
                <button className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة إظهار كلمة المرور بعد الحفظ */}
      {pwResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 w-full max-w-md rounded-xl shadow-2xl border border-gray-700">
            <div className="p-5 border-b border-gray-700 flex items-center justify-between">
              <h4 className="text-lg font-bold text-white">كلمة مرور {pwResult.username}</h4>
              <button onClick={()=>setPwResult(null)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-800 border border-emerald-600/40 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                <span dir="ltr" className="font-mono text-emerald-400 text-lg break-all">{pwResult.password}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(pwResult.password)}
                  className="shrink-0 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg text-xs transition-colors"
                >نسخ</button>
              </div>
              <p className="text-amber-400/90 text-xs">ملاحظة: لا يمكن استرجاع كلمة المرور لاحقاً لأسباب أمنية (تُخزَّن مشفّرة). احفظها الآن أو أعد توليدها عند الحاجة.</p>
              <div className="flex justify-end">
                <button type="button" onClick={()=>setPwResult(null)} className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">تم</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
