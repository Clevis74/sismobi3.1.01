import React, { useState, useEffect } from 'react';
import { Plus, Calculator, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Import, Save, Eye, EyeOff } from 'lucide-react';
import { EnergyBill, SharedPropertyConsumption } from '../../types';
import { 
  calculateMonthlyConsumption, 
  distributeEnergyBill, 
  validateConsumptionData,
  createSharedPropertyConsumption,
  importPreviousMonthData,
  generateConsumptionInsights,
  calculateConsumptionStats,
  DEFAULT_ENERGY_GROUPS
} from '../../utils/energyCalculations';
import { formatCurrency, formatDate } from '../../utils/calculations';

interface EnergyCalculatorProps {
  energyBills: EnergyBill[];
  onAddEnergyBill: (bill: Omit<EnergyBill, 'id' | 'createdAt' | 'lastUpdated'>) => void;
  onUpdateEnergyBill: (id: string, bill: Partial<EnergyBill>) => void;
  onDeleteEnergyBill: (id: string) => void;
}

export const EnergyCalculator: React.FC<EnergyCalculatorProps> = ({
  energyBills,
  onAddEnergyBill,
  onUpdateEnergyBill,
  onDeleteEnergyBill
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingBill, setEditingBill] = useState<EnergyBill | null>(null);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    totalValue: 0,
    totalConsumption: 0,
    observations: '',
    isPaid: false
  });

  // Propriedades padrão baseadas nos grupos
  const [properties, setProperties] = useState<SharedPropertyConsumption[]>(() => {
    const defaultProperties: SharedPropertyConsumption[] = [];
    
    DEFAULT_ENERGY_GROUPS.forEach(group => {
      group.properties.forEach(propName => {
        const hasMeter = propName !== group.residualReceiver;
        const isResidualReceiver = propName === group.residualReceiver;
        
        defaultProperties.push({
          id: `${group.id}-${propName}`,
          ...createSharedPropertyConsumption(propName, group.id, hasMeter, isResidualReceiver)
        });
      });
    });
    
    return defaultProperties;
  });

  const [validation, setValidation] = useState<{
    isValid: boolean;
    message: string;
    difference: number;
  } | null>(null);

  // Recalcular consumo mensal quando leituras mudarem
  useEffect(() => {
    setProperties(prev => prev.map(prop => ({
      ...prop,
      monthlyConsumption: prop.hasMeter 
        ? calculateMonthlyConsumption(prop.currentReading, prop.previousReading)
        : 0
    })));
  }, []);

  // Recalcular distribuição quando dados mudarem
  useEffect(() => {
    if (formData.totalValue > 0 && formData.totalConsumption > 0) {
      const distributedProperties = distributeEnergyBill(
        formData.totalValue,
        formData.totalConsumption,
        properties
      );
      setProperties(distributedProperties);
      
      // Validar dados
      const validationResult = validateConsumptionData(distributedProperties, formData.totalConsumption);
      setValidation(validationResult);
    }
  }, [formData.totalValue, formData.totalConsumption, properties.map(p => p.monthlyConsumption).join(',')]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'totalValue' || name === 'totalConsumption' ? Number(value) : value
      }));
    }
  };

  const handlePropertyChange = (id: string, field: keyof SharedPropertyConsumption, value: number) => {
    setProperties(prev => prev.map(prop => {
      if (prop.id === id) {
        const updated = { ...prop, [field]: value };
        
        // Recalcular consumo mensal se mudou leitura atual ou anterior
        if (field === 'currentReading' || field === 'previousReading') {
          updated.monthlyConsumption = prop.hasMeter 
            ? calculateMonthlyConsumption(updated.currentReading, updated.previousReading)
            : 0;
        }
        
        return updated;
      }
      return prop;
    }));
  };

  const handleImportPreviousMonth = () => {
    const previousBill = energyBills.length > 0 ? energyBills[energyBills.length - 1] : null;
    const importedProperties = importPreviousMonthData(properties, previousBill);
    setProperties(importedProperties);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const billData: Omit<EnergyBill, 'id' | 'createdAt' | 'lastUpdated'> = {
      date: new Date(formData.date),
      totalValue: formData.totalValue,
      totalConsumption: formData.totalConsumption,
      properties: properties,
      observations: formData.observations,
      isPaid: formData.isPaid
    };

    if (editingBill) {
      onUpdateEnergyBill(editingBill.id, billData);
    } else {
      onAddEnergyBill(billData);
    }

    // Reset form
    setShowForm(false);
    setEditingBill(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      totalValue: 0,
      totalConsumption: 0,
      observations: '',
      isPaid: false
    });
    
    setProperties(prev => prev.map(prop => ({
      ...prop,
      currentReading: 0,
      previousReading: 0,
      monthlyConsumption: 0,
      proportionalValue: 0,
      proportionalConsumption: 0
    })));
  };

  const handleEditBill = (bill: EnergyBill) => {
    setEditingBill(bill);
    setFormData({
      date: new Date(bill.date).toISOString().split('T')[0],
      totalValue: bill.totalValue,
      totalConsumption: bill.totalConsumption,
      observations: bill.observations,
      isPaid: bill.isPaid
    });
    setProperties(bill.properties);
    setShowForm(true);
  };

  const stats = calculateConsumptionStats(energyBills);
  const insights = energyBills.length > 0 
    ? generateConsumptionInsights(
        { ...formData, properties, id: '', createdAt: new Date(), lastUpdated: new Date() } as EnergyBill,
        energyBills
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cálculo de Energia Compartilhada</h2>
          <p className="text-gray-600 mt-1">
            {energyBills.length} conta{energyBills.length !== 1 ? 's' : ''} registrada{energyBills.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showHistory ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showHistory ? 'Ocultar' : 'Ver'} Histórico
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Conta
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      {energyBills.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Consumo Médio</p>
                <p className="text-xl font-bold text-blue-600">{stats.averageConsumption.toFixed(0)} kWh</p>
              </div>
              <Calculator className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Médio</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(stats.averageValue)}</p>
              </div>
              <Calculator className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tendência</p>
                <p className={`text-xl font-bold ${
                  stats.trend === 'increasing' ? 'text-red-600' : 
                  stats.trend === 'decreasing' ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {stats.trend === 'increasing' ? 'Subindo' : 
                   stats.trend === 'decreasing' ? 'Descendo' : 'Estável'}
                </p>
              </div>
              {stats.trend === 'increasing' ? 
                <TrendingUp className="w-8 h-8 text-red-600" /> :
                stats.trend === 'decreasing' ?
                <TrendingDown className="w-8 h-8 text-green-600" /> :
                <Minus className="w-8 h-8 text-gray-600" />
              }
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Variação Mensal</p>
                <p className={`text-xl font-bold ${stats.monthlyVariation >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.monthlyVariation >= 0 ? '+' : ''}{stats.monthlyVariation.toFixed(1)}%
                </p>
              </div>
              {stats.monthlyVariation >= 0 ? 
                <TrendingUp className="w-8 h-8 text-red-600" /> :
                <TrendingDown className="w-8 h-8 text-green-600" />
              }
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Insights do Consumo
          </h3>
          <ul className="space-y-1">
            {insights.map((insight, index) => (
              <li key={index} className="text-yellow-700 text-sm">• {insight}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {editingBill ? 'Editar Conta de Energia' : 'Nova Conta de Energia'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Gerais */}
            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-md font-medium text-gray-800 mb-4">Dados da Conta</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data da Conta</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    name="totalValue"
                    value={formData.totalValue}
                    onChange={handleFormChange}
                    required
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consumo Total (kWh)</label>
                  <input
                    type="number"
                    name="totalConsumption"
                    value={formData.totalConsumption}
                    onChange={handleFormChange}
                    required
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPaid"
                    name="isPaid"
                    checked={formData.isPaid}
                    onChange={handleFormChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPaid" className="ml-2 block text-sm text-gray-900">
                    Conta paga
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleImportPreviousMonth}
                  className="flex items-center px-3 py-1 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                >
                  <Import className="w-4 h-4 mr-1" />
                  Importar Mês Anterior
                </button>
              </div>
            </div>

            {/* Leituras dos Imóveis */}
            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-md font-medium text-gray-800 mb-4">Leituras dos Medidores</h4>
              
              {DEFAULT_ENERGY_GROUPS.map(group => (
                <div key={group.id} className="mb-6">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">{group.name}</h5>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {properties
                      .filter(prop => prop.groupId === group.id)
                      .map(property => (
                        <div key={property.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h6 className="font-medium text-gray-900">{property.name}</h6>
                            <div className="flex items-center space-x-2">
                              {property.hasMeter ? (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  Com medidor
                                </span>
                              ) : (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                  Sem medidor (residual)
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {property.hasMeter ? (
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">kWh Anterior</label>
                                <input
                                  type="number"
                                  value={property.previousReading}
                                  onChange={(e) => handlePropertyChange(property.id, 'previousReading', Number(e.target.value))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">kWh Atual</label>
                                <input
                                  type="number"
                                  value={property.currentReading}
                                  onChange={(e) => handlePropertyChange(property.id, 'currentReading', Number(e.target.value))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Consumo</label>
                                <input
                                  type="number"
                                  value={property.monthlyConsumption}
                                  readOnly
                                  className="w-full px-2 py-1 text-sm border border-gray-200 rounded bg-gray-50 text-gray-600"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4 bg-gray-50 rounded">
                              <p className="text-sm text-gray-600">
                                Consumo: {property.proportionalConsumption.toFixed(2)} kWh (residual)
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Resultados da Distribuição */}
            {formData.totalValue > 0 && formData.totalConsumption > 0 && (
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-md font-medium text-gray-800 mb-4">Distribuição Proporcional</h4>
                
                {/* Validação */}
                {validation && (
                  <div className={`mb-4 p-3 rounded-lg flex items-center ${
                    validation.isValid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    {validation.isValid ? 
                      <CheckCircle className="w-5 h-5 mr-2" /> : 
                      <AlertTriangle className="w-5 h-5 mr-2" />
                    }
                    {validation.message}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {properties.map(property => (
                    <div key={property.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="font-medium text-gray-900">{property.name}</h6>
                        {property.isResidualReceiver && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            Residual
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Consumo:</span>
                          <span className="font-medium">{property.proportionalConsumption.toFixed(2)} kWh</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Valor:</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(property.proportionalValue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleFormChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Anotações sobre a conta ou consumo..."
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingBill(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingBill ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Histórico */}
      {showHistory && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Histórico de Contas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consumo Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {energyBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(bill.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(bill.totalValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bill.totalConsumption.toFixed(0)} kWh
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        bill.isPaid 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {bill.isPaid ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditBill(bill)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDeleteEnergyBill(bill.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {energyBills.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Nenhuma conta de energia cadastrada</p>
          <p className="text-gray-400 mt-2">Comece adicionando sua primeira conta para calcular a distribuição</p>
        </div>
      )}
    </div>
  );
};