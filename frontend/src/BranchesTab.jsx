import React, { useState, useEffect } from 'react';
import { api } from './api';
import Loader from './Loader';

const BranchesTab = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });

  const loadBranches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/branches');
      setBranches(Array.isArray(res.data) ? res.data : (res.data?.branches || []));
    } catch (err) {
      console.error('Failed to load branches:', err);
      alert('تعذر تحميل الفروع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
    api.get('/auth/me')
      .then(r => {
        const u = r.data?.user || null;
        setCanEdit(!!u && u.role === 'admin' && Number(u.branch_id) === 1);
      })
      .catch(() => setCanEdit(false));
  }, []);

  const cancelForm = () => {
    setEditingId(null);
    setForm({ name: '', phone: '', address: '' });
  };

  const toggleForm = () => {
    if (showForm) cancelForm();
    setShowForm(!showForm);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('يرجى إدخال اسم الفرع');
      return;
    }
    try {
      if (editingId) {
        await api.put(`/branches/${editingId}`, {
          name: form.name,
          phone: form.phone,
          address: form.address,
          is_active: branches.find(b => b.id === editingId)?.is_active ? 1 : 0
        });
      } else {
        await api.post('/branches', {
          name: form.name,
          phone: form.phone,
          address: form.address
        });
      }
      loadBranches();
      cancelForm();
      setShowForm(false);
    } catch (err) {
      alert('فشل حفظ الفرع');
    }
  };

  const startEdit = (b) => {
    setEditingId(b.id);
    setForm({ name: b.name, phone: b.phone || '', address: b.address || '' });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleStatus = async (id) => {
    try {
      const b = branches.find(x => x.id === id);
      await api.put(`/branches/${id}`, {
        name: b.name,
        phone: b.phone,
        address: b.address,
        is_active: b.is_active ? 0 : 1
      });
      loadBranches();
    } catch (err) {
      alert('فشل تحديث الحالة');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader variant="dots" size="lg" />
        <p className="text-gray-400 font-bold animate-pulse">جارٍ تحميل الفروع...</p>
      </div>
    );
  }

  return (
    <div className="p-3 min-[400px]:p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-900/40 p-4 sm:p-6 rounded-2xl border border-white/5 backdrop-blur-md shadow-xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-purple-500 text-3xl">إدارة الفروع</span>
          </h2>
          <p className="text-gray-400 mt-1 text-xs sm:text-sm">إضافة وتعديل بيانات فروع المتجر وتعيين المستخدمين لها</p>
        </div>
        {canEdit && (
          <button
            onClick={toggleForm}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-purple-900/40 border border-white/10 active:scale-95 cursor-pointer"
          >
            {showForm ? '✕ إغلاق النموذج' : '+ إضافة فرع جديد'}
          </button>
        )}
      </div>

      {/* ── Create / Edit Form ── */}
      {showForm && canEdit && (
        <form onSubmit={save} className="bg-gray-900/60 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 sm:p-6 lg:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
            {editingId ? 'تعديل فرع' : 'إضافة فرع جديد'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-xs sm:text-sm mb-1.5 font-medium">اسم الفرع</label>
              <input
                type="text"
                placeholder="مثال: فرع وسط المدينة"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-950 border border-gray-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-xs sm:text-sm mb-1.5 font-medium">رقم الهاتف</label>
              <input
                type="tel"
                dir="ltr"
                placeholder="092..." 
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-gray-950 border border-gray-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all text-left"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-xs sm:text-sm mb-1.5 font-medium">العنوان</label>
            <textarea
              rows={3}
              placeholder="العنوان الكامل للفرع"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className="w-full bg-gray-950 border border-gray-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/40 transition-all active:scale-95 cursor-pointer"
            >
              {editingId ? 'تحديث الفرع' : 'تأكيد وحفظ الفرع'}
            </button>
            <button
              type="button"
              onClick={() => { cancelForm(); setShowForm(false); }}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* ── Branches List ── */}
      {branches.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/40 rounded-2xl border border-white/5 backdrop-blur-md">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" /></svg>
          <p className="text-gray-400 font-bold">لم يتم إنشاء أي فروع بعد</p>
          {canEdit && (
            <button onClick={() => { setShowForm(true); }} className="mt-4 text-purple-400 hover:underline cursor-pointer">أنشئ أول فرع الآن</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {branches.map(b => (
            <div key={b.id} className="group bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden flex flex-col hover:border-purple-500/30 transition-all duration-300 shadow-xl relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors pointer-events-none"></div>

              {/* Card Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-gray-800/40 to-transparent border-b border-white/5">
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  {!!b.is_main && (
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                      رئيسي
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${!!b.is_active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-700 text-gray-400'}`}>
                    {!!b.is_active ? 'نشط' : 'معطل'}
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-400 transition-colors truncate">{b.name}</h4>
              </div>

              {/* Info */}
              <div className="p-4 sm:p-5 flex-1 space-y-3">
                {b.address && (
                  <div className="flex items-start gap-2 text-gray-400 text-sm">
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                    <span className="leading-relaxed break-words">{b.address}</span>
                  </div>
                )}
                {b.phone && (
                  <a href={'tel:' + b.phone} className="flex items-center gap-2 text-gray-400 text-sm hover:text-[var(--brand)] transition-colors cursor-pointer group/phone">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                    <span dir="ltr">{b.phone}</span>
                  </a>
                )}
              </div>

              {/* Actions */}
              {canEdit && (
                <div className="p-4 sm:p-5 pt-0 flex gap-2">
                  <button
                    onClick={() => startEdit(b)}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-purple-600 hover:text-white rounded-xl text-sm font-bold transition-all border border-white/5 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => toggleStatus(b.id)}
                    className={`px-4 py-2.5 rounded-xl transition-all border border-white/5 cursor-pointer ${!!b.is_active ? 'bg-green-600/10 text-green-500 hover:bg-green-600 hover:text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    title={b.is_active ? 'تعطيل' : 'تفعيل'}
                  >
                    {b.is_active ? '◎' : '◉'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BranchesTab;