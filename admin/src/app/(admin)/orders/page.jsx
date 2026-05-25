"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllOrders, getOrderById, updateOrderStatus, requestDelivery } from '../../../services/orders.service';
import { useToastStore } from '../../../store/toastStore';
import { Search, Eye, X, ChevronLeft, ChevronRight, FileText, User, MapPin, CreditCard, ShoppingBag, Truck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import clsx from 'clsx';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'pending_payment', label: 'Menunggu Pembayaran' },
  { value: 'confirmed', label: 'Pesanan Dikonfirmasi' },
  { value: 'processing', label: 'Makanan & Minuman Disiapkan' },
  { value: 'ready_for_pickup', label: 'Selesai Disiapkan (Pickup)' },
  { value: 'on_delivery', label: 'Pesanan Sedang Diantarkan' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

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
    return format(parseISO(dateString), 'dd MMM yyyy HH:mm', { locale: localeId });
  } catch (error) {
    return dateString;
  }
};

const getStatusBadge = (statusName) => {
  const s = statusName?.toLowerCase() || '';
  let colorClass = 'bg-slate-100 text-slate-800 border-slate-200';

  if (s === 'pending' || s === 'pending_payment') {
    colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
  } else if (s === 'confirmed') {
    colorClass = 'bg-cyan-100 text-cyan-800 border-cyan-200';
  } else if (s === 'processing' || s === 'diproses') {
    colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
  } else if (s === 'ready_for_pickup') {
    colorClass = 'bg-indigo-100 text-indigo-800 border-indigo-200';
  } else if (s === 'on_delivery') {
    colorClass = 'bg-purple-100 text-purple-800 border-purple-200';
  } else if (s === 'completed' || s === 'selesai') {
    colorClass = 'bg-green-100 text-green-800 border-green-200';
  } else if (s === 'cancelled' || s === 'dibatalkan') {
    colorClass = 'bg-red-100 text-red-800 border-red-200';
  }

  const label = STATUS_OPTIONS.find(opt => opt.value === s)?.label || s;

  return (
    <span className={clsx("px-2.5 py-1 text-xs font-semibold rounded-full border", colorClass)}>
      {label}
    </span>
  );
};

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // Reset page on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Main data query
  const { data: ordersResponse, isLoading, isFetching } = useQuery({
    queryKey: ['orders', search, statusFilter, page],
    queryFn: () => getAllOrders({
      search,
      status: statusFilter === 'all' ? '' : statusFilter,
      page,
      limit
    }),
    keepPreviousData: true,
  });

  const orders = ordersResponse?.data || [];
  const meta = ordersResponse?.meta || { total: 0, totalPages: 1, page: 1 };

  // Detail modal query
  const { data: detailResponse, isLoading: isDetailLoading } = useQuery({
    queryKey: ['order', selectedOrderId],
    queryFn: () => getOrderById(selectedOrderId),
    enabled: !!selectedOrderId,
  });

  const orderDetail = detailResponse?.data;

  // Set local state for dropdown when detail loads
  useEffect(() => {
    if (orderDetail) {
      setNewStatus(orderDetail.status?.toLowerCase());
    }
  }, [orderDetail]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['order', selectedOrderId]);
      addToast('success', 'Status pesanan berhasil diperbarui');
    },
    onError: (err) => {
      addToast('error', err.response?.data?.message || err.message || 'Gagal mengubah status pesanan');
    }
  });

  const handleUpdateStatus = () => {
    if (!newStatus || newStatus === orderDetail?.status?.toLowerCase()) return;
    updateStatusMutation.mutate({ id: selectedOrderId, status: newStatus });
  };

  const requestDeliveryMutation = useMutation({
    mutationFn: (id) => requestDelivery(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['order', selectedOrderId]);
      addToast('success', `Kurir berhasil dipanggil! Status pesanan → Sedang Diantarkan. ${data?.message?.includes('auto-switch') ? '⚠️ ' + data.message.match(/\(auto-switch[^)]+\)/)?.[0] : ''}`);
    },
    onError: (err) => {
      addToast('error', err.response?.data?.message || err.message || 'Gagal memanggil kurir');
    }
  });

  const handleRequestDelivery = () => {
    if (!selectedOrderId) return;
    requestDeliveryMutation.mutate(selectedOrderId);
  };

  const handleCloseModal = () => {
    setSelectedOrderId(null);
    setNewStatus('');
  };

  if (!mounted) return (
    <div className="space-y-6">
      <div className="h-10 w-48 bg-slate-200 animate-pulse rounded-lg"></div>
      <div className="h-64 w-full bg-slate-100 animate-pulse rounded-xl"></div>
    </div>
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Pesanan</h1>
          <p className="text-slate-500 text-sm mt-1">Pantau dan kelola pesanan pelanggan dari semua cabang</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500 transition-colors"
            placeholder="Cari no. order atau nama pelanggan..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="block w-full md:w-48 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative">
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">No. Order</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pelanggan</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cabang</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Metode Bayar</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!isLoading && orders.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>Tidak ada pesanan yang ditemukan.</p>
                  </td>
                </tr>
              )}
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-amber-700">#{order.orderNumber}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">
                    {order.user?.name || 'Guest'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {order.store?.name || 'Utama'}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">
                    {formatRupiah(order.totalAmount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 capitalize">
                    {order.paymentMethod || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedOrderId(order.id)}
                      className="inline-flex items-center px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1.5" /> Lihat Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Halaman <span className="font-medium text-slate-800">{meta.page}</span> dari <span className="font-medium text-slate-800">{meta.totalPages}</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(old => Math.max(old - 1, 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage(old => (old < meta.totalPages ? old + 1 : old))}
              disabled={page >= meta.totalPages || meta.totalPages === 0}
              className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                Detail Pesanan
                {orderDetail && (
                  <span className="ml-3 text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded text-sm">#{orderDetail.orderNumber}</span>
                )}
              </h2>
              <button onClick={handleCloseModal} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-white">
              {isDetailLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : orderDetail ? (
                <div className="space-y-8">
                  {/* Info Header */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <User className="w-5 h-5 text-slate-400 mr-3 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Pelanggan</p>
                          <p className="text-sm font-semibold text-slate-800">{orderDetail.user?.name || 'Guest'}</p>
                          {orderDetail.user?.phone && <p className="text-xs text-slate-600 mt-0.5">{orderDetail.user.phone}</p>}
                        </div>
                      </div>
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-slate-400 mr-3 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Cabang & Tipe Order</p>
                          <p className="text-sm font-semibold text-slate-800">{orderDetail.store?.name || 'Cabang Utama'}</p>
                          <p className="text-xs text-slate-600 mt-0.5 capitalize">{orderDetail.orderType || 'Dine-in'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start">
                        <CreditCard className="w-5 h-5 text-slate-400 mr-3 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Pembayaran</p>
                          <p className="text-sm font-semibold text-slate-800 capitalize">{orderDetail.paymentMethod || 'Cash'}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{formatDate(orderDetail.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <ShoppingBag className="w-5 h-5 text-slate-400 mr-3 mt-0.5 shrink-0" />
                        <div className="w-full pr-4">
                          <p className="text-xs text-slate-500 font-medium mb-1.5">Status Pesanan</p>
                          <div className="flex items-center gap-2">
                            <select
                              value={newStatus}
                              onChange={(e) => setNewStatus(e.target.value)}
                              className="block w-full text-sm border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 px-2 py-1.5"
                            >
                              {STATUS_OPTIONS.filter(o => {
                                if (o.value === 'all') return false;
                                // Sembunyikan "Sedang Diantarkan" jika bukan delivery
                                if (orderDetail.orderType !== 'delivery' && o.value === 'on_delivery') return false;
                                // Sembunyikan "Selesai Disiapkan (Pickup)" jika delivery

                                return true;
                              }).map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <button
                              onClick={handleUpdateStatus}
                              disabled={updateStatusMutation.isLoading || newStatus === orderDetail.status?.toLowerCase()}
                              className="px-3 py-1.5 bg-amber-700 text-white rounded-md text-xs font-semibold hover:bg-amber-800 disabled:opacity-50 whitespace-nowrap transition-colors"
                            >
                              {updateStatusMutation.isLoading ? 'Menyimpan...' : 'Update'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {orderDetail?.orderType === 'delivery' && (
                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-amber-100 rounded-lg mr-3">
                          <Truck className="w-5 h-5 text-amber-700" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">Layanan Pengiriman</p>
                          <p className="text-xs text-slate-600">
                            {orderDetail.courierCode} - {orderDetail.courierService}
                            {orderDetail.biteshipOrderId && (
                              <span className="ml-2 font-mono text-[10px] bg-slate-200 px-1 rounded">ID: {orderDetail.biteshipOrderId}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Only show "Panggil Kurir" button if order is in a state that needs dispatching */}
                      {orderDetail.status !== 'on_delivery' && orderDetail.status !== 'completed' && orderDetail.status !== 'cancelled' ? (
                        <button
                          onClick={handleRequestDelivery}
                          disabled={requestDeliveryMutation.isLoading || (orderDetail.status !== 'processing' && orderDetail.status !== 'confirmed')}
                          className="px-4 py-2 bg-amber-700 text-white rounded-lg text-sm font-bold hover:bg-amber-800 disabled:opacity-50 flex items-center justify-center transition-colors shadow-sm"
                        >
                          {requestDeliveryMutation.isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          ) : (
                            <Truck className="w-4 h-4 mr-2" />
                          )}
                          {orderDetail.biteshipOrderId ? 'Panggil Ulang Kurir' : 'Panggil Kurir Sekarang'}
                        </button>
                      ) : orderDetail.status === 'on_delivery' ? (
                        <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-bold flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                          Kurir Sedang Menuju Lokasi
                        </div>
                      ) : null}
                    </div>
                  )}

                  <hr className="border-slate-100" />

                  {/* Items Table */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Item Pesanan</h3>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-xs font-medium text-slate-500">Produk</th>
                            <th className="px-4 py-3 text-xs font-medium text-slate-500 text-center">Qty</th>
                            <th className="px-4 py-3 text-xs font-medium text-slate-500 text-right">Harga</th>
                            <th className="px-4 py-3 text-xs font-medium text-slate-500 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {orderDetail.items?.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-3">
                                <p className="text-sm font-semibold text-slate-800">{item.product?.name || 'Unknown Product'}</p>
                                {item.notes && <p className="text-xs text-slate-500 mt-0.5">Note: {item.notes}</p>}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-800 text-center">{item.quantity}</td>
                              <td className="px-4 py-3 text-sm text-slate-600 text-right">{formatRupiah(item.unitPrice)}</td>
                              <td className="px-4 py-3 text-sm font-medium text-slate-800 text-right">{formatRupiah(item.unitPrice * item.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50">
                          <tr>
                            <td colSpan="3" className="px-4 py-3 text-right text-sm font-medium text-slate-600">Subtotal</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-slate-800">{formatRupiah(orderDetail.subtotal)}</td>
                          </tr>
                          {orderDetail.discount > 0 && (
                            <tr>
                              <td colSpan="3" className="px-4 py-2 text-right text-sm font-medium text-red-500">Diskon</td>
                              <td className="px-4 py-2 text-right text-sm font-bold text-red-500">- {formatRupiah(orderDetail.discount)}</td>
                            </tr>
                          )}
                          {orderDetail.tax > 0 && (
                            <tr>
                              <td colSpan="3" className="px-4 py-2 text-right text-sm font-medium text-slate-600">Pajak (PB1)</td>
                              <td className="px-4 py-2 text-right text-sm font-bold text-slate-800">{formatRupiah(orderDetail.tax)}</td>
                            </tr>
                          )}
                          <tr className="border-t border-slate-200">
                            <td colSpan="3" className="px-4 py-4 text-right text-base font-bold text-slate-800">Total Akhir</td>
                            <td className="px-4 py-4 text-right text-base font-black text-amber-700">{formatRupiah(orderDetail.totalAmount)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500">Data pesanan tidak ditemukan.</div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
