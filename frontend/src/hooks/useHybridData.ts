import { useState, useEffect, useCallback, useRef } from 'react';
import { useOptimizedLocalStorage } from './useOptimizedLocalStorage';

// Tipos para gerenciamento de estado híbrido
interface HybridDataState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  lastSync: Date | null;
  source: 'api' | 'localStorage' | 'default';
}

interface HybridDataService<T> {
  getAll: () => Promise<T[]>;
  create: (item: Omit<T, 'id'>) => Promise<T>;
  update: (id: string, updates: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
}

interface HybridDataOptions {
  syncInterval?: number; // ms para auto-sync
  retryAttempts?: number;
  enableOfflineMode?: boolean;
}

/**
 * Hook híbrido que combina API calls com localStorage fallback
 * Estratégia: API-first com localStorage backup e sincronização inteligente
 */
export function useHybridData<T>(
  key: string,
  defaultValue: T,
  apiService: HybridDataService<T>,
  options: HybridDataOptions = {}
): [
  HybridDataState<T>,
  {
    refresh: () => Promise<void>;
    create: (item: Omit<T, 'id'>) => Promise<void>;
    update: (id: string, updates: Partial<T>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    syncToApi: () => Promise<void>;
  }
] {
  const {
    syncInterval = 5 * 60 * 1000, // 5 minutos
    retryAttempts = 3,
    enableOfflineMode = true
  } = options;

  // localStorage como backup/cache
  const [localData, setLocalData] = useOptimizedLocalStorage<T>(key, defaultValue);
  
  // Estado da aplicação
  const [state, setState] = useState<HybridDataState<T>>({
    data: defaultValue,
    loading: true,
    error: null,
    isOnline: navigator.onLine,
    lastSync: null,
    source: 'default'
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const isInitializedRef = useRef(false);

  // Função de refresh manual (definida antes do useEffect para evitar temporal dead zone)
  const refresh = useCallback(async (): Promise<void> => {
    return loadData(true);
  }, []);

  // Detectar mudanças de conectividade
  useEffect(() => {
    const handleOnline = (): void => {
      setState(prev => ({ ...prev, isOnline: true }));
      // Quando voltar online, agenda sincronização
      if (enableOfflineMode) {
        setTimeout(() => refresh(), 100);
      }
    };

    const handleOffline = (): void => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enableOfflineMode, refresh]);

  // Função para fazer requisições com retry
  const apiRequestWithRetry = useCallback(async <R>(
    apiCall: () => Promise<R>,
    attempts: number = Math.min(retryAttempts, 2) // Reduzir tentativas para fallback mais rápido
  ): Promise<R> => {
    for (let i = 0; i < attempts; i++) {
      try {
        return await apiCall();
      } catch (error) {
        if (i === attempts - 1) throw error;
        
        // Backoff mais rápido para desenvolvimento
        await new Promise(resolve => setTimeout(resolve, Math.min(Math.pow(2, i) * 500, 2000)));
      }
    }
    throw new Error('Max retry attempts exceeded');
  }, [retryAttempts]);

  // Carregar dados (API first, localStorage fallback)
  const loadData = useCallback(async (forceFromApi: boolean = false): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Tenta carregar da API primeiro (se online)
      if (state.isOnline && (forceFromApi || !isInitializedRef.current)) {
        try {
          const apiData = await apiRequestWithRetry(() => apiService.getAll());
          const dataArray = Array.isArray(apiData) ? apiData : [apiData];
          
          // Sucesso na API - atualiza localStorage e estado
          setLocalData(dataArray as T);
          setState(prev => ({
            ...prev,
            data: dataArray as T,
            loading: false,
            error: null,
            lastSync: new Date(),
            source: 'api'
          }));
          
          isInitializedRef.current = true;
          return;
        } catch (apiError) {
          console.warn(`API failed for ${key}, falling back to localStorage:`, apiError);
          
          // API falhou, mas não é erro fatal se temos localStorage ou modo offline habilitado
        }
      }

      // Fallback para localStorage
      if (enableOfflineMode) {
        setState(prev => ({
          ...prev,
          data: localData,
          loading: false,
          error: state.isOnline ? 'API temporariamente indisponível, usando dados locais' : null,
          source: localData !== defaultValue ? 'localStorage' : 'default'
        }));
        isInitializedRef.current = true;
        return;
      }

      // Se chegou até aqui e não há modo offline, usar dados padrão
      setState(prev => ({
        ...prev,
        data: defaultValue,
        loading: false,
        error: state.isOnline ? 'Nenhum dado disponível' : 'Modo offline - nenhum dado local encontrado',
        source: 'default'
      }));
      isInitializedRef.current = true;
      
    } catch (error) {
      // Em caso de erro geral, usar localStorage ou padrão
      const finalData = enableOfflineMode && localData !== defaultValue ? localData : defaultValue;
      const finalSource = enableOfflineMode && localData !== defaultValue ? 'localStorage' : 'default';
      
      setState(prev => ({
        ...prev,
        data: finalData,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        source: finalSource
      }));
      isInitializedRef.current = true;
    }
  }, [key, state.isOnline, localData, defaultValue, apiService, apiRequestWithRetry, setLocalData, enableOfflineMode]);

  // Update refresh callback once loadData is available
  useEffect(() => {
    refresh.current = async () => {
      await loadData(true);
    };
  }, [loadData]);

  // Função para criar item
  const create = useCallback(async (item: Omit<T, 'id'>): Promise<void> => {
    try {
      if (state.isOnline) {
        // Tenta criar via API
        const newItem = await apiRequestWithRetry(() => apiService.create(item));
        
        // Atualiza dados locais
        const currentData = Array.isArray(state.data) ? state.data : [];
        const updatedData = [...currentData, newItem] as T;
        setLocalData(updatedData);
        setState(prev => ({ ...prev, data: updatedData, lastSync: new Date(), source: 'api' }));
      } else if (enableOfflineMode) {
        // Modo offline - salva localmente com ID temporário
        const tempItem = {
          ...item,
          id: `temp_${Date.now()}`,
          _pendingSync: true
        } as T;
        
        const currentData = Array.isArray(state.data) ? state.data : [];
        const updatedData = [...currentData, tempItem] as T;
        setLocalData(updatedData);
        setState(prev => ({ ...prev, data: updatedData, source: 'localStorage' }));
      } else {
        throw new Error('Operação requer conexão com internet');
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Erro ao criar item' }));
      throw error;
    }
  }, [state.data, state.isOnline, apiService, apiRequestWithRetry, setLocalData, enableOfflineMode]);

  // Função para atualizar item
  const update = useCallback(async (id: string, updates: Partial<T>): Promise<void> => {
    try {
      if (state.isOnline && !id.startsWith('temp_')) {
        // Tenta atualizar via API
        const updatedItem = await apiRequestWithRetry(() => apiService.update(id, updates));
        
        // Atualiza dados locais
        const currentData = Array.isArray(state.data) ? state.data : [];
        const updatedData = currentData.map(item => 
          (item as any).id === id ? updatedItem : item
        ) as T;
        setLocalData(updatedData);
        setState(prev => ({ ...prev, data: updatedData, lastSync: new Date(), source: 'api' }));
      } else if (enableOfflineMode) {
        // Modo offline - atualiza localmente
        const currentData = Array.isArray(state.data) ? state.data : [];
        const updatedData = currentData.map(item => 
          (item as any).id === id ? { ...item, ...updates, _pendingSync: true } : item
        ) as T;
        setLocalData(updatedData);
        setState(prev => ({ ...prev, data: updatedData, source: 'localStorage' }));
      } else {
        throw new Error('Operação requer conexão com internet');
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Erro ao atualizar item' }));
      throw error;
    }
  }, [state.data, state.isOnline, apiService, apiRequestWithRetry, setLocalData, enableOfflineMode]);

  // Função para deletar item
  const deleteItem = useCallback(async (id: string): Promise<void> => {
    try {
      if (state.isOnline && !id.startsWith('temp_')) {
        // Tenta deletar via API
        await apiRequestWithRetry(() => apiService.delete(id));
      }

      // Remove dos dados locais (offline ou após sucesso da API)
      const currentData = Array.isArray(state.data) ? state.data : [];
      const updatedData = currentData.filter(item => (item as any).id !== id) as T;
      setLocalData(updatedData);
      setState(prev => ({ 
        ...prev, 
        data: updatedData, 
        lastSync: state.isOnline ? new Date() : prev.lastSync,
        source: state.isOnline ? 'api' : 'localStorage'
      }));
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Erro ao deletar item' }));
      throw error;
    }
  }, [state.data, state.isOnline, apiService, apiRequestWithRetry, setLocalData]);

  // Sincronizar dados pendentes para API
  const syncToApi = useCallback(async (): Promise<void> => {
    if (!state.isOnline || !enableOfflineMode) return;

    try {
      const currentData = Array.isArray(state.data) ? state.data : [];
      const pendingItems = currentData.filter((item: unknown) => item._pendingSync);

      for (const item of pendingItems) {
        const { _pendingSync, ...cleanItem } = item as any;
        
        if (cleanItem.id?.startsWith('temp_')) {
          // Item temporário - criar via API
          const { id: _id, ...createData } = cleanItem;
          await apiRequestWithRetry(() => apiService.create(createData));
        } else {
          // Item existente - atualizar via API  
          await apiRequestWithRetry(() => apiService.update(cleanItem.id, cleanItem));
        }
      }

      // Recarregar dados da API após sincronização
      await refresh();
    } catch (error) {
      console.warn('Falha na sincronização:', error);
    }
  }, [state.data, state.isOnline, apiService, apiRequestWithRetry, refresh, enableOfflineMode]);

  // Auto-sync periódico
  useEffect(() => {
    if (syncInterval > 0 && state.isOnline && enableOfflineMode) {
      syncTimeoutRef.current = setTimeout(() => {
        syncToApi();
      }, syncInterval);
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [syncInterval, state.isOnline, syncToApi, enableOfflineMode]);

  // Carregamento inicial
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cleanup
  useEffect(() => {
    return (): void => {
      const currentRetryTimeout = retryTimeoutRef.current;
      const currentSyncTimeout = syncTimeoutRef.current;
      
      if (currentRetryTimeout) {
        clearTimeout(currentRetryTimeout);
      }
      if (currentSyncTimeout) {
        clearTimeout(currentSyncTimeout);
      }
    };
  }, []);

  return [
    state,
    {
      refresh,
      create,
      update,
      delete: deleteItem,
      syncToApi
    }
  ];
}