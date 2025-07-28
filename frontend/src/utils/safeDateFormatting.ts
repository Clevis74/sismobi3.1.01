// Formatação segura de datas com validação defensiva
const formatCache = new Map<string, string>();

export const formatDate = (
  date: Date | string | number | null | undefined,
  options: {
    fallback?: string;
    locale?: string;
    format?: Intl.DateTimeFormatOptions;
  } = {}
): string => {
  const {
    fallback = 'Data inválida',
    locale = 'pt-BR',
    format = {}
  } = options;

  // Validação de entrada
  if (date === null || date === undefined) {
    return fallback;
  }

  let dateObj: Date;

  try {
    // Conversão segura para Date
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      // Handle ISO strings and local date strings
      if (date.includes('T') || date.includes('-')) {
        dateObj = new Date(date);
      } else {
        // Assumir formato brasileiro dd/mm/yyyy
        const [day, month, year] = date.split('/').map(Number);
        if (day && month && year) {
          dateObj = new Date(year, month - 1, day);
        } else {
          dateObj = new Date(date);
        }
      }
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      console.warn('[formatDate] Tipo inválido:', typeof date, date);
      return fallback;
    }

    // Validação da data criada
    if (isNaN(dateObj.getTime())) {
      console.warn('[formatDate] Data inválida:', date);
      return fallback;
    }

    // Validação de limites razoáveis (1900-2100)
    const year = dateObj.getFullYear();
    if (year < 1900 || year > 2100) {
      console.warn('[formatDate] Data fora do intervalo válido:', date);
      return fallback;
    }

  } catch (error) {
    console.error('[formatDate] Erro na conversão:', error, date);
    return fallback;
  }

  // Cache inteligente
  const cacheKey = `date-${dateObj.getTime()}-${locale}-${JSON.stringify(format)}`;
  if (formatCache.has(cacheKey)) {
    return formatCache.get(cacheKey)!;
  }

  try {
    const formatted = new Intl.DateTimeFormat(locale, format).format(dateObj);
    
    // Limitar cache para evitar memory leak
    if (formatCache.size > 100) {
      const firstKey = formatCache.keys().next().value;
      formatCache.delete(firstKey);
    }
    
    formatCache.set(cacheKey, formatted);
    return formatted;
    
  } catch (error) {
    console.error('[formatDate] Erro na formatação:', error);
    return fallback;
  }
};

// Função helper para datas de formulários
export const formatInputDate = (date: Date | string | null): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

// Validador de data para formulários
export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

// Formatação de moeda (sem alterações, mas importado aqui para centralizar)
const currencyCache = new Map<string, string>();

export const formatCurrency = (amount: number): string => {
  const key = `currency-${amount}`;
  if (currencyCache.has(key)) {
    return currencyCache.get(key)!;
  }
  
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
  
  currencyCache.set(key, formatted);
  return formatted;
};

// Função para criar data local (sem alterações)
export const createLocalDate = (dateString: string): Date => {
  // Para strings no formato YYYY-MM-DD, criar data local
  if (dateString.includes('-') && dateString.length === 10) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateString);
};

// Função para verificar se data está no mês atual
export const isDateInCurrentMonth = (date: Date): boolean => {
  if (!isValidDate(date)) return false;
  
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

// Função para limpar caches
export const clearDateCache = () => {
  formatCache.clear();
  currencyCache.clear();
};