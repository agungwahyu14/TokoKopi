import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') : '',
});

axiosInstance.interceptors.request.use(
  (config) => {
    // Membaca token dari Zustand authStore
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Header khusus untuk bypass halaman peringatan dari ngrok gratis
    config.headers['ngrok-skip-browser-warning'] = 'true';
    
    // LOGGING REQUEST
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`, config.params || '', config.data || '');
    
    return config;
  },
  (error) => {
    console.error(`[API Request Error]`, error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    // LOGGING RESPONSE
    console.log(`[API Response] ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    // LOGGING ERROR
    console.error(`[API Error] ${error.response?.status} ${error.config?.url}`, error.response?.data || error.message);
    
    if (error.response && error.response.status === 401) {
      const logout = useAuthStore.getState().logout;
      logout();
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
