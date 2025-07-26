import React, { useMemo } from 'react';
import { MetricCard } from './MetricCard';
import { TransactionChart } from './TransactionChart';
import { PropertyList } from './PropertyList';
import { FinancialSummary, Property, Transaction } from '../../types';
import { useRenderMonitor } from '../../utils/performanceMonitor';
import { formatCurrency } from '../../utils/optimizedCalculations';

interface OptimizedDashboardProps {
  summary: FinancialSummary;
  properties: Property[];
  transactions: Transaction[];
  showValues: boolean;
}

// Componente de resumo financeiro memoizado
const FinancialSummaryCards = React.memo(({ 
  summary, 
  showValues 
}: { 
  summary: FinancialSummary; 
  showValues: boolean; 
}) => {
  const formatValue = (value: number) => showValues ? formatCurrency(value) : '****';
  const formatPercent = (value: number) => showValues ? `${value.toFixed(1)}%` : '****';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Receita Total"
        value={formatValue(summary.totalIncome)}
        trend={summary.totalIncome > 0 ? 'up' : 'neutral'}
        icon="💰"
      />
      <MetricCard
        title="Despesas Totais"
        value={formatValue(summary.totalExpenses)}
        trend={summary.totalExpenses > 0 ? 'down' : 'neutral'}
        icon="💸"
      />
      <MetricCard
        title="Lucro Líquido"
        value={formatValue(summary.netIncome)}
        trend={summary.netIncome > 0 ? 'up' : summary.netIncome < 0 ? 'down' : 'neutral'}
        icon="📈"
      />
      <MetricCard
        title="Taxa de Ocupação"
        value={formatPercent(summary.occupancyRate)}
        trend={summary.occupancyRate > 80 ? 'up' : summary.occupancyRate < 60 ? 'down' : 'neutral'}
        icon="🏠"
      />
    </div>
  );
});

FinancialSummaryCards.displayName = 'FinancialSummaryCards';

// Componente de estatísticas adicionais memoizado
const AdditionalStats = React.memo(({ 
  summary, 
  properties, 
  showValues 
}: { 
  summary: FinancialSummary; 
  properties: Property[]; 
  showValues: boolean; 
}) => {
  const formatValue = (value: number) => showValues ? formatCurrency(value) : '****';
  const formatPercent = (value: number) => showValues ? `${value.toFixed(2)}%` : '****';

  const totalInvestment = useMemo(() => 
    properties.reduce((sum, p) => sum + p.purchasePrice, 0), 
    [properties]
  );

  const averageRent = useMemo(() => {
    const rentedProperties = properties.filter(p => p.status === 'rented');
    if (rentedProperties.length === 0) return 0;
    return rentedProperties.reduce((sum, p) => sum + p.rentValue, 0) / rentedProperties.length;
  }, [properties]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <MetricCard
        title="ROI Mensal"
        value={formatPercent(summary.monthlyROI)}
        trend={summary.monthlyROI > 0 ? 'up' : 'neutral'}
        icon="📊"
      />
      <MetricCard
        title="Investimento Total"
        value={formatValue(totalInvestment)}
        trend="neutral"
        icon="💼"
      />
      <MetricCard
        title="Aluguel Médio"
        value={formatValue(averageRent)}
        trend="neutral"
        icon="🏘️"
      />
    </div>
  );
});

AdditionalStats.displayName = 'AdditionalStats';

export const OptimizedDashboard: React.FC<OptimizedDashboardProps> = ({
  summary,
  properties,
  transactions,
  showValues
}) => {
  useRenderMonitor('Dashboard');

  // Memoizar transações do mês atual para o gráfico
  const currentMonthTransactions = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });
  }, [transactions]);

  // Memoizar propriedades com alertas
  const propertiesWithAlerts = useMemo(() => {
    return properties.map(property => ({
      ...property,
      hasAlert: property.status === 'maintenance' || 
                (property.status === 'rented' && !property.tenant)
    }));
  }, [properties]);

  return (
    <div className="space-y-8">
      {/* Título do Dashboard */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Visão geral do seu portfólio imobiliário
        </p>
      </div>

      {/* Resumo Financeiro */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumo Financeiro</h2>
        <FinancialSummaryCards summary={summary} showValues={showValues} />
      </section>

      {/* Estatísticas Adicionais */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Estatísticas Adicionais</h2>
        <AdditionalStats summary={summary} properties={properties} showValues={showValues} />
      </section>

      {/* Gráfico de Transações */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Transações do Mês</h2>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <TransactionChart transactions={currentMonthTransactions} showValues={showValues} />
        </div>
      </section>

      {/* Lista de Propriedades */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Propriedades</h2>
        <PropertyList properties={propertiesWithAlerts} showValues={showValues} />
      </section>

      {/* Resumo de Performance */}
      {showValues && (
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumo de Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Propriedades Alugadas</p>
              <p className="text-2xl font-bold text-blue-600">
                {summary.rentedProperties} / {summary.totalProperties}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Eficiência de Ocupação</p>
              <p className="text-2xl font-bold text-green-600">
                {summary.occupancyRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};