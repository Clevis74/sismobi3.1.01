import { useState, useEffect, useCallback, useRef } from 'react';

// ========== SISTEMA DE MONITORAMENTO LOCALSTORAGE (EXTENSÃO REVERSÍVEL) ==========

// Métricas de localStorage (extensão modular)
const localStorageMetrics = {
  enabled: process.env.NODE_ENV === 'development',
  operations: {
    reads: 0,
    writes: 0,
    errors: 0,
    criticalOperations: 0
  },
  keyStats: new Map<string, { reads: number; writes: number; errors: number; lastAccess: number }>(),
  alerts: [] as Array<{ timestamp: number; type: string; key: string; message: string }>
};

// Função para log de operações críticas (defensiva)
const logLocalStorageOperation = (operation: string, key: string, success: boolean, isCritical: boolean = false) => {
  if (!localStorageMetrics.enabled) return;
  
  try {
    // Atualizar contadores gerais
    localStorageMetrics.operations.reads += operation === 'read' ? 1 : 0;
    localStorageMetrics.operations.writes += operation === 'write' ? 1 : 0;
    localStorageMetrics.operations.errors += success ? 0 : 1;
    localStorageMetrics.operations.criticalOperations += isCritical ? 1 : 0;
    
    // Atualizar estatísticas por chave
    if (!localStorageMetrics.keyStats.has(key)) {
      localStorageMetrics.keyStats.set(key, { reads: 0, writes: 0, errors: 0, lastAccess: Date.now() });
    }
    
    const keyStats = localStorageMetrics.keyStats.get(key)!;
    keyStats.reads += operation === 'read' ? 1 : 0;
    keyStats.writes += operation === 'write' ? 1 : 0;
    keyStats.errors += success ? 0 : 1;
    keyStats.lastAccess = Date.now();
    
    // Alertar sobre operações críticas falhando
    if (isCritical && !success) {
      const alert = {
        timestamp: Date.now(),
        type: 'critical_operation_failed',
        key,
        message: `Falha em operação crítica de ${operation} para a chave "${key}"`
      };
      
      localStorageMetrics.alerts.push(alert);
      console.error('🚨 LocalStorage Critical Alert:', alert.message);
      
      // Manter apenas últimos 20 alertas
      if (localStorageMetrics.alerts.length > 20) {
        localStorageMetrics.alerts = localStorageMetrics.alerts.slice(-20);
      }
    }
    
    // Log operações críticas em desenvolvimento
    if (isCritical && process.env.NODE_ENV === 'development') {
      console.debug(`📝 Critical LocalStorage ${operation}:`, key, success ? '✅' : '❌');
    }
  } catch (error) {
    // Falha silenciosa para não impactar produção
  }
};

// Helper function to convert date strings back to Date objects
function reviveDates(key: string, value: any): any {
  // Define which keys should be converted to dates
  const dateFields = ['createdAt', 'startDate', 'agreedPaymentDate', 'date', 'nextDate', 'issueDate', 'validityDate', 'lastUpdated'];
  
  if (typeof value === 'string' && dateFields.includes(key)) {
    const date = new Date(value);
    // Check if it's a valid date
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  return value;
}

// Helper function to recursively process objects and arrays
function processStoredData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => processStoredData(item));
  }
  
  if (typeof data === 'object') {
    const processed: any = {};
    for (const [key, value] of Object.entries(data)) {
      processed[key] = reviveDates(key, processStoredData(value));
    }
    return processed;
  }
  
  return data;
}

