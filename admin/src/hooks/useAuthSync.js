"use client";

import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export const useAuthSync = () => {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    // Jalankan inisialisasi state auth dari localStorage
    initAuth();

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('tkj_token');
      if (token) {
        // Sinkronisasi token ke cookie agar dapat dibaca middleware
        document.cookie = `tkj_token=${token}; path=/; max-age=86400; SameSite=Lax`;
      } else {
        // Jika token tidak ada di localStorage, pastikan cookie dihapus
        document.cookie = 'tkj_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      }
    }
  }, [initAuth]);
};
