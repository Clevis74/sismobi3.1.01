import { Property, Transaction, FinancialSummary } from '../types';
import { formatDate as safeFormatDate, formatCurrency, createLocalDate, isDateInCurrentMonth } from './safeDateFormatting';

// ========== EXTENSÕES DE CACHE COM ALERTAS (REVERSÍVEIS) ==========

// Cache para evitar recálculos desnecessários com limite configurável
const calculationCache = new Map<string, any>();
const MAX_CACHE_SIZE = 20;
const CACHE_CLEANUP_THRESHOLD = 15;

// Sistema de alertas de cache (extensão modular)
const cacheAlerts = {
  enabled: true,
  thresholds: {
    maxSize: MAX_CACHE_SIZE,
    cleanupThreshold: CACHE_CLEANUP_THRESHOLD,
    hitRateWarning: 60, // %
    operationTimeWarning: 100 // ms
  },
  stats: {
    totalOperations: 0,
    cacheHits: 0,
    cleanupCount: 0,
    lastCleanup: 0
  }
};

// Função para log de alertas (defensiva)
const logCacheAlert = (type: string, message: string, data?: any) => {
  if (!cacheAlerts.enabled || process.env.NODE_ENV !== 'development') return;
  
  try {
    console.warn(`🚨 Cache Alert [${type}]: ${message}`, data || '');
    
    // Registrar alerta para análise posterior
    if (!window.__cacheAlerts) window.__cacheAlerts = [];
    window.__cacheAlerts.push({
      timestamp: Date.now(),
      type,
      message,
      data
    });
  } catch (error) {
    // Falha silenciosa para não impactar produção
  }
};

// Função auxiliar para criar chave de cache com validação segura
const createCacheKey = (properties: Property[], transactions: Transaction[], suffix: string = '') => {
  try {
    const propHash = properties.map(p => `${p.id}-${p.status}-${p.rentValue}`).join('|');
    const transHash = transactions.map(t => {
      const dateTime = t.date instanceof Date ? t.date.getTime() : new Date(t.date).getTime();
      return `${t.id}-${t.amount}-${isNaN(dateTime) ? '0' : dateTime}`;
    }).join('|');
    return `${propHash}:${transHash}${suffix}`;
  } catch (error) {
    console.warn('[createCacheKey] Erro ao criar chave de cache:', error);
    return `fallback-${Date.now()}${suffix}`;
  }
};

// Função para limpar cache quando necessário (implementação LRU com alertas)
const cleanupCache = () => {
  try {
    if (calculationCache.size > CACHE_CLEANUP_THRESHOLD) {
      const keysToDelete = Array.from(calculationCache.keys())
        .slice(0, calculationCache.size - MAX_CACHE_SIZE);
      keysToDelete.forEach(key => calculationCache.delete(key));
      
      // Registrar limpeza para análise
      cacheAlerts.stats.cleanupCount++;
      cacheAlerts.stats.lastCleanup = Date.now();
      
      // Alerta se limpeza muito frequente
      if (cacheAlerts.stats.cleanupCount > 10) {
        logCacheAlert('frequent_cleanup', 
          `Cache limpo ${cacheAlerts.stats.cleanupCount} vezes. Considere aumentar MAX_CACHE_SIZE.`);
      }
    }
    
    // Verificar hit rate se temos dados suficientes
    if (cacheAlerts.stats.totalOperations > 20) {
      const hitRate = (cacheAlerts.stats.cacheHits / cacheAlerts.stats.totalOperations) * 100;
      if (hitRate < cacheAlerts.thresholds.hitRateWarning) {
        logCacheAlert('low_hit_rate', 
          `Hit rate do cache baixo: ${hitRate.toFixed(1)}%`, 
          { hits: cacheAlerts.stats.cacheHits, total: cacheAlerts.stats.totalOperations });
      }
    }
  } catch (error) {
    // Falha defensiva - cache continua funcionando
    console.warn('[cleanupCache] Erro no cleanup:', error);
  }
};

// Memoização inteligente para cálculos financeiros
export const calculateFinancialSummary = (
  properties: Property[],
  transactions: Transaction[]
): FinancialSummary => {
  const startTime = performance.now();
  const cacheKey = createCacheKey(properties, transactions, '-financial');
  
  // Incrementar contador de operações
  cacheAlerts.stats.totalOperations++;
  
  if (calculationCache.has(cacheKey)) {
    cacheAlerts.stats.cacheHits++;
    
    // Log hit em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      const hitRate = (cacheAlerts.stats.cacheHits / cacheAlerts.stats.totalOperations) * 100;
      console.debug(`💾 Cache HIT (${hitRate.toFixed(1)}%):`, cacheKey.substring(0, 50) + '...');
    }
    
    return calculationCache.get(cacheKey);
  }

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Filtrar transações do mês atual com validação de data
  const monthlyTransactions = transactions.filter(t => {
    try {
      const transactionDate = new Date(t.date);
      if (isNaN(transactionDate.getTime())) {
        console.warn('[calculateFinancialSummary] Data inválida na transação:', t.id, t.date);
        return false;
      }
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    } catch (error) {
      console.warn('[calculateFinancialSummary] Erro ao processar data:', error, t);
      return false;
    }
  });

  // Calcular totais em uma única passagem
  let totalIncome = 0;
  let totalExpenses = 0;
  
  monthlyTransactions.forEach(t => {
    const amount = typeof t.amount === 'number' ? t.amount : 0;
    if (t.type === 'income') {
      totalIncome += amount;
    } else {
      totalExpenses += amount;
    }
  });

  const netIncome = totalIncome - totalExpenses;
  const totalProperties = properties.length;
  const rentedProperties = properties.filter(p => p.status === 'rented').length;
  const occupancyRate = totalProperties > 0 ? (rentedProperties / totalProperties) * 100 : 0;

  const totalInvestment = properties.reduce((sum, p) => {
    const price = typeof p.purchasePrice === 'number' ? p.purchasePrice : 0;
    return sum + price;
  }, 0);
  const monthlyROI = totalInvestment > 0 ? (netIncome / totalInvestment) * 100 : 0;

  const result: FinancialSummary = {
    totalIncome,
    totalExpenses,
    netIncome,
    occupancyRate,
    totalProperties,
    rentedProperties,
    monthlyROI
  };

  // Cache o resultado e limpa cache antigo
  calculationCache.set(cacheKey, result);
  cleanupCache();
  
  // Verificar tempo de operação
  const operationTime = performance.now() - startTime;
  if (operationTime > cacheAlerts.thresholds.operationTimeWarning) {
    logCacheAlert('slow_operation', 
      `Cálculo financeiro lento: ${operationTime.toFixed(2)}ms`, 
      { properties: properties.length, transactions: transactions.length });
  }

  return result;
};

// Re-exportar funções seguras de formatação
export const formatDate = safeFormatDate;
export { formatCurrency, createLocalDate, isDateInCurrentMonth };

// Função para limpar cache quando necessário
export const clearCalculationCache = () => {
  calculationCache.clear();
};

// Função para calcular métricas de performance
export const getPerformanceMetrics = () => {
  return {
    calculationCacheSize: calculationCache.size,
    formatCacheSize: 0, // Será implementado quando necessário
    totalCacheEntries: calculationCache.size
  };
};