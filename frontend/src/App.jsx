import React, { useEffect, useMemo, useState } from 'react'
import { api, loadAuthFromStorage } from './api'
import socket from './socket'
import Admin from './Admin'
import Invoice from './Invoice'
import OrderTracking from './OrderTracking'
import logo from '../assites/logo.png'
import cover from '../assites/cover.png'
import cover2 from '../assites/cover2.jpg'

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

function TopList({ onAdd }) {
  const [top, setTop] = useState([])
  const [details, setDetails] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const r = await api.get('/stats')
        const topGames = r.data?.topGames || []
        setTop(topGames)
        if (!topGames.length) { setDetails([]); return }
        // fetch game details in one request (batch) preserving order
        const ids = topGames.map(t => t.gameId).join(',')
        let rows = []
        try {
          const res = await api.get('/games/batch', { params: { ids } })
          rows = Array.isArray(res.data) ? res.data : []
        } catch (_) { rows = [] }
        const map = new Map(rows.map(g => [Number(g.id), g]))
        const resolved = topGames
          .map(t => {
            const g = map.get(Number(t.gameId)) || {}
            return {
              id: g.id || t.gameId,
              title: g.title || (t.gameId ? `لعبة #${t.gameId}` : null),
              image: g.image || '',
              price: typeof g.price === 'number' ? g.price : 0,
              count: t.count
            }
          })
          .filter(g => g.id !== null && g.id !== undefined && g.title !== null)

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

export default function App() {
  const [route, setRoute] = useState(window.location.hash || '#/')
  const [categories, setCategories] = useState([])
  const [games, setGames] = useState([])
  const [query, setQuery] = useState('')
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
  const [splitOnly, setSplitOnly] = useState(false) // kept for logic compatibility, UI removed below
  const [letterFilter, setLetterFilter] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [paymentType, setPaymentType] = useState('cash')
  const [showLogin, setShowLogin] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginLoading, setLoginLoading] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [viewingPackage, setViewingPackage] = useState(null)
  const [isGuestMode, setIsGuestMode] = useState(localStorage.getItem('isGuest') === 'true')
  const [storePhone, setStorePhone] = useState('')

  // Load auth token from storage on mount
  useEffect(() => { loadAuthFromStorage() }, [])

  const [editingInvoiceData, setEditingInvoiceData] = useState(null)

  useEffect(() => {
    api.get('/services').then(({ data }) => setServices(Array.isArray(data) ? data : [])).catch(() => { })
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
    api.get('/categories').then(r => {
      const data = Array.isArray(r.data) ? r.data : []
      setCategories(data);
      if (!activeCategory && data.length) {
        // Auto-select PS4 category if exists, otherwise first category
        const ps4Category = data.find(c => (c.name || '').toLowerCase().includes('ps4'))
        setActiveCategory(String(ps4Category?.id || data[0].id))
      }
    })
  }, [])

  useEffect(() => {
    const params = {}
    if (query) params.q = query
    if (activeCategory) params.category = activeCategory
    if (minPrice) params.minPrice = minPrice
    if (maxPrice) params.maxPrice = maxPrice
    api.get('/games', { params }).then(r => setGames(Array.isArray(r.data) ? r.data : []))
  }, [query, activeCategory, minPrice, maxPrice])

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
    let storedGenre = (g.genre || '').trim().toLowerCase()
    // Convert Arabic genre names to English for consistent filtering
    const arToEn = {
      'رعب': 'horror', 'أكشن': 'action', 'مغامرة': 'adventure', 'رياضة': 'sports',
      'سباقات': 'racing', 'سباق': 'racing', 'ألغاز': 'puzzle', 'منصات': 'platformer',
      'عالم مفتوح': 'open world', 'تخفي': 'stealth', 'قتال': 'fighting',
      'استراتيجية': 'strategy', 'تقمص أدوار': 'rpg', 'أطفال': 'kids', 'تصويب': 'shooter'
    }
    if (arToEn[storedGenre]) storedGenre = arToEn[storedGenre]
    const storedSeries = (g.series || '').trim().toLowerCase()
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
  const availableSeries = useMemo(() => {
    const s = new Set()
    for (const g of classifiedGames) if (g._cls.series) s.add(g._cls.series)
    return Array.from(s).sort()
  }, [classifiedGames])

  const availableGenres = useMemo(() => {
    const map = new Map()
    for (const g of classifiedGames) {
      const gr = g._cls.genre
      if (gr) map.set(gr, (map.get(gr) || 0) + 1)
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([k]) => k)
  }, [classifiedGames])

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
      ...cart.map(g => ({ title: g.title, price: Number(g.price) || 0, size_gb: Number(g.size_gb) || 0, type: g.type || 'game', items: g.packageGames })),
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

  async function sendOrder() {
    if (cart.length === 0 && servicesCart.length === 0) return alert('السلة فارغة')
    if (!hasToken || isGuestMode) {
      // Guest: send via WhatsApp
      sendWhatsAppOrder()
      return
    }
    setShowInvoice(true)
  }

  function sendWhatsAppOrder() {
    if (cart.length === 0 && servicesCart.length === 0) return

    let msg = '🎮 *طلب ألعاب من متجر النفار*\n'
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

    const phone = formatWhatsAppPhone(storePhone)
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
      localStorage.setItem('token', data.token)
      localStorage.removeItem('isGuest')
      setIsGuestMode(false)
      setShowLogin(false)
      // البقاء في واجهة المتجر بعد تسجيل الدخول بدلاً من التوجيه للوحة التحكم
    } catch {
      alert('بيانات الدخول غير صحيحة')
    } finally {
      setLoginLoading(false)
    }
  }

  if (route.startsWith('#/admin')) return <Admin />

  if (route.startsWith('#/track/')) {
    const orderIdPattern = route.replace('#/track/', '').split('?')[0]
    return <OrderTracking orderId={orderIdPattern} />
  }

  // حماية المتجر: يجب تسجيل الدخول للوصول إلى نقطة البيع
  const hasToken = !!localStorage.getItem('token')
  if (!hasToken && !isGuestMode && !showLogin) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Animated background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[150px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-10 text-center max-w-sm w-full">
          {/* Logo with glow */}
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-primary/30 rounded-3xl blur-2xl"></div>
            <div className="relative bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-3xl p-5 shadow-2xl">
              <img src={logo} alt="Alnafar Store" className="h-16 sm:h-20 mx-auto" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 bg-gradient-to-r from-primary via-emerald-400 to-blue-400 bg-clip-text text-transparent">
            متجر النفار
          </h1>
          <p className="text-gray-400 mb-8 text-sm sm:text-base">اختر ألعابك المفضلة واطلبها بسهولة</p>

          {/* Login Form */}
          <form
            onSubmit={submitLogin}
            className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl"
          >
            <div className="text-right mb-2">
              <h2 className="text-lg font-bold text-white">تسجيل الدخول</h2>
              <p className="text-xs text-gray-400">للوصول إلى نظام نقطة البيع</p>
            </div>
            <div>
              <input
                className="w-full border border-gray-700/60 bg-gray-800/60 text-white rounded-xl px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-base transition-all"
                placeholder="اسم المستخدم"
                value={loginForm.username}
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                autoComplete="username"
              />
            </div>
            <div>
              <input
                className="w-full border border-gray-700/60 bg-gray-800/60 text-white rounded-xl px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-base transition-all"
                placeholder="كلمة المرور"
                type="password"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-3.5 rounded-xl bg-gradient-to-r from-primary to-emerald-600 hover:from-primary-dark hover:to-emerald-700 text-white disabled:opacity-50 transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              disabled={loginLoading}
            >
              {loginLoading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700/50"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-gray-900/60 px-3 text-gray-500">أو</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                localStorage.setItem('isGuest', 'true');
                setIsGuestMode(true);
              }}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-600/50 hover:bg-white/5 text-gray-300 hover:text-white transition-all font-bold flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              تصفح كضيف — أضف ألعاب وأرسل الطلب عبر واتساب
            </button>
          </form>

          <p className="text-gray-600 text-xs mt-6">الشاردة للإلكترونات — شارع القضائية</p>
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
              <span className="text-lg">✏️</span>
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
                  className="text-xs sm:text-sm bg-primary/20 hover:bg-primary/30 text-primary px-3 py-2.5 min-h-[44px] rounded-lg transition-colors touch-target font-bold"
                >
                  ⚙️ لوحة التحكم
                </button>
              ) : isGuestMode ? (
                <button
                  onClick={() => { localStorage.removeItem('isGuest'); setIsGuestMode(false); }}
                  className="text-xs sm:text-sm bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-3 py-2.5 min-h-[44px] rounded-lg transition-colors touch-target font-bold"
                >
                  👤 ضيف
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
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="ابحث عن لعبة..."
              className="w-full bg-white/5 border border-white/10 text-white placeholder:text-gray-300 rounded-lg px-3 py-2.5 text-base"
            />
          </div>

          {/* Navigation - تمرير أفقي على الهاتف */}
          <div className="pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-hide nav-scroll">
            <nav className="flex items-center gap-2 sm:gap-4 md:gap-6 min-w-max py-0.5">
              {(categories || []).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`pb-2 border-b-2 -mb-px whitespace-nowrap px-3 py-1 text-sm sm:text-base font-bold transition-colors ${activeCategory === String(c.id)
                    ? 'border-primary bg-primary/20 text-white'
                    : 'border-transparent text-white bg-gray-600/80 hover:bg-gray-500/80 hover:border-white/30 md:bg-gray-600 md:hover:bg-gray-500'
                    }`}
                >
                  {c.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Guest Mode Banner */}
      {isGuestMode && !hasToken && (
        <div className="bg-gradient-to-r from-emerald-900/60 to-green-900/40 border-b border-emerald-500/30 px-4 py-2.5 text-center">
          <p className="text-emerald-200 text-xs sm:text-sm">
            🛒 أنت تتصفح كضيف — أضف الألعاب للسلة ثم أرسل الطلب عبر واتساب
          </p>
        </div>
      )}

      {/* Hero */}
      <section className="bg-gradient-to-r from-base to-black">
        <div className="w-full px-3 min-[400px]:px-4 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-4 min-[400px]:py-5 sm:py-6 md:py-8 lg:py-10">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 items-center">
            <div className="order-2 md:order-1">
              <h1 className="text-xl min-[400px]:text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 sm:mb-3 text-center md:text-right">اختر الألعاب التي تريدها</h1>
              <p className="text-gray-200 mb-4 text-sm sm:text-base text-center md:text-right leading-relaxed md:text-gray-100">موقع المحل: الشاردة للإلكترونات - شارع القضائية مقابل فضيل للبن</p>

              {/* Desktop Search */}
              <div className="hidden md:block mb-4">
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="ابحث عن لعبة..."
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-gray-300 rounded-lg px-3 py-2.5"
                />
              </div>

              {/* Filters - Mobile optimized */}
              <div className="space-y-3">
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
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white appearance-none text-sm sm:text-base"
                  >
                    <option value="">كل الأنواع</option>
                    <option value="__split__">تقسيم الشاشة</option>
                    <option value="__others__">أخرى</option>
                    {availableGenres.filter(g => g !== 'تقسيم الشاشة' && g !== 'أخرى').map(g => (
                      <option key={g} value={g}>{genreArLabels[g] || g}</option>
                    ))}
                  </select>

                  <select
                    value={seriesFilter}
                    onChange={e => setSeriesFilter(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white appearance-none text-sm sm:text-base"
                  >
                    <option value="">كل السلاسل</option>
                    {availableSeries.map(s => (
                      <option key={s} value={s}>{toTitleCase(s)}</option>
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
            {/* فهرس A–Z - متجاوب مع أحجام الشاشات */}
            <div className="mb-3 min-[400px]:mb-4 sm:mb-6 -mx-1 px-1 sm:mx-0 sm:px-0 overflow-x-auto sm:overflow-visible nav-scroll">
              <div className="flex flex-wrap gap-1 sm:gap-2 text-[10px] min-[360px]:text-xs sm:text-sm min-w-0">
                {['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map(ch => (
                  <button
                    key={ch}
                    onClick={() => setLetterFilter(prev => prev === ch ? '' : ch)}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border font-medium transition-all ${letterFilter === ch
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
                  className="mt-2 px-3 py-1.5 rounded-lg bg-white/5 text-white border border-white/10 hover:bg-white/10 text-xs sm:text-sm font-medium"
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
                  <span className="text-2xl animate-bounce duration-[3000ms]">📦</span>
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
              {displayedGames.length === 0 && (
                <div className="col-span-full text-gray-300 bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                  لا توجد نتائج مطابقة للفلاتر الحالية.
                </div>
              )}
              {displayedGames.map(game => {
                const categoryName = (categories || []).find(c => c.id === game.category_id)?.name || 'PS4'
                return (
                  <div key={game.id} className="game-card game-card-store group rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-b from-gray-800/80 to-gray-900/90 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(124,58,237,0.25)] transition-all duration-300 hover:-translate-y-1" data-game-id={game.id}>
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
                      <h3 className="game-card-title text-white font-bold text-sm sm:text-base mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-purple-300 transition-colors">{game.title}</h3>
                      
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
                            <span className="text-purple-400 font-black text-lg sm:text-xl tabular-nums">{game.price.toFixed(3)}</span>
                            <span className="text-gray-500 text-xs font-medium">د.ل</span>
                          </div>
                        </div>
                        
                        {/* زر السلة */}
                        {(hasToken || isGuestMode) && (
                          <button
                            onClick={() => addToCart(game)}
                            className="mt-3 w-full bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] active:scale-[0.97] flex items-center justify-center gap-2 text-sm cursor-pointer"
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
            </div>
          </section>

          <aside className="space-y-4 sm:space-y-6 lg:h-fit lg:sticky lg:top-24">
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
                      <span className="text-xl font-black text-purple-400 tabular-nums">{currency(total)}</span>
                    </div>

                    <div className="space-y-2.5">
                      <button
                        disabled={cart.length === 0 && servicesCart.length === 0}
                        onClick={sendOrder}
                        className={`w-full disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 text-sm flex items-center justify-center gap-2 ${
                          (!hasToken || isGuestMode)
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                            : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]'
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
                          <p>سيتم فتح واتساب لإرسال طلبك</p>
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

      {/* Login Modal - Mobile optimized */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={submitLogin}
            className="bg-gray-900 w-full max-w-sm rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 border border-gray-700/50 mx-auto"
          >
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">تسجيل الدخول</h3>
              <p className="text-sm text-gray-400">للوصول إلى لوحة التحكم</p>
            </div>

            <div className="space-y-3">
              <input
                className="w-full border border-gray-700/60 bg-gray-800/60 text-white rounded-xl px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
                placeholder="اسم المستخدم"
                value={loginForm.username}
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                autoComplete="username"
              />
              <input
                className="w-full border border-gray-700/60 bg-gray-800/60 text-white rounded-xl px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
                placeholder="كلمة المرور"
                type="password"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                autoComplete="current-password"
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-emerald-600 hover:from-primary-dark hover:to-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center gap-2"
                disabled={loginLoading}
              >
                {loginLoading ? 'جارٍ الدخول...' : 'دخول'}
              </button>
              <button
                type="button"
                onClick={() => setShowLogin(false)}
                className="w-full px-4 py-3 rounded-xl border border-gray-700/50 bg-gray-800/40 text-white hover:bg-gray-700/50 transition-colors font-medium"
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
                        <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-white text-sm" title={g.title}>{g.title}</p>
                          <p className="text-purple-400 font-bold text-xs">{currency(g.price)}</p>
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
                      <span className="text-xl font-black text-purple-400 tabular-nums">{currency(total)}</span>
                    </div>

                    <button
                      disabled={cart.length === 0 && servicesCart.length === 0}
                      onClick={() => {
                        setShowMobileCart(false)
                        sendOrder()
                      }}
                      className={`w-full disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] ${
                        (!hasToken || isGuestMode)
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                          : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]'
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
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && (
        <Invoice
          cart={combinedCartForInvoice}
          total={total}
          totalSize={totalSize}
          onClose={handleInvoiceClose}
          onSuccess={handleInvoiceSuccess}
        />
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


