import React, { useState, useEffect } from 'react';
import { OptimizedTenantManager } from './components/Tenants/OptimizedTenantManager';
import { Tenant, Property, EnergyBill, WaterBill } from './types';

// Dados de exemplo para demonstração
const sampleProperties: Property[] = [
  {
    id: 'prop1',
    name: 'Apartamento 101 - Rua das Flores, 123',
    address: 'Rua das Flores, 123, Apt 101',
    type: 'apartment',
    rent: 1200,
    expenses: 300,
    owner: 'João Silva'
  },
  {
    id: 'prop2', 
    name: 'Casa 25 - Avenida Central, 456',
    address: 'Avenida Central, 456',
    type: 'house',
    rent: 2500,
    expenses: 400,
    owner: 'Maria Santos'
  }
];

const sampleTenants: Tenant[] = [
  {
    id: 'tenant1',
    name: 'Carlos da Silva',
    cpf: '123.456.789-10',
    phone: '(11) 98765-4321',
    email: 'carlos@email.com',
    propertyId: 'prop1',
    status: 'active',
    rentValue: 1200,
    entryDate: '2024-01-15',
    exitDate: null
  },
  {
    id: 'tenant2',
    name: 'Ana Souza', 
    cpf: '987.654.321-09',
    phone: '(11) 91234-5678',
    email: 'ana@email.com',
    propertyId: 'prop2',
    status: 'active',
    rentValue: 2500,
    entryDate: '2024-02-01',
    exitDate: null
  },
  {
    id: 'tenant3',
    name: 'Pedro Santos',
    cpf: '000.000.000-00', // CPF inválido - não deve mostrar botão
    phone: '(11) 95555-5555',
    email: 'pedro@email.com',
    propertyId: 'prop1',
    status: 'active',
    rentValue: 800,
    entryDate: '2024-03-01',
    exitDate: null
  },
  {
    id: 'tenant4',
    name: 'Lucia Oliveira',
    cpf: '456.789.123-45',
    phone: '(11) 94444-4444',
    email: 'lucia@email.com',
    propertyId: '', // Sem propriedade vinculada - não deve mostrar botão
    status: 'active',
    rentValue: 0,
    entryDate: '2024-04-01',
    exitDate: null
  }
];

const sampleEnergyBills: EnergyBill[] = [
  {
    id: 'energy1',
    date: '2024-08-01',
    totalGroupValue: 850.50,
    propertiesInGroup: [
      {
        propertyId: 'prop1',
        energyUnitName: 'UC 123456789',
        proportionalValue: 425.25,
        isPaid: true,
        dueDate: '2024-08-15'
      },
      {
        propertyId: 'prop2', 
        energyUnitName: 'UC 987654321',
        proportionalValue: 425.25,
        isPaid: false,
        dueDate: '2024-08-15'
      }
    ]
  }
];

const sampleWaterBills: WaterBill[] = [
  {
    id: 'water1',
    date: '2024-08-01',
    totalGroupValue: 320.75,
    propertiesInGroup: [
      {
        propertyId: 'prop1',
        waterUnitName: 'Hidrômetro 111222',
        proportionalValue: 160.38,
        isPaid: true,
        dueDate: '2024-08-20'
      },
      {
        propertyId: 'prop2',
        waterUnitName: 'Hidrômetro 333444', 
        proportionalValue: 160.37,
        isPaid: false,
        dueDate: '2024-08-20'
      }
    ]
  }
];

const AppSimple: React.FC = () => {
  const [showValues, setShowValues] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>(sampleTenants);

  const handleAddTenant = (newTenant: Omit<Tenant, 'id'>) => {
    const tenant: Tenant = {
      ...newTenant,
      id: `tenant${Date.now()}`
    };
    setTenants(prev => [...prev, tenant]);
  };

  const handleUpdateTenant = (id: string, updates: Partial<Tenant>) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleDeleteTenant = (id: string) => {
    setTenants(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SISMOBI - Demo Botão Consumo</h1>
              <p className="text-sm text-gray-600">Sistema de Gestão Imobiliária</p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showValues}
                  onChange={(e) => setShowValues(e.target.checked)}
                  className="mr-2"
                />
                Mostrar Valores
              </label>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">📋 Gestão de Inquilinos</h2>
          <p className="text-gray-600">
            Teste do botão "📋 Consumo" - Visible apenas para inquilinos com:
            <br />
            • Status = Ativo ✅
            • Propriedade vinculada ✅  
            • CPF válido (≠ "000.000.000-00") ✅
          </p>
        </div>
        
        <OptimizedTenantManager
          tenants={tenants}
          properties={sampleProperties}
          energyBills={sampleEnergyBills}
          waterBills={sampleWaterBills}
          showValues={showValues}
          onAddTenant={handleAddTenant}
          onUpdateTenant={handleUpdateTenant}
          onDeleteTenant={handleDeleteTenant}
        />
      </main>
    </div>
  );
};

export default AppSimple;