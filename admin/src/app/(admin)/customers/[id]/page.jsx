"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  getCustomerById, 
  getCustomerOrders, 
  getCustomerPoints, 
  getCustomerStats 
} from '../../../../services/customerService';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  ShoppingBag, 
  Award, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
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
    return format(parseISO(dateString), 'dd MMM yyyy, HH:mm', { locale: localeId });
  } catch (error) {
    return dateString;
  }
};

const TIER_COLORS = {
  bronze: 'bg-orange-100 text-orange-800 border-orange-200',
  silver: 'bg-gray-100 text-gray-800 border-gray-200',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  platinum: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id;

  const [activeTab, setActiveTab] = useState('orders');

  const { data: customerData, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => getCustomerById(customerId),
    enabled: !!customerId,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['customerOrders', customerId],
    queryFn: () => getCustomerOrders(customerId, { limit: 50 }),
    enabled: !!customerId && activeTab === 'orders',
  });

  const { data: pointsData, isLoading: pointsLoading } = useQuery({
    queryKey: ['customerPoints', customerId],
    queryFn: () => getCustomerPoints(customerId, { limit: 50 }),
    enabled: !!customerId && activeTab === 'points',
  });

  const { data: statsData } = useQuery({
    queryKey: ['customerStats', customerId],
    queryFn: () => getCustomerStats(customerId),
    enabled: !!customerId,
  });

  const customer = customerData?.data || {};
  const orders = ordersData?.data || [];
  const pointHistory = pointsData?.data || [];
  const stats = statsData?.data || {};

  const isLoading = customerLoading;

  const getTierBadge = (tierName) => {
    const key = tierName?.toLowerCase() || '';
    const colorClass = TIER_COLORS[key] || 'bg-gray-100 text-gray-800 border-gray-200';
    return (
      <span className={clsx("px-3 py-1 text-xs font-semibold rounded-full border", colorClass)}>
        {tierName || 'Unknown'}
      </span>
    );
  };

  const getStatusBadge = (statusName) => {
    const statusLower = statusName?.toLowerCase();
    let colorClass = 'bg-gray-100 text-gray-800';
    if (statusLower === 'pending') colorClass = 'bg-yellow-100 text-yellow-800';
    else if (statusLower === 'diproses') colorClass = 'bg-blue-100 text-blue-800';
    else if (statusLower === 'selesai') colorClass = 'bg-green-100 text-green-800';
    else if (statusLower === 'dibatalkan') colorClass = 'bg-red-100 text-red-800';
    
    return (
      <span className={clsx("px-2.5 py-1 text-xs font-medium rounded-full", colorClass)}>
        {statusName || 'Unknown'}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Profile */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[#854F0B] to-amber-600"></div>
        <div className="px-6 sm:px-8 pb-6">
          <div className="relative flex justify-between items-end -mt-10 mb-4">
            <div className="flex items-end space-x-5">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-amber-100 flex items-center justify-center text-3xl font-bold text-amber-800 shadow-sm">
                {customer.name?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div className="pb-2">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  {customer.name}
                  {getTierBadge(customer.tier)}
                </h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {customer.email || '-'}</span>
                  <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {customer.phone || '-'}</span>
                </p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/customers')}
              className="mb-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Order</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{stats.totalOrders || customer.totalOrders || 0}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-green-50 rounded-lg text-green-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Belanja</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{formatRupiah(stats.totalSpent || customer.totalSpent)}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Rata-rata Nilai Order</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{formatRupiah(stats.averageOrderValue || 0)}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Poin</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{customer.totalPoints || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Main Column: Tabs (Orders/Points) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
            {/* Tab Header */}
            <div className="flex border-b border-gray-100">
              <button 
                onClick={() => setActiveTab('orders')}
                className={clsx(
                  "px-6 py-4 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'orders' ? "border-amber-600 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                )}
              >
                Riwayat Pesanan
              </button>
              <button 
                onClick={() => setActiveTab('points')}
                className={clsx(
                  "px-6 py-4 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'points' ? "border-amber-600 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                )}
              >
                Riwayat Poin
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-x-auto relative">
              {activeTab === 'orders' && (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order / Tanggal</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ordersLoading && <tr><td colSpan="4" className="text-center py-8 text-gray-500">Memuat data...</td></tr>}
                    {!ordersLoading && orders.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-gray-500">Belum ada riwayat pesanan.</td></tr>}
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-amber-700 cursor-pointer hover:underline">#{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate" title={order.itemsSummary}>
                          {order.itemsSummary || `${order.items?.length || 0} produk`}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">
                          {formatRupiah(order.totalAmount)}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(order.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'points' && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deskripsi</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Poin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pointsLoading && <tr><td colSpan="3" className="text-center py-8 text-gray-500">Memuat data...</td></tr>}
                    {!pointsLoading && pointHistory.length === 0 && <tr><td colSpan="3" className="text-center py-8 text-gray-500">Belum ada riwayat poin.</td></tr>}
                    {pointHistory.map((pt, idx) => {
                      const isEarned = pt.type === 'earned';
                      return (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-500">{formatDate(pt.createdAt)}</td>
                          <td className="px-6 py-4 text-sm text-gray-800">{pt.description}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={clsx(
                              "inline-flex items-center text-sm font-bold",
                              isEarned ? "text-green-600" : "text-red-600"
                            )}>
                              {isEarned ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                              {isEarned ? '+' : '-'}{pt.amount}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Quick Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4 flex items-center">
              <ShoppingBag className="w-4 h-4 mr-2 text-amber-600" /> Produk Sering Dipesan
            </h3>
            <ul className="space-y-4">
              {stats.mostOrderedProducts?.length > 0 ? (
                stats.mostOrderedProducts.map((product, idx) => (
                  <li key={idx} className="flex justify-between items-start border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm text-gray-800">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.category || 'Kategori'}</p>
                    </div>
                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {product.count}x
                    </span>
                  </li>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">Belum ada data produk.</p>
              )}
            </ul>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-amber-600" /> Info Akun
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-sm text-gray-500">Tgl Bergabung</span>
                <span className="text-sm font-medium text-gray-800">{formatDate(customer.joinDate || customer.createdAt)}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-sm text-gray-500">Terakhir Order</span>
                <span className="text-sm font-medium text-gray-800">{formatDate(stats.lastOrderDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status Akun</span>
                <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">Aktif</span>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
