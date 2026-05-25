"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  getAllCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  reorderCategories 
} from '../../../../services/categories.service';
import { Plus, Edit2, Trash2, X, ArrowUp, ArrowDown, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

import { useToastStore } from '../../../../store/toastStore';

const categorySchema = z.object({
  name: z.string().min(3, { message: "Nama kategori minimal 3 karakter" }),
  description: z.string().optional(),
});

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories,
  });
  
  // Sort category if needed locally or rely on API order
  const categories = categoriesData?.data || [];

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' }
  });

  const handleOpenModal = (category = null) => {
    setEditingCategory(category);
    if (category) {
      setValue('name', category.name);
      setValue('description', category.description || '');
    } else {
      reset({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const mutationCreate = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      setIsModalOpen(false);
      addToast('success', 'Kategori berhasil ditambahkan');
    },
    onError: (err) => addToast('error', err.message || 'Gagal menyimpan data')
  });

  const mutationUpdate = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      setIsModalOpen(false);
      addToast('success', 'Kategori berhasil diperbarui');
    },
    onError: (err) => addToast('error', err.message || 'Gagal menyimpan data')
  });

  const mutationDelete = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
      addToast('success', 'Kategori berhasil dihapus');
    },
    onError: (err) => {
      addToast('error', err.message || 'Gagal menghapus kategori');
    }
  });

  const mutationReorder = useMutation({
    mutationFn: reorderCategories,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
    }
  });

  const onSubmit = (data) => {
    if (editingCategory) {
      mutationUpdate.mutate({ id: editingCategory.id, data });
    } else {
      mutationCreate.mutate(data);
    }
  };

  const handleDelete = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      mutationDelete.mutate(categoryToDelete.id);
    }
  };

  const handleMove = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === categories.length - 1)) return;
    
    const newCategories = [...categories];
    const temp = newCategories[index];
    newCategories[index] = newCategories[index + direction];
    newCategories[index + direction] = temp;
    
    // Asumsikan API menerima array ID untuk urutan baru
    const newOrder = newCategories.map(cat => cat.id);
    mutationReorder.mutate(newOrder);
  };

  if (!mounted) return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="h-10 w-48 bg-slate-200 animate-pulse rounded-lg"></div>
      <div className="h-64 w-full bg-slate-100 animate-pulse rounded-xl"></div>
    </div>
  );

  return (
    <div className="space-y-6 relative max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-sm text-gray-500 mb-2">
            <Link href="/products" className="hover:text-amber-600 hover:underline">← Kembali ke Produk</Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Kategori Menu</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola daftar kategori produk</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors text-sm font-medium w-max"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kategori
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Tidak ada kategori ditemukan.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {categories.map((category, index) => (
              <li key={category.id} className="p-4 sm:p-6 hover:bg-gray-50 flex items-center justify-between group transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleMove(index, -1)}
                      disabled={index === 0 || mutationReorder.isLoading}
                      className="p-1 text-gray-400 hover:text-amber-600 disabled:opacity-30 disabled:hover:text-gray-400"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleMove(index, 1)}
                      disabled={index === categories.length - 1 || mutationReorder.isLoading}
                      className="p-1 text-gray-400 hover:text-amber-600 disabled:opacity-30 disabled:hover:text-gray-400"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.description || 'Tidak ada deskripsi'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleOpenModal(category)}
                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(category)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
                <input 
                  type="text" 
                  {...register('name')} 
                  className={clsx("w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1", errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-amber-500 focus:border-amber-500")}
                  placeholder="Misal: Minuman Dingin"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea 
                  {...register('description')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Deskripsi singkat..."
                  rows="3"
                ></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={mutationCreate.isLoading || mutationUpdate.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-700 rounded-lg hover:bg-amber-800 disabled:opacity-50"
                >
                  {mutationCreate.isLoading || mutationUpdate.isLoading ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Hapus Kategori?</h3>
              <p className="text-gray-500 text-sm mb-6">
                Apakah Anda yakin ingin menghapus kategori <span className="font-semibold text-gray-800">"{categoryToDelete?.name}"</span>? 
                Semua produk di dalamnya mungkin akan terdampak.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setCategoryToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={mutationDelete.isLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {mutationDelete.isLoading ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
