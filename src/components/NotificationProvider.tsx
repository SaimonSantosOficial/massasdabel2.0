import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface AlertConfig {
  title: string;
  message: string;
  type: ToastType;
  onClose?: () => void;
}

interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface NotificationContextType {
  showToast: (message: string, type?: ToastType) => void;
  showAlert: (title: string, message: string, type?: ToastType, onClose?: () => void) => void;
  showConfirm: (config: ConfirmConfig) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [alert, setAlert] = useState<AlertConfig | null>(null);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const showAlert = (title: string, message: string, type: ToastType = 'info', onClose?: () => void) => {
    setAlert({ title, message, type, onClose });
  };

  const showConfirm = (config: ConfirmConfig) => {
    setConfirm(config);
  };

  // Auto-remove toasts
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: ToastType, sizeClass = "w-6 h-6") => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className={cn("text-emerald-500", sizeClass)} />;
      case 'error':
        return <XCircle className={cn("text-red-500", sizeClass)} />;
      case 'warning':
        return <AlertTriangle className={cn("text-amber-500", sizeClass)} />;
      default:
        return <Info className={cn("text-sky-500", sizeClass)} />;
    }
  };

  return (
    <NotificationContext.Provider value={{ showToast, showAlert, showConfirm }}>
      {children}

      {/* TOAST NOTIFICATIONS */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 max-w-md w-[92%] pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start justify-between gap-3 px-4 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-slide-in w-full",
              t.type === 'success' && "bg-slate-900/95 border-emerald-500/20 text-slate-100",
              t.type === 'error' && "bg-slate-900/95 border-red-500/20 text-slate-100",
              t.type === 'warning' && "bg-slate-900/95 border-amber-500/20 text-slate-100",
              t.type === 'info' && "bg-slate-900/95 border-sky-500/20 text-slate-100"
            )}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="mt-0.5 shrink-0">
                {getIcon(t.type, "w-4.5 h-4.5")}
              </div>
              <p className="text-xs font-semibold leading-relaxed break-words flex-1 min-w-0">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white transition-colors shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* CUSTOM ALERT MODAL */}
      {alert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="inline-flex p-3 rounded-2xl bg-slate-850 border border-slate-800">
              {getIcon(alert.type, "w-8 h-8")}
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white tracking-tight">{alert.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">{alert.message}</p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (alert.onClose) alert.onClose();
                  setAlert(null);
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/15 active:scale-[0.98] text-sm"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM MODAL */}
      {confirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white tracking-tight">{confirm.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">{confirm.message}</p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm.onCancel) confirm.onCancel();
                  setConfirm(null);
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-extrabold py-3 rounded-xl transition-all text-sm"
              >
                {confirm.cancelText || 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  confirm.onConfirm();
                  setConfirm(null);
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/15 active:scale-[0.98] text-sm"
              >
                {confirm.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}
