import { useState, useEffect, useCallback } from 'react';
import { ToastMessage, ToastType } from '../components/ui/Toast.tsx';

/**
 * Toast Hook Interface — useToast (Sprint 3)
 */

let toastListeners: Array<(toasts: ToastMessage[]) => void> = [];
let toastState: ToastMessage[] = [];

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>(toastState);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter(l => l !== setToasts);
    };
  }, []);

  const showToast = useCallback((title: string, type: ToastType = 'info', message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, title, message };
    
    toastState = [...toastState, newToast];
    toastListeners.forEach(l => l(toastState));

    // Remove automaticamente após 5 segundos
    setTimeout(() => {
      toastState = toastState.filter(t => t.id !== id);
      toastListeners.forEach(l => l(toastState));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    toastState = toastState.filter(t => t.id !== id);
    toastListeners.forEach(l => l(toastState));
  }, []);

  return { toasts, showToast, removeToast };
};
