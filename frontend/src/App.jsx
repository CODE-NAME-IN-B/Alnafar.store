import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { api, loadAuthFromStorage, setActiveBranchId, setAuthToken } from './api'
import socket from './socket'
import OrderTracking from './OrderTracking'
import { preloadLogo } from './utils/logoCache'
import Loader from './Loader'
import logo from '../assites/logo.png'
import cover from '../assites/cover.png'
import cover2 from '../assites/cover2.jpg'

const Admin = lazy(() => import('./Admin'))
const Invoice = lazy(() => import('./Invoice'))

function ImageSlider() {
  const images = [
    { src: cover, alt: 'cover 1' },
    { src: cover2, alt: 'cover 2' }
  ]
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % images.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-full h-40 min-[400px]:h-48 sm:h-56 md:max-h-64 rounded-xl overflow-hidden shadow-lg">
      {images.map((img, index) => (
        <img
          key={index}
          src={img.src}
          alt={img.alt}
          loading={index === 0 ? 'eager' : 'lazy'}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            index === current ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-2.5 h-2.5 rounded-full transition-colors no-touch-resize ${
              index === current ? 'bg-white' : 'bg-white/50'
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

function currency(num) {
  return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(num)
}

// خريطة توحيد الأنواع العربية إلى الإنجليزية — مصدر واحد للفلترة والعرض
const AR_TO_EN_GENRE = {
  'رعب': 'horror', 'أكشن': 'action', 'مغامرة': 'adventure', 'رياضة': 'sports',
  'سباقات': 'racing', 'سباق': 'racing', 'ألغاز': 'puzzle', 'منصات': 'platformer',
  'عالم مفتوح': 'open world', 'تخفي': 'stealth', 'قتال': 'fighting',
  'استراتيجية': 'strategy', 'تقمص أدوار': 'rpg', 'أطفال': 'kids', 'تصويب': 'shooter'
}

// توحيد اسم النوع القادم من قاعدة البيانات بنفس طريقة توحيد قيم الألعاب (_cls.genre)
function normalizeGenre(name) {
  const v = (name || '').trim().toLowerCase()
  return AR_TO_EN_GENRE[v] || v
}

// توحيد اسم السلسلة القادم من قاعدة البيانات بنفس طريقة توحيد قيم الألعاب (_cls.series)
function normalizeSeries(name) {
  return (name || '').trim().toLowerCase()
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message
  document.body.appendChild(toast)
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(1rem)' }, 3000)
  setTimeout(() => toast.remove(), 3500)
}

function TopList({ onAdd }) {
  const [top, setTop] = useState([])
  const [details, setDetails] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const r = await api.get('/stats', { params: { public: 1 } })
        const topGames = r.data?.topGames || []
        setTop(topGames)
        if (!topGames.length) { setDetails([]); return }
        // fetch game details in one request (batch) preserving order
        // entries may be id-based or title-only (legacy invoices)
        const idList = topGames.map(t => t.gameId).filter(v => v !== null && v !== undefined && String(v).trim() !== '' && !Number.isNaN(Number(v)));
        const ids = idList.join(',')
        let rows = []
        try {
          if (ids) {
            const res = await api.get('/games/batch', { params: { ids } })
            rows = Array.isArray(res.data) ? res.data : []
          }
        } catch (_) { rows = [] }
        const map = new Map(rows.map(g => [Number(g.id), g]))
        const byTitle = new Map(rows.map(g => [String(g.title || '').toLowerCase(), g]))
        const resolved = topGames
          .map(t => {
            const g = (t.gameId !== null && t.gameId !== undefined && String(t.gameId).trim() !== '')
              ? (map.get(Number(t.gameId)) || byTitle.get(String(t.title || '').toLowerCase()) || {})
              : (byTitle.get(String(t.title || '').toLowerCase()) || {});
            return {
              id: g.id ?? t.gameId ?? t.title,
              title: g.title || t.title || (t.gameId ? `لعبة #${t.gameId}` : null),
              image: g.image || '',
              price: typeof g.price === 'number' ? g.price : 0,
              count: t.count
            }
          })
          .filter(g => g.id !== null && g.id !== undefined && String(g.id).trim() !== '' && g.title !== null)

        if (!cancelled) setDetails(resolved)
      } catch (e) {
        console.error('Failed to load top list', e)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (details.length === 0) return (
    <div className="text-center py-4 text-gray-400">
      <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm">لا يوجد بيانات بعد</p>
    </div>
  )

  return (
    <ul className="space-y-2">
      {details.map((g, idx) => (
        <li key={g.id} className="flex items-center gap-3 p-2.5 bg-gradient-to-l from-white/5 to-transparent rounded-xl hover:from-purple-500/10 hover:to-transparent border border-white/5 hover:border-purple-500/30 transition-all duration-200 group">
          {/* رقم الترتيب */}
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
            idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
            idx === 1 ? 'bg-gray-400/20 text-gray-300' :
            idx === 2 ? 'bg-orange-500/20 text-orange-400' :
            'bg-white/5 text-gray-500'
          }`}>
            {idx + 1}
          </div>
          
          {/* صورة اللعبة */}
          <img
            src={g.image || cover}
            alt={g.title}
            loading="lazy"
            className="w-11 h-11 object-cover rounded-lg flex-shrink-0 border border-white/10 group-hover:border-purple-500/30 transition-colors"
            referrerPolicy="no-referrer"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = cover; }}
          />
          
          {/* معلومات اللعبة */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate text-sm text-white group-hover:text-purple-300 transition-colors" title={g.title}>{g.title}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-purple-400 font-bold text-xs">{typeof g.price === 'number' ? currency(g.price) : ''}</span>
              <span className="text-gray-600 text-[10px]">•</span>
              <span className="text-gray-500 text-[10px]">{g.count} مبيعة</span>
            </div>
          </div>
          
          {/* زر الإضافة */}
          {onAdd && (
            <button
              onClick={() => onAdd(g)}
              className="w-8 h-8 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white rounded-lg font-semibold text-xs transition-all flex items-center justify-center flex-shrink-0 opacity-70 group-hover:opacity-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

// Format phone number for wa.me links (Libya country code: 218)
function formatWhatsAppPhone(raw) {
  let digits = (raw || '').replace(/[^0-9]/g, '')
  // Remove leading + or 00 international prefix
  if (digits.startsWith('00')) digits = digits.substring(2)
  // If starts with 0, assume local Libyan number → replace 0 with 218
  if (digits.startsWith('0')) digits = '218' + digits.substring(1)
  // If missing country code entirely and looks like local (9 digits), prepend 218
  if (digits.length === 9 && !digits.startsWith('218')) digits = '218' + digits
  return digits
}

// اختيار الفرع لإرسال الطلب — كل فرع له رقم واتساب مستقل
function BranchSelect({ branches, selectedId, onSelect, compact }) {
  return (
    <div className={compact ? '' : 'bg-gray-950/40 rounded-xl border border-white/10 p-3 sm:p-4'}>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="w-6 h-6 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" /></svg>
        </span>
        <span className="text-xs font-bold text-[var(--text-secondary)]">أرسل الطلب إلى الفرع</span>
      </div>
      <div className="grid gap-2">
        {branches.map(b => {
          const selected = String(b.id) === String(selectedId)
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelect(b.id)}
              aria-pressed={selected}
              className={`w-full text-right rounded-xl border p-3 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/60 ${
                selected
                  ? 'border-teal-500/70 bg-teal-500/10 ring-2 ring-teal-500/40 shadow-[0_0_16px_rgba(20,184,166,0.15)]'
                  : 'border-white/10 bg-gray-950/40 hover:border-white/25 hover:bg-gray-900/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`font-bold text-sm truncate ${selected ? 'text-teal-300' : 'text-white'}`}>{b.name}</span>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${selected ? 'bg-teal-500 text-white' : 'bg-white/10 text-transparent'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                </span>
              </div>
              {b.address && (
                <p className="text-[11px] text-gray-400 mt-1 truncate" title={b.address}>{b.address}</p>
              )}
              {b.phone && (
                <p className="flex items-center gap-1 text-[11px] text-teal-400/80 mt-1 font-mono" dir="ltr">
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                  <span className="truncate">{b.phone}</span>
                </p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function App() {
  const [route, setRoute] = useState(window.location.hash || '#/')
  const [categories, setCategories] = useState([])
  const [games, setGames] = useState([])
  const [gamesLoading, setGamesLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [cart, setCart] = useState([])
  const [servicesCart, setServicesCart] = useState([])
  const [services, setServices] = useState([])
  const [packages, setPackages] = useState([])
  // UI filters
  const [genreFilter, setGenreFilter] = useState('')
  const [seriesFilter, setSeriesFilter] = useState('')
  // قوائم الفلاتر المصدرية من قاعدة البيانات (تطابق لوحة التحكم)
  const [genreOptions, setGenreOptions] = useState([])
  const [seriesOptions, setSeriesOptions] = useState([])
  const [splitOnly, setSplitOnly] = useState(false)
  const [letterFilter, setLetterFilter] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [paymentType, setPaymentType] = useState('cash')
  const [visibleGameCount, setVisibleGameCount] = useState(24)
  const [showLogin, setShowLogin] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginLoading, setLoginLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [viewingPackage, setViewingPackage] = useState(null)
  const [isGuestMode, setIsGuestMode] = useState(localStorage.getItem('isGuest') === 'true')
  const [storePhone, setStorePhone] = useState('')
  const [branches, setBranches] = useState([])
  const [selectedBranchId, setSelectedBranchId] = useState(() => {
    const stored = localStorage.getItem('selectedBranchId')
    return stored && !Number.isNaN(Number(stored)) ? Number(stored) : null
  })
  // حماية المتجر: يجب تسجيل الدخول للوصول إلى نقطة البيع
  const hasToken = !!localStorage.getItem('token')

  // Load auth token from storage on mount
  useEffect(() => { loadAuthFromStorage(); setActiveBranchId(null) }, [])

  // If a valid token exists, a logged-in session takes precedence over any stale guest flag
  useEffect(() => {
    if (localStorage.getItem('token')) {
      if (localStorage.getItem('isGuest')) localStorage.removeItem('isGuest')
      setIsGuestMode(false)
    }
  }, [])

  // Preload invoice logo for instant print
  useEffect(() => { preloadLogo(window.location.origin) }, [])

  const [editingInvoiceData, setEditingInvoiceData] = useState(null)

  useEffect(() => {
    api.get('/services').then(({ data }) => setServices(Array.isArray(data) ? data : [])).catch(() => { })
    api.get('/branches').then(({ data }) => {
      const rows = Array.isArray(data) ? data : (data?.branches || [])
      setBranches(rows)
      // مزامنة الفرع المحدد: احتفظ بالاختيار السابق إن كان ما زال متاحاً،
      // وإلا اختر الفرع الوحيد النشط تلقائياً (كل فرع له رقم واتساب خاص به)
      setSelectedBranchId(prev => {
        let id = prev
        if (!rows.some(b => String(b.id) === String(id))) id = null
        if (id === null) {
          const active = rows.filter(b => b.is_active !== 0)
          if (active.length === 1) id = active[0].id
        }
        if (id !== prev) localStorage.setItem('selectedBranchId', id != null ? String(id) : '')
        return id
      })
    }).catch(() => { })
    api.get('/invoice-settings').then(({ data }) => {
      if (data?.settings?.store_phone) setStorePhone(data.settings.store_phone)
    }).catch(() => { })
  }, [])

  useEffect(() => {
    // Check for editing mode when coming back from admin/invoices
    if (!route.startsWith('#/admin')) {
      const stored = localStorage.getItem('editing_invoice')
      if (stored) {
        try {
          const data = JSON.parse(stored)
          setEditingInvoiceData(data)
          // Load into cart
          const gamesItems = (data.items || []).filter(it => it.type === 'game' || it.type === 'package' || (!it.type && it.size_gb !== undefined))
          const servicesItems = (data.items || []).filter(it => it.type === 'service' || (!it.type && it.size_gb === undefined))

          setCart(gamesItems)
          setServicesCart(servicesItems)
          setCustomerPhone(data.customer_phone || '')
          setCustomerName(data.customer_name || '')
        } catch (e) {
          console.error('Failed to parse editing_invoice', e)
        }
      }
    }
  }, [route])

  // Listen for edit-invoice custom event (no page refresh needed)
  useEffect(() => {
    const handleEditInvoice = (e) => {
      const data = e.detail
      if (data) {
        localStorage.setItem('editing_invoice', JSON.stringify(data))
        setEditingInvoiceData(data)
        const gamesItems = (data.items || []).filter(it => it.type === 'game' || it.type === 'package' || (!it.type && it.size_gb !== undefined))
        const servicesItems = (data.items || []).filter(it => it.type === 'service' || (!it.type && it.size_gb === undefined))
        setCart(gamesItems)
        setServicesCart(servicesItems)
        setCustomerPhone(data.customer_phone || '')
        setCustomerName(data.customer_name || '')
        setShowInvoice(true)
      }
    }
    window.addEventListener('edit-invoice', handleEditInvoice)
    return () => window.removeEventListener('edit-invoice', handleEditInvoice)
  }, [])

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onHash)

    // الاستماع للتحديثات الفورية
    const handleGameAdded = (data) => {
      console.log('🎮 لعبة جديدة:', data.message);
      setGames(prevGames => [data.game, ...prevGames]);
      if (Notification.permission === 'granted') {
        new Notification('لعبة جديدة', {
          body: `تم إضافة: ${data.game.title}`,
          icon: '/favicon.svg'
        });
      }
    };

    socket.on('game_added', handleGameAdded);

    return () => {
      window.removeEventListener('hashchange', onHash);
      socket.off('game_added', handleGameAdded);
    };
  }, [])

  useEffect(() => {
    api.get('/categories', { params: { public: 1 } }).then(r => {
      const data = Array.isArray(r.data) ? r.data : []
      setCategories(data);
      if (!activeCategory && data.length) {
        // Auto-select PS4 category if exists, otherwise first category
        const ps4Category = data.find(c => (c.name || '').toLowerCase().includes('ps4'))
        setActiveCategory(String(ps4Category?.id || data[0].id))
      }
    })
  }, [])

  // قوائم الأنواع والسلاسل العامة من قاعدة البيانات (نفس قيم لوحة التحكم)
  useEffect(() => {
    api.get('/genres').then(r => setGenreOptions(Array.isArray(r.data) ? r.data : [])).catch(() => { })
    api.get('/series').then(r => setSeriesOptions(Array.isArray(r.data) ? r.data : [])).catch(() => { })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350)
    return () => clearTimeout(timer)
  }, [query])

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleGameCount(24)
  }, [debouncedQuery, activeCategory, genreFilter, seriesFilter, letterFilter, minPrice, maxPrice])

  useEffect(() => {
    const controller = new AbortController()
    const params = {}
    if (debouncedQuery) params.q = debouncedQuery
    if (activeCategory) params.category = activeCategory
    if (minPrice) params.minPrice = minPrice
    if (maxPrice) params.maxPrice = maxPrice
    setGamesLoading(true)
    api.get('/games', { params, signal: controller.signal })
      .then(r => setGames(Array.isArray(r.data) ? r.data : []))
      .catch(e => { if (e?.name !== 'CanceledError' && e?.code !== 'ERR_CANCELED') setGames([]) })
      .finally(() => setGamesLoading(false))
    return () => controller.abort()
  }, [debouncedQuery, activeCategory, minPrice, maxPrice])

  useEffect(() => {
    if (activeCategory) {
      api.get(`/packages/active/${activeCategory}`)
        .then(r => setPackages(r.data?.packages || []))
        .catch(() => setPackages([]))
    }
  }, [activeCategory])

  // Heuristic classification (title/description) → genre, series, split-screen
  function classifyGame(g) {
    const t = (g.title || '').toLowerCase()
    const d = (g.description || '').toLowerCase()
    const text = `${t} ${d}`

    // detect series
    const seriesMap = [
      ['resident evil', 'resident evil'],
      ['res evil', 'resident evil'],
      ['god of war', 'god of war'],
      ['call of duty', 'call of duty'],
      ['black ops', 'call of duty'],
      ['modern warfare', 'call of duty'],
      ['assassin\'s creed', 'assassin\'s creed'],
      ['fifa', 'ea sports fc'],
      ['fc 2', 'ea sports fc'],
      ['ea sports fc', 'ea sports fc'],
      ['need for speed', 'need for speed'],
      ['gta', 'grand theft auto'],
      ['grand theft auto', 'grand theft auto'],
      ['mortal kombat', 'mortal kombat'],
      ['street fighter', 'street fighter'],
      ['tekken', 'tekken'],
      ['spider-man', 'spider-man'],
      ['uncharted', 'uncharted'],
      ['far cry', 'far cry'],
      ['battlefield', 'battlefield'],
      ['horizon zero dawn', 'horizon'],
      ['horizon forbidden west', 'horizon'],
      ['the last of us', 'the last of us'],
    ]
    let series = ''
    for (const [key, val] of seriesMap) { if (text.includes(key)) { series = val; break } }

    // detect split-screen / local coop (explicit titles + generic keywords)
    const splitKnown = /(a\s*way\s*out|it\s*takes\s*two|overcooked|tools\s*up|lego\s+|borderlands|diablo\s*iii|diablo\s*3)/i.test(text)
    const splitGeneric = /(split\s*-?\s*screen|local\s*coop|couch\s*coop|co-?op|local\s*multiplayer|شاشة\s*منقسمة|تعاوني)/i.test(text)
    const split = splitKnown || splitGeneric

    // special-case corrections
    if (/telltale/.test(text)) {
      // Batman Telltale is an adventure/interactive story
      return { genre: 'adventure', series, split }
    }
    if (/avatar\s*:\s*the\s*last\s*airbender.*quest\s*for\s*balance/i.test(text)) {
      return { genre: 'adventure', series, split }
    }

    // detect genre (simple keywords, Arabic+English)
    // Important: order matters. Detect highly-specific genres first
    const genreRules = [
      // Sports first to avoid mislabeling EA FC
      ['sports', /(ea\s*sports\s*fc|\bfc\s*\d+\b|fifa|pes|efootball|nba|\bsports\b|كرة|قدم|رياضة)/i],
      // Racing early with strong Arabic cues (هجولة/تفحيط)
      ['racing', /(race|racing|drift|need\s*for\s*speed|nfs|\bcar\b|\bcars\b|gran\s*turismo|سباق|سيارات|هجولة|تفحيط)/i],
      // Shooter BEFORE horror to catch Call of Duty correctly
      ['shooter', /(shooter|fps|call\s*of\s*duty|modern\s*warfare|black\s*ops|battlefield|\bgun\b|warfare|تصويب)/i],
      // Horror with more specific patterns
      ['horror', /(\bhorror\b|zombie|resident\s*evil|biohazard|silent\s*hill|until\s*dawn|خوف|رعب)/i],
      // Fighting games (specific franchises)
      ['fighting', /(mortal\s*kombat|street\s*fighter|tekken|dragon\s*ball.*kakarot|قتال|fighting|brawl)/i],
      // adventure: broaden to include well-known adventure IPs
      ['adventure', /(adventure|مغامرة|uncharted|tomb\s*raider|life\s*is\s*strange|prince\s*of\s*persia)/i],
      ['puzzle', /(puzzle|لغز|ألغاز|brain|logic)/i],
      // Use 'platformer' or 'platform game' to avoid matching 'platforms' (منصات remains in Arabic)
      ['platformer', /(platformer|platform\s*game|mario|crash\s*bandicoot|jump|منصات)/i],
      ['open world', /(open\s*world|gta|grand\s*theft\s*auto|cyberpunk|عالم\s*مفتوح)/i],
      ['stealth', /(stealth|assassin|hitman|metal\s*gear|خفاء|تخفي)/i],
      // Tighten strategy to avoid false positives from generic words
      ['strategy', /(\bstrategy\b|\bstrategic\b|استراتيجية|tactics?\b|تكتيك(ي)?)/i],
      ['rpg', /(rpg|role\s*playing|witcher|elden\s*ring|dragon|souls|final\s*fantasy)/i],
      ['kids', /(kids|اطفال|عائلة|family)/i],
      ['action', /(action|اكشن|god\s*of\s*war|spider-?man|ghost\s*of\s*tsushima)/i],
    ]
    let genre = ''
    for (const [name, rx] of genreRules) { if (rx.test(text)) { genre = name; break } }

    return { genre, series, split }
  }

  function fromStored(g) {
    // read stored
    let split = false
    if (g.features) {
      try {
        let f = typeof g.features === 'string' ? JSON.parse(g.features) : g.features
        if (!Array.isArray(f)) f = []
        split = f.some(v => String(v).toLowerCase().includes('split'))
      } catch {
        split = String(g.features).toLowerCase().includes('split')
      }
    }
    // Normalize database values (preferred source of truth)
    // Convert Arabic genre names to English for consistent filtering
    const storedGenre = normalizeGenre(g.genre)
    const storedSeries = normalizeSeries(g.series)
    // derive genre/split (but never auto-infer series)
    const derived = classifyGame(g)
    const genre = storedGenre || derived.genre || ''
    const series = storedSeries || ''
    const finalSplit = split || derived.split
    return { genre, series, split: finalSplit }
  }
  const classifiedGames = useMemo(() => games.map(g => {
    const stored = fromStored(g)
    return { ...g, _cls: stored }
  }), [games])
  const displayedGames = useMemo(() => {
    // filter
    // Normalize filter values for case-insensitive comparison
    const normalizedGenreFilter = genreFilter ? genreFilter.toLowerCase().trim() : ''
    const normalizedSeriesFilter = seriesFilter ? seriesFilter.toLowerCase().trim() : ''

    let out = classifiedGames.filter(g => {
      // Genre filter
      if (normalizedGenreFilter === '__others__') {
        if (g._cls && g._cls.genre) return false
      } else if (normalizedGenreFilter && (!g._cls || !g._cls.genre || g._cls.genre !== normalizedGenreFilter)) {
        return false
      }
      // Series filter
      if (normalizedSeriesFilter && (!g._cls || !g._cls.series || g._cls.series !== normalizedSeriesFilter)) {
        return false
      }
      // Split screen filter
      if (splitOnly && (!g._cls || !g._cls.split)) return false
      // Letter filter
      if (letterFilter) {
        const first = (g.title || '').trim().charAt(0).toUpperCase()
        if (letterFilter === '#') {
          if (/[A-Z]/i.test(first)) return false
        } else if (first !== letterFilter) return false
      }
      return true
    })
    // sort alphabetically by title
    out.sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }))
    return out
  }, [classifiedGames, genreFilter, seriesFilter, splitOnly, letterFilter])

  // All cards same size - aspect ratio detection disabled
  // useEffect(() => {
  //   const images = document.querySelectorAll('.game-card-image')
  //   images.forEach(img => {
  //     if (img.complete) {
  //       applyAspectRatioClass(img)
  //     } else {
  //       img.addEventListener('load', () => applyAspectRatioClass(img))
  //     }
  //   })

  //   function applyAspectRatioClass(img) {
  //     const card = img.closest('.game-card')
  //     if (!card) return

  //     const aspectRatio = img.naturalWidth / img.naturalHeight

  //     // Remove existing aspect classes
  //     card.classList.remove('card-wide', 'card-tall', 'card-square')

  //     // Apply new class based on aspect ratio
  //     if (aspectRatio > 1.3) {
  //       card.classList.add('card-wide') // Wide/horizontal images
  //     } else if (aspectRatio < 0.7) {
  //       card.classList.add('card-tall') // Tall/vertical images
  //     } else {
  //       card.classList.add('card-square') // Square-ish images
  //     }
  //   }
  // }, [displayedGames])

  // helpers for UI polish
  function toTitleCase(ar) {
    if (!ar) return ''
    return ar.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ')
  }
  function genreClass(genre) {
    switch (genre) {
      case 'horror': return 'bg-red-900/30 text-red-300 border-red-500/30'
      case 'action': return 'bg-orange-900/30 text-orange-300 border-orange-500/30'
      case 'adventure': return 'bg-amber-900/30 text-amber-300 border-amber-500/30'
      case 'sports': return 'bg-green-900/30 text-green-300 border-green-500/30'
      case 'racing': return 'bg-cyan-900/30 text-cyan-300 border-cyan-500/30'
      case 'puzzle': return 'bg-fuchsia-900/30 text-fuchsia-300 border-fuchsia-500/30'
      case 'platformer': return 'bg-pink-900/30 text-pink-300 border-pink-500/30'
      case 'open world': return 'bg-teal-900/30 text-teal-300 border-teal-500/30'
      case 'stealth': return 'bg-slate-900/30 text-slate-300 border-slate-500/30'
      case 'fighting': return 'bg-purple-900/30 text-purple-300 border-purple-500/30'
      case 'strategy': return 'bg-blue-900/30 text-blue-300 border-blue-500/30'
      case 'shooter': return 'bg-indigo-900/30 text-indigo-300 border-indigo-500/30'
      case 'rpg': return 'bg-yellow-900/30 text-yellow-300 border-yellow-500/30'
      case 'kids': return 'bg-emerald-900/30 text-emerald-300 border-emerald-500/30'
      default: return 'bg-white/5 text-gray-300 border-white/10'
    }
  }

  // Arabic labels for genres (used in the filter select)
  const genreArLabels = {
    'adventure': 'مغامرات',
    'racing': 'سباق',
    'puzzle': 'ألغاز',
    'platformer': 'منصات',
    'horror': 'رعب',
    'shooter': 'تصويب',
    'sports': 'رياضة',
    'open world': 'عالم مفتوح',
    'strategy': 'استراتيجية',
    'rpg': 'تقمص أدوار',
    'kids': 'ألعاب أطفال',
    'action': 'أكشن',
    'stealth': 'تخفي',
    'fighting': 'قتال',
  }

  // Reverse map: Arabic → English for display filtering
  const genreFromArabic = useMemo(() => {
    const map = {}
    for (const [en, ar] of Object.entries(genreArLabels)) {
      map[ar] = en
    }
    return map
  }, [])

  const total = useMemo(() =>
    cart.reduce((sum, g) => sum + (Number(g.price) || 0), 0) +
    servicesCart.reduce((sum, s) => sum + (Number(s.price) || 0), 0),
    [cart, servicesCart]
  )
  const totalSize = useMemo(() =>
    cart.reduce((sum, g) => sum + (Number(g.size_gb) || 0), 0),
    [cart]
  )
  const combinedCartForInvoice = useMemo(() =>
    [
      // يشمل معرّف اللعبة الرقمي فقط (يتجاهل معرّفات الباقات pkg_*) حتى تُحتسب المبيعات في الإحصائيات
      ...cart.map(g => ({
        ...(g.id !== undefined && g.id !== null && String(g.id).trim() !== '' && !String(g.id).startsWith('pkg_') ? { id: g.id } : {}),
        title: g.title, price: Number(g.price) || 0, size_gb: Number(g.size_gb) || 0, type: g.type || 'game', items: g.packageGames
      })),
      ...servicesCart.map(s => ({ title: s.title, price: Number(s.price) || 0, type: 'service' }))
    ],
    [cart, servicesCart]
  )

  let _audioCtx = null
  function playAddFeedback() {
    try {
      if ('vibrate' in navigator) navigator.vibrate([20])
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        if (!_audioCtx || _audioCtx.state === 'closed') _audioCtx = new AudioCtx()
        if (_audioCtx.state === 'suspended') _audioCtx.resume()
        const osc = _audioCtx.createOscillator()
        const gain = _audioCtx.createGain()
        osc.type = 'square'
        osc.frequency.value = 880
        gain.gain.value = 0.04
        osc.connect(gain)
        gain.connect(_audioCtx.destination)
        osc.start()
        setTimeout(() => { try { osc.stop() } catch (_) { } }, 120)
      }
    } catch (_) { }
  }

  function addToCart(game) {
    setCart(prev => [...prev, game])
    playAddFeedback()
  }
  function addToCartPackage(pkg) {
    const pkgSize = pkg.packageGames ? pkg.packageGames.reduce((acc, g) => acc + (Number(g.size_gb) || 0), 0) : 0;
    setCart(prev => [...prev, { id: 'pkg_' + pkg.id, title: pkg.name, price: pkg.price, size_gb: pkgSize, type: 'package', packageGames: pkg.packageGames }]);
    playAddFeedback()
  }
  function removeFromCart(index) { setCart(prev => prev.filter((_, i) => i !== index)) }
  function addToServicesCart(service) {
    setServicesCart(prev => [...prev, { id: service.id, title: service.title, price: service.price }])
    playAddFeedback()
  }
  function removeFromServicesCart(index) { setServicesCart(prev => prev.filter((_, i) => i !== index)) }

  // تحديد فرع لإرسال الطلب عبر واتساب (كل فرع له رقم مستقل) مع الحفظ محلياً
  function selectBranch(id) {
    setSelectedBranchId(id)
    if (id === null || id === undefined) localStorage.removeItem('selectedBranchId')
    else localStorage.setItem('selectedBranchId', String(id))
  }

  // حالة إرسال الطلب عبر واتساب: يتطلب فرعاً محدداً برقم هاتف
  const selectedBranch = branches.find(b => String(b.id) === String(selectedBranchId)) || null
  const selectedBranchPhone = selectedBranch?.phone?.trim() || ''
  const canSendWhatsApp = !!(selectedBranchPhone || (!branches.length && storePhone.trim()))
  const whatsAppHint = (() => {
    if (hasToken && !isGuestMode) return 'سيتم إنشاء فاتورة وطباعتها'
    if (canSendWhatsApp) return selectedBranch ? `سيتم فتح واتساب لإرسال طلبك إلى ${selectedBranch.name}` : 'سيتم فتح واتساب لإرسال طلبك'
    if (branches.length === 0) return 'لا يوجد رقم واتساب متاح حالياً'
    if (selectedBranch && !selectedBranchPhone) return 'الفرع المحدد بدون رقم هاتف — اختر فرعاً آخر'
    return 'اختر الفرع لإرسال الطلب'
  })()

  async function sendOrder() {
    if (cart.length === 0 && servicesCart.length === 0) return showToast('السلة فارغة', 'error')
    if (!hasToken || isGuestMode) {
      // Guest: send via WhatsApp
      sendWhatsAppOrder()
      return
    }
    setShowInvoice(true)
  }

  function sendWhatsAppOrder() {
    if (cart.length === 0 && servicesCart.length === 0) return

    const branch = branches.find(b => String(b.id) === String(selectedBranchId)) || null
    const branchPhone = branch?.phone?.trim() || ''
    const orderPhone = branchPhone || storePhone
    if (!orderPhone) {
      showToast('اختر الفرع لإرسال الطلب', 'error')
      return
    }

    let msg = '🎮 *طلب ألعاب من متجر النفار*\n'
    msg += `🏬 *الفرع:* ${branch ? branch.name : 'الفرع الرئيسي'}\n`
    msg += '━━━━━━━━━━━━━━━━━━━━\n\n'

    if (cart.length > 0) {
      msg += '📦 *الألعاب:*\n'
      cart.forEach((g, i) => {
        msg += `${i + 1}. ${g.title}\n`
        msg += `   💰 ${currency(g.price)} | 📀 ${g.size_gb || 0} GB\n`
      })
    }

    if (servicesCart.length > 0) {
      msg += '\n🔧 *الخدمات:*\n'
      servicesCart.forEach((s, i) => {
        msg += `${i + 1}. ${s.title}\n`
        msg += `   💰 ${currency(s.price)}\n`
      })
    }

    msg += '\n━━━━━━━━━━━━━━━━━━━━\n'
    msg += `📀 *مجموع الحجم:* ${totalSize.toFixed(2)} GB\n`
    msg += `💰 *الإجمالي:* ${currency(total)}\n`
    msg += '━━━━━━━━━━━━━━━━━━━━\n'
    msg += '\n⏳ *ملاحظة:* يرجى تأكيد الطلب وتحديد موعد التثبيت'

    const phone = formatWhatsAppPhone(orderPhone)
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  const cancelEdit = () => {
    localStorage.removeItem('editing_invoice')
    setEditingInvoiceData(null)
    setCart([])
    setServicesCart([])
    setCustomerPhone('')
    setCustomerName('')
  }

  const handleInvoiceSuccess = (invoice) => {
    // If we are NOT editing, clear the cart. 
    // If we ARE editing, we keep the items so we can add more to the SAME invoice.
    if (!editingInvoiceData) {
      setCart([])
      setServicesCart([])
      setCustomerPhone('')
      setCustomerName('')
    }
    setShowInvoice(false)
    setEditingInvoiceData(null)
    localStorage.removeItem('editing_invoice')
  }

  const handleInvoiceClose = () => {
    setShowInvoice(false)
  }

  async function submitLogin(e) {
    e.preventDefault()
    try {
      setLoginLoading(true)
      const { data } = await api.post('/auth/login', loginForm)
      setAuthToken(data.token)
      localStorage.removeItem('isGuest')
      setIsGuestMode(false)
      setShowLogin(false)
      // البقاء في واجهة المتجر بعد تسجيل الدخول بدلاً من التوجيه للوحة التحكم
    } catch {
      showToast('بيانات الدخول غير صحيحة', 'error')
    } finally {
      setLoginLoading(false)
    }
  }

  if (route.startsWith('#/admin')) return <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="loading-spinner"></div></div>}><Admin /></Suspense>

  if (route.startsWith('#/track/')) {
    const orderIdPattern = route.replace('#/track/', '').split('?')[0]
    return <OrderTracking orderId={orderIdPattern} />
  }

  // حماية المتجر: يجب تسجيل الدخول للوصول إلى نقطة البيع
  if (!hasToken && !isGuestMode && !showLogin) {
    return (
      <div className="min-h-screen bg-base text-white relative overflow-hidden flex items-center justify-center p-4 sm:p-6">
        {/* Animated ambient background */}
        <div aria-hidden="true" className="fixed inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-32 w-[55%] h-[55%] rounded-full blur-[150px] animate-pulse" style={{ background: 'rgba(20,184,166,0.18)' }}></div>
          <div className="absolute -bottom-40 -left-32 w-[55%] h-[55%] rounded-full blur-[150px] animate-pulse" style={{ background: 'rgba(16,185,129,0.12)', animationDelay: '1.5s' }}></div>
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[35%] h-[35%] rounded-full blur-[130px] animate-pulse" style={{ background: 'rgba(59,130,246,0.08)', animationDelay: '3s' }}></div>
        </div>

        <div className="relative z-10 w-full max-w-4xl grid lg:grid-cols-2 rounded-3xl overflow-hidden border border-white/10 shadow-2xl" style={{ background: 'rgba(17,24,39,0.55)', backdropFilter: 'blur(20px)' }}>
          {/* Brand panel (desktop) */}
          <div className="hidden lg:flex flex-col justify-between p-8 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, rgba(20,184,166,0.16), rgba(15,23,42,0.4) 55%, rgba(15,23,42,0.7))' }}>
            <div className="absolute -top-16 -left-16 w-48 h-48 bg-primary/20 rounded-full blur-3xl" aria-hidden="true"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-14 h-14 rounded-2xl bg-white/95 flex items-center justify-center shadow-lg shrink-0">
                  <img src={logo} alt="شعار متجر النفار" className="w-11 h-11 object-contain" />
                </div>
                <div>
                  <p className="text-lg font-extrabold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">متجر النفار</p>
                  <p className="text-xs text-gray-400">نقطة البيع ونظام الألعاب</p>
                </div>
              </div>
              <h2 className="text-2xl font-extrabold leading-snug mb-3">كل ألعابك في مكان واحد</h2>
              <p className="text-sm text-gray-400 leading-relaxed">سجّل الدخول لإدارة الطلبات والفواتير، أو تصفّح كضيف وأرسل طلبك مباشرة عبر واتساب.</p>

              <ul className="mt-8 space-y-4">
                {[
                  { d: 'M4 6h16M4 12h16M4 18h10', t: 'مكتبة ألعاب محدّثة لحظيًا' },
                  { d: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', t: 'سلة وطلب فوري عبر واتساب' },
                  { d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', t: 'فواتير وتقارير دقيقة' },
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-200">
                    <span className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
                      <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d={f.d} /></svg>
                    </span>
                    {f.t}
                  </li>
                ))}
              </ul>
            </div>
            <p className="relative text-xs text-gray-500 mt-10">الشاردة للإلكترونات — شارع القضائية</p>
          </div>

          {/* Form panel */}
          <div className="p-6 sm:p-8">
            <div className="lg:hidden flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/95 flex items-center justify-center shadow-lg mb-3">
                <img src={logo} alt="شعار متجر النفار" className="w-12 h-12 object-contain" />
              </div>
              <h1 className="text-xl font-extrabold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">متجر النفار</h1>
              <p className="text-xs text-gray-400 mt-1">اختر ألعابك المفضلة واطلبها بسهولة</p>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">تسجيل الدخول</h2>
              <p className="text-sm text-gray-400">للوصول إلى نظام نقطة البيع</p>
            </div>

            <form onSubmit={submitLogin} className="space-y-4">
              <div>
                <label htmlFor="login-username" className="block text-xs font-medium text-gray-400 mb-1.5 text-right">اسم المستخدم</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-500 pointer-events-none" aria-hidden="true">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0v.75H4.5v-.75z" /></svg>
                  </span>
                  <input
                    id="login-username"
                    className="w-full border border-gray-700/60 bg-gray-800/60 text-white rounded-xl pr-11 pl-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-base transition-all min-h-[48px]"
                    placeholder="أدخل اسم المستخدم"
                    value={loginForm.username}
                    onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                    autoComplete="username"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="login-password" className="block text-xs font-medium text-gray-400 mb-1.5 text-right">كلمة المرور</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-500 pointer-events-none" aria-hidden="true">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5A2.25 2.25 0 0019.5 19.5v-6.75A2.25 2.25 0 0017.25 10.5H6.75A2.25 2.25 0 004.5 12.75v6.75A2.25 2.25 0 006.75 21.75z" /></svg>
                  </span>
                  <input
                    id="login-password"
                    className="w-full border border-gray-700/60 bg-gray-800/60 text-white rounded-xl pr-11 pl-11 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-base transition-all min-h-[48px]"
                    placeholder="أدخل كلمة المرور"
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-3.5 rounded-xl bg-gradient-to-r from-primary to-emerald-600 hover:from-primary-dark hover:to-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 min-h-[48px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true"></span> جارٍ الدخول...</>
                ) : (
                  <>تسجيل الدخول
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                  </>
                )}
              </button>

              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                <div className="relative flex justify-center text-xs"><span className="px-3 text-gray-500" style={{ background: 'rgba(17,24,39,0.6)' }}>أو</span></div>
              </div>

              <button
                type="button"
                onClick={() => { localStorage.setItem('isGuest', 'true'); setIsGuestMode(true); }}
                className="w-full px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white transition-all font-bold flex items-center justify-center gap-2 min-h-[48px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                تصفح كضيف
              </button>
              <p className="text-center text-xs text-gray-500">أضف الألعاب للسلة ثم أرسل الطلب عبر واتساب</p>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Compute current value for the genre select (to support split-only special option)
  const genreSelectValue = splitOnly ? '__split__' : (genreFilter || '')

  return (
    <div className="min-h-screen bg-base text-white safe-area-inset">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-black border-b border-white/10 sticky top-0 z-50 safe-area-inset">
        {editingInvoiceData && (
          <div className="bg-yellow-600 text-black px-4 py-2 flex items-center justify-between text-xs sm:text-sm font-bold">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
              </svg>
              <span>تعديل الفاتورة رقم: {editingInvoiceData.invoice_number}</span>
            </div>
            <button
              onClick={cancelEdit}
              className="bg-black/20 hover:bg-black/40 px-3 py-1 rounded-md border border-black/10 transition-colors"
            >
              إلغاء التعديل
            </button>
          </div>
        )}
        <div className="w-full px-3 min-[400px]:px-4 sm:px-4 md:px-5 lg:px-6 xl:px-8 max-w-[100vw]">
          {/* Top row - Logo, Cart (mobile), Login */}
          <div className="h-12 min-[400px]:h-14 sm:h-16 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-[400px]:gap-3 min-w-0">
              <img src={logo} alt="Logo" className="h-7 w-7 min-[400px]:h-8 min-[400px]:w-8 sm:h-10 sm:w-10 flex-shrink-0" />
              <h1 className="text-base min-[400px]:text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent truncate">
                متجر النفار
              </h1>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              {/* Mobile Cart Icon */}
              {(hasToken || isGuestMode) && (
              <button
                onClick={() => setShowMobileCart(true)}
                className="relative p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-colors touch-target lg:hidden"
                aria-label="السلة"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {(cart.length > 0 || servicesCart.length > 0) && (
                  <span className="absolute -top-1 -right-1 bg-primary text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.length + servicesCart.length}
                  </span>
                )}
              </button>
              )}

              {hasToken ? (
                <button
                  onClick={() => { window.location.hash = '#/admin' }}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm bg-primary/20 hover:bg-primary/30 text-primary px-3 py-2.5 min-h-[44px] rounded-lg transition-colors touch-target font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.003-.827c.294-.24.44-.613.432-.992a6.759 6.759 0 010-.255c.007-.378-.138-.75-.431-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.213-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  لوحة التحكم
                </button>
              ) : isGuestMode ? (
                <button
                  onClick={() => { localStorage.removeItem('isGuest'); setIsGuestMode(false); }}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-3 py-2.5 min-h-[44px] rounded-lg transition-colors touch-target font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  ضيف
                </button>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="text-xs sm:text-sm bg-white/10 hover:bg-white/20 px-3 py-2.5 min-h-[44px] rounded-lg transition-colors touch-target"
                >
                  تسجيل دخول
                </button>
              )}
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="pb-3 md:hidden">
            <input
              type="search"
              enterKeyHint="search"
              aria-label="ابحث عن لعبة"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="ابحث عن لعبة..."
              className="w-full bg-white/5 border border-white/10 text-white placeholder:text-gray-300 rounded-xl px-4 py-2.5 min-h-[44px] text-base focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 focus:outline-none transition-all"
            />
          </div>

          {/* Navigation - تمرير أفقي على الهاتف */}
          <div className="pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-hide nav-scroll">
            <nav className="flex items-center gap-2 sm:gap-3 min-w-max py-0.5">
              {(categories || []).map((c) => {
                const isActive = String(activeCategory) === String(c.id)
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory(c.id)}
                    className={`whitespace-nowrap px-4 py-2 text-sm sm:text-base font-bold rounded-xl transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${
                      isActive
                        ? 'bg-gradient-to-r from-[color:var(--brand)] to-emerald-500 text-white shadow-lg shadow-teal-500/25'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                  >
                    {c.name}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Guest Mode Banner */}
      {isGuestMode && !hasToken && (
        <div className="bg-gradient-to-r from-emerald-900/60 to-green-900/40 border-b border-emerald-500/30 px-4 py-2 text-center">
          <p className="text-emerald-200 text-xs sm:text-sm inline-flex items-center justify-center gap-1.5">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            أنت تتصفح كضيف — أضف الألعاب للسلة ثم أرسل الطلب عبر واتساب
          </p>
        </div>
      )}

      {/* Hero */}
      <section className="bg-gradient-to-r from-base to-black">
        <div className="w-full px-3 min-[400px]:px-4 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-4 min-[400px]:py-5 sm:py-6 md:py-8 lg:py-10">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 items-center">
            <div className="order-2 md:order-1">
              <h1 className="text-xl min-[400px]:text-2xl sm:text-3xl md:text-4xl font-extrabold mb-1.5 sm:mb-2 text-center md:text-right bg-gradient-to-r from-white via-teal-100 to-teal-300 bg-clip-text text-transparent">اختر الألعاب التي تريدها</h1>
              <p className="text-gray-400 text-sm sm:text-base mb-3 text-center md:text-right">تصفّح المكتبة، أضف للسلة، وأكمل طلبك بسهولة.</p>

              {/* فروعنا — اختيار الفرع مقصور على الضيوف/غير المسجّلين؛ المسجّل تُنشأ فاتورته على فرعه */}
              {(!hasToken || isGuestMode) ? (
                branches.length > 0 ? (
                <>
                  <div className="flex items-center gap-1.5 mb-2 text-center md:text-right justify-center md:justify-start">
                    <svg className="w-3.5 h-3.5 text-primary/70" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                    <p className="text-gray-400 text-xs font-medium">اختر فرعك لإرسال الطلب عبر واتساب</p>
                  </div>
                  <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2 sm:gap-3 mb-4">
                    {branches.map(b => {
                      const selectedHero = String(b.id) === String(selectedBranchId)
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => selectBranch(b.id)}
                          aria-pressed={selectedHero}
                          className={`text-right rounded-xl p-3 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/60 ${selectedHero
                            ? 'bg-teal-500/10 border border-teal-500/70 ring-2 ring-teal-500/40 shadow-[0_0_18px_rgba(20,184,166,0.15)]'
                            : 'bg-white/5 border border-white/10 hover:border-white/25 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className={`font-bold text-sm truncate ${selectedHero ? 'text-teal-300' : 'text-white'}`}>{b.name}</h3>
                            <span className="flex items-center gap-1.5 shrink-0">
                              {!!b.is_main && <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">رئيسي</span>}
                              <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${selectedHero ? 'bg-teal-500 text-white' : 'bg-white/10 text-transparent'}`} style={{ width: '1.125rem', height: '1.125rem' }}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                              </span>
                            </span>
                          </div>
                          {b.address && (
                            <p className="text-gray-300 text-xs leading-relaxed mb-2 flex items-start gap-1.5">
                              <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary/70" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                              <span className="break-words">{b.address}</span>
                            </p>
                          )}
                          {b.phone && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-white transition-colors cursor-pointer" dir="ltr">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                              <span>{b.phone}</span>
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </>
                ) : (
                  <p className="text-gray-200 mb-4 text-sm sm:text-base text-center md:text-right leading-relaxed md:text-gray-100">موقع المحل: الشاردة للإلكترونات - شارع القضائية مقابل فضيل للبن</p>
                )
              ) : (
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-gray-900/40 backdrop-blur-md px-4 py-3 text-right">
                  <span className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                  </span>
                  <p className="text-sm text-gray-200 leading-relaxed">سيتم إنشاء الفاتورة على فرع حسابك</p>
                </div>
              )}

              {/* Desktop Search */}
              <div className="hidden md:block mb-4">
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="ابحث عن لعبة..."
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 focus:outline-none transition-all"
                />
              </div>

              {/* Filters - Mobile optimized */}
              <div className="rounded-2xl border border-white/10 bg-gray-900/40 backdrop-blur-md p-3 sm:p-4 space-y-3">
                <div className="flex items-center gap-2 text-gray-300">
                  <svg className="w-4 h-4 text-[color:var(--brand)]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" /></svg>
                  <span className="text-xs font-bold">تصفية النتائج</span>
                </div>
                {/* Price filters */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <input
                    type="number"
                    placeholder="الحد الأدنى"
                    aria-label="الحد الأدنى"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder:text-gray-300 text-sm sm:text-base"
                  />
                  <input
                    type="number"
                    placeholder="الحد الأقصى"
                    aria-label="الحد الأقصى"
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder:text-gray-300 text-sm sm:text-base"
                  />
                </div>

                {/* Genre and Series filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <select
                    value={genreSelectValue}
                    onChange={e => {
                      const v = e.target.value
                      if (v === '__split__') { setSplitOnly(true); setGenreFilter('') }
                      else { setSplitOnly(false); setGenreFilter(v) }
                    }}
                    aria-label="تصفية حسب النوع"
                    className="w-full cursor-pointer bg-gray-950 border border-gray-700/50 rounded-xl px-3 py-2.5 text-white appearance-none text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                  >
                    <option value="">كل الأنواع</option>
                    <option value="__split__">تقسيم الشاشة</option>
                    <option value="__others__">أخرى</option>
                    {genreOptions.filter(g => g !== 'تقسيم الشاشة' && g !== 'أخرى').map(g => (
                      <option key={g} value={normalizeGenre(g)}>{genreArLabels[normalizeGenre(g)] || g}</option>
                    ))}
                  </select>

                  <select
                    value={seriesFilter}
                    onChange={e => setSeriesFilter(e.target.value)}
                    aria-label="تصفية حسب السلسلة"
                    className="w-full cursor-pointer bg-gray-950 border border-gray-700/50 rounded-xl px-3 py-2.5 text-white appearance-none text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                  >
                    <option value="">كل السلاسل</option>
                    {seriesOptions.map(s => (
                      <option key={s} value={normalizeSeries(s)}>{toTitleCase(s)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <ImageSlider />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="w-full px-3 min-[400px]:px-4 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-4 min-[400px]:py-5 sm:py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_320px] 2xl:grid-cols-[1fr_380px] gap-4 sm:gap-6 lg:gap-8">
          <section className="w-full">
            {/* فهرس A–Z — صف واحد قابل للتمرير مع أهداف لمس مضغوطة (no-touch-resize) */}
            <div className="mb-2 min-[400px]:mb-3 sm:mb-4 -mx-3 px-3 overflow-x-auto nav-scroll">
              <div className="flex items-center gap-1 min-w-max py-0.5" role="group" aria-label="فهرس الحروف">
                {['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map(ch => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setLetterFilter(prev => prev === ch ? '' : ch)}
                    aria-label={`تصفية بالحرف ${ch}`}
                    aria-pressed={letterFilter === ch}
                    className={`no-touch-resize shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${letterFilter === ch
                      ? 'bg-primary text-black border-transparent shadow-md'
                      : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
              {letterFilter && (
                <button
                  onClick={() => setLetterFilter('')}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-white/5 text-white border border-white/10 hover:bg-white/10 text-xs sm:text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                >
                  مسح الفهرس
                </button>
              )}
            </div>

            {/* قسم الخدمات - متجاوب */}
            {services.length > 0 && (
              <div className="mb-4 sm:mb-6 p-3 min-[400px]:p-4 rounded-xl bg-card border border-white/10">
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3">الخدمات</h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {services.map((s) => (
                    <div key={s.id} className="flex flex-wrap items-center gap-2 px-3 py-2 min-[400px]:px-4 rounded-lg bg-white/10 border border-white/10 hover:border-primary/40 transition-colors">
                      <span className="text-white font-bold text-sm sm:text-base">{s.title}</span>
                      <span className="text-primary font-extrabold tabular-nums text-sm sm:text-base">{Number(s.price).toFixed(3)} د.ل</span>
                      {(hasToken || isGuestMode) && (
                      <button
                        onClick={() => addToServicesCart(s)}
                        className="px-3 py-2 min-h-[40px] bg-primary hover:bg-primary-dark text-black rounded-lg text-sm font-semibold touch-target"
                      >
                        إضافة
                      </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* قسم الباقات - متجاوب */}
            {packages.length > 0 && !query && !genreFilter && !seriesFilter && !letterFilter && (
              <div className="mb-4 sm:mb-6 p-3 min-[400px]:p-4 rounded-2xl bg-gradient-to-br from-indigo-950 via-purple-900/40 to-black border border-purple-500/30 shadow-2xl overflow-hidden relative">
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex items-center gap-2 mb-4 relative z-10">
                  <svg className="w-6 h-6 text-purple-400 animate-bounce duration-[3000ms]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">الباقات الخاصة</h3>
                  <span className="text-[10px] font-bold text-purple-200 bg-purple-600/50 px-2.5 py-1 rounded-full animate-pulse border border-purple-400/30 shadow-sm shadow-purple-900/50">
                    {packages.length} باقة
                  </span>
                </div>
                {/* Horizontal scroll on mobile, grid on larger */}
                <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:overflow-visible sm:pb-0 nav-scroll relative z-10">
                  {packages.map(pkg => (
                    <div key={pkg.id} className="min-w-[240px] max-w-[280px] sm:min-w-0 sm:max-w-none snap-start backdrop-blur-md bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex flex-col group hover:border-purple-400/50 transition-all duration-300 shadow-xl flex-shrink-0">
                      {/* Header with game thumbnails */}
                      <div className="p-2.5 sm:p-3 bg-gradient-to-r from-gray-800 to-gray-700 border-b border-white/5">
                        <div className="flex items-center gap-2 mb-1.5">
                          {pkg.packageGames?.slice(0, 3).map((g, i) => (
                            <img
                              key={g.id}
                              src={g.image}
                              alt=""
                              loading="lazy"
                              className={`w-7 h-7 sm:w-8 sm:h-8 object-cover rounded shadow-sm border border-gray-600 flex-shrink-0 ${i > 0 ? '-mr-2' : ''}`}
                              style={{ zIndex: 10 - i }}
                              referrerPolicy="no-referrer"
                            />
                          ))}
                          {pkg.packageGames?.length > 3 && (
                            <span className="text-[10px] text-gray-400 flex-shrink-0">+{pkg.packageGames.length - 3}</span>
                          )}
                        </div>
                        <h4 className="font-bold text-white text-sm sm:text-base leading-tight truncate">{pkg.name}</h4>
                        <p className="text-purple-400 font-bold tabular-nums text-sm mt-0.5">{Number(pkg.price).toFixed(2)} د.ل</p>
                      </div>
                      {/* Games summary */}
                      <div className="px-2.5 sm:px-3 py-2 flex-1">
                        <p className="text-[10px] sm:text-xs text-gray-400 mb-1 font-semibold">{pkg.packageGames?.length || 0} ألعاب</p>
                        <div className="space-y-0.5">
                          {pkg.packageGames?.slice(0, 2).map(g => (
                            <p key={g.id} className="text-[11px] text-gray-300 truncate">• {g.title}</p>
                          ))}
                          {pkg.packageGames?.length > 2 && (
                            <p className="text-[10px] text-gray-500">+ {pkg.packageGames.length - 2} أخرى</p>
                          )}
                        </div>
                      </div>
                      {/* Add button */}
                      <div className="p-3 sm:p-4 pt-0">
                        {(hasToken || isGuestMode) ? (
                        <button
                          onClick={() => addToCartPackage(pkg)}
                          className="w-full py-3 min-h-[48px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.96] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 touch-target border border-white/10"
                        >
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          أضف للسلة
                        </button>
                        ) : (
                        <button
                          onClick={() => setViewingPackage(pkg)}
                          className="w-full py-3 min-h-[48px] bg-white/10 hover:bg-white/20 active:scale-[0.96] text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 touch-target border border-white/20"
                        >
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          عرض الألعاب
                        </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="games-grid">
              {gamesLoading && (
                <div className="col-span-full grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3" aria-busy="true" aria-live="polite">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="skeleton-card h-64 rounded-2xl" aria-hidden="true" />
                  ))}
                  <span className="sr-only">جاري تحميل الألعاب…</span>
                </div>
              )}
              {!gamesLoading && displayedGames.length === 0 && (
                <div className="col-span-full text-gray-300 bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center py-12">
                  <p className="font-bold text-white mb-1">لا توجد نتائج مطابقة</p>
                  <p className="text-sm text-gray-400 mb-4">جرّب مسح الفلاتر أو البحث باسم آخر</p>
                  <button
                    onClick={() => { setQuery(''); setGenreFilter(''); setSeriesFilter(''); setLetterFilter(''); setMinPrice(''); setMaxPrice(''); setSplitOnly(false); }}
                    className="px-5 py-2.5 min-h-[44px] rounded-xl bg-primary hover:bg-primary-dark text-black font-bold cursor-pointer transition-colors duration-200"
                  >
                    مسح الفلاتر
                  </button>
                </div>
              )}
              {displayedGames.slice(0, visibleGameCount).map(game => {
                const categoryName = (categories || []).find(c => c.id === game.category_id)?.name || 'PS4'
                return (
                  <div key={game.id} className="game-card game-card-store group rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-b from-gray-800/80 to-gray-900/90 hover:border-teal-500/50 hover:shadow-[0_0_30px_rgba(20,184,166,0.25)] transition-all duration-300 hover:-translate-y-1" data-game-id={game.id}>
                    {/* صورة اللعبة مع overlay */}
                    <div className="aspect-square sm:aspect-[4/3] relative overflow-hidden bg-gray-800">
                      <img
                        src={game.image.startsWith('http') ? game.image : game.image}
                        alt={game.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = cover;
                        }}
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* شارة النوع */}
                      {game._cls?.genre && (
                        <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm border ${genreClass(game._cls.genre)}`}>
                          {genreArLabels[game._cls.genre] || game._cls.genre}
                        </span>
                      )}
                      
                      {/* شارة الحجم */}
                      {game.size_gb > 0 && (
                        <span className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
                          {game.size_gb} GB
                        </span>
                      )}
                    </div>
                    
                    {/* محتوى البطاقة */}
                    <div className="p-3 sm:p-4 flex flex-col flex-grow">
                      <h3 className="game-card-title text-white font-bold leading-snug break-words mb-2 group-hover:text-[color:var(--brand)] transition-colors">{game.title}</h3>
                      
                      {/* شارة التصنيف */}
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded-full text-[10px] font-semibold border border-blue-500/20">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                          {categoryName}
                        </span>
                      </div>
                      
                      {/* السعر */}
                      <div className="mt-auto">
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-1">
                            <span className="text-[color:var(--brand)] font-black text-lg sm:text-xl tabular-nums">{game.price.toFixed(3)}</span>
                            <span className="text-gray-500 text-xs font-medium">د.ل</span>
                          </div>
                        </div>
                        
                        {/* زر السلة */}
                        {(hasToken || isGuestMode) && (
                          <button
                            onClick={() => addToCart(game)}
                            className="mt-3 w-full bg-gradient-to-r from-[color:var(--brand)] to-emerald-500 hover:from-[color:var(--brand-hover)] hover:to-emerald-400 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(20,184,166,0.5)] active:scale-[0.97] flex items-center justify-center gap-2 text-sm cursor-pointer"
                          >
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            أضف للسلة
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {displayedGames.length > visibleGameCount && (
                <div className="col-span-full text-center py-4">
                  <button
                    onClick={() => setVisibleGameCount(prev => prev + 24)}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all text-sm border border-white/10"
                  >
                    تحميل المزيد ({displayedGames.length - visibleGameCount} لعبة متبقية)
                  </button>
                </div>
              )}
            </div>
          </section>

          <aside className="hidden lg:block space-y-4 sm:space-y-6 lg:h-fit lg:sticky lg:top-24">
            {/* السلة - متجاوبة مع الهاتف والتابلت */}
            {(hasToken || isGuestMode) && (
            <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/90 rounded-2xl shadow-lg border border-white/5 p-4 sm:p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <h2 className="text-lg font-bold text-white">السلة</h2>
                </div>
                {cart.length > 0 && (
                  <span className="bg-purple-500/20 text-purple-400 px-2.5 py-1 rounded-full text-xs font-bold border border-purple-500/30">
                    {cart.length} {cart.length === 1 ? 'لعبة' : 'ألعاب'}
                  </span>
                )}
              </div>

              {cart.length === 0 && servicesCart.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-700/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400">السلة فارغة</p>
                  <p className="text-xs text-gray-600 mt-1">أضف ألعاباً للبدء</p>
                </div>
              ) : (
                <>
                  <ul className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
                    {cart.map((g, i) => (
                      <li key={`g-${i}`} className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-white/8 rounded-xl transition-colors group">
                        <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-white" title={g.title}>{g.title}</p>
                          <p className="text-xs text-purple-400 font-bold">{currency(g.price)}</p>
                        </div>
                        <button onClick={() => removeFromCart(i)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100" aria-label="حذف">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </li>
                    ))}
                    {servicesCart.map((s, i) => (
                      <li key={`s-${i}`} className="flex items-center gap-3 p-2.5 bg-emerald-500/5 hover:bg-emerald-500/8 rounded-xl border border-emerald-500/10 transition-colors group">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-white" title={s.title}>{s.title}</p>
                          <p className="text-xs text-emerald-400 font-bold">{currency(s.price)}</p>
                        </div>
                        <button onClick={() => removeFromServicesCart(i)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100" aria-label="حذف">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </li>
                    ))}
                  </ul>

                  {/* ملخص الطلب */}
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
                        الحجم
                      </span>
                      <span className="text-xs text-gray-300 font-medium">{totalSize.toFixed(2)} GB</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-bold text-white">الإجمالي</span>
                      <span className="text-xl font-black text-primary tabular-nums">{currency(total)}</span>
                    </div>

                    {/* اختيار الفرع لإرسال الطلب (كل فرع له رقم واتساب مستقل) — للضيوف فقط */}
                    {(!hasToken || isGuestMode) && branches.length > 0 && (
                      <div className="mb-3">
                        <BranchSelect branches={branches} selectedId={selectedBranchId} onSelect={selectBranch} />
                      </div>
                    )}

                    <div className="space-y-2.5">
                      <button
                        disabled={(cart.length === 0 && servicesCart.length === 0) || ((!hasToken || isGuestMode) && !canSendWhatsApp)}
                        onClick={sendOrder}
                        className={`w-full disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 text-sm flex items-center justify-center gap-2 cursor-pointer ${
                          (!hasToken || isGuestMode)
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                            : 'bg-gradient-to-r from-[color:var(--brand)] to-emerald-500 hover:from-[color:var(--brand-hover)] hover:to-emerald-400 hover:shadow-[0_0_20px_rgba(20,184,166,0.4)]'
                        } active:scale-[0.98]`}
                      >
                        {(!hasToken || isGuestMode) ? (
                          <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            إرسال عبر واتساب
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            إنشاء فاتورة وطباعة
                          </>
                        )}
                      </button>

                      <div className="text-[11px] text-gray-500 bg-gray-800/30 p-2 rounded-lg text-center">
                        {(!hasToken || isGuestMode) ? (
                          <p>{whatsAppHint}</p>
                        ) : (
                          <p>سيتم إنشاء فاتورة وطباعتها</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            )}

            {/* الأكثر طلباً - يظهر من شاشة lg فما فوق */}
            <div className="hidden lg:block bg-card rounded-xl shadow-sm border border-white/10 p-4 xl:p-5 h-[60vh] min-h-[280px] overflow-auto toplist-scroll">
              <h2 className="text-lg xl:text-xl font-bold mb-3 xl:mb-4">الأكثر طلباً</h2>
              <TopList onAdd={(hasToken || isGuestMode) ? addToCart : null} />
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-6 border-t border-white/10 bg-gray-900/40 backdrop-blur-md">
        <div className="w-full px-3 min-[400px]:px-4 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <img src={logo} alt="Alnafar Store" className="h-7 w-7 rounded-lg" />
              <h3 className="text-base font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">متجر النفار</h3>
            </div>
            <p className="flex items-start gap-1.5 text-xs sm:text-sm text-gray-400 leading-relaxed">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-primary/70" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
              الشاردة للإلكترونات — شارع القضائية مقابل فضيل للبن
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-2">أرقام الفروع</h4>
            <ul className="space-y-1.5">
              {branches.length > 0 ? branches.map(b => (
                <li key={b.id} className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                  <span className="text-gray-400 truncate">{b.name}</span>
                  {b.phone ? (
                    <a href={`tel:${(b.phone || '').replace(/[^0-9+]/g, '')}`} className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 font-mono transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50 rounded" dir="ltr">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                      <span>{b.phone}</span>
                    </a>
                  ) : <span className="text-gray-500">—</span>}
                </li>
              )) : (
                <li className="text-xs sm:text-sm text-gray-500">{storePhone || 'لا يوجد رقم متاح'}</li>
              )}
            </ul>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <a href="#/admin" className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-300 hover:text-primary bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.003-.827c.294-.24.44-.613.432-.992a6.759 6.759 0 010-.255c.007-.378-.138-.75-.431-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.213-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              لوحة التحكم
            </a>
          </div>
        </div>
        <div className="border-t border-white/5 py-3 text-center text-[11px] text-gray-500">
          © {new Date().getFullYear()} متجر النفار — جميع الحقوق محفوظة
        </div>
      </footer>

      {/* Login Modal - Mobile optimized */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={submitLogin}
            className="w-full max-w-sm rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 border border-white/10 mx-auto tab-fade-in"
            style={{ background: 'rgba(17,24,39,0.85)', backdropFilter: 'blur(20px)' }}
          >
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/95 flex items-center justify-center shadow-lg">
                <img src={logo} alt="شعار متجر النفار" className="w-11 h-11 object-contain" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">تسجيل الدخول</h3>
              <p className="text-sm text-gray-400">للوصول إلى لوحة التحكم</p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-500 pointer-events-none" aria-hidden="true">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0v.75H4.5v-.75z" /></svg>
                </span>
                <input
                  className="w-full border border-gray-700/60 bg-gray-800/60 text-white rounded-xl pr-11 pl-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-base min-h-[48px]"
                  placeholder="اسم المستخدم"
                  aria-label="اسم المستخدم"
                  value={loginForm.username}
                  onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                  autoComplete="username"
                />
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-500 pointer-events-none" aria-hidden="true">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5A2.25 2.25 0 0019.5 19.5v-6.75A2.25 2.25 0 0017.25 10.5H6.75A2.25 2.25 0 004.5 12.75v6.75A2.25 2.25 0 006.75 21.75z" /></svg>
                </span>
                <input
                  className="w-full border border-gray-700/60 bg-gray-800/60 text-white rounded-xl pr-11 pl-11 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-base min-h-[48px]"
                  placeholder="كلمة المرور"
                  aria-label="كلمة المرور"
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-emerald-600 hover:from-primary-dark hover:to-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center gap-2 min-h-[48px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true"></span> جارٍ الدخول...</>
                ) : 'دخول'}
              </button>
              <button
                type="button"
                onClick={() => setShowLogin(false)}
                className="w-full px-4 py-3 rounded-xl border border-gray-700/50 bg-gray-800/40 text-white hover:bg-gray-700/50 transition-colors font-medium min-h-[48px] cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* نافذة السلة على الموبايل - متوافقة مع الشاشات الصغيرة والكبيرة */}
      {showMobileCart && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden" onClick={() => setShowMobileCart(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-t-3xl max-h-[85vh] min-h-[40vh] overflow-hidden flex flex-col border-t border-white/10" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} onClick={e => e.stopPropagation()}>
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-600 rounded-full"></div>
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <h2 className="text-lg font-bold text-white">السلة</h2>
                {cart.length > 0 && (
                  <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full text-xs font-bold">
                    {cart.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowMobileCart(false)}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                aria-label="إغلاق السلة"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cart Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {cart.length === 0 && servicesCart.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gray-700/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400">السلة فارغة</p>
                  <p className="text-xs text-gray-600 mt-1">أضف ألعاباً للبدء</p>
                </div>
              ) : (
                <>
                  <ul className="space-y-2 mb-4">
                    {cart.map((g, i) => (
                      <li key={`g-${i}`} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/8 rounded-xl transition-colors group">
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-white text-sm" title={g.title}>{g.title}</p>
                          <p className="text-primary font-bold text-xs">{currency(g.price)}</p>
                        </div>
                        <button onClick={() => removeFromCart(i)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" aria-label="حذف من السلة">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </li>
                    ))}
                    {servicesCart.map((s, i) => (
                      <li key={`s-${i}`} className="flex items-center gap-3 p-3 bg-emerald-500/5 hover:bg-emerald-500/8 rounded-xl border border-emerald-500/10 transition-colors group">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-white text-sm" title={s.title}>{s.title}</p>
                          <p className="text-emerald-400 font-bold text-xs">{currency(s.price)}</p>
                        </div>
                        <button onClick={() => removeFromServicesCart(i)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" aria-label="حذف من السلة">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </li>
                    ))}
                  </ul>

                  {/* ملخص الطلب */}
                  <div className="border-t border-white/5 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
                        الحجم
                      </span>
                      <span className="text-xs text-gray-300 font-medium">{totalSize.toFixed(2)} GB</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-bold text-white">الإجمالي</span>
                      <span className="text-xl font-black text-primary tabular-nums">{currency(total)}</span>
                    </div>

                    {/* اختيار الفرع لإرسال الطلب (كل فرع له رقم واتساب مستقل) — للضيوف فقط */}
                    {(!hasToken || isGuestMode) && branches.length > 0 && (
                      <div className="mb-3">
                        <BranchSelect branches={branches} selectedId={selectedBranchId} onSelect={selectBranch} compact />
                      </div>
                    )}

                    <button
                      disabled={(cart.length === 0 && servicesCart.length === 0) || ((!hasToken || isGuestMode) && !canSendWhatsApp)}
                      onClick={() => {
                        setShowMobileCart(false)
                        sendOrder()
                      }}
                      className={`w-full disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer ${
                        (!hasToken || isGuestMode)
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                          : 'bg-gradient-to-r from-[color:var(--brand)] to-emerald-500 hover:from-[color:var(--brand-hover)] hover:to-emerald-400 hover:shadow-[0_0_20px_rgba(20,184,166,0.4)]'
                      }`}
                    >
                      {(!hasToken || isGuestMode) ? (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          إرسال عبر واتساب
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          إنشاء فاتورة وطباعة
                        </>
                      )}
                    </button>
                    <div className="text-[11px] text-gray-500 bg-gray-800/30 p-2 rounded-lg text-center">
                      {(!hasToken || isGuestMode) ? (
                        <p>{whatsAppHint}</p>
                      ) : (
                        <p>سيتم إنشاء فاتورة وطباعتها</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"><div className="loading-spinner"></div></div>}>
          <Invoice
            cart={combinedCartForInvoice}
            total={total}
            totalSize={totalSize}
            onClose={handleInvoiceClose}
            onSuccess={handleInvoiceSuccess}
          />
        </Suspense>
      )}
      {viewingPackage && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewingPackage(null)}>
          <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="text-xl font-bold text-white truncate pr-2">{viewingPackage.name}</h3>
              <button
                onClick={() => setViewingPackage(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="إغلاق"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 nav-scroll">
              {viewingPackage.packageGames?.map(g => (
                <div key={g.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                  <img 
                    src={g.image || cover} 
                    alt={g.title} 
                    loading="lazy"
                    className="w-12 h-12 object-cover rounded-md flex-shrink-0" 
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = cover; }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-base font-semibold text-white truncate">{g.title}</h4>
                    {g.size_gb > 0 && <p className="text-xs text-gray-400 mt-1">{g.size_gb} GB</p>}
                  </div>
                </div>
              ))}
              {(!viewingPackage.packageGames || viewingPackage.packageGames.length === 0) && (
                <div className="text-center py-6 text-gray-400">لا توجد ألعاب في هذه الباقة</div>
              )}
            </div>
            <div className="mt-5 pt-4 border-t border-white/10 flex justify-between items-center text-sm font-bold">
              <span className="text-gray-300">إجمالي الألعاب:</span>
              <span className="text-purple-400 px-3 py-1 bg-purple-900/30 rounded-lg">{viewingPackage.packageGames?.length || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


