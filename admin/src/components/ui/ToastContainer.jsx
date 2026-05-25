"use client";

import { useToastStore } from '../../store/toastStore';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info as InfoIcon, 
  X 
} from 'lucide-react';
import clsx from 'clsx';

const TOAST_STYLES = {
  success: {
    bg: 'bg-[#EAF3DE]',
    text: 'text-[#27500A]',
    icon: CheckCircle2,
    border: 'border-[#D9E9C3]'
  },
  error: {
    bg: 'bg-[#FCEBEB]',
    text: 'text-[#791F1F]',
    icon: AlertCircle,
    border: 'border-[#F8D2D2]'
  },
  warning: {
    bg: 'bg-[#FAEEDA]',
    text: 'text-[#633806]',
    icon: AlertTriangle,
    border: 'border-[#F3DFBC]'
  },
  info: {
    bg: 'bg-[#E6F1FB]',
    text: 'text-[#0C447C]',
    icon: InfoIcon,
    border: 'border-[#C7E0F6]'
  }
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
        const Icon = style.icon;

        return (
          <div
            key={toast.id}
            className={clsx(
              "pointer-events-auto flex items-center justify-between min-w-[300px] max-w-md p-4 rounded-xl border shadow-lg transition-all duration-300 animate-in slide-in-from-right-10 fade-in",
              style.bg,
              style.text,
              style.border
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 shrink-0" />
              <p className="text-sm font-semibold">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 p-1 rounded-full hover:bg-black/5 transition-colors shrink-0"
            >
              <X className="w-4 h-4 opacity-70" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
