import { create } from 'zustand';

export const useToastStore = create((set) => ({
  toasts: [],
  
  addToast: (type, message) => {
    const id = Date.now();
    
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }]
    }));
    
    // Otomatis hapus setelah 3 detik
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(toast => toast.id !== id)
      }));
    }, 3000);
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter(toast => toast.id !== id)
    }));
  }
}));
