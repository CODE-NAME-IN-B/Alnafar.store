import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { api } from './api'
import { exportGamesToExcel } from './utils/exportGamesExcel'
import { showToast } from './utils/toast'

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

const inputCls = "w-full bg-gray-950 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-sm sm:text-base"

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
  const [visibleCount, setVisibleCount] = useState(24)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      setLoading(true)
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
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      showToast('تعذر تحميل بيانات الألعاب', 'error')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load();
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

  useEffect(() => { setVisibleCount(24) }, [searchTerm, selectedCategory])

  async function save(e) {
    if (e) e.preventDefault() // منع إعادة تحميل الصفحة

    try {
      setSaving(true)
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
        showToast('تم تحديث اللعبة بنجاح')
      } else {
        const response = await api.post('/games', payload)
        // إضافة اللعبة الجديدة محلياً
        setItems(prevItems => [...prevItems, response.data])
        showToast('تمت إضافة اللعبة بنجاح')
      }
      setForm(empty); setEditing(null); setShowModal(false)
    } catch (error) {
      console.error('خطأ في حفظ اللعبة:', error);
      showToast('حدث خطأ أثناء حفظ اللعبة. يرجى المحاولة مرة أخرى.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id) {
    if (!confirm('هل أنت متأكد من حذف هذه اللعبة؟')) return

    try {
      await api.delete(`/games/${id}`)
      // حذف محلي بدلاً من إعادة التحميل
      setItems(prevItems => prevItems.filter(item => item.id !== id))
      showToast('تم حذف اللعبة')
    } catch (error) {
      console.error('خطأ في حذف اللعبة:', error);
      showToast('حدث خطأ أثناء حذف اللعبة. يرجى المحاولة مرة أخرى.', 'error')
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

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="skeleton-header mb-6"></div>
        <div className="skeleton h-28 rounded-2xl mb-6"></div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton-card"></div>)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">إدارة الألعاب</h2>
          <p className="text-gray-400 text-sm sm:text-base">إضافة وتعديل وحذف الألعاب في المتجر</p>
        </div>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              if (!items.length) { showToast('لا توجد ألعاب للتصدير', 'error'); return; }
              exportGamesToExcel(items, categories);
            }}
            className="btn btn-secondary w-full sm:w-auto"
            title="تصدير كل الألعاب إلى Excel مقسّمة حسب التصنيف وحجم التخزين"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            تصدير Excel
          </button>
          <button
            onClick={openAddModal}
            className="btn btn-primary w-full sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            إضافة لعبة جديدة
          </button>
        </div>
      </div>

      {/* Filter & Actions Bar */}
      <div className="bg-gray-900/40 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/5 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3 sm:gap-4">
          <div className="flex-1 min-w-0 sm:min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">تصفية حسب الفئة</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className={inputCls + " cursor-pointer"}
            >
              <option value="">جميع الفئات ({items.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({items.filter(g => g.category_id === c.id).length})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-0 sm:min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">البحث</label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              </span>
              <input
                type="text"
                placeholder="ابحث عن لعبة..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={inputCls + " pr-11"}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
                  aria-label="مسح البحث"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Games Grid */}
      <div className="bg-gray-900/40 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-white/5 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-white">الألعاب ({filteredItems.length})</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
          {filteredItems.slice(0, visibleCount).map(game => (
            <div key={game.id} className="bg-gray-950/60 rounded-2xl overflow-hidden border border-white/5 hover:border-teal-500/30 transition-all duration-200 group flex flex-col">
              <div className="aspect-[3/4] sm:aspect-square relative overflow-hidden bg-gray-900">
                <img
                  src={game.image}
                  alt={game.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23374151" width="200" height="200"/%3E%3Cpath d="M70 80h60v40H70z M100 70v-20M80 90a10 10 0 1020 0" stroke="%239ca3af" stroke-width="4" fill="none"/%3E%3C/svg%3E' }}
                />
              </div>
              <div className="p-3 flex flex-col flex-1">
                <h4 className="text-white font-semibold mb-2 line-clamp-2 text-sm leading-tight min-h-[2.5rem]">{game.title}</h4>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2 py-0.5 bg-teal-500/10 text-teal-300 border border-teal-500/20 rounded-md text-[10px] sm:text-xs truncate max-w-[60%]">
                    {categories.find(c => c.id === game.category_id)?.name || 'غير محدد'}
                  </span>
                  <span className="text-teal-400 font-bold text-xs sm:text-sm shrink-0 tabular-nums">{currency(game.price)}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {game.genre && (
                    <span className="badge badge-info">{game.genre}</span>
                  )}
                  {game.size_gb > 0 && <span className="badge badge-neutral">{game.size_gb} GB</span>}
                </div>
                <div className="flex gap-1.5 mt-auto">
                  <button
                    onClick={() => openEditModal(game)}
                    className="btn btn-secondary btn-sm flex-1 text-teal-300"
                    aria-label="تعديل"
                    title="تعديل"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                    <span className="hidden sm:inline">تعديل</span>
                  </button>
                  <button
                    onClick={() => remove(game.id)}
                    className="btn btn-secondary btn-sm text-red-400"
                    aria-label="حذف"
                    title="حذف"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    <span className="hidden sm:inline">حذف</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length > visibleCount && (
          <div className="text-center py-4 mt-3">
            <button
              onClick={() => setVisibleCount(prev => prev + 24)}
              className="btn btn-secondary"
            >
              تحميل المزيد ({filteredItems.length - visibleCount} متبقية)
            </button>
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon text-teal-400">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959V6a2 2 0 00-2-2H5.5a2 2 0 00-2 2v5.5c0 .355.186.676.401.959.221.29.349.634.349 1.003 0 1.036 1.007 1.875 2.25 1.875s2.25-.84 2.25-1.875c0-.369-.128-.713-.349-1.003A1.65 1.65 0 015.5 11.5V6" /></svg>
            </div>
            <div className="empty-state-title">لا توجد ألعاب</div>
            <div className="empty-state-description">جرّب تغيير الفلاتر أو أضف لعبة جديدة</div>
          </div>
        )}
      </div>

      {/* Modal (Portal) */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl w-full sm:max-w-xl md:max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between sticky top-0 bg-gray-900/95 backdrop-blur-xl z-10 rounded-t-2xl">
              <h3 className="text-xl sm:text-2xl font-bold text-white">{editing ? 'تعديل اللعبة' : 'إضافة لعبة جديدة'}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                aria-label="إغلاق"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="overflow-y-auto w-full custom-scrollbar">
              <form onSubmit={save} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">عنوان اللعبة</label>
                  <input
                    className={inputCls}
                    placeholder="أدخل عنوان اللعبة"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">صورة اللعبة</label>
                  {form.image && (
                    <div className="mb-3">
                      <img src={form.image} alt="معاينة" className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl border border-white/10" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full bg-gray-950 border border-gray-700/50 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-500 file:text-white hover:file:bg-teal-600 cursor-pointer text-xs sm:text-sm"
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
                          showToast(`فشل رفع الصورة: ${msg}`, 'error');
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
                      className={inputCls}
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
                      className={inputCls}
                      placeholder="مثال: 45.5"
                      value={form.size_gb}
                      onChange={e => setForm({ ...form, size_gb: e.target.value })}
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">الفئة (المنصة)</label>
                    <select
                      className={inputCls + " cursor-pointer"}
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
                      className={inputCls + " cursor-pointer"}
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
                      className={inputCls + " cursor-pointer"}
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

                <div className="flex gap-3 pt-4 border-t border-white/5 mt-2">
                  <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                    {saving ? 'جاري الحفظ...' : (editing ? 'تحديث البيانات' : 'إضافة اللعبة')}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
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
