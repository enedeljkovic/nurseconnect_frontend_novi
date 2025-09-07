import axios from 'axios'

// Baza bez završne kosine
const BASE = (import.meta.env.VITE_API_BASE_URL || 'https://nurseconnect-backend-novi.onrender.com').replace(/\/+$/, '')

const api = axios.create({
  baseURL: BASE,
  timeout: 20000,
})

// ⬇️ Dodaj Bearer token (admin ima prednost)
api.interceptors.request.use((config) => {
  const adminToken =
    localStorage.getItem('adminToken') || localStorage.getItem('admin-token')

  const userToken =
    localStorage.getItem('user-token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt')

  const token = adminToken || userToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export { api }
export default api
