import { Property, Transaction, FinancialSummary } from '../types';

// Cache para evitar recálculos desnecessários
const calculationCache = new Map<string, any>();

// Função auxiliar para criar chave de cache
const createCacheKey = (properties: Property[], transactions: Transaction[], suffix: string = '') => {
  const propHash = properties.map(p => `${p.id}-${p.status}-${p.rentValue}`).join('|');
  const transHash = transactions.map(t => `${t.id}-${t.amount}-${t.date}`).join('|');
  return `${propHash}:${transHash}${suffix}`;
};

// Memoização inteligente para cálculos financeiros
export const calculateFinancialSummary = (
  properties: Property[],
  transactions: Transaction[]
): FinancialSummary => {
  const cacheKey = createCacheKey(properties, transactions, '-financial');
  
  if (calculationCache.has(cacheKey)) {
    return calculationCache.get(cacheKey);
  }

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Filtrar transações do mês atual uma única vez
  const monthlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });

  // Calcular totais em uma única passagem
  let totalIncome = 0;
  let totalExpenses = 0;
  
  monthlyTransactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpenses += t.amount;
    }
  });

  const netIncome = totalIncome - totalExpenses;
  const totalProperties = properties.length;
  const rentedProperties = properties.filter(p => p.status === 'rented').length;
  const occupancyRate = totalProperties > 0 ? (rentedProperties / totalProperties) * 100 : 0;

  const totalInvestment = properties.reduce((sum, p) => sum + p.purchasePrice, 0);
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

  // Cache o resultado
  calculationCache.set(cacheKey, result);
  
  // Limpar cache antigo (manter apenas 10 entradas)
  if (calculationCache.size > 10) {
    const firstKey = calculationCache.keys().next().value;
    calculationCache.delete(firstKey);
  }

  return result;
};

// Formatação otimizada com cache
const formatCache = new Map<string, string>();

export const formatCurrency = (amount: number): string => {
  const key = `currency-${amount}`;
  if (formatCache.has(key)) {
    return formatCache.get(key)!;
  }
  
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
  
  formatCache.set(key, formatted);
  return formatted;
};

export const formatDate = (date: Date): string => {
  const key = `date-${date.getTime()}`;
  if (formatCache.has(key)) {
    return formatCache.get(key)!;
  }
  
  const formatted = new Intl.DateTimeFormat('pt-BR').format(date);
  formatCache.set(key, formatted);
  return formatted;
};

export const createLocalDate = (dateString: string): Date => {
  // Para strings no formato YYYY-MM-DD, criar data local
  if (dateString.includes('-') && dateString.length === 10) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateString);
};

export const isDateInCurrentMonth = (date: Date): boolean => {
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

// Função para limpar cache quando necessário
export const clearCalculationCache = () => {
  calculationCache.clear();
  formatCache.clear();
};

// Função para calcular métricas de performance
export const getPerformanceMetrics = () => {
  return {
    calculationCacheSize: calculationCache.size,
    formatCacheSize: formatCache.size,
    totalCacheEntries: calculationCache.size + formatCache.size
  };
};