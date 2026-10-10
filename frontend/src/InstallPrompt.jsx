import React, { useEffect, useState } from 'react'

const DISMISS_TTL = 14 * 24 * 60 * 60 * 1000

function isStandalone() {
  try {
    return (
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true
    )
  } catch (_) {
    return false
  }
}

function isIOS() {
  try {
    return /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.navigator.standalone
  } catch (_) {
    return false
  }
}

function isDismissed() {
  try {
    const raw = localStorage.getItem('pwa-dismissed-at')
    if (!raw) return false
    const at = parseInt(raw, 10)
    return !Number.isNaN(at) && Date.now() - at < DISMISS_TTL
  } catch (_) {
    return false
  }
}

function isInstalledFlag() {
  try {
    return localStorage.getItem('pwa-installed') === '1'
  } catch (_) {
    return false
  }
}

const IOS_STEPS = [
  {
    label: 'اضغط زر المشاركة في شريط المتصفح',
    d: 'M12 16V4m0 0L8 8m4-4l4 4M5 13v5a2 2 0 002 2h10a2 2 0 002-2v-5',
  },
  {
    label: 'مرّر للأسفل واختر «إضافة إلى الشاشة الرئيسية»',
    d: 'M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6zM12 8.25v7.5m3.75-3.75h-7.5',
  },
  {
    label: 'اضغط «إضافة» لتثبيت التطبيق على جهازك',
    d: 'M9 12.75l2.25 2.25 4.5-6.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
]

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(() => isInstalledFlag())
  const [dismissed, setDismissed] = useState(false)
  const [hiddenForSession, setHiddenForSession] = useState(false)
  const [showIOSHelp, setShowIOSHelp] = useState(false)

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    const onInstalled = () => {
      try { localStorage.setItem('pwa-installed', '1') } catch (_) {}
      setInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    if (isDismissed()) setDismissed(true)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const ios = isIOS()
  const visible =
    !installed &&
    !dismissed &&
    !hiddenForSession &&
    !isStandalone() &&
    (!!deferredPrompt || ios)

  if (!visible) return null

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice
        if (choice && choice.outcome === 'accepted') {
          try { localStorage.setItem('pwa-installed', '1') } catch (_) {}
          setInstalled(true)
        }
      } catch (_) {}
      setDeferredPrompt(null)
      return
    }
    if (ios) setShowIOSHelp(true)
  }

  const dismissLater = () => {
    try { localStorage.setItem('pwa-dismissed-at', String(Date.now())) } catch (_) {}
    setDismissed(true)
    setShowIOSHelp(false)
  }

  const dismissNow = () => {
    setHiddenForSession(true)
    setShowIOSHelp(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        aria-label="تثبيت التطبيق"
        className="fixed z-50 inline-flex items-center gap-2 rounded-full px-5 py-3 min-h-[44px] font-bold text-black bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 shadow-lg shadow-teal-500/30 transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1724]"
        style={{
          bottom: 'calc(16px + env(safe-area-inset-bottom))',
          right: '16px',
          left: 'auto',
        }}
      >
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        تثبيت التطبيق
      </button>

      {showIOSHelp && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setShowIOSHelp(false)}
          role="dialog"
          aria-modal="true"
          aria-label="تعليمات تثبيت التطبيق"
        >
          <div
            dir="rtl"
            className="glass w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 sm:p-6 text-right shadow-2xl tab-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-center gap-3 mb-5">
              <span className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/25 text-teal-400 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </span>
              <h2 className="text-lg font-extrabold text-white">أضف التطبيق إلى الشاشة الرئيسية</h2>
            </div>

            <ol className="space-y-4 mb-6">
              {IOS_STEPS.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-teal-500/15 border border-teal-500/25 text-teal-300 font-bold text-sm flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-gray-300 flex items-center justify-center shrink-0">
                    <svg className="shrink-0" style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d={step.d} />
                    </svg>
                  </span>
                  <span className="text-sm text-gray-300 leading-relaxed pt-1">{step.label}</span>
                </li>
              ))}
            </ol>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={dismissLater}
                className="flex-1 min-h-[44px] rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold text-sm transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
              >
                لاحقًا
              </button>
              <button
                type="button"
                onClick={dismissNow}
                className="flex-1 min-h-[44px] rounded-xl bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-black font-bold text-sm transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
              >
                حسنًا
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
