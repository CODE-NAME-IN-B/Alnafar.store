import axios from 'axios'

// Allow overriding API base from Vite env (e.g., VITE_API_BASE=http://localhost:5000/api)
const API_BASE = import.meta?.env?.VITE_API_BASE || '/api'
export const api = axios.create({ baseURL: API_BASE })

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


