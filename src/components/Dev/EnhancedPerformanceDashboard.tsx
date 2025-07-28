import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '../../utils/performanceMonitor';
import { getPerformanceMetrics, getCacheStatistics } from '../../utils/optimizedCalculations';
import { getLocalStorageMetrics, checkLocalStorageHealth } from '../../hooks/useOptimizedLocalStorage';

// Componente modular e reversível para monitoramento
const EnhancedPerformanceDashboard: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<any>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Só renderizar em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const refreshMetrics = () => {
    try {
      const performanceReport = performanceMonitor.getPerformanceReport();
      const cacheMetrics = getPerformanceMetrics();
      const cacheStats = getCacheStatistics();
      const localStorageMetrics = getLocalStorageMetrics();
      const localStorageHealth = checkLocalStorageHealth();
      const productionMetrics = performanceMonitor.getProductionMetrics();
      const cacheAlerts = performanceMonitor.checkCacheAlerts();

      setMetrics({
        performance: performanceReport,
        cache: { ...cacheMetrics, ...cacheStats },
        localStorage: { ...localStorageMetrics, health: localStorageHealth },
        production: productionMetrics,
        alerts: cacheAlerts,
        lastUpdate: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.warn('[EnhancedPerformanceDashboard] Erro ao coletar métricas:', error);
    }
  };

  // Auto-refresh a cada 10 segundos
  useEffect(() => {
    if (!isVisible) return;

    refreshMetrics();
    const interval = setInterval(refreshMetrics, 10000);
    return () => clearInterval(interval);
  }, [isVisible, refreshKey]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-16 right-4 z-50 px-3 py-1 bg-blue-600 text-white text-xs rounded shadow hover:bg-blue-700 transition-colors"
        title="Abrir Dashboard de Performance"
      >
        📊 Performance
      </button>
    );
  }

  return (
    <div className="fixed top-16 right-4 z-50 bg-white shadow-lg rounded-lg border max-w-lg max-h-96 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b px-4 py-2 flex justify-between items-center">
        <h3 className="font-semibold text-sm">📊 Performance Monitor</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            title="Atualizar métricas"
          >
            🔄
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            title="Fechar dashboard"
          >
            ✖
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Status Geral */}
        <div>
          <div className="font-medium text-gray-700 mb-1">🎯 Status Geral</div>
          <div className="bg-gray-50 p-2 rounded text-xs">
            <div>Última atualização: {metrics.lastUpdate}</div>
            <div>Modo: {metrics.production?.isProductionMode ? 'Produção' : 'Desenvolvimento'}</div>
          </div>
        </div>

        {/* Cache Statistics */}
        {metrics.cache && (
          <div>
            <div className="font-medium text-gray-700 mb-1">💾 Cache Performance</div>
            <div className="bg-gray-50 p-2 rounded space-y-1">
              <div>Tamanho: {metrics.cache.calculationCacheSize}/{metrics.cache.maxSize}</div>
              <div>Hit Rate: {metrics.cache.cacheStats?.hitRate?.toFixed(1)}%</div>
              <div>Limpezas: {metrics.cache.cacheStats?.cleanupCount || 0}</div>
              <div className={`px-2 py-1 rounded text-xs ${metrics.cache.isHealthy ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {metrics.cache.isHealthy ? '✅ Saudável' : '⚠️ Atenção'}
              </div>
            </div>
          </div>
        )}

        {/* LocalStorage Health */}
        {metrics.localStorage && (
          <div>
            <div className="font-medium text-gray-700 mb-1">📝 LocalStorage</div>
            <div className="bg-gray-50 p-2 rounded space-y-1">
              <div>Operações: {metrics.localStorage.operations?.reads + metrics.localStorage.operations?.writes || 0}</div>
              <div>Críticas: {metrics.localStorage.operations?.criticalOperations || 0}</div>
              <div>Taxa de erro: {metrics.localStorage.health?.errorRate || '0.0'}%</div>
              <div className={`px-2 py-1 rounded text-xs ${metrics.localStorage.health?.healthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {metrics.localStorage.health?.healthy ? '✅ Saudável' : '❌ Problemas'}
              </div>
            </div>
          </div>
        )}

        {/* Render Performance */}
        {metrics.performance?.renderCounts && Object.keys(metrics.performance.renderCounts).length > 0 && (
          <div>
            <div className="font-medium text-gray-700 mb-1">🔄 Renders</div>
            <div className="bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
              {Object.entries(metrics.performance.renderCounts).map(([component, count]) => (
                <div key={component} className="flex justify-between">
                  <span>{component}:</span>
                  <span className={count > 10 ? 'text-orange-600 font-semibold' : ''}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alertas */}
        {metrics.alerts && metrics.alerts.length > 0 && (
          <div>
            <div className="font-medium text-red-600 mb-1">🚨 Alertas</div>
            <div className="bg-red-50 p-2 rounded max-h-16 overflow-y-auto">
              {metrics.alerts.map((alert: any, index: number) => (
                <div key={index} className="text-xs text-red-700 mb-1">
                  <div className="font-medium">{alert.type}</div>
                  <div>{alert.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recomendações */}
        {metrics.performance?.recommendations && (
          <div>
            <div className="font-medium text-gray-700 mb-1">💡 Recomendações</div>
            <div className="bg-blue-50 p-2 rounded max-h-16 overflow-y-auto">
              {metrics.performance.recommendations.slice(0, 2).map((rec: string, index: number) => (
                <div key={index} className="text-xs text-blue-700 mb-1">
                  {rec.length > 60 ? `${rec.substring(0, 60)}...` : rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controles */}
        <div className="border-t pt-2">
          <div className="font-medium text-gray-700 mb-1">🔧 Controles</div>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => {
                performanceMonitor.clearMetrics();
                setRefreshKey(prev => prev + 1);
              }}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="Limpar métricas de performance"
            >
              🗑️ Limpar
            </button>
            <button
              onClick={() => {
                const data = performanceMonitor.exportData();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `performance-${Date.now()}.json`;
                a.click();
              }}
              className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded"
              title="Exportar dados de performance"
            >
              💾 Exportar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPerformanceDashboard;