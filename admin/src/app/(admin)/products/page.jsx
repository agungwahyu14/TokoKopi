"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, Plus, Edit2, Trash2, Image as ImageIcon, X, AlertTriangle, FileText } from 'lucide-react';
import clsx from 'clsx';

import { useToastStore } from '../../../store/toastStore';
import { 
  getAllProducts, 
  createProduct, 
  updateProduct, 
  updateStock, 
  deleteProduct 
} from '../../../services/products.service';
import { getAllCategories } from '../../../services/categories.service';

const productSchema = z.object({
  name: z.string().min(3, "Nama produk minimal 3 karakter"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  price: z.number({ invalid_type_error: "Harga harus berupa angka" }).min(1000, "Harga minimal Rp 1.000"),
  image: z.any().optional(),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().default(true),
});

const formatRupiah = (number) => {
  if (number === undefined || number === null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  
  // States
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Queries
  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['products', categoryFilter, search],
    queryFn: () => getAllProducts({ 
      search, 
      category: categoryFilter === 'all' ? '' : categoryFilter 
    }),
  });

  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories,
  });

  const products = productsData?.data || [];
  const categories = categoriesData?.data || [];

  // Form setup
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      price: '',
      imageUrl: '',
      isAvailable: true,
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setIsModalOpen(false);
      reset();
      addToast('success', 'Produk berhasil ditambahkan');
    },
    onError: (err) => addToast('error', err.response?.data?.message || 'Gagal menambah produk')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setIsModalOpen(false);
      setEditingProduct(null);
      reset();
      addToast('success', 'Produk berhasil diperbarui');
    },
    onError: (err) => addToast('error', err.response?.data?.message || 'Gagal memperbarui produk')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setDeleteId(null);
      addToast('success', 'Produk berhasil dihapus');
    },
    onError: (err) => addToast('error', err.response?.data?.message || 'Gagal menghapus produk')
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, data }) => updateStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      addToast('success', 'Status ketersediaan diperbarui');
    },
    onError: (err) => addToast('error', err.response?.data?.message || 'Gagal memperbarui status')
  });

  // Handlers
  const onSubmit = (data) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description || '');
    formData.append('price', data.price);
    formData.append('categoryId', data.categoryId);
    formData.append('isAvailable', data.isAvailable);
    
    if (data.image?.[0]) {
      formData.append('image', data.image[0]);
    } else if (data.imageUrl) {
      formData.append('imageUrl', data.imageUrl);
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setImagePreview(null);
    reset({
      name: '',
      description: '',
      categoryId: '',
      price: '',
      imageUrl: '',
      isAvailable: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setImagePreview(product.imageUrl ? (product.imageUrl.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '')}${product.imageUrl}` : product.imageUrl) : null);
    reset({
      name: product.name,
      description: product.description || '',
      categoryId: product.categoryId?.toString() || product.categories?.[0]?.id?.toString() || '',
      price: product.price,
      imageUrl: product.imageUrl || '',
      isAvailable: product.isAvailable,
    });
    setIsModalOpen(true);
  };

  const handleToggleStock = (id, currentStatus) => {
    stockMutation.mutate({ id, data: { isAvailable: !currentStatus } });
  };

  if (!mounted) return (
    <div className="space-y-6">
       <div className="h-10 w-48 bg-slate-200 animate-pulse rounded-lg"></div>
       <div className="h-64 w-full bg-slate-100 animate-pulse rounded-xl"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Menu & Produk</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola katalog produk, harga, dan ketersediaan</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-amber-700 text-white rounded-xl font-medium hover:bg-amber-800 shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tambah Produk
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500 transition-colors"
            placeholder="Cari nama produk..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="block w-full md:w-64 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white"
        >
          <option value="all">Semua Kategori</option>
          {!isCategoriesLoading && categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative">
        {isProductsLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Gambar</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Produk</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Harga</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Tersedia</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!isProductsLoading && products.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>Tidak ada produk yang ditemukan.</p>
                  </td>
                </tr>
              )}
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '')}${product.imageUrl}` : product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={clsx("text-slate-400 flex items-center justify-center w-full h-full", product.imageUrl ? "hidden" : "flex")}>
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-sm text-slate-800">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-xs" title={product.description}>
                        {product.description}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium">
                      {product.categories?.[0]?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">
                    {formatRupiah(product.price)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleStock(product.id, product.isAvailable)}
                      disabled={stockMutation.isLoading}
                      className={clsx(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500",
                        product.isAvailable ? "bg-amber-600" : "bg-slate-300"
                      )}
                    >
                      <span
                        className={clsx(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                          product.isAvailable ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Produk"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(product.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Produk"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setImagePreview(null);
                }} 
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="productForm" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Produk <span className="text-red-500">*</span></label>
                  <input
                    {...register('name')}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Misal: Kopi Susu Aren"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500 resize-none"
                    placeholder="Deskripsi singkat tentang produk..."
                  />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kategori <span className="text-red-500">*</span></label>
                    <select
                      {...register('categoryId')}
                      className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500 bg-white"
                    >
                      <option value="">Pilih Kategori</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Harga (Rp) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      {...register('price', { valueAsNumber: true })}
                      className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500"
                      placeholder="0"
                    />
                    {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gambar Produk</label>
                  <div className="mt-1 flex items-center gap-4">
                    <div className="w-20 h-20 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        {...register('image')}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setImagePreview(URL.createObjectURL(file));
                          }
                          register('image').onChange(e);
                        }}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                      />
                      <p className="mt-1 text-xs text-slate-400">JPG, PNG atau WebP. Maks 5MB.</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center pt-2">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    {...register('isAvailable')}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-slate-300 rounded"
                  />
                  <label htmlFor="isAvailable" className="ml-2 block text-sm text-slate-700">
                    Produk aktif dan tersedia untuk dibeli
                  </label>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setImagePreview(null);
                }}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="productForm"
                disabled={createMutation.isLoading || updateMutation.isLoading}
                className="px-4 py-2 bg-amber-700 rounded-lg text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50 transition-colors"
              >
                {createMutation.isLoading || updateMutation.isLoading ? 'Menyimpan...' : 'Simpan Produk'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Produk?</h3>
              <p className="text-sm text-slate-500">
                Tindakan ini tidak dapat dibatalkan. Produk akan dihapus permanen dari sistem.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isLoading}
                className="flex-1 px-4 py-2 bg-red-600 rounded-lg text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteMutation.isLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
