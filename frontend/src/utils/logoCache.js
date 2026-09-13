let cachedLogoDataUrl = null

export async function preloadLogo(origin) {
  if (cachedLogoDataUrl) return cachedLogoDataUrl
  try {
    const res = await fetch(`${origin}/invoice-header.png`)
    const blob = await res.blob()
    cachedLogoDataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result)
      r.onerror = reject
      r.readAsDataURL(blob)
    })
  } catch (_) { /* fallback to direct img path in invoicePrint */ }
  return cachedLogoDataUrl
}

export function getCachedLogo() {
  return cachedLogoDataUrl
}
