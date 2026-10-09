import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { api } from './api'
import { showToast } from './utils/toast'

const inputCls = "w-full bg-gray-950 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"

export default function GenreSeriesManager() {
  const [genres, setGenres] = useState([])
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showGenreModal, setShowGenreModal] = useState(false)
  const [showSeriesModal, setShowSeriesModal] = useState(false)
  const [editingGenre, setEditingGenre] = useState(null)
  const [editingSeries, setEditingSeries] = useState(null)
  const [newGenreName, setNewGenreName] = useState('')
  const [newSeriesName, setNewSeriesName] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      const [genresRes, seriesRes] = await Promise.all([
        api.get('/genres'),
        api.get('/series')
      ])
      setGenres(genresRes.data || [])
      setSeries(seriesRes.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      showToast('تعذر تحميل الأنواع والسلاسل', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleGenreUpdate() {
    if (!newGenreName.trim()) return

    try {
      setSaving(true)
      await api.post('/genres', {
        oldGenre: editingGenre,
        newGenre: newGenreName.trim()
      })

      setShowGenreModal(false)
      setEditingGenre(null)
      setNewGenreName('')
      loadData()
      showToast('تم تحديث النوع بنجاح')
    } catch (error) {
      showToast('فشل في تحديث النوع: ' + (error.response?.data?.message || error.message), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleGenreDelete(genre) {
    if (!confirm(`هل أنت متأكد من حذف النوع "${genre}"؟ سيتم إزالته من جميع الألعاب.`)) return

    try {
      await api.delete(`/genres/${encodeURIComponent(genre)}`)
      loadData()
      showToast('تم حذف النوع بنجاح')
    } catch (error) {
      showToast('فشل في حذف النوع: ' + (error.response?.data?.message || error.message), 'error')
    }
  }

  async function handleSeriesUpdate() {
    if (!newSeriesName.trim()) return

    try {
      setSaving(true)
      await api.post('/series', {
        oldSeries: editingSeries,
        newSeries: newSeriesName.trim()
      })

      setShowSeriesModal(false)
      setEditingSeries(null)
      setNewSeriesName('')
      loadData()
      showToast('تم تحديث السلسلة بنجاح')
    } catch (error) {
      showToast('فشل في تحديث السلسلة: ' + (error.response?.data?.message || error.message), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSeriesDelete(seriesName) {
    if (!confirm(`هل أنت متأكد من حذف السلسلة "${seriesName}"؟ سيتم إزالتها من جميع الألعاب.`)) return

    try {
      await api.delete(`/series/${encodeURIComponent(seriesName)}`)
      loadData()
      showToast('تم حذف السلسلة بنجاح')
    } catch (error) {
      showToast('فشل في حذف السلسلة: ' + (error.response?.data?.message || error.message), 'error')
    }
  }

  function openGenreModal(genre = null) {
    setEditingGenre(genre)
    setNewGenreName(genre || '')
    setShowGenreModal(true)
  }

  function openSeriesModal(seriesName = null) {
    setEditingSeries(seriesName)
    setNewSeriesName(seriesName || '')
    setShowSeriesModal(true)
  }

  const closeIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
  )

  function CardHeader({ title, count, onAdd, icon }) {
    return (
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <h3 className="text-base sm:text-xl font-bold text-white truncate">{title} ({count})</h3>
        </div>
        <button onClick={onAdd} className="btn btn-primary btn-sm shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          إضافة
        </button>
      </div>
    )
  }

  function EmptyList({ label, hint }) {
    return (
      <div className="empty-state py-8">
        <div className="empty-state-icon text-teal-400">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
        </div>
        <div className="empty-state-title">{label}</div>
        <div className="empty-state-description">{hint}</div>
      </div>
    )
  }

  function ListRow({ name, type, onEdit, onDelete }) {
    return (
      <div className="flex items-center justify-between gap-2 bg-gray-950/60 p-3 sm:p-4 rounded-xl border border-white/5 hover:border-teal-500/20 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-white font-medium text-sm truncate min-w-0">{name}</span>
          <span className="badge badge-neutral shrink-0">{type}</span>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={onEdit}
            className="btn btn-secondary btn-sm text-teal-300"
            title="تعديل"
            aria-label="تعديل"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
            <span className="hidden sm:inline">تعديل</span>
          </button>
          <button
            onClick={onDelete}
            className="btn btn-secondary btn-sm text-red-400"
            title="حذف"
            aria-label="حذف"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            <span className="hidden sm:inline">حذف</span>
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-3 min-[400px]:p-4 sm:p-6 lg:p-8">
        <div className="skeleton-header mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {[0, 1].map(i => (
            <div key={i} className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-4 sm:p-6 space-y-3">
              <div className="skeleton h-10 w-1/2 rounded-xl"></div>
              {[0, 1, 2, 3].map(j => <div key={j} className="skeleton h-12 w-full rounded-xl"></div>)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 min-[400px]:p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">إدارة الأنواع والسلاسل</h2>
        <p className="text-gray-400 text-sm">تعديل وحذف أنواع الألعاب والسلاسل</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Genres Section */}
        <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-4 sm:p-6">
          <CardHeader
            title="الأنواع"
            count={genres.length}
            onAdd={() => openGenreModal()}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>}
          />

          <div className="space-y-2 sm:space-y-3 max-h-72 sm:max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {genres.length === 0 ? (
              <EmptyList label="لا توجد أنواع محددة" hint="سيتم إضافة الأنواع تلقائياً عند تصنيف الألعاب" />
            ) : (
              genres.map(genre => (
                <ListRow
                  key={genre}
                  name={genre}
                  type="نوع"
                  onEdit={() => openGenreModal(genre)}
                  onDelete={() => handleGenreDelete(genre)}
                />
              ))
            )}
          </div>
        </div>

        {/* Series Section */}
        <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl p-4 sm:p-6">
          <CardHeader
            title="السلاسل"
            count={series.length}
            onAdd={() => openSeriesModal()}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h1.5A2.25 2.25 0 0112 6v.878m-6 0h6m-6 0v2.372a2.25 2.25 0 001.5 2.121l.001.001a2.25 2.25 0 011.5 2.12V15a2.25 2.25 0 01-2.25 2.25H9.75A2.25 2.25 0 017.5 15v-1.257a2.25 2.25 0 011.5-2.121l.001-.001a2.25 2.25 0 001.5-2.12V8.878m0 0h6m-6 0V6a2.25 2.25 0 012.25-2.25h1.5A2.25 2.25 0 0118 6v.878m0 0v2.372a2.25 2.25 0 01-1.5 2.121l-.001.001a2.25 2.25 0 00-1.5 2.12V15a2.25 2.25 0 002.25 2.25h1.5A2.25 2.25 0 0021 15v-1.257a2.25 2.25 0 00-1.5-2.121l-.001-.001a2.25 2.25 0 01-1.5-2.12V8.878" /></svg>}
          />

          <div className="space-y-2 sm:space-y-3 max-h-72 sm:max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {series.length === 0 ? (
              <EmptyList label="لا توجد سلاسل محددة" hint="سيتم إضافة السلاسل عند تعديل الألعاب" />
            ) : (
              series.map(seriesName => (
                <ListRow
                  key={seriesName}
                  name={seriesName}
                  type="سلسلة"
                  onEdit={() => openSeriesModal(seriesName)}
                  onDelete={() => handleSeriesDelete(seriesName)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Genre Modal */}
      {showGenreModal && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] p-4" onClick={() => setShowGenreModal(false)}>
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-t-2xl sm:rounded-2xl border border-white/10 shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {editingGenre ? 'تعديل النوع' : 'إضافة نوع جديد'}
              </h3>
              <button
                onClick={() => setShowGenreModal(false)}
                className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                aria-label="إغلاق"
              >
                {closeIcon}
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">اسم النوع</label>
                <input
                  className={inputCls}
                  placeholder="أدخل اسم النوع"
                  value={newGenreName}
                  onChange={e => setNewGenreName(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleGenreUpdate}
                  disabled={saving || !newGenreName.trim()}
                  className="btn btn-primary flex-1 btn-lg"
                >
                  {editingGenre ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  onClick={() => setShowGenreModal(false)}
                  className="btn btn-secondary btn-lg"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Series Modal */}
      {showSeriesModal && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] p-4" onClick={() => setShowSeriesModal(false)}>
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-t-2xl sm:rounded-2xl border border-white/10 shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {editingSeries ? 'تعديل السلسلة' : 'إضافة سلسلة جديدة'}
              </h3>
              <button
                onClick={() => setShowSeriesModal(false)}
                className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                aria-label="إغلاق"
              >
                {closeIcon}
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">اسم السلسلة</label>
                <input
                  className={inputCls}
                  placeholder="أدخل اسم السلسلة"
                  value={newSeriesName}
                  onChange={e => setNewSeriesName(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSeriesUpdate}
                  disabled={saving || !newSeriesName.trim()}
                  className="btn btn-primary flex-1 btn-lg"
                >
                  {editingSeries ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  onClick={() => setShowSeriesModal(false)}
                  className="btn btn-secondary btn-lg"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
