import React, { useEffect, useMemo, useState } from 'react'
import { api } from './api'
import socket from './socket'
import Admin from './Admin'
import Invoice from './Invoice'
import logo from '../assites/logo.png'
import cover from '../assites/cover.png'

function currency(num) {
  return new Intl.NumberFormat('ar-LY', { style: 'currency', currency: 'LYD' }).format(num)
}

function TopList({ onAdd }) {
  const [top, setTop] = useState([])
  const [details, setDetails] = useState([])

  useEffect(()=>{
    let cancelled = false
    async function load() {
      try {
        const r = await api.get('/stats')
        const topGames = r.data?.topGames||[]
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
        const resolved = topGames.map(t => {
          const g = map.get(Number(t.gameId)) || {}
          return {
            id: g.id || t.gameId,
            title: g.title || `لعبة #${t.gameId}`,
            image: g.image || '',
            price: typeof g.price === 'number' ? g.price : 0,
            count: t.count
          }
        })
        if (!cancelled) setDetails(resolved)
      } catch (e) {
        console.error('Failed to load top list', e)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (details.length===0) return (
    <div className="text-center py-4 text-gray-400">
      <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm">لا يوجد بيانات بعد</p>
    </div>
  )
  
  return (
    <ul className="space-y-2 sm:space-y-3">
      {details.map(g => (
        <li key={g.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
          <img 
            src={g.image || cover} 
            alt={g.title} 
            className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg flex-shrink-0" 
            referrerPolicy="no-referrer"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = cover; }}
          />
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate text-sm sm:text-base" title={g.title}>{g.title}</div>
            <div className="text-gray-300 text-xs sm:text-sm">{typeof g.price === 'number' ? currency(g.price) : ''}</div>
          </div>
          <button 
            onClick={() => onAdd && onAdd(g)} 
            className="px-2 sm:px-3 py-1 sm:py-1.5 bg-primary hover:bg-primary-dark text-black rounded-lg font-semibold text-xs sm:text-sm transition-colors flex-shrink-0"
          >
            أضف
          </button>
        </li>
      ))}
    </ul>
  )
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
  // UI filters
  const [genreFilter, setGenreFilter] = useState('')
  const [seriesFilter, setSeriesFilter] = useState('')
  const [splitOnly, setSplitOnly] = useState(false) // kept for logic compatibility, UI removed below
  const [letterFilter, setLetterFilter] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginLoading, setLoginLoading] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)
  const [showMobileCart, setShowMobileCart] = useState(false)


  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onHash)

    // الاستماع للتحديثات الفورية
    socket.on('game_added', (data) => {
      console.log('🎮 لعبة جديدة:', data.message);
      // إضافة اللعبة الجديدة للقائمة
      setGames(prevGames => [data.game, ...prevGames]);
      
      // إشعار بصري
      if (Notification.permission === 'granted') {
        new Notification('لعبة جديدة', {
          body: `تم إضافة: ${data.game.title}`,
          icon: '/favicon.svg'
        });
      }
    });

    return () => {
      window.removeEventListener('hashchange', onHash);
      socket.off('game_added');
    };
  }, [])

  useEffect(() => {
    api.get('/categories').then(r => { setCategories(r.data); if (!activeCategory && r.data?.length) setActiveCategory(String(r.data[0].id)) })
  }, [])

  useEffect(() => {
    const params = {}
    if (query) params.q = query
    if (activeCategory) params.category = activeCategory
    if (minPrice) params.minPrice = minPrice
    if (maxPrice) params.maxPrice = maxPrice
    api.get('/games', { params }).then(r => setGames(r.data))
  }, [query, activeCategory, minPrice, maxPrice])

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
        const f = typeof g.features === 'string' ? JSON.parse(g.features).map(x=>String(x)) : g.features
        split = Array.isArray(f) && f.some(v => String(v).toLowerCase().includes('split'))
      } catch {
        split = String(g.features).toLowerCase().includes('split')
      }
    }
    // Normalize database values (preferred source of truth)
    const storedGenre = (g.genre || '').trim().toLowerCase()
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
    return Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).map(([k])=>k)
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
    out.sort((a,b) => (a.title||'').localeCompare(b.title||'', undefined, { sensitivity:'base' }))
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
    return ar.split(' ').map(w => w ? w[0].toUpperCase()+w.slice(1) : '').join(' ')
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

  const total = useMemo(() => cart.reduce((sum, g) => sum + g.price, 0), [cart])

  function playAddFeedback() {
    try {
      if ('vibrate' in navigator) navigator.vibrate([20])
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        const ctx = new AudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.value = 880
        gain.gain.value = 0.04
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        setTimeout(() => { try { osc.stop(); ctx.close() } catch(_){} }, 120)
      }
    } catch (_) {}
  }

  function addToCart(game) { 
    setCart(prev => [...prev, game])
    playAddFeedback()
  }
  function removeFromCart(index) { setCart(prev => prev.filter((_, i) => i !== index)) }

  async function sendOrder() {
    if (cart.length === 0) return alert('السلة فارغة')
    
    // فتح مودال الفاتورة بدلاً من إرسال رابط
    setShowInvoice(true)
  }

  const handleInvoiceSuccess = (invoice) => {
    // مسح السلة بعد نجاح إنشاء الفاتورة
    setCart([])
    setShowInvoice(false)
    
    // رسالة مختلفة حسب البيئة
    if (invoice && invoice.cloudMode) {
      alert('تم إنشاء الفاتورة بنجاح!\n\nملاحظة: الطباعة غير متاحة في النسخة السحابية.\nللطباعة، يرجى تشغيل النظام محلياً.')
    } else {
      alert('تم إنشاء وطباعة الفاتورة بنجاح!')
    }
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
      setShowLogin(false)
      window.location.hash = '#/admin'
    } catch {
      alert('بيانات الدخول غير صحيحة')
    } finally {
      setLoginLoading(false)
    }
  }

  if (route.startsWith('#/admin')) return <Admin />

  // Compute current value for the genre select (to support split-only special option)
  const genreSelectValue = splitOnly ? '__split__' : (genreFilter || '')

  return (
    <div className="min-h-screen bg-base text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-black border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          {/* Top row - Logo, Cart Icon (mobile), and Login */}
          <div className="h-14 sm:h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-8 w-8 sm:h-10 sm:w-10" />
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                متجر النفار
              </h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Cart Icon */}
              <button 
                onClick={() => setShowMobileCart(true)}
                className="lg:hidden relative p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="السلة"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
              
              <button 
                onClick={() => setShowLogin(true)}
                className="text-xs sm:text-sm bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors"
              >
                تسجيل دخول
              </button>
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
          
          {/* Navigation - Horizontal scroll on mobile */}
          <div className="pb-2 overflow-x-auto scrollbar-hide">
            <nav className="flex items-center gap-3 sm:gap-6 text-gray-200 min-w-max">
              {(categories || []).map((c, i) => (
                <button 
                  key={c.id} 
                  onClick={() => setActiveCategory(c.id)} 
                  className={`pb-2 border-b-2 -mb-px whitespace-nowrap px-1 text-sm sm:text-base font-medium transition-colors ${
                    activeCategory===String(c.id) ? 'border-primary text-primary' : 'border-transparent hover:border-primary hover:text-primary'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-r from-base to-black">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 items-center">
            <div className="order-2 md:order-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 sm:mb-3 text-center md:text-right">اختر الألعاب التي تريدها</h1>
              <p className="text-gray-300 mb-4 text-sm sm:text-base text-center md:text-right leading-relaxed">تصفح أفضل الألعاب لأجهزة PS و PC وأضفها إلى سلتك ثم اصدر الفاتورة مباشرة.</p>
              
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
                    onChange={e=>{
                      const v = e.target.value
                      if (v === '__split__') { setSplitOnly(true); setGenreFilter('') }
                      else { setSplitOnly(false); setGenreFilter(v) }
                    }} 
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white appearance-none text-sm sm:text-base"
                  >
                    <option value="">كل الأنواع</option>
                    <option value="__split__">تقسيم الشاشة</option>
                    <option value="__others__">أخرى</option>
                    {availableGenres.map(g => (
                      <option key={g} value={g}>{genreArLabels[g] || g}</option>
                    ))}
                  </select>
                  
                  <select 
                    value={seriesFilter} 
                    onChange={e=>setSeriesFilter(e.target.value)} 
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
              <img src={cover} alt="cover" className="w-full rounded-xl shadow-lg object-cover h-48 sm:h-56 md:max-h-64" />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <section className="lg:col-span-2">
            {/* A–Z index - Mobile optimized */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm">
                {['#','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'].map(ch => (
                  <button 
                    key={ch} 
                    onClick={()=>setLetterFilter(prev => prev===ch ? '' : ch)} 
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border font-medium transition-all ${
                      letterFilter===ch 
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
                  onClick={()=>setLetterFilter('')} 
                  className="mt-2 px-3 py-1.5 rounded-lg bg-white/5 text-white border border-white/10 hover:bg-white/10 text-xs sm:text-sm font-medium"
                >
                  مسح الفهرس
                </button>
              )}
            </div>

          <div className="games-grid">
            {displayedGames.length === 0 && (
              <div className="col-span-full text-gray-300 bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                لا توجد نتائج مطابقة للفلاتر الحالية.
              </div>
            )}
            {displayedGames.map(game => {
              const categoryName = (categories || []).find(c => c.id === game.category_id)?.name || 'PS4'
              return (
                <div key={game.id} className="game-card group" data-game-id={game.id}>
                    <div className="game-card-image-wrapper">
                        <img 
                          src={game.image.startsWith('http') ? game.image : game.image} 
                          alt={game.title} 
                          className="game-card-image"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = cover;
                          }}
                        />
                    </div>
                    
                    <div className="game-card-content">
                        {/* Title */}
                        <h3 className="game-card-title">{game.title}</h3>
                        
                        {/* Genre Badge */}
                        {game.genre && (
                          <div className="mb-2">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              game.genre === 'رعب' ? 'bg-red-900/30 text-red-300' :
                              game.genre === 'أكشن' ? 'bg-orange-900/30 text-orange-300' :
                              game.genre === 'مغامرة' ? 'bg-amber-900/30 text-amber-300' :
                              game.genre === 'رياضة' ? 'bg-green-900/30 text-green-300' :
                              game.genre === 'سباقات' ? 'bg-cyan-900/30 text-cyan-300' :
                              game.genre === 'ألغاز' ? 'bg-fuchsia-900/30 text-fuchsia-300' :
                              game.genre === 'منصات' ? 'bg-pink-900/30 text-pink-300' :
                              game.genre === 'عالم مفتوح' ? 'bg-teal-900/30 text-teal-300' :
                              game.genre === 'تخفي' ? 'bg-slate-900/30 text-slate-300' :
                              game.genre === 'قتال' ? 'bg-purple-900/30 text-purple-300' :
                              game.genre === 'استراتيجية' ? 'bg-blue-900/30 text-blue-300' :
                              game.genre === 'تصويب' ? 'bg-indigo-900/30 text-indigo-300' :
                              game.genre === 'RPG' ? 'bg-yellow-900/30 text-yellow-300' :
                              game.genre === 'أطفال' ? 'bg-emerald-900/30 text-emerald-300' :
                              'bg-gray-900/30 text-gray-300'
                            }`}>
                              {game.genre}
                            </span>
                          </div>
                        )}
                        
                        {/* Price and Category Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-primary font-bold text-lg">
                            {game.price.toFixed(3)} د.ل
                          </span>
                          <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs font-semibold">
                            {categoryName}
                          </span>
                        </div>
                        
                        {/* Add to Cart Button */}
                        <button 
                          onClick={() => addToCart(game)} 
                          className="w-full bg-gradient-to-r from-primary to-emerald-500 hover:from-primary-dark hover:to-emerald-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          أضف للسلة
                        </button>
                    </div>
                </div>
              )
            })}
          </div>
        </section>

        <aside className="space-y-4 sm:space-y-6 lg:h-fit lg:sticky lg:top-24">
          {/* Cart Section */}
          <div className="bg-card rounded-xl shadow-sm border border-white/10 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold">السلة</h2>
              {cart.length > 0 && (
                <span className="bg-primary text-black px-2 py-1 rounded-full text-xs font-bold">
                  {cart.length}
                </span>
              )}
            </div>
            
            {cart.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm">السلة فارغة</p>
              </div>
            ) : (
              <>
                <ul className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                  {cart.map((g, i) => (
                    <li key={i} className="flex items-center gap-3 p-2 sm:p-3 bg-white/5 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium truncate" title={g.title}>
                          {g.title}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-300">
                          {currency(g.price)}
                        </p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(i)} 
                        className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-red-900/20 transition-colors"
                        aria-label="حذف من السلة"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-base sm:text-lg font-bold">الإجمالي</span>
                    <span className="text-lg sm:text-xl font-bold text-primary">{currency(total)}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <button 
                      disabled={cart.length === 0} 
                      onClick={sendOrder} 
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 text-sm sm:text-base flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      إنشاء فاتورة وطباعة
                    </button>
                    
                    <div className="text-xs sm:text-sm text-gray-400 bg-gray-800/50 p-2 rounded-lg text-center">
                      <p>سيتم إنشاء فاتورة مفصلة وطباعتها على جهاز Sunmi V2</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Top Games Section - Hidden on mobile, shown on larger screens */}
          <div className="hidden lg:block bg-card rounded-xl shadow-sm border border-white/10 p-4 sm:p-5 h-[60vh] overflow-auto toplist-scroll">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">الأكثر طلباً</h2>
            <TopList onAdd={addToCart} />
          </div>
        </aside>
        </div>
      </main>

      {/* Login Modal - Mobile optimized */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={submitLogin} 
            className="bg-gray-900 w-full max-w-sm rounded-xl p-5 sm:p-6 shadow-xl space-y-4 border border-gray-700 mx-auto"
          >
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">تسجيل الدخول</h3>
              <p className="text-sm text-gray-400">للوصول إلى لوحة التحكم</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">اسم المستخدم</label>
                <input 
                  className="w-full border border-gray-700 bg-gray-800 text-white rounded-lg px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base" 
                  placeholder="أدخل اسم المستخدم" 
                  value={loginForm.username} 
                  onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                  autoComplete="username"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">كلمة المرور</label>
                <input 
                  className="w-full border border-gray-700 bg-gray-800 text-white rounded-lg px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base" 
                  placeholder="أدخل كلمة المرور" 
                  type="password" 
                  value={loginForm.password} 
                  onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                  autoComplete="current-password"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button 
                type="button" 
                onClick={()=>setShowLogin(false)} 
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-700 bg-gray-800 text-white hover:bg-gray-700 transition-colors font-medium"
              >
                إلغاء
              </button>
              <button 
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center gap-2" 
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جارٍ الدخول...
                  </>
                ) : (
                  'دخول'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Cart Modal */}
      {showMobileCart && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden">
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-xl font-bold">السلة</h2>
              <button 
                onClick={() => setShowMobileCart(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Cart Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>السلة فارغة</p>
                </div>
              ) : (
                <>
                  <ul className="space-y-3 mb-6">
                    {cart.map((g, i) => (
                      <li key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" title={g.title}>
                            {g.title}
                          </p>
                          <p className="text-primary font-bold">
                            {currency(g.price)}
                          </p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(i)} 
                          className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-red-900/20 transition-colors"
                          aria-label="حذف من السلة"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-bold">الإجمالي:</span>
                      <span className="text-xl font-bold text-primary">{currency(total)}</span>
                    </div>
                    
                    <button 
                      disabled={cart.length === 0} 
                      onClick={() => {
                        setShowMobileCart(false)
                        sendOrder()
                      }} 
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      إنشاء فاتورة وطباعة
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
          cart={cart}
          total={total}
          onClose={handleInvoiceClose}
          onSuccess={handleInvoiceSuccess}
        />
      )}
    </div>
  )
}


