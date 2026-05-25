"use client";

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllNotificationsAdmin,
  sendNotification,
  deleteNotification,
} from '../../../services/notifications.service';
import { getAllUsers } from '../../../services/users.service';
import { useToastStore } from '../../../store/toastStore';
import {
  Bell, Send, Trash2, X, Users, User as UserIcon,
  Megaphone, Newspaper, ShoppingBag, Info, Search, RefreshCw,
  Image as ImageIcon, Upload,
} from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

// ─── helpers ───────────────────────────────────────────────────────────────

const TYPE_META = {
  promo:      { label: 'Promo & Penawaran', icon: Megaphone,   color: 'text-orange-600',  bg: 'bg-orange-50',  badge: 'bg-orange-100 text-orange-700'  },
  newsletter: { label: 'Newsletter',        icon: Newspaper,   color: 'text-indigo-600',  bg: 'bg-indigo-50',  badge: 'bg-indigo-100 text-indigo-700'  },
  order:      { label: 'Status Pesanan',    icon: ShoppingBag, color: 'text-blue-600',    bg: 'bg-blue-50',    badge: 'bg-blue-100 text-blue-700'      },
  info:       { label: 'Info Umum',         icon: Info,        color: 'text-teal-600',    bg: 'bg-teal-50',    badge: 'bg-teal-100 text-teal-700'      },
  system:     { label: 'Sistem',            icon: Bell,        color: 'text-slate-600',   bg: 'bg-slate-50',   badge: 'bg-slate-100 text-slate-700'    },
};

