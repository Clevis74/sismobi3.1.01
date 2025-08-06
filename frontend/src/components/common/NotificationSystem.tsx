// ⚡ SISTEMA DE NOTIFICAÇÕES UNIFICADO
// Integração com o novo sistema de Toast para melhor UX
import React from 'react';
import { NotificationProvider as UnifiedNotificationProvider, useNotification, useCommonNotifications } from '../../hooks/useNotification';

// ⚡ WRAPPER PARA COMPATIBILIDADE COM SISTEMA ANTIGO
// Mantém compatibilidade enquanto migra para o novo sistema

// Provider principal - agora usa o sistema unificado
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UnifiedNotificationProvider position="top-right" maxToasts={5}>
      {children}
    </UnifiedNotificationProvider>
  );
};

// Hook para substituir alert() nativo - agora usa sistema unificado
export const useAlert = () => {
  const notifications = useCommonNotifications();
  
  return {
    success: (message: string, title = 'Sucesso') => 
      notifications.success(title, message),
    error: (message: string, title = 'Erro') => 
      notifications.error(title, message, { duration: 0 }), // Persistent
    warning: (message: string, title = 'Atenção') => 
      notifications.warning(title, message),
    info: (message: string, title = 'Informação') => 
      notifications.info(title, message)
  };
};

// Hook para alerts específicos do backup - mantém compatibilidade
export const useBackupAlerts = () => {
  const { success, error } = useAlert();
  
  return {
    importSuccess: () => success('Backup importado com sucesso!'),
    importError: (errorMsg: string) => error(`Erro ao importar backup: ${errorMsg}`),
    invalidFile: () => error('Arquivo de backup inválido!')
  };
};

// Export do hook principal para uso direto do novo sistema
export { useNotification, useCommonNotifications, useAsyncNotification } from '../../hooks/useNotification';