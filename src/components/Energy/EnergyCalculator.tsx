import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, Download, Upload, User, Home, CheckCircle, XCircle } from 'lucide-react';
import { EnergyBill, EnergyGroupBill, SharedPropertyConsumption, Property, Tenant } from '../../types';
import { distributeEnergyGroupBill, createSharedPropertyConsumption } from '../../utils/energyCalculations';

interface EnergyCalculatorProps {
  energyBills: EnergyBill[];
  onSaveEnergyBill: (bill: EnergyBill) => void;
  editingBill?: EnergyBill;
  onCancelEdit: () => void;
  properties: Property[];
  tenants: Tenant[];
}

const DEFAULT_ENERGY_GROUPS = [
  { id: 'group1', name: 'Grupo 1 (802-Ca)', properties: ['802- Ca 01 Manoel', '802- Ca 02 Jaqueline', '802- Ca 03 Vago'] },
  { id: 'group2', name: 'Grupo 2 (802-Ca)', properties: ['802- Ca 04 Vago', '802- Ca 05 Vago', '802- Ca 06 Vago'] },
  { id: 'group3', name: 'Grupo 3 (117-Ca)', properties: ['117- Ca 01 Vago', '117- Ca 02 Vago', '117- Ca 03 Vago'] }
];

export const EnergyCalculator: React.FC<EnergyCalculatorProps> = ({
  energyBills,
  onSaveEnergyBill,
  editingBill,
  onCancelEdit,
  properties,
  tenants
}) => {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [groupBills, setGroupBills] = useState<EnergyGroupBill[]>([]);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());

  // Helper function to map property names to IDs and tenant IDs
  const mapPropertyNamesToIds = (bills: EnergyGroupBill[]): EnergyGroupBill[] => {
    return bills.map(groupBill => ({
      ...groupBill,
      propertiesInGroup: groupBill.propertiesInGroup.map(prop => {
        const linkedProperty = properties.find(p => p.name === prop.propertyName);
        const tenant = linkedProperty ? tenants.find(t => t.propertyId === linkedProperty.id) : undefined;
        
        return {
          ...prop,
          propertyId: linkedProperty?.id || '',
          tenantId: tenant?.id
        };
      })
    }));
  };

  useEffect(() => {
    if (editingBill) {
      setMonth(editingBill.month);
      setYear(editingBill.year);
      
      // Map the existing group bills and ensure property/tenant IDs are set
      const mappedGroupBills = mapPropertyNamesToIds(editingBill.groupBills);
      setGroupBills(mappedGroupBills);
      
      // Select groups that have data
      const groupsWithData = mappedGroupBills
        .filter(gb => gb.totalGroupValue > 0 || gb.totalGroupConsumption > 0)
        .map(gb => gb.groupId);
      setSelectedGroups(groupsWithData);
    } else {
      // Initialize with default groups
      const initialGroupBills = DEFAULT_ENERGY_GROUPS.map(group => ({
        groupId: group.id,
        groupName: group.name,
        totalGroupValue: 0,
        totalGroupConsumption: 0,
        propertiesInGroup: group.properties.map(propertyName => {
          const linkedProperty = properties.find(p => p.name === propertyName);
          const tenant = linkedProperty ? tenants.find(t => t.propertyId === linkedProperty.id) : undefined;
          
          return createSharedPropertyConsumption(
            propertyName,
            linkedProperty?.id || '',
            tenant?.id
          );
        })
      }));
      
      setGroupBills(initialGroupBills);
      setSelectedGroups([]);
    }
  }, [editingBill, properties, tenants]);

  const handleGroupSelection = (groupId: string, selected: boolean) => {
    if (selected) {
      setSelectedGroups(prev => [...prev, groupId]);
    } else {
      setSelectedGroups(prev => prev.filter(id => id !== groupId));
    }
  };

  const handleGroupChange = (groupId: string, field: 'totalGroupValue' | 'totalGroupConsumption', value: number) => {
    setGroupBills(prev => prev.map(group => 
      group.groupId === groupId 
        ? { ...group, [field]: value }
        : group
    ));
  };

  const handlePropertyChange = (groupId: string, propertyIndex: number, field: keyof SharedPropertyConsumption, value: any) => {
    setGroupBills(prev => prev.map(group => 
      group.groupId === groupId 
        ? {
            ...group,
            propertiesInGroup: group.propertiesInGroup.map((prop, index) =>
              index === propertyIndex ? { ...prop, [field]: value } : prop
            )
          }
        : group
    ));
  };

  const calculateDistribution = () => {
    const updatedGroupBills = groupBills.map(group => {
      if (selectedGroups.includes(group.groupId)) {
        return distributeEnergyGroupBill(group);
      }
      return group;
    });
    setGroupBills(updatedGroupBills);
  };

  const importFromPreviousMonth = (groupId: string) => {
    if (energyBills.length === 0) return;

    const previousBill = energyBills
      .filter(bill => bill.year === year && bill.month !== month)
      .sort((a, b) => {
        const monthOrder = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                           'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return monthOrder.indexOf(b.month) - monthOrder.indexOf(a.month);
      })[0];

    if (previousBill) {
      const previousGroup = previousBill.groupBills.find(gb => gb.groupId === groupId);
      if (previousGroup) {
        setGroupBills(prev => prev.map(group => 
          group.groupId === groupId 
            ? {
                ...group,
                totalGroupValue: previousGroup.totalGroupValue,
                totalGroupConsumption: previousGroup.totalGroupConsumption,
                propertiesInGroup: group.propertiesInGroup.map((prop, index) => ({
                  ...prop,
                  consumption: previousGroup.propertiesInGroup[index]?.consumption || 0
                }))
              }
            : group
        ));
      }
    }
  };

  const resetForm = () => {
    const resetGroupBills = groupBills.map(group => 
      selectedGroups.includes(group.groupId)
        ? {
            ...group,
            totalGroupValue: 0,
            totalGroupConsumption: 0,
            propertiesInGroup: group.propertiesInGroup.map(prop => ({
              ...prop,
              consumption: 0,
              calculatedValue: 0,
              paymentStatus: 'pending' as const
            }))
          }
        : group
    );
    setGroupBills(resetGroupBills);
  };

  const handleSave = () => {
    if (!month) return;

    const totalValue = groupBills
      .filter(group => selectedGroups.includes(group.groupId))
      .reduce((sum, group) => sum + group.totalGroupValue, 0);
    
    const totalConsumption = groupBills
      .filter(group => selectedGroups.includes(group.groupId))
      .reduce((sum, group) => sum + group.totalGroupConsumption, 0);

    const bill: EnergyBill = {
      id: editingBill?.id || Date.now().toString(),
      month,
      year,
      totalValue,
      totalConsumption,
      groupBills: groupBills,
      createdAt: editingBill?.createdAt || new Date().toISOString()
    };

    onSaveEnergyBill(bill);
    onCancelEdit();
  };

  const filteredGroupBills = groupBills.filter(group => selectedGroups.includes(group.groupId));

  const getTenantName = (tenantId?: string) => {
    if (!tenantId) return null;
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant?.name;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-6">
          <Calculator className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            {editingBill ? 'Editar' : 'Nova'} Conta de Energia Compartilhada
          </h2>
        </div>

        {/* Seleção de Grupos */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Selecionar Grupos para Edição</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEFAULT_ENERGY_GROUPS.map(group => (
              <label key={group.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedGroups.includes(group.id)}
                  onChange={(e) => handleGroupSelection(group.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="font-medium">{group.name}</span>
              </label>
            ))}
          </div>
        </div>

        {selectedGroups.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Selecione pelo menos um grupo para começar</p>
          </div>
        )}

        {selectedGroups.length > 0 && (
          <>
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mês
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione o mês</option>
                  {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ano
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="2020"
                  max="2030"
                />
              </div>
            </div>

            {/* Grupos Selecionados */}
            {filteredGroupBills.map((group) => (
              <div key={group.groupId} className="border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{group.groupName}</h3>
                  <button
                    onClick={() => importFromPreviousMonth(group.groupId)}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Importar Mês Anterior
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Total do Grupo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={group.totalGroupValue}
                      onChange={(e) => handleGroupChange(group.groupId, 'totalGroupValue', parseFloat(e.target.value) || 0)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Consumo Total do Grupo (kWh)
                    </label>
                    <input
                      type="number"
                      value={group.totalGroupConsumption}
                      onChange={(e) => handleGroupChange(group.groupId, 'totalGroupConsumption', parseInt(e.target.value) || 0)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Propriedades do Grupo */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Consumo Individual das Propriedades</h4>
                  {group.propertiesInGroup.map((property, index) => {
                    const tenantName = getTenantName(property.tenantId);
                    return (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="md:col-span-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Home className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-sm">{property.propertyName}</span>
                          </div>
                          {tenantName && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-4 h-4" />
                              <span>{tenantName}</span>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Consumo (kWh)
                          </label>
                          <input
                            type="number"
                            value={property.consumption}
                            onChange={(e) => handlePropertyChange(group.groupId, index, 'consumption', parseInt(e.target.value) || 0)}
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Valor Calculado
                          </label>
                          <div className="p-2 bg-white border rounded text-sm font-medium">
                            R$ {property.calculatedValue.toFixed(2)}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Status de Pagamento
                          </label>
                          <div className="flex gap-2">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`payment-${group.groupId}-${index}`}
                                value="paid"
                                checked={property.paymentStatus === 'paid'}
                                onChange={() => handlePropertyChange(group.groupId, index, 'paymentStatus', 'paid')}
                                className="mr-1"
                              />
                              <span className="text-xs">Pago</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`payment-${group.groupId}-${index}`}
                                value="pending"
                                checked={property.paymentStatus === 'pending'}
                                onChange={() => handlePropertyChange(group.groupId, index, 'paymentStatus', 'pending')}
                                className="mr-1"
                              />
                              <span className="text-xs">Pendente</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Botões de Ação */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={calculateDistribution}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Calculator className="w-4 h-4" />
                Calcular Distribuição
              </button>
              
              <button
                onClick={resetForm}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Grupos Selecionados
              </button>
              
              <button
                onClick={handleSave}
                disabled={!month}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Salvar Conta
              </button>
              
              <button
                onClick={onCancelEdit}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancelar
              </button>
            </div>

            {/* Resultados */}
            {filteredGroupBills.some(group => group.propertiesInGroup.some(prop => prop.calculatedValue > 0)) && (
              <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Resultados da Distribuição</h3>
                {filteredGroupBills.map(group => (
                  <div key={group.groupId} className="mb-6 last:mb-0">
                    <h4 className="font-medium text-green-700 mb-3">{group.groupName}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.propertiesInGroup
                        .filter(prop => prop.calculatedValue > 0)
                        .map((property, index) => {
                          const tenantName = getTenantName(property.tenantId);
                          return (
                            <div key={index} className="bg-white p-4 rounded-lg border border-green-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Home className="w-4 h-4 text-gray-600" />
                                <span className="font-medium text-sm">{property.propertyName}</span>
                              </div>
                              {tenantName && (
                                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                                  <User className="w-4 h-4" />
                                  <span>{tenantName}</span>
                                </div>
                              )}
                              <div className="space-y-1 text-sm">
                                <div>Consumo: {property.consumption} kWh</div>
                                <div className="font-semibold text-green-700">
                                  Valor: R$ {property.calculatedValue.toFixed(2)}
                                </div>
                                <div className="flex items-center gap-1">
                                  {property.paymentStatus === 'paid' ? (
                                    <>
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                      <span className="text-green-600 font-medium">Pago</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-4 h-4 text-red-600" />
                                      <span className="text-red-600 font-medium">Pendente</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
