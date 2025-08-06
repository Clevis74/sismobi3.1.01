import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastType, ToastContainer } from '../components/common/Toast';

interface NotificationContextType {
  // Métodos principais
  success: (title: string, message?: string, options?: Partial<Toast>) => string;
  error: (title: string, message?: string, options?: Partial<Toast>) => string;
  warning: (title: string, message?: string, options?: Partial<Toast>) => string;
  info: (title: string, message?: string, options?: Partial<Toast>) => string;
  loading: (title: string, message?: string, options?: Partial<Toast>) => string;
  
  // Métodos de controle
  dismiss: (id: string) => void;
  dismissAll: () => void;
  update: (id: string, updates: Partial<Toast>) => void;
  
  // Estado
  toasts: Toast[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children, 
  position = 'top-right',
  maxToasts = 5
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = useCallback(() => {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message?: string, options?: Partial<Toast>) => {
    const id = generateId();
    
    const defaultOptions: Partial<Toast> = {
      duration: type === 'loading' ? 0 : type === 'error' ? 8000 : 5000,
      dismissible: type !== 'loading',
    };

    const toast: Toast = {
      id,
      type,
      title,
      message,
      ...defaultOptions,
      ...options,
    };

    setToasts(prev => {
      // Limitar número máximo de toasts
      const newToasts = [toast, ...prev];
      return newToasts.slice(0, maxToasts);
    });

    return id;
  }, [generateId, maxToasts]);

  const success = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast('success', title, message, options);
  }, [addToast]);

  const error = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast('error', title, message, options);
  }, [addToast]);

  const warning = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast('warning', title, message, options);
  }, [addToast]);

  const info = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast('info', title, message, options);
  }, [addToast]);

  const loading = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast('loading', title, message, options);
  }, [addToast]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const update = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...updates } : toast
    ));
  }, []);

  const contextValue: NotificationContextType = {
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
    dismissAll,
    update,
    toasts
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <ToastContainer 
        toasts={toasts} 
        onDismiss={dismiss}
        position={position}
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Hook especializado para operações assíncronas
export const useAsyncNotification = () => {
  const notification = useNotification();

  const handleAsync = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      messages: {
        loading: { title: string; message?: string };
        success: { title: string; message?: string };
        error: { title: string; message?: string };
      }
    ): Promise<T> => {
      const loadingId = notification.loading(messages.loading.title, messages.loading.message);
      
      try {
        const result = await asyncFn();
        notification.dismiss(loadingId);
        notification.success(messages.success.title, messages.success.message);
        return result;
      } catch (error) {
        notification.dismiss(loadingId);
        notification.error(
          messages.error.title, 
          messages.error.message || (error instanceof Error ? error.message : 'Erro desconhecido')
        );
        throw error;
      }
    },
    [notification]
  );

  return { handleAsync, ...notification };
};

// Helpers para casos comuns
export const useCommonNotifications = () => {
  const notification = useNotification();
  
  return {
    ...notification,
    
    // Sucesso em operações
    saveSuccess: (entity = 'item') => notification.success(
      'Salvo com sucesso!',
      `${entity} foi salvo com sucesso.`
    ),
    
    updateSuccess: (entity = 'item') => notification.success(
      'Atualizado com sucesso!',
      `${entity} foi atualizado com sucesso.`
    ),
    
    deleteSuccess: (entity = 'item') => notification.success(
      'Removido com sucesso!',
      `${entity} foi removido com sucesso.`
    ),

    // Erros comuns
    saveError: (entity = 'item') => notification.error(
      'Erro ao salvar',
      `Não foi possível salvar ${entity}. Tente novamente.`
    ),
    
    updateError: (entity = 'item') => notification.error(
      'Erro ao atualizar',
      `Não foi possível atualizar ${entity}. Tente novamente.`
    ),
    
    deleteError: (entity = 'item') => notification.error(
      'Erro ao remover',
      `Não foi possível remover ${entity}. Tente novamente.`
    ),

    networkError: () => notification.error(
      'Erro de conexão',
      'Verifique sua conexão com a internet e tente novamente.'
    ),

    // Loading estados
    saving: (entity = 'item') => notification.loading(
      'Salvando...',
      `Salvando ${entity}, aguarde...`
    ),
    
    loading: (action = 'dados') => notification.loading(
      'Carregando...',
      `Carregando ${action}, aguarde...`
    ),

    // Avisos
    unsavedChanges: () => notification.warning(
      'Alterações não salvas',
      'Você tem alterações não salvas que serão perdidas.'
    ),

    // Informações
    noData: (entity = 'dados') => notification.info(
      'Nenhum resultado encontrado',
      `Não foram encontrados ${entity} para exibir.`
    )
  };
};