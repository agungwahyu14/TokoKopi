"use client";

import { AlertOctagon, RefreshCw } from 'lucide-react';

export default function PageError({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-6">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <AlertOctagon className="w-8 h-8 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Terjadi Kesalahan</h2>
      <p className="text-gray-500 mb-8 max-w-md">
        {error?.message || 'Kami tidak dapat memuat data halaman ini. Silakan coba lagi beberapa saat.'}
      </p>
      <button
        onClick={() => reset()}
        className="flex items-center px-6 py-2.5 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors font-medium shadow-sm"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Coba Lagi
      </button>
    </div>
  );
}
