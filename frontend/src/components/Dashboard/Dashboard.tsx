import React from 'react';
import { DollarSign, TrendingUp, Home, Percent } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { TransactionChart } from './TransactionChart';
import { PropertyList } from './PropertyList';
import { FinancialSummary } from '../../types';
import { formatCurrency } from '../../utils/calculations';

interface DashboardProps {
  summary: FinancialSummary;
  properties: any[];
  transactions: any[];
  showValues: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ summary, properties, transactions, showValues }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Receita Mensal"
          value={formatCurrency(summary.totalIncome)}
          icon={DollarSign}
          color="green"
          showValues={showValues}
          trend={{ value: 8.5, isPositive: true }}
        />
        <MetricCard
          title="Despesas Mensais"
          value={formatCurrency(summary.totalExpenses)}
          icon={TrendingUp}
          color="red"
          showValues={showValues}
          trend={{ value: -2.3, isPositive: false }}
        />
        <MetricCard
          title="Lucro Líquido"
          value={formatCurrency(summary.netIncome)}
          icon={DollarSign}
          color="blue"
          showValues={showValues}
          trend={{ value: 12.8, isPositive: true }}
        />
        <MetricCard
          title="Taxa de Ocupação"
          value={`${summary.occupancyRate.toFixed(1)}%`}
          icon={Percent}
          color="yellow"
          showValues={showValues}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fluxo de Caixa - Últimos 6 Meses</h3>
          <TransactionChart transactions={transactions} showValues={showValues} />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Propriedades</h3>
          <PropertyList properties={properties} showValues={showValues} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo Financeiro</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">ROI Mensal</p>
            <p className="text-xl font-bold text-green-600">
              {showValues ? `${summary.monthlyROI.toFixed(2)}%` : '****%'}
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Propriedades Alugadas</p>
            <p className="text-xl font-bold text-blue-600">{summary.rentedProperties}/{summary.totalProperties}</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600">Receita Média/Propriedade</p>
            <p className="text-xl font-bold text-yellow-600">
              {showValues 
                ? formatCurrency(summary.rentedProperties > 0 ? summary.totalIncome / summary.rentedProperties : 0)
                : '****'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};