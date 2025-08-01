import React from 'react';
import { Modal } from '../common/Modal';
import { 
  Building, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  FileText,
  Zap,
  Droplets,
  DollarSign,
  Home,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { formatCurrency } from '../../utils/optimizedCalculations';
import { formatDate } from '../../utils/safeDateFormatting';
import { Property, Tenant, Transaction, Alert, Document, EnergyBill, WaterBill } from '../../types';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  showValues: boolean;
  data: {
    properties: Property[];
    tenants: Tenant[];
    transactions: Transaction[];
    alerts: Alert[];
    documents: Document[];
    energyBills: EnergyBill[];
    waterBills: WaterBill[];
  };
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  showValues,
  data
}) => {
  const { properties, tenants, transactions, alerts, documents, energyBills, waterBills } = data;

  // Cálculos do resumo
  const totalProperties = properties.length;
  const occupiedProperties = properties.filter(p => p.status === 'rented').length;
  const vacantProperties = properties.filter(p => p.status === 'vacant').length;
  const maintenanceProperties = properties.filter(p => p.status === 'maintenance').length;
  const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;

  const activeTenants = tenants.length;
  const unresolvedAlerts = alerts.filter(a => !a.resolved).length;
  const criticalAlerts = alerts.filter(a => !a.resolved && a.priority === 'critical').length;

  // Cálculos financeiros
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
  });

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netIncome = monthlyIncome - monthlyExpenses;

  const totalInvestment = properties.reduce((sum, p) => sum + (p.purchasePrice || 0), 0);
  const monthlyROI = totalInvestment > 0 ? (netIncome / totalInvestment) * 100 : 0;

  // Transações recentes (últimas 5)
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Alertas críticos
  const criticalAlertsList = alerts
    .filter(a => !a.resolved && a.priority === 'critical')
    .slice(0, 3);

  // Utilitários para formatação
  const formatValue = (value: number) => showValues ? formatCurrency(value) : '****';
  const formatPercent = (value: number) => showValues ? `${value.toFixed(1)}%` : '**%';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📋 Resumo do Portfólio"
      size="xl"
    >
      <div className="space-y-8">
        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Propriedades */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Propriedades</p>
                <p className="text-2xl font-bold text-blue-900">{totalProperties}</p>
              </div>
              <Building className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-3 text-sm text-blue-700">
              <div className="flex justify-between">
                <span>Ocupadas:</span>
                <span>{occupiedProperties}</span>
              </div>
              <div className="flex justify-between">
                <span>Vagas:</span>
                <span>{vacantProperties}</span>
              </div>
              <div className="flex justify-between">
                <span>Manutenção:</span>
                <span>{maintenanceProperties}</span>
              </div>
            </div>
          </div>

          {/* Inquilinos */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Inquilinos Ativos</p>
                <p className="text-2xl font-bold text-green-900">{activeTenants}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <div className="mt-3 text-sm text-green-700">
              <div className="flex justify-between">
                <span>Taxa de Ocupação:</span>
                <span>{formatPercent(occupancyRate)}</span>
              </div>
            </div>
          </div>

          {/* Alertas */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Alertas Pendentes</p>
                <p className="text-2xl font-bold text-yellow-900">{unresolvedAlerts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="mt-3 text-sm text-yellow-700">
              <div className="flex justify-between">
                <span>Críticos:</span>
                <span className="text-red-600 font-medium">{criticalAlerts}</span>
              </div>
            </div>
          </div>

          {/* Desempenho Financeiro */}
          <div className={`p-4 rounded-lg ${netIncome >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Resultado Mensal
                </p>
                <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                  {formatValue(netIncome)}
                </p>
              </div>
              {netIncome >= 0 ? 
                <TrendingUp className="w-8 h-8 text-green-600" /> : 
                <TrendingDown className="w-8 h-8 text-red-600" />
              }
            </div>
            <div className={`mt-3 text-sm ${netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              <div className="flex justify-between">
                <span>ROI Mensal:</span>
                <span>{formatPercent(monthlyROI)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detalhes Financeiros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Receitas e Despesas */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Financeiro - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Receitas Mensais:</span>
                <span className="font-medium text-green-600">{formatValue(monthlyIncome)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Despesas Mensais:</span>
                <span className="font-medium text-red-600">{formatValue(monthlyExpenses)}</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-semibold">Resultado Líquido:</span>
                <span className={`font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatValue(netIncome)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Investimento Total:</span>
                <span className="font-medium text-blue-600">{formatValue(totalInvestment)}</span>
              </div>
            </div>
          </div>

          {/* Documentos e Contas */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Documentos e Contas
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Documentos:
                </span>
                <span className="font-medium">{documents.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                  Contas de Energia:
                </span>
                <span className="font-medium">{energyBills.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <Droplets className="w-4 h-4 mr-2 text-blue-500" />
                  Contas de Água:
                </span>
                <span className="font-medium">{waterBills.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Transações no Mês:</span>
                <span className="font-medium">{monthlyTransactions.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transações Recentes */}
        {recentTransactions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Transações Recentes
            </h3>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(new Date(transaction.date), { format: { day: '2-digit', month: 'short' } })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatValue(transaction.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alertas Críticos */}
        {criticalAlertsList.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Alertas Críticos que Requerem Atenção
            </h3>
            <div className="space-y-3">
              {criticalAlertsList.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 bg-white rounded border border-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900">{alert.title}</h4>
                    <p className="text-sm text-red-700 mt-1">{alert.message}</p>
                    {alert.due_date && (
                      <p className="text-xs text-red-600 mt-2">
                        Vence em: {formatDate(new Date(alert.due_date))}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status do Sistema */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status do Sistema</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Sistema Operacional</span>
            </div>
            <div className="flex items-center space-x-2">
              <Home className="w-4 h-4 text-blue-500" />
              <span>{totalProperties} Propriedades</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-green-500" />
              <span>{activeTenants} Inquilinos</span>
            </div>
            <div className="flex items-center space-x-2">
              {unresolvedAlerts > 0 ? 
                <XCircle className="w-4 h-4 text-yellow-500" /> :
                <CheckCircle className="w-4 h-4 text-green-500" />
              }
              <span>{unresolvedAlerts} Alertas Pendentes</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};