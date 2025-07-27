import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../test/test-utils';
import { PerformanceDashboard } from '../PerformanceDashboard';

// Mock dos módulos de utilidades
vi.mock('../../../utils/performanceMonitor', () => ({
  performanceMonitor: {
    getPerformanceReport: vi.fn(),
    clearMetrics: vi.fn(),
    exportData: vi.fn(() => '{"test": "data"}')
  }
}));

vi.mock('../../../utils/optimizedCalculations', () => ({
  getPerformanceMetrics: vi.fn()
}));

vi.mock('../../../utils/optimizedAlerts', () => ({
  getAlertCacheMetrics: vi.fn()
}));

// Imports para ter acesso aos mocks
import { performanceMonitor } from '../../../utils/performanceMonitor';
import { getPerformanceMetrics } from '../../../utils/optimizedCalculations';
import { getAlertCacheMetrics } from '../../../utils/optimizedAlerts';

describe('PerformanceDashboard', () => {
  const mockProps = {
    isVisible: true,
    onClose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderização com dados válidos', () => {
    beforeEach(() => {
      (performanceMonitor.getPerformanceReport as any).mockReturnValue({
        timings: { 'test-operation': 45.2 },
        renderCounts: { 'TestComponent': 5 },
        cacheStats: {
          'test-cache': {
            hits: 10,
            misses: 2,
            hitRate: 83.3
          }
        },
        memoryUsage: {
          usedJSHeapSize: 1024 * 1024 * 10, // 10MB
          totalJSHeapSize: 1024 * 1024 * 20, // 20MB
          jsHeapSizeLimit: 1024 * 1024 * 100 // 100MB
        },
        recommendations: ['✅ Performance está dentro dos parâmetros aceitáveis!']
      });

      (getPerformanceMetrics as any).mockReturnValue({
        calculationCacheSize: 15,
        formatCacheSize: 5,
        totalCacheEntries: 20
      });

      (getAlertCacheMetrics as any).mockReturnValue({
        alertCacheSize: 8,
        cacheKeys: ['alert-key-1', 'alert-key-2', 'alert-key-3']
      });
    });

    it('deve renderizar o dashboard quando visível', () => {
      render(<PerformanceDashboard {...mockProps} />);
      
      expect(screen.getByText('🚀 Performance Dashboard')).toBeInTheDocument();
      expect(screen.getByText('📊 Renders de Componentes')).toBeInTheDocument();
      expect(screen.getByText('⏱️ Timing de Operações')).toBeInTheDocument();
      expect(screen.getByText('💾 Estatísticas de Cache')).toBeInTheDocument();
      expect(screen.getByText('🧮 Métricas de Cálculos')).toBeInTheDocument();
      expect(screen.getByText('🚨 Métricas de Alertas')).toBeInTheDocument();
    });

    it('deve exibir dados de alertMetrics corretamente', async () => {
      render(<PerformanceDashboard {...mockProps} />);
      
      await waitFor(() => {
        // Verificar se o número de chaves de cache é exibido (era onde estava o erro)
        expect(screen.getByText('3')).toBeInTheDocument();
        // Verificar se o tamanho do cache de alertas é exibido
        expect(screen.getByText('8')).toBeInTheDocument();
      });
    });

    it('deve exibir dados de métricas de cálculo corretamente', async () => {
      render(<PerformanceDashboard {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument(); // calculationCacheSize
        expect(screen.getByText('5')).toBeInTheDocument(); // formatCacheSize
        expect(screen.getByText('20')).toBeInTheDocument(); // totalCacheEntries
      });
    });
  });

  describe('Renderização com dados undefined/null - Testes do Bug Fix', () => {
    it('deve lidar com alertMetrics.cacheKeys undefined sem erro', async () => {
      (performanceMonitor.getPerformanceReport as any).mockReturnValue({
        timings: {},
        renderCounts: {},
        cacheStats: {},
        memoryUsage: { message: 'Dados não disponíveis' },
        recommendations: []
      });

      (getPerformanceMetrics as any).mockReturnValue({
        calculationCacheSize: 0,
        totalCacheEntries: 0
      });

      // Simular o cenário que causava o erro: cacheKeys undefined
      (getAlertCacheMetrics as any).mockReturnValue({
        alertCacheSize: 0,
        cacheKeys: undefined // Simular dados corrompidos
      });

      render(<PerformanceDashboard {...mockProps} />);
      
      await waitFor(() => {
        // Deve exibir 0 chaves ao invés de causar erro
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('deve lidar com alertMetrics completamente undefined', async () => {
      (performanceMonitor.getPerformanceReport as any).mockReturnValue({
        timings: {},
        renderCounts: {},
        cacheStats: {},
        memoryUsage: { message: 'Dados não disponíveis' },
        recommendations: []
      });

      (getPerformanceMetrics as any).mockReturnValue(null);
      (getAlertCacheMetrics as any).mockReturnValue(null);

      render(<PerformanceDashboard {...mockProps} />);
      
      await waitFor(() => {
        // Deve funcionar sem erros mesmo com dados completamente undefined
        expect(screen.getByText('🚨 Métricas de Alertas')).toBeInTheDocument();
      });
    });

    it('deve lidar com arrays vazios adequadamente', async () => {
      (performanceMonitor.getPerformanceReport as any).mockReturnValue({
        timings: {},
        renderCounts: {},
        cacheStats: {},
        memoryUsage: { message: 'Dados não disponíveis' },
        recommendations: []
      });

      (getPerformanceMetrics as any).mockReturnValue({
        calculationCacheSize: 0,
        totalCacheEntries: 0
      });

      (getAlertCacheMetrics as any).mockReturnValue({
        alertCacheSize: 0,
        cacheKeys: [] // Array vazio
      });

      render(<PerformanceDashboard {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Nenhum dado de render disponível')).toBeInTheDocument();
        expect(screen.getByText('Nenhum dado de timing disponível')).toBeInTheDocument();
        expect(screen.getByText('Nenhuma estatística de cache disponível')).toBeInTheDocument();
      });
    });

    it('deve lidar com dados parcialmente corrompidos', async () => {
      (performanceMonitor.getPerformanceReport as any).mockReturnValue({
        timings: { 'op1': 'invalid' }, // Valor inválido
        renderCounts: { 'comp1': null }, // Valor nulo
        cacheStats: {
          'cache1': { hits: 'invalid', misses: undefined, hitRate: null }
        },
        memoryUsage: {
          usedJSHeapSize: 'not-a-number',
          totalJSHeapSize: null
        },
        recommendations: ['Recomendação válida']
      });

      (getPerformanceMetrics as any).mockReturnValue({
        calculationCacheSize: 'string-instead-of-number',
        totalCacheEntries: undefined
      });

      (getAlertCacheMetrics as any).mockReturnValue({
        alertCacheSize: null,
        cacheKeys: ['key1', null, undefined, 'key2'] // Array com valores inválidos
      });

      // Não deve lançar erro
      expect(() => {
        render(<PerformanceDashboard {...mockProps} />);
      }).not.toThrow();
    });
  });

  describe('Tratamento de erros', () => {
    it('deve exibir relatório de erro quando houver falha na obtenção de dados', async () => {
      (performanceMonitor.getPerformanceReport as any).mockImplementation(() => {
        throw new Error('Falha simulada');
      });

      render(<PerformanceDashboard {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('⚠️ Erro ao carregar recomendações')).toBeInTheDocument();
        expect(screen.getByText('Erro ao carregar dados de memória')).toBeInTheDocument();
      });
    });
  });

  describe('Funcionalidades dos botões', () => {
    beforeEach(() => {
      (performanceMonitor.getPerformanceReport as any).mockReturnValue({
        timings: {},
        renderCounts: {},
        cacheStats: {},
        memoryUsage: { message: 'Teste' },
        recommendations: []
      });
      
      (getPerformanceMetrics as any).mockReturnValue({
        calculationCacheSize: 0,
        totalCacheEntries: 0
      });
      
      (getAlertCacheMetrics as any).mockReturnValue({
        alertCacheSize: 0,
        cacheKeys: []
      });
    });

    it('deve chamar onClose quando botão fechar é clicado', () => {
      render(<PerformanceDashboard {...mockProps} />);
      
      const closeButton = screen.getByText('Fechar');
      closeButton.click();
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('deve chamar clearMetrics quando botão limpar é clicado', () => {
      render(<PerformanceDashboard {...mockProps} />);
      
      const clearButton = screen.getByText('Limpar Métricas');
      clearButton.click();
      
      expect(performanceMonitor.clearMetrics).toHaveBeenCalled();
    });
  });

  describe('Visibilidade do componente', () => {
    it('não deve renderizar quando isVisible é false', () => {
      render(<PerformanceDashboard {...mockProps} isVisible={false} />);
      
      expect(screen.queryByText('🚀 Performance Dashboard')).not.toBeInTheDocument();
    });
  });
});