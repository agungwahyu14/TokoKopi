"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllStores, getNearbyStores, getStoreById } from '../../../services/stores.service';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Plus, 
  Search, 
  Navigation, 
  X, 
  Building,
  Map as MapIcon,
  List,
  Info
} from 'lucide-react';
import clsx from 'clsx';

export default function StoresPage() {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'nearby'
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  
  // Nearby search states
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [isNearbySearchTriggered, setIsNearbySearchTriggered] = useState(false);

  // Queries
  const { data: storesResponse, isLoading: isStoresLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: getAllStores,
    enabled: activeTab === 'list',
  });

  const { data: nearbyResponse, isLoading: isNearbyLoading, refetch: refetchNearby } = useQuery({
    queryKey: ['nearby-stores', lat, lng],
    queryFn: () => getNearbyStores(lat, lng),
    enabled: false, // Trigger manual
  });

  const { data: detailResponse, isLoading: isDetailLoading } = useQuery({
    queryKey: ['store', selectedStoreId],
    queryFn: () => getStoreById(selectedStoreId),
    enabled: !!selectedStoreId,
  });

  const stores = storesResponse?.data || [];
  const nearbyStores = nearbyResponse?.data || [];
  const storeDetail = detailResponse?.data;

  const handleNearbySearch = (e) => {
    e.preventDefault();
    if (!lat || !lng) return;
    setIsNearbySearchTriggered(true);
    refetchNearby();
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={clsx(
        "px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider",
        isActive ? "bg-green-100 text-green-700 border border-green-200" : "bg-slate-100 text-slate-500 border border-slate-200"
      )}>
        {isActive ? 'Aktif' : 'Nonaktif'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Toko & Cabang</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola informasi operasional cabang Toko Kopi Jaya</p>
        </div>
        
        {/* Tombol Tambah Toko (Disabled) */}
        {/* Note: Endpoint POST /api/stores belum tersedia di backend, 
            perlu ditambahkan sebelum mengaktifkan tombol ini. */}
        <button
          disabled
          className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-200 text-slate-500 rounded-xl font-medium cursor-not-allowed opacity-70"
          title="Endpoint POST /api/stores belum tersedia"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tambah Toko
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('list')}
          className={clsx(
            "px-6 py-3 text-sm font-semibold flex items-center transition-colors border-b-2 -mb-[2px]",
            activeTab === 'list' ? "border-amber-700 text-amber-700" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <List className="w-4 h-4 mr-2" />
          Daftar Toko
        </button>
        <button
          onClick={() => setActiveTab('nearby')}
          className={clsx(
            "px-6 py-3 text-sm font-semibold flex items-center transition-colors border-b-2 -mb-[2px]",
            activeTab === 'nearby' ? "border-amber-700 text-amber-700" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <MapIcon className="w-4 h-4 mr-2" />
          Peta Terdekat
        </button>
      </div>

      {activeTab === 'list' ? (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative">
          {isStoresLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Toko</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Alamat Lengkap</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kota</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Telepon</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Jam Operasional</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!isStoresLoading && stores.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                      <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p>Tidak ada cabang toko yang ditemukan.</p>
                    </td>
                  </tr>
                )}
                {stores.map((store) => (
                  <tr 
                    key={store.id} 
                    onClick={() => setSelectedStoreId(store.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 mr-3">
                          <Building className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm text-slate-800 group-hover:text-amber-800">{store.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate" title={store.address}>
                      {store.address}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {store.city}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {store.phone || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1.5 text-slate-400" />
                        {store.operatingHours || '08:00 - 22:00'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(store.isActive)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Nearby View */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Navigation className="w-5 h-5 mr-2 text-amber-700" />
              Cari Cabang Berdasarkan Lokasi
            </h3>
            <form onSubmit={handleNearbySearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Latitude</label>
                <input
                  type="text"
                  placeholder="-6.2000"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Longitude</label>
                <input
                  type="text"
                  placeholder="106.8166"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isNearbyLoading || !lat || !lng}
                className="bg-amber-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-amber-800 transition-colors disabled:opacity-50 h-10 flex items-center justify-center"
              >
                {isNearbyLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Cari Toko
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!isNearbySearchTriggered ? (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500">
                <MapIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Masukkan koordinat untuk melihat cabang terdekat.</p>
              </div>
            ) : isNearbyLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse h-40"></div>
              ))
            ) : nearbyStores.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500">
                <p>Tidak ada toko yang ditemukan di sekitar koordinat tersebut.</p>
              </div>
            ) : (
              nearbyStores.map((store) => (
                <div 
                  key={store.id} 
                  onClick={() => setSelectedStoreId(store.id)}
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
                      <Building className="w-5 h-5" />
                    </div>
                    {getStatusBadge(store.isActive)}
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg mb-1">{store.name}</h4>
                  <p className="text-sm text-slate-500 flex items-start mb-4">
                    <MapPin className="w-4 h-4 mr-1.5 shrink-0 mt-0.5" />
                    {store.address}
                  </p>
                  <div className="flex items-center text-xs text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    {store.operatingHours || '08:00 - 22:00'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Store Detail Modal */}
      {selectedStoreId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <Info className="w-5 h-5 mr-2 text-amber-700" />
                Informasi Cabang
              </h2>
              <button 
                onClick={() => setSelectedStoreId(null)} 
                className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {isDetailLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-slate-500">Memuat data cabang...</p>
                </div>
              ) : storeDetail ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700 shadow-sm border border-amber-200">
                      <Building className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{storeDetail.name}</h3>
                      <div className="mt-1">{getStatusBadge(storeDetail.isActive)}</div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  <div className="space-y-5">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mr-4">
                        <MapPin className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Alamat</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{storeDetail.address}, {storeDetail.city}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mr-4">
                        <Phone className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Telepon</p>
                        <p className="text-sm text-slate-700">{storeDetail.phone || 'Tidak tersedia'}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mr-4">
                        <Clock className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Jam Operasional</p>
                        <p className="text-sm text-slate-700">{storeDetail.operatingHours || '08:00 - 22:00 (Setiap Hari)'}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mr-4">
                        <Navigation className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Koordinat</p>
                        <p className="text-sm text-slate-700">{storeDetail.latitude}, {storeDetail.longitude}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 italic leading-relaxed">
                      Catatan: Untuk melakukan perubahan data cabang ini, pastikan endpoint PUT /api/stores/:id sudah tersedia di backend sistem.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500">Gagal memuat detail toko.</div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button 
                onClick={() => setSelectedStoreId(null)}
                className="px-6 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