const formatDate = (d) => {
  if (!d) return '-';
  try { return format(parseISO(d), 'dd MMM yyyy, HH:mm', { locale: localeId }); }
  catch { return d; }
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Form state
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'promo',
    targetAll: true,
    userId: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // User search autocomplete state
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Queries for users search autocomplete
  const { data: usersResp, isFetching: isSearchingUsers } = useQuery({
    queryKey: ['admin-users-search', userSearch],
    queryFn: () => getAllUsers({ search: userSearch, limit: 10 }),
    enabled: mounted && !form.targetAll && userSearch.trim().length > 0,
  });

  const searchResults = usersResp?.data || [];

  useEffect(() => { setMounted(true); }, []);

  // ── Queries ──
  const { data: resp, isLoading, refetch } = useQuery({
    queryKey: ['admin-notifications', page, filterType],
    queryFn: () => getAllNotificationsAdmin({ page, limit: 15, type: filterType || undefined }),
    enabled: mounted,
  });

  const notifications = resp?.data || [];
  const pagination = resp?.pagination || {};

  // ── Mutations ──
  const mutSend = useMutation({
    mutationFn: sendNotification,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['admin-notifications']);
      setIsModalOpen(false);
      resetForm();
      addToast('success', data.message || 'Notifikasi berhasil dikirim!');
    },
    onError: (err) => addToast('error', err.response?.data?.message || err.message || 'Gagal mengirim notifikasi'),
  });

  const mutDelete = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-notifications']);
      addToast('success', 'Notifikasi dihapus');
    },
    onError: () => addToast('error', 'Gagal menghapus notifikasi'),
  });

  // ── Handlers ──
  const resetForm = () => {
    setForm({ title: '', message: '', type: 'promo', targetAll: true, userId: '' });
    setImageFile(null);
    setImagePreview(null);
    setUserSearch('');
    setSelectedUser(null);
    setShowDropdown(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('error', 'Hanya file gambar yang diizinkan');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('error', 'Ukuran gambar maksimal 5MB');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      addToast('error', 'Judul dan pesan wajib diisi');
      return;
    }
    if (!form.targetAll && !selectedUser) {
      addToast('error', 'Silakan cari dan pilih user tujuan');
      return;
    }

    // Kirim sebagai FormData agar gambar bisa diupload
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('message', form.message);
    fd.append('type', form.type);
    fd.append('targetAll', String(form.targetAll));
    if (!form.targetAll && selectedUser) fd.append('userId', String(selectedUser.id));
    if (imageFile) fd.append('image', imageFile);

    mutSend.mutate(fd);
  };

  const handleDelete = (id) => {
    if (!confirm('Hapus notifikasi ini?')) return;
    mutDelete.mutate(id);
  };

  // Filtered client-side search
  const filtered = notifications.filter((n) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q);
  });

  if (!mounted) return <div className="h-screen bg-slate-50 animate-pulse" />;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-700" />
            Manajemen Notifikasi
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Kirim promo, newsletter, dan informasi langsung ke pelanggan
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors text-sm font-semibold shadow-sm w-max"
        >
          <Send className="w-4 h-4" />
          Kirim Notifikasi
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Terkirim', value: pagination.total ?? '-', icon: Bell, color: 'amber' },
          { label: 'Promo & Penawaran', value: notifications.filter(n => n.type === 'promo').length, icon: Megaphone, color: 'orange' },
          { label: 'Newsletter', value: notifications.filter(n => n.type === 'newsletter').length, icon: Newspaper, color: 'indigo' },
          { label: 'Status Pesanan', value: notifications.filter(n => n.type === 'order').length, icon: ShoppingBag, color: 'blue' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${s.color}-50`}>
                <Icon className={`w-5 h-5 text-${s.color}-600`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari judul atau pesan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-[180px]"
        >
          <option value="">Semua Jenis</option>
          {Object.entries(TYPE_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors text-gray-600"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* ── Notifications Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-14 text-center flex flex-col items-center text-gray-400">
            <Bell className="w-14 h-14 mb-3 text-gray-200" />
            <p className="font-semibold text-gray-500">Belum ada notifikasi</p>
            <p className="text-sm mt-1">Gunakan tombol "Kirim Notifikasi" untuk memulai</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Jenis</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Judul & Pesan</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Penerima</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Baca</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Waktu</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((notif) => {
                    const meta = TYPE_META[notif.type] || TYPE_META.info;
                    const Icon = meta.icon;
                    return (
                      <tr key={notif.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', meta.badge)}>
                            <Icon className="w-3 h-3" />
                            {meta.label}
                          </div>
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          <p className="text-sm font-semibold text-gray-800 truncate">{notif.title}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{notif.message}</p>
                        </td>
                        <td className="px-5 py-4">
                          {notif.targetAll ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded-full">
                              <Users className="w-3 h-3" /> Semua User
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                              <UserIcon className="w-3 h-3" />
                              {notif.user?.name || `User #${notif.userId}`}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={clsx(
                            'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full',
                            notif.isRead
                              ? 'bg-green-50 text-green-700'
                              : 'bg-amber-50 text-amber-700'
                          )}>
                            <span className={clsx('w-1.5 h-1.5 rounded-full', notif.isRead ? 'bg-green-500' : 'bg-amber-500')} />
                            {notif.isRead ? 'Sudah Dibaca' : 'Belum Dibaca'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(notif.createdAt)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleDelete(notif.id)}
                            disabled={mutDelete.isPending}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus notifikasi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <span>
                  Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} total)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Send Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-amber-700 to-amber-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Kirim Notifikasi</h2>
                  <p className="text-amber-200 text-xs">Broadcast ke semua user atau user tertentu</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-full hover:bg-white/20 text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSend} className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Jenis Notifikasi</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'promo', label: 'Promo & Penawaran', icon: Megaphone, color: 'orange' },
                    { value: 'newsletter', label: 'Newsletter', icon: Newspaper, color: 'indigo' },
                    { value: 'info', label: 'Info Umum', icon: Info, color: 'teal' },
                    { value: 'system', label: 'Sistem', icon: Bell, color: 'slate' },
                  ].map((t) => {
                    const TIcon = t.icon;
                    const isSelected = form.type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, type: t.value }))}
                        className={clsx(
                          'flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all',
                          isSelected
                            ? 'border-amber-600 bg-amber-50 text-amber-800'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        )}
                      >
                        <TIcon className="w-4 h-4 shrink-0" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Target Penerima</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, targetAll: true, userId: '' }))}
                    className={clsx(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all',
                      form.targetAll
                        ? 'border-amber-600 bg-amber-50 text-amber-800'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    <Users className="w-4 h-4" /> Semua User
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, targetAll: false }))}
                    className={clsx(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all',
                      !form.targetAll
                        ? 'border-amber-600 bg-amber-50 text-amber-800'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    <UserIcon className="w-4 h-4" /> User Tertentu
                  </button>
                </div>

                {!form.targetAll && (
                  <div className="mt-2.5 relative">
                    {selectedUser ? (
                      <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-5 h-5 text-amber-700 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-amber-900">{selectedUser.name}</p>
                            <p className="text-xs text-amber-700 font-medium">
                              {selectedUser.phone || selectedUser.email || `ID: #${selectedUser.id}`}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(null);
                            setUserSearch('');
                          }}
                          className="p-1 text-amber-700 hover:bg-amber-100 rounded-lg transition"
                          title="Ganti user"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Cari nama, email, atau no. HP..."
                            value={userSearch}
                            onChange={(e) => {
                              setUserSearch(e.target.value);
                              setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          />
                          {isSearchingUsers && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>

                        {showDropdown && userSearch.trim().length > 0 && (
                          <div className="absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-50 divide-y divide-gray-50">
                            {searchResults.length === 0 ? (
                              <div className="p-3 text-center text-xs text-gray-400">
                                Tidak ada pelanggan ditemukan
                              </div>
                            ) : (
                              searchResults.map((u) => (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setShowDropdown(false);
                                  }}
                                  className="w-full text-left p-3 hover:bg-amber-50/50 flex flex-col transition"
                                >
                                  <span className="text-sm font-semibold text-gray-800">{u.name}</span>
                                  <span className="text-xs text-gray-500 mt-0.5">
                                    {u.phone || u.email || `ID: #${u.id}`}
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Judul Notifikasi *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Misal: Promo Spesial Akhir Bulan!"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Isi Pesan *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Tulis isi notifikasi di sini..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              {/* Upload Gambar (opsional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Gambar Banner <span className="text-gray-400 font-normal">(opsional)</span>
                </label>

                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-36 object-cover rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-red-500 hover:bg-red-50 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all group">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-amber-100 flex items-center justify-center transition">
                        <Upload className="w-5 h-5 text-gray-400 group-hover:text-amber-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-500 group-hover:text-amber-700">Klik untuk upload gambar</p>
                      <p className="text-xs text-gray-400">PNG, JPG, WEBP maks. 5MB</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSend}
                disabled={mutSend.isPending}
                className="px-5 py-2 text-sm font-semibold text-white bg-amber-700 rounded-lg hover:bg-amber-800 disabled:opacity-50 transition flex items-center gap-2"
              >
                {mutSend.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Kirim Sekarang
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
