import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div style={styles.container}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              ...styles.toast,
              ...styles[toast.type],
            }}
          >
            <div style={styles.iconContainer}>
              {toast.type === 'success' && <CheckCircle2 size={18} color="#10b981" />}
              {toast.type === 'error' && <AlertCircle size={18} color="#ef4444" />}
              {toast.type === 'warning' && <AlertTriangle size={18} color="#f59e0b" />}
              {toast.type === 'info' && <Info size={18} color="#3b82f6" />}
            </div>
            <div style={styles.message}>{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              style={styles.closeBtn}
              aria-label="Cerrar notificación"
            >
              <X size={14} color="#94a3b8" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    zIndex: 99999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '420px',
    pointerEvents: 'none',
  },
  toast: {
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '10px',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.1)',
    color: '#f8fafc',
    fontSize: '13.5px',
    fontWeight: '500',
    animation: 'slideIn 0.25s ease-out',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.2s ease',
  },
  success: {
    borderLeft: '4px solid #10b981',
  },
  error: {
    borderLeft: '4px solid #ef4444',
  },
  warning: {
    borderLeft: '4px solid #f59e0b',
  },
  info: {
    borderLeft: '4px solid #3b82f6',
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  message: {
    flex: 1,
    lineHeight: '1.45',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
    transition: 'opacity 0.2s',
  },
};
