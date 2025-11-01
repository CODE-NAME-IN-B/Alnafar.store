import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { api } from './api'

export default function GenreSeriesManager() {
  const [genres, setGenres] = useState([])
  const [series, setSeries] = useState([])
  const [showGenreModal, setShowGenreModal] = useState(false)
  const [showSeriesModal, setShowSeriesModal] = useState(false)
  const [editingGenre, setEditingGenre] = useState(null)
  const [editingSeries, setEditingSeries] = useState(null)
  const [newGenreName, setNewGenreName] = useState('')
  const [newSeriesName, setNewSeriesName] = useState('')

  async function loadData() {
    try {
      const [genresRes, seriesRes] = await Promise.all([
        api.get('/genres'),
        api.get('/series')
      ])
      setGenres(genresRes.data || [])
      setSeries(seriesRes.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleGenreUpdate() {
    if (!newGenreName.trim()) return
    
    try {
      await api.post('/genres', {
        oldGenre: editingGenre,
        newGenre: newGenreName.trim()
      })
      
      setShowGenreModal(false)
      setEditingGenre(null)
      setNewGenreName('')
      loadData()
      alert('تم تحديث النوع بنجاح')
    } catch (error) {
      alert('فشل في تحديث النوع: ' + (error.response?.data?.message || error.message))
    }
  }

  async function handleGenreDelete(genre) {
    if (!confirm(`هل أنت متأكد من حذف النوع "${genre}"؟ سيتم إزالته من جميع الألعاب.`)) return
    
    try {
      await api.delete(`/genres/${encodeURIComponent(genre)}`)
      loadData()
      alert('تم حذف النوع بنجاح')
    } catch (error) {
      alert('فشل في حذف النوع: ' + (error.response?.data?.message || error.message))
    }
  }

  async function handleSeriesUpdate() {
    if (!newSeriesName.trim()) return
    
    try {
      await api.post('/series', {
        oldSeries: editingSeries,
        newSeries: newSeriesName.trim()
      })
      
      setShowSeriesModal(false)
      setEditingSeries(null)
      setNewSeriesName('')
      loadData()
      alert('تم تحديث السلسلة بنجاح')
    } catch (error) {
      alert('فشل في تحديث السلسلة: ' + (error.response?.data?.message || error.message))
    }
  }

  async function handleSeriesDelete(seriesName) {
    if (!confirm(`هل أنت متأكد من حذف السلسلة "${seriesName}"؟ سيتم إزالتها من جميع الألعاب.`)) return
    
    try {
      await api.delete(`/series/${encodeURIComponent(seriesName)}`)
      loadData()
      alert('تم حذف السلسلة بنجاح')
    } catch (error) {
      alert('فشل في حذف السلسلة: ' + (error.response?.data?.message || error.message))
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">إدارة الأنواع والسلاسل</h2>
        <p className="text-gray-400">تعديل وحذف أنواع الألعاب والسلاسل</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Genres Section */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">الأنواع ({genres.length})</h3>
            <button
              onClick={() => openGenreModal()}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all"
            >
              إضافة نوع جديد
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {genres.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>لا توجد أنواع محددة</p>
                <p className="text-sm">سيتم إضافة الأنواع تلقائياً عند تصنيف الألعاب</p>
              </div>
            ) : (
              genres.map(genre => (
                <div key={genre} className="flex items-center justify-between bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                  <span className="text-white font-medium">{genre}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openGenreModal(genre)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleGenreDelete(genre)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Series Section */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">السلاسل ({series.length})</h3>
            <button
              onClick={() => openSeriesModal()}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all"
            >
              إضافة سلسلة جديدة
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {series.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>لا توجد سلاسل محددة</p>
                <p className="text-sm">سيتم إضافة السلاسل عند تعديل الألعاب</p>
              </div>
            ) : (
              series.map(seriesName => (
                <div key={seriesName} className="flex items-center justify-between bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                  <span className="text-white font-medium">{seriesName}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openSeriesModal(seriesName)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleSeriesDelete(seriesName)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Genre Modal */}
      {showGenreModal && createPortal(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4" onClick={() => setShowGenreModal(false)}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {editingGenre ? 'تعديل النوع' : 'إضافة نوع جديد'}
              </h3>
              <button onClick={() => setShowGenreModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">اسم النوع</label>
                <input 
                  className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="أدخل اسم النوع" 
                  value={newGenreName} 
                  onChange={e => setNewGenreName(e.target.value)} 
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleGenreUpdate} 
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all"
                >
                  {editingGenre ? 'تحديث' : 'إضافة'}
                </button>
                <button 
                  onClick={() => setShowGenreModal(false)} 
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all"
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4" onClick={() => setShowSeriesModal(false)}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {editingSeries ? 'تعديل السلسلة' : 'إضافة سلسلة جديدة'}
              </h3>
              <button onClick={() => setShowSeriesModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">اسم السلسلة</label>
                <input 
                  className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" 
                  placeholder="أدخل اسم السلسلة" 
                  value={newSeriesName} 
                  onChange={e => setNewSeriesName(e.target.value)} 
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleSeriesUpdate} 
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all"
                >
                  {editingSeries ? 'تحديث' : 'إضافة'}
                </button>
                <button 
                  onClick={() => setShowSeriesModal(false)} 
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all"
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
