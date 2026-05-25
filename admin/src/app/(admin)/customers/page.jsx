"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllUsers, updateUserPoints } from '../../../services/users.service';
import { getAllOrders } from '../../../services/orders.service';
import { getLoyaltyPoints } from '../../../services/loyalty.service';
import { 
  Search, 
  X, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  ShoppingBag, 
  Award, 
  ChevronLeft, 
  ChevronRight,
  UserCircle,
  Edit2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import clsx from 'clsx';

const formatRupiah = (number) => {
  if (number === undefined || number === null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return format(parseISO(dateString), 'dd MMM yyyy', { locale: localeId });
  } catch (error) {
    return dateString;
  }
};

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function CustomersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditingPoints, setIsEditingPoints] = useState(false);
  const [newPoints, setNewPoints] = useState(0);
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Main users query
  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users', search, page],
    queryFn: () => getAllUsers({ search, page, limit: 15 }),
    keepPreviousData: true,
  });

  const users = usersResponse?.data || [];
  const meta = usersResponse?.meta || { total: 0, totalPages: 1, page: 1 };

  // Recent orders query for detail panel
  const { data: recentOrdersResponse, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['user-orders', selectedUser?.id],
    queryFn: () => getAllOrders({ userId: selectedUser.id, limit: 5 }),
    enabled: !!selectedUser,
  });

  const recentOrders = recentOrdersResponse?.data || [];

  const mutationUpdatePoints = useMutation({
    mutationFn: updateUserPoints,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setIsEditingPoints(false);
      // Update local state if needed or just rely on query invalidation
      if (selectedUser) {
          setSelectedUser(prev => ({ ...prev, points: newPoints }));
      }
    }
  });

  const handleUpdatePoints = () => {
    mutationUpdatePoints.mutate({ id: selectedUser.id, points: parseInt(newPoints) });
  };

  if (!mounted) return (
    <div className="space-y-6">
       <div className="h-10 w-48 bg-slate-200 animate-pulse rounded-lg"></div>
       <div className="h-64 w-full bg-slate-100 animate-pulse rounded-xl"></div>
    </div>
  );


  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <div className="space-y-6 flex-1 overflow-y-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Pelanggan</h1>
          <p className="text-slate-500 text-sm mt-1">Daftar semua pelanggan yang terdaftar di sistem Toko Kopi Jaya</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500 transition-colors"
              placeholder="Cari nama atau email pelanggan..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pelanggan</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Telepon</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Order</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Belanja</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Poin</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bergabung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 w-40 bg-slate-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-48 bg-slate-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-100 rounded"></div></td>
                  </tr>
                ))}
                {!isLoading && users.map((user) => (
                  <tr 
                    key={user.id} 
                    onClick={() => setSelectedUser(user)}
                    className={clsx(
                      "hover:bg-amber-50 cursor-pointer transition-colors group",
                      selectedUser?.id === user.id ? "bg-amber-50" : ""
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 font-bold">
                          {getInitials(user.name)}
                        </div>
                        <span className="font-semibold text-sm text-slate-800 group-hover:text-amber-700">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-800 font-medium">{user.totalOrders || 0} Order</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{formatRupiah(user.totalSpent || 0)}</td>
                    <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            {user.points || 0} Pts
                        </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Menampilkan <span className="font-medium text-slate-800">{users.length}</span> dari <span className="font-medium text-slate-800">{meta.total}</span> pelanggan
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(old => Math.max(old - 1, 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage(old => (old < meta.totalPages ? old + 1 : old))}
                disabled={page >= meta.totalPages}
                className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-in Detail Panel */}
      <div className={clsx(
        "fixed inset-y-0 right-0 z-[60] w-[380px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-slate-100 flex flex-col",
        selectedUser ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="px-6 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <UserCircle className="w-5 h-5 mr-2 text-amber-700" />
            Detail Pelanggan
          </h2>
          <button 
            onClick={() => setSelectedUser(null)} 
            className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {selectedUser && (
            <>
              {/* Profile Overview */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center text-amber-700 text-2xl font-black mx-auto shadow-sm">
                  {getInitials(selectedUser.name)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedUser.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{selectedUser.email}</p>
                </div>
              </div>

              {/* Info List */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700">{selectedUser.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700">Bergabung: {formatDate(selectedUser.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700">Total: {selectedUser.totalOrders || 0} Transaksi</span>
                </div>
              </div>

              {/* Recent Orders */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pesanan Terakhir</h4>
                </div>
                <div className="space-y-3">
                  {isOrdersLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-14 bg-slate-50 rounded-lg animate-pulse"></div>
                    ))
                  ) : recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <div key={order.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg hover:border-amber-200 hover:bg-amber-50 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-amber-700">#{order.orderNumber}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-800">{formatRupiah(order.totalAmount)}</p>
                          <p className={clsx(
                            "text-[10px] font-medium capitalize",
                            order.status === 'completed' ? "text-green-600" : "text-amber-600"
                          )}>{order.status}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada riwayat pesanan.</p>
                  )}
                </div>
              </div>

              {/* Loyalty Section */}
              <div className="mt-auto pt-6 border-t border-slate-100">
                <div className="bg-gradient-to-br from-amber-600 to-amber-800 p-5 rounded-2xl text-white shadow-lg shadow-amber-900/20 relative overflow-hidden group">
                  <Award className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform pointer-events-none" />
                  <p className="text-xs font-medium text-amber-100/80 mb-1 uppercase tracking-widest">Poin Loyalti</p>
                  <div className="flex items-end gap-2">
                    {isEditingPoints ? (
                      <div className="flex flex-col gap-2 w-full mt-2">
                        <input 
                          type="number" 
                          value={newPoints} 
                          onChange={(e) => setNewPoints(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:bg-white/30"
                          placeholder="Masukkan jumlah poin..."
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={handleUpdatePoints}
                            disabled={mutationUpdatePoints.isLoading}
                            className="flex-1 bg-white text-amber-800 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-50 transition-colors"
                          >
                            {mutationUpdatePoints.isLoading ? '...' : 'Simpan'}
                          </button>
                          <button 
                            onClick={() => setIsEditingPoints(false)}
                            className="flex-1 bg-amber-900/40 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-amber-900/60 transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-4xl font-black">{selectedUser.points || 0}</span>
                        <span className="text-xs font-medium mb-2 text-amber-200">POIN</span>
                        <button 
                          onClick={() => {
                            setNewPoints(selectedUser.points || 0);
                            setIsEditingPoints(true);
                          }}
                          className="ml-auto mb-1 p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors relative z-10"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
