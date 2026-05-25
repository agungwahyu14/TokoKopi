import axios from 'axios';
import { API_URL } from '../constants/Colors';

import { useAuthStore } from '../store/useStore';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for adding token
api.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().token;
  console.log('token', token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
