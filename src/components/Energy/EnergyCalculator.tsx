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
  {
    groupId: 'group1',
    groupName: 'Grupo 1 (802-Ca)',
    properties: ['802- Ca 01 Manoel', '802- Ca 02 Jaqueline', '802- Ca 03 Vago']
  },
  {
    groupId: 'group2', 
    groupName: 'Grupo 2 (802-Ca)',
    properties: ['802- Ca 04 Vago', '802- Ca 05 Vago', '802- Ca 06 Vago']
  },
  {
    groupId: 'group3',
    groupName: 'Grupo 3 (117-Ca)',
    properties: ['117- Ca 01 Vago', '117- Ca 02 Vago', '117- Ca 03 Vago']
  }
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

  // Initialize or update group bills when editing or creating new
  useEffect(() => {
    if (editingBill) {
      setMonth(editingBill.month);
      setYear(editingBill.year);
      
      // Map the existing group bills and ensure IDs are properly set
      const mappedGroupBills = mapPropertyNamesToIds(editingBill.groupBills);
      setGroupBills(mappedGroupBills);
      
      // Select groups that have data
      const groupsWithData = mappedGroupBills
        .filter(gb => gb.totalGroupValue > 0 || gb.totalGroupConsumption > 0)
        .map(gb => gb.groupId);
      setSelectedGroups(groupsWithData);
    } else {
      // Initialize with default structure for new bills
      const initialGroupBills = DEFAULT_ENERGY_GROUPS.map(group => ({
        groupId: group.groupId,
        groupName: group.groupName,
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

  const handleGroupSelection = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedGroups(prev => [...prev, groupId]);
    } else {
      setSelectedGroups(prev => prev.filter(id => id !== groupId));
    }
  };

  const handleGroupValueChange = (groupId: string, field: 'totalGroupValue' | 'totalGroupConsumption', value: number) => {
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

  const calculateDistribution = (groupId: string) => {
    const group = groupBills.find(g => g.groupId === groupId);
    if (!group) return;

    const result = distributeEnergyGroupBill(group);
    
    setGroupBills(prev => prev.map(g => 
      g.groupId === groupId 
        ? { ...g, propertiesInGroup: result.propertiesInGroup }
        : g
    ));
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

    if (!previousBill) return;

    const previousGroup = previousBill.groupBills.find(g => g.groupId === groupId);
    if (!previousGroup) return;

    setGroupBills(prev => prev.map(group => 
      group.groupId === groupId 
        ? {
            ...group,
            propertiesInGroup: group.propertiesInGroup.map(prop => {
              const previousProp = previousGroup.propertiesInGroup.find(p => p.propertyName === prop.propertyName);
              return previousProp ? { ...prop, consumption: previousProp.consumption } : prop;
            })
          }
        : group
    ));
  };

  const handleSave = () => {
    if (!month) return;

    const filteredGroupBills = groupBills.filter(group => 
      selectedGroups.includes(group.groupId)
    );

    const newBill: EnergyBill = {
      id: editingBill?.id || Date.now().toString(),
      month,
      year,
      groupBills: filteredGroupBills,
      createdAt: editingBill?.createdAt || new Date(),
      updatedAt: new Date()
    };

    onSaveEnergyBill(newBill);
    
    if (!editingBill) {
      setMonth('');
      setSelectedGroups([]);
      setGroupBills(DEFAULT_ENERGY_GROUPS.map(group => ({
        groupId: group.groupId,
        groupName: group.groupName,
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
      })));
    }
  };

  const handleReset = () => {
    setGroupBills(prev => prev.map(group => 
      selectedGroups.includes(group.groupId)
        ? {
            ...group,
            totalGroupValue: 0,
            totalGroupConsumption: 0,
            propertiesInGroup: group.propertiesInGroup.map(prop => ({
              ...prop,
              consumption: 0,
              value: 0,
              paymentStatus: 'pending' as const
            }))
          }
        : group
    ));
  };

  const filteredGroupBills = groupBills.filter(group => 
    selectedGroups.includes(group.groupId)
  );

  const canSave = month && selectedGroups.length > 0 && filteredGroupBills.some(group => 
    group.totalGroupValue > 0 && group.totalGroupConsumption > 0
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-6">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            {editingBill ? 'Editar Conta de Energia' : 'Calculadora de Energia Compartilhada'}
          </h2>
        </div>

        {/* Seleção de Grupos */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Selecionar Grupos para Edição</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEFAULT_ENERGY_GROUPS.map(group => (
              <label key={group.groupId} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedGroups.includes(group.groupId)}
                  onChange={(e) => handleGroupSelection(group.groupId, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">{group.groupName}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Campos básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione o mês</option>
              {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Grupos selecionados */}
        {filteredGroupBills.map(group => (
          <div key={group.groupId} className="mb-8 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">{group.groupName}</h3>
              <button
                onClick={() => importFromPreviousMonth(group.groupId)}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                <Upload className="w-4 h-4" />
                Importar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Total do Grupo (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={group.totalGroupValue}
                  onChange={(e) => handleGroupValueChange(group.groupId, 'totalGroupValue', parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consumo Total do Grupo (kWh)
                </label>
                <input
                  type="number"
                  value={group.totalGroupConsumption}
                  onChange={(e) => handleGroupValueChange(group.groupId, 'totalGroupConsumption', parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Consumo por Propriedade</h4>
              {group.propertiesInGroup.map((property, index) => {
                const linkedProperty = properties.find(p => p.id === property.propertyId);
                const tenant = property.tenantId ? tenants.find(t => t.id === property.tenantId) : undefined;
                
                return (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 bg-gray-50 rounded-md">
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Home className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">{property.propertyName}</span>
                      </div>
                      {tenant && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-500" />
                          <span className="text-xs text-blue-600">{tenant.name}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Consumo (kWh)</label>
                      <input
                        type="number"
                        value={property.consumption}
                        onChange={(e) => handlePropertyChange(group.groupId, index, 'consumption', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Valor (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={property.value}
                        readOnly
                        className="w-full p-2 text-sm border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Status Pagamento</label>
                      <div className="flex gap-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`payment-${group.groupId}-${index}`}
                            value="paid"
                            checked={property.paymentStatus === 'paid'}
                            onChange={(e) => handlePropertyChange(group.groupId, index, 'paymentStatus', e.target.value)}
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
                            onChange={(e) => handlePropertyChange(group.groupId, index, 'paymentStatus', e.target.value)}
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

            <div className="mt-4 flex justify-center">
              <button
                onClick={() => calculateDistribution(group.groupId)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Calculator className="w-4 h-4" />
                Calcular Distribuição
              </button>
            </div>

            {/* Resultados */}
            {group.propertiesInGroup.some(p => p.value > 0) && (
              <div className="mt-4 p-3 bg-green-50 rounded-md">
                <h5 className="font-medium text-green-800 mb-2">Resultados da Distribuição</h5>
                <div className="space-y-2">
                  {group.propertiesInGroup.map((property, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{property.propertyName}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          property.paymentStatus === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {property.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                      <span className="font-medium text-green-700">
                        R$ {property.value.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Botões de ação */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {editingBill ? 'Atualizar' : 'Salvar'} Conta
          </button>
          
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <Trash2 className="w-4 h-4" />
            Limpar Dados
          </button>

          {editingBill && (
            <button
              onClick={onCancelEdit}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <XCircle className="w-4 h-4" />
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};