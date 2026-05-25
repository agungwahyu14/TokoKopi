"use client";

import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { LogOut, Menu } from 'lucide-react';

const routeNames = {
  '/dashboard': 'Dashboard',
  '/orders': 'Pesanan',
  '/products/categories': 'Kategori Menu',
  '/products': 'Menu & Produk',
  '/customers': 'Pelanggan',
  '/promos': 'Promo',
  '/stores': 'Toko & Cabang',
  '/settings': 'Pengaturan',
};

export default function Header({ onMenuClick }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  
  // Mendapatkan judul halaman berdasarkan rute yang sedang aktif
  const getPageTitle = () => {
    // Exact match terlebih dahulu, atau startsWith untuk child route
    if (pathname === '/products') return routeNames['/products'];
    
    const match = Object.keys(routeNames).find(
      route => pathname === route || pathname?.startsWith(`${route}/`)
    );
    return match ? routeNames[match] : 'Dashboard';
  };

  // Mengambil inisial huruf pertama dan kedua (atau nama belakang)
  const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const userName = user?.name || 'Administrator';
  const initial = getInitials(user?.name);

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 sm:px-8 shrink-0 z-10 sticky top-0">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="mr-4 lg:hidden p-2 -ml-2 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800 hidden sm:block">
          {getPageTitle()}
        </h2>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <span className="text-sm font-bold text-slate-800 block">{userName}</span>
            <span className="text-xs text-slate-500 block -mt-0.5 capitalize">{user?.role || 'Admin'}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold border-2 border-amber-200 shadow-sm">
            {initial}
          </div>
        </div>
        
        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
        
        <button 
          onClick={() => logout()}
          className="flex items-center text-slate-500 hover:text-red-600 transition-colors p-2 rounded-xl hover:bg-red-50"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
          <span className="ml-2 text-sm font-medium hidden md:block">Logout</span>
        </button>
      </div>
    </header>
  );
}
