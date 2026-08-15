import React, { useState, useEffect } from 'react';
import { api } from './api';

// ─── Full-screen Game Picker Modal ──────────────────────────────────────────
const GamePickerModal = ({ games, selectedIds, onToggle, onClose, categoryId }) => {
  const [search, setSearch] = useState('');

  const filtered = games.filter(g => {
    if (categoryId && g.category_id !== Number(categoryId)) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return (g.title || '').toLowerCase().includes(s)
        || (g.genre || '').toLowerCase().includes(s)
        || (g.series || '').toLowerCase().includes(s);
    }
    return true;
  });

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-gray-950"
      style={{ touchAction: 'none' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-gray-900 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
        >
          ✕
        </button>
        <div className="flex-1">
          <h3 className="text-white font-bold text-base">اختر الألعاب</h3>
          <p className="text-purple-400 text-xs font-medium">{selectedIds.length} مختارة</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-bold"
        >
          تأكيد
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-white/5 bg-gray-900 shrink-0">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، النوع أو السلسلة..."
            className="w-full bg-gray-800 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500/50"
            autoFocus
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">✕</button>
          )}
        </div>
      </div>

      {/* Game List — scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ touchAction: 'pan-y' }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <p className="text-sm">لا توجد نتائج مطابقة</p>
          </div>
        ) : (
          filtered.map(g => {
            const selected = selectedIds.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onToggle(g.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl text-right transition-all active:scale-[0.98] ${
                  selected
                    ? 'bg-purple-600/30 border border-purple-500/50'
                    : 'bg-white/5 border border-transparent'
                }`}
              >
                {/* Checkbox indicator */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  selected ? 'bg-purple-500 text-white' : 'bg-gray-700'
                }`}>
                  {selected && <span className="text-sm font-bold">✓</span>}
                </div>

                {/* Game image */}
                {g.image && (
                  <img
                    src={g.image}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                )}

                {/* Game info */}
                <div className="flex-1 min-w-0 text-right">
                  <p className={`font-bold truncate text-sm ${selected ? 'text-white' : 'text-gray-200'}`}>{g.title}</p>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {g.genre && <span className="text-[10px] bg-gray-700/80 text-gray-300 px-2 py-0.5 rounded-lg">{g.genre}</span>}
                    {g.series && <span className="text-[10px] bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-lg">{g.series}</span>}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

// ─── Main PackagesTab Component ──────────────────────────────────────────────
const PackagesTab = () => {
  const [packages, setPackages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showGamePicker, setShowGamePicker] = useState(false);
  const [form, setForm] = useState({
    name: '',
    price: '',
    category_id: '',
    game_ids: [],
    is_active: 1
  });
  const [editingId, setEditingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pkgsRes, catsRes, gamesRes] = await Promise.all([
        api.get('/packages'),
        api.get('/categories'),
        api.get('/games')
      ]);
      setPackages(pkgsRes.data?.packages || []);
      setCategories(Array.isArray(catsRes.data) ? catsRes.data : []);
      setGames(Array.isArray(gamesRes.data) ? gamesRes.data : []);
    } catch (err) {
      console.error('Failed to load packages data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const toggleGameId = (id) => {
    setForm(prev => {
      const ids = [...prev.game_ids];
      const idx = ids.indexOf(id);
      if (idx > -1) ids.splice(idx, 1);
      else ids.push(id);
      return { ...prev, game_ids: ids };
    });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category_id || form.game_ids.length === 0) {
      alert('يرجى إكمال جميع الحقول واختيار لعبة واحدة على الأقل');
      return;
    }
    try {
      if (editingId) {
        await api.put(`/packages/${editingId}`, form);
      } else {
        await api.post('/packages', form);
      }
      loadData();
      cancelEdit();
      setShowForm(false);
    } catch (err) {
      alert('فشل حفظ الباقة');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
    try {
      await api.delete(`/packages/${id}`);
      loadData();
    } catch (err) {
      alert('فشل الحذف');
    }
  };

  const toggleStatus = async (id) => {
    try {
      const pkg = packages.find(p => p.id === id);
      await api.put(`/packages/${id}`, { ...pkg, is_active: pkg.is_active ? 0 : 1 });
      loadData();
    } catch (err) {
      alert('فشل تحديث الحالة');
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      price: p.price,
      category_id: p.category_id,
      game_ids: p.game_ids
        ? String(p.game_ids).split(',').map(Number).filter(Boolean)
        : (p.packageGames || []).map(g => g.id),
      is_active: p.is_active
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', price: '', category_id: '', game_ids: [], is_active: 1 });
  };

  const selectedGamesInfo = games.filter(g => form.game_ids.includes(g.id));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-bold animate-pulse">جارٍ تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Game Picker Full-Screen Modal ── */}
      {showGamePicker && (
        <GamePickerModal
          games={games}
          selectedIds={form.game_ids}
          onToggle={toggleGameId}
          onClose={() => setShowGamePicker(false)}
          categoryId={form.category_id}
        />
      )}

      <div className="p-3 min-[400px]:p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-900/40 p-4 sm:p-6 rounded-2xl border border-white/5 backdrop-blur-md shadow-xl">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-purple-500 text-3xl">إدارة الباقات</span>
            </h2>
            <p className="text-gray-400 mt-1 text-xs sm:text-sm">تجميع الألعاب في باقات مخفضة للبيع السريع</p>
          </div>
          <button
            onClick={() => {
              if (showForm) { cancelEdit(); setShowForm(false); }
              else setShowForm(true);
            }}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-purple-900/40 border border-white/10 active:scale-95"
          >
            {showForm ? '✕ إغلاق النموذج' : '+ إنشاء باقة جديدة'}
          </button>
        </div>

        {/* ── Create / Edit Form ── */}
        {showForm && (
          <form onSubmit={save} className="bg-gray-900/60 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 sm:p-6 lg:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
              {editingId ? 'تعديل باقة' : 'إضافة باقة جديدة'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-xs sm:text-sm mb-1.5 font-medium">اسم الباقة</label>
                <input
                  type="text"
                  placeholder="مثال: باقة ألعاب الأكشن"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-xs sm:text-sm mb-1.5 font-medium">سعر الباقة</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="السعر الإجمالي د.ل"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700/50 rounded-xl px-4 py-3 text-white font-mono focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-xs sm:text-sm mb-1.5 font-medium">المنصة</label>
                <select
                  value={form.category_id}
                  onChange={e => setForm({ ...form, category_id: e.target.value, game_ids: [] })}
                  className="w-full bg-gray-950 border border-gray-700/50 rounded-xl px-4 py-3 text-white appearance-none focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                >
                  <option value="">-- اختر المنصة --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 text-gray-300 text-sm cursor-pointer bg-gray-950/50 px-4 py-3 rounded-xl border border-gray-700/50 w-full hover:bg-gray-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={!!form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })}
                    className="w-5 h-5 rounded accent-purple-500"
                  />
                  <span className="font-medium">باقة نشطة ومتاحة للبيع</span>
                </label>
              </div>
            </div>

            {/* ── Game Picker Trigger ── */}
            {form.category_id && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-gray-300 text-xs sm:text-sm font-bold">
                    الألعاب المختارة
                    <span className="text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded mr-2">
                      {form.game_ids.length} مختارة
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowGamePicker(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600 border border-purple-500/40 text-purple-300 hover:text-white rounded-xl text-sm font-bold transition-all active:scale-95"
                  >
                    <span>اختر الألعاب</span>
                    <span>اختيار الألعاب</span>
                  </button>
                </div>

                {/* Selected Games Preview */}
                {selectedGamesInfo.length > 0 ? (
                  <div className="bg-gray-950/40 rounded-2xl border border-gray-700/50 p-3 space-y-2 max-h-56 overflow-y-auto">
                    {selectedGamesInfo.map(g => (
                      <div key={g.id} className="flex items-center gap-3 p-2 bg-purple-600/20 rounded-xl border border-purple-500/30">
                        {g.image && <img src={g.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" referrerPolicy="no-referrer" />}
                        <span className="text-sm font-medium text-white truncate flex-1">{g.title}</span>
                        <button
                          type="button"
                          onClick={() => toggleGameId(g.id)}
                          className="text-gray-500 hover:text-red-400 shrink-0 text-lg leading-none"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowGamePicker(true)}
                    className="w-full py-8 border-2 border-dashed border-gray-700/60 rounded-2xl text-gray-500 hover:border-purple-500/50 hover:text-purple-400 transition-all text-sm flex flex-col items-center gap-2"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959V6a2 2 0 00-2-2H5.5a2 2 0 00-2 2v5.5c0 .355.186.676.401.959.221.29.349.634.349 1.003 0 1.036 1.007 1.875 2.25 1.875s2.25-.84 2.25-1.875c0-.369-.128-.713-.349-1.003A1.65 1.65 0 015.5 11.5V6" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>اضغط لاختيار الألعاب</span>
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/40 transition-all active:scale-95"
              >
                {editingId ? 'تحديث الباقة' : 'تأكيد وحفظ الباقة'}
              </button>
              <button
                type="button"
                onClick={() => { cancelEdit(); setShowForm(false); }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}

        {/* ── Packages List ── */}
        {packages.length === 0 ? (
            <div className="text-center py-20 bg-gray-900/40 rounded-2xl border border-white/5 backdrop-blur-md">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>
            <p className="text-gray-400 font-bold">لم يتم إنشاء أي باقات بعد</p>
            <button onClick={() => setShowForm(true)} className="mt-4 text-purple-400 hover:underline">أنشئ أول باقة الآن</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {packages.map(p => {
              const platformName = categories.find(c => c.id === p.category_id)?.name || 'المنصة';
              const pkgGames = p.packageGames && Array.isArray(p.packageGames) ? p.packageGames : [];
              return (
                <div key={p.id} className="group bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden flex flex-col hover:border-purple-500/30 transition-all duration-300 shadow-xl relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors pointer-events-none"></div>

                  {/* Card Header */}
                  <div className="p-4 sm:p-5 bg-gradient-to-br from-gray-800/40 to-transparent border-b border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {pkgGames.slice(0, 3).map((g, index) => (
                          <img
                            key={g.id}
                            src={g.image}
                            alt=""
                            className={`w-11 h-11 object-cover rounded-xl shadow-xl border-2 border-gray-900 ${index > 0 ? '-mr-4' : ''}`}
                            style={{ zIndex: 10 - index }}
                            referrerPolicy="no-referrer"
                          />
                        ))}
                        {pkgGames.length > 3 && (
                          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-800 shadow-xl border-2 border-gray-900 text-xs font-bold text-gray-300 -mr-4 z-0">
                            +{pkgGames.length - 3}
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.is_active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-700 text-gray-400'}`}>
                        {p.is_active ? 'نشط' : 'معطل'}
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-400 transition-colors truncate">{p.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-purple-400 font-bold text-xs">{platformName}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-400 text-xs">{pkgGames.length} ألعاب</span>
                    </div>
                  </div>

                  {/* Games Chips */}
                  <div className="p-4 sm:p-5 flex-1">
                    <div className="flex flex-wrap gap-1.5">
                      {pkgGames.slice(0, 6).map(g => (
                        <span key={g.id} className="text-[11px] bg-white/5 border border-white/5 px-2 py-1 rounded-lg text-gray-300 truncate max-w-[140px]">{g.title}</span>
                      ))}
                      {pkgGames.length > 6 && (
                        <span className="text-[11px] bg-purple-900/20 border border-purple-500/20 px-2 py-1 rounded-lg text-purple-300">+{pkgGames.length - 6} أخرى</span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 pt-3">
                      <span className="text-2xl font-black text-white tabular-nums">{Number(p.price).toFixed(2)}</span>
                      <span className="text-xs text-gray-500 font-bold">د.ل</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 sm:p-5 pt-0 flex gap-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="flex-1 py-2.5 bg-white/5 hover:bg-purple-600 hover:text-white rounded-xl text-sm font-bold transition-all border border-white/5 flex items-center justify-center gap-2"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="px-4 py-2.5 bg-white/5 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-white/5"
                      title="حذف"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    </button>
                    <button
                      onClick={() => toggleStatus(p.id)}
                      className={`px-4 py-2.5 rounded-xl transition-all border border-white/5 ${p.is_active ? 'bg-green-600/10 text-green-500 hover:bg-green-600 hover:text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                      title={p.is_active ? 'تعطيل' : 'تفعيل'}
                    >
                      {p.is_active ? '◎' : '◉'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default PackagesTab;
