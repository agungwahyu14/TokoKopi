"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  getAllPromos, 
  createPromo, 
  updatePromo, 
  deletePromo, 
  togglePromoStatus 
} from '../../../services/promos.service';
import { Plus, Edit2, Trash2, X, CheckCircle, Tag, Calendar as CalendarIcon, AlertCircle, Image as ImageIcon, Upload } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import clsx from 'clsx';

// Schema validasi
const promoSchema = z.object({
  title: z.string().min(3, "Judul promo minimal 3 karakter"),
  description: z.string().optional(),
  type: z.enum(['percent', 'flat']),
  value: z.coerce.number().min(0, "Nilai tidak boleh negatif"),
  minSpend: z.coerce.number().min(0).optional().default(0),
  maxDiscount: z.coerce.number().min(0).optional().default(0),
  code: z.string().min(1, "Kode voucher wajib diisi"),
  usageLimit: z.coerce.number().optional().nullable(),
  pointCost: z.coerce.number().min(0).optional().default(0),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

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

const formatPromoType = (type) => {
  switch (type) {
    case 'percent': return 'Persentase (%)';
    case 'flat': return 'Potongan Harga (Rp)';
    default: return type;
  }
};

const formatPromoValue = (type, value) => {
  if (type === 'percent') return `${value}%`;
  if (type === 'flat') return formatRupiah(value);
  return value;
};

import { useToastStore } from '../../../store/toastStore';

export default function PromosPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: promosResponse, isLoading } = useQuery({
    queryKey: ['promos'],
    queryFn: () => getAllPromos(),
  });
  
  const promos = promosResponse?.data || [];

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(promoSchema),
    defaultValues: { 
      title: '', description: '', type: 'percent', value: 0, 
      minSpend: 0, maxDiscount: 0, code: '', 
      usageLimit: null,
      pointCost: 0,
      startDate: null,
      endDate: null,
      isActive: true 
    }
  });

  const promoType = watch('type');

  const handleOpenModal = (promo = null) => {
    setEditingPromo(promo);
    if (promo) {
      setValue('title', promo.title);
      setValue('description', promo.description || '');
      setValue('type', promo.type);
      setValue('value', promo.value);
      setValue('minSpend', promo.minSpend || 0);
      setValue('maxDiscount', promo.maxDiscount || 0);
      setValue('code', promo.code || '');
      setValue('usageLimit', promo.usageLimit);
      setValue('pointCost', promo.pointCost || 0);
      setValue('startDate', promo.startDate ? promo.startDate.substring(0, 10) : null);
      setValue('endDate', promo.endDate ? promo.endDate.substring(0, 10) : null);
      setValue('isActive', promo.isActive);
      setImagePreview(promo.imageUrl);
      setImageFile(null);
    } else {
      reset({ 
        title: '', description: '', type: 'percent', value: 0, 
        minSpend: 0, maxDiscount: 0, code: '', 
        usageLimit: null,
        pointCost: 0,
        startDate: null,
        endDate: null,
        isActive: true 
      });
      setImagePreview(null);
      setImageFile(null);
    }
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const mutationCreate = useMutation({
    mutationFn: createPromo,
    onSuccess: () => {
      queryClient.invalidateQueries(['promos']);
      setIsModalOpen(false);
      addToast('success', 'Promo berhasil ditambahkan');
    },
    onError: (err) => addToast('error', err.message || 'Gagal menyimpan data')
  });

  const mutationUpdate = useMutation({
    mutationFn: updatePromo,
    onSuccess: () => {
      queryClient.invalidateQueries(['promos']);
      setIsModalOpen(false);
      addToast('success', 'Promo berhasil diperbarui');
    },
    onError: (err) => addToast('error', err.message || 'Gagal menyimpan data')
  });

  const mutationDelete = useMutation({
    mutationFn: deletePromo,
    onSuccess: () => {
      queryClient.invalidateQueries(['promos']);
      addToast('success', 'Promo berhasil dihapus');
    }
  });

  const mutationToggle = useMutation({
    mutationFn: togglePromoStatus,
    onSuccess: () => queryClient.invalidateQueries(['promos'])
  });

  const onSubmit = (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });

    if (imageFile) {
      formData.append('image', imageFile);
    }

    if (editingPromo) {
      mutationUpdate.mutate({ id: editingPromo.id, data: formData });
    } else {
      mutationCreate.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus promo ini?')) {
      mutationDelete.mutate(id);
    }
  };

  const checkIsExpired = (endDate) => {
    if (!endDate) return false;
    return new Date() > new Date(endDate);
  };

  if (!mounted) return (
    <div className="space-y-6">
       <div className="h-10 w-48 bg-slate-200 animate-pulse rounded-lg"></div>
       <div className="h-64 w-full bg-slate-100 animate-pulse rounded-xl"></div>
    </div>
  );

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Promo & Diskon</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola voucher dan program diskon untuk pelanggan</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors text-sm font-medium w-max"
        >
          <Plus className="w-4 h-4 mr-2" />
          Buat Promo
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : promos.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Tag className="w-12 h-12 text-gray-300 mb-3" />
            <p>Belum ada promo yang dibuat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Gambar</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Judul Promo</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipe & Nilai</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Min Pembelian</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Kode Voucher</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Periode</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Limit Penggunaan</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Poin</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {promos.map((promo) => {
                  const isExpired = checkIsExpired(promo.endDate);
                  
                  return (
                    <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-16 h-10 rounded bg-gray-100 overflow-hidden border border-gray-200">
                          {promo.imageUrl ? (
                            <img src={promo.imageUrl} alt={promo.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-800">{promo.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">{promo.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-500">{formatPromoType(promo.type)}</p>
                        <p className="text-sm font-bold text-amber-600">{formatPromoValue(promo.type, promo.value)}</p>
                        {promo.type === 'persentase' && promo.maxDiscount > 0 && (
                          <p className="text-xs text-gray-500">Maks: {formatRupiah(promo.maxDiscount)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {promo.minSpend > 0 ? formatRupiah(promo.minSpend) : 'Tanpa Minimum'}
                      </td>
                      <td className="px-6 py-4">
                        {promo.code ? (
                          <span className="px-2 py-1 bg-gray-100 border border-gray-200 text-gray-700 font-mono text-xs font-semibold rounded">
                            {promo.code}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Otomatis</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {promo.startDate && promo.endDate ? (
                          <span>{formatDate(promo.startDate)} - {formatDate(promo.endDate)}</span>
                        ) : (
                          <span className="text-gray-400">Selamanya</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">
                        {promo.usageLimit ? `${promo.usageLimit}x` : 'Tanpa Batas'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {promo.pointCost > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                            {promo.pointCost} Pts
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Gratis</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={promo.isActive} 
                            onChange={(e) => mutationToggle.mutate({ id: promo.id, isActive: e.target.checked })}
                            disabled={mutationToggle.isLoading || isExpired}
                          />
                          <div className={clsx(
                            "w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all",
                            promo.isActive ? "bg-amber-600" : "bg-gray-200",
                            isExpired && "opacity-50 cursor-not-allowed"
                          )}></div>
                        </label>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleOpenModal(promo)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors mr-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(promo.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800">
                {editingPromo ? 'Edit Promo' : 'Buat Promo Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-gray-200 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="promoForm" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Judul Promo *</label>
                    <input 
                      type="text" 
                      {...register('title')} 
                      className={clsx("w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1", errors.title ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-amber-500 focus:border-amber-500")}
                      placeholder="Misal: Diskon Merdeka 17%"
                    />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                    <textarea 
                      {...register('description')} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="Syarat dan ketentuan ringkas..."
                      rows="2"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Promo *</label>
                    <select 
                      {...register('type')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white"
                    >
                      <option value="percent">Persentase (%)</option>
                      <option value="flat">Potongan Harga (Rp)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {promoType === 'percent' ? 'Nilai Diskon (%) *' : promoType === 'flat' ? 'Potongan Harga (Rp) *' : 'Nilai Promo *'}
                    </label>
                    <input 
                      type="number" 
                      {...register('value')} 
                      className={clsx("w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1", errors.value ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-amber-500 focus:border-amber-500")}
                    />
                    {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Pembelian (Rp)</label>
                    <input 
                      type="number" 
                      {...register('minSpend')} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="0 jika tanpa minimum"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maksimum Diskon (Rp)</label>
                    <input 
                      type="number" 
                      {...register('maxDiscount')} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100 disabled:text-gray-400"
                      placeholder="0 jika tidak dibatasi"
                      disabled={promoType !== 'percent'}
                    />
                    {promoType !== 'percent' && <p className="text-xs text-gray-500 mt-1">Hanya berlaku untuk tipe persentase</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kode Voucher *</label>
                    <input 
                      type="text" 
                      {...register('code')} 
                      className={clsx("w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 uppercase", errors.code ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-amber-500 focus:border-amber-500")}
                      placeholder="Misal: MERDEKA17"
                    />
                    {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Limit Penggunaan Per User</label>
                    <input 
                      type="number" 
                      {...register('usageLimit')} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="Kosongkan jika tanpa batas"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Poin (Redeem)</label>
                    <input 
                      type="number" 
                      {...register('pointCost')} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="0 jika gratis"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                    <input 
                      type="date" 
                      {...register('startDate')} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Berakhir</label>
                    <input 
                      type="date" 
                      {...register('endDate')} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banner Promo</label>
                    <div className="mt-1 flex items-center gap-4">
                      <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-300" />
                        )}
                      </div>
                      <label className="cursor-pointer bg-white px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Pilih Gambar
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                      {imagePreview && (
                         <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="text-xs text-red-600 hover:underline">Hapus</button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center md:mt-6">
                    <input 
                      type="checkbox" 
                      id="isActive"
                      {...register('isActive')}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700">
                      Promo Langsung Aktif
                    </label>
                  </div>


                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button 
                type="submit"
                form="promoForm"
                disabled={mutationCreate.isLoading || mutationUpdate.isLoading}
                className="px-5 py-2 text-sm font-medium text-white bg-amber-700 rounded-lg hover:bg-amber-800 disabled:opacity-50 transition-colors"
              >
                {mutationCreate.isLoading || mutationUpdate.isLoading ? 'Menyimpan...' : 'Simpan Promo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
