// Utilitários de debounce e throttle para otimização de performance

// Função de debounce padrão
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

// Função de throttle
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Debounce avançado com cancelamento
export class AdvancedDebounce<T extends (...args: any[]) => any> {
  private timeout: NodeJS.Timeout | null = null;
  private func: T;
  private wait: number;
  private immediate: boolean;

  constructor(func: T, wait: number, immediate: boolean = false) {
    this.func = func;
    this.wait = wait;
    this.immediate = immediate;
  }

  public execute(...args: Parameters<T>): void {
    const later = () => {
      this.timeout = null;
      if (!this.immediate) this.func(...args);
    };

    const callNow = this.immediate && !this.timeout;
    
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    
    this.timeout = setTimeout(later, this.wait);
    
    if (callNow) {
      this.func(...args);
    }
  }

  public cancel(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  public flush(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
      this.func();
    }
  }
}

// Gerenciador de debounce para múltiplas operações
export class DebounceManager {
  private debouncers: Map<string, AdvancedDebounce<any>> = new Map();

  public register<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    wait: number,
    immediate: boolean = false
  ): void {
    this.debouncers.set(key, new AdvancedDebounce(func, wait, immediate));
  }

  public execute(key: string, ...args: any[]): void {
    const debouncer = this.debouncers.get(key);
    if (debouncer) {
      debouncer.execute(...args);
    }
  }

  public cancel(key: string): void {
    const debouncer = this.debouncers.get(key);
    if (debouncer) {
      debouncer.cancel();
    }
  }

  public flush(key: string): void {
    const debouncer = this.debouncers.get(key);
    if (debouncer) {
      debouncer.flush();
    }
  }

  public clear(): void {
    this.debouncers.forEach(debouncer => debouncer.cancel());
    this.debouncers.clear();
  }
}

// Instância global do gerenciador
export const globalDebounceManager = new DebounceManager();

// Hook React para debounce
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook React para debounce de callback
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const callbackRef = React.useRef(callback);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    callbackRef.current = callback;
  });

  return React.useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

// Debounce específico para operações de localStorage
export const localStorageDebounce = debounce((key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Erro ao salvar no localStorage: ${error}`);
  }
}, 300);

// Debounce específico para filtros de busca
export const searchDebounce = debounce((searchTerm: string, callback: (term: string) => void) => {
  callback(searchTerm);
}, 300);

// Debounce específico para cálculos pesados
export const calculationDebounce = debounce((data: any, callback: (result: any) => void) => {
  callback(data);
}, 500);