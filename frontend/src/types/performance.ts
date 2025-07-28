// Tipos específicos para o dashboard de performance

export interface PerformanceTimings {
  [operation: string]: number;
}

export interface RenderCounts {
  [component: string]: number;
}

export interface CacheStats {
  [cacheKey: string]: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}

export interface MemoryUsage {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  message?: string;
}

export interface CalculationMetrics {
  calculationCacheSize: number;
  formatCacheSize?: number;
  totalCacheEntries: number;
}

export interface AlertMetrics {
  alertCacheSize: number;
  cacheKeys: string[];
}

export interface PerformanceReport {
  timings: PerformanceTimings;
  renderCounts: RenderCounts;
  cacheStats: CacheStats;
  memoryUsage: MemoryUsage;
  calculationMetrics: CalculationMetrics;
  alertMetrics: AlertMetrics;
  recommendations: string[];
  timestamp: Date;
}