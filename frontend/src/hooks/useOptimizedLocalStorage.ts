import { useState, useEffect, useCallback, useRef } from 'react';

// Helper function to convert date strings back to Date objects
function reviveDates(key: string, value: unknown): any {
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
function processStoredData(data: unknown): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => processStoredData(item));
  }
  
  if (typeof data === 'object') {
    const processed: unknown = {};
    for (const [key, value] of Object.entries(data)) {
      processed[key] = reviveDates(key, processStoredData(value));
    }
    return processed;
  }
  
  return data;
}

// Hook otimizado para localStorage com debounce e cache
export function useOptimizedLocalStorage<T>(
  key: string,
  defaultValue: T,
  debounceMs: number = 300
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        return processStoredData(parsed);
      }
      return defaultValue;
    } catch (error) {
      console.warn(`Erro ao ler localStorage para a chave "${key}":`, error);
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
      
      // Flush imediato para operações críticas
      const criticalKeys = ['transactions', 'properties', 'tenants', 'alerts'];
      const isCritical = criticalKeys.some(criticalKey => key.includes(criticalKey));
      
      if (isCritical) {
        try {
          const serializedValue = JSON.stringify(valueToStore);
          window.localStorage.setItem(key, serializedValue);
          lastSavedRef.current = serializedValue;
          pendingValueRef.current = null;
        } catch (error) {
          console.warn(`Erro ao salvar operação crítica no localStorage para a chave "${key}":`, error);
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
              }
              pendingValueRef.current = null;
            }
          } catch (error) {
            console.warn(`Erro ao salvar no localStorage para a chave "${key}":`, error);
          }
        }, debounceMs);
      }
    } catch (error) {
      console.warn(`Erro ao processar valor para a chave "${key}":`, error);
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
          }
        } catch (error) {
          console.warn(`Erro ao fazer flush final no localStorage para a chave "${key}":`, error);
        }
      }
    };
  }, [key]);

  return [storedValue, setValue];
}

// Hook para operações batch no localStorage
export function useBatchLocalStorage(): any {
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