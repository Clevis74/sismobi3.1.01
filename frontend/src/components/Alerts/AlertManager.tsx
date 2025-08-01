import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Home, X, Droplets, Zap } from 'lucide-react';
import { Alert } from '../../types';
import { formatDate } from '../../utils/calculations';

interface AlertManagerProps {
  alerts: Alert[];
  properties: unknown[];
  onResolveAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
}

export const AlertManager: React.FC<{
  alerts,
  properties,
  onResolveAlert,
  onDeleteAlert
}> = ({
  alerts,
  properties,
  onResolveAlert,
  onDeleteAlert
}): JSX.Element => {
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');

  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'unresolved': return !alert.resolved;
      case 'resolved': return alert.resolved;
      default: return true;
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'medium': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'low': return <CheckCircle className="w-5 h-5 text-green-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAlertTypeText = (type: string) => {
    switch (type) {
      case 'rent_due': return 'Aluguel em atraso';
      case 'contract_expiring': return 'Contrato expirando';
      case 'maintenance': return 'Manutenção necessária';
      case 'tax_due': return 'Impostos a pagar';
      case 'energy_bill_pending': return 'Conta de energia vencida';
      case 'water_bill_pending': return 'Conta de água vencida'; // CORRIGIDO: Adicionado suporte para alertas de água
      default: return 'Alerta';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'rent_due': return <Home className="w-5 h-5 text-blue-600" />;
      case 'contract_expiring': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'maintenance': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'tax_due': return <AlertTriangle className="w-5 h-5 text-purple-600" />;
      case 'energy_bill_pending': return <Zap className="w-5 h-5 text-yellow-600" />;
      case 'water_bill_pending': return <Droplets className="w-5 h-5 text-blue-600" />; // NOVO: Ícone específico para água
      default: return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const unresolvedCount = alerts.filter(alert => !alert.resolved).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alertas e Notificações</h2>
          <p className="text-gray-600 mt-1">
            {unresolvedCount} alerta{unresolvedCount !== 1 ? 's' : ''} pendente{unresolvedCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('unresolved')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'unresolved' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'resolved' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Resolvidos
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const property = properties.find(p => p.id === alert.propertyId);
          return (
            <div
              key={alert.id}
              className={`bg-white rounded-lg border-l-4 shadow-md p-6 ${
                alert.resolved ? 'opacity-60' : ''
              } ${getPriorityColor(alert.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getPriorityIcon(alert.priority)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center space-x-2">
                        {getAlertTypeIcon(alert.type)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getAlertTypeText(alert.type)}
                        </h3>
                      </div>
                      {alert.resolved && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Resolvido
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-700 mb-3">{alert.message}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Home className="w-4 h-4 mr-1" />
                        <span>{property?.name || 'Propriedade não encontrada'}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{formatDate(alert.date)}</span>
                      </div>
                      {alert.tenantName && (
                        <div className="flex items-center">
                          <span className="text-blue-600 font-medium">👤 {alert.tenantName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!alert.resolved && (
                    <button
                      onClick={() => onResolveAlert(alert.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Resolver
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteAlert(alert.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {filter === 'unresolved' ? 'Nenhum alerta pendente' : 'Nenhum alerta encontrado'}
          </p>
          <p className="text-gray-400 mt-2">
            {filter === 'unresolved' ? 'Tudo está em ordem!' : 'Não há alertas para exibir'}
          </p>
        </div>
      )}
    </div>
  );
};