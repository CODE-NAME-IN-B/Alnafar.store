import React, { useEffect, useState } from 'react'
import { api } from './api'

export default function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', role: 'staff' })
  const [editing, setEditing] = useState(null)
  const [pwModal, setPwModal] = useState({ open: false, id: null, username: '', password: '' })

  async function load() {
    try {
      setLoading(true)
      const { data } = await api.get('/users')
      setUsers(data.users || [])
    } catch (e) {
      console.error(e)
      alert('تعذر تحميل المستخدمين')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function createUser(e) {
    e.preventDefault()
    if (!form.username.trim() || !form.password.trim()) return
    try {
      setCreating(true)
      await api.post('/users', form)
      setForm({ username: '', password: '', role: 'staff' })
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
      await api.put(`/users/${editing.id}`, { username: editing.username, role: editing.role })
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
      setPwModal({ open: false, id: null, username: '', password: '' })
      alert('تم تحديث كلمة المرور')
    } catch (e) {
      alert(e?.response?.data?.message || 'فشل تحديث كلمة المرور')
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">جاري تحميل المستخدمين...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">إدارة الإدمن والمستخدمين</h2>
        <p className="text-gray-400">إنشاء مستخدمين جدد وتعديل الأدوار وكلمات المرور</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* إنشاء مستخدم */}
        <form onSubmit={createUser} className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 shadow-2xl space-y-6">
          <div className="flex items-center mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
              <span className="text-2xl">➕</span>
            </div>
            <h3 className="text-2xl font-bold text-white">إضافة مستخدم جديد</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">اسم المستخدم</label>
              <input className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">كلمة المرور</label>
              <input type="password" className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required minLength={6} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">الدور</label>
              <select className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
                <option value="staff">موظف</option>
                <option value="admin">مدير</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button disabled={creating} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300">
              {creating ? 'جاري الإنشاء...' : 'إنشاء'}
            </button>
          </div>
        </form>

        {/* تعديل مستخدم */}
        <form onSubmit={updateUser} className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 shadow-2xl space-y-6">
          <div className="flex items-center mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
              <span className="text-2xl">✏️</span>
            </div>
            <h3 className="text-2xl font-bold text-white">تعديل مستخدم</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">اختر مستخدم</label>
              <select className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white" value={editing?.id || ''} onChange={(e)=>{
                const id = Number(e.target.value)
                const u = users.find(x=>x.id===id)
                setEditing(u ? { ...u } : null)
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
                  <label className="block text-sm font-semibold text-gray-300 mb-2">اسم المستخدم</label>
                  <input className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white" value={editing.username} onChange={e=>setEditing({...editing, username:e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">الدور</label>
                  <select className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white" value={editing.role} onChange={e=>setEditing({...editing, role:e.target.value})}>
                    <option value="staff">موظف</option>
                    <option value="admin">مدير</option>
                  </select>
                </div>
                <div className="col-span-1 md:col-span-2 flex flex-wrap gap-3">
                  <button disabled={updating} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl">{updating?'جاري التحديث...':'تحديث'}</button>
                  <button type="button" onClick={()=>setPwModal({ open: true, id: editing.id, username: editing.username, password: '' })} className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl">تغيير كلمة المرور</button>
                  <button type="button" onClick={()=>deleteUser(editing.id)} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl">حذف</button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>

      {/* قائمة المستخدمين */}
      <div className="mt-8 bg-gray-800 p-6 rounded-2xl border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">المستخدمون ({users.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-white text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-right py-3 px-4">المعرف</th>
                <th className="text-right py-3 px-4">اسم المستخدم</th>
                <th className="text-right py-3 px-4">الدور</th>
                <th className="text-right py-3 px-4">تاريخ الإضافة</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-800">
                  <td className="py-3 px-4">{u.id}</td>
                  <td className="py-3 px-4">{u.username}</td>
                  <td className="py-3 px-4">{u.role}</td>
                  <td className="py-3 px-4">{u.created_at ? new Date(u.created_at).toLocaleString('ar-LY') : '—'}</td>
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
                <label className="block text-sm font-semibold text-gray-300 mb-2">كلمة المرور الجديدة</label>
                <input type="password" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white" value={pwModal.password} onChange={e=>setPwModal({...pwModal, password:e.target.value})} minLength={6} required />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={()=>setPwModal({ open:false, id:null, username:'', password:'' })} className="px-5 py-2.5 border border-gray-600 text-gray-300 rounded-lg">إلغاء</button>
                <button className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg">تحديث</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
