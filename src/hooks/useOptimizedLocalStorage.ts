import { useState, useEffect, useCallback, useRef } from 'react';

// Hook otimizado para localStorage com debounce e cache
export function useOptimizedLocalStorage<T>(
  key: string,
  defaultValue: T,
  debounceMs: number = 300
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Erro ao ler localStorage para a chave "${key}":`, error);
      return defaultValue;
    }
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // Debounce para evitar escritas excessivas no localStorage
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        try {
          const serializedValue = JSON.stringify(valueToStore);
          
          // Evitar escritas desnecessárias
          if (serializedValue !== lastSavedRef.current) {
            window.localStorage.setItem(key, serializedValue);
            lastSavedRef.current = serializedValue;
          }
        } catch (error) {
          console.warn(`Erro ao salvar no localStorage para a chave "${key}":`, error);
        }
      }, debounceMs);
    } catch (error) {
      console.warn(`Erro ao processar valor para a chave "${key}":`, error);
    }
  }, [key, storedValue, debounceMs]);

  // Cleanup do timeout quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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
      }
    };
  }, []);

  return { addToBatch, flushBatch };
}