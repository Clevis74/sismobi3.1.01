// ⚡ SISTEMA DE NOTIFICAÇÕES UNIFICADO
// Integração com o novo sistema de Toast para melhor UX
import React from 'react';
import { NotificationProvider as UnifiedNotificationProvider, useNotification, useCommonNotifications } from '../../hooks/useNotification';

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