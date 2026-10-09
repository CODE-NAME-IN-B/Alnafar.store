import axios from 'axios'

// Allow overriding API base from Vite env (e.g., VITE_API_BASE=http://localhost:5000/api)
const API_BASE = import.meta?.env?.VITE_API_BASE || '/api'
export const api = axios.create({ baseURL: API_BASE })

// ── نطاق الفرع النشط في لوحة التحكم ──
// null = كل الفروع (الأدمن الرئيسي). يُرسَل كـ ?branchId= مع كل الطلب.
let activeBranchId = null
export function setActiveBranchId(id) {
  activeBranchId = (id === null || id === undefined || id === '' || id === 'all') ? null : id
}
export function getActiveBranchId() {
  return activeBranchId
}

api.interceptors.request.use(
  config => {
    // لا نُجبر الفرع النشط إذا حدّد الطلب فرعه بنفسه (مثال: فلتر سجل النشاط)
    if (activeBranchId != null && config.params?.branchId == null) {
      config.params = { ...(config.params || {}), branchId: activeBranchId }
    }
    return config
  },
  error => Promise.reject(error)
)

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      setAuthToken(null)
      window.location.hash = '#/admin'
    }
    return Promise.reject(error)
  }
)

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('token', token)
  } else {
    delete api.defaults.headers.common['Authorization']
    localStorage.removeItem('token')
  }
}

export function loadAuthFromStorage() {
  const token = localStorage.getItem('token')
  if (token) setAuthToken(token)
}


