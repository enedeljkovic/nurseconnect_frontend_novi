
import axios from 'axios'

const BASE = (import.meta.env.VITE_API_BASE_URL || 'https://nurseconnect-backend-novi.onrender.com').replace(/\/+$/,'')

export const api = axios.create({
  baseURL: BASE,
  timeout: 20000,
})
export default api