// Hook otimizado para localStorage com debounce e monitoramento
export function useOptimizedLocalStorage<T>(
  key: string,
  defaultValue: T,
  debounceMs: number = 300
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      logLocalStorageOperation('read', key, true);
      
      if (item) {
        const parsed = JSON.parse(item);
        return processStoredData(parsed);
      }
      return defaultValue;
    } catch (error) {
      console.warn(`Erro ao ler localStorage para a chave "${key}":`, error);
      logLocalStorageOperation('read', key, false);
      return defaultValue;
    }
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');
  const pendingValueRef = useRef<T | null>(null);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      pendingValueRef.current = valueToStore;
      
      // Identificar operações críticas (extensão modular)
      const criticalKeys = ['transactions', 'properties', 'tenants', 'alerts'];
      const isCritical = criticalKeys.some(criticalKey => key.includes(criticalKey));
      
      if (isCritical) {
        // Flush imediato para operações críticas com monitoramento
        try {
          const serializedValue = JSON.stringify(valueToStore);
          window.localStorage.setItem(key, serializedValue);
          lastSavedRef.current = serializedValue;
          pendingValueRef.current = null;
          
          logLocalStorageOperation('write', key, true, true);
        } catch (error) {
          console.warn(`Erro ao salvar operação crítica no localStorage para a chave "${key}":`, error);
          logLocalStorageOperation('write', key, false, true);
        }
      } else {
        // Debounce para outras operações
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(() => {
          try {
            const currentPendingValue = pendingValueRef.current;
            if (currentPendingValue !== null) {
              const serializedValue = JSON.stringify(currentPendingValue);
              
              // Evitar escritas desnecessárias
              if (serializedValue !== lastSavedRef.current) {
                window.localStorage.setItem(key, serializedValue);
                lastSavedRef.current = serializedValue;
                logLocalStorageOperation('write', key, true, false);
              }
              pendingValueRef.current = null;
            }
          } catch (error) {
            console.warn(`Erro ao salvar no localStorage para a chave "${key}":`, error);
            logLocalStorageOperation('write', key, false, false);
          }
        }, debounceMs);
      }
    } catch (error) {
      console.warn(`Erro ao processar valor para a chave "${key}":`, error);
      logLocalStorageOperation('write', key, false);
    }
  }, [key, storedValue, debounceMs]);

  // Cleanup e flush final do timeout quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        
        // Flush final para garantir que dados pendentes sejam salvos
        try {
          const currentPendingValue = pendingValueRef.current;
          if (currentPendingValue !== null) {
            const serializedValue = JSON.stringify(currentPendingValue);
            window.localStorage.setItem(key, serializedValue);
            logLocalStorageOperation('write', key, true);
          }
        } catch (error) {
          console.warn(`Erro ao fazer flush final no localStorage para a chave "${key}":`, error);
          logLocalStorageOperation('write', key, false);
        }
      }
    };
  }, [key]);

  return [storedValue, setValue];
}

// Hook para operações batch no localStorage
export function useBatchLocalStorage() {
  const batchRef = useRef<Map<string, any>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout>();

  const addToBatch = useCallback((key: string, value: any) => {
    batchRef.current.set(key, value);
    
    // Debounce para processar o batch
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      // Processar todas as operações do batch
      batchRef.current.forEach((val, k) => {
        try {
          localStorage.setItem(k, JSON.stringify(val));
        } catch (error) {
          console.warn(`Erro ao salvar batch item "${k}":`, error);
        }
      });
      
      batchRef.current.clear();
    }, 500);
  }, []);

  const flushBatch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    batchRef.current.forEach((val, key) => {
      try {
        localStorage.setItem(key, JSON.stringify(val));
      } catch (error) {
        console.warn(`Erro ao fazer flush do batch item "${key}":`, error);
      }
    });
    
    batchRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        // Flush final do batch
        flushBatch();
      }
    };
  }, [flushBatch]);

  return { addToBatch, flushBatch };
}

// ========== FUNÇÕES DE MONITORAMENTO E CONTROLE (APIS PÚBLICAS) ==========

// Obter métricas de localStorage (API pública)
export const getLocalStorageMetrics = () => {
  return {
    operations: { ...localStorageMetrics.operations },
    keyStats: Object.fromEntries(localStorageMetrics.keyStats),
    alerts: [...localStorageMetrics.alerts],
    enabled: localStorageMetrics.enabled
  };
};

// Configurar monitoramento (reversível)
export const enableLocalStorageMonitoring = (enabled: boolean = true) => {
  localStorageMetrics.enabled = enabled;
};

// Limpar métricas (útil para testes)
export const clearLocalStorageMetrics = () => {
  localStorageMetrics.operations = { reads: 0, writes: 0, errors: 0, criticalOperations: 0 };
  localStorageMetrics.keyStats.clear();
  localStorageMetrics.alerts = [];
};

// Verificar saúde do localStorage (sistema de alerta)
export const checkLocalStorageHealth = () => {
  const metrics = localStorageMetrics.operations;
  const total = metrics.reads + metrics.writes;
  
  if (total === 0) return { healthy: true, message: 'Sem atividade' };
  
  const errorRate = (metrics.errors / total) * 100;
  const criticalFailureRate = metrics.criticalOperations > 0 
    ? (metrics.errors / metrics.criticalOperations) * 100 
    : 0;
  
  return {
    healthy: errorRate < 5 && criticalFailureRate < 1,
    errorRate: errorRate.toFixed(1),
    criticalFailureRate: criticalFailureRate.toFixed(1),
    totalOperations: total,
    recentAlerts: localStorageMetrics.alerts.slice(-5)
  };
};

// Hook para monitorar localStorage em tempo real
export const useLocalStorageMonitor = () => {
  const [metrics, setMetrics] = useState(() => getLocalStorageMetrics());
  
  useEffect(() => {
    if (!localStorageMetrics.enabled) return;
    
    const interval = setInterval(() => {
      setMetrics(getLocalStorageMetrics());
    }, 5000); // Atualizar a cada 5 segundos
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    metrics,
    health: checkLocalStorageHealth(),
    clearMetrics: clearLocalStorageMetrics
  };
};