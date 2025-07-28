// Sistema de monitoramento de performance e otimização de recursos
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, any> = new Map();
  private timers: Map<string, number> = new Map();
  private renderCounts: Map<string, number> = new Map();
  private cacheHits: Map<string, number> = new Map();
  private cacheMisses: Map<string, number> = new Map();
  
  // ========== EXTENSÕES PARA PRODUÇÃO (REVERSÍVEIS) ==========
  private productionMetrics: Map<string, any> = new Map();
  private memorySnapshots: Array<{ timestamp: number; usage: any }> = [];
  private alertThresholds: Map<string, number> = new Map();
  private isProductionMode: boolean = process.env.NODE_ENV === 'production';

  private constructor() {
    // Configurar thresholds padrão para alertas (podem ser ajustados)
    this.alertThresholds.set('renderCount', 15);
    this.alertThresholds.set('operationTime', 150);
    this.alertThresholds.set('cacheHitRate', 40);
    this.alertThresholds.set('memoryUsage', 50); // MB
    
    // Iniciar monitoramento automático em produção (seguro)
    if (this.isProductionMode) {
      this.startProductionMonitoring();
    }
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Iniciar medição de tempo
  public startTimer(label: string): void {
    this.timers.set(label, performance.now());
  }

  // Finalizar medição de tempo
  public endTimer(label: string): number {
    const startTime = this.timers.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.metrics.set(label, duration);
      this.timers.delete(label);
      return duration;
    }
    return 0;
  }

  // Registrar render de componente
  public logRender(componentName: string): void {
    const current = this.renderCounts.get(componentName) || 0;
    this.renderCounts.set(componentName, current + 1);
  }

  // Registrar cache hit
  public logCacheHit(cacheKey: string): void {
    const current = this.cacheHits.get(cacheKey) || 0;
    this.cacheHits.set(cacheKey, current + 1);
  }

  // Registrar cache miss
  public logCacheMiss(cacheKey: string): void {
    const current = this.cacheMisses.get(cacheKey) || 0;
    this.cacheMisses.set(cacheKey, current + 1);
  }

  // Calcular taxa de hit do cache
  public getCacheHitRate(cacheKey: string): number {
    const hits = this.cacheHits.get(cacheKey) || 0;
    const misses = this.cacheMisses.get(cacheKey) || 0;
    const total = hits + misses;
    return total > 0 ? (hits / total) * 100 : 0;
  }

  // Obter relatório de performance
  public getPerformanceReport(): any {
    const report = {
      timings: Object.fromEntries(this.metrics),
      renderCounts: Object.fromEntries(this.renderCounts),
      cacheStats: {},
      memoryUsage: this.getMemoryUsage(),
      recommendations: this.getRecommendations()
    };

    // Calcular estatísticas de cache
    const allCacheKeys = new Set([
      ...this.cacheHits.keys(),
      ...this.cacheMisses.keys()
    ]);

    allCacheKeys.forEach(key => {
      (report.cacheStats as any)[key] = {
        hits: this.cacheHits.get(key) || 0,
        misses: this.cacheMisses.get(key) || 0,
        hitRate: this.getCacheHitRate(key)
      };
    });

    return report;
  }

  // Obter informações de uso de memória
  private getMemoryUsage(): any {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return { message: 'Informações de memória não disponíveis' };
  }

  // Gerar recomendações baseadas nos dados coletados
  private getRecommendations(): string[] {
    const recommendations: string[] = [];

    // Verificar componentes com muitos renders
    this.renderCounts.forEach((count, component) => {
      const threshold = this.alertThresholds.get('renderCount') || 10;
      if (count > threshold) {
        recommendations.push(
          `⚠️ ${component} renderizou ${count} vezes. Considere usar React.memo ou otimizar dependências.`
        );
      }
    });

    // Verificar operações lentas
    this.metrics.forEach((duration, operation) => {
      const threshold = this.alertThresholds.get('operationTime') || 100;
      if (duration > threshold) {
        recommendations.push(
          `🐌 ${operation} levou ${duration.toFixed(2)}ms. Considere otimizar esta operação.`
        );
      }
    });

    // Verificar cache hit rate baixo
    this.cacheHits.forEach((hits, key) => {
      const hitRate = this.getCacheHitRate(key);
      const threshold = this.alertThresholds.get('cacheHitRate') || 50;
      if (hitRate < threshold) {
        recommendations.push(
          `📊 Cache "${key}" tem hit rate baixo (${hitRate.toFixed(1)}%). Revisar estratégia de cache.`
        );
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('✅ Performance está dentro dos parâmetros aceitáveis!');
    }

    return recommendations;
  }

  // ========== MÉTODOS PRODUÇÃO (EXTENSÕES DEFENSIVAS) ==========
  
  // Iniciar monitoramento automático em produção (reversível)
  private startProductionMonitoring(): void {
    if (!this.isProductionMode) return;
    
    try {
      // Snapshot de memória a cada 5 minutos (não agressivo)
      setInterval(() => {
        this.captureMemorySnapshot();
        this.cleanOldSnapshots();
      }, 5 * 60 * 1000);
      
      // Log de métricas críticas (apenas desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        setInterval(() => {
          this.logCriticalMetrics();
        }, 10 * 60 * 1000);
      }
    } catch (error) {
      console.warn('[PerformanceMonitor] Erro ao iniciar monitoramento produção:', error);
    }
  }

  // Capturar snapshot de memória (seguro)
  private captureMemorySnapshot(): void {
    try {
      const usage = this.getMemoryUsage();
      const timestamp = Date.now();
      
      this.memorySnapshots.push({ timestamp, usage });
      
      // Manter apenas últimos 12 snapshots (1 hora de dados)
      if (this.memorySnapshots.length > 12) {
        this.memorySnapshots = this.memorySnapshots.slice(-12);
      }
      
      // Verificar threshold de memória
      if (usage.usedJSHeapSize && usage.usedJSHeapSize > this.alertThresholds.get('memoryUsage')! * 1024 * 1024) {
        this.productionMetrics.set('memoryAlert', {
          timestamp,
          usage: usage.usedJSHeapSize,
          threshold: this.alertThresholds.get('memoryUsage')
        });
      }
    } catch (error) {
      // Falha silenciosa para não impactar produção
    }
  }

  // Limpar snapshots antigos (defensivo)
  private cleanOldSnapshots(): void {
    try {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      this.memorySnapshots = this.memorySnapshots.filter(
        snapshot => snapshot.timestamp > oneHourAgo
      );
    } catch (error) {
      // Falha silenciosa
    }
  }

  // Log de métricas críticas apenas em desenvolvimento
  private logCriticalMetrics(): void {
    if (process.env.NODE_ENV !== 'development') return;
    
    try {
      const report = this.getPerformanceReport();
      
      // Log estruturado para análise
      console.group('📊 Performance Snapshot');
      console.log('🔢 Render Counts:', report.renderCounts);
      console.log('⏱️ Operation Timings:', report.timings);
      console.log('💾 Cache Stats:', report.cacheStats);
      if (report.memoryUsage) {
        console.log('🧠 Memory:', `${(report.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
      }
      console.groupEnd();
    } catch (error) {
      // Falha silenciosa
    }
  }

  // Configurar thresholds personalizados (API pública)
  public setAlertThreshold(metric: string, value: number): void {
    this.alertThresholds.set(metric, value);
  }

  // Obter métricas de produção (API pública)
  public getProductionMetrics(): any {
    return {
      memorySnapshots: this.memorySnapshots.slice(), // cópia segura
      alertThresholds: Object.fromEntries(this.alertThresholds),
      productionMetrics: Object.fromEntries(this.productionMetrics),
      isProductionMode: this.isProductionMode
    };
  }

  // Verificar se há alertas de cache (extensão modular)
  public checkCacheAlerts(): Array<{ type: string; message: string; severity: string }> {
    const alerts: Array<{ type: string; message: string; severity: string }> = [];
    
    try {
      this.cacheHits.forEach((hits, key) => {
        const hitRate = this.getCacheHitRate(key);
        const threshold = this.alertThresholds.get('cacheHitRate') || 50;
        
        if (hitRate < threshold) {
          alerts.push({
            type: 'cache_low_hit_rate',
            message: `Cache "${key}" com hit rate baixo: ${hitRate.toFixed(1)}%`,
            severity: hitRate < 30 ? 'high' : 'medium'
          });
        }
      });
      
      // Verificar tamanho do cache se disponível
      const cacheSize = this.metrics.get('calculationCacheSize') || 0;
      if (cacheSize > 15) {
        alerts.push({
          type: 'cache_size_high',
          message: `Cache com ${cacheSize} entradas. Considere limpeza.`,
          severity: 'low'
        });
      }
    } catch (error) {
      // Falha defensiva
    }
    
    return alerts;
  }

  // Limpar métricas
  public clearMetrics(): void {
    this.metrics.clear();
    this.timers.clear();
    this.renderCounts.clear();
    this.cacheHits.clear();
    this.cacheMisses.clear();
    // Manter dados de produção para análise histórica
  }

  // Exportar dados para análise
  public exportData(): string {
    const report = this.getPerformanceReport();
    const productionData = this.getProductionMetrics();
    
    return JSON.stringify({
      ...report,
      productionData,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
  
  // ========== MÉTODOS DE CONTROLE (REVERSIBILIDADE) ==========
  
  // Desabilitar monitoramento de produção (reversível)
  public disableProductionMonitoring(): void {
    this.isProductionMode = false;
    this.memorySnapshots = [];
    this.productionMetrics.clear();
  }
  
  // Reabilitar monitoramento de produção 
  public enableProductionMonitoring(): void {
    this.isProductionMode = true;
    this.startProductionMonitoring();
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Hook para monitorar renders de componentes
export function useRenderMonitor(componentName: string) {
  if (process.env.NODE_ENV === 'development') {
    performanceMonitor.logRender(componentName);
  }
}

// Hook para monitorar operações custosas
export function useOperationMonitor(operationName: string) {
  const startTimer = () => performanceMonitor.startTimer(operationName);
  const endTimer = () => performanceMonitor.endTimer(operationName);
  
  return { startTimer, endTimer };
}

// Decorator para monitorar funções
export function monitorFunction(functionName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      performanceMonitor.startTimer(functionName);
      const result = originalMethod.apply(this, args);
      performanceMonitor.endTimer(functionName);
      return result;
    };
    
    return descriptor;
  };
}

// Função para debug de performance
export function debugPerformance() {
  if (process.env.NODE_ENV === 'development') {
    console.group('🚀 Performance Report');
    console.log(performanceMonitor.getPerformanceReport());
    console.groupEnd();
  }
}