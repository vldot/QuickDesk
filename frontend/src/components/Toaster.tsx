import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X, Bell, MessageSquare, RefreshCw, UserPlus } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'notification';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  ticketId?: string;
  notificationType?: 'comment' | 'status_change' | 'assignment' | 'new_ticket';
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  addNotification: (notification: {
    type: 'comment' | 'status_change' | 'assignment' | 'new_ticket';
    title: string;
    message: string;
    ticketId?: string;
  }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 5000);
  }, []);

  const addNotification = useCallback((notification: {
    type: 'comment' | 'status_change' | 'assignment' | 'new_ticket';
    title: string;
    message: string;
    ticketId?: string;
  }) => {
    addToast({
      type: 'notification',
      title: notification.title,
      message: notification.message,
      ticketId: notification.ticketId,
      notificationType: notification.type,
      duration: 7000 // Longer duration for notifications
    });
  }, [addToast]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, addNotification }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: string) => void }> = ({
  toasts,
  removeToast,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({
  toast,
  onRemove,
}) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
    notification: Bell,
  };

  const notificationIcons = {
    comment: MessageSquare,
    status_change: RefreshCw,
    assignment: UserPlus,
    new_ticket: Bell,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    notification: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
    notification: 'text-blue-500',
  };

  const Icon = toast.type === 'notification' && toast.notificationType 
    ? notificationIcons[toast.notificationType]
    : icons[toast.type];

  const handleClick = () => {
    if (toast.ticketId && toast.type === 'notification') {
      // Navigate to ticket (you'd use useNavigate here in the actual component)
      window.location.href = `/tickets/${toast.ticketId}`;
    }
  };

  return (
    <div 
      className={`max-w-sm w-full ${colors[toast.type]} border rounded-lg shadow-lg p-4 transition-all duration-300 transform animate-slide-in ${
        toast.ticketId ? 'cursor-pointer hover:shadow-xl' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start">
        <Icon className={`h-5 w-5 ${iconColors[toast.type]} mr-3 mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{toast.title}</p>
          {toast.message && (
            <p className="text-sm opacity-90 mt-1">{toast.message}</p>
          )}
          {toast.ticketId && (
            <p className="text-xs opacity-75 mt-1">Click to view ticket</p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(toast.id);
          }}
          className="ml-3 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Simple Toaster component that uses the provider
export const Toaster: React.FC = () => {
  return null; // The actual toasts are rendered by ToastProvider
};

// Export the provider for use in App.tsx
export { ToastProvider };