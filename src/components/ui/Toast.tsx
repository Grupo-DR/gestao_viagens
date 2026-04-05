import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils.ts';
import { useToast } from '../../application/hooks/useToast.ts';

/**
 * Toast Component (Sprint 3)
 * Componente puro de renderização de notificações.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto p-4 rounded-2xl shadow-2xl border flex items-start gap-4 animate-in slide-in-from-right-8 duration-300",
            toast.type === 'success' ? "bg-white border-emerald-100 text-emerald-900" :
            toast.type === 'error' ? "bg-white border-red-100 text-red-900" :
            toast.type === 'warning' ? "bg-white border-amber-100 text-amber-900" :
            "bg-white border-blue-100 text-blue-900"
          )}
        >
          <div className={cn(
            "p-2 rounded-xl flex items-center justify-center",
            toast.type === 'success' ? "bg-emerald-50 text-emerald-600" :
            toast.type === 'error' ? "bg-red-50 text-red-600" :
            toast.type === 'warning' ? "bg-amber-50 text-amber-600" :
            "bg-blue-50 text-blue-600"
          )}>
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5" />}
            {toast.type === 'warning' && <AlertCircle className="w-5 h-5" />}
            {toast.type === 'info' && <Info className="w-5 h-5" />}
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <h5 className="font-bold text-sm tracking-tight">{toast.title}</h5>
            {toast.message && (
              <p className="text-xs mt-0.5 opacity-70 leading-relaxed font-medium">
                {toast.message}
              </p>
            )}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
