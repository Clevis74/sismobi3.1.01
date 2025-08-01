import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return context;
};

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

const colors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
};

const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500'
};

export const NotificationProvider: React.FC<{ children }> = ({ children }): JSX.Element => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Máximo de 5 notificações

    // Auto-remove se não for persistente
    if (!notification.persistent) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, notification.duration || 5000);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      
      {/* Container de notificações */}
      <div 
        aria-live="polite" 
        aria-label="Notificações do sistema"
        className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none"
      >
        {notifications.map((notification) => {
          const Icon = icons[notification.type];
          
          return (
            <div
              key={notification.id}
              role="alert"
              aria-describedby={`notification-${notification.id}`}
              className={`p-4 rounded-lg border shadow-lg transition-all duration-300 transform pointer-events-auto ${colors[notification.type]} animate-in slide-in-from-right-full`}
            >
              <div className="flex items-start">
                <Icon 
                  className={`w-5 h-5 mr-3 flex-shrink-0 mt-0.5 ${iconColors[notification.type]}`}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">
                    {notification.title}
                  </h4>
                  <p 
                    id={`notification-${notification.id}`}
                    className="text-sm mt-1"
                  >
                    {notification.message}
                  </p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  aria-label={`Fechar notificação: ${notification.title}`}
                  className="ml-3 flex-shrink-0 p-1 rounded hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20 transition-colors"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

// Hook para substituir alert() nativo
export const useAlert = (): {
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
} => {
  const { addNotification } = useNotifications();
  
  return {
    success: (message: string, title = 'Sucesso') => 
      addNotification({ type: 'success', title, message }),
    error: (message: string, title = 'Erro') => 
      addNotification({ type: 'error', title, message, persistent: true }),
    warning: (message: string, title = 'Atenção') => 
      addNotification({ type: 'warning', title, message }),
    info: (message: string, title = 'Informação') => 
      addNotification({ type: 'info', title, message })
  };
};

// Hook para alerts específicos do backup
export const useBackupAlerts = (): {
  importSuccess: () => string;
  importError: (errorMsg: string) => string;
  invalidFile: () => string;
} => {
  const { success, error } = useAlert();
  
  return {
    importSuccess: () => success('Backup importado com sucesso!'),
    importError: (errorMsg: string) => error(`Erro ao importar backup: ${errorMsg}`),
    invalidFile: () => error('Arquivo de backup inválido!')
  };
};