"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Coffee, 
  Users, 
  Percent, 
  MapPin, 
  Settings,
  Tag,
  Bell,
  X
} from 'lucide-react';
import clsx from 'clsx';

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Pesanan', path: '/orders', icon: ShoppingBag },
  { name: 'Produk', path: '/products', icon: Coffee, exact: true },
  { name: 'Kategori', path: '/products/categories', icon: Tag },
  { name: 'Pelanggan', path: '/customers', icon: Users },
  { name: 'Promo', path: '/promos', icon: Percent },
  { name: 'Notifikasi', path: '/notifications', icon: Bell },
  { name: 'Toko & Cabang', path: '/stores', icon: MapPin },
  { name: 'Pengaturan', path: '/settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar Navigation */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-50 bg-amber-900 flex flex-col shrink-0 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 h-screen w-[240px]",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-amber-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-800 rounded-lg flex items-center justify-center text-amber-200">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Toko Kopi Jaya</h1>
              <p className="text-amber-200/70 text-xs">Admin Panel</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-amber-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Menu Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            
            // Logika aktif: jika exact, pathname harus persis sama. Jika tidak, bisa match awalan (misal /customers/1)
            const isActive = item.exact 
              ? pathname === item.path 
              : pathname === item.path || pathname?.startsWith(`${item.path}/`);
            
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={clsx(
                  'flex items-center px-4 py-3 rounded-xl transition-colors group',
                  isActive 
                    ? 'bg-amber-700 text-white font-medium shadow-sm' 
                    : 'text-amber-100 hover:bg-amber-800'
                )}
              >
                <Icon 
                  className={clsx(
                    "w-5 h-5 mr-3 shrink-0", 
                    isActive ? "text-white" : "text-amber-200 group-hover:text-amber-100"
                  )} 
                />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
