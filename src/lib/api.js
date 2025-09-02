
import axios from 'axios';


const BASE = (import.meta.env.VITE_API_BASE_URL || 'https://nurseconnect-backend-novi.onrender.com')
  .replace(/\/+$/, ''); 

export const api = axios.create({
  baseURL: BASE,        
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000
});
