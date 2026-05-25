"use client";

import { useToastStore } from '../../store/toastStore';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import clsx from 'clsx';

const iconMap = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

const bgMap = {
  success: "bg-green-50 border-l-4 border-green-500 text-green-800",
  error: "bg-red-50 border-l-4 border-red-500 text-red-800",
  warning: "bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800",
  info: "bg-blue-50 border-l-4 border-blue-500 text-blue-800",
};

export default function Toast() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className={clsx(
            "pointer-events-auto min-w-[300px] px-4 py-3 rounded-lg shadow-xl flex items-start justify-between transition-all duration-300 ease-in-out transform translate-y-0 opacity-100",
            bgMap[toast.type] || bgMap.info
          )}
          style={{ animation: 'slideIn 0.3s ease-out forwards' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {iconMap[toast.type] || iconMap.info}
            </div>
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
          <button 
            onClick={() => removeToast(toast.id)}
            className="p-1 hover:bg-black/5 rounded-full ml-4 flex-shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
