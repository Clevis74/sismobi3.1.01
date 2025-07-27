import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '../../utils/performanceMonitor';
import { getPerformanceMetrics } from '../../utils/optimizedCalculations';
import { getAlertCacheMetrics } from '../../utils/optimizedAlerts';

interface PerformanceDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ isVisible, onClose }) => {
  const [report, setReport] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible) {
      // Atualizar relatório imediatamente
      updateReport();
      
      // Configurar atualização automática
      const interval = setInterval(updateReport, 2000); // A cada 2 segundos
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [isVisible]);

  const updateReport = () => {
    const performanceReport = performanceMonitor.getPerformanceReport();
    const calculationMetrics = getPerformanceMetrics();
    const alertMetrics = getAlertCacheMetrics();
    
    setReport({
      ...performanceReport,
      calculationMetrics,
      alertMetrics,
      timestamp: new Date()
    });
  };

  const clearMetrics = () => {
    performanceMonitor.clearMetrics();
    updateReport();
  };

  const exportReport = () => {
    const data = performanceMonitor.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">🚀 Performance Dashboard</h2>
            <div className="flex space-x-2">
              <button
                onClick={exportReport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Exportar Relatório
              </button>
              <button
                onClick={clearMetrics}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Limpar Métricas
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
          {report && (
            <p className="text-gray-600 mt-2">
              Última atualização: {report.timestamp.toLocaleTimeString()}
            </p>
          )}
        </div>

        {report && (
          <div className="p-6 space-y-6">
            {/* Renders de Componentes */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">📊 Renders de Componentes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(report.renderCounts).map(([component, count]) => (
                  <div key={component} className="bg-white rounded-lg p-3 border">
                    <p className="font-medium">{component}</p>
                    <p className="text-2xl font-bold text-blue-600">{count as number}</p>
                    <p className="text-sm text-gray-600">renders</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Timing de Operações */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">⏱️ Timing de Operações</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(report.timings).map(([operation, time]) => (
                  <div key={operation} className="bg-white rounded-lg p-3 border">
                    <p className="font-medium">{operation}</p>
                    <p className="text-2xl font-bold text-green-600">{(time as number).toFixed(2)}ms</p>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (time as number) > 100 ? 'bg-red-500' : 
                          (time as number) > 50 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((time as number) / 200 * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estatísticas de Cache */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">💾 Estatísticas de Cache</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(report.cacheStats).map(([cacheKey, stats]) => (
                  <div key={cacheKey} className="bg-white rounded-lg p-3 border">
                    <p className="font-medium">{cacheKey}</p>
                    <p className="text-lg font-bold text-purple-600">
                      {((stats as any).hitRate).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">
                      Hits: {(stats as any).hits} | Misses: {(stats as any).misses}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Métricas de Cálculos */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">🧮 Métricas de Cálculos</h3>
              <div className="bg-white rounded-lg p-3 border">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Cache de Cálculos</p>
                    <p className="text-xl font-bold">{report.calculationMetrics.calculationCacheSize}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cache de Formatação</p>
                    <p className="text-xl font-bold">{report.calculationMetrics.formatCacheSize}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total de Entradas</p>
                    <p className="text-xl font-bold">{report.calculationMetrics.totalCacheEntries}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Métricas de Alertas */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">🚨 Métricas de Alertas</h3>
              <div className="bg-white rounded-lg p-3 border">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Cache de Alertas</p>
                    <p className="text-xl font-bold">{report.alertMetrics.alertCacheSize}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Chaves de Cache</p>
                    <p className="text-xl font-bold">{report.alertMetrics.cacheKeys.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações de Memória */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">🧠 Uso de Memória</h3>
              <div className="bg-white rounded-lg p-3 border">
                {report.memoryUsage.message ? (
                  <p className="text-gray-600">{report.memoryUsage.message}</p>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Usado</p>
                      <p className="text-xl font-bold">
                        {(report.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-xl font-bold">
                        {(report.memoryUsage.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Limite</p>
                      <p className="text-xl font-bold">
                        {(report.memoryUsage.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recomendações */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">💡 Recomendações</h3>
              <div className="bg-white rounded-lg p-3 border">
                {report.recommendations.map((rec: string, index: number) => (
                  <div key={index} className="mb-2 last:mb-0">
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};