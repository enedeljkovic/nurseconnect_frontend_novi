import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;


axios.interceptors.request.use((config) => {
  const local = 'http://localhost:3001';
  if (typeof config.url === 'string' && config.url.startsWith(local)) {
    config.url = config.url.slice(local.length); 
  }
  return config;
});
