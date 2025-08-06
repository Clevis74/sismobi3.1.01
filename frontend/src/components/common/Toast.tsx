import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Info, Loader } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback((): void => {
    if (!toast.dismissible && toast.type === 'loading') return;
    
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 300);
  }, [toast.dismissible, toast.type, toast.id, onDismiss]);

  useEffect(() => {
    // Mostrar toast com animação
    setIsVisible(true);

    // Auto-dismiss se tiver duração
    if (toast.duration && toast.duration > 0 && toast.type !== 'loading') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, toast.duration);

      return (): void => clearTimeout(timer);
    }
  }, [toast.duration, toast.type, handleDismiss]);

  const getToastStyles = () => {
    const baseStyles = "min-w-[320px] max-w-md bg-white shadow-lg rounded-lg border-l-4 transform transition-all duration-300 ease-in-out";
    
    if (isExiting) {
      return `${baseStyles} translate-x-full opacity-0 scale-95`;
    }
    
    if (!isVisible) {
      return `${baseStyles} translate-x-full opacity-0 scale-95`;
    }

    const typeStyles = {
      success: "border-green-500 shadow-green-100",
      error: "border-red-500 shadow-red-100", 
      warning: "border-yellow-500 shadow-yellow-100",
      info: "border-blue-500 shadow-blue-100",
      loading: "border-indigo-500 shadow-indigo-100"
    };

    return `${baseStyles} translate-x-0 opacity-100 scale-100 ${typeStyles[toast.type]}`;
  };

  const getIcon = () => {
    const iconProps = { className: "w-5 h-5 flex-shrink-0" };
    
    switch (toast.type) {
      case 'success':
        return <CheckCircle {...iconProps} className="w-5 h-5 flex-shrink-0 text-green-600" />;
      case 'error':
        return <XCircle {...iconProps} className="w-5 h-5 flex-shrink-0 text-red-600" />;
      case 'warning':
        return <AlertCircle {...iconProps} className="w-5 h-5 flex-shrink-0 text-yellow-600" />;
      case 'info':
        return <Info {...iconProps} className="w-5 h-5 flex-shrink-0 text-blue-600" />;
      case 'loading':
        return <Loader {...iconProps} className="w-5 h-5 flex-shrink-0 text-indigo-600 animate-spin" />;
      default:
        return <Info {...iconProps} className="w-5 h-5 flex-shrink-0 text-gray-600" />;
    }
  };

  const getTitleColor = () => {
    const colors = {
      success: "text-green-800",
      error: "text-red-800",
      warning: "text-yellow-800", 
      info: "text-blue-800",
      loading: "text-indigo-800"
    };
    return colors[toast.type];
  };

  return (
    <div className={getToastStyles()}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="ml-3 flex-1">
            <p className={`text-sm font-semibold ${getTitleColor()}`}>
              {toast.title}
            </p>
            {toast.message && (
              <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                {toast.message}
              </p>
            )}
            
            {toast.action && (
              <div className="mt-3">
                <button
                  onClick={toast.action.onClick}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition-colors"
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>

          {(toast.dismissible !== false && toast.type !== 'loading') && (
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={handleDismiss}
                className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                aria-label="Fechar notificação"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ 
  toasts, 
  onDismiss, 
  position = 'top-right' 
}) => {
  if (toasts.length === 0) return null;

  const getPositionStyles = () => {
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4', 
      'bottom-left': 'bottom-4 left-4',
      'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
      'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
    };
    return positions[position];
  };

  return (
    <div
      className={`fixed ${getPositionStyles()} z-50 space-y-3`}
      role="region"
      aria-live="polite"
      aria-label="Notificações"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};