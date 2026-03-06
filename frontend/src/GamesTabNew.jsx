import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { api } from './api'

// معالج الأخطاء العام
window.addEventListener('error', (event) => {
  console.error('خطأ JavaScript:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('خطأ Promise غير معالج:', event.reason);
  event.preventDefault(); // منع إعادة تحميل الصفحة
});

function currency(num) {
  return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(num)
}

export default function GamesTab() {
  const empty = { title: '', image: '', description: '', price: '', size_gb: '', category_id: '', genre: '', series: '', features: '' }
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [series, setSeries] = useState([])
  const [genres, setGenres] = useState([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showModal, setShowModal] = useState(false)

  async function load() {
    const [g, c, s, genresRes] = await Promise.all([
      api.get('/games'),
      api.get('/categories'),
      api.get('/series'),
      api.get('/genres')
    ])
    setItems(g.data)
    setCategories(c.data)
    setSeries(s.data || [])
    setGenres(genresRes.data || [])
  }
  useEffect(() => {
    load().catch(error => {
      console.error('خطأ في تحميل البيانات:', error);
    });
  }, [])

  const filteredItems = items
    .filter(item => {
      const matchCategory = !selectedCategory || item.category_id === Number(selectedCategory)
      const matchSearch = !searchTerm.trim() ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      return matchCategory && matchSearch
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'ar', { sensitivity: 'base' }))

  async function save(e) {
    if (e) e.preventDefault() // منع إعادة تحميل الصفحة

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        size_gb: form.size_gb ? Number(form.size_gb) : 0,
        category_id: form.category_id ? Number(form.category_id) : null,
        genre: form.genre || null,
        series: form.series || null,
        features: form.features || null
      }
      if (editing) {
        await api.put(`/games/${editing.id}`, payload)
        // تحديث محلي بدلاً من إعادة التحميل
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === editing.id ? { ...item, ...payload, id: editing.id } : item
          )
        )
      } else {
        const response = await api.post('/games', payload)
        // إضافة اللعبة الجديدة محلياً
        setItems(prevItems => [...prevItems, response.data])
      }
      setForm(empty); setEditing(null); setShowModal(false)
    } catch (error) {
      console.error('خطأ في حفظ اللعبة:', error);
      alert('حدث خطأ أثناء حفظ اللعبة. يرجى المحاولة مرة أخرى.');
    }
  }

  async function remove(id) {
    if (!confirm('هل أنت متأكد من حذف هذه اللعبة؟')) return

    try {
      await api.delete(`/games/${id}`)
      // حذف محلي بدلاً من إعادة التحميل
      setItems(prevItems => prevItems.filter(item => item.id !== id))
    } catch (error) {
      console.error('خطأ في حذف اللعبة:', error);
      alert('حدث خطأ أثناء حذف اللعبة. يرجى المحاولة مرة أخرى.');
    }
  }

  function openAddModal() {
    setEditing(null)
    setForm(empty)
    setShowModal(true)
  }

  function openEditModal(game) {
    setEditing(game)
    setForm({
      ...game,
      price: String(game.price),
      size_gb: game.size_gb ? String(game.size_gb) : '',
      genre: game.genre || '',
      series: game.series || '',
      features: game.features || ''
    })
    setShowModal(true)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">إدارة الألعاب</h2>
          <p className="text-gray-400">إضافة وتعديل وحذف الألعاب في المتجر</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          إضافة لعبة جديدة
        </button>
      </div>

      {/* Filter & Actions Bar */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-300 mb-2">تصفية حسب الفئة</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الفئات ({items.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({items.filter(g => g.category_id === c.id).length})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-300 mb-2">البحث</label>
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث عن لعبة..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 items-end">
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault(); // منع أي سلوك افتراضي
                e.stopPropagation(); // منع انتشار الحدث

                try {
                  const confirmed = confirm('تصنيف الألعاب حسب النوع والسلسلة بالعربية؟');
                  if (!confirmed) return;

                  const list = filteredItems.length ? filteredItems : items;
                  let updated = 0;
                  const updatedGames = []; // تجميع التحديثات
                  const box = document.createElement('div');
                  box.style.cssText = 'position:fixed;top:20px;right:20px;background:#1f2937;color:white;padding:20px;border-radius:12px;z-index:9999;box-shadow:0 8px 16px rgba(0,0,0,0.4);max-width:420px;border:2px solid #8b5cf6;';
                  box.innerHTML = '<div style="font-weight:bold;margin-bottom:12px;">🏷️ تصنيف حسب النوع والسلسلة...</div><div id="status-arabic">0 / ' + list.length + '</div>';
                  document.body.appendChild(box);

                  for (let i = 0; i < list.length; i++) {
                    const g = list[i];
                    try {
                      const statusEl = document.getElementById('status-arabic');
                      if (statusEl) {
                        statusEl.innerHTML = `${i + 1} / ${list.length}<br/>${g.title}`;
                      }

                      const { data } = await api.post('/analyze-game-genre', { title: g.title });
                      if (data?.success && data.arabicGenre) {
                        const features = data.features.length > 0 ? JSON.stringify(data.features) : null;
                        const updatedGame = { ...g, genre: data.arabicGenre, features };
                        await api.put(`/games/${g.id}`, updatedGame);
                        // تجميع التحديثات بدلاً من التحديث المباشر
                        updatedGames.push(updatedGame);
                        updated++;

                        if (statusEl) {
                          statusEl.innerHTML = `${i + 1} / ${list.length}<br/>✅ ${g.title} → ${data.arabicGenre}`;
                        }
                      }
                      await new Promise(r => setTimeout(r, 2500)); // Rate limiting
                    } catch (e) {
                      console.error('خطأ في تصنيف اللعبة:', e);
                      const statusEl = document.getElementById('status-arabic');
                      if (statusEl) {
                        statusEl.innerHTML = `${i + 1} / ${list.length}<br/>❌ ${g.title}`;
                      }
                      await new Promise(r => setTimeout(r, 1000));
                    }
                  }

                  // تحديث واحد في النهاية بدلاً من تحديثات متعددة
                  if (updatedGames.length > 0) {
                    setItems(prevItems => {
                      const updatedMap = new Map(updatedGames.map(game => [game.id, game]));
                      return prevItems.map(item => updatedMap.get(item.id) || item);
                    });
                  }

                  setTimeout(() => {
                    if (box && box.parentNode) {
                      box.remove();
                    }
                  }, 2000);
                  alert(`تم تصنيف ${updated} لعبة بالعربية`);

                } catch (error) {
                  console.error('خطأ عام في التصنيف:', error);
                  alert('حدث خطأ أثناء التصنيف. يرجى المحاولة مرة أخرى.');
                }
              }}
              className="px-4 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl font-bold transition-all shadow-lg"
              title="تصنيف حسب النوع والسلسلة"
            >
              🏷️ تصنيف حسب النوع والسلسلة
            </button>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-2xl">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white">الألعاب ({filteredItems.length})</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(game => (
            <div key={game.id} className="bg-gray-700/50 rounded-xl overflow-hidden border border-gray-600 hover:border-blue-500 transition-all group">
              <div className="aspect-square relative overflow-hidden bg-gray-800">
                <img
                  src={game.image}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => { e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23374151" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="60"%3E🎮%3C/text%3E%3C/svg%3E' }}
                />
              </div>
              <div className="p-4">
                <h4 className="text-white font-semibold mb-2 line-clamp-2">{game.title}</h4>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs">
                    {categories.find(c => c.id === game.category_id)?.name || 'غير محدد'}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="text-green-400 font-bold">{currency(game.price)}</span>
                    {game.size_gb > 0 && <span className="text-gray-400 text-xs mt-1">{game.size_gb} GB</span>}
                  </div>
                </div>
                {game.genre && (
                  <div className="mb-2">
                    <span className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded text-xs">
                      {game.genre}
                    </span>
                    {game.features && (() => {
                      try {
                        return JSON.parse(game.features).includes('تعاوني');
                      } catch {
                        return false;
                      }
                    })() && (
                        <span className="px-2 py-1 bg-green-600/20 text-green-300 rounded text-xs mr-1">
                          تعاوني
                        </span>
                      )}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(game)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => remove(game.id)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl mb-2">لا توجد ألعاب</p>
            <p className="text-sm">جرّب تغيير الفلاتر أو أضف لعبة جديدة</p>
          </div>
        )}
      </div>

      {/* Modal (Portal) */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-3 sm:p-4" onClick={() => setShowModal(false)}>
          <div className="bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-700 shadow-2xl w-full sm:max-w-xl md:max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 sm:p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800 z-10 rounded-t-xl sm:rounded-t-2xl">
              <h3 className="text-xl sm:text-2xl font-bold text-white">{editing ? 'تعديل اللعبة' : 'إضافة لعبة جديدة'}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-3xl leading-none w-8 h-8 flex items-center justify-center bg-gray-700/50 hover:bg-gray-600 rounded-full transition-colors"
                aria-label="إغلاق"
              >
                &times;
              </button>
            </div>

            <div className="overflow-y-auto w-full custom-scrollbar">
              <form onSubmit={save} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">عنوان اللعبة</label>
                  <input
                    className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل عنوان اللعبة"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">صورة اللعبة (رابط مباشر أو رفع)</label>
                  {form.image && (
                    <div className="mb-3">
                      <img src={form.image} alt="معاينة" className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border border-gray-600" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 text-xs sm:text-sm"
                    onChange={async e => {
                      const file = e.target.files[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = async function (ev) {
                        const base = ev.target.result.split(',')[1]
                        try {
                          const r = await api.post('/uploads', { filename: file.name, data: base })
                          setForm(f => ({ ...f, image: r.data.url }))
                        } catch (err) {
                          console.error('Upload error:', err);
                          const msg = err.response?.data?.error || err.response?.data?.message || err.message;
                          alert(`فشل رفع الصورة: ${msg}`);
                        }
                      }
                      reader.readAsDataURL(file)
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">السعر (د.ل)</label>
                    <input
                      type="number"
                      step="0.001"
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="مثال: 5.000"
                      value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">الحجم (جيجابايت)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="مثال: 45.5"
                      value={form.size_gb}
                      onChange={e => setForm({ ...form, size_gb: e.target.value })}
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">الفئة (المنصة)</label>
                    <select
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm sm:text-base"
                      value={form.category_id}
                      onChange={e => setForm({ ...form, category_id: e.target.value })}
                    >
                      <option value="">اختر الفئة</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">النوع (Genre)</label>
                    <select
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm sm:text-base"
                      value={form.genre || ''}
                      onChange={e => {
                        const value = e.target.value;
                        setForm({ ...form, genre: value === '' ? null : value });
                      }}
                    >
                      <option value="">اختر النوع (اختياري)</option>
                      {genres.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">السلسلة (Series)</label>
                    <select
                      className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm sm:text-base"
                      value={form.series || ''}
                      onChange={e => {
                        const value = e.target.value;
                        setForm({ ...form, series: value === '' ? null : value });
                      }}
                    >
                      <option value="">اختر السلسلة (اختياري)</option>
                      {series.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-700 mt-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                    {editing ? 'تحديث البيانات' : 'إضافة اللعبة'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all border border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
