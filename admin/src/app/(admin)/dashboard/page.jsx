"use client";
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../../../services/admin.service';
import { getAllOrders } from '../../../services/orders.service';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Banknote, ShoppingBag, Users, Coffee } from 'lucide-react';
import clsx from 'clsx';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
        <p className="text-sm text-slate-500 mb-1">{label}</p>
        <p className="text-amber-800 font-bold">
          Rp {payload[0].value.toLocaleString('id-ID')}
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  const { data: ordersData, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => getAllOrders({ limit: 5 }),
  });

  if (!mounted) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
       {Array.from({ length: 4 }).map((_, i) => (
         <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-2xl"></div>
       ))}
    </div>
  );

  const stats = statsData?.data || {};
  const recentOrders = ordersData?.data || [];
  const chartData = stats.salesChart || [];

  const getStatusBadge = (statusName) => {
    const s = statusName?.toLowerCase() || '';
    let colorClass = 'bg-slate-100 text-slate-800';
    if (s === 'pending') colorClass = 'bg-yellow-100 text-yellow-800';
    else if (s === 'processing' || s === 'diproses') colorClass = 'bg-blue-100 text-blue-800';
    else if (s === 'completed' || s === 'selesai') colorClass = 'bg-green-100 text-green-800';
    else if (s === 'cancelled' || s === 'dibatalkan') colorClass = 'bg-red-100 text-red-800';
    
    return (
      <span className={clsx("px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider", colorClass)}>
        {statusName || 'Unknown'}
      </span>
    );
  };

  const metrics = [
    { label: 'Pendapatan Hari Ini', value: `Rp ${(stats.todayRevenue || 0).toLocaleString('id-ID')}`, icon: Banknote, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Order Hari Ini', value: stats.todayOrders || 0, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Pelanggan Terdaftar', value: stats.totalCustomers || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Produk Aktif', value: stats.activeProducts || 0, icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isStatsLoading ? (
          // Skeleton for cards
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-xl animate-pulse"></div>
              <div className="flex-1 space-y-3 mt-1">
                <div className="w-24 h-3 bg-slate-200 rounded animate-pulse"></div>
                <div className="w-32 h-6 bg-slate-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))
        ) : (
          metrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4 group hover:shadow-md transition-shadow">
                <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", item.bg, item.color)}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{item.value}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Penjualan 7 Hari Terakhir</h3>
          {isStatsLoading ? (
            <div className="w-full h-[300px] bg-slate-200 rounded-xl animate-pulse"></div>
          ) : chartData.length > 0 ? (
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12 }} 
                    tickFormatter={(value) => `Rp ${(value / 1000)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#854F0B" 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#854F0B' }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#854F0B' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="w-full h-[300px] flex items-center justify-center text-slate-500">
              Belum ada data penjualan untuk minggu ini.
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">5 Pesanan Terbaru</h3>
          <div className="flex-1">
            {isOrdersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center pb-4 border-b border-slate-50">
                    <div className="space-y-2">
                      <div className="w-20 h-4 bg-slate-200 rounded animate-pulse"></div>
                      <div className="w-32 h-3 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-2 text-right flex flex-col items-end">
                      <div className="w-24 h-4 bg-slate-200 rounded animate-pulse"></div>
                      <div className="w-16 h-5 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex justify-between items-center pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                    <div>
                      <p className="font-bold text-sm text-amber-700 hover:underline cursor-pointer">
                        #{order.orderNumber}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{order.user?.name || 'Pelanggan Guest'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-slate-800">
                        Rp {(order.totalAmount || 0).toLocaleString('id-ID')}
                      </p>
                      <div className="mt-1.5">
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 pb-10">
                Belum ada pesanan masuk.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
