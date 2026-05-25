import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (user, token) => {
    set({ user, token, isAuthenticated: true });
    if (typeof window !== 'undefined') {
      localStorage.setItem('tkj_user', JSON.stringify(user));
      localStorage.setItem('tkj_token', token);
      // Sinkronisasi cookie juga dilakukan di sini sebagai fallback
      document.cookie = `tkj_token=${token}; path=/; max-age=86400; SameSite=Lax`;
    }
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tkj_user');
      localStorage.removeItem('tkj_token');
      // Menghapus cookie
      document.cookie = 'tkj_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      // Redirect menghindari history
      window.location.replace('/login');
    }
  },

  updateUser: (user) => {
    set({ user });
    if (typeof window !== 'undefined') {
      localStorage.setItem('tkj_user', JSON.stringify(user));
    }
  },

  initAuth: () => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('tkj_token');
      const storedUser = localStorage.getItem('tkj_user');
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          set({
            token: storedToken,
            user: parsedUser,
            isAuthenticated: true
          });
        } catch (error) {
          console.error('Gagal mem-parsing data user:', error);
          localStorage.removeItem('tkj_user');
          localStorage.removeItem('tkj_token');
        }
      }
    }
  }
}));
